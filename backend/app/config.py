from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@db:5432/acmedb"
    secret_key: str = "change-me-in-production-use-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8 hours
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:80"]

    class Config:
        env_file = ".env"


settings = Settings()
