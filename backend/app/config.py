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
    env: str = "development"
    test_user_id: int = 0  # must be set explicitly — 0 means disabled
    test_reset_secret: str = ""  # must be set explicitly — empty means disabled

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
