"""Chat orchestration: safety pre-check -> LLM (or rule engine) -> validate -> safety post-check."""
import logging

from prompts.system import EXPLAIN_SYSTEM, build_chat_system
from providers.base import AIProvider, ProviderError
from schemas.models import ChatRequest, ChatResponse, ExplainRequest, ExplainResponse
from services import rule_engine, safety
from utils.normalize import normalize_chat

log = logging.getLogger("eldercare.assistant")


async def handle_chat(req: ChatRequest, provider: AIProvider) -> ChatResponse:
    # 1. Fixed, deterministic answers for emergencies / symptoms / dosage questions
    fixed = safety.pre_check(req.text)
    if fixed:
        return ChatResponse(**fixed, demoMode=provider.is_demo)

    # 2. Real LLM, or rule engine in demo mode / on provider failure
    raw, demo = None, provider.is_demo
    if not provider.is_demo:
        try:
            raw = await provider.complete_json(
                build_chat_system(req.context), f"<user_message>{req.text}</user_message>")
        except ProviderError as e:
            log.warning("Provider failed (%s). Falling back to offline rules.", e)
            demo = True
    if raw is None:
        raw = rule_engine.handle_chat(req.text, req.context.model_dump())

    # 3. Never trust model output
    result = normalize_chat(raw)
    result["reply"] = safety.sanitize_reply(result["reply"], has_tool=bool(result["toolCall"]))
    return ChatResponse(**result, demoMode=demo)


async def explain(req: ExplainRequest, provider: AIProvider) -> ExplainResponse:
    raw, demo = None, provider.is_demo
    if not provider.is_demo:
        try:
            raw = await provider.complete_json(EXPLAIN_SYSTEM, f"<document>{req.text}</document>")
        except ProviderError as e:
            log.warning("Provider failed on explain (%s). Using basic extraction.", e)
            demo = True
    if raw is None:
        raw = rule_engine.explain_text(req.text)
    return ExplainResponse(
        simpleExplanation=str(raw.get("simpleExplanation") or "I could not make this simpler. Please ask a family member.")[:900],
        keyPoints=[str(x)[:200] for x in (raw.get("keyPoints") or [])][:6],
        amounts=[str(x)[:40] for x in (raw.get("amounts") or [])][:6],
        dates=[str(x)[:40] for x in (raw.get("dates") or [])][:6],
        actionRequired=bool(raw.get("actionRequired")),
        uncertainty=(str(raw["uncertainty"])[:300] if raw.get("uncertainty") else None),
        demoMode=demo,
    )
