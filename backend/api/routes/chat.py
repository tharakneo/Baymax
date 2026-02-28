from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from db.database import get_db
from db.models import Conversation, Message
from core.rag_engine import build_rag_chain, get_baymax_response
from core.baymax_persona import BAYMAX_GREETING, get_greeting, get_system_prompt
from core.context_engine import is_health_related, get_user_context

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ─── Shared RAG chain ─────────────────────────────────────────────────────────
_chain = None

def get_chain():
    global _chain
    if _chain is None:
        _chain = build_rag_chain()
    return _chain

# ─── In-memory fallback history (used when DB is unavailable) ─────────────────
_memory_store: dict[str, list] = {}
_next_conv_id: int = 1


# ─── Request / Response Schemas ──────────────────────────────────────────────
class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None


class ChatMessageResponse(BaseModel):
    answer: str
    conversation_id: int
    sources: list[str] = []
    context_used: bool = False  # whether health context was injected


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("/greeting")
async def get_greeting_endpoint(user_name: Optional[str] = None):
    """Returns Baymax's opening greeting."""
    return {"message": get_greeting(user_name or "")}


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
):
    global _next_conv_id
    db_available = True

    # ── Try DB path ─────────────────────────────────────────────────────────
    conv_id = None
    chat_history = []

    try:
        if request.conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == request.conversation_id
            ).first()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conversation = Conversation(user_id=request.user_id)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        conv_id = conversation.id

        past_messages = db.query(Message).filter(
            Message.conversation_id == conv_id
        ).order_by(Message.created_at.asc()).all()

        for i in range(0, len(past_messages) - 1, 2):
            if (past_messages[i].role == "user" and
                    i + 1 < len(past_messages) and
                    past_messages[i + 1].role == "assistant"):
                chat_history.append((
                    past_messages[i].content,
                    past_messages[i + 1].content,
                ))
    except HTTPException:
        raise
    except Exception:
        # ── Fallback: in-memory history when DB is down ──────────────────────
        db_available = False
        if request.conversation_id and str(request.conversation_id) in _memory_store:
            conv_id = request.conversation_id
        else:
            conv_id = _next_conv_id
            _next_conv_id += 1
            _memory_store[str(conv_id)] = []
        chat_history = _memory_store.get(str(conv_id), [])

    # ── Context Engine: pull health data if message is health-related ─────────
    context_used = False
    system_prompt = None

    if request.user_id and is_health_related(request.message):
        try:
            user_context = await get_user_context(
                user_id=request.user_id,
                db=db,
                days=3,
            )
            if user_context:
                system_prompt = get_system_prompt(user_context=user_context)
                context_used = True
        except Exception:
            pass  # context pull failing should never break the chat

    # ── Get Baymax's response ─────────────────────────────────────────────────
    try:
        result = await get_baymax_response(
            get_chain(),
            request.message,
            chat_history,
            system_prompt=system_prompt,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    # ── Persist the exchange ──────────────────────────────────────────────────
    if db_available:
        try:
            db.add(Message(conversation_id=conv_id, role="user", content=request.message))
            db.add(Message(conversation_id=conv_id, role="assistant", content=result["answer"]))
            db.commit()
        except Exception:
            pass
    else:
        _memory_store.setdefault(str(conv_id), []).append(
            (request.message, result["answer"])
        )

    return ChatMessageResponse(
        answer=result["answer"],
        conversation_id=conv_id,
        sources=result["sources"],
        context_used=context_used,
    )


@router.get("/history/{conversation_id}")
async def get_history(conversation_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    return {
        "conversation_id": conversation_id,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at}
            for m in messages
        ],
    }


@router.delete("/history/{conversation_id}")
async def clear_history(conversation_id: int, db: Session = Depends(get_db)):
    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.commit()
    return {"message": "Conversation cleared. I am Baymax, your personal healthcare companion."}