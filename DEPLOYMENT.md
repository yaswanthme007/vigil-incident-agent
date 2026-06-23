# Sentinel AI — Deployment Guide

This document covers environment setup and production startup for the Sentinel AI frontend (Next.js) and backend (FastAPI).

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.11+ (3.12 recommended)
- **Tesseract OCR** (system package, required for real screenshot text extraction)
- **Google Gemini API key** (required for live AI analysis)

---

## Frontend Environment Variables

Copy the example file and set your backend URL:

```bash
cp .env.example .env.local
```

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend (no trailing slash) | `http://127.0.0.1:8000` |

For production, set this to your deployed backend URL (e.g. `https://api.yourdomain.com`).

### Frontend commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

---

## Backend Environment Variables

Copy the backend example file and configure secrets:

```bash
cd backend
cp .env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `PROJECT_NAME` | API title | `Sentinel AI` |
| `API_V1_STR` | API route prefix | `/api/v1` |
| `CORS_ORIGINS` | Allowed frontend origins (JSON array or comma-separated) | `["http://localhost:3000"]` |

Optional runtime settings for `run.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Bind address |
| `PORT` | `8000` | Listen port |
| `RELOAD` | `false` | Set to `true` for local hot reload |

---

## Gemini API Key Setup

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Create an API key for your project.
3. Add it to `backend/.env`:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Restart the backend.
5. Verify live AI is enabled:

   ```bash
   curl http://127.0.0.1:8000/api/v1/health
   ```

   Response should include `"ai_available": true`.

If the key is missing, the backend still runs but returns heuristic fallback responses instead of Gemini output.

---

## Tesseract Installation

Tesseract is a **system dependency** (not installed via pip). The Python package `pytesseract` requires the Tesseract binary on your PATH.

### Windows

1. Download the installer from [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki).
2. Install and note the install path (e.g. `C:\Program Files\Tesseract-OCR`).
3. Add the install directory to your system `PATH`.
4. Verify:

   ```bash
   tesseract --version
   ```

### macOS

```bash
brew install tesseract
tesseract --version
```

### Linux (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr
tesseract --version
```

### Docker / production servers

Include Tesseract in your container image or server provisioning step, for example:

```dockerfile
RUN apt-get update && apt-get install -y tesseract-ocr && rm -rf /var/lib/apt/lists/*
```

If Tesseract is unavailable, image analysis falls back to mock OCR text (see `/api/v1/health` and server logs).

---

## Backend Startup

### Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Production (default)

```bash
cd backend
python run.py
```

Defaults: `host=0.0.0.0`, `reload=False`, port `8000`.

### Local development with hot reload

```bash
cd backend
RELOAD=true HOST=127.0.0.1 python run.py
```

On Windows PowerShell:

```powershell
$env:RELOAD="true"; $env:HOST="127.0.0.1"; python run.py
```

### Verify backend

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/health
```

API docs: `http://127.0.0.1:8000/docs`

---

## Full-Stack Local Development

1. Start the backend:

   ```bash
   cd backend
   RELOAD=true HOST=127.0.0.1 python run.py
   ```

2. Configure the frontend:

   ```bash
   cp .env.example .env.local
   ```

3. Start the frontend:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

---

## Production Checklist

- [ ] `GEMINI_API_KEY` set on the backend host
- [ ] Tesseract installed on the backend host
- [ ] `NEXT_PUBLIC_API_URL` points to the deployed backend
- [ ] `CORS_ORIGINS` includes your frontend production URL
- [ ] `npm run build` passes
- [ ] Backend health check returns `ai_available: true` (when Gemini is configured)
- [ ] Backend bound to `0.0.0.0` behind a reverse proxy or platform load balancer
