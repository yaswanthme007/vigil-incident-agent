import base64
import logging
import httpx
from fastapi import APIRouter, status, HTTPException
from app.schemas.analysis import (
    ImageAnalysisRequest,
    UrlAnalysisRequest,
    TextAnalysisRequest,
    ThreatAnalysisResponse,
)
from app.services.ai_service import ai_service
from app.services.ocr_service import OCRService

logger = logging.getLogger("sentinel.endpoints")
router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "sentinel-backend",
        "ai_available": ai_service.is_available,
        "ocr_available": OCRService.is_available(),
    }

@router.post(
    "/analyze-image",
    response_model=ThreatAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
    summary="Analyze suspicious screenshot image",
    description="Submit image metadata/payload for OCR and AI-powered threat analysis. "
                "Falls back to heuristic mock responses if Gemini is unavailable.",
)
async def analyze_image(request: ImageAnalysisRequest):
    image_bytes = None
    
    # 1. Decode base64 or fetch from URL
    if request.image_base64:
        base64_data = request.image_base64
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
        
        try:
            image_bytes = base64.b64decode(base64_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 encoding for image data"
            )
            
    elif request.image_url:
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(request.image_url)
                if response.status_code == 200:
                    image_bytes = response.content
                else:
                    raise ValueError(f"HTTP status {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch image from URL {request.image_url}: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to fetch image from URL: {str(e)}"
            )
            
    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid image payload provided (must specify non-empty image_base64 or valid image_url)"
        )

    # 2. Extract text using OCR Service
    try:
        ocr_result = OCRService.extract_text_from_image(image_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"OCR execution failed unexpectedly: {e}", exc_info=True)
        ocr_result = {
            "ocr_confidence": 0.0,
            "extracted_text": "Failed to extract text from screenshot due to unexpected OCR engine error."
        }

    # 3. Perform AI analysis on the metadata and OCR-extracted text
    return ai_service.analyze_image(
        filename=request.filename,
        image_url=request.image_url,
        extracted_text=ocr_result["extracted_text"],
        ocr_confidence=ocr_result["ocr_confidence"],
        ocr_source=ocr_result.get("ocr_source"),
    )

@router.post(
    "/analyze-url",
    response_model=ThreatAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
    summary="Analyze suspicious link URL",
    description="Submit a URL for AI-powered threat analysis. "
                "Falls back to heuristic mock responses if Gemini is unavailable.",
)
async def analyze_url(request: UrlAnalysisRequest):
    return ai_service.analyze_url(url=request.url)

@router.post(
    "/analyze-text",
    response_model=ThreatAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis"],
    summary="Analyze suspicious message or email text",
    description="Submit text content for AI-powered threat analysis. "
                "Falls back to heuristic mock responses if Gemini is unavailable.",
)
async def analyze_text(request: TextAnalysisRequest):
    return ai_service.analyze_text(text=request.text)
