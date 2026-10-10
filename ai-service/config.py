import os
from pydantic import BaseModel, Field


class Settings(BaseModel):
    # API credentials
    anthropic_api_key: str = Field(
        default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", "")
    )
    
    # Environment mode
    environment: str = Field(
        default_factory=lambda: os.getenv("ENVIRONMENT", "development")
    )
    
    # Provider selection: defaults to "mock" if ANTHROPIC_API_KEY is missing/empty
    default_provider: str = Field(
        default_factory=lambda: os.getenv(
            "DEFAULT_PROVIDER",
            "anthropic" if os.getenv("ANTHROPIC_API_KEY") else "mock"
        )
    )
    
    # Service host & port configuration
    host: str = Field(
        default_factory=lambda: os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    )
    port: int = Field(
        default_factory=lambda: int(os.getenv("AI_SERVICE_PORT", "8000"))
    )


# Global settings singleton
settings = Settings()