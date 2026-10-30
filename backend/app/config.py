"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# Database — no silent fallback to SQLite in production
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if os.getenv("ENV") == "production":
        raise RuntimeError("DATABASE_URL environment variable is not set. Refusing to start in production.")
    DATABASE_URL = "sqlite:///./nissigrid_stores.db"

# JWT Settings — fail fast if SECRET_KEY not set in production
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set. Refusing to start.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "1440"))

# Application
APP_TITLE = "Eastpoint Smart Campus"
APP_SUBTITLE = "Materials Management Platform"
APP_VERSION = "2.0.0"

# CORS — read from env; never allow wildcard "*"
_cors_env = os.getenv("CORS_ORIGINS", "")
CORS_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

# SMTP Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Eastpoint Smart Campus")

# Frontend URL used in password reset emails (never trust client-supplied URL)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")

# Testing: Override all vendor emails to this address
TEST_EMAIL_OVERRIDE = os.getenv("TEST_EMAIL_OVERRIDE", "")

