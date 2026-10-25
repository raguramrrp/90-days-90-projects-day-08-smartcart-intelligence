from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class PriceObservation(Base):
    __tablename__ = "price_observations"

    id = Column(Integer, primary_key=True, index=True)
    product_listing_id = Column(Integer, ForeignKey("product_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False, index=True)
    original_price = Column(Float, nullable=True) # MRP
    currency = Column(String(10), default="INR", nullable=False)
    in_stock = Column(Boolean, default=True)
    shipping_cost = Column(Float, default=0.0)
    taxes_and_fees = Column(Float, default=0.0)
    estimated_total = Column(Float, nullable=False)
    provenance = Column(String(50), default="SAMPLE", nullable=False) # "LIVE", "CACHED", "HISTORICAL", "SAMPLE", "UNAVAILABLE"
    observed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    retrieved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    raw_metadata = Column(JSON, nullable=True)

    # Relationship
    listing = relationship("ProductListing", back_populates="observations")
