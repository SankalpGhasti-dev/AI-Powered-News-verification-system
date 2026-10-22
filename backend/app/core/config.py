"""Application configuration loaded from environment."""

from functools import lru_cache
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    """Application settings read from environment variables."""

    PROJECT_NAME: str = "TruthLens API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GNEWS_API_KEY: str = os.getenv("GNEWS_API_KEY", "").strip()
    FACTCHECK_API_KEY: str = os.getenv("FACTCHECK_API_KEY", "").strip()

    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest").strip()

    APP_ENV: str = os.getenv("APP_ENV", "development").lower()
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    _raw_cors = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5500,http://localhost:8000,"
        "http://127.0.0.1:5500,http://127.0.0.1:3000,http://127.0.0.1:8000,http://127.0.0.1:8080"
    )
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]

    MIN_ARTICLE_CHARS: int = int(os.getenv("MIN_ARTICLE_CHARS", "15"))
    MAX_ARTICLE_CHARS: int = int(os.getenv("MAX_ARTICLE_CHARS", "50000"))
    MAX_URL_LENGTH: int = int(os.getenv("MAX_URL_LENGTH", "2048"))
    ARTICLE_FETCH_TIMEOUT_SECONDS: float = float(os.getenv("ARTICLE_FETCH_TIMEOUT_SECONDS", "8.0"))
    MAX_ARTICLE_DOWNLOAD_BYTES: int = int(os.getenv("MAX_ARTICLE_DOWNLOAD_BYTES", str(3 * 1024 * 1024)))
    MAX_REDIRECTS: int = int(os.getenv("MAX_REDIRECTS", "3"))

    ENABLE_MOCK_FALLBACK: bool = os.getenv("ENABLE_MOCK_FALLBACK", "true").lower() in ("true", "1", "yes")

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.GEMINI_API_KEY and self.GEMINI_API_KEY != "your_gemini_api_key_here")

    @property
    def has_gnews_key(self) -> bool:
        return bool(self.GNEWS_API_KEY and self.GNEWS_API_KEY != "your_gnews_api_key_here")

    @property
    def has_factcheck_key(self) -> bool:
        return bool(self.FACTCHECK_API_KEY and self.FACTCHECK_API_KEY != "your_factcheck_api_key_here")


@lru_cache()
def get_settings() -> Settings:
    """Return cached instance of application settings."""
    return Settings()
