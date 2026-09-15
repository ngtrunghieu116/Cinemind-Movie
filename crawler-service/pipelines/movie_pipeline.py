import logging
from datetime import datetime, date, timedelta
from sqlalchemy import text
from db import SessionLocal
from resolvers.genre_resolver import GenreResolver
from resolvers.age_rating_resolver import AgeRatingResolver
from scrapers.ncc_movie_scraper import NccMovieScraper

logger = logging.getLogger(__name__)

class MoviePipeline:
    def __init__(self):
        self.genre_resolver = GenreResolver()
        self.age_rating_resolver = AgeRatingResolver()

    def process_and_save(self, movies: list[dict]) -> int:
        if not movies:
            return 0

        saved_count = 0
        updated_count = 0
        session = SessionLocal()

        try:
            for m in movies:
                source_id = m.get("source_id")
                title = m.get("title")
                if not title:
                    continue

                # Release date and end date
                try:
                    rel_date_raw = m.get("release_date")
                    if isinstance(rel_date_raw, date):
                        rel_date = rel_date_raw
                    elif isinstance(rel_date_raw, str) and len(rel_date_raw) >= 10:
                        rel_date = datetime.strptime(rel_date_raw[:10], "%Y-%m-%d").date()
                    else:
                        rel_date = date.today()
                except Exception:
                    rel_date = date.today()

                end_date = rel_date + timedelta(days=60)
                today = date.today()

                # Determine accurate status based on release date & crawler input
                status = m.get("status")
                if not status:
                    if rel_date > today:
                        status = "COMING_SOON"
                    elif rel_date <= today <= end_date:
                        status = "NOW_SHOWING"
                    else:
                        status = "ENDED"
                elif status == "NOW_SHOWING" and rel_date > today:
                    status = "COMING_SOON"

                source = m.get("source", "NCC")

                # Resolve age rating
                age_rating = self.age_rating_resolver.resolve(
                    title=title,
                    category=m.get("category"),
                    description=m.get("description", "")
                )

                # Check if movie already exists by source_id or title
                query = text("SELECT id, status, poster_path, banner_path, trailer_url FROM movies WHERE source_id = :sid OR title = :title LIMIT 1")
                existing = session.execute(query, {"sid": source_id, "title": title}).fetchone()

                if existing:
                    movie_id = existing[0]
                    curr_status = existing[1]
                    curr_poster = existing[2]
                    curr_banner = existing[3]
                    curr_trailer = existing[4]

                    # Update poster and banner: prefer new valid image over old default-poster
                    incoming_poster = m.get("poster_path")
                    if incoming_poster and "default-poster" not in incoming_poster:
                        new_poster = incoming_poster
                    elif curr_poster and "default-poster" not in curr_poster:
                        new_poster = curr_poster
                    else:
                        new_poster = incoming_poster or curr_poster

                    incoming_banner = m.get("banner_path")
                    if incoming_banner and "default-poster" not in incoming_banner:
                        new_banner = incoming_banner
                    elif curr_banner and "default-poster" not in curr_banner:
                        new_banner = curr_banner
                    else:
                        new_banner = incoming_banner or new_poster

                    new_trailer = m.get("trailer_url") or curr_trailer

                    update_stmt = text("""
                        UPDATE movies 
                        SET status = :st, 
                            release_date = :rel_date,
                            end_date = :end_date,
                            poster_path = COALESCE(NULLIF(:poster, ''), poster_path),
                            banner_path = COALESCE(NULLIF(:banner, ''), banner_path),
                            trailer_url = COALESCE(:trailer, trailer_url),
                            age_rating = :age_rating
                        WHERE id = :mid
                    """)
                    session.execute(update_stmt, {
                        "st": status,
                        "rel_date": rel_date,
                        "end_date": end_date,
                        "poster": new_poster[:255] if new_poster else None,
                        "banner": new_banner[:255] if new_banner else None,
                        "trailer": new_trailer[:500] if new_trailer else None,
                        "age_rating": age_rating,
                        "mid": movie_id
                    })

                    # Always ensure genres are linked
                    genre_ids = self.genre_resolver.resolve(
                        session,
                        raw_genres=m.get("category"),
                        title=title,
                        description=m.get("description", "")
                    )
                    self.genre_resolver.link_movie_genres(session, movie_id, genre_ids)
                    updated_count += 1
                    continue

                # Insert new movie
                insert_stmt = text("""
                    INSERT INTO movies (
                        title, title_en, description, director, actors, 
                        duration, release_date, end_date, poster_path, banner_path, 
                        trailer_url, age_rating, language, subtitle, source, source_id, status
                    ) VALUES (
                        :title, :title_en, :description, :director, :actors,
                        :duration, :release_date, :end_date, :poster_path, :banner_path,
                        :trailer_url, :age_rating, 'Tiếng Việt', 'Phụ đề Tiếng Anh', :source, :source_id, :status
                    )
                """)
                
                poster = m.get("poster_path") or "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"
                banner = m.get("banner_path") or poster

                session.execute(insert_stmt, {
                    "title": title[:200],
                    "title_en": m.get("title_en", title)[:200],
                    "description": m.get("description", title)[:10000],
                    "director": m.get("director", "Đang cập nhật")[:200],
                    "actors": m.get("actors", "Đang cập nhật")[:500],
                    "duration": m.get("duration", 120),
                    "release_date": rel_date,
                    "end_date": end_date,
                    "poster_path": poster[:255],
                    "banner_path": banner[:255],
                    "trailer_url": m.get("trailer_url", "")[:500] if m.get("trailer_url") else None,
                    "age_rating": age_rating,
                    "source": source[:50],
                    "source_id": source_id[:100] if source_id else None,
                    "status": status
                })
                session.flush()

                # Get the newly inserted movie id
                new_movie_id = session.execute(
                    text("SELECT id FROM movies WHERE (source_id = :sid OR title = :title) ORDER BY id DESC LIMIT 1"),
                    {"sid": source_id, "title": title}
                ).scalar()

                if new_movie_id:
                    genre_ids = self.genre_resolver.resolve(
                        session,
                        raw_genres=m.get("category"),
                        title=title,
                        description=m.get("description", "")
                    )
                    self.genre_resolver.link_movie_genres(session, new_movie_id, genre_ids)

                saved_count += 1
                logger.info(f"[MOVIE_PIPELINE] Saved new movie: '{title}' ({source_id}) - Status: {status} - AgeRating: {age_rating}")

            session.commit()
            logger.info(f"[MOVIE_PIPELINE] Finished. Saved {saved_count} new movies, updated {updated_count} existing movies.")

        except Exception as e:
            session.rollback()
            logger.error(f"[MOVIE_PIPELINE] Error saving movies: {e}")
            raise e
        finally:
            session.close()

        return saved_count

    def classify_all_movies(self) -> dict:
        """
        Scans ALL movies in the database, automatically processes and updates:
        1. Genres -> saved into `movie_genres` table
        2. Age Rating -> saved into `movies.age_rating` column
        """
        session = SessionLocal()
        stats = {
            "total_processed": 0,
            "age_ratings": {"P": 0, "T13": 0, "T16": 0, "T18": 0},
            "genres_updated": 0
        }

        try:
            # 1. Fetch live NCC category mapping
            ncc_cat_map = {}
            try:
                ncc_scraper = NccMovieScraper()
                ncc_movies = ncc_scraper.fetch_movies()
                for nm in ncc_movies:
                    if nm.get("source_id"):
                        ncc_cat_map[nm["source_id"]] = nm.get("category")
                    if nm.get("title"):
                        ncc_cat_map[nm["title"]] = nm.get("category")
                logger.info(f"[MOVIE_PIPELINE] Built NCC category map with {len(ncc_cat_map)} entries.")
            except Exception as e:
                logger.warning(f"[MOVIE_PIPELINE] Could not fetch live NCC categories (will use DB text): {e}")

            # 2. Query all movies in database
            movies = session.execute(
                text("SELECT id, title, title_en, description, source, source_id FROM movies ORDER BY id ASC")
            ).fetchall()

            if not movies:
                logger.warning("[MOVIE_PIPELINE] No movies found in database to classify.")
                return stats

            logger.info(f"[MOVIE_PIPELINE] Classifying genres and age ratings for {len(movies)} movies...")

            update_movie_rating_stmt = text("UPDATE movies SET age_rating = :rating WHERE id = :mid")

            for m in movies:
                mid, title, title_en, description, source, source_id = m[0], m[1], m[2], m[3] or "", m[4], m[5]
                raw_cat = ncc_cat_map.get(source_id) or ncc_cat_map.get(title)

                # A. Resolve and update Age Rating
                rating = self.age_rating_resolver.resolve(title=title, category=raw_cat, description=description)
                session.execute(update_movie_rating_stmt, {"rating": rating, "mid": mid})
                if rating in stats["age_ratings"]:
                    stats["age_ratings"][rating] += 1
                else:
                    stats["age_ratings"][rating] = 1

                # B. Resolve and update Genres
                genre_ids = self.genre_resolver.resolve(session, raw_genres=raw_cat, title=title, description=description)
                self.genre_resolver.relink_movie_genres(session, mid, genre_ids)

                stats["total_processed"] += 1
                stats["genres_updated"] += 1

            session.commit()
            logger.info(
                f"[MOVIE_PIPELINE] Successfully classified {stats['total_processed']} movies. "
                f"Age ratings: {stats['age_ratings']}"
            )
            return stats

        except Exception as e:
            session.rollback()
            logger.error(f"[MOVIE_PIPELINE] Error classifying movies: {e}")
            raise e
        finally:
            session.close()

    def backfill_genres(self) -> int:
        """
        Backfills genres and age_rating for all movies in MySQL.
        """
        stats = self.classify_all_movies()
        return stats.get("total_processed", 0)
