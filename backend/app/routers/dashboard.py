"""Dashboard analytics routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Material, CurrentStock, PurchaseRequest, PurchaseOrder,
    GRN, Warehouse, Vendor, MaterialIssue, MaterialIssueItem,
    Building, StockLedger, User, Alert, Room, Floor, Institution, Indent
)
from app.schemas import DashboardStats
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from typing import Optional
from datetime import datetime

def parse_date(date_str: Optional[str]):
    if not date_str: return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    total_materials = db.query(Material).filter(
        Material.tenant_id == tenant_id, Material.site_id == site_id, Material.is_active == True
    ).count()

    # Total inventory value
    stock_data = db.query(
        func.sum(CurrentStock.quantity * Material.standard_cost)
    ).join(Material, CurrentStock.material_id == Material.id).filter(
        CurrentStock.tenant_id == tenant_id, CurrentStock.site_id == site_id
    ).scalar() or 0

    # Low stock: materials where stock is below reorder level
    low_stock = db.query(CurrentStock).join(Material).filter(
        CurrentStock.tenant_id == tenant_id, CurrentStock.site_id == site_id,
        CurrentStock.quantity < Material.reorder_level,
        CurrentStock.quantity > 0
    ).count()

    pr_q = db.query(PurchaseRequest).filter(
        PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id,
        PurchaseRequest.status.in_(["Draft", "Submitted"])
    )

    po_q = db.query(PurchaseOrder).filter(
        PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id,
        PurchaseOrder.status.in_(["Draft", "Approved", "Sent to Vendor"])
    )

    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            if scope == "Department":
                if current_user.department:
                    pr_q = pr_q.filter(PurchaseRequest.department_name == current_user.department)
                else:
                    pr_q = pr_q.filter(PurchaseRequest.requester_id == current_user.id)
            else:
                pr_q = pr_q.filter(PurchaseRequest.requester_id == current_user.id)
            
            po_q = po_q.filter(PurchaseOrder.created_by_id == current_user.id)

    pending_pr = pr_q.count()
    pending_po = po_q.count()

    grn_query = db.query(GRN).filter(GRN.tenant_id == tenant_id, GRN.site_id == site_id)
    if sd: grn_query = grn_query.filter(GRN.created_at >= sd)
    if ed: grn_query = grn_query.filter(GRN.created_at < ed)
    recent_grn = grn_query.count()
    
    total_vendors = db.query(Vendor).filter(
        Vendor.tenant_id == tenant_id, Vendor.site_id == site_id, Vendor.is_active == True
    ).count()
    
    total_warehouses = db.query(Warehouse).filter(
        Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id, Warehouse.is_active == True
    ).count()

    return DashboardStats(
        total_materials=total_materials,
        total_inventory_value=round(stock_data, 2),
        low_stock_items=low_stock,
        pending_pr=pending_pr,
        pending_po=pending_po,
        recent_grn_count=recent_grn,
        total_vendors=total_vendors,
        total_warehouses=total_warehouses
    )


@router.get("/consumption-by-building")
def get_consumption_by_building(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    InstFromBuilding = aliased(Institution)
    InstFromIndent = aliased(Institution)
    
    loc_label = func.coalesce(
        InstFromIndent.name,
        InstFromBuilding.name,
        Building.name,
        MaterialIssue.issued_to_department,
        "Unknown"
    )
    
    query = db.query(
        loc_label.label("building_name"),
        func.sum(MaterialIssueItem.quantity).label("total_qty"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).select_from(MaterialIssueItem).join(
        MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id
    ).outerjoin(
        Building, MaterialIssue.building_id == Building.id
    ).outerjoin(
        InstFromBuilding, Building.institution_id == InstFromBuilding.id
    ).outerjoin(
        Indent, MaterialIssue.indent_id == Indent.id
    ).outerjoin(
        InstFromIndent, Indent.institution_id == InstFromIndent.id
    ).filter(
        MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id
    )
    
    if sd: query = query.filter(MaterialIssue.created_at >= sd)
    if ed: query = query.filter(MaterialIssue.created_at < ed)
    results = query.group_by(loc_label).all()

    return [
        {"building_name": r[0], "total_quantity": round(r[1] or 0, 2), "total_value": round(r[2] or 0, 2)}
        for r in results
    ]


@router.get("/stock-by-warehouse")
def get_stock_by_warehouse(
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    results = db.query(
        Warehouse.name,
        func.count(CurrentStock.id).label("total_items"),
        func.sum(CurrentStock.quantity * Material.standard_cost).label("total_value")
    ).join(
        CurrentStock, CurrentStock.warehouse_id == Warehouse.id
    ).join(
        Material, CurrentStock.material_id == Material.id
    ).filter(
        CurrentStock.tenant_id == tenant_id, CurrentStock.site_id == site_id,
        CurrentStock.quantity > 0
    ).group_by(Warehouse.name).all()

    return [
        {"warehouse_name": r[0], "total_items": r[1], "total_value": round(r[2] or 0, 2)}
        for r in results
    ]


@router.get("/top-consumed-materials")
def get_top_consumed(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    from app.models import UOM
    results = db.query(
        Material.name,
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value"),
        func.sum(MaterialIssueItem.quantity).label("total_qty"),
        UOM.name.label("uom_name")
    ).select_from(Material).join(
        MaterialIssueItem, MaterialIssueItem.material_id == Material.id
    ).join(
        UOM, Material.uom_id == UOM.id
    ).join(
        MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id
    ).filter(
        MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id
    )
    if sd: results = results.filter(MaterialIssue.created_at >= sd)
    if ed: results = results.filter(MaterialIssue.created_at < ed)
    results = results.group_by(Material.name, UOM.name).order_by(
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).desc()
    ).limit(10).all()

    return [
        {"material_name": r[0], "total_value": round(r[1] or 0, 2), "total_quantity": round(r[2] or 0, 2), "uom": r[3]}
        for r in results
    ]


@router.get("/recent-transactions")
def get_recent_transactions(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    q = db.query(StockLedger).filter(StockLedger.tenant_id == tenant_id, StockLedger.site_id == site_id)
    if sd: q = q.filter(StockLedger.created_at >= sd)
    if ed: q = q.filter(StockLedger.created_at < ed)
    ledger = q.order_by(StockLedger.created_at.desc()).limit(20).all()
    return [
        {
            "id": l.id,
            "material_name": l.material.name if l.material else "",
            "warehouse_name": l.warehouse.name if l.warehouse else "",
            "transaction_type": l.transaction_type,
            "quantity": l.quantity,
            "reference_number": l.reference_number,
            "created_at": l.created_at.isoformat() if l.created_at else ""
        }
        for l in ledger
    ]


@router.get("/material-cost-by-building")
def get_material_cost_by_building(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    InstFromBuilding = aliased(Institution)
    InstFromIndent = aliased(Institution)
    
    loc_label = func.coalesce(
        InstFromIndent.name,
        InstFromBuilding.name,
        Building.name,
        MaterialIssue.issued_to_department,
        "Unknown"
    )
    
    query = db.query(
        Material.name,
        loc_label.label("building_name"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_cost"),
        func.sum(MaterialIssueItem.quantity).label("total_qty")
    ).select_from(Material).join(
        MaterialIssueItem, MaterialIssueItem.material_id == Material.id
    ).join(
        MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id
    ).outerjoin(
        Building, MaterialIssue.building_id == Building.id
    ).outerjoin(
        InstFromBuilding, Building.institution_id == InstFromBuilding.id
    ).outerjoin(
        Indent, MaterialIssue.indent_id == Indent.id
    ).outerjoin(
        InstFromIndent, Indent.institution_id == InstFromIndent.id
    ).filter(
        MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id
    )
    if sd: query = query.filter(MaterialIssue.created_at >= sd)
    if ed: query = query.filter(MaterialIssue.created_at < ed)
    results = query.group_by(Material.name, loc_label).order_by(
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).desc()
    ).limit(20).all()

    return [
        {
            "material_name": r[0],
            "building_name": r[1],
            "total_cost": round(r[2] or 0, 2),
            "total_quantity": round(r[3] or 0, 2)
        }
        for r in results
    ]


@router.get("/consumption-trend")
def get_consumption_trend(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    """Monthly material consumption spend trend."""
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    # Use to_char for PostgreSQL or strftime for SQLite
    if db.bind.dialect.name == 'postgresql':
        month_func = func.to_char(MaterialIssue.created_at, 'YYYY-MM')
    else:
        month_func = func.strftime('%Y-%m', MaterialIssue.created_at)

    query = db.query(
        month_func.label("month"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).join(
        MaterialIssueItem, MaterialIssueItem.issue_id == MaterialIssue.id
    ).filter(
        MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id
    )
    
    if sd: query = query.filter(MaterialIssue.created_at >= sd)
    if ed: query = query.filter(MaterialIssue.created_at < ed)
    
    results = query.group_by(
        month_func
    ).order_by("month").limit(12).all()

    return [{"month": r[0] if r[0] else 'Unknown', "total_value": round(r[1] or 0, 2)} for r in results]


@router.get("/alerts")
def get_dashboard_alerts(
    db: Session = Depends(get_db), current_user: User = Depends(require_permission("dashboard", "read")),
    tenant_id: int = Depends(get_tenant_id), site_id: int = Depends(get_site_id)
):
    alerts = db.query(Alert).filter(
        Alert.tenant_id == tenant_id, Alert.site_id == site_id,
        Alert.is_resolved == False
    ).order_by(Alert.created_at.desc()).limit(10).all()

    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else ""
        }
        for a in alerts
    ]
