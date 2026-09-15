import logging
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()
logger = logging.getLogger(__name__)

class MoveekNewsScraper:
    def __init__(self, base_url: str = "https://moveek.com"):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
        }

    def fetch_articles(self, limit: int = 15) -> list[dict]:
        """
        Fetches cinema news, film reviews, and movie articles from Moveek (/tin-tuc/).
        """
        list_url = f"{self.base_url}/tin-tuc/"
        logger.info(f"[MOVEEK_NEWS_SCRAPER] Fetching cinema articles from: {list_url}")
        try:
            res = requests.get(list_url, headers=self.headers, verify=False, timeout=12)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, "html.parser")

            article_links = []
            seen = set()
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "/bai-viet/" in href and href not in seen:
                    seen.add(href)
                    full_link = f"{self.base_url}{href}" if href.startswith("/") else href
                    article_links.append(full_link)
                    if len(article_links) >= limit:
                        break

            logger.info(f"[MOVEEK_NEWS_SCRAPER] Found {len(article_links)} article links to process.")
            articles = []

            for link in article_links:
                try:
                    art = self._fetch_single_article(link)
                    if art:
                        articles.append(art)
                except Exception as e:
                    logger.warning(f"[MOVEEK_NEWS_SCRAPER] Failed to fetch article at {link}: {e}")

            logger.info(f"[MOVEEK_NEWS_SCRAPER] Successfully fetched {len(articles)} cinema articles.")
            return articles

        except Exception as e:
            logger.error(f"[MOVEEK_NEWS_SCRAPER] Error fetching Moveek news: {e}")
            return []

    def _fetch_single_article(self, url: str) -> dict | None:
        res = requests.get(url, headers=self.headers, verify=False, timeout=10)
        if res.status_code != 200:
            return None

        soup = BeautifulSoup(res.text, "html.parser")
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else ""
        if not title or len(title) < 5:
            return None

        lead_el = soup.select_one(".lead, .description, .summary, p.font-weight-bold")
        short_desc = lead_el.get_text(strip=True) if lead_el else ""

        content_el = soup.select_one("article, .article-content, .post-content, .entry-content, #content")
        content = str(content_el) if content_el else ""

        if not short_desc and content_el:
            paras = [p.get_text(strip=True) for p in content_el.find_all("p") if len(p.get_text(strip=True)) > 20]
            short_desc = paras[0] if paras else title

        if not short_desc:
            short_desc = title

        if len(short_desc) > 480:
            short_desc = short_desc[:477] + "..."

        meta_img = soup.find("meta", property="og:image")
        poster_url = meta_img.get("content") if meta_img else None

        return {
            "title": title[:250],
            "short_description": short_desc,
            "content": content or short_desc,
            "poster_url": poster_url,
            "source": "Moveek",
            "source_url": url,
        }
