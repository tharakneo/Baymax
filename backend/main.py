import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from db.database import create_tables
from api.routes.chat import router as chat_router
from api.routes.scan import router as scan_router
from api.routes.track import router as track_router
from api.routes.insights import router as insights_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs on startup and shutdown."""
    print("🤖 BayMax is booting up...")
    create_tables()
    print("✅ Database tables ready")
    print("✅ BayMax is online. I am your personal healthcare companion.")
    yield
    print("🔴 BayMax is shutting down.")


app = FastAPI(
    title="BayMax AI",
    description="Your personal healthcare companion API",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(chat_router)
app.include_router(scan_router, prefix="/api/scan")
app.include_router(track_router, prefix="/api/track", tags=["track"])
app.include_router(insights_router, prefix="/api/insights", tags=["insights"])


@app.get("/")
async def root():
    return {
        "message": "Hello. I am BayMax, your personal healthcare companion.",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}