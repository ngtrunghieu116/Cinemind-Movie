import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import SQLALCHEMY_DATABASE_URI

logger = logging.getLogger(__name__)

engine = create_engine(
    SQLALCHEMY_DATABASE_URI,
    pool_recycle=3600,
    pool_pre_ping=True,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("Successfully connected to MySQL database!")
            return True
    except Exception as e:
        logger.error(f"Failed to connect to MySQL database: {e}")
        return False
