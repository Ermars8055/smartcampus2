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
    MaterialIssue, MaterialIssueItem, Building, GRN, Room, Floor
)
from app.schemas import StockOut, StockLedgerOut, AlertOut, AuditLogOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api", tags=["Inventory & Admin"])


# ── Inventory ────────────────────────────────────────────────────────────

@router.get("/inventory")
def list_inventory(
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    low_stock_only: bool = False,
    stock_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(CurrentStock).join(Material).join(Warehouse).filter(
        CurrentStock.tenant_id == tenant_id, CurrentStock.site_id == site_id
    )
    if warehouse_id:
        q = q.filter(CurrentStock.warehouse_id == warehouse_id)
    if category_id:
        q = q.filter(Material.category_id == category_id)
    if search:
        q = q.filter(or_(
            Material.name.ilike(f"%{search}%"),
            Material.code.ilike(f"%{search}%")
        ))
    
    if stock_status == 'no':
        q = q.filter(CurrentStock.quantity == 0)
    elif stock_status == 'low':
        q = q.filter(CurrentStock.quantity > 0, CurrentStock.quantity < Material.reorder_level)
    elif stock_status == 'in':
        q = q.filter(CurrentStock.quantity >= Material.reorder_level)
    elif low_stock_only:
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
            warehouse_id=s.warehouse_id, quantity=round(s.quantity or 0),
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            category_name=cat.name if cat else None,
            uom_name=uom.name if uom else None,
            warehouse_name=wh.name if wh else None,
            reorder_level=round(mat.reorder_level or 0) if mat else 0,
            standard_cost=round(float(mat.standard_cost or 0), 2),
            stock_value=round(float(s.quantity or 0) * float(mat.standard_cost or 0), 2),
            storage_type=mat.storage_type if mat else None
        ))
    return result


@router.get("/inventory/ledger")
def get_full_inventory_ledger(
    warehouse_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inventory", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(StockLedger).join(Material).join(Warehouse).filter(
        StockLedger.tenant_id == tenant_id, StockLedger.site_id == site_id
    )
    if warehouse_id:
        q = q.filter(StockLedger.warehouse_id == warehouse_id)
    if search:
        q = q.filter(or_(
            Material.name.ilike(f"%{search}%"),
            Material.code.ilike(f"%{search}%")
        ))
    
    ledger = q.order_by(StockLedger.created_at.desc()).limit(200).all()
    
    return {
        "items": [
            StockLedgerOut(
                id=l.id, material_id=l.material_id, warehouse_id=l.warehouse_id,
                transaction_type=l.transaction_type, quantity=round(l.quantity or 0), balance=round(l.balance or 0),
                reference_type=l.reference_type, reference_number=l.reference_number,
                created_at=l.created_at, warehouse_name=l.warehouse.name if l.warehouse else None,
                material_name=l.material.name if l.material else None
            )
            for l in ledger
        ]
    }


@router.get("/inventory/{id}/ledger")
def get_stock_ledger(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("inventory", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    ledger = db.query(StockLedger).filter(
        StockLedger.material_id == id,
        StockLedger.tenant_id == tenant_id,
        StockLedger.site_id == site_id
    ).order_by(StockLedger.created_at.desc()).limit(100).all()
    result = []
    for l in ledger:
        wh = l.warehouse
        result.append(StockLedgerOut(
            id=l.id, material_id=l.material_id, warehouse_id=l.warehouse_id,
            transaction_type=l.transaction_type, quantity=round(l.quantity or 0), balance=round(l.balance or 0),
            reference_type=l.reference_type, reference_number=l.reference_number,
            created_at=l.created_at, warehouse_name=wh.name if wh else None
        ))
    return result


# ── Reports ──────────────────────────────────────────────────────────────

@router.get("/reports/stock")
def stock_report(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(
        Material.code,
        Material.name,
        UOM.name.label("uom"),
        func.sum(CurrentStock.quantity).label("total_quantity"),
        func.sum(CurrentStock.quantity * Material.standard_cost).label("total_value")
    ).select_from(Material).join(
        CurrentStock, CurrentStock.material_id == Material.id
    ).outerjoin(
        UOM, Material.uom_id == UOM.id
    ).filter(
        CurrentStock.tenant_id == tenant_id, CurrentStock.site_id == site_id,
        CurrentStock.quantity > 0
    )

    results = q.group_by(Material.code, Material.name, UOM.name).all()
    return [
        {
            "material_code": r[0], "material_name": r[1], "uom": r[2],
            "total_quantity": round(r[3] or 0),
            "total_value": round(r[4] or 0, 2)
        }
        for r in results
    ]

@router.get("/reports/consumption")
def consumption_report(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    results = db.query(
        Building.name.label("building_name"),
        Material.name.label("material_name"),
        func.sum(MaterialIssueItem.quantity).label("total_quantity"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).join(MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id)\
     .join(Material, MaterialIssueItem.material_id == Material.id)\
     .join(Room, MaterialIssue.issued_to_room_id == Room.id)\
     .join(Floor, Room.floor_id == Floor.id)\
     .join(Building, Floor.building_id == Building.id)\
     .filter(MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id)\
     .group_by(Building.name, Material.name).all()
    
    return [
        {
            "building_name": r.building_name,
            "material_name": r.material_name,
            "total_quantity": round(r.total_quantity or 0),
            "total_value": round(r.total_value or 0, 2)
        } for r in results
    ]


@router.get("/reports/pr-status")
def pr_status_report(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    prs = db.query(PurchaseRequest).filter(
        PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).order_by(PurchaseRequest.created_at.desc()).all()
    return [
        {
            "pr_number": pr.pr_number,
            "requester": pr.requester.full_name if pr.requester else "",
            "required_date": pr.required_date.isoformat() if pr.required_date else "",
            "status": pr.status,
            "created_at": pr.created_at.isoformat() if pr.created_at else ""
        }
        for pr in prs
    ]


@router.get("/reports/po-status")
def po_status_report(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pos = db.query(PurchaseOrder).filter(
        PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).order_by(PurchaseOrder.created_at.desc()).all()
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
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(StockLedger).join(Material).join(Warehouse).filter(
        StockLedger.tenant_id == tenant_id, StockLedger.site_id == site_id
    )
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
            "quantity": round(e.quantity or 0),
            "balance": round(e.balance or 0),
            "reference": e.reference_number or ""
        }
        for e in ledger
    ]


@router.get("/admin/audit-logs")
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("audit_logs", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    total = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id, AuditLog.site_id == site_id).count()
    logs = db.query(AuditLog).filter(
        AuditLog.tenant_id == tenant_id, AuditLog.site_id == site_id
    ).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
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
