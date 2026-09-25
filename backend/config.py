from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """
    Whiz Studio Backend Application Settings.
    Reads configuration values from environment variables or .env file.
    """
    PROJECT_NAME: str = "Whiz Studio API Engine"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "https://whizstudio.io",
        "https://www.whizstudio.io"
    ]
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "whiz_studio_super_secret_jwt_key_2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Optional Notification Webhooks
    SLACK_WEBHOOK_URL: str = os.getenv("SLACK_WEBHOOK_URL", "")
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    
    # SMTP Email Settings (for sending lead notifications)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    ALERT_RECIPIENT_EMAIL: str = os.getenv("ALERT_RECIPIENT_EMAIL", "leads@whizstudio.io")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
