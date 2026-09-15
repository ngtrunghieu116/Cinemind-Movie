import logging
import re
import urllib3
import requests
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

class MoveekReviewScraper:
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

    def _clean_title(self, raw_title: str) -> str:
        t = raw_title.replace("–", "-").replace("—", "-")
        t = re.sub(r'-[A-Z0-9]+', '', t)
        t = re.sub(r'\(.*?\)', '', t)
        return t.strip()

    def fetch_community_reviews(self, movie_title: str, movie_url: str = None) -> list[dict]:
        """
        Extracts real audience reviews and critic reviews from Moveek.
        Accepts optional direct movie_url to bypass search.
        """
        logger.info(f"[MOVEEK] Searching real reviews for: {movie_title}")
        reviews = []
        target_url = movie_url

        try:
            if not target_url:
                cleaned_title = self._clean_title(movie_title)
                search_url = f"{self.base_url}/tim-kiem/?q={requests.utils.quote(cleaned_title)}"
                res = requests.get(search_url, headers=self.headers, verify=False, timeout=8)
                
                if res.status_code != 200:
                    logger.warning(f"[MOVEEK] Search returned status {res.status_code} for '{cleaned_title}'")
                    return []

                soup = BeautifulSoup(res.text, "html.parser")
                matched_link = None
                q_tokens = [w.lower() for w in re.findall(r'\w+', cleaned_title) if len(w) > 1]

                for card in soup.select("div.card.card-xs"):
                    h3 = card.select_one("h3")
                    link = card.find("a", href=lambda h: h and "/phim/" in h)
                    if h3 and link:
                        card_title = h3.get_text(strip=True).lower()
                        c_tokens = [w.lower() for w in re.findall(r'\w+', card_title)]
                        overlap = set(q_tokens).intersection(set(c_tokens))
                        
                        min_overlap = 1 if len(q_tokens) == 1 else 2
                        if (cleaned_title.lower() in card_title or 
                            card_title in cleaned_title.lower() or 
                            len(overlap) >= min_overlap):
                            matched_link = link.get("href")
                            logger.info(f"[MOVEEK] Matched '{cleaned_title}' with '{h3.get_text(strip=True)}' ({matched_link})")
                            break

                if not matched_link:
                    logger.info(f"[MOVEEK] No matched movie card on Moveek for '{cleaned_title}'")
                    return []

                target_url = f"{self.base_url}{matched_link}" if not matched_link.startswith("http") else matched_link

            detail_res = requests.get(target_url, headers=self.headers, verify=False, timeout=8)
            if detail_res.status_code != 200:
                return []

            detail_soup = BeautifulSoup(detail_res.text, "html.parser")

            # 1. Real audience user reviews (.card.card-sm.article)
            user_review_cards = detail_soup.select(".card.card-sm.article")
            for rcard in user_review_cards:
                author_el = rcard.select_one("h4.card-title a")
                rating_el = rcard.select_one("h4.card-title span")
                content_el = rcard.select_one(".review-content")

                author = author_el.get_text(strip=True) if author_el else "Khán giả rạp"
                comment = content_el.get_text(strip=True) if content_el else ""

                if not comment or len(comment) < 3:
                    continue

                score = 5
                if rating_el:
                    digits = re.findall(r'\d+', rating_el.get_text())
                    if digits:
                        score = max(1, min(5, int(round(int(digits[0]) / 2.0))))

                reviews.append({
                    "author": author,
                    "rating": score,
                    "comment": comment[:980],
                    "source": "MOVEEK",
                    "external_id": None
                })

            # 2. Critic reviews (.card.card-article)
            article_cards = detail_soup.select(".card.card-article")
            for acard in article_cards:
                title_el = acard.select_one("h4.card-title a, a[href*='/bai-viet/']")
                if not title_el:
                    continue

                article_title = title_el.get_text(strip=True)
                article_href = title_el.get("href", "")
                critic_author = "Nhà phê bình Moveek"
                critic_comment = f"Đánh giá chuyên môn: {article_title}"

                # Try fetching deep article content
                if article_href:
                    try:
                        art_url = f"{self.base_url}{article_href}" if not article_href.startswith("http") else article_href
                        art_res = requests.get(art_url, headers=self.headers, verify=False, timeout=5)
                        if art_res.status_code == 200:
                            asoup = BeautifulSoup(art_res.text, "html.parser")
                            # Author extraction
                            auth_tag = asoup.select_one(".author, .user-name")
                            if auth_tag and 2 < len(auth_tag.get_text(strip=True)) < 30:
                                critic_author = f"{auth_tag.get_text(strip=True)} (Moveek)"
                            else:
                                critic_author = "Nhà phê bình Moveek"

                            # Body paragraphs
                            body_el = asoup.select_one(".article-content, article, .card-body")
                            if body_el:
                                paras = [
                                    p.get_text(" ", strip=True) 
                                    for p in body_el.find_all("p") 
                                    if len(p.get_text(strip=True)) > 40 and "·" not in p.get_text()
                                ]
                                if paras:
                                    clean_body = ' '.join(paras[:2])
                                    if article_title and article_title.strip():
                                        critic_comment = f"[{article_title.strip()}]\n{clean_body}"[:980]
                                    else:
                                        critic_comment = clean_body[:980]
                    except Exception:
                        pass

                reviews.append({
                    "author": critic_author,
                    "rating": 5,
                    "comment": critic_comment,
                    "source": "MOVEEK_CRITIC",
                    "external_id": None
                })

        except Exception as e:
            logger.warning(f"[MOVEEK] Error scraping reviews for '{movie_title}': {e}")

        logger.info(f"[MOVEEK] Extracted {len(reviews)} real reviews for '{movie_title}'")
        return reviews
