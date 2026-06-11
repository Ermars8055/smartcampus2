"""Alerts & pending action counts."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import outerjoin, and_
from app.database import get_db
from app.models import GateEntry, User, Alert, Indent, ApprovalFlow
from app.auth import get_current_user, get_tenant_id, get_site_id
from app.utils.tz import get_now_ist

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

def get_pending_indent_alerts(db, current_user, tenant_id, site_id, tracked_ind_map=None):
    """Helper to get dynamic indent alerts for the current user."""
    alerts = []
    
    # Get indents awaiting approval
    pending_indents = db.query(Indent).filter(
        Indent.tenant_id == tenant_id,
        Indent.site_id == site_id,
        Indent.status == "Awaiting Approval"
    ).all()
    
    if not pending_indents:
        return alerts
        
    # Pre-fetch all active approval flows for INDENT
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "INDENT",
        ApprovalFlow.is_active == True
    ).all()
    
    user_roles = getattr(current_user, "_roles", [])
    is_admin = getattr(current_user, "_is_platform_admin", False)
    perms = getattr(current_user, "_permissions", {})
    can_override = is_admin or perms.get('indents', {}).get('extended_actions', {}).get('can_approve', False)
    
    for ind in pending_indents:
        if tracked_ind_map and ind.id in tracked_ind_map and tracked_ind_map[ind.id].is_resolved:
            continue
            
        # Check if user can approve this indent
        applicable_flows = [
            f for f in flows
            if f.level == ind.current_approval_level and
               f.min_amount <= ind.total_amount and
               (f.max_amount is None or f.max_amount >= ind.total_amount) and
               (can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles))
        ]
        
        if applicable_flows:
            is_read = tracked_ind_map[ind.id].is_read if (tracked_ind_map and ind.id in tracked_ind_map) else False
            alerts.append({
                "id": f"ind_{ind.id}",
                "title": f"Action Required: Indent {ind.indent_number} Approval",
                "severity": "Warning",
                "alert_type": "Pending Action",
                "message": f"Indent {ind.indent_number} from {ind.department or 'Unknown Dept'} is awaiting Level {ind.current_approval_level} approval.",
                "created_at": ind.created_at,
                "is_read": is_read,
                "is_resolved": False,
                "reference_type": "Indent",
                "reference_id": ind.id
            })
            
    return alerts


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
        GateEntry.status == "Awaiting GRN",
        GateEntry.is_deleted == False,
        (Alert.id == None) | (and_(Alert.is_read == False, Alert.is_resolved == False))
    ).count()

    db_alerts_count = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.is_read == False,
        Alert.is_resolved == False,
        (Alert.reference_type != "GateEntry"),
        (Alert.reference_type != "Indent")
    ).count()
    
    # Indent alerts count
    tracked_ind_alerts = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.reference_type == "Indent"
    ).all()
    tracked_ind_map = {a.reference_id: a for a in tracked_ind_alerts}
    
    ind_alerts = get_pending_indent_alerts(db, current_user, tenant_id, site_id, tracked_ind_map)
    unread_ind_count = sum(1 for a in ind_alerts if not a["is_read"])

    return {
        "count": unread_ge_count + db_alerts_count + unread_ind_count,
        "pending_direct_invoices": unread_ge_count,
        "pending_indents": unread_ind_count,
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
        GateEntry.status == "Awaiting GRN",
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
            "is_resolved": False,
            "reference_type": "GateEntry",
            "reference_id": ge.id
        })
        
    # 2. Dynamic alerts from pending Indents
    tracked_ind_alerts = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.reference_type == "Indent"
    ).all()
    tracked_ind_map = {a.reference_id: a for a in tracked_ind_alerts}
    
    ind_alerts = get_pending_indent_alerts(db, current_user, tenant_id, site_id, tracked_ind_map)
    alerts.extend(ind_alerts)
        
    # 3. Database alerts
    db_alerts = db.query(Alert).filter(
        Alert.tenant_id == tenant_id,
        Alert.site_id == site_id,
        Alert.is_resolved == False,
        (Alert.reference_type != "GateEntry"),
        (Alert.reference_type != "Indent")
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
            "is_resolved": a.is_resolved,
            "reference_type": a.reference_type,
            "reference_id": a.reference_id
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
    elif alert_id.startswith("ge_") or alert_id.startswith("ind_"):
        is_ge = alert_id.startswith("ge_")
        ref_type = "GateEntry" if is_ge else "Indent"
        ref_id = int(alert_id.replace("ge_", "").replace("ind_", ""))
        
        alert = db.query(Alert).filter(Alert.reference_type == ref_type, Alert.reference_id == ref_id, Alert.tenant_id == tenant_id, Alert.site_id == site_id).first()
        if not alert:
            if is_ge:
                ge = db.query(GateEntry).filter(GateEntry.id == ref_id).first()
                title = f"Action Required: Gate Entry {ge.entry_number}" if ge else "Gate Entry Alert"
            else:
                ind = db.query(Indent).filter(Indent.id == ref_id).first()
                title = f"Action Required: Indent {ind.indent_number} Approval" if ind else "Indent Alert"
                
            alert = Alert(
                tenant_id=tenant_id,
                site_id=site_id,
                alert_type="Pending Action",
                severity="Warning",
                title=title,
                reference_type=ref_type,
                reference_id=ref_id,
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
    elif alert_id.startswith("ge_") or alert_id.startswith("ind_"):
        is_ge = alert_id.startswith("ge_")
        ref_type = "GateEntry" if is_ge else "Indent"
        ref_id = int(alert_id.replace("ge_", "").replace("ind_", ""))
        
        alert = db.query(Alert).filter(Alert.reference_type == ref_type, Alert.reference_id == ref_id, Alert.tenant_id == tenant_id, Alert.site_id == site_id).first()
        if not alert:
            if is_ge:
                ge = db.query(GateEntry).filter(GateEntry.id == ref_id).first()
                title = f"Action Required: Gate Entry {ge.entry_number}" if ge else "Gate Entry Alert"
            else:
                ind = db.query(Indent).filter(Indent.id == ref_id).first()
                title = f"Action Required: Indent {ind.indent_number} Approval" if ind else "Indent Alert"
                
            alert = Alert(
                tenant_id=tenant_id,
                site_id=site_id,
                alert_type="Pending Action",
                severity="Warning",
                title=title,
                reference_type=ref_type,
                reference_id=ref_id,
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
