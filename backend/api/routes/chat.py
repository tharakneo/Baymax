"""Talk to Me — Health Q&A chat endpoints powered by RAG."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []
    session_id: str


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a health question and get a BayMax-style response."""
    # TODO: Wire up RAG engine
    return ChatResponse(
        reply="Hello! I am BayMax, your personal healthcare companion. "
              "This endpoint will be powered by the RAG pipeline.",
        sources=[],
        session_id=request.session_id or "new-session",
    )


@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """Retrieve chat history for a session."""
    # TODO: Fetch from database
    return {"session_id": session_id, "messages": []}
