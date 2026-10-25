import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.seed_data import seed_database
from backend.app.services.scheduler import start_scheduler, stop_scheduler
from backend.app.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # If testing, skip background scheduler and db seeding
    if os.getenv("TESTING") == "1":
        yield
        return

    # Startup: Create tables if not exist
    Base.metadata.create_all(bind=engine)
    
    # Run database seed
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    # Start scheduler
    start_scheduler()
    
    yield
    
    # Shutdown
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Automated E-Commerce Price Monitoring, Comparison & Shopping Intelligence Platform (India-First Architecture)",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "health_check": "/health",
        "api_v1": "/api/v1"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
