"""ChromaDB vector store setup for RAG knowledge base."""

import chromadb
from chromadb.config import Settings as ChromaSettings

from config import settings


def get_vector_store():
    """Initialize and return a ChromaDB client."""
    client = chromadb.Client(ChromaSettings(
        chroma_db_impl="duckdb+parquet",
        persist_directory=settings.chroma_persist_dir,
        anonymized_telemetry=False,
    ))
    return client


def get_or_create_collection(name: str = "health_knowledge"):
    """Get or create a ChromaDB collection for health documents."""
    client = get_vector_store()
    collection = client.get_or_create_collection(
        name=name,
        metadata={"description": "BayMax health knowledge base"},
    )
    return collection
