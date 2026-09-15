import logging
import threading
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from main import (
    crawl_movies,
    backfill_movie_genres,
    crawl_past_movies,
    crawl_articles,
    crawl_reviews,
    crawl_showtimes
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [CRAWLER_API] %(message)s"
)
logger = logging.getLogger("CrawlerAPI")

app = FastAPI(title="CineMind Crawler Service API", version="2.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

crawler_state = {
    "is_running": False,
    "current_task": None,
    "last_run": None,
    "last_result": None
}
state_lock = threading.Lock()

def run_job(task_name: str, job_fn, *args, **kwargs):
    global crawler_state
    with state_lock:
        crawler_state["is_running"] = True
        crawler_state["current_task"] = task_name

    logger.info(f"Started crawl task: {task_name}")
    try:
        res = job_fn(*args, **kwargs)
        with state_lock:
            crawler_state["last_run"] = datetime.now().isoformat()
            crawler_state["last_result"] = {
                "task": task_name,
                "status": "SUCCESS",
                "result": res
            }
        logger.info(f"Finished crawl task: {task_name} successfully")
    except Exception as e:
        logger.error(f"Error in crawl task {task_name}: {e}", exc_info=True)
        with state_lock:
            crawler_state["last_run"] = datetime.now().isoformat()
            crawler_state["last_result"] = {
                "task": task_name,
                "status": "ERROR",
                "error": str(e)
            }
    finally:
        with state_lock:
            crawler_state["is_running"] = False
            crawler_state["current_task"] = None

@app.get("/health")
def health():
    return {"status": "ok", "service": "crawler-service", "timestamp": datetime.now().isoformat()}

@app.get("/api/crawler/status")
def get_status():
    return crawler_state

@app.post("/api/crawler/showtimes")
def trigger_showtimes():
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    # Run synchronously or return result
    logger.info("Admin triggered showtimes crawl via API")
    stats = crawl_showtimes()
    return {
        "status": "SUCCESS",
        "task": "showtimes",
        "inserted": stats.get("inserted", 0),
        "updated": stats.get("updated", 0),
        "skipped": stats.get("skipped", 0),
        "total": stats.get("total", 0),
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/crawler/movies")
def trigger_movies(background_tasks: BackgroundTasks):
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    def job():
        crawl_movies()
        crawl_past_movies()
        backfill_movie_genres()

    background_tasks.add_task(run_job, "movies", job)
    return {"status": "TRIGGERED", "task": "movies", "message": "Crawl now-showing, upcoming, past movies, genres and age ratings started in background"}

@app.post("/api/crawler/genres")
def trigger_genres(background_tasks: BackgroundTasks):
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    background_tasks.add_task(run_job, "genres", backfill_movie_genres)
    return {"status": "TRIGGERED", "task": "genres", "message": "Classifying movie genres and age ratings started in background"}

@app.post("/api/crawler/articles")
def trigger_articles(background_tasks: BackgroundTasks):
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    background_tasks.add_task(run_job, "articles", crawl_articles)
    return {"status": "TRIGGERED", "task": "articles", "message": "Crawl articles started in background"}

@app.post("/api/crawler/reviews")
def trigger_reviews(background_tasks: BackgroundTasks, movie_id: int = None):
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    background_tasks.add_task(run_job, "reviews", crawl_reviews, movie_id=movie_id)
    return {"status": "TRIGGERED", "task": "reviews", "message": "Crawl reviews started in background"}

@app.post("/api/crawler/past-movies")
def trigger_past_movies(background_tasks: BackgroundTasks):
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    background_tasks.add_task(run_job, "past-movies", crawl_past_movies)
    return {"status": "TRIGGERED", "task": "past-movies", "message": "Crawl past movies from Moveek started in background"}

@app.post("/api/crawler/all")
def trigger_all(background_tasks: BackgroundTasks):
    if crawler_state["is_running"]:
        raise HTTPException(status_code=409, detail=f"Crawler is currently busy running: {crawler_state['current_task']}")
    
    def job():
        crawl_movies()
        crawl_past_movies()
        backfill_movie_genres()
        crawl_articles()
        crawl_reviews()
        crawl_showtimes()

    background_tasks.add_task(run_job, "all", job)
    return {"status": "TRIGGERED", "task": "all", "message": "Full crawl cycle (NCC movies, upcoming, past movies, genres & age ratings, articles, reviews, showtimes & seats) started in background"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)


