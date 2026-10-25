from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(255), nullable=True)
    color = Column(String(50), default="cyan")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="shopping_lists")
    items = relationship("ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan")


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(Integer, primary_key=True, index=True)
    shopping_list_id = Column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    item_title = Column(String(255), nullable=False)
    desired_quantity = Column(Integer, default=1)
    estimated_unit_price = Column(Float, default=0.0)
    is_purchased = Column(Boolean, default=False)
    priority = Column(String(20), default="MEDIUM") # "LOW", "MEDIUM", "HIGH"
    needed_by = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    shopping_list = relationship("ShoppingList", back_populates="items")
    product = relationship("Product")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month_year = Column(String(7), nullable=False, index=True) # "YYYY-MM"
    category = Column(String(100), default="All Categories", nullable=False)
    budget_limit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    user = relationship("User", back_populates="budgets")


class RecurringPurchase(Base):
    __tablename__ = "recurring_purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    custom_title = Column(String(255), nullable=False)
    replenishment_interval_days = Column(Integer, default=30)
    last_replenished_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    next_review_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="recurring_purchases")
    product = relationship("Product")


class PurchaseRecord(Base):
    __tablename__ = "purchase_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id", ondelete="SET NULL"), nullable=True)
    purchase_price = Column(Float, nullable=False)
    original_baseline_price = Column(Float, nullable=True) # price before drop
    purchase_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="purchases")
    product = relationship("Product")
    retailer = relationship("Retailer")
