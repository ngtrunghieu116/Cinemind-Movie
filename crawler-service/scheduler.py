import time
import logging
import schedule
from main import (
    crawl_movies,
    crawl_past_movies,
    crawl_showtimes,
    crawl_articles,
    crawl_reviews
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [SCHEDULER] %(message)s"
)
logger = logging.getLogger("CrawlerScheduler")

def scheduled_job():
    logger.info(">>> Starting scheduled crawl cycle...")
    try:
        # 1. Crawl movies
        logger.info("--- Step 1: Movies ---")
        crawl_movies()
        crawl_past_movies()
        # 2. Crawl showtimes
        logger.info("--- Step 2: Showtimes ---")
        crawl_showtimes()
        # 3. Crawl cinema articles (NCC)
        logger.info("--- Step 3: Cinema News ---")
        crawl_articles()
        # 4. Crawl reviews
        logger.info("--- Step 4: Reviews ---")
        crawl_reviews()
    except Exception as e:
        logger.error(f"Error during scheduled crawl job: {e}")
    logger.info("<<< Finished scheduled crawl cycle.")

def main():
    logger.info("Initializing CineMind Crawler Scheduler daemon...")
    
    # Run once immediately on start
    scheduled_job()

    # Schedule: every 6 hours
    schedule.every(6).hours.do(scheduled_job)
    
    # Or specifically at 08:00 and 20:00 every day
    schedule.every().day.at("08:00").do(scheduled_job)
    schedule.every().day.at("20:00").do(scheduled_job)

    logger.info("Scheduler running. Waiting for next trigger...")
    while True:
        schedule.run_pending()
        time.sleep(30)

if __name__ == "__main__":
    main()
