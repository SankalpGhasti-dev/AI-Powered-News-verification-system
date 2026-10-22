"""
Custom exceptions and error models for TruthLens.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class TruthLensException(Exception):
    """Base exception for TruthLens domain errors."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class SSRFValidationError(TruthLensException):
    """Raised when a URL targets a restricted, local, or private network address."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="SSRF_PROHIBITED_TARGET", details=details)


class ArticleExtractionError(TruthLensException):
    """Raised when an article cannot be extracted or parsed from a URL."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="ARTICLE_EXTRACTION_FAILED", details=details)


class ExternalAPIError(TruthLensException):
    """Raised when an external API (GNews, FactCheck, Gemini) fails unexpectedly."""

    def __init__(self, service: str, message: str, status_code: Optional[int] = None):
        super().__init__(
            message=f"{service} API error: {message}",
            code="EXTERNAL_API_ERROR",
            details={"service": service, "status_code": status_code}
        )
