from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone

class ProviderResult:
    def __init__(
        self,
        price: float,
        currency: str = "INR",
        in_stock: bool = True,
        shipping_cost: float = 0.0,
        taxes_and_fees: float = 0.0,
        provenance: str = "LIVE", # "LIVE", "CACHED", "HISTORICAL", "SAMPLE", "UNAVAILABLE"
        observed_at: Optional[datetime] = None,
        retrieved_at: Optional[datetime] = None,
        raw_metadata: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ):
        self.price = price
        self.currency = currency
        self.in_stock = in_stock
        self.shipping_cost = shipping_cost
        self.taxes_and_fees = taxes_and_fees
        self.estimated_total = round(price + shipping_cost + taxes_and_fees, 2)
        self.provenance = provenance
        self.observed_at = observed_at or datetime.now(timezone.utc)
        self.retrieved_at = retrieved_at or datetime.now(timezone.utc)
        self.raw_metadata = raw_metadata or {}
        self.error_message = error_message

    def to_dict(self) -> Dict[str, Any]:
        return {
            "price": self.price,
            "currency": self.currency,
            "in_stock": self.in_stock,
            "shipping_cost": self.shipping_cost,
            "taxes_and_fees": self.taxes_and_fees,
            "estimated_total": self.estimated_total,
            "provenance": self.provenance,
            "observed_at": self.observed_at,
            "retrieved_at": self.retrieved_at,
            "raw_metadata": self.raw_metadata,
            "error_message": self.error_message
        }


class ProviderAdapter(ABC):
    @abstractmethod
    def get_provider_code(self) -> str:
        """Unique short code, e.g. 'amazon_in'"""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Display name, e.g. 'Amazon India'"""
        pass

    @abstractmethod
    def get_credential_requirements(self) -> str:
        """Documented prerequisites for live access"""
        pass

    @abstractmethod
    def get_official_api_status(self) -> str:
        """Status of live official integration (ACTIVE, PENDING_CREDENTIALS, RESTRICTED)"""
        pass

    @abstractmethod
    def get_rate_limit_policy(self) -> str:
        """Rate limit information"""
        pass

    @abstractmethod
    def fetch_price(self, sku: str, listing_url: str, baseline_price: Optional[float] = None) -> ProviderResult:
        """Fetch current price observation for an item"""
        pass

    @abstractmethod
    def check_health(self) -> Dict[str, Any]:
        """Verify API connectivity and latency"""
        pass
