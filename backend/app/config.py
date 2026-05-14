"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./nissigrid_stores.db"
)

# JWT Settings — fail fast if SECRET_KEY not set in production
SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Application
APP_TITLE = "NissiGrid Smart Campus"
APP_SUBTITLE = "Materials Management Platform"
APP_VERSION = "2.0.0"

# CORS
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.4:5173",
    "*"
]
