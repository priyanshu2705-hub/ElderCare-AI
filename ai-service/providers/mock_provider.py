from .base import AIProvider, ProviderError


class MockProvider(AIProvider):
    """Used when no API key is set. The assistant detects `is_demo` and uses the
    offline rule engine (services/rule_engine.py) instead of calling an LLM."""

    name = "mock"
    is_demo = True

    async def complete_json(self, system, user):
        raise ProviderError("demo mode: no AI provider configured")
