import re
import logging
import unicodedata
from difflib import SequenceMatcher
from typing import Optional, Tuple, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class MovieMatcher:
    """
    Intelligent movie resolver that matches scraped banner items or user-provided
    film titles/URLs to existing movie records in the database.
    """

    @staticmethod
    def remove_accents(input_str: str) -> str:
        """Removes Vietnamese tone marks and accents for loose matching."""
        if not input_str:
            return ""
        nfkd = unicodedata.normalize('NFKD', input_str)
        without_accents = "".join([c for c in nfkd if not unicodedata.combining(c)])
        # Replace 'đ' and 'Đ'
        return without_accents.replace('đ', 'd').replace('Đ', 'D')

    @classmethod
    def clean_title(cls, title: str) -> str:
        """
        Cleans and normalizes a movie title by removing classification tags,
        projection formats, and extra punctuation.
        Example: 'TÀU BUÔN NGƯỜI - T18 (2D)' -> 'tau buon nguoi'
        """
        if not title:
            return ""
        
        t = title.strip()
        # Remove common cinema classification suffixes (-T18, -T16, -T13, -P, -K, -C18, -C16)
        t = re.sub(r'[-–]\s*(?:T\d+|C\d+|P|K)\b', '', t, flags=re.IGNORECASE)
        # Remove projection tags like (2D), (3D), (Lồng tiếng), (Phụ đề), (IMAX), etc.
        t = re.sub(r'\((?:2D|3D|4DX|IMAX|LỒNG TIẾNG|PHỤ ĐỀ|LTT|TM|LT|PĐ|VIETSUB|THUYẾT MINH)[^)]*\)', '', t, flags=re.IGNORECASE)
        # Remove non-alphanumeric punctuation except whitespace
        t = re.sub(r'[:;,."\'\-–!_?]', ' ', t)
        # Collapse multiple spaces
        t = re.sub(r'\s+', ' ', t).strip()
        return t.lower()

    def find_movie(
        self,
        session: Session,
        ncc_film_id: Optional[str] = None,
        target_href: Optional[str] = None,
        film_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Attempts to locate a movie record using a multi-tier matching strategy:
        1. NCC Source ID matching (ncc:{id})
        2. Target URL parsing (extract ID from /movies/{id})
        3. Exact title matching (case-insensitive & cleaned)
        4. Fuzzy title matching against active movies in DB
        """
        # --- Strategy 1: Match by direct ncc_film_id ---
        if ncc_film_id:
            sid = f"ncc:{str(ncc_film_id).strip()}"
            row = session.execute(
                text("SELECT id, title, title_en, poster_path, banner_path FROM movies WHERE source_id = :sid LIMIT 1"),
                {"sid": sid}
            ).fetchone()
            if row:
                logger.info(f"[MOVIE_MATCHER] Matched by source_id '{sid}' -> Movie #{row[0]} ('{row[1]}')")
                return {
                    "movie_id": row[0],
                    "title": row[1],
                    "title_en": row[2],
                    "current_banner": row[4],
                    "match_type": "SOURCE_ID"
                }

        # --- Strategy 2: Match by target_href URL ---
        if target_href:
            m_match = re.search(r'/movies/(\d+)', target_href)
            if m_match:
                extracted_id = m_match.group(1)
                sid = f"ncc:{extracted_id}"
                row = session.execute(
                    text("SELECT id, title, title_en, poster_path, banner_path FROM movies WHERE source_id = :sid LIMIT 1"),
                    {"sid": sid}
                ).fetchone()
                if row:
                    logger.info(f"[MOVIE_MATCHER] Matched by extracted URL ID '{sid}' -> Movie #{row[0]} ('{row[1]}')")
                    return {
                        "movie_id": row[0],
                        "title": row[1],
                        "title_en": row[2],
                        "current_banner": row[4],
                        "match_type": "URL_ID"
                    }

        # --- Strategy 3: Match by film_name ---
        if film_name and len(film_name.strip()) >= 2:
            cleaned_search = self.clean_title(film_name)
            unaccented_search = self.remove_accents(cleaned_search)

            # 3a. Exact search in DB
            row = session.execute(
                text("SELECT id, title, title_en, poster_path, banner_path FROM movies WHERE LOWER(title) = :t OR LOWER(title_en) = :t LIMIT 1"),
                {"t": film_name.strip().lower()}
            ).fetchone()
            if row:
                logger.info(f"[MOVIE_MATCHER] Matched by exact title '{film_name}' -> Movie #{row[0]} ('{row[1]}')")
                return {
                    "movie_id": row[0],
                    "title": row[1],
                    "title_en": row[2],
                    "current_banner": row[4],
                    "match_type": "EXACT_TITLE"
                }

            # 3b. Scan recent/active movies for cleaned and fuzzy match
            all_movies = session.execute(
                text("SELECT id, title, title_en, poster_path, banner_path FROM movies ORDER BY id DESC LIMIT 200")
            ).fetchall()

            best_match = None
            best_score = 0.0

            for m in all_movies:
                m_id, m_title, m_title_en, _, m_banner = m
                c_title = self.clean_title(m_title or "")
                c_title_en = self.clean_title(m_title_en or "")

                # Direct cleaned equality
                if cleaned_search and (cleaned_search == c_title or cleaned_search == c_title_en):
                    logger.info(f"[MOVIE_MATCHER] Matched by cleaned title '{cleaned_search}' -> Movie #{m_id} ('{m_title}')")
                    return {
                        "movie_id": m_id,
                        "title": m_title,
                        "title_en": m_title_en,
                        "current_banner": m_banner,
                        "match_type": "CLEANED_TITLE"
                    }

                # Unaccented equality
                unaccented_db = self.remove_accents(c_title)
                if unaccented_search and unaccented_search == unaccented_db:
                    logger.info(f"[MOVIE_MATCHER] Matched by unaccented title '{unaccented_search}' -> Movie #{m_id} ('{m_title}')")
                    return {
                        "movie_id": m_id,
                        "title": m_title,
                        "title_en": m_title_en,
                        "current_banner": m_banner,
                        "match_type": "UNACCENTED_TITLE"
                    }

                # Substring containment
                if (len(cleaned_search) >= 5 and (cleaned_search in c_title or c_title in cleaned_search)) or \
                   (len(unaccented_search) >= 5 and (unaccented_search in unaccented_db or unaccented_db in unaccented_search)):
                    score = 0.85
                    if score > best_score:
                        best_score = score
                        best_match = {
                            "movie_id": m_id,
                            "title": m_title,
                            "title_en": m_title_en,
                            "current_banner": m_banner,
                            "match_type": "SUBSTRING"
                        }
                    continue

                # Fuzzy SequenceMatcher
                ratio_vi = SequenceMatcher(None, unaccented_search, unaccented_db).ratio()
                ratio_en = SequenceMatcher(None, unaccented_search, self.remove_accents(c_title_en)).ratio() if c_title_en else 0.0
                ratio = max(ratio_vi, ratio_en)

                if ratio > best_score and ratio >= 0.75:
                    best_score = ratio
                    best_match = {
                        "movie_id": m_id,
                        "title": m_title,
                        "title_en": m_title_en,
                        "current_banner": m_banner,
                        "match_type": f"FUZZY ({int(ratio*100)}%)"
                    }

            if best_match:
                logger.info(f"[MOVIE_MATCHER] Matched '{film_name}' by {best_match['match_type']} -> Movie #{best_match['movie_id']} ('{best_match['title']}')")
                return best_match

        logger.debug(f"[MOVIE_MATCHER] No movie matched for ncc_id='{ncc_film_id}', href='{target_href}', name='{film_name}'")
        return None
