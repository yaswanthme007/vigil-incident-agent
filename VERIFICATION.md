# Sentinel AI — End-to-End Verification Checklist

## Prerequisites

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Set GEMINI_API_KEY in backend/.env

# Frontend
cd ..
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm install
```

Install Tesseract OCR on the host for live screenshot text extraction.

## Start Services

```bash
# Terminal 1 — Backend (dev reload)
cd backend
RELOAD=true HOST=127.0.0.1 python run.py

# Terminal 2 — Frontend
npm run dev
```

## Health Checks

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Expected when fully configured:

```json
{
  "status": "healthy",
  "service": "sentinel-backend",
  "ai_available": true,
  "ocr_available": true
}
```

## API Flow Tests

### Text Analysis

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze-text \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"URGENT: You won a lottery prize. Click here to claim now.\"}"
```

Verify response includes: `threat_score`, `confidence`, `category`, `threat_level`, `red_flags`, `scam_dna`, `risk_breakdown`, `protection_plan`, `analysis_source`.

### URL Analysis

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze-url \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://secure-login-verify-account.example.com\"}"
```

### Image Analysis (OCR → Gemini)

Use the analyze page UI to upload a PNG/JPG screenshot, or POST base64 payload to `/api/v1/analyze-image`.

Verify response includes: `extracted_text`, `ocr_confidence`, `ocr_source`.

## Frontend Flow

1. Open `http://localhost:3000/analyze`
2. Confirm backend health banner is absent when API + Gemini + OCR are configured
3. Run **Text**, **URL**, and **Screenshot** analyses
4. Confirm redirect to `/results` with live threat data
5. Open `/dashboard` and confirm feed, metrics, and leaderboard reflect completed scans

## Build Verification

```bash
npm run build
npx tsc --noEmit
cd backend && python -m unittest tests.test_ocr -v
```

## Checklist

- [ ] Text analysis works
- [ ] URL analysis works
- [ ] Screenshot analysis works
- [ ] OCR text extraction works (`ocr_source: "tesseract"`)
- [ ] Gemini responses work (`analysis_source: "gemini"`, `ai_available: true`)
- [ ] Results page renders live data
- [ ] Dashboard displays analysis output from session history
- [ ] `npm run build` passes
- [ ] Backend starts successfully
