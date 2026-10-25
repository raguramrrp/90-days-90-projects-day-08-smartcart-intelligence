from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class RefreshJob(Base):
    __tablename__ = "refresh_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_type = Column(String(50), default="SCHEDULED_PRICE_CHECK") # "SCHEDULED_PRICE_CHECK", "MANUAL_CHECK"
    triggered_by = Column(String(50), default="SYSTEM") # "SYSTEM", "USER"
    status = Column(String(50), default="PENDING") # "PENDING", "RUNNING", "COMPLETED", "FAILED"
    items_processed = Column(Integer, default=0)
    items_updated = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)


class ProviderHealthEvent(Base):
    __tablename__ = "provider_health_events"

    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="HEALTHY") # "HEALTHY", "DEGRADED", "DOWN", "AUTH_REQUIRED"
    response_time_ms = Column(Float, default=0.0)
    message = Column(String(255), nullable=True)
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationship
    retailer = relationship("Retailer", back_populates="health_events")
