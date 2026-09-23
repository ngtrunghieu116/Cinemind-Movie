import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from db import SessionLocal
from resolvers.movie_matcher import MovieMatcher

logger = logging.getLogger(__name__)

class BannerPipeline:
    def __init__(self):
        self.matcher = MovieMatcher()

    def process_and_save(self, banners: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Processes scraped banner items, resolves their corresponding movies,
        and updates the 'banner_path' field in the 'movies' table.
        """
        if not banners:
            logger.info("[BANNER_PIPELINE] No banners provided to process.")
            return {"total_banners": 0, "matched": 0, "updated": 0, "skipped": 0, "details": []}

        session = SessionLocal()
        updated_count = 0
        skipped_count = 0
        details = []

        try:
            for b in banners:
                banner_url = b.get("banner_url")
                if not banner_url:
                    continue

                ncc_film_id = b.get("ncc_film_id")
                target_href = b.get("target_href")
                title = b.get("title")

                # Match banner to movie
                match = self.matcher.find_movie(
                    session,
                    ncc_film_id=ncc_film_id,
                    target_href=target_href,
                    film_name=title
                )

                if match:
                    movie_id = match["movie_id"]
                    movie_title = match["title"]
                    current_banner = match.get("current_banner")

                    # Check if update is needed
                    if current_banner == banner_url:
                        logger.debug(f"[BANNER_PIPELINE] Movie #{movie_id} ('{movie_title}') already has this banner. Skipping.")
                        skipped_count += 1
                        details.append({
                            "movie_id": movie_id,
                            "title": movie_title,
                            "banner_url": banner_url,
                            "status": "UNCHANGED",
                            "match_type": match.get("match_type")
                        })
                    else:
                        update_stmt = text("UPDATE movies SET banner_path = :b_url WHERE id = :mid")
                        session.execute(update_stmt, {"b_url": banner_url, "mid": movie_id})
                        updated_count += 1
                        logger.info(f"[BANNER_PIPELINE] Updated banner for Movie #{movie_id} ('{movie_title}') -> {banner_url}")
                        details.append({
                            "movie_id": movie_id,
                            "title": movie_title,
                            "banner_url": banner_url,
                            "status": "UPDATED",
                            "match_type": match.get("match_type")
                        })
                else:
                    logger.warning(f"[BANNER_PIPELINE] Could not match banner to any movie: href='{target_href}', id='{ncc_film_id}', title='{title}'")
                    details.append({
                        "movie_id": None,
                        "title": title or "Unknown",
                        "banner_url": banner_url,
                        "status": "UNMATCHED",
                        "target_href": target_href
                    })

            session.commit()
            logger.info(f"[BANNER_PIPELINE] Batch banner process completed: {updated_count} updated, {skipped_count} unchanged, {len(banners) - updated_count - skipped_count} unmatched.")
            return {
                "total_banners": len(banners),
                "matched": updated_count + skipped_count,
                "updated": updated_count,
                "skipped": skipped_count,
                "details": details
            }
        except Exception as e:
            session.rollback()
            logger.error(f"[BANNER_PIPELINE] Error during banner pipeline execution: {e}", exc_info=True)
            return {"error": str(e), "total_banners": len(banners), "updated": updated_count}
        finally:
            session.close()

    def assign_banner_manually(
        self,
        banner_url: str,
        movie_id: Optional[int] = None,
        movie_title: Optional[str] = None,
        ncc_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Manually attaches a banner URL to a movie identified by movie_id, title, or NCC URL.
        """
        if not banner_url or not banner_url.strip():
            return {"status": "ERROR", "message": "Banner URL cannot be empty."}

        banner_url = banner_url.strip()
        session = SessionLocal()

        try:
            target_movie = None

            # 1. Directly by ID
            if movie_id:
                row = session.execute(
                    text("SELECT id, title, banner_path FROM movies WHERE id = :mid LIMIT 1"),
                    {"mid": movie_id}
                ).fetchone()
                if row:
                    target_movie = {"movie_id": row[0], "title": row[1], "match_type": "DIRECT_ID"}

            # 2. Or by ncc_url / movie_title via Matcher
            if not target_movie and (ncc_url or movie_title):
                target_movie = self.matcher.find_movie(
                    session,
                    target_href=ncc_url,
                    film_name=movie_title
                )

            if not target_movie:
                return {
                    "status": "NOT_FOUND",
                    "message": f"No movie found matching id={movie_id}, title='{movie_title}', url='{ncc_url}'"
                }

            mid = target_movie["movie_id"]
            m_title = target_movie["title"]

            update_stmt = text("UPDATE movies SET banner_path = :b_url WHERE id = :mid")
            session.execute(update_stmt, {"b_url": banner_url, "mid": mid})
            session.commit()

            logger.info(f"[BANNER_PIPELINE] Manually assigned banner to Movie #{mid} ('{m_title}') -> {banner_url}")
            return {
                "status": "SUCCESS",
                "movie_id": mid,
                "title": m_title,
                "banner_url": banner_url,
                "match_type": target_movie.get("match_type")
            }
        except Exception as e:
            session.rollback()
            logger.error(f"[BANNER_PIPELINE] Error in assign_banner_manually: {e}", exc_info=True)
            return {"status": "ERROR", "message": str(e)}
        finally:
            session.close()
