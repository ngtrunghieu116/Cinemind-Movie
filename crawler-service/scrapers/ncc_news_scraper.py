import re
import json
import logging
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings()
logger = logging.getLogger(__name__)

class NccNewsScraper:
    def __init__(self, base_url: str = "https://chieuphimquocgia.com.vn"):
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

    def fetch_articles(self) -> list[dict]:
        """
        Fetches official news and announcements from NCC website (/news-list).
        Extracts structured articles from Next.js RSC payload 'newsList' array.
        """
        url = f"{self.base_url}/news-list"
        logger.info(f"[NCC_NEWS_SCRAPER] Fetching news from: {url}")
        try:
            res = requests.get(url, headers=self.headers, verify=False, timeout=15)
            res.raise_for_status()
            return self._parse_rsc_news(res.text, url)
        except Exception as e:
            logger.error(f"[NCC_NEWS_SCRAPER] Error fetching NCC news: {e}")
            return []

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

    def _resolve_rsc_ref(self, payload: str, ref_id: str) -> str:
        marker = f"{ref_id}:T"
        idx = payload.find(marker)
        if idx == -1:
            return ""
        comma = payload.find(",", idx + len(marker))
        if comma == -1:
            return ""
        newline = payload.find("\n", comma + 1)
        if newline == -1:
            newline = len(payload)
        raw_text = payload[comma + 1:newline].strip()
        # Clean any trailing JSON array or object leakage
        json_cutoff = raw_text.find('[{"Id":')
        if json_cutoff != -1:
            raw_text = raw_text[:json_cutoff].strip()
        return raw_text

    def _parse_rsc_news(self, html: str, source_page_url: str) -> list[dict]:
        rsc_pattern = re.compile(r'self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)', re.DOTALL)
        matches = rsc_pattern.findall(html)

        # Collect raw payload
        fragments = []
        for match in matches:
            content_str = match[1]
            try:
                fragments.append(json.loads(f'"{content_str}"'))
            except Exception:
                fragments.append(content_str)

        full_payload = "".join(fragments)
        news_json = self._extract_array_by_key(full_payload, "newsList")

        articles = []
        if news_json:
            try:
                items = json.loads(news_json)
                for item in items:
                    title = (item.get("Title") or "").strip()
                    if not title or len(title) < 5:
                        continue

                    full_html = item.get("Full") or ""
                    # Check if full_html is an RSC string reference (e.g. "$1d")
                    if full_html.startswith("$") and len(full_html) <= 6:
                        resolved = self._resolve_rsc_ref(full_payload, full_html[1:])
                        if resolved:
                            full_html = resolved

                    # Extract short description
                    short_desc = (item.get("Short") or "").strip()
                    if not short_desc and full_html:
                        soup = BeautifulSoup(full_html, "html.parser")
                        paras = [p.get_text(strip=True) for p in soup.find_all(["p", "div"]) if len(p.get_text(strip=True)) > 20]
                        if paras:
                            short_desc = paras[0]
                        else:
                            short_desc = soup.get_text(strip=True)

                    if not short_desc:
                        short_desc = title

                    if len(short_desc) > 480:
                        short_desc = short_desc[:477] + "..."

                    # Image URL
                    poster_url = item.get("UrlImage")
                    if not poster_url and full_html:
                        img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', full_html)
                        if img_match:
                            poster_url = img_match.group(1)

                    if poster_url and poster_url.startswith("/"):
                        poster_url = f"{self.base_url}{poster_url}"

                    article_id = item.get("Id")
                    article_url = f"{self.base_url}/news-list#{article_id}" if article_id else source_page_url

                    articles.append({
                        "title": title,
                        "short_description": short_desc,
                        "content": full_html or short_desc,
                        "poster_url": poster_url,
                        "source": "NCC",
                        "source_url": article_url,
                    })
            except Exception as e:
                logger.error(f"[NCC_NEWS_SCRAPER] Error parsing newsList JSON: {e}")

        # Fallback to HTML if RSC parser found nothing
        if not articles:
            logger.warning("[NCC_NEWS_SCRAPER] No articles in newsList, attempting HTML fallback...")
            soup = BeautifulSoup(html, "html.parser")
            for item in soup.select("article, .news-item, .item-news"):
                title_el = item.select_one("h2, h3, h4, .title")
                desc_el = item.select_one("p, .desc, .summary")
                img_el = item.select_one("img")
                if title_el:
                    t = title_el.get_text(strip=True)
                    d = desc_el.get_text(strip=True) if desc_el else t
                    img_src = img_el.get("src") if img_el else None
                    if img_src and img_src.startswith("/"):
                        img_src = f"{self.base_url}{img_src}"
                    articles.append({
                        "title": t,
                        "short_description": d[:480],
                        "content": str(item),
                        "poster_url": img_src,
                        "source": "NCC",
                        "source_url": source_page_url,
                    })

        logger.info(f"[NCC_NEWS_SCRAPER] Found {len(articles)} authentic articles from NCC.")
        return articles
