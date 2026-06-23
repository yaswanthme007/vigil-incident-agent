"""
Sentinel AI Service — Gemini Integration Layer

All Gemini API calls are routed through this service.
Provides structured JSON output, retry handling, and
fallback mock responses for reliability.
"""

import json
import logging
import re
from pathlib import Path
from typing import Optional

from app.config.settings import settings
from app.schemas.analysis import ThreatAnalysisResponse

logger = logging.getLogger("sentinel.ai_service")

# Resolve prompt template directory
PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(template_name: str) -> str:
    """Load a prompt template from the prompts directory."""
    path = PROMPTS_DIR / template_name
    if not path.exists():
        logger.error(f"Prompt template not found: {path}")
        raise FileNotFoundError(f"Prompt template missing: {template_name}")
    return path.read_text(encoding="utf-8")


def _extract_json(text: str) -> dict:
    """
    Extract a JSON object from Gemini's response text.
    Handles cases where the model wraps JSON in markdown fences.
    """
    # Strip markdown code fences if present
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", cleaned, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    return json.loads(cleaned)


def _clamp(value: int, lo: int = 0, hi: int = 100) -> int:
    """Clamp an integer to [lo, hi] range."""
    return max(lo, min(hi, value))


def _validate_response(data: dict, source: str = "gemini") -> ThreatAnalysisResponse:
    """
    Validate and normalize the parsed JSON into a ThreatAnalysisResponse.
    Applies score clamping and ensures all required fields exist.
    """
    return ThreatAnalysisResponse(
        threat_score=_clamp(int(data.get("threat_score", 50))),
        confidence=_clamp(int(data.get("confidence", 50))),
        category=str(data.get("category", "Unknown")),
        threat_level=str(data.get("threat_level", "Moderate")),
        red_flags=list(data.get("red_flags", [])),
        scam_dna=dict(data.get("scam_dna", {})),
        risk_breakdown=dict(data.get("risk_breakdown", {})),
        protection_plan=list(data.get("protection_plan", [])),
        analysis_source=source,
    )


def _with_source(response: ThreatAnalysisResponse, source: str) -> ThreatAnalysisResponse:
    response.analysis_source = source
    return response


# ---------------------------------------------------------------------------
# Fallback mock responses (used when Gemini is unavailable)
# ---------------------------------------------------------------------------

def _fallback_text_response(text: str) -> ThreatAnalysisResponse:
    """Deterministic fallback for text analysis."""
    text_lower = text.lower()
    is_suspicious = any(kw in text_lower for kw in ("win", "urgent", "lottery", "prize", "click", "verify"))
    if is_suspicious:
        return ThreatAnalysisResponse(
            threat_score=68, confidence=72, category="Advance-fee Scam",
            threat_level="High",
            red_flags=["Urgency language detected", "Unsolicited financial incentive"],
            scam_dna={"Urgency hook": "High", "Pretext incentive": "Verified", "Sender mismatch": "Moderate"},
            risk_breakdown={"urgency_sentiment": 80, "financial_coercion": 70, "information_gathering": 45},
            protection_plan=["Flag & quarantine sender domain", "Advise caution to recipients"],
        )
    return ThreatAnalysisResponse(
        threat_score=28, confidence=75, category="Suspicious Text",
        threat_level="Safe",
        red_flags=["Minor influence tactics"],
        scam_dna={"Incentive bias": "Low", "Suspicious link": "Negative", "Redirection logic": "Negative"},
        risk_breakdown={"urgency_sentiment": 25, "financial_coercion": 15, "information_gathering": 20},
        protection_plan=["Flag for manual review", "No immediate action required"],
    )


def _fallback_url_response(url: str) -> ThreatAnalysisResponse:
    """Deterministic fallback for URL analysis."""
    url_lower = url.lower()
    is_suspicious = any(kw in url_lower for kw in ("secure-login", "recovery", "verify", "update-account", "signin"))
    if is_suspicious:
        return ThreatAnalysisResponse(
            threat_score=82, confidence=78, category="Phishing Link",
            threat_level="High",
            red_flags=["Domain spoofing detected", "Subdomain pattern anomaly"],
            scam_dna={"Sender mismatch": "High", "Urgency hook": "Verified", "Pretext incentive": "Low"},
            risk_breakdown={"domain_reputation": 85, "security_headers": 40, "heuristic_flags": 75},
            protection_plan=["Block domain in firewall", "Force-expire active sessions"],
        )
    return ThreatAnalysisResponse(
        threat_score=10, confidence=90, category="Safe Website",
        threat_level="Safe",
        red_flags=[],
        scam_dna={"Urgency signals": "Clean", "Impersonation markers": "Clean", "Exploit vectors": "Clean"},
        risk_breakdown={"domain_reputation": 8, "security_headers": 92, "heuristic_flags": 5},
        protection_plan=["Mark sample safe in system", "No firewall block required"],
    )


