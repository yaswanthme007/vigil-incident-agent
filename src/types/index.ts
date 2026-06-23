export interface ThreatAnalysisResponse {
  threat_score: number;
  confidence: number;
  category: string;
  threat_level: "Safe" | "Moderate" | "High" | "Critical";
  red_flags: string[];
  scam_dna: Record<string, string | number>;
  risk_breakdown: Record<string, number>;
  protection_plan: string[];
  ocr_confidence?: number | null;
  extracted_text?: string | null;
  analysis_source?: "gemini" | "fallback" | null;
  ocr_source?: "tesseract" | "fallback" | null;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  ai_available: boolean;
  ocr_available: boolean;
}

export interface ImageAnalysisRequest {
  image_base64?: string | null;
  image_url?: string | null;
  filename?: string | null;
}

export interface UrlAnalysisRequest {
  url: string;
}

export interface TextAnalysisRequest {
  text: string;
}
