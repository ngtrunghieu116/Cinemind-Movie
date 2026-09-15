import re
import json
import logging
import urllib3
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

from datetime import date, datetime

class NccMovieScraper:
    def __init__(self, base_url: str = "https://chieuphimquocgia.com.vn"):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

    def fetch_movies(self) -> list[dict]:
        """
        Fetches all movies (both now showing, upcoming, and festival/showtime movies) 
        from NCC website homepage and /movies schedule page.
        """
        urls = [f"{self.base_url}/", f"{self.base_url}/movies"]
        all_movies = []
        seen_ids = set()

        for url in urls:
            logger.info(f"[NCC_MOVIE_SCRAPER] Fetching movie list from: {url}")
            try:
                res = requests.get(url, headers=self.headers, timeout=15, verify=False)
                res.raise_for_status()
                parsed = self._parse_movies_from_rsc(res.text)
                for m in parsed:
                    sid = m.get("source_id")
                    if sid and sid not in seen_ids:
                        seen_ids.add(sid)
                        all_movies.append(m)
            except Exception as e:
                logger.error(f"[NCC_MOVIE_SCRAPER] Error fetching NCC movies from {url}: {e}")

        logger.info(f"[NCC_MOVIE_SCRAPER] Aggregated {len(all_movies)} unique movies across NCC pages.")
        return all_movies

    def fetch_upcoming_movies(self) -> list[dict]:
        """
        Fetches only upcoming movies (phim sắp chiếu) from NCC website.
        """
        all_movies = self.fetch_movies()
        upcoming = [m for m in all_movies if m.get("status") == "COMING_SOON"]
        logger.info(f"[NCC_MOVIE_SCRAPER] Filtered {len(upcoming)} upcoming movies from NCC.")
        return upcoming

    def fetch_now_showing_movies(self) -> list[dict]:
        """
        Fetches only now showing movies (phim đang chiếu) from NCC website.
        """
        all_movies = self.fetch_movies()
        now_showing = [m for m in all_movies if m.get("status") == "NOW_SHOWING"]
        logger.info(f"[NCC_MOVIE_SCRAPER] Filtered {len(now_showing)} now showing movies from NCC.")
        return now_showing

    def _parse_movies_from_rsc(self, html: str) -> list[dict]:
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
            logger.warning("[NCC_MOVIE_SCRAPER] Empty RSC payload.")
            return []

        movies = []
        seen_ids = set()

        # Parse movies (now showing, upcoming, showTimes)
        for key in ["movies", "upcomingMovies", "showTimes"]:
            array_str = self._extract_array_by_key(full_payload, key)
            if not array_str:
                continue
            try:
                items = json.loads(array_str)
                default_status = "COMING_SOON" if key == "upcomingMovies" else "NOW_SHOWING"
                for item in items:
                    if "lstFilm" in item and isinstance(item["lstFilm"], list):
                        for film in item["lstFilm"]:
                            self._add_film(film, seen_ids, movies, default_status="NOW_SHOWING")
                    else:
                        self._add_film(item, seen_ids, movies, default_status=default_status)
            except Exception as e:
                logger.warning(f"[NCC_MOVIE_SCRAPER] Failed to parse array for key '{key}': {e}")

        # Extract and link high-resolution horizontal banner URLs from homepage sliders/banners
        for b_key in ["sliders", "banners", "lstBanner", "lstSlider", "homeBanners"]:
            b_array_str = self._extract_array_by_key(full_payload, b_key)
            if not b_array_str:
                continue
            try:
                b_items = json.loads(b_array_str)
                for b_item in b_items:
                    b_film_id = str(b_item.get("FilmId") or b_item.get("Id") or "").strip()
                    b_film_name = str(b_item.get("FilmName") or b_item.get("Title") or "").strip().lower()
                    b_img = str(b_item.get("ImageUrl") or b_item.get("BannerUrl") or b_item.get("ImageLandscape") or "").strip()

                    if b_img and b_img.startswith("/"):
                        b_img = f"{self.base_url}{b_img}"

                    if b_img:
                        for m in movies:
                            # Match by source_id or title
                            if (b_film_id and m.get("source_id") == f"ncc:{b_film_id}") or \
                               (b_film_name and b_film_name in m.get("title", "").lower()):
                                m["banner_path"] = b_img
                                logger.debug(f"[NCC_MOVIE_SCRAPER] Attached horizontal banner URL for '{m.get('title')}': {b_img}")
            except Exception as e:
                logger.debug(f"[NCC_MOVIE_SCRAPER] Note on slider/banner parsing key '{b_key}': {e}")

        logger.info(f"[NCC_MOVIE_SCRAPER] Successfully parsed {len(movies)} unique movies from NCC.")
        return movies

    def _add_film(self, item: dict, seen_ids: set, movies: list, default_status: str = "NOW_SHOWING"):
        m_id = item.get("Id")
        if not m_id or m_id in seen_ids:
            return
        movie_dto = self._map_to_dto(item, default_status=default_status)
        if movie_dto:
            seen_ids.add(m_id)
            movies.append(movie_dto)

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

    def _map_to_dto(self, item: dict, default_status: str = "NOW_SHOWING") -> dict:
        film_name = item.get("FilmName") or ""
        title = str(film_name).strip()
        if not title:
            return None

        m_id = str(item.get("Id") or "")
        duration = item.get("Duration") or 110
        try:
            duration = int(duration)
        except Exception:
            duration = 110

        img_url = str(item.get("ImageUrl") or item.get("PosterUrl") or "")
        if img_url and img_url.startswith("/"):
            img_url = f"{self.base_url}{img_url}"

        banner_url = str(item.get("BannerUrl") or item.get("ImageLarge") or item.get("ImageLandscape") or "")
        if banner_url and banner_url.startswith("/"):
            banner_url = f"{self.base_url}{banner_url}"
        elif not banner_url:
            banner_url = img_url

        # Clean title suffix like C18/T13/T16/K/P
        clean_title = re.sub(r'[-_\s]+(C18|T18|18\+|C16|T16|16\+|C13|T13|13\+|K|P)\s*$', '', title, flags=re.IGNORECASE)

        title_en = str(item.get("FilmNameEn") or "").strip() or clean_title.strip()
        description = str(item.get("Introduction") or "").strip() or f"Phim {clean_title}"
        director = str(item.get("Director") or "Đang cập nhật").strip() or "Đang cập nhật"
        actors = str(item.get("Actors") or "Đang cập nhật").strip() or "Đang cập nhật"
        premiered = str(item.get("PremieredDay") or "2026-09-01")[:10]

        # Determine status based on premiered date and default_status
        status = default_status
        try:
            rel_date = datetime.strptime(premiered, "%Y-%m-%d").date()
            if rel_date > date.today():
                status = "COMING_SOON"
            elif default_status == "COMING_SOON":
                status = "COMING_SOON"
            else:
                status = "NOW_SHOWING"
        except Exception:
            status = default_status

        raw_category = item.get("Category")

        return {
            "source_id": f"ncc:{m_id}",
            "title": clean_title.strip(),
            "title_en": title_en,
            "description": description,
            "director": director,
            "actors": actors,
            "duration": duration,
            "release_date": premiered,
            "poster_path": img_url,
            "banner_path": banner_url,
            "trailer_url": item.get("VideoUrl"),
            "status": status,
            "category": str(raw_category).strip() if raw_category else None,
            "source": "NCC",
        }

