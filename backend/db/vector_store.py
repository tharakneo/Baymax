import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from config import get_settings

settings = get_settings()

# ─── Embedding Model ─────────────────────────────────────────────────────────
# all-MiniLM-L6-v2 is small (80MB), fast, and great for semantic search
embedding_model = HuggingFaceEmbeddings(
    model_name=settings.embedding_model,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

# ─── ChromaDB Client ─────────────────────────────────────────────────────────
chroma_client = chromadb.PersistentClient(
    path=settings.chroma_persist_dir,
    settings=ChromaSettings(anonymized_telemetry=False),
)


def get_vector_store(collection_name: str = "medical_knowledge") -> Chroma:
    """
    Returns a LangChain Chroma vector store tied to our embedding model.
    This is what the RAG engine queries to find relevant medical docs.
    """
    return Chroma(
        client=chroma_client,
        collection_name=collection_name,
        embedding_function=embedding_model,
    )


def get_retriever(k: int = 4):
    """
    Returns a retriever that fetches the top-k most relevant document chunks
    for a given query. k=4 is a good balance — enough context, not too noisy.
    """
    vector_store = get_vector_store()
    return vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": k},
    )
