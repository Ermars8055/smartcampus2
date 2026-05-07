"""NissiGrid Smart Campus - FastAPI main application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import APP_TITLE, APP_SUBTITLE, APP_VERSION, CORS_ORIGINS
from app.database import engine, SessionLocal, Base
from app.models import *  # noqa: F401 — import all models so tables are created

# Import routers
from app.routers import (
    auth, dashboard, materials, vendors, organizations,
    procurement, gate_entry, grn, store_ops, inventory_admin,
    saas_admin, rbac, sites, auto_pr, alerts, intelligence,
    indents, approval_flows, quotations
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=APP_TITLE,
    description=APP_SUBTITLE,
    version=APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers

app.include_router(auth.router)
app.include_router(alerts.router)
app.include_router(saas_admin.router)
app.include_router(rbac.router)
app.include_router(sites.router)
app.include_router(auto_pr.router)
app.include_router(dashboard.router)
app.include_router(materials.router)
app.include_router(vendors.router)
app.include_router(organizations.router)
app.include_router(procurement.router)
app.include_router(gate_entry.router)
app.include_router(grn.router)
app.include_router(store_ops.router)
app.include_router(inventory_admin.router)
app.include_router(intelligence.router)
app.include_router(indents.router)
app.include_router(approval_flows.router)
app.include_router(quotations.router)


@app.on_event("startup")
def startup_event():
    """Seed the database on first run."""
    from app.seed_data import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "application": APP_TITLE,
        "version": APP_VERSION
    }


@app.get("/api/config")
def get_app_config():
    return {
        "title": APP_TITLE,
        "subtitle": APP_SUBTITLE,
        "version": APP_VERSION
    }
