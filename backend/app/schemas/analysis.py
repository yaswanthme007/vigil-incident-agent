from pydantic import BaseModel, Field
from typing import List, Dict, Union

class ImageAnalysisRequest(BaseModel):
    image_base64: Union[str, None] = Field(None, description="Base64 encoded string of the screenshot image")
    image_url: Union[str, None] = Field(None, description="URL of the screenshot image")
    filename: Union[str, None] = Field(None, description="Filename of the uploaded image")

class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., description="The suspicious URL to analyze")

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., description="Suspicious text or message content to analyze")

class ThreatAnalysisResponse(BaseModel):
    threat_score: int = Field(..., ge=0, le=100, description="Threat score out of 100")
    confidence: int = Field(..., ge=0, le=100, description="AI model confidence score out of 100")
    category: str = Field(..., description="The type/category of the threat detected")
    threat_level: str = Field(..., description="Calculated threat level (Safe, Moderate, High, Critical)")
    red_flags: List[str] = Field(..., description="List of key indicators of compromise or fraud detected")
    scam_dna: Dict[str, str] = Field(..., description="Key-value breakdown of Scam DNA Markers (e.g. Authority spoof, Payment lure)")
    risk_breakdown: Dict[str, Union[str, int]] = Field(..., description="Specific scoring metrics/risk dimensions")
    protection_plan: List[str] = Field(..., description="Mitigation steps/checklist to protect the user")
    ocr_confidence: Union[float, None] = Field(None, description="OCR text extraction confidence score (0-100)")
    extracted_text: Union[str, None] = Field(None, description="Raw text extracted from the screenshot via OCR")
    analysis_source: Union[str, None] = Field(None, description="Analysis engine source: gemini or fallback")
    ocr_source: Union[str, None] = Field(None, description="OCR engine source: tesseract or fallback")

