"""Alerts & pending action counts."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import outerjoin, and_
from app.database import get_db
from app.models import GateEntry, User, Alert
from app.auth import get_current_user, get_tenant_id, get_site_id
from app.utils.tz import get_now_ist

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/count")
def get_alert_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Return counts of pending actions for the current user/site."""
    
    # Outer join to exclude resolved GateEntry alerts, or count them if not tracked/not read
    unread_ge_count = db.query(GateEntry).outerjoin(
        Alert, 
        and_(Alert.reference_id == GateEntry.id, Alert.reference_type == "GateEntry", Alert.tenant_id == tenant_id)
    ).filter(
        GateEntry.tenant_id == tenant_id,
        GateEntry.site_id == site_id,
        GateEntry.status == "Awaiting Direct GRN",
        GateEntry.is_deleted == False,
        (Alert.id == None) | (and_(Alert.is_read == False, Alert.is_resolved == False))
    ).count()

    db_alerts_count = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.is_read == False,
        Alert.is_resolved == False,
        (Alert.reference_type != "GateEntry") | (Alert.reference_type == None)
    ).count()

    return {
        "count": unread_ge_count + db_alerts_count,
        "pending_direct_invoices": unread_ge_count,
        "db_alerts": db_alerts_count
    }

@router.get("")
@router.get("/")
def get_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    alerts = []
    
    tracked_ge_alerts = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.reference_type == "GateEntry"
    ).all()
    tracked_ge_map = {a.reference_id: a for a in tracked_ge_alerts}

    # 1. Dynamic alerts from pending Gate Entries
    pending_direct = db.query(GateEntry).filter(
        GateEntry.tenant_id == tenant_id,
        GateEntry.site_id == site_id,
        GateEntry.status == "Awaiting Direct GRN",
        GateEntry.is_deleted == False
    ).all()
    
    for ge in pending_direct:
        if ge.id in tracked_ge_map and tracked_ge_map[ge.id].is_resolved:
            continue
            
        is_read = tracked_ge_map[ge.id].is_read if ge.id in tracked_ge_map else False
        
        alerts.append({
            "id": f"ge_{ge.id}",
            "title": f"Action Required: Gate Entry {ge.entry_number}",
            "severity": "Warning",
            "alert_type": "Pending Action",
            "message": f"Direct Invoice Gate Entry {ge.entry_number} from {ge.vendor.name if ge.vendor else 'Unknown Vendor'} is awaiting GRN creation.",
            "created_at": ge.created_at,
            "is_read": is_read,
            "is_resolved": False
        })
        
    # 2. Database alerts
    db_alerts = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.is_resolved == False,
        (Alert.reference_type != "GateEntry") | (Alert.reference_type == None)
    ).all()
    
    for a in db_alerts:
        alerts.append({
            "id": f"db_{a.id}",
            "title": a.title,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "message": a.message,
            "created_at": a.created_at,
            "is_read": a.is_read,
            "is_resolved": a.is_resolved
        })
        
    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    return alerts

@router.put("/{alert_id}/read")
def mark_alert_read(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if alert_id.startswith("db_"):
        a_id = int(alert_id.replace("db_", ""))
        alert = db.query(Alert).filter(Alert.id == a_id, Alert.tenant_id == tenant_id, Alert.site_id == site_id).first()
        if alert:
            alert.is_read = True
            db.commit()
    elif alert_id.startswith("ge_"):
        ge_id = int(alert_id.replace("ge_", ""))
        alert = db.query(Alert).filter(Alert.reference_type == "GateEntry", Alert.reference_id == ge_id, Alert.tenant_id == tenant_id, Alert.site_id == site_id).first()
        if not alert:
            ge = db.query(GateEntry).filter(GateEntry.id == ge_id).first()
            if ge:
                alert = Alert(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    alert_type="Pending Action",
                    severity="Warning",
                    title=f"Action Required: Gate Entry {ge.entry_number}",
                    reference_type="GateEntry",
                    reference_id=ge_id,
                    is_read=True,
                    is_resolved=False
                )
                db.add(alert)
                db.commit()
        else:
            alert.is_read = True
            db.commit()
    return {"status": "success"}

@router.put("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if alert_id.startswith("db_"):
        a_id = int(alert_id.replace("db_", ""))
        alert = db.query(Alert).filter(Alert.id == a_id, Alert.tenant_id == tenant_id, Alert.site_id == site_id).first()
        if alert:
            alert.is_resolved = True
            alert.resolved_at = get_now_ist()
            db.commit()
    elif alert_id.startswith("ge_"):
        ge_id = int(alert_id.replace("ge_", ""))
        alert = db.query(Alert).filter(Alert.reference_type == "GateEntry", Alert.reference_id == ge_id, Alert.tenant_id == tenant_id, Alert.site_id == site_id).first()
        if not alert:
            ge = db.query(GateEntry).filter(GateEntry.id == ge_id).first()
            if ge:
                alert = Alert(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    alert_type="Pending Action",
                    severity="Warning",
                    title=f"Action Required: Gate Entry {ge.entry_number}",
                    reference_type="GateEntry",
                    reference_id=ge_id,
                    is_read=True,
                    is_resolved=True,
                    resolved_at=get_now_ist()
                )
                db.add(alert)
                db.commit()
        else:
            alert.is_resolved = True
            alert.resolved_at = get_now_ist()
            db.commit()
    return {"status": "success"}
