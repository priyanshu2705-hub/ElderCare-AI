from fastapi import APIRouter

from providers import get_provider
from schemas.models import ChatRequest, ChatResponse, ExplainRequest, ExplainResponse
from services import assistant

router = APIRouter(prefix="/ai")


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    return await assistant.handle_chat(req, get_provider())


@router.post("/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest):
    return await assistant.explain(req, get_provider())
