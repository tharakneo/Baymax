"""Application settings loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://baymax:baymax_secret@db:5432/baymax_db"

    # LLM
    openai_api_key: str = ""
    llm_model: str = "gpt-4o"

    # ChromaDB
    chroma_persist_dir: str = "./chroma_data"

    # App
    secret_key: str = "change-me-in-production"
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
