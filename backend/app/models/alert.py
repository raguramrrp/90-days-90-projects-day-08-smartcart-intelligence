from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), default="Default Watchlist", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    target_price = Column(Float, nullable=True)
    note = Column(String(255), nullable=True) # e.g. "Gift for birthday"
    needed_by = Column(DateTime, nullable=True)
    priority = Column(String(20), default="MEDIUM") # "LOW", "MEDIUM", "HIGH"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    watchlist = relationship("Watchlist", back_populates="items")
    product = relationship("Product", back_populates="watchlist_items")


class PriceAlertRule(Base):
    __tablename__ = "price_alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_type = Column(String(50), nullable=False) # "TARGET_PRICE", "PERCENT_DROP", "PRICE_INCREASE", "BACK_IN_STOCK"
    threshold_value = Column(Float, nullable=True) # e.g. target price or percent drop number
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_triggered_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="alert_rules")
    product = relationship("Product", back_populates="alert_rules")
    notifications = relationship("Notification", back_populates="rule", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("price_alert_rules.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    previous_price = Column(Float, nullable=True)
    new_price = Column(Float, nullable=True)
    channel = Column(String(50), default="IN_APP") # "IN_APP", "EMAIL", "BOTH"
    status = Column(String(20), default="UNREAD", index=True) # "UNREAD", "READ", "ARCHIVED"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
    product = relationship("Product", back_populates="notifications")
    rule = relationship("PriceAlertRule", back_populates="notifications")
    deliveries = relationship("NotificationDelivery", back_populates="notification", cascade="all, delete-orphan")


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(50), nullable=False) # "IN_APP", "EMAIL"
    delivery_mode = Column(String(50), default="MOCK_DEV") # "MOCK_DEV", "REAL_SMTP"
    recipient = Column(String(255), nullable=False)
    status = Column(String(50), default="SENT") # "SENT", "PREVIEWED", "FAILED"
    preview_body = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship
    notification = relationship("Notification", back_populates="deliveries")
