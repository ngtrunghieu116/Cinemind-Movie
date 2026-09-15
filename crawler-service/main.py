import argparse
import logging
import sys
from sqlalchemy import text

from config import TMDB_API_KEY
from db import SessionLocal, test_connection
from scrapers.ncc_movie_scraper import NccMovieScraper
from scrapers.ncc_news_scraper import NccNewsScraper
from scrapers.moveek_news_scraper import MoveekNewsScraper
from scrapers.tmdb_review_scraper import TmdbReviewScraper
from scrapers.moveek_review_scraper import MoveekReviewScraper
from scrapers.moveek_movie_scraper import MoveekMovieScraper
from pipelines.movie_pipeline import MoviePipeline
from pipelines.article_pipeline import ArticlePipeline
from pipelines.review_pipeline import ReviewPipeline
from scrapers.ncc_showtime_scraper import NccShowtimeScraper
from pipelines.showtime_pipeline import ShowtimePipeline

# Force UTF-8 output on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("CineMindCrawler")

def crawl_movies():
    logger.info("==================================================")
    logger.info(">>> 1. CRAWLING REAL MOVIES (NOW SHOWING) & BANNERS FROM NCC")
    logger.info("==================================================")
    try:
        movie_scraper = NccMovieScraper()
        movies = movie_scraper.fetch_now_showing_movies()
        pipeline = MoviePipeline()
        saved = pipeline.process_and_save(movies)
        logger.info(f">>> NOW SHOWING MOVIES CRAWL FINISHED: {saved} new movies saved.\n")
        
        # Also crawl upcoming movies from NCC and backfill genres
        crawl_upcoming_movies()
        backfill_movie_genres()
        return saved
    except Exception as e:
        logger.error(f"Error crawling movies: {e}")
        return 0

def crawl_upcoming_movies():
    logger.info("==================================================")
    logger.info(">>> 1B. CRAWLING UPCOMING MOVIES (PHIM SẮP CHIẾU) FROM NCC")
    logger.info("==================================================")
    total_saved = 0
    pipeline = MoviePipeline()

    try:
        ncc_scraper = NccMovieScraper()
        ncc_upcoming = ncc_scraper.fetch_upcoming_movies()
        saved_ncc = pipeline.process_and_save(ncc_upcoming)
        total_saved += saved_ncc
        logger.info(f"==> Processed {len(ncc_upcoming)} upcoming movies from NCC (saved {saved_ncc}).")
    except Exception as e:
        logger.error(f"Error crawling NCC upcoming movies: {e}")

    logger.info(f">>> UPCOMING MOVIES CRAWL FINISHED: {total_saved} new upcoming movies saved.\n")
    return total_saved

def backfill_movie_genres():
    logger.info("==================================================")
    logger.info(">>> 1C. RESOLVING & LINKING MOVIE GENRES & AGE RATINGS (LOẠI PHIM & ĐỘ TUỔI)")
    logger.info("==================================================")
    try:
        pipeline = MoviePipeline()
        stats = pipeline.classify_all_movies()
        count = stats.get("total_processed", 0)
        logger.info(f">>> GENRE & AGE RATING CLASSIFICATION FINISHED: {count} movies processed. AgeRatings: {stats.get('age_ratings')}\n")
        return count
    except Exception as e:
        logger.error(f"Error classifying movie genres and age ratings: {e}")
        return 0

def crawl_past_movies(pages: int = 2):
    logger.info("==================================================")
    logger.info(">>> 1D. CRAWLING PAST MOVIES (ENDED) FROM MOVEEK")
    logger.info("==================================================")
    try:
        moveek_movie_scraper = MoveekMovieScraper()
        past_movies = moveek_movie_scraper.fetch_past_movies(max_pages=pages)
        pipeline = MoviePipeline()
        saved = pipeline.process_and_save(past_movies)
        logger.info(f">>> PAST MOVIES CRAWL FINISHED: {saved} new past movies saved.\n")
        return saved
    except Exception as e:
        logger.error(f"Error crawling past movies: {e}")
        return 0


def crawl_articles():
    logger.info("==================================================")
    logger.info(">>> 2. CRAWLING REAL ARTICLES & NEWS")
    logger.info("==================================================")
    
    article_pipeline = ArticlePipeline()
    total_saved = 0

    # 1. NCC Official Cinema News & Events
    try:
        ncc_scraper = NccNewsScraper()
        ncc_articles = ncc_scraper.fetch_articles()
        saved_ncc = article_pipeline.process_and_save(ncc_articles)
        total_saved += saved_ncc
        logger.info(f"==> Saved {saved_ncc} authentic articles from NCC.")
    except Exception as e:
        logger.error(f"Error crawling NCC articles: {e}")

    # 2. Moveek Film Reviews & Cinema News
    try:
        moveek_scraper = MoveekNewsScraper()
        moveek_articles = moveek_scraper.fetch_articles(limit=12)
        saved_moveek = article_pipeline.process_and_save(moveek_articles)
        total_saved += saved_moveek
        logger.info(f"==> Saved {saved_moveek} authentic articles from Moveek.")
    except Exception as e:
        logger.error(f"Error crawling Moveek articles: {e}")

    logger.info(f">>> ARTICLES CRAWL FINISHED: Total {total_saved} new cinema articles saved.\n")
    return total_saved

