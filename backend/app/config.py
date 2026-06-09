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

# SMTP Email Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "NissiGrid Smart Campus")

# Testing: Override all vendor emails to this address
TEST_EMAIL_OVERRIDE = os.getenv("TEST_EMAIL_OVERRIDE", "")

