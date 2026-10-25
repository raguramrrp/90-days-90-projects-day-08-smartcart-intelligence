from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=True)
    preferred_currency = Column(String(10), default="INR", nullable=False)
    email_notifications_enabled = Column(Boolean, default=True)
    in_app_notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    alert_rules = relationship("PriceAlertRule", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    shopping_lists = relationship("ShoppingList", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    recurring_purchases = relationship("RecurringPurchase", back_populates="user", cascade="all, delete-orphan")
    purchases = relationship("PurchaseRecord", back_populates="user", cascade="all, delete-orphan")
