from abc import ABC, abstractmethod


class ProviderError(Exception):
    """Any failure talking to an AI provider. Never shown to users directly."""


class AIProvider(ABC):
    """Swap the LLM by implementing these two methods and registering it in providers/__init__.py."""

    name = "base"
    is_demo = False          # True = no real AI is being used
    supports_vision = False

    @abstractmethod
    async def complete_json(self, system: str, user: str) -> dict:
        """Send a text prompt, return the parsed JSON object the model answered with."""

    async def vision_json(self, system: str, user: str, image: bytes, media_type: str) -> dict:
        raise ProviderError(f"{self.name} does not support images")
