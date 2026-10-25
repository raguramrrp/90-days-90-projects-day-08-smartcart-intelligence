from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RetailerResponse(BaseModel):
    id: int
    code: str
    name: str
    website_url: str
    logo_url: Optional[str] = None
    is_active: bool
    freshness_ttl_minutes: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PriceObservationResponse(BaseModel):
    id: int
    product_listing_id: int
    price: float
    original_price: Optional[float] = None
    currency: str
    in_stock: bool
    shipping_cost: float
    taxes_and_fees: float
    estimated_total: float
    provenance: str # "LIVE", "CACHED", "HISTORICAL", "SAMPLE", "UNAVAILABLE"
    observed_at: datetime
    retrieved_at: datetime

    class Config:
        from_attributes = True

class ProductListingResponse(BaseModel):
    id: int
    product_id: int
    retailer_id: int
    retailer: RetailerResponse
    external_sku: Optional[str] = None
    listing_url: str
    is_verified: bool
    latest_price: Optional[PriceObservationResponse] = None

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: int
    title: str
    brand: str
    model_number: Optional[str] = None
    gtin_upc: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    is_active: bool
    created_at: datetime
    # Aggregated fields
    current_lowest_price: Optional[float] = None
    all_time_lowest_price: Optional[float] = None
    original_mrp: Optional[float] = None
    retailer_count: int = 0
    in_stock_any: bool = True
    deal_score: Optional[int] = None
    deal_label: Optional[str] = None
    provenance: Optional[str] = "LIVE"

    class Config:
        from_attributes = True

class PriceStatsResponse(BaseModel):
    current_price: float
    all_time_low: float
    all_time_high: float
    historical_avg: float
    median_price: float
    absolute_change_30d: float
    percent_change_30d: float
    data_points_count: int
    currency: str = "INR"

class PriceHistoryPoint(BaseModel):
    date: str
    observed_at: datetime
    price: float
    retailer: str
    retailer_code: str
    provenance: str
    in_stock: bool

class PriceHistoryResponse(BaseModel):
    product_id: int
    product_title: str
    stats: PriceStatsResponse
    history: List[PriceHistoryPoint]
    forecast: Optional[List[dict]] = None
