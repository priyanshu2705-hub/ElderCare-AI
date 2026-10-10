import logging
from functools import lru_cache

from config import settings

from .base import AIProvider, ProviderError  # noqa: F401
from .mock_provider import MockProvider

log = logging.getLogger("eldercare.ai")


@lru_cache
def get_provider() -> AIProvider:
    if settings.provider == "anthropic":
        if not settings.api_key:
            log.warning("AI_PROVIDER=anthropic but AI_API_KEY is empty -> running in DEMO mode")
            return MockProvider()
        from .anthropic_provider import AnthropicProvider
        return AnthropicProvider(settings.api_key, settings.model, settings.timeout)
    if settings.provider != "mock":
        log.warning("Unknown AI_PROVIDER '%s' -> running in DEMO mode", settings.provider)
    return MockProvider()
