"""BayMax AI — FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from api.routes import chat, scan, track, check

app = FastAPI(
    title="BayMax AI",
    description="Your personal AI-powered healthcare companion",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(chat.router, prefix="/api/chat", tags=["Talk to Me"])
app.include_router(scan.router, prefix="/api/scan", tags=["Scan Me"])
app.include_router(track.router, prefix="/api/track", tags=["Track Me"])
app.include_router(check.router, prefix="/api/check", tags=["Check Me"])


@app.get("/")
async def root():
    return {"message": "Hello, I am BayMax — your personal healthcare companion."}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
