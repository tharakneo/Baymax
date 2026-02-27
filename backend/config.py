from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Groq
    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"
    embedding_model: str = "all-MiniLM-L6-v2"

    # Database — uses @localhost for local dev, @db for Docker
    database_url: str = "postgresql://baymax:baymax_secret@localhost:5432/baymax_db"
    postgres_user: str = "baymax"
    postgres_password: str = "baymax_secret"
    postgres_db: str = "baymax_db"

    # ChromaDB — matches .env value
    chroma_persist_dir: str = "./chroma_data"

    # App
    app_env: str = "development"
    secret_key: str = "change_this_in_production"
    debug: bool = True
    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
