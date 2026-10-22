"""
Gemini Client Integration for TruthLens.
Uses Google Gemini API for structured factual claim extraction and
constrained explanation synthesis.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import Settings, get_settings
from app.core.errors import ExternalAPIError

logger = logging.getLogger(__name__)


class GeminiClient:
    """Client for Google Gemini Generative Language REST API."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.api_key = self.settings.GEMINI_API_KEY
        self.model = self.settings.GEMINI_MODEL
        self.has_key = self.settings.has_gemini_key

    async def _post_generate_content(
        self, prompt: str, system_instruction: Optional[str] = None, json_mode: bool = True
    ) -> str:
        """Execute a generateContent call against Gemini API."""
        if not self.has_key:
            raise ExternalAPIError("Gemini", "GEMINI_API_KEY is not configured.", status_code=401)

        url = f"{self.BASE_URL}/{self.model}:generateContent?key={self.api_key}"

        body: Dict[str, Any] = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,  # Low temperature for factual precision
            }
        }

        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        if system_instruction:
            body["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, json=body)
            except httpx.RequestError as exc:
                raise ExternalAPIError("Gemini", f"Network connection failed: {exc}")

        if response.status_code == 429:
            raise ExternalAPIError("Gemini", "Rate limit exceeded (HTTP 429).", status_code=429)
        if response.status_code != 200:
            raise ExternalAPIError("Gemini", f"API returned HTTP {response.status_code}: {response.text}", status_code=response.status_code)

        data = response.json()
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                raise ExternalAPIError("Gemini", "No candidate text returned by model.")
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise ExternalAPIError("Gemini", "Empty content parts returned by model.")
            return parts[0].get("text", "")
        except (KeyError, IndexError) as exc:
            raise ExternalAPIError("Gemini", f"Unexpected response schema: {exc}")

    async def extract_factual_claims(self, article_text: str, title: str = "") -> Dict[str, Any]:
        """
        Extract 2 to 5 key atomic factual claims from the article.
        Returns a dict with 'summary' and 'claims' list.
        """
        if not self.has_key and self.settings.ENABLE_MOCK_FALLBACK:
            return self._mock_claim_extraction(article_text, title)

        system_prompt = (
            "You are a rigorous, neutral news analyst for TruthLens. "
            "Your task is ONLY to extract key factual assertions made by the article. "
            "DO NOT evaluate whether claims are true or false. "
            "Output MUST be strictly valid JSON matching this schema:\n"
            "{\n"
            '  "summary": "1-2 sentence neutral summary of what the article claims",\n'
            '  "claims": [\n'
            '    {\n'
            '      "id": "CLM-01",\n'
            '      "claim_text": "Specific, verifiable assertion",\n'
            '      "entity": "Primary entity or subject",\n'
            '      "category": "statistic | quote | event | policy | scientific"\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        user_prompt = (
            f"Article Title: {title}\n\n"
            f"Article Content:\n{article_text[:6000]}\n\n"
            "Extract 2 to 5 specific, falsifiable factual assertions."
        )

        try:
            raw_json = await self._post_generate_content(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_mode=True
            )
            return self._parse_json_response(raw_json)
        except Exception as exc:
            logger.warning("Gemini claim extraction failed: %s. Using heuristic fallback.", exc)
            if self.settings.ENABLE_MOCK_FALLBACK:
                return self._mock_claim_extraction(article_text, title)
            raise

    async def synthesize_explanation(
        self,
        article_title: str,
        claims: List[Dict[str, Any]],
        evidence: List[Dict[str, Any]],
        score: int,
        rating_label: str,
    ) -> Dict[str, Any]:
        """
        Synthesize an objective explanation of the verification results.
        Enforces strict constraints:
        - Must NOT invent sources or cite documents not in the evidence list.
        - Must NOT alter or recalculate the backend credibility score.
        """
        if not self.has_key and self.settings.ENABLE_MOCK_FALLBACK:
            return self._mock_explanation(article_title, claims, evidence, score, rating_label)

        system_prompt = (
            "You are the senior editorial explanation engine for TruthLens news verification. "
            "Your job is to clearly explain the investigation findings to readers.\n\n"
            "CRITICAL CONSTRAINTS:\n"
            "1. You MUST accept the backend-computed credibility score of {score}/100 ({rating_label}). Do NOT invent or alter this score.\n"
            "2. You MUST NOT invent any sources, external facts, or URLs not present in the provided evidence list.\n"
            "3. Ground all statements directly in the verified claims and retrieved evidence.\n"
            "4. Return strictly valid JSON adhering to:\n"
            "{\n"
            '  "summary": "2-3 sentence overview of findings",\n'
            '  "key_findings": ["Finding 1", "Finding 2"],\n'
            '  "evidence_synthesis": "Detailed paragraph explaining how evidence relates to claims",\n'
            '  "limitations": ["Evidentiary gap or limitation 1", "Limitation 2"]\n'
            "}"
        )

        claims_json = json.dumps(claims, indent=2)
        evidence_json = json.dumps(evidence, indent=2)

        user_prompt = (
            f"Article Under Review: {article_title}\n"
            f"Calculated Score: {score}/100 ({rating_label})\n\n"
            f"Verified Claims & Verdicts:\n{claims_json}\n\n"
            f"Retrieved Evidence & Sources:\n{evidence_json}\n\n"
            "Synthesize an objective, neutral explanation strictly following the instructions."
        )

        try:
            raw_json = await self._post_generate_content(
                prompt=user_prompt,
                system_instruction=system_prompt,
                json_mode=True
            )
            return self._parse_json_response(raw_json)
        except Exception as exc:
            logger.warning("Gemini explanation synthesis failed: %s. Using heuristic fallback.", exc)
            if self.settings.ENABLE_MOCK_FALLBACK:
                return self._mock_explanation(article_title, claims, evidence, score, rating_label)
            raise

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse raw response text into JSON, stripping code fences if present."""
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        elif clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()
        try:
            return json.loads(clean)
        except json.JSONDecodeError:
            # Fallback regex search for JSON object
            match = re.search(r"\{.*\}", clean, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            raise ValueError(f"Could not parse valid JSON from AI response: {text[:200]}")

    def _mock_claim_extraction(self, text: str, title: str) -> Dict[str, Any]:
        """Deterministic mock fallback when API key is unconfigured."""
        sentences = [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 25]
        selected = sentences[:3] if sentences else ["Article asserts core statement regarding reported events."]

        claims = []
        for idx, sentence in enumerate(selected, 1):
            claims.append({
                "id": f"CLM-{idx:02d}",
                "claim_text": sentence,
                "entity": title or "Subject Entity",
                "category": "factual_assertion"
            })

        return {
            "summary": f"Article discusses {title or 'reported events'} and presents several factual assertions.",
            "claims": claims
        }

    def _mock_explanation(
        self,
        article_title: str,
        claims: List[Dict[str, Any]],
        evidence: List[Dict[str, Any]],
        score: int,
        rating_label: str
    ) -> Dict[str, Any]:
        """Deterministic mock explanation when Gemini key is unconfigured."""
        supported_count = sum(1 for c in claims if c.get("verdict") == "Supported")
        contradicted_count = sum(1 for c in claims if c.get("verdict") == "Contradicted")
        insufficient_count = sum(1 for c in claims if c.get("verdict") == "Insufficient Evidence")
        mixed_count = sum(1 for c in claims if c.get("verdict") == "Mixed")

        key_findings = []
        if contradicted_count > 0:
            key_findings.append(f"{contradicted_count} claim(s) directly contradicted by independent records or fact-checks.")
        if supported_count > 0:
            key_findings.append(f"{supported_count} claim(s) corroborated by documented reporting.")
        if insufficient_count > 0:
            key_findings.append(f"{insufficient_count} claim(s) have insufficient independent public documentation.")
        if not key_findings:
            key_findings.append("No conclusive external corroboration identified for evaluated statements.")

        return {
            "summary": (
                f"TruthLens evaluated {len(claims)} claim(s) concerning '{article_title or 'the submitted text'}'. "
                f"The overall evidence balance yielded a credibility score of {score}/100 ({rating_label})."
            ),
            "key_findings": key_findings,
            "evidence_synthesis": (
                f"Out of {len(evidence)} consulted source record(s), {supported_count} claim(s) found supporting documentation "
                f"and {contradicted_count} claim(s) encountered contradicting evidence. "
                f"Remaining assertions lacked corroborating registry or wire documentation."
            ),
            "limitations": [
                "Verification is restricted to open-source public reporting and registered fact-check databases.",
                "Lack of documentation does not by itself prove a statement is false, but reflects unverified status."
            ]
        }
