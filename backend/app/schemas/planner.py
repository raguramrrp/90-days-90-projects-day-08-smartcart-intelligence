from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.product import ProductResponse

class ShoppingListItemCreate(BaseModel):
    product_id: Optional[int] = None
    item_title: str
    desired_quantity: int = 1
    estimated_unit_price: Optional[float] = 0.0
    priority: Optional[str] = "MEDIUM"
    needed_by: Optional[datetime] = None

class ShoppingListItemUpdate(BaseModel):
    desired_quantity: Optional[int] = None
    estimated_unit_price: Optional[float] = None
    is_purchased: Optional[bool] = None
    priority: Optional[str] = None
    needed_by: Optional[datetime] = None

class ShoppingListItemResponse(BaseModel):
    id: int
    shopping_list_id: int
    product_id: Optional[int] = None
    product: Optional[ProductResponse] = None
    item_title: str
    desired_quantity: int
    estimated_unit_price: float
    is_purchased: bool
    priority: str
    needed_by: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ShoppingListCreate(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = "cyan"

class ShoppingListResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    color: str
    items: List[ShoppingListItemResponse] = []
    total_estimated_cost: float = 0.0
    completed_items_count: int = 0
    total_items_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetCreate(BaseModel):
    month_year: str # "YYYY-MM"
    category: Optional[str] = "All Categories"
    budget_limit: float

class BudgetResponse(BaseModel):
    id: int
    user_id: int
    month_year: str
    category: str
    budget_limit: float
    spent_amount: float = 0.0
    planned_amount: float = 0.0
    remaining_amount: float = 0.0
    utilization_percentage: float = 0.0
    is_exceeded: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class RecurringPurchaseCreate(BaseModel):
    product_id: Optional[int] = None
    custom_title: str
    replenishment_interval_days: int = 30
    last_replenished_at: Optional[datetime] = None

class RecurringPurchaseResponse(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int] = None
    product: Optional[ProductResponse] = None
    custom_title: str
    replenishment_interval_days: int
    last_replenished_at: datetime
    next_review_at: datetime
    days_until_next_review: int = 0
    needs_replenishment_soon: bool = False
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseRecordCreate(BaseModel):
    product_id: Optional[int] = None
    retailer_id: Optional[int] = None
    purchase_price: float
    original_baseline_price: Optional[float] = None
    notes: Optional[str] = None

class PurchaseRecordResponse(BaseModel):
    id: int
    user_id: int
    product_id: Optional[int] = None
    retailer_id: Optional[int] = None
    product_title: Optional[str] = None
    retailer_name: Optional[str] = None
    purchase_price: float
    original_baseline_price: Optional[float] = None
    realized_savings: float = 0.0
    purchase_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class SavingsSummaryResponse(BaseModel):
    total_potential_savings: float
    total_realized_savings: float
    confirmed_purchases_count: int
    active_tracked_deals_count: int
    average_discount_percentage: float
    currency: str = "INR"
