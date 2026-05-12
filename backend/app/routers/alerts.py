"""Alerts & pending action counts."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import GateEntry, User
from app.auth import get_current_user, get_tenant_id, get_site_id

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/count")
def get_alert_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Return counts of pending actions for the current user/site."""
    pending_direct = db.query(GateEntry).filter(
        GateEntry.tenant_id == tenant_id,
        GateEntry.site_id == site_id,
        GateEntry.status == "Awaiting Direct GRN",
        GateEntry.is_deleted == False
    ).count()

    return {
        "count": pending_direct,
        "pending_direct_invoices": pending_direct
    }
