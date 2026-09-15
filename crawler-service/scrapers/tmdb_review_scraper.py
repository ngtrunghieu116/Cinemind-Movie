import logging
import requests

logger = logging.getLogger(__name__)

class TmdbReviewScraper:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.themoviedb.org/3"
        self.headers = {
            "Accept": "application/json",
            "User-Agent": "CineMindCrawler/1.0",
        }
        self.is_available = True

    def search_movie(self, title: str, title_en: str = None) -> int | None:
        """
        Searches for movie on TMDb and returns TMDb ID.
        Tries title_en first for better accuracy with international movies, then title.
        """
        if not self.api_key or not self.is_available:
            return None

        queries = [q for q in [title_en, title] if q and q.strip()]

        for query in queries:
            try:
                # Clean up query (remove 2D/3D or age ratings like C18/T13)
                clean_q = query.split("-")[0].strip()
                clean_q = clean_q.split("(")[0].strip()

                url = f"{self.base_url}/search/movie"
                params = {
                    "api_key": self.api_key,
                    "query": clean_q,
                    "include_adult": "false",
                }
                res = requests.get(url, headers=self.headers, params=params, timeout=3)
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    if results:
                        tmdb_id = results[0]["id"]
                        logger.info(f"[TMDB] Matched '{query}' -> TMDb ID {tmdb_id} ({results[0].get('title')})")
                        return tmdb_id
            except Exception as e:
                logger.warning(f"[TMDB] Search unreachable for '{query}': {e}. Disabling TMDb for this session.")
                self.is_available = False
                break

        return None

    def fetch_reviews(self, tmdb_id: int) -> list[dict]:
        """
        Fetches real reviews for given TMDb ID.
        """
        if not tmdb_id:
            return []

        url = f"{self.base_url}/movie/{tmdb_id}/reviews"
        params = {"api_key": self.api_key}

        try:
            res = requests.get(url, headers=self.headers, params=params, timeout=10)
            if res.status_code != 200:
                logger.warning(f"[TMDB] Reviews API returned {res.status_code} for ID {tmdb_id}")
                return []

            data = res.json()
            results = data.get("results", [])
            reviews = []

            for r in results:
                author = r.get("author", "Khán giả TMDb").strip()
                content = r.get("content", "").strip()
                if not content:
                    continue

                # rating can be in author_details.rating (0-10)
                author_details = r.get("author_details", {})
                raw_rating = author_details.get("rating")
                
                if raw_rating is not None:
                    # Convert 10-scale to 5-scale
                    rating_5 = max(1, min(5, int(round(raw_rating / 2.0))))
                else:
                    # Default neutral-positive rating if unspecified
                    rating_5 = 4

                # Truncate content to fit DB column (max 1000 characters)
                truncated_comment = content[:980] + ("..." if len(content) > 980 else "")

                reviews.append({
                    "author": author,
                    "rating": rating_5,
                    "comment": truncated_comment,
                    "source": "TMDB",
                    "external_id": r.get("id"),
                })

            logger.info(f"[TMDB] Fetched {len(reviews)} reviews for TMDb ID {tmdb_id}")
            return reviews

        except Exception as e:
            logger.error(f"[TMDB] Failed to fetch reviews for TMDb ID {tmdb_id}: {e}")
            return []
