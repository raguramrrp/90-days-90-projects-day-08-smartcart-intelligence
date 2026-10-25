from typing import Dict, List, Optional
from backend.app.providers.base import ProviderAdapter
from backend.app.providers.mock_india_retailers import (
    AmazonIndiaAdapter, FlipkartAdapter, CromaAdapter,
    RelianceDigitalAdapter, TataCliqAdapter
)

class ProviderRegistry:
    _instance = None
    _adapters: Dict[str, ProviderAdapter] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ProviderRegistry, cls).__new__(cls)
            cls._instance._register_default_adapters()
        return cls._instance

    def _register_default_adapters(self):
        adapters: List[ProviderAdapter] = [
            AmazonIndiaAdapter(),
            FlipkartAdapter(),
            CromaAdapter(),
            RelianceDigitalAdapter(),
            TataCliqAdapter()
        ]
        for adapter in adapters:
            self._adapters[adapter.get_provider_code()] = adapter

    def get_adapter(self, provider_code: str) -> Optional[ProviderAdapter]:
        return self._adapters.get(provider_code)

    def list_adapters(self) -> List[ProviderAdapter]:
        return list(self._adapters.values())

    def get_all_health(self) -> List[dict]:
        results = []
        for code, adapter in self._adapters.items():
            health = adapter.check_health()
            results.append({
                "retailer_code": code,
                "retailer_name": adapter.get_provider_name(),
                "status": health["status"],
                "response_time_ms": health["latency_ms"],
                "message": health["message"],
                "checked_at": health["checked_at"],
                "official_api_status": adapter.get_official_api_status(),
                "credential_requirement": adapter.get_credential_requirements()
            })
        return results

registry = ProviderRegistry()
