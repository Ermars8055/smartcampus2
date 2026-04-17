"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./nissigrid_stores.db"
)

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "nissigrid-smart-stores-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Application
APP_TITLE = "NissiGrid Smart Stores"
APP_SUBTITLE = "Enterprise Materials Governance Platform"
APP_VERSION = "1.0.0"

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
