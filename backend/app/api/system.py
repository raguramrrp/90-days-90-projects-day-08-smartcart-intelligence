from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timezone

from backend.app.database import get_db
from backend.app.models.product import Product, Retailer
from backend.app.models.price import PriceObservation
from backend.app.models.system import RefreshJob, ProviderHealthEvent
from backend.app.schemas.system import SystemStatusResponse, ProviderHealthResponse, RefreshJobResponse
from backend.app.providers.registry import registry
from backend.app.services.tracker_engine import run_price_refresh_job
from backend.app.services.scheduler import scheduler
from backend.app.config import settings

router = APIRouter(prefix="/system", tags=["System & Providers"])

@router.get("/status", response_model=SystemStatusResponse)
def get_system_status(db: Session = Depends(get_db)):
    active_retailers = db.query(Retailer).filter(Retailer.is_active == True).count()
    total_products = db.query(Product).count()
    total_observations = db.query(PriceObservation).count()
    last_job = db.query(RefreshJob).order_by(desc(RefreshJob.started_at)).first()

    provider_health_list = registry.get_all_health()
    providers_out = []
    
    # Map to retailers in database
    for ph in provider_health_list:
        ret = db.query(Retailer).filter(Retailer.code == ph["retailer_code"]).first()
        ret_id = ret.id if ret else 0
        ttl = ret.freshness_ttl_minutes if ret else 60

        providers_out.append(ProviderHealthResponse(
            id=ret_id,
            retailer_id=ret_id,
            retailer_code=ph["retailer_code"],
            retailer_name=ph["retailer_name"],
            status=ph["status"],
            response_time_ms=ph["response_time_ms"],
            message=ph["message"],
            checked_at=ph["checked_at"],
            freshness_ttl_minutes=ttl,
            official_api_status=ph["official_api_status"],
            credential_requirement=ph["credential_requirement"]
        ))

    return SystemStatusResponse(
        app_version=settings.PROJECT_VERSION,
        database_status="CONNECTED",
        scheduler_status="RUNNING" if scheduler.running else "STOPPED",
        email_delivery_mode=settings.EMAIL_DELIVERY_MODE,
        active_retailers_count=active_retailers,
        total_products_count=total_products,
        total_observations_count=total_observations,
        providers=providers_out,
        last_refresh_job=last_job
    )

@router.get("/providers", response_model=List[ProviderHealthResponse])
def get_providers_health(db: Session = Depends(get_db)):
    status_resp = get_system_status(db)
    return status_resp.providers

@router.post("/refresh", response_model=RefreshJobResponse)
def trigger_manual_refresh(db: Session = Depends(get_db)):
    # Rate limit: ensure no other job is running or ran in last 10 seconds
    last_job = db.query(RefreshJob).order_by(desc(RefreshJob.started_at)).first()
    if last_job and last_job.status == "RUNNING":
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A price refresh job is already in progress. Please wait for it to complete."
        )

    job = run_price_refresh_job(db, triggered_by="MANUAL_USER")
    return job

@router.get("/jobs", response_model=List[RefreshJobResponse])
def get_refresh_jobs(limit: int = 20, db: Session = Depends(get_db)):
    jobs = db.query(RefreshJob).order_by(desc(RefreshJob.started_at)).limit(limit).all()
    return jobs