def crawl_reviews(movie_id: int = None, limit_per_movie: int = 30):
    logger.info("==================================================")
    logger.info(">>> 3. CRAWLING REAL REVIEWS & RATINGS (ALL MOVIES)")
    logger.info("==================================================")

    session = SessionLocal()
    tmdb_scraper = TmdbReviewScraper(api_key=TMDB_API_KEY)
    moveek_scraper = MoveekReviewScraper()
    review_pipeline = ReviewPipeline()
    total_saved = 0

    try:
        if movie_id:
            query = text("SELECT id, title, title_en, source, source_id, status FROM movies WHERE id = :mid")
            movies = session.execute(query, {"mid": movie_id}).fetchall()
        else:
            # Crawl reviews for all movies in database
            query = text("""
                SELECT id, title, title_en, source, source_id, status 
                FROM movies 
                ORDER BY id DESC
            """)
            movies = session.execute(query).fetchall()

        if not movies:
            logger.warning("No movies found in database to crawl reviews for. Please crawl movies first!")
            return 0

        logger.info(f"Found {len(movies)} movies to process reviews for.")

        for m in movies:
            mid, title, title_en, source, source_id, status = m[0], m[1], m[2], m[3], m[4], m[5]
            logger.info(f"--- Processing reviews for: '{title}' (ID: {mid}, Status: {status}) ---")

            collected_reviews = []

            # 1. Fetch from TMDb (if available)
            if tmdb_scraper.api_key:
                tmdb_id = tmdb_scraper.search_movie(title=title, title_en=title_en)
                if tmdb_id:
                    tmdb_reviews = tmdb_scraper.fetch_reviews(tmdb_id)
                    collected_reviews.extend(tmdb_reviews[:limit_per_movie])

            # 2. Fetch from Moveek
            if source == "MOVEEK" and source_id and source_id.startswith("moveek_"):
                slug = source_id.replace("moveek_", "")
                direct_url = f"https://moveek.com/phim/{slug}/"
                moveek_reviews = moveek_scraper.fetch_community_reviews(movie_title=title, movie_url=direct_url)
            else:
                moveek_reviews = moveek_scraper.fetch_community_reviews(movie_title=title)

            collected_reviews.extend(moveek_reviews[:limit_per_movie])

            if not collected_reviews:
                logger.info(f"No real reviews found yet for '{title}'. Skipping.")
                continue

            saved = review_pipeline.process_and_save(mid, collected_reviews)
            total_saved += saved

    except Exception as e:
        logger.error(f"Error crawling reviews: {e}")
    finally:
        session.close()

    logger.info(f">>> REVIEWS CRAWL FINISHED: Total {total_saved} reviews saved across movies.\n")
    return total_saved

def crawl_showtimes():
    logger.info("==================================================")
    logger.info(">>> 4. CRAWLING REAL SHOWTIMES & CREATING 60 SEATS (NCC)")
    logger.info("==================================================")
    try:
        scraper = NccShowtimeScraper()
        showtimes = scraper.fetch_showtimes()
        pipeline = ShowtimePipeline()
        stats = pipeline.process_and_save(showtimes)
        logger.info(
            f">>> SHOWTIMES CRAWL FINISHED: {stats.get('inserted', 0)} inserted, "
            f"{stats.get('updated', 0)} updated, {stats.get('skipped', 0)} skipped.\n"
        )
        return stats
    except Exception as e:
        logger.error(f"Error crawling showtimes: {e}")
        return {"inserted": 0, "updated": 0, "skipped": 0, "total": 0}

def main():
    parser = argparse.ArgumentParser(description="CineMind Python Crawler Service")
    parser.add_argument("--all", action="store_true", help="Crawl all: movies (now showing & upcoming), past movies, genres & age ratings, articles, reviews, showtimes & seats")
    parser.add_argument("--movies", action="store_true", help="Crawl now showing and upcoming movies, banners, and link genres from NCC")
    parser.add_argument("--genres", action="store_true", help="Classify and link genres and age_rating for all movies")
    parser.add_argument("--past-movies", action="store_true", help="Crawl past (ended) movies from Moveek")
    parser.add_argument("--news", "--articles", action="store_true", help="Crawl articles and news from NCC and Moveek")
    parser.add_argument("--reviews", action="store_true", help="Crawl reviews for movies")
    parser.add_argument("--showtimes", action="store_true", help="Crawl real showtimes and create 60 seats/tickets from NCC")
    parser.add_argument("--movie-id", type=int, help="Crawl reviews for a specific movie ID")
    parser.add_argument("--test-db", action="store_true", help="Test database connection")

    args = parser.parse_args()

    if args.test_db:
        success = test_connection()
        sys.exit(0 if success else 1)

    if not any([args.all, args.movies, args.past_movies, args.news, args.reviews, args.showtimes, args.genres, args.movie_id]):
        # Default behavior: run all steps sequentially!
        crawl_movies()
        crawl_past_movies()
        backfill_movie_genres()
        crawl_articles()
        crawl_reviews()
        crawl_showtimes()
    else:
        if args.movies or args.all:
            crawl_movies()
        if args.past_movies or args.all:
            crawl_past_movies()
        if args.genres or (args.all and not args.movies):
            backfill_movie_genres()
        if args.news or args.all:
            crawl_articles()
        if args.reviews or args.all or args.movie_id:
            crawl_reviews(movie_id=args.movie_id)
        if args.showtimes or args.all:
            crawl_showtimes()


if __name__ == "__main__":
    main()
