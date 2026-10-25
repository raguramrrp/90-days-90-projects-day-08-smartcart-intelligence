from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model_number = Column(String(100), nullable=True, index=True)
    gtin_upc = Column(String(50), nullable=True, index=True)
    category = Column(String(100), nullable=False, index=True) # e.g. "Electronics", "Groceries", "Kitchen"
    subcategory = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(String(255), nullable=True) # comma-separated
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    listings = relationship("ProductListing", back_populates="product", cascade="all, delete-orphan")
    watchlist_items = relationship("WatchlistItem", back_populates="product", cascade="all, delete-orphan")
    alert_rules = relationship("PriceAlertRule", back_populates="product", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="product", cascade="all, delete-orphan")


class Retailer(Base):
    __tablename__ = "retailers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # e.g. "amazon_in", "flipkart"
    name = Column(String(100), nullable=False)
    website_url = Column(String(255), nullable=False)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    freshness_ttl_minutes = Column(Integer, default=60)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    listings = relationship("ProductListing", back_populates="retailer", cascade="all, delete-orphan")
    health_events = relationship("ProviderHealthEvent", back_populates="retailer", cascade="all, delete-orphan")


class ProductListing(Base):
    __tablename__ = "product_listings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    external_sku = Column(String(100), nullable=True, index=True)
    listing_url = Column(String(500), nullable=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    product = relationship("Product", back_populates="listings")
    retailer = relationship("Retailer", back_populates="listings")
    observations = relationship("PriceObservation", back_populates="listing", cascade="all, delete-orphan", order_by="desc(PriceObservation.observed_at)")
