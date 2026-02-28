from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from db.vector_store import get_retriever
from core.baymax_persona import get_system_prompt, BAYMAX_SYSTEM_PROMPT
from config import get_settings
import asyncio

settings = get_settings()

# Module-level retriever — shared across requests
_retriever = None

def _get_retriever():
    global _retriever
    if _retriever is None:
        _retriever = get_retriever(k=4)
    return _retriever


def build_rag_chain():
    """
    Builds a simple LLM chain (no retriever inside — retrieval is done
    async in get_baymax_response to avoid blocking the event loop).

    Inputs expected: question, chat_history, context, system_prompt
    """
    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        temperature=0.2,
        max_tokens=1024,
    )

    # system_prompt is now a runtime variable — injected per request
    # so the context engine can swap in health-aware prompts
    prompt = ChatPromptTemplate.from_messages([
        ("system", """{system_prompt}

IMPORTANT PRIORITY RULE:
Your personality rules and the User Health Context (above) take absolute priority over the retrieved medical context below. 
If the User Health Context tells you NOT to ask about a metric (e.g. water or sleep), DO NOT ASK ABOUT IT AND DO NOT SUGGEST REMEDIES FOR IT (e.g. do not tell them to go drink water), even if the medical context suggests doing so.

Use the following retrieved medical context to help answer the question.
If the context is not relevant, answer from general knowledge but stay in character.
Always maintain the Baymax persona.

Retrieved Context:
{context}
"""),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{question}"),
    ])

    chain = prompt | llm | StrOutputParser()
    return chain


def _format_docs(docs) -> str:
    """Formats retrieved documents into a single string for the prompt."""
    if not docs:
        return "No specific medical context found for this query."
    return "\n\n".join([
        f"Source: {doc.metadata.get('source', 'Unknown')}\n{doc.page_content}"
        for doc in docs
    ])


async def get_baymax_response(
    chain,
    user_message: str,
    chat_history: list = [],
    system_prompt: str = None,  # ← NEW: injected by context engine when health data exists
) -> dict:
    """
    1. Runs the retriever asynchronously (non-blocking)
    2. Formats the docs into context
    3. Calls the LLM chain with question + history + context + system_prompt
    """
    # ── Async retrieval ───────────────────────────────────────────────────────
    retriever = _get_retriever()
    try:
        docs = await asyncio.get_event_loop().run_in_executor(
            None, retriever.invoke, user_message
        )
        context = _format_docs(docs)
    except Exception:
        context = "No specific medical context found for this query."

    # ── Build history ─────────────────────────────────────────────────────────
    history_messages = []
    for human, ai in chat_history:
        history_messages.append(HumanMessage(content=human))
        history_messages.append(AIMessage(content=ai))

    # ── Use health-context system prompt if provided, else default ────────────
    active_system_prompt = system_prompt if system_prompt else BAYMAX_SYSTEM_PROMPT

    # ── LLM call ─────────────────────────────────────────────────────────────
    result = await chain.ainvoke({
        "question": user_message,
        "chat_history": history_messages,
        "context": context,
        "system_prompt": active_system_prompt,
    })

    return {
        "answer": result,
        "sources": [],
    }