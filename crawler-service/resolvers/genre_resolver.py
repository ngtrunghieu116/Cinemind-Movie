import logging
import re
from sqlalchemy import text

logger = logging.getLogger(__name__)

GENRE_SYNONYMS = {
    "action": "Hành động",
    "hành động": "Hành động",
    "comedy": "Hài",
    "hài": "Hài",
    "hài hước": "Hài",
    "drama": "Tâm lý",
    "tâm lý": "Tâm lý",
    "romance": "Tình cảm",
    "tình cảm": "Tình cảm",
    "lãng mạn": "Tình cảm",
    "horror": "Kinh dị",
    "kinh dị": "Kinh dị",
    "ma": "Kinh dị",
    "animation": "Hoạt hình",
    "hoạt hình": "Hoạt hình",
    "anime": "Hoạt hình",
    "adventure": "Phiêu lưu",
    "phiêu lưu": "Phiêu lưu",
    "sci-fi": "Khoa học viễn tưởng",
    "science fiction": "Khoa học viễn tưởng",
    "khoa học viễn tưởng": "Khoa học viễn tưởng",
    "viễn tưởng": "Khoa học viễn tưởng",
    "history": "Lịch sử",
    "lịch sử": "Lịch sử",
    "documentary": "Tài liệu",
    "tài liệu": "Tài liệu",
    "cổ trang": "Cổ trang",
    "dã sử": "Dã sử",
    "family": "Gia đình",
    "gia đình": "Gia đình",
    "fantasy": "Thần thoại",
    "thần thoại": "Thần thoại",
    "huyền bí": "Bí ẩn",
    "mystery": "Bí ẩn",
    "bí ẩn": "Bí ẩn",
    "trinh thám": "Bí ẩn",
    "crime": "Tội phạm",
    "tội phạm": "Tội phạm",
    "hình sự": "Tội phạm",
    "thriller": "Giật gân",
    "giật gân": "Giật gân",
    "war": "Chiến tranh",
    "chiến tranh": "Chiến tranh",
    "music": "Âm nhạc",
    "musical": "Âm nhạc",
    "âm nhạc": "Âm nhạc",
}

KEYWORD_HEURISTICS = [
    (r"\b(kinh dị|ma|quỷ|bùa yêu|ác tượng|trấn yểm|oan hồn|bóng ma|vùng đất quỷ dữ)\b", "Kinh dị"),
    (r"\b(hài|hài hước|vui nhộn|hóm hỉnh|dở khóc dở cười|lên hương)\b", "Hài"),
    (r"\b(hoạt hình|anime|shrek|mèo mang mũ|bò sữa bay)\b", "Hoạt hình"),
    (r"\b(khoa học viễn tưởng|viễn tưởng|mandalorian|dune|hành tinh cát|vũ trụ)\b", "Khoa học viễn tưởng"),
    (r"\b(hành động|chiến đấu|võ thuật|avengers|street fighter|người máy|chiến binh)\b", "Hành động"),
    (r"\b(tình cảm|lãng mạn|yêu|tạm biệt|cuộc tình|thông gia)\b", "Tình cảm"),
    (r"\b(tâm lý|cuộc đời|gia đình|chị chị em em|nghỉ hè|nghỉ hưu|mẹ mìn)\b", "Tâm lý"),
    (r"\b(bí ẩn|trinh thám|kỳ án|án mạng|thần thám)\b", "Bí ẩn"),
    (r"\b(phiêu lưu|truy tìm|hành trình|khám phá|bát tiên|lưu ly đăng)\b", "Phiêu lưu"),
    (r"\b(cổ trang|triều đại|hoàng cung|kiếm hiệp|dã sử)\b", "Cổ trang"),
]