def _fallback_image_response(filename: Optional[str], image_url: Optional[str]) -> ThreatAnalysisResponse:
    """Deterministic fallback for image analysis."""
    name_check = (filename or "").lower() + (image_url or "").lower()
    is_suspicious = any(kw in name_check for kw in ("wire", "invoice", "transfer", "payment", "login"))
    if is_suspicious:
        return ThreatAnalysisResponse(
            threat_score=88, confidence=80, category="Wire Transfer Fraud",
            threat_level="Critical",
            red_flags=["Authority spoof detected", "Urgency indicators present", "Suspicious request for funds"],
            scam_dna={"Authority spoof": "Verified", "Payment lure": "High", "Credential capture": "Critical"},
            risk_breakdown={"social_engineering": 85, "impersonation": 90, "malicious_links": 35},
            protection_plan=["Flag & quarantine sender domain", "Force-expire active sessions", "Distribute phish-marker block"],
        )
    return ThreatAnalysisResponse(
        threat_score=45, confidence=70, category="Phishing Page",
        threat_level="Moderate",
        red_flags=["Possible impersonation patterns"],
        scam_dna={"Authority spoof": "Moderate", "Payment lure": "Low", "Credential capture": "Moderate"},
        risk_breakdown={"social_engineering": 50, "impersonation": 55, "malicious_links": 40},
        protection_plan=["Warn recipient about potential scam", "Run host check scans"],
    )


# ---------------------------------------------------------------------------
# AIService — Primary Gemini Integration Class
# ---------------------------------------------------------------------------

