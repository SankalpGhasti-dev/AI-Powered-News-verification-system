"""Article text extraction and URL fetching."""

from dataclasses import dataclass
import logging
import re
from typing import Optional
from bs4 import BeautifulSoup

from app.core.config import Settings, get_settings
from app.core.errors import ArticleExtractionError
from app.core.ssrf import safe_fetch_url
from app.schemas.investigation import InputType, InvestigationRequest

logger = logging.getLogger(__name__)


@dataclass
class ProcessedArticle:
    title: str
    text: str
    url: Optional[str]
    word_count: int
    summary: str


class ArticleProcessor:
    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()

    async def process_input(self, request: InvestigationRequest) -> ProcessedArticle:
        request.validate_input_bounds(
            min_chars=self.settings.MIN_ARTICLE_CHARS,
            max_chars=self.settings.MAX_ARTICLE_CHARS,
            max_url_len=self.settings.MAX_URL_LENGTH
        )

        if request.input_type == InputType.TEXT:
            return self._process_text_input(request.content)
        else:
            return await self._process_url_input(request.content)

    def _process_text_input(self, text: str) -> ProcessedArticle:
        cleaned_text = re.sub(r"\r\n", "\n", text).strip()
        lines = [line.strip() for line in cleaned_text.split("\n") if line.strip()]

        if not lines:
            raise ArticleExtractionError("Submitted text contains no readable paragraphs.")

        if len(lines) > 1 and len(lines[0]) <= 140:
            title = lines[0]
            body_text = "\n\n".join(lines[1:])
        else:
            first_sentence = re.split(r"[.!?]+", lines[0])[0].strip()
            title = first_sentence[:100] if len(first_sentence) > 10 else "Pasted Statement / Article Excerpt"
            body_text = cleaned_text

        words = body_text.split()
        summary = " ".join(words[:45]) + ("..." if len(words) > 45 else "")

        return ProcessedArticle(
            title=title,
            text=body_text,
            url=None,
            word_count=len(words),
            summary=summary
        )

    async def _process_url_input(self, url: str) -> ProcessedArticle:
        logger.info("Safely fetching URL with SSRF checks: %s", url)

        html_content = await safe_fetch_url(
            url=url,
            timeout_seconds=self.settings.ARTICLE_FETCH_TIMEOUT_SECONDS,
            max_bytes=self.settings.MAX_ARTICLE_DOWNLOAD_BYTES,
            max_redirects=self.settings.MAX_REDIRECTS
        )

        return self.extract_from_html(html_content, url=url)

    def extract_from_html(self, html_content: str, url: Optional[str] = None) -> ProcessedArticle:
        soup = BeautifulSoup(html_content, "html.parser")

        for element in soup(["script", "style", "nav", "header", "footer", "aside",
                             "form", "noscript", "svg", "iframe", "template", "button"]):
            element.decompose()

        title = ""
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip()
        elif soup.title and soup.title.string:
            title = soup.title.string.strip()
        elif soup.find("h1"):
            title = soup.find("h1").get_text().strip()

        title = re.sub(r"\s+[|\-–—]\s+[^|\-–—]+$", "", title).strip()
        if not title:
            title = "Untitled Article"

        content_root = soup.find("article") or soup.find("main") or soup.find("body") or soup

        paragraphs = []
        for p in content_root.find_all("p"):
            text = p.get_text().strip()
            if len(text) > 30 and not any(kw in text.lower() for kw in ("subscribe now", "all rights reserved", "cookie policy", "privacy policy")):
                paragraphs.append(text)

        body_text = "\n\n".join(paragraphs).strip()

        if len(body_text) < 40:
            fallback_text = content_root.get_text(separator="\n", strip=True)
            cleaned_lines = [l for l in fallback_text.splitlines() if len(l) > 30]
            body_text = "\n\n".join(cleaned_lines).strip()

        if len(body_text) < 40:
            raise ArticleExtractionError(
                "Could not extract sufficient article text from the provided URL. "
                "The page may rely on dynamic client-side rendering or block automated extraction."
            )

        words = body_text.split()
        summary = " ".join(words[:45]) + ("..." if len(words) > 45 else "")

        return ProcessedArticle(
            title=title,
            text=body_text,
            url=url,
            word_count=len(words),
            summary=summary
        )