class GenreResolver:
    def __init__(self):
        pass

    def resolve(self, session, raw_genres: str = None, title: str = "", description: str = "") -> list[int]:
        """
        Resolves raw genre strings, title or description into valid database genre IDs.
        Auto-inserts genre into `genres` table if not already present.
        """
        names_to_lookup = set()

        if raw_genres and raw_genres.strip() and raw_genres.lower() != "none":
            # Split by comma, slash, dash
            parts = re.split(r"[,/|;]+", raw_genres)
            for p in parts:
                clean_p = p.strip()
                if not clean_p:
                    continue
                lower_p = clean_p.lower()
                mapped = GENRE_SYNONYMS.get(lower_p)
                if mapped:
                    names_to_lookup.add(mapped)
                else:
                    # Normalize: capitalize first letter
                    norm_name = clean_p[0].upper() + clean_p[1:].lower() if len(clean_p) > 1 else clean_p.upper()
                    names_to_lookup.add(norm_name)

        # If no genres resolved, try keyword heuristics from title & description
        if not names_to_lookup:
            combined_text = f"{title} {description}".lower()
            for pattern, g_name in KEYWORD_HEURISTICS:
                if re.search(pattern, combined_text, re.IGNORECASE):
                    names_to_lookup.add(g_name)

        # Fallback if still empty
        if not names_to_lookup:
            names_to_lookup = {"Hành động", "Tâm lý"}

        # Find or create in DB
        genre_ids = []
        for name in names_to_lookup:
            gid = self._get_or_create_genre(session, name)
            if gid:
                genre_ids.append(gid)

        return genre_ids

    def _get_or_create_genre(self, session, name: str) -> int:
        name_clean = name[:50].strip()
        # Find existing
        res = session.execute(
            text("SELECT id FROM genres WHERE LOWER(name) = LOWER(:name) LIMIT 1"),
            {"name": name_clean}
        ).fetchone()

        if res:
            return res[0]

        # Insert new genre
        try:
            insert_res = session.execute(
                text("INSERT INTO genres (name, description) VALUES (:name, :desc)"),
                {"name": name_clean, "desc": f"Thể loại phim {name_clean}"}
            )
            session.flush()
            # Fetch inserted id
            new_id = session.execute(
                text("SELECT id FROM genres WHERE name = :name LIMIT 1"),
                {"name": name_clean}
            ).scalar()
            logger.info(f"[GENRE_RESOLVER] Created new genre: '{name_clean}' (id={new_id})")
            return new_id
        except Exception as e:
            logger.warning(f"[GENRE_RESOLVER] Could not create genre '{name_clean}': {e}")
            res = session.execute(
                text("SELECT id FROM genres WHERE LOWER(name) = LOWER(:name) LIMIT 1"),
                {"name": name_clean}
            ).fetchone()
            return res[0] if res else None

    def link_movie_genres(self, session, movie_id: int, genre_ids: list[int]):
        """
        Links movie_id with genre_ids in `movie_genres` table without removing existing ones.
        """
        if not movie_id or not genre_ids:
            return

        for gid in genre_ids:
            try:
                session.execute(
                    text("INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (:mid, :gid)"),
                    {"mid": movie_id, "gid": gid}
                )
            except Exception as e:
                logger.debug(f"[GENRE_RESOLVER] Could not link movie {movie_id} with genre {gid}: {e}")

    def relink_movie_genres(self, session, movie_id: int, genre_ids: list[int]):
        """
        Clears existing genres for movie_id and inserts freshly resolved genre_ids into `movie_genres`.
        """
        if not movie_id or not genre_ids:
            return

        try:
            session.execute(
                text("DELETE FROM movie_genres WHERE movie_id = :mid"),
                {"mid": movie_id}
            )
            for gid in genre_ids:
                session.execute(
                    text("INSERT IGNORE INTO movie_genres (movie_id, genre_id) VALUES (:mid, :gid)"),
                    {"mid": movie_id, "gid": gid}
                )
        except Exception as e:
            logger.warning(f"[GENRE_RESOLVER] Error relinking movie {movie_id} with genres: {e}")

    def backfill_all_genres(self, session, ncc_cat_map: dict = None) -> int:
        """
        Scans ALL movies in `movies`, resolves genres based on NCC category, title, description,
        and refreshes `movie_genres`.
        """
        ncc_cat_map = ncc_cat_map or {}
        query = text("SELECT id, title, description, source_id FROM movies ORDER BY id ASC")
        all_movies = session.execute(query).fetchall()
        if not all_movies:
            logger.info("[GENRE_RESOLVER] No movies found in database.")
            return 0

        logger.info(f"[GENRE_RESOLVER] Classifying & updating genres for all {len(all_movies)} movies...")
        count = 0
        for row in all_movies:
            m_id, m_title, m_desc, m_sid = row[0], row[1], row[2] or "", row[3] or ""
            raw_category = ncc_cat_map.get(m_sid) or ncc_cat_map.get(m_title)
            genre_ids = self.resolve(session, raw_genres=raw_category, title=m_title, description=m_desc)
            self.relink_movie_genres(session, m_id, genre_ids)
            count += 1

        session.commit()
        logger.info(f"[GENRE_RESOLVER] Successfully updated genres for {count} movies.")
        return count

    def backfill_missing_genres(self, session) -> int:
        """
        Scans all movies without genres in `movie_genres` and fills them.
        """
        query = text("""
            SELECT m.id, m.title, m.description 
            FROM movies m 
            LEFT JOIN movie_genres mg ON m.id = mg.movie_id 
            WHERE mg.genre_id IS NULL
        """)
        missing = session.execute(query).fetchall()
        if not missing:
            logger.info("[GENRE_RESOLVER] All movies already have genres.")
            return 0

        logger.info(f"[GENRE_RESOLVER] Backfilling genres for {len(missing)} movies...")
        count = 0
        for row in missing:
            m_id, m_title, m_desc = row[0], row[1], row[2] or ""
            genre_ids = self.resolve(session, raw_genres=None, title=m_title, description=m_desc)
            self.link_movie_genres(session, m_id, genre_ids)
            count += 1

        session.commit()
        logger.info(f"[GENRE_RESOLVER] Successfully backfilled genres for {count} movies.")
        return count
