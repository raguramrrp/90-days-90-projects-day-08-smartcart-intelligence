import os
from typing import List

class Settings:
    PROJECT_NAME: str = "SmartCart Intelligence"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Default SQLite for frictionless local dev; PostgreSQL supported out of the box
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcart.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smartcart-super-secret-jwt-token-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Email Settings
    EMAIL_DELIVERY_MODE: str = os.getenv("EMAIL_DELIVERY_MODE", "MOCK") # MOCK or SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "alerts@smartcart.ai")
    
    # Scheduler
    PRICE_REFRESH_INTERVAL_MINUTES: int = int(os.getenv("PRICE_REFRESH_INTERVAL_MINUTES", "30"))
    CACHE_FRESHNESS_TTL_MINUTES: int = int(os.getenv("CACHE_FRESHNESS_TTL_MINUTES", "60"))

settings = Settings()
