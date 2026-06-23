import {
  ThreatAnalysisResponse,
  ImageAnalysisRequest,
  UrlAnalysisRequest,
  TextAnalysisRequest,
  HealthCheckResponse,
} from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_PREFIX = "/api/v1";

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

function toApiError(error: unknown, fallbackMessage: string): ApiError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError(
      "Request timed out. Please check your connection or try again.",
      408
    );
  }
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(error.message || fallbackMessage);
  }
  return new ApiError(fallbackMessage);
}

export class ApiError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = "ApiError";
    if (status !== undefined) {
      this.status = status;
    }
    if (detail !== undefined) {
      this.detail = detail;
    }
  }
}

async function parseErrorDetail(response: Response): Promise<string> {
  let errorDetail = "Server returned an error";
  try {
    const errData = (await response.json()) as { detail?: string };
    errorDetail = errData.detail ?? errorDetail;
  } catch {
    // ignore JSON parse failures
  }
  return errorDetail;
}

export const sentinelApi = {
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${API_PREFIX}/health`, {
        method: "GET",
      }, 10000);

      if (!response.ok) {
        throw new ApiError("Backend health check failed.", response.status);
      }

      return (await response.json()) as HealthCheckResponse;
    } catch (error: unknown) {
      throw toApiError(
        error,
        "Unable to reach the Sentinel backend. Start the API server and try again."
      );
    }
  },

  async analyzeImage(
    request: ImageAnalysisRequest
  ): Promise<ThreatAnalysisResponse> {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${API_PREFIX}/analyze-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorDetail = await parseErrorDetail(response);
        throw new ApiError(
          `Image analysis request failed: ${response.statusText}`,
          response.status,
          errorDetail
        );
      }

      return (await response.json()) as ThreatAnalysisResponse;
    } catch (error: unknown) {
      throw toApiError(
        error,
        "Network error. Please make sure the backend server is running."
      );
    }
  },

  async analyzeUrl(
    request: UrlAnalysisRequest
  ): Promise<ThreatAnalysisResponse> {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${API_PREFIX}/analyze-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorDetail = await parseErrorDetail(response);
        throw new ApiError(
          `URL analysis request failed: ${response.statusText}`,
          response.status,
          errorDetail
        );
      }

      return (await response.json()) as ThreatAnalysisResponse;
    } catch (error: unknown) {
      throw toApiError(
        error,
        "Network error. Please make sure the backend server is running."
      );
    }
  },

  async analyzeText(
    request: TextAnalysisRequest
  ): Promise<ThreatAnalysisResponse> {
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}${API_PREFIX}/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorDetail = await parseErrorDetail(response);
        throw new ApiError(
          `Text analysis request failed: ${response.statusText}`,
          response.status,
          errorDetail
        );
      }

      return (await response.json()) as ThreatAnalysisResponse;
    } catch (error: unknown) {
      throw toApiError(
        error,
        "Network error. Please make sure the backend server is running."
      );
    }
  },
};
