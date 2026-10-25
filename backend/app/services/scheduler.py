import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.services.tracker_engine import run_price_refresh_job

logger = logging.getLogger("smartcart.scheduler")

scheduler = BackgroundScheduler()

def scheduled_price_refresh_task():
    """Background cron job that scans all registered listings."""
    db = SessionLocal()
    try:
        logger.info("Starting scheduled price refresh cycle...")
        job = run_price_refresh_job(db, triggered_by="SCHEDULER")
        logger.info(f"Price refresh job {job.id} completed. Processed {job.items_processed} items.")
    except Exception as e:
        logger.error(f"Scheduled price refresh task encountered an error: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            scheduled_price_refresh_task,
            trigger=IntervalTrigger(minutes=settings.PRICE_REFRESH_INTERVAL_MINUTES),
            id="scheduled_price_refresh",
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"Background scheduler started with {settings.PRICE_REFRESH_INTERVAL_MINUTES}-minute interval.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler shut down successfully.")
