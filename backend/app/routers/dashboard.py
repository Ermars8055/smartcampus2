"""Dashboard analytics routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Material, CurrentStock, PurchaseRequest, PurchaseOrder,
    GRN, Warehouse, Vendor, MaterialIssue, MaterialIssueItem,
    Block, StockLedger, User, Alert
)
from app.schemas import DashboardStats
from app.auth import get_current_user
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
    current_user: User = Depends(get_current_user)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    total_materials = db.query(Material).filter(Material.is_active == True).count()

    # Total inventory value
    stock_data = db.query(
        func.sum(CurrentStock.quantity * Material.standard_cost)
    ).join(Material, CurrentStock.material_id == Material.id).scalar() or 0

    # Low stock: materials where any warehouse stock is below reorder level
    low_stock = db.query(CurrentStock).join(Material).filter(
        CurrentStock.quantity < Material.reorder_level,
        CurrentStock.quantity > 0
    ).count()

    # Also count materials with zero stock that have reorder levels
    zero_stock_materials = db.query(Material).filter(
        Material.is_active == True,
        Material.reorder_level > 0
    ).count()
    # Subtract ones that have stock entries
    has_stock = db.query(CurrentStock.material_id).filter(CurrentStock.quantity > 0).distinct().count()

    pending_pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.status.in_(["Draft", "Submitted"])
    ).count()

    pending_po = db.query(PurchaseOrder).filter(
        PurchaseOrder.status.in_(["Draft", "Approved", "Sent to Vendor"])
    ).count()

    grn_query = db.query(GRN)
    if sd: grn_query = grn_query.filter(GRN.created_at >= sd)
    if ed: grn_query = grn_query.filter(GRN.created_at < ed)
    recent_grn = grn_query.count()
    total_vendors = db.query(Vendor).filter(Vendor.is_active == True).count()
    total_warehouses = db.query(Warehouse).filter(Warehouse.is_active == True).count()

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


@router.get("/consumption-by-block")
def get_consumption_by_block(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    results = db.query(
        Block.name,
        func.sum(MaterialIssueItem.quantity).label("total_qty"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).join(
        MaterialIssue, MaterialIssue.issued_to_block_id == Block.id
    ).join(
        MaterialIssueItem, MaterialIssueItem.issue_id == MaterialIssue.id
    )
    if sd: results = results.filter(MaterialIssue.created_at >= sd)
    if ed: results = results.filter(MaterialIssue.created_at < ed)
    results = results.group_by(Block.name).all()

    return [
        {"block_name": r[0], "total_quantity": round(r[1] or 0, 2), "total_value": round(r[2] or 0, 2)}
        for r in results
    ]


@router.get("/stock-by-warehouse")
def get_stock_by_warehouse(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = db.query(
        Warehouse.name,
        func.count(CurrentStock.id).label("total_items"),
        func.sum(CurrentStock.quantity * Material.standard_cost).label("total_value")
    ).join(
        CurrentStock, CurrentStock.warehouse_id == Warehouse.id
    ).join(
        Material, CurrentStock.material_id == Material.id
    ).filter(CurrentStock.quantity > 0).group_by(Warehouse.name).all()

    return [
        {"warehouse_name": r[0], "total_items": r[1], "total_value": round(r[2] or 0, 2)}
        for r in results
    ]


@router.get("/top-consumed-materials")
def get_top_consumed(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
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
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    q = db.query(StockLedger)
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


@router.get("/material-cost-by-block")
def get_material_cost_by_block(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    results = db.query(
        Material.name,
        Block.name.label("block_name"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_cost"),
        func.sum(MaterialIssueItem.quantity).label("total_qty")
    ).join(
        MaterialIssueItem, MaterialIssueItem.material_id == Material.id
    ).join(
        MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id
    ).join(
        Block, MaterialIssue.issued_to_block_id == Block.id
    )
    if sd: results = results.filter(MaterialIssue.created_at >= sd)
    if ed: results = results.filter(MaterialIssue.created_at < ed)
    results = results.group_by(Material.name, Block.name).order_by(
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).desc()
    ).limit(20).all()

    return [
        {
            "material_name": r[0],
            "block_name": r[1],
            "total_cost": round(r[2] or 0, 2),
            "total_quantity": round(r[3] or 0, 2)
        }
        for r in results
    ]


@router.get("/consumption-trend")
def get_consumption_trend(
    start_date: Optional[str] = None, end_date: Optional[str] = None,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
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
    )
    
    if sd: query = query.filter(MaterialIssue.created_at >= sd)
    if ed: query = query.filter(MaterialIssue.created_at < ed)
    
    results = query.group_by(
        month_func
    ).order_by("month").limit(12).all()

    return [{"month": r[0] if r[0] else 'Unknown', "total_value": round(r[1] or 0, 2)} for r in results]


@router.get("/alerts")
def get_dashboard_alerts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alerts = db.query(Alert).filter(
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
