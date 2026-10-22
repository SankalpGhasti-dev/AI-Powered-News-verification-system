"""
Request schemas and input models for TruthLens investigations.
"""

from enum import Enum
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class InputType(str, Enum):
    """Type of input supplied for verification."""
    URL = "url"
    TEXT = "text"


class InvestigationRequest(BaseModel):
    """Input payload for POST /api/v1/investigations."""

    input_type: InputType = Field(
        ...,
        description="Type of verification input: either 'url' (web article) or 'text' (pasted claim/article)."
    )
    content: str = Field(
        ...,
        description="The target URL or raw article text to be investigated."
    )

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Input content cannot be empty or contain only whitespace.")
        return trimmed

    def validate_input_bounds(self, min_chars: int = 15, max_chars: int = 50000, max_url_len: int = 2048) -> None:
        """Domain-level validation for content length and URL syntax."""
        trimmed = self.content.strip()

        if self.input_type == InputType.URL:
            if len(trimmed) > max_url_len:
                raise ValueError(f"URL length ({len(trimmed)}) exceeds maximum allowed ({max_url_len} characters).")
            if not (trimmed.startswith("http://") or trimmed.startswith("https://")):
                raise ValueError("URL must begin with 'http://' or 'https://'.")
            # Basic sanity check for valid URL characters
            if re.search(r"\s", trimmed):
                raise ValueError("URL cannot contain whitespace characters.")
        else:
            if len(trimmed) < min_chars:
                raise ValueError(
                    f"Pasted text is too brief ({len(trimmed)} characters). "
                    f"Please provide at least {min_chars} characters for meaningful verification."
                )
            if len(trimmed) > max_chars:
                raise ValueError(
                    f"Pasted text exceeds maximum limit ({len(trimmed)} > {max_chars} characters). "
                    "Please provide a shorter article excerpt."
                )
