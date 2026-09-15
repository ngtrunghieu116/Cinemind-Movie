import os
from typing import List
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # 1. LLM Settings (DeepSeek / OpenAI compatible)
    CLOUD_MODEL_NAME: str = Field(
        default="deepseek-chat",
        validation_alias=AliasChoices("CLOUD_MODEL_NAME", "DEEPSEEK_MODEL")
    )
    CLOUD_MODEL_URL: str = Field(
        default="https://api.deepseek.com",
        validation_alias=AliasChoices("CLOUD_MODEL_URL", "DEEPSEEK_BASE_URL")
    )
    CLOUD_API_KEY: str = Field(
        default="",
        validation_alias=AliasChoices("CLOUD_API_KEY", "DEEPSEEK_API_KEY")
    )

    # 2. Embedding & Reranking
    EMBEDDING_MODEL: str = Field(
        default="jeffh/intfloat-multilingual-e5-large-instruct:Q8_0",
        validation_alias=AliasChoices("EMBEDDING_MODEL", "EMBEDDING_MODEL_NAME_OR_PATH")
    )
    RERANKER_MODEL: str = Field(
        default="models--namdp-ptit--ViRanker",
        validation_alias=AliasChoices("RERANKER_MODEL", "RERANKER_MODEL_NAME_OR_PATH")
    )
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEVICE: str = "cpu"

    # 3. Vector Database (Qdrant)
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "movie_knowledge"

    # 4. MySQL Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "root"
    DB_NAME: str = "movie_reservation_db"

    @property
    def database_url(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    # 5. Langfuse Monitoring
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_BASE_URL: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("LANGFUSE_BASE_URL", "LANGFUSE_HOST")
    )

    # 6. Service & Security
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8001
    JWT_SECRET: str = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:5173"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
