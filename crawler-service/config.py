import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_NAME = os.getenv("DB_NAME", "movie_reservation_db")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")

NCC_BASE_URL = os.getenv("NCC_BASE_URL", "https://chieuphimquocgia.com.vn")
VNEXPRESS_RSS_URL = os.getenv("VNEXPRESS_RSS_URL", "https://vnexpress.net/rss/giai-tri.rss")
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")

# SQLAlchemy DB URI
SQLALCHEMY_DATABASE_URI = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)
