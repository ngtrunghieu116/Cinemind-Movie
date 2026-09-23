import re
import json
import logging
import urllib3
import requests
from typing import List, Dict, Any, Optional

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

class NccBannerScraper:
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

    def fetch_homepage_banners(self) -> List[Dict[str, Any]]:
        """
        Scrapes all hero slider banners directly from NCC homepage RSC payload.
        Returns a list of parsed banner dictionaries with film links, IDs, and image URLs.
        """
        url = f"{self.base_url}/"
        logger.info(f"[NCC_BANNER_SCRAPER] Fetching homepage banners from: {url}")
        
        try:
            res = requests.get(url, headers=self.headers, timeout=15, verify=False)
            res.raise_for_status()
            banners = self._parse_banners_from_html(res.text)
            logger.info(f"[NCC_BANNER_SCRAPER] Successfully extracted {len(banners)} banner items from NCC homepage.")
            return banners
        except Exception as e:
            logger.error(f"[NCC_BANNER_SCRAPER] Error fetching banners from {url}: {e}", exc_info=True)
            return []

    def fetch_banner_for_movie_url(self, movie_url: str) -> Optional[Dict[str, Any]]:
        """
        Fetches a specific NCC movie page and extracts its poster/banner image URL.
        """
        if not movie_url.startswith("http"):
            movie_url = f"{self.base_url}/{movie_url.lstrip('/')}"
        
        logger.info(f"[NCC_BANNER_SCRAPER] Fetching movie banner from URL: {movie_url}")
        try:
            res = requests.get(movie_url, headers=self.headers, timeout=15, verify=False)
            res.raise_for_status()
            
            # Extract film id from url if any
            m_id_match = re.search(r'/movies/(\d+)', movie_url)
            ncc_film_id = m_id_match.group(1) if m_id_match else None
            
            # Find image URLs in HTML
            # Check meta og:image first
            og_match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', res.text, re.IGNORECASE)
            if not og_match:
                og_match = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', res.text, re.IGNORECASE)
            
            img_url = og_match.group(1) if og_match else None
            
            # If not found, look for banner images in payload
            if not img_url:
                banners = self._parse_banners_from_html(res.text)
                if banners:
                    img_url = banners[0].get("banner_url")

            # Extract title from title tag
            title_match = re.search(r'<title>(.*?)</title>', res.text, re.IGNORECASE)
            title = title_match.group(1).split("-")[0].strip() if title_match else None

            if img_url:
                if img_url.startswith("/"):
                    img_url = f"{self.base_url}{img_url}"
                return {
                    "ncc_film_id": ncc_film_id,
                    "target_href": movie_url,
                    "banner_url": img_url,
                    "title": title
                }
            return None
        except Exception as e:
            logger.error(f"[NCC_BANNER_SCRAPER] Failed to fetch movie banner from {movie_url}: {e}")
            return None

    def _parse_banners_from_html(self, html: str) -> List[Dict[str, Any]]:
        """
        Extracts Next.js React Server Components (RSC) payload and parses banner objects.
        """
        rsc_pattern = re.compile(r'self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)', re.DOTALL)
        matches = rsc_pattern.findall(html)

        chunks = []
        for _, chunk in matches:
            try:
                chunks.append(json.loads(f'"{chunk}"'))
            except Exception:
                chunks.append(chunk)

        full_payload = "".join(chunks)
        if not full_payload:
            logger.warning("[NCC_BANNER_SCRAPER] Empty RSC payload on NCC page.")
            return []

        banners = []
        seen_banner_ids = set()

        # Regex match banner JSON objects containing ImgSrc or ImgSrc2
        obj_pattern = re.compile(r'\{[^{}]*"(?:ImgSrc|ImgSrc2)"[^{}]*\}')
        for match in obj_pattern.finditer(full_payload):
            try:
                obj = json.loads(match.group(0))
                b_id = obj.get("Id")
                if b_id and b_id in seen_banner_ids:
                    continue

                img_src = obj.get("ImgSrc2") or obj.get("ImgSrc") or obj.get("ImgSrc3")
                if not img_src:
                    continue

                if img_src.startswith("/"):
                    img_src = f"{self.base_url}{img_src}"

                href = obj.get("Href2") or obj.get("Href") or ""
                if href and href.startswith("/"):
                    href = f"{self.base_url}{href}"

                # Extract NCC Film ID if the link points to a movie
                film_id = None
                if href:
                    film_match = re.search(r'/movies/(\d+)', href)
                    if film_match:
                        film_id = film_match.group(1)

                banner_data = {
                    "banner_id": b_id,
                    "banner_url": img_src,
                    "mobile_banner_url": obj.get("ImgSrc3") or obj.get("ImgSrc"),
                    "target_href": href,
                    "ncc_film_id": film_id,
                    "title": obj.get("Title") or obj.get("FilmName") or obj.get("Name"),
                    "is_active": obj.get("IsActive", True)
                }

                if b_id:
                    seen_banner_ids.add(b_id)
                banners.append(banner_data)
            except Exception as e:
                logger.debug(f"[NCC_BANNER_SCRAPER] Skipped malformed banner chunk: {e}")

        return banners
