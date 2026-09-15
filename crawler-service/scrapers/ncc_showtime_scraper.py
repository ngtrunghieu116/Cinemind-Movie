import re
import json
import logging
import urllib3
import requests
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

class NccShowtimeScraper:
    def __init__(self, base_url: str = "https://chieuphimquocgia.com.vn"):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
        }

    def fetch_showtimes(self) -> list[dict]:
        """
        Fetches showtimes (suất chiếu) from NCC website /movies page Next.js RSC payload.
        Falls back to homepage if /movies is empty.
        """
        urls = [f"{self.base_url}/movies", f"{self.base_url}/"]
        for url in urls:
            logger.info(f"[NCC_SHOWTIME_SCRAPER] Fetching showtimes from: {url}")
            try:
                res = requests.get(url, headers=self.headers, timeout=15, verify=False)
                res.raise_for_status()
                showtimes = self._parse_showtimes_from_rsc(res.text)
                if showtimes:
                    logger.info(f"[NCC_SHOWTIME_SCRAPER] Successfully parsed {len(showtimes)} showtimes from {url}")
                    return showtimes
            except Exception as e:
                logger.warning(f"[NCC_SHOWTIME_SCRAPER] Error fetching showtimes from {url}: {e}")

        logger.error("[NCC_SHOWTIME_SCRAPER] Could not fetch showtimes from any NCC URL.")
        return []

    def _parse_showtimes_from_rsc(self, html: str) -> list[dict]:
        rsc_pattern = re.compile(r'self\.__next_f\.push\(\[(\d+),"((?:[^"\\]|\\.)*)"\]\)', re.DOTALL)
        matches = rsc_pattern.findall(html)

        payload_parts = []
        for _, raw_chunk in matches:
            try:
                unescaped = json.loads(f'"{raw_chunk}"')
                payload_parts.append(unescaped)
            except Exception:
                payload_parts.append(raw_chunk)

        full_payload = "".join(payload_parts)
        if not full_payload:
            logger.warning("[NCC_SHOWTIME_SCRAPER] Empty RSC payload.")
            return []

        array_str = self._extract_array_by_key(full_payload, "showTimes")
        if not array_str:
            logger.warning("[NCC_SHOWTIME_SCRAPER] No 'showTimes' array found in RSC payload.")
            return []

        showtimes = []
        seen_session_ids = set()

        try:
            days = json.loads(array_str)
            for day in days:
                films = day.get("lstFilm", [])
                if not isinstance(films, list):
                    continue

                for film in films:
                    film_id = film.get("Id")
                    if not film_id:
                        continue
                    film_source_id = f"ncc:{film_id}"
                    raw_title = film.get("FilmName", "")
                    clean_title = self._clean_title(raw_title)

                    sessions = film.get("lstSession", [])
                    if not isinstance(sessions, list):
                        continue

                    for session in sessions:
                        session_id = session.get("Id")
                        if not session_id or session_id in seen_session_ids:
                            continue

                        # Check deleted
                        if session.get("Deleted", False):
                            continue

                        dto = self._map_session_to_dto(session, film_source_id, clean_title)
                        if dto:
                            seen_session_ids.add(session_id)
                            showtimes.append(dto)

        except Exception as e:
            logger.error(f"[NCC_SHOWTIME_SCRAPER] Error parsing showtimes: {e}")

        return showtimes

    def _clean_title(self, raw_title: str) -> str:
        if not raw_title:
            return ""
        # Remove age rating suffix (-T18, -T16, -T13, -P, -K, etc.)
        cleaned = re.sub(r'[-_\s]+(C18|T18|18\+|C16|T16|16\+|C13|T13|13\+|P|K)\s*$', '', raw_title, flags=re.IGNORECASE)
        # Remove audio/subtitle suffixes
        cleaned = re.sub(r'\s*\(PHỤ ĐỀ\)\s*$', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s*\(LỒNG TIẾNG\)\s*$', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s*\(LT\)\s*$', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\s*\(PĐ\)\s*$', '', cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    def _parse_price(self, raw_str: str, default_price: float) -> float:
        """
        Parses format like 'T:80000', 'V:85000', 'D:90000' or raw number.
        """
        if not raw_str:
            return default_price
        raw_str = str(raw_str).strip()
        if ":" in raw_str:
            raw_str = raw_str.split(":", 1)[1].strip()
        try:
            return float(raw_str)
        except Exception:
            return default_price

    def _map_session_to_dto(self, session: dict, film_source_id: str, film_title: str) -> dict | None:
        session_id = str(session.get("Id"))
        room_source_id = str(session.get("RoomId") or "")
        if not room_source_id:
            return None

        project_time_str = session.get("ProjectTime") or ""
        if not project_time_str:
            return None

        try:
            # e.g. "2026-09-05T13:00:00"
            start_dt = datetime.fromisoformat(project_time_str)
        except Exception:
            try:
                start_dt = datetime.strptime(project_time_str[:19], "%Y-%m-%d %H:%M:%S")
            except Exception:
                return None

        # Prices from NCC position tags:
        # Position 2 = Standard (T)
        # Position 3 = VIP (V)
        # Position 1 = Couple (D)
        price_std = self._parse_price(session.get("PriceOfPosition2"), 80000.0)
        price_vip = self._parse_price(session.get("PriceOfPosition3"), 90000.0)
        price_cpl = self._parse_price(session.get("PriceOfPosition1"), 120000.0)

        is_online = int(session.get("IsOnlineSelling", 1)) == 1

        return {
            "source_id": f"ncc:{session_id}",
            "film_source_id": film_source_id,
            "film_title": film_title,
            "room_source_id": room_source_id,
            "start_time": start_dt,
            "price_standard": price_std,
            "price_vip": price_vip,
            "price_couple": price_cpl,
            "is_online_selling": is_online,
        }

    def _extract_array_by_key(self, rsc_payload: str, key: str) -> str | None:
        search_key = f'"{key}":['
        start_idx = rsc_payload.find(search_key)
        if start_idx == -1:
            return None

        array_start = start_idx + len(search_key) - 1
        depth = 0
        in_string = False
        escaped = False

        for i in range(array_start, len(rsc_payload)):
            c = rsc_payload[i]
            if escaped:
                escaped = False
                continue
            if c == '\\':
                escaped = True
                continue
            if c == '"':
                in_string = not in_string
                continue
            if in_string:
                continue

            if c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return rsc_payload[array_start: i + 1]

        return None
