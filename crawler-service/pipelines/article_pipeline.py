import logging
from datetime import datetime
from sqlalchemy import text
from db import SessionLocal

logger = logging.getLogger(__name__)

class ArticlePipeline:
    def process_and_save(self, articles: list[dict]) -> int:
        """
        Validates, deduplicates, and saves articles directly into MySQL 'articles' table.
        """
        if not articles:
            return 0

        saved_count = 0
        session = SessionLocal()

        try:
            for art in articles:
                title = art.get("title", "").strip()
                if not title or len(title) < 5:
                    continue

                source_url = art.get("source_url")
                short_desc = art.get("short_description", "")[:490]
                content = art.get("content", "")
                poster_url = art.get("poster_url")
                source = art.get("source", "UNKNOWN")

                # Check if article already exists by source_url or title
                query_check = text("""
                    SELECT id FROM articles 
                    WHERE (source_url IS NOT NULL AND source_url = :source_url)
                       OR title = :title
                    LIMIT 1
                """)
                existing = session.execute(query_check, {
                    "source_url": source_url,
                    "title": title
                }).fetchone()

                if existing:
                    logger.debug(f"[ARTICLE_PIPELINE] Skipped duplicate: {title[:40]}...")
                    continue

                now = datetime.now()
                insert_stmt = text("""
                    INSERT INTO articles (
                        title, short_description, content, poster_url, 
                        source, source_url, status, created_at, updated_at
                    ) VALUES (
                        :title, :short_desc, :content, :poster_url, 
                        :source, :source_url, 'PUBLISHED', :now, :now
                    )
                """)
                session.execute(insert_stmt, {
                    "title": title[:255],
                    "short_desc": short_desc,
                    "content": content,
                    "poster_url": poster_url[:1000] if poster_url else None,
                    "source": source,
                    "source_url": source_url[:500] if source_url else None,
                    "now": now
                })
                saved_count += 1
                logger.info(f"[ARTICLE_PIPELINE] Saved new article [{source}]: {title[:50]}")

            session.commit()
            logger.info(f"[ARTICLE_PIPELINE] Transaction committed. Saved {saved_count} articles.")

        except Exception as e:
            session.rollback()
            logger.error(f"[ARTICLE_PIPELINE] Error saving articles to DB: {e}")
            raise e
        finally:
            session.close()

        return saved_count