class AIService:
    """
    Centralized AI service that wraps all Gemini API interactions.
    Provides analyze_text(), analyze_url(), analyze_image(), and
    generate_protection_plan() with automatic retry and fallback.
    """

    MAX_RETRIES = 2

    def __init__(self) -> None:
        self._client = None
        self._model_name = "gemini-2.0-flash"
        self._initialized = False
        self._initialize()

    def _initialize(self) -> None:
        """
        Lazily initialize the Gemini client.
        If the API key is missing or the SDK isn't installed, the service
        falls back to mock responses gracefully.
        """
        api_key = settings.GEMINI_API_KEY.strip()
        if not api_key:
            logger.warning("GEMINI_API_KEY not set — AI service will use fallback mock responses")
            return

        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
            self._initialized = True
            logger.info("Gemini AI service initialized successfully")
        except ImportError:
            logger.warning("google-genai SDK not installed — AI service will use fallback mock responses")
        except Exception as exc:
            logger.error(f"Failed to initialize Gemini client: {exc}")

    @property
    def is_available(self) -> bool:
        return self._initialized and self._client is not None

    # ------------------------------------------------------------------
    # Core query method with retry + fallback
    # ------------------------------------------------------------------

    def _query_gemini(self, prompt: str) -> Optional[dict]:
        """
        Send a prompt to Gemini and parse the JSON response.
        Retries up to MAX_RETRIES on failure.
        Returns parsed dict on success, None on failure.
        """
        if not self.is_available:
            return None

        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                response = self._client.models.generate_content(
                    model=self._model_name,
                    contents=prompt,
                )
                raw_text = response.text
                if not raw_text:
                    logger.warning(f"Gemini returned empty response (attempt {attempt})")
                    continue

                parsed = _extract_json(raw_text)
                logger.info(f"Gemini response parsed successfully (attempt {attempt})")
                return parsed

            except json.JSONDecodeError as exc:
                last_error = exc
                logger.warning(
                    "JSON parse error from Gemini (attempt %s): %s",
                    attempt,
                    exc,
                )
            except Exception as exc:
                last_error = exc
                logger.error(
                    "Gemini API error (attempt %s): %s",
                    attempt,
                    exc,
                    exc_info=True,
                )

        logger.error(f"All {self.MAX_RETRIES} Gemini attempts failed. Last error: {last_error}")
        return None

    # ------------------------------------------------------------------
    # Public Analysis Methods
    # ------------------------------------------------------------------

    def analyze_text(self, text: str) -> ThreatAnalysisResponse:
        """Analyze suspicious text/message content for threats."""
        if not self.is_available:
            logger.info("Gemini unavailable — using fallback for text analysis")
            return _with_source(_fallback_text_response(text), "fallback")

        try:
            template = _load_prompt("text_analysis.txt")
            prompt = template.replace("{content}", text)
            result = self._query_gemini(prompt)
            if result:
                return _validate_response(result, "gemini")
        except Exception as exc:
            logger.error("Text analysis failed, using fallback: %s", exc, exc_info=True)

        logger.warning("Gemini text analysis failed — using fallback response")
        return _with_source(_fallback_text_response(text), "fallback")

    def analyze_url(self, url: str) -> ThreatAnalysisResponse:
        """Analyze suspicious URL for phishing/malware indicators."""
        if not self.is_available:
            logger.info("Gemini unavailable — using fallback for URL analysis")
            return _with_source(_fallback_url_response(url), "fallback")

        try:
            template = _load_prompt("url_analysis.txt")
            prompt = template.replace("{url}", url)
            result = self._query_gemini(prompt)
            if result:
                return _validate_response(result, "gemini")
        except Exception as exc:
            logger.error("URL analysis failed, using fallback: %s", exc, exc_info=True)

        logger.warning("Gemini URL analysis failed — using fallback response")
        return _with_source(_fallback_url_response(url), "fallback")

    def analyze_image(
        self,
        filename: Optional[str] = None,
        image_url: Optional[str] = None,
        extracted_text: Optional[str] = None,
        ocr_confidence: Optional[float] = None,
        ocr_source: Optional[str] = None,
    ) -> ThreatAnalysisResponse:
        """Analyze screenshot/image content and extracted OCR text for threat indicators."""
        if not self.is_available:
            logger.info("Gemini unavailable — using fallback for image analysis")
            fallback_obj = _fallback_image_response(filename, image_url)
            fallback_obj.ocr_confidence = ocr_confidence
            fallback_obj.extracted_text = extracted_text
            fallback_obj.ocr_source = ocr_source
            return _with_source(fallback_obj, "fallback")

        try:
            template = _load_prompt("image_analysis.txt")
            prompt = (
                template.replace("{filename}", filename or "unknown")
                .replace("{image_url}", image_url or "none")
                .replace("{extracted_text}", extracted_text or "No text detected via OCR")
            )
            result = self._query_gemini(prompt)
            if result:
                response_obj = _validate_response(result, "gemini")
                response_obj.ocr_confidence = ocr_confidence
                response_obj.extracted_text = extracted_text
                response_obj.ocr_source = ocr_source
                return response_obj
        except Exception as exc:
            logger.error("Image analysis failed, using fallback: %s", exc, exc_info=True)

        logger.warning("Gemini image analysis failed — using fallback response")
        fallback_obj = _fallback_image_response(filename, image_url)
        fallback_obj.ocr_confidence = ocr_confidence
        fallback_obj.extracted_text = extracted_text
        fallback_obj.ocr_source = ocr_source
        return _with_source(fallback_obj, "fallback")

    def generate_protection_plan(self, threat_data: dict) -> list[str]:
        """
        Generate a targeted protection plan based on threat analysis data.
        Returns a list of actionable mitigation steps.
        """
        try:
            prompt = (
                "You are Sentinel AI. Based on the following threat analysis data, "
                "generate a concise list of 3-5 actionable protection steps. "
                "Return ONLY a JSON array of strings, no explanation.\n\n"
                f"Threat Data:\n{json.dumps(threat_data, indent=2)}"
            )
            result = self._query_gemini(prompt)
            if result and isinstance(result, list):
                return [str(item) for item in result]
        except Exception as exc:
            logger.error(f"Protection plan generation failed: {exc}")

        # Fallback plan
        return [
            "Flag & quarantine sender domain",
            "Force-expire active sessions",
            "Distribute phish-marker block",
        ]


# Singleton instance — import this throughout the app
ai_service = AIService()
