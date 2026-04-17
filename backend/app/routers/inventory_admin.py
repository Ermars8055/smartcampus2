"""Inventory, Reports, Alerts, and Admin routes."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import (
    CurrentStock, StockLedger, Material, Warehouse, Category, UOM,
    Alert, AuditLog, User, PurchaseRequest, PurchaseOrder,
    MaterialIssue, MaterialIssueItem, Block, GRN
)
from app.schemas import StockOut, StockLedgerOut, AlertOut, AuditLogOut
from app.auth import get_current_user, get_password_hash
from app.schemas import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/api", tags=["Inventory & Admin"])


# ── Inventory ────────────────────────────────────────────────────────────

@router.get("/inventory")
def list_inventory(
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(CurrentStock).join(Material).join(Warehouse)
    if warehouse_id:
        q = q.filter(CurrentStock.warehouse_id == warehouse_id)
    if category_id:
        q = q.filter(Material.category_id == category_id)
    if search:
        q = q.filter(or_(
            Material.name.ilike(f"%{search}%"),
            Material.code.ilike(f"%{search}%")
        ))
    if low_stock_only:
        q = q.filter(CurrentStock.quantity < Material.reorder_level)

    stocks = q.order_by(Material.name).all()
    result = []
    for s in stocks:
        mat = s.material
        wh = s.warehouse
        cat = mat.category if mat else None
        uom = mat.uom if mat else None
        result.append(StockOut(
            id=s.id, material_id=s.material_id,
            warehouse_id=s.warehouse_id, quantity=s.quantity,
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            category_name=cat.name if cat else None,
            uom_name=uom.name if uom else None,
            warehouse_name=wh.name if wh else None,
            reorder_level=mat.reorder_level if mat else 0,
            maximum_level=mat.maximum_level if mat else 0,
            standard_cost=mat.standard_cost if mat else 0,
            stock_value=round(s.quantity * (mat.standard_cost or 0), 2)
        ))
    return result


@router.get("/inventory/ledger")
def get_stock_ledger(
    material_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(StockLedger)
    if material_id:
        q = q.filter(StockLedger.material_id == material_id)
    if warehouse_id:
        q = q.filter(StockLedger.warehouse_id == warehouse_id)
    if transaction_type:
        q = q.filter(StockLedger.transaction_type == transaction_type)
    if search:
        q = q.join(Material).filter(or_(
            Material.name.ilike(f"%{search}%"),
            Material.code.ilike(f"%{search}%")
        ))

    total = q.count()
    entries = q.order_by(StockLedger.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for e in entries:
        result.append(StockLedgerOut(
            id=e.id, material_id=e.material_id,
            warehouse_id=e.warehouse_id,
            transaction_type=e.transaction_type,
            quantity=e.quantity, balance=e.balance,
            reference_type=e.reference_type,
            reference_number=e.reference_number,
            created_at=e.created_at,
            material_name=e.material.name if e.material else None,
            warehouse_name=e.warehouse.name if e.warehouse else None
        ))
    return {"items": result, "total": total}


# ── Alerts ───────────────────────────────────────────────────────────────

@router.get("/alerts")
def list_alerts(
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Alert).filter(Alert.is_resolved == False)
    if is_read is not None:
        q = q.filter(Alert.is_read == is_read)
    alerts = q.order_by(Alert.created_at.desc()).limit(50).all()
    return [
        AlertOut(
            id=a.id, alert_type=a.alert_type, severity=a.severity,
            title=a.title, message=a.message,
            reference_type=a.reference_type, reference_id=a.reference_id,
            is_read=a.is_read, is_resolved=a.is_resolved,
            created_at=a.created_at
        )
        for a in alerts
    ]


@router.put("/alerts/{id}/read")
def mark_alert_read(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"message": "Alert marked as read"}


@router.put("/alerts/{id}/resolve")
def resolve_alert(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if alert:
        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        db.commit()
    return {"message": "Alert resolved"}


@router.get("/alerts/count")
def get_unread_alert_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Alert).filter(Alert.is_read == False, Alert.is_resolved == False).count()
    return {"count": count}


# ── Reports ──────────────────────────────────────────────────────────────

@router.get("/reports/stock")
def stock_report(
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(CurrentStock).join(Material).join(Warehouse)
    if warehouse_id:
        q = q.filter(CurrentStock.warehouse_id == warehouse_id)
    stocks = q.order_by(Material.name).all()
    return [
        {
            "material_code": s.material.code,
            "material_name": s.material.name,
            "category": s.material.category.name if s.material.category else "",
            "uom": s.material.uom.name if s.material.uom else "",
            "warehouse": s.warehouse.name,
            "quantity": s.quantity,
            "reorder_level": s.material.reorder_level,
            "standard_cost": s.material.standard_cost,
            "stock_value": round(s.quantity * (s.material.standard_cost or 0), 2),
            "status": "Low" if s.quantity < s.material.reorder_level else "OK"
        }
        for s in stocks
    ]


from datetime import datetime

def parse_date_report(date_str: Optional[str]):
    if not date_str: return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None

@router.get("/reports/consumption")
def consumption_report(
    project_id: Optional[int] = None,
    block_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sd = parse_date_report(start_date)
    ed = parse_date_report(end_date)
    
    q = db.query(
        Material.code, Material.name, UOM.name.label("uom"),
        Block.name.label("block_name"),
        func.sum(MaterialIssueItem.quantity).label("total_qty"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).join(
        MaterialIssueItem, MaterialIssueItem.material_id == Material.id
    ).join(
        MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id
    ).outerjoin(
        Block, MaterialIssue.issued_to_block_id == Block.id
    ).join(
        UOM, Material.uom_id == UOM.id
    )
    if project_id:
        q = q.filter(MaterialIssue.project_id == project_id)
    if sd:
        q = q.filter(MaterialIssue.created_at >= sd)
    if ed:
        q = q.filter(MaterialIssue.created_at < ed)
    if block_id:
        q = q.filter(MaterialIssue.issued_to_block_id == block_id)

    results = q.group_by(Material.code, Material.name, UOM.name, Block.name).all()
    return [
        {
            "material_code": r[0], "material_name": r[1], "uom": r[2],
            "block_name": r[3] or "Unspecified",
            "total_quantity": round(r[4] or 0, 2),
            "total_value": round(r[5] or 0, 2)
        }
        for r in results
    ]


@router.get("/reports/pr-status")
def pr_status_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prs = db.query(PurchaseRequest).order_by(PurchaseRequest.created_at.desc()).all()
    return [
        {
            "pr_number": pr.pr_number,
            "material": pr.material.name if pr.material else "",
            "quantity": pr.quantity,
            "requester": pr.requester.full_name if pr.requester else "",
            "project": pr.project.name if pr.project else "",
            "required_date": pr.required_date.isoformat() if pr.required_date else "",
            "status": pr.status,
            "created_at": pr.created_at.isoformat() if pr.created_at else ""
        }
        for pr in prs
    ]


@router.get("/reports/po-status")
def po_status_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()
    return [
        {
            "po_number": po.po_number,
            "vendor": po.vendor.name if po.vendor else "",
            "total_amount": po.total_amount,
            "delivery_date": po.delivery_date.isoformat() if po.delivery_date else "",
            "status": po.status,
            "items_count": len(po.items),
            "created_at": po.created_at.isoformat() if po.created_at else ""
        }
        for po in pos
    ]


@router.get("/reports/movement")
def material_movement_report(
    material_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(StockLedger).join(Material).join(Warehouse)
    if material_id:
        q = q.filter(StockLedger.material_id == material_id)
    ledger = q.order_by(StockLedger.created_at.desc()).limit(500).all()
    return [
        {
            "date": e.created_at.isoformat() if e.created_at else "",
            "material_code": e.material.code if e.material else "",
            "material_name": e.material.name if e.material else "",
            "warehouse": e.warehouse.name if e.warehouse else "",
            "transaction_type": e.transaction_type,
            "quantity": e.quantity,
            "balance": e.balance,
            "reference": e.reference_number or ""
        }
        for e in ledger
    ]


# ── Admin: Users ─────────────────────────────────────────────────────────

@router.get("/admin/users")
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).order_by(User.full_name).all()
    return [
        UserOut(
            id=u.id, username=u.username, email=u.email,
            full_name=u.full_name, role=u.role,
            is_active=u.is_active, created_at=u.created_at,
            organization_id=u.organization_id
        )
        for u in users
    ]


@router.post("/admin/users")
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(User).filter(
        or_(User.username == data.username, User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        organization_id=data.organization_id
    )
    db.add(user)
    db.commit()
    return {"id": user.id, "message": "User created successfully"}


@router.put("/admin/users/{id}")
def update_user(id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(user, k, v)
    db.commit()
    return {"message": "User updated successfully"}


@router.get("/admin/audit-logs")
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = db.query(AuditLog).count()
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "items": [
            AuditLogOut(
                id=l.id, user_id=l.user_id, action=l.action,
                entity_type=l.entity_type, entity_id=l.entity_id,
                old_values=l.old_values, new_values=l.new_values,
                ip_address=l.ip_address, created_at=l.created_at,
                username=l.user.full_name if l.user else None
            )
            for l in logs
        ],
        "total": total
    }
