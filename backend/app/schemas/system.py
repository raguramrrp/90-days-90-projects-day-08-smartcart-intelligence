from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class RefreshJobResponse(BaseModel):
    id: int
    job_type: str
    triggered_by: str
    status: str
    items_processed: int
    items_updated: int
    error_log: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProviderHealthResponse(BaseModel):
    id: int
    retailer_id: int
    retailer_code: str
    retailer_name: str
    status: str # "HEALTHY", "DEGRADED", "DOWN", "AUTH_REQUIRED"
    response_time_ms: float
    message: Optional[str] = None
    checked_at: datetime
    freshness_ttl_minutes: int
    official_api_status: str
    credential_requirement: str

class SystemStatusResponse(BaseModel):
    app_version: str
    database_status: str
    scheduler_status: str
    email_delivery_mode: str
    active_retailers_count: int
    total_products_count: int
    total_observations_count: int
    providers: List[ProviderHealthResponse]
    last_refresh_job: Optional[RefreshJobResponse] = None

class DealScoreFactor(BaseModel):
    name: str
    score_impact: float
    description: str

class DealScoreResponse(BaseModel):
    product_id: int
    product_title: str
    deal_score: int # 0 to 100
    deal_label: str # "EXCELLENT_DEAL", "GOOD_PRICE", "FAIR", "OVERPRICED", "INSUFFICIENT_DATA"
    guidance: str # "BUY NOW", "WAIT", "COMPARE FIRST", "INSUFFICIENT DATA"
    confidence: str # "HIGH", "MEDIUM", "LOW", "INSUFFICIENT_DATA"
    explanation: str
    factors: List[DealScoreFactor]
    data_freshness_hours: float
    provenance: str

class PriceForecastResponse(BaseModel):
    product_id: int
    horizon_days: int
    status: str # "PREDICTED", "INSUFFICIENT_HISTORY"
    current_price: float
    predicted_trend: str # "DECREASING", "STABLE", "INCREASING"
    predicted_price_7d: Optional[float] = None
    predicted_price_14d: Optional[float] = None
    predicted_price_30d: Optional[float] = None
    confidence_interval_lower: Optional[float] = None
    confidence_interval_upper: Optional[float] = None
    disclaimer: str
    forecast_points: List[Dict[str, Any]] = []
