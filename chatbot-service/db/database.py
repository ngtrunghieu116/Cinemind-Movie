from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from contextlib import contextmanager
import logging
from config import settings

logger = logging.getLogger("chatbot.db")

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

@contextmanager
def get_db():
    """Context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session rollback due to error: {e}")
        raise
    finally:
        db.close()

def get_db_dependency():
    """FastAPI Depends dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
