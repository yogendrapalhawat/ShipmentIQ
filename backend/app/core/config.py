import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ShipmentIQ — Order & Delivery Analytics Platform"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./shipmentiq.db"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
    DEFAULT_CURRENCY: str = "USD"
    EXPECTED_DELIVERY_THRESHOLD_DAYS: int = 5
    REST_COUNTRIES_API_URL: str = "https://restcountries.com/v3.1/all"
    EXCHANGE_RATE_API_URL: str = "https://open.er-api.com/v6/latest/USD"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v


settings = Settings()
