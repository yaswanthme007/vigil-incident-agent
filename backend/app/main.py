from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.api.endpoints import router as api_router
from app.utils.exceptions import setup_exception_handlers

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    description="Sentinel AI Core Security Analytics Backend API"
)

# Setup centralized error handling
setup_exception_handlers(app)

# Configure CORS
origins = []
if isinstance(settings.CORS_ORIGINS, list):
    origins = settings.CORS_ORIGINS
elif isinstance(settings.CORS_ORIGINS, str):
    origins = [settings.CORS_ORIGINS]

# Ensure standard localhost origins are present
localhost_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]
for o in localhost_origins:
    if o not in origins:
        origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https:\/\/.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include main API router under prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

# Root level health endpoint to satisfy GET /health requirement
@app.get("/health", tags=["System"])
async def root_health_check():
    return {
        "status": "healthy",
        "service": "sentinel-backend"
    }
