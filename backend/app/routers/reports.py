from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import (
    MaterialIssue, MaterialIssueItem, Material, UOM, StockLedger, User
)
from app.auth import get_tenant_id, get_site_id, get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/issue-summary")
def get_issue_summary(
    from_date: str = Query(..., description="From Date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="To Date (YYYY-MM-DD)"),
    warehouse_id: Optional[int] = None,
    category_id: Optional[int] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    include_zero: bool = False,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Base query for materials
    material_query = db.query(Material, UOM.name.label("uom_name")).join(UOM, Material.uom_id == UOM.id).filter(
        Material.tenant_id == tenant_id,
        Material.site_id == site_id,
        Material.is_deleted == False
    )

    if category_id:
        material_query = material_query.filter(Material.category_id == category_id)

    if search:
        search_term = f"%{search}%"
        material_query = material_query.filter((Material.code.ilike(search_term)) | (Material.name.ilike(search_term)))

    materials = material_query.all()
    material_dict = {m.Material.id: {"material": m.Material, "uom": m.uom_name} for m in materials}
    material_ids = list(material_dict.keys())

    if not material_ids:
        return {"departments": [], "data": []}

    # Opening Stocks query (Latest stock ledger entry before from_date)
    # Since we can't easily do a greatest-n-per-group in simple sqlalchemy across many databases,
    # we can fetch stock ledgers before from_date ordered by created_at desc, and pick the first per material in Python.
    sl_query = db.query(StockLedger.material_id, StockLedger.balance).filter(
        StockLedger.tenant_id == tenant_id,
        StockLedger.site_id == site_id,
        StockLedger.material_id.in_(material_ids),
        StockLedger.created_at < dt_from
    )
    if warehouse_id:
        sl_query = sl_query.filter(StockLedger.warehouse_id == warehouse_id)

    # Order by created_at desc to get the latest balance
    sl_entries = sl_query.order_by(StockLedger.created_at.desc()).all()
    
    opening_stocks = {}
    for entry in sl_entries:
        if entry.material_id not in opening_stocks:
            opening_stocks[entry.material_id] = entry.balance

    # Issues query within date range
    issue_query = db.query(
        MaterialIssueItem.material_id,
        MaterialIssue.issued_to_department,
        MaterialIssue.issue_number,
        MaterialIssueItem.quantity
    ).join(MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id).filter(
        MaterialIssue.tenant_id == tenant_id,
        MaterialIssue.site_id == site_id,
        MaterialIssue.created_at >= dt_from,
        MaterialIssue.created_at <= dt_to,
        MaterialIssue.is_deleted == False,
        MaterialIssue.status != "DRAFT"
    )

    if warehouse_id:
        issue_query = issue_query.filter(MaterialIssue.warehouse_id == warehouse_id)
    if department:
        issue_query = issue_query.filter(MaterialIssue.issued_to_department.ilike(f"%{department}%"))

    issue_query = issue_query.filter(MaterialIssueItem.material_id.in_(material_ids))

    issue_results = issue_query.all()

    # Aggregate data
    department_set = set()
    aggregated_data = {}
    material_issue_numbers = {}

    for row in issue_results:
        m_id = row.material_id
        dept = row.issued_to_department or "UNKNOWN"
        qty = row.quantity or 0

        department_set.add(dept)

        if m_id not in aggregated_data:
            aggregated_data[m_id] = {}
        aggregated_data[m_id][dept] = aggregated_data[m_id].get(dept, 0) + qty

        if m_id not in material_issue_numbers:
            material_issue_numbers[m_id] = set()
        if row.issue_number:
            material_issue_numbers[m_id].add(row.issue_number)

    # Build final response
    departments_list = sorted(list(department_set))
    final_data = []

    for m_id, info in material_dict.items():
        mat = info["material"]
        uom = info["uom"]
        op_stock = opening_stocks.get(m_id, 0.0)
        issues = aggregated_data.get(m_id, {})
        total_issue = sum(issues.values())
        closing_stock = op_stock - total_issue
        
        issue_numbers_str = ", ".join(sorted(list(material_issue_numbers.get(m_id, set()))))

        has_transactions = total_issue > 0
        
        # Include logic: Include if include_zero is True and opening_stock > 0 OR if has_transactions is True
        if include_zero:
            if op_stock == 0 and not has_transactions:
                continue
        else:
            if not has_transactions:
                continue

        final_data.append({
            "material_id": mat.id,
            "material_code": mat.code,
            "material_name": mat.name,
            "uom": uom,
            "opening_stock": op_stock,
            "departments": issues,
            "total_issue": total_issue,
            "closing_stock": closing_stock,
            "issue_numbers": issue_numbers_str
        })

    # Sort final data by material name or code as default
    final_data.sort(key=lambda x: x["material_name"])

    return {
        "departments": departments_list,
        "data": final_data
    }

@router.get("/issue-summary-details")
def get_issue_summary_details(
    material_id: int = Query(...),
    department: str = Query(...),
    from_date: str = Query(..., description="From Date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="To Date (YYYY-MM-DD)"),
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    query = db.query(
        MaterialIssue.issue_number,
        MaterialIssue.created_at,
        MaterialIssueItem.quantity,
        User.full_name,
        MaterialIssueItem.remarks
    ).join(MaterialIssueItem, MaterialIssue.id == MaterialIssueItem.issue_id)\
     .outerjoin(User, MaterialIssue.issued_by_id == User.id)\
     .filter(
        MaterialIssue.tenant_id == tenant_id,
        MaterialIssue.site_id == site_id,
        MaterialIssueItem.material_id == material_id,
        MaterialIssue.created_at >= dt_from,
        MaterialIssue.created_at <= dt_to,
        MaterialIssue.is_deleted == False,
        MaterialIssue.status != "DRAFT"
    )

    if warehouse_id:
        query = query.filter(MaterialIssue.warehouse_id == warehouse_id)

    if department == "UNKNOWN":
        query = query.filter((MaterialIssue.issued_to_department == None) | (MaterialIssue.issued_to_department == ""))
    else:
        query = query.filter(MaterialIssue.issued_to_department == department)

    results = query.order_by(MaterialIssue.created_at.desc()).all()

    return [
        {
            "issue_no": row.issue_number,
            "date": row.created_at.strftime("%Y-%m-%d %H:%M") if row.created_at else "",
            "qty": row.quantity,
            "by": row.full_name or "System",
            "remarks": row.remarks or "-"
        }
        for row in results
    ]
