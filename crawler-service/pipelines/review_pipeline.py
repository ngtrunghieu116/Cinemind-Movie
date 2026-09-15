import re
import hashlib
import logging
from datetime import datetime, date
from sqlalchemy import text
from db import SessionLocal

logger = logging.getLogger(__name__)

# Pre-computed BCrypt hash of "Audience@123" for virtual user password
DUMMY_BCRYPT_PASSWORD = "$2a$10$7Z2v8Zc9cK0u8oFvK9P2eeL0v9O3e7g7fG1j6qP5v0m7oM3oK2sOe"

class ReviewPipeline:
    def process_and_save(self, movie_id: int, reviews: list[dict]) -> int:
        """
        Processes real reviews and saves them into the 'reviews' table,
        auto-provisioning virtual user accounts as needed to fulfill foreign key constraints.
        """
        if not reviews or not movie_id:
            return 0

        saved_count = 0
        session = SessionLocal()

        try:
            # Verify movie exists
            movie = session.execute(
                text("SELECT id, title FROM movies WHERE id = :movie_id"),
                {"movie_id": movie_id}
            ).fetchone()

            if not movie:
                logger.warning(f"[REVIEW_PIPELINE] Movie ID {movie_id} does not exist in database.")
                return 0

            for r in reviews:
                author = r.get("author", "Khán giả ẩn danh").strip()
                comment = r.get("comment", "").strip()
                rating = int(r.get("rating", 5))
                source = r.get("source", "EXTERNAL")

                if not comment or len(comment) < 3:
                    continue

                # Deduplicate: check if a review with this author or comment already exists for this movie
                existing_rev = session.execute(
                    text("""
                        SELECT id FROM reviews 
                        WHERE movie_id = :mid AND (external_author = :author OR comment = :comment)
                        LIMIT 1
                    """),
                    {"mid": movie_id, "author": author[:100], "comment": comment[:980]}
                ).fetchone()

                if existing_rev:
                    logger.debug(f"[REVIEW_PIPELINE] Review by '{author}' already exists for movie ID {movie_id}. Skipping.")
                    continue

                # Get or create a unique user for this author on this movie
                user_id = self._resolve_user_id(session, author, movie_id)

                # Insert review
                now = datetime.now()
                insert_stmt = text("""
                    INSERT INTO reviews (
                        user_id, movie_id, rating, comment, verified_purchase, 
                        status, source, external_author, created_at, updated_at
                    ) VALUES (
                        :user_id, :movie_id, :rating, :comment, 1, 
                        'PUBLISHED', :source, :author, :now, :now
                    )
                """)
                session.execute(insert_stmt, {
                    "user_id": user_id,
                    "movie_id": movie_id,
                    "rating": max(1, min(5, rating)),
                    "comment": comment[:980],
                    "source": source,
                    "author": author[:100],
                    "now": now
                })
                saved_count += 1
                logger.info(f"[REVIEW_PIPELINE] Saved review for movie '{movie[1]}' by '{author}' ({rating}★)")

            session.commit()
            logger.info(f"[REVIEW_PIPELINE] Committed {saved_count} reviews for movie ID {movie_id}.")

        except Exception as e:
            session.rollback()
            logger.error(f"[REVIEW_PIPELINE] Error saving reviews: {e}")
            raise e
        finally:
            session.close()

        return saved_count

    def _resolve_user_id(self, session, author: str, movie_id: int) -> int:
        """
        Finds or auto-creates a User that has NOT yet reviewed this movie,
        to satisfy uk_review_user_movie (user_id, movie_id).
        """
        clean_author = re.sub(r'[^a-zA-Z0-9_]', '', author.lower())
        if not clean_author:
            clean_author = "audience"

        clean_author = clean_author[:15]

        # Unique email based on author and hash
        author_hash = hashlib.md5(f"{author}_{movie_id}".encode()).hexdigest()[:6]
        base_email = f"rev_{clean_author}_{author_hash}@cinemind.vn"

        # Check if this user exists
        existing_user = session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": base_email}
        ).fetchone()

        if existing_user:
            # Check if this user already reviewed this movie
            has_reviewed = session.execute(
                text("SELECT id FROM reviews WHERE user_id = :uid AND movie_id = :mid"),
                {"uid": existing_user[0], "mid": movie_id}
            ).fetchone()
            if not has_reviewed:
                return existing_user[0]

        # Name formatting
        parts = author.split()
        if "Phê bình" in author or "Moveek" in author:
            first_name = "Moveek"
            last_name = "Phê bình"
        elif len(parts) > 1:
            first_name = parts[-1][:50]
            last_name = " ".join(parts[:-1])[:50]
        else:
            first_name = author[:50]
            last_name = "Khán giả"

        unique_email = f"rev_{clean_author}_{author_hash}_{datetime.now().strftime('%S%f')[:4]}@cinemind.vn"
        phone_suffix = str(abs(hash(unique_email)))[:8].zfill(8)
        phone = f"09{phone_suffix}"

        insert_user_stmt = text("""
            INSERT INTO users (
                email, password, first_name, last_name, phone, 
                date_of_birth, gender, role, status, email_verified, created_at
            ) VALUES (
                :email, :password, :first_name, :last_name, :phone, 
                '2000-01-01', 'MALE', 'USER', 'ACTIVE', 1, :now
            )
        """)
        now = datetime.now()
        session.execute(insert_user_stmt, {
            "email": unique_email,
            "password": DUMMY_BCRYPT_PASSWORD,
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "now": now
        })
        new_uid = session.execute(text("SELECT LAST_INSERT_ID()")).scalar()
        return new_uid
