"""Tests for input validation and article processor."""

import pytest
from pydantic import ValidationError

from app.core.errors import ArticleExtractionError
from app.schemas.investigation import InputType, InvestigationRequest
from app.services.article_processor import ArticleProcessor

def test_input_validation_empty_content():
    """Empty or whitespace-only content must be rejected."""
    with pytest.raises(ValidationError):
        InvestigationRequest(input_type=InputType.TEXT, content="   ")

def test_input_validation_text_too_short():
    """Text below minimum character threshold must be rejected."""
    req = InvestigationRequest(input_type=InputType.TEXT, content="Too short")
    with pytest.raises(ValueError) as exc:
        req.validate_input_bounds(min_chars=15)
    assert "too brief" in str(exc.value).lower()

def test_input_validation_text_too_long():
    """Text exceeding max characters must be rejected."""
    req = InvestigationRequest(input_type=InputType.TEXT, content="A" * 60000)
    with pytest.raises(ValueError) as exc:
        req.validate_input_bounds(max_chars=50000)
    assert "exceeds maximum limit" in str(exc.value).lower()

def test_input_validation_url_scheme():
    """URL must start with http:// or https://."""
    req = InvestigationRequest(input_type=InputType.URL, content="ftp://not-allowed.com")
    with pytest.raises(ValueError) as exc:
        req.validate_input_bounds()
    assert "must begin with" in str(exc.value).lower()

@pytest.mark.asyncio
async def test_process_text_input_valid():
    """Valid pasted text should be processed directly without scraping."""
    processor = ArticleProcessor()
    text = (
        "Leaked Memo Alleges Energy Rationing Starting November\n\n"
        "According to an alleged government circular, industrial energy quotas will take effect "
        "next month across all major production facilities in the capital region. "
        "Representatives from manufacturing groups expressed concern over potential supply disruptions."
    )
    req = InvestigationRequest(input_type=InputType.TEXT, content=text)
    article = await processor.process_input(req)

    assert article.url is None
    assert article.word_count > 20
    assert "Energy Rationing" in article.title
    assert "industrial energy quotas" in article.text
    assert len(article.summary) > 10

def test_html_extraction_cleaning(sample_news_html):
    """Article processor must clean boilerplate and extract title and body correctly."""
    processor = ArticleProcessor()
    article = processor.extract_from_html(sample_news_html, url="https://example.com/news/1")

    assert "Central Bank Releases Q3 Economic Stabilization Plan" in article.title
    assert "Monetary Authority announced" in article.text
    assert "reserve requirements will remain steady" in article.text
    # Boilerplate from header/footer must be stripped
    assert "Header Banner" not in article.text
    assert "Copyright 2026" not in article.text
    assert article.word_count > 15

def test_html_extraction_empty_body():
    """HTML containing no readable article paragraphs should raise ArticleExtractionError."""
    processor = ArticleProcessor()
    empty_html = "<html><body><div></div></body></html>"
    with pytest.raises(ArticleExtractionError) as exc:
        processor.extract_from_html(empty_html, url="https://example.com/empty")
    assert "could not extract sufficient article text" in str(exc.value).lower()
