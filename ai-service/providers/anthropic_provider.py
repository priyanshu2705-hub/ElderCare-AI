import base64

from utils.json_utils import extract_json

from .base import AIProvider, ProviderError


class AnthropicProvider(AIProvider):
    name = "anthropic"
    supports_vision = True

    def __init__(self, api_key: str, model: str, timeout: float = 45.0):
        from anthropic import AsyncAnthropic  # imported here so mock mode works without the package

        self.model = model
        self.client = AsyncAnthropic(api_key=api_key, timeout=timeout, max_retries=1)

    async def _call(self, system: str, content, max_tokens: int = 1000) -> dict:
        try:
            resp = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": content}],
            )
            text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
            return extract_json(text)
        except Exception as e:  # network, auth, rate limit, bad JSON...
            raise ProviderError(f"{type(e).__name__}: {e}") from e

    async def complete_json(self, system: str, user: str) -> dict:
        return await self._call(system, user)

    async def vision_json(self, system: str, user: str, image: bytes, media_type: str) -> dict:
        content = [
            {"type": "image", "source": {"type": "base64", "media_type": media_type,
                                         "data": base64.b64encode(image).decode()}},
            {"type": "text", "text": user},
        ]
        return await self._call(system, content, max_tokens=1400)
