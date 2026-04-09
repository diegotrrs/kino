from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/kino"
    debug: bool = False
    jwt_secret_key: str = "dev-secret-key-change-in-production"
    jwt_expiration_minutes: int = 1440  # 24 hours
    resend_api_key: str = ""
    resend_from_email: str = "onboarding@resend.dev"
    app_base_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
