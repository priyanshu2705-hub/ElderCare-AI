from datetime import date
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from providers import ProviderError, get_provider
from schemas.models import DocumentAnalysis
from services.vision_service import BadImage, VisionService, sample_analysis

router = APIRouter(prefix="/ai")
MAX_BYTES = 6 * 1024 * 1024


@router.post("/analyze-document", response_model=DocumentAnalysis)
async def analyze_document(file: UploadFile = File(...), today: Optional[str] = Form(None)):
    raw = await file.read(MAX_BYTES + 1)
    if not raw:
        raise HTTPException(400, "Empty image")
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "Image too large")
    try:
        date.fromisoformat(today or "")
    except ValueError:
        today = date.today().isoformat()
    try:
        return await VisionService(get_provider()).analyze(raw, today)
    except BadImage:
        raise HTTPException(400, "Not a valid image")
    except ProviderError:
        raise HTTPException(503, "AI unavailable")


@router.post("/analyze-document/sample", response_model=DocumentAnalysis)
async def analyze_sample():
    return sample_analysis(date.today().isoformat())
