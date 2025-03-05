import os
import secrets
from typing import List, Optional

from pydantic import AnyHttpUrl, BaseSettings, validator

class Settings(BaseSettings):
    # Base
    API_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Telegram CRM"
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[AnyHttpUrl] = []
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[AnyHttpUrl]:
        if isinstance(v, str) and not v.startswith("["):
            return [item.strip() for item in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # Telegram
    TELEGRAM_API_ID: Optional[int] = None
    TELEGRAM_API_HASH: Optional[str] = None
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_PHONE: Optional[str] = None
    TELEGRAM_AUTO_START: bool = False
    TELEGRAM_SESSION_NAME: str = "telegram_crm"
    
    # ML
    ML_MODEL_PATH: str = "./ml_models"
    
    # AI Categorization
    AI_PROVIDER: str = "openai"  # "openai" or "anthropic"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-haiku-20240307"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings() 