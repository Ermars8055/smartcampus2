"""NissiGrid Smart Campus - FastAPI main application."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, logging

from app.config import APP_TITLE, APP_SUBTITLE, APP_VERSION, CORS_ORIGINS
from app.database import engine, SessionLocal, Base
from app.models import *  # noqa: F401 — import all models so tables are created

# Import routers
from app.routers import (
    auth, dashboard, materials, vendors, organizations,
    procurement, gate_entry, grn, store_ops, inventory_admin,
    saas_admin, rbac, sites, auto_pr, alerts, intelligence,
    indents, approval_flows, quotations, reports, uploads, terms,
    admin_users, invoices, company_addresses, material_limits
)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed minimal data on startup."""
    Base.metadata.create_all(bind=engine)
    from app.seed_data import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=APP_TITLE,
    description=APP_SUBTITLE,
    version=APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# Improved CORS middleware for local and production networking
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.0.4:5173",
        "http://192.168.0.5:5173",
        "http://192.168.0.3:5173",
        "http://0.0.0.0:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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
app.include_router(reports.router)
app.include_router(uploads.router)
app.include_router(terms.router)
app.include_router(admin_users.router)
app.include_router(invoices.router)
app.include_router(company_addresses.router)
app.include_router(material_limits.router)


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
