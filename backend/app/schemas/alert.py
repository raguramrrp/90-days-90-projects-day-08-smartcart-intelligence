from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.product import ProductResponse

class WatchlistItemCreate(BaseModel):
    product_id: int
    target_price: Optional[float] = None
    note: Optional[str] = None
    needed_by: Optional[datetime] = None
    priority: Optional[str] = "MEDIUM"

class WatchlistItemResponse(BaseModel):
    id: int
    watchlist_id: int
    product_id: int
    product: ProductResponse
    target_price: Optional[float] = None
    note: Optional[str] = None
    needed_by: Optional[datetime] = None
    priority: str
    created_at: datetime
    # Computed metrics
    current_price: Optional[float] = None
    price_diff_target: Optional[float] = None
    target_reached: bool = False

    class Config:
        from_attributes = True

class WatchlistResponse(BaseModel):
    id: int
    user_id: int
    name: str
    items: List[WatchlistItemResponse]
    created_at: datetime

    class Config:
        from_attributes = True

class PriceAlertRuleCreate(BaseModel):
    product_id: int
    rule_type: str # "TARGET_PRICE", "PERCENT_DROP", "PRICE_INCREASE", "BACK_IN_STOCK"
    threshold_value: Optional[float] = None

class PriceAlertRuleResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_title: Optional[str] = None
    rule_type: str
    threshold_value: Optional[float] = None
    is_active: bool
    created_at: datetime
    last_triggered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationDeliveryResponse(BaseModel):
    id: int
    channel: str
    delivery_mode: str
    recipient: str
    status: str
    preview_body: Optional[str] = None
    sent_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_title: Optional[str] = None
    product_image: Optional[str] = None
    rule_id: Optional[int] = None
    title: str
    message: str
    previous_price: Optional[float] = None
    new_price: Optional[float] = None
    channel: str
    status: str
    created_at: datetime
    deliveries: List[NotificationDeliveryResponse] = []

    class Config:
        from_attributes = True
