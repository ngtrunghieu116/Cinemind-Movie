import logging
import re
import urllib3
import requests
from bs4 import BeautifulSoup
from datetime import datetime, date

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

class MoveekMovieScraper:
    def __init__(self):
        self.base_url = "https://moveek.com"
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
        }

    def _extract_poster_url(self, img) -> str | None:
        """
        Extracts the highest-resolution poster URL from Moveek's lazy-loaded img tag.
        Handles data-srcset, data-src, and standard src while ignoring placeholder no-poster images.
        """
        if not img:
            return None

        # 1. Try parsing data-srcset for the highest resolution image (tall or card_2x)
        srcset = img.get("data-srcset") or ""
        if srcset:
            parts = [p.strip().split()[0] for p in srcset.split(",") if p.strip()]
            for p in reversed(parts):
                if p and "no-poster" not in p:
                    return f"{self.base_url}{p}" if p.startswith("/") else p

        # 2. Try data-src
        data_src = img.get("data-src") or ""
        if data_src and "no-poster" not in data_src:
            return f"{self.base_url}{data_src}" if data_src.startswith("/") else data_src

        # 3. Fallback to src if not a placeholder
        src = img.get("src") or ""
        if src and "no-poster" not in src:
            return f"{self.base_url}{src}" if src.startswith("/") else src

        return None

    def fetch_past_movies(self, max_pages: int = 1) -> list[dict]:
        """
        Fetches past Vietnamese movies from Moveek (/phim-viet-nam/) with status 'ENDED'.
        """
        logger.info(f"[MOVEEK_MOVIE_SCRAPER] Fetching past movies from /phim-viet-nam/ (pages: {max_pages})")
        movies = []
        seen_titles = set()

        for page in range(1, max_pages + 1):
            url = f"{self.base_url}/phim-viet-nam/?page={page}"
            try:
                res = requests.get(url, headers=self.headers, verify=False, timeout=10)
                if res.status_code != 200:
                    continue

                soup = BeautifulSoup(res.text, "html.parser")
                cards = soup.select("div.card.card-xs, .card")

                for c in cards:
                    h3 = c.select_one("h3, h4")
                    link = c.find("a", href=lambda h: h and "/phim/" in h)
                    img = c.select_one("img")

                    if not (h3 and link):
                        continue

                    title = h3.get_text(strip=True)
                    if not title or title in seen_titles:
                        continue
                    seen_titles.add(title)

                    href = link.get("href")
                    movie_url = f"{self.base_url}{href}" if not href.startswith("http") else href
                    poster = self._extract_poster_url(img)

                    # Extract slug from href
                    slug_match = re.search(r'/phim/([^/]+)/?', href)
                    source_id = f"moveek_{slug_match.group(1)}" if slug_match else f"moveek_{abs(hash(title))}"

                    poster_url = poster or "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"

                    movies.append({
                        "title": title,
                        "title_en": title,
                        "description": f"Phim điện ảnh Việt Nam '{title}' từng được công chiếu tại các cụm rạp trên toàn quốc.",
                        "director": "Đang cập nhật",
                        "actors": "Đang cập nhật",
                        "duration": 115,
                        "release_date": "2024-01-01",
                        "poster_path": poster_url,
                        "banner_path": poster_url,
                        "trailer_url": None,
                        "source": "MOVEEK",
                        "source_id": source_id,
                        "source_url": movie_url,
                        "status": "ENDED"
                    })

            except Exception as e:
                logger.error(f"[MOVEEK_MOVIE_SCRAPER] Error on page {page}: {e}")

        logger.info(f"[MOVEEK_MOVIE_SCRAPER] Fetched {len(movies)} past movies from Moveek.")
        return movies

    def fetch_upcoming_movies(self, max_pages: int = 2) -> list[dict]:
        """
        Fetches upcoming movies from Moveek (/sap-chieu/) with status 'COMING_SOON'.
        """
        logger.info(f"[MOVEEK_MOVIE_SCRAPER] Fetching upcoming movies from /sap-chieu/ (pages: {max_pages})")
        movies = []
        seen_titles = set()
        current_year = date.today().year

        for page in range(1, max_pages + 1):
            url = f"{self.base_url}/sap-chieu/" if page == 1 else f"{self.base_url}/sap-chieu/?page={page}"
            try:
                res = requests.get(url, headers=self.headers, verify=False, timeout=10)
                if res.status_code != 200:
                    continue

                soup = BeautifulSoup(res.text, "html.parser")
                cards = soup.select("div.card.card-xs, .card")

                for c in cards:
                    h3 = c.select_one("h3, h4")
                    link = c.find("a", href=lambda h: h and "/phim/" in h)
                    img = c.select_one("img")
                    date_el = c.select_one(".text-muted, .text-sm, .card-text")

                    if not (h3 and link):
                        continue

                    title = h3.get_text(strip=True)
                    if not title or title in seen_titles:
                        continue
                    seen_titles.add(title)

                    href = link.get("href")
                    movie_url = f"{self.base_url}{href}" if not href.startswith("http") else href
                    poster = self._extract_poster_url(img)

                    # Parse release date from text like "11/09" or "18/09/2026"
                    rel_date_str = f"{current_year}-10-01"
                    if date_el:
                        dt_text = date_el.get_text(strip=True)
                        m_date = re.search(r'(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{4}))?', dt_text)
                        if m_date:
                            day = int(m_date.group(1))
                            month = int(m_date.group(2))
                            year = int(m_date.group(3)) if m_date.group(3) else current_year
                            if year == current_year and month < date.today().month:
                                year += 1
                            rel_date_str = f"{year:04d}-{month:02d}-{day:02d}"

                    slug_match = re.search(r'/phim/([^/]+)/?', href)
                    source_id = f"moveek_{slug_match.group(1)}" if slug_match else f"moveek_{abs(hash(title))}"

                    poster_url = poster or "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"

                    movies.append({
                        "title": title,
                        "title_en": title,
                        "description": f"Phim điện ảnh '{title}' dự kiến khởi chiếu tại các rạp từ ngày {rel_date_str}.",
                        "director": "Đang cập nhật",
                        "actors": "Đang cập nhật",
                        "duration": 110,
                        "release_date": rel_date_str,
                        "poster_path": poster_url,
                        "banner_path": poster_url,
                        "trailer_url": None,
                        "source": "MOVEEK",
                        "source_id": source_id,
                        "source_url": movie_url,
                        "status": "COMING_SOON",
                        "category": None
                    })

            except Exception as e:
                logger.error(f"[MOVEEK_MOVIE_SCRAPER] Error on /sap-chieu/ page {page}: {e}")

        logger.info(f"[MOVEEK_MOVIE_SCRAPER] Fetched {len(movies)} upcoming movies from Moveek.")
        return movies

