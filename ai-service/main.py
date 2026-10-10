import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from routes.chat import router as chat_router
from routes.documents import router as documents_router
from config import settings

# Configure structured audit logger (avoids recording patient PII / raw request payloads)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("eldercare.audit")

app = FastAPI(
    title="Eldercare AI Service",
    description="Accessible AI assistant, medical document parser, and safety triage platform for elder care.",
    version="1.0.0",
)

# Cross-Origin Resource Sharing (CORS) setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Privacy-preserving audit logging middleware
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    # Record request metadata safely without dumping body payloads
    logger.info(
        f"Method: {request.method} | Path: {request.url.path} | "
        f"Status: {response.status_code} | Duration: {duration:.3f}s"
    )
    return response

# Mount core routers
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint exposing runtime provider mode."""
    return {
        "status": "ok",
        "service": "eldercare-ai",
        "environment": settings.environment,
        "provider": settings.default_provider
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=(settings.environment == "development")
    )