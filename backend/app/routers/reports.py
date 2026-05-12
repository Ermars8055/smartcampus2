from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, case
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import (
    MaterialIssue, MaterialIssueItem, Material, UOM, StockLedger, User,
    GRN, GRNItem, Vendor, PurchaseOrder, Category, SubCategory, Warehouse
)
from app.auth import get_tenant_id, get_site_id, get_current_user, require_permission

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
    current_user: User = Depends(require_permission("reports", "read")),
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
    current_user: User = Depends(require_permission("reports", "read")),
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


# ==========================================
# MATERIAL RATE ANALYSIS REPORT
# ==========================================

@router.get("/rate-analysis")
def get_rate_analysis(
    from_date: str = Query(..., description="From Date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="To Date (YYYY-MM-DD)"),
    material_id: Optional[int] = None,
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    include_tax: bool = False,
    search: Optional[str] = None,
    variance_type: str = Query("amount", description="amount or percentage"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Material Rate Analysis main grid — aggregated min/max/avg/variance per material from GRN data."""
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if dt_from > dt_to:
        raise HTTPException(status_code=400, detail="From Date cannot exceed To Date.")

    # Build the rate expression — optionally add GST
    if include_tax:
        rate_expr = GRNItem.rate * (1 + Material.gst_rate / 100.0)
    else:
        rate_expr = GRNItem.rate

    # Base aggregation query
    query = db.query(
        GRNItem.material_id,
        Material.code.label("material_code"),
        Material.name.label("material_name"),
        Category.name.label("category_name"),
        func.min(rate_expr).label("min_rate"),
        func.max(rate_expr).label("max_rate"),
        func.avg(rate_expr).label("avg_rate"),
        func.count(func.distinct(GRN.id)).label("grn_txn_count")
    ).join(
        GRN, GRNItem.grn_id == GRN.id
    ).join(
        Material, GRNItem.material_id == Material.id
    ).join(
        Category, Material.category_id == Category.id
    ).filter(
        GRN.tenant_id == tenant_id,
        GRN.site_id == site_id,
        GRN.status == "Completed",
        GRN.is_deleted == False,
        GRN.created_at >= dt_from,
        GRN.created_at <= dt_to,
        Material.is_deleted == False
    )

    # Apply optional filters
    if material_id:
        query = query.filter(GRNItem.material_id == material_id)
    if category_id:
        query = query.filter(Material.category_id == category_id)
    if subcategory_id:
        query = query.filter(Material.subcategory_id == subcategory_id)
    if vendor_id:
        query = query.filter(GRN.vendor_id == vendor_id)
    if warehouse_id:
        query = query.filter(GRN.warehouse_id == warehouse_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Material.code.ilike(search_term)) | (Material.name.ilike(search_term))
        )

    query = query.group_by(
        GRNItem.material_id, Material.code, Material.name, Category.name
    )

    results = query.all()

    data = []
    for row in results:
        min_r = round(float(row.min_rate or 0), 2)
        max_r = round(float(row.max_rate or 0), 2)
        avg_r = round(float(row.avg_rate or 0), 2)
        variance_amt = round(max_r - min_r, 2)
        variance_pct = round(((max_r - min_r) / min_r) * 100, 2) if min_r > 0 else 0.0

        data.append({
            "material_id": row.material_id,
            "material_code": row.material_code,
            "material_name": row.material_name,
            "category_name": row.category_name,
            "min_rate": min_r,
            "max_rate": max_r,
            "avg_rate": avg_r,
            "variance": variance_pct if variance_type == "percentage" else variance_amt,
            "variance_amt": variance_amt,
            "variance_pct": variance_pct,
            "grn_txn_count": row.grn_txn_count
        })

    # Sort by material code by default
    data.sort(key=lambda x: x["material_code"])

    return {
        "data": data,
        "generated_at": datetime.now().strftime("%d-%b-%Y %H:%M:%S"),
        "total_materials": len(data),
        "variance_type": variance_type,
        "include_tax": include_tax
    }


@router.get("/rate-analysis/drilldown")
def get_rate_analysis_drilldown(
    material_id: int = Query(..., description="Material ID"),
    from_date: str = Query(..., description="From Date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="To Date (YYYY-MM-DD)"),
    vendor_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    include_tax: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Drill-down: detailed GRN transactions + vendor summary + chart data for a specific material."""
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Get material info
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    gst_rate = material.gst_rate or 0

    # Query all GRN items for this material within date range
    query = db.query(
        GRNItem, GRN, Vendor, PurchaseOrder
    ).join(
        GRN, GRNItem.grn_id == GRN.id
    ).join(
        Vendor, GRN.vendor_id == Vendor.id
    ).outerjoin(
        PurchaseOrder, GRN.po_id == PurchaseOrder.id
    ).filter(
        GRN.tenant_id == tenant_id,
        GRN.site_id == site_id,
        GRN.status == "Completed",
        GRN.is_deleted == False,
        GRNItem.material_id == material_id,
        GRN.created_at >= dt_from,
        GRN.created_at <= dt_to
    )

    if vendor_id:
        query = query.filter(GRN.vendor_id == vendor_id)
    if warehouse_id:
        query = query.filter(GRN.warehouse_id == warehouse_id)

    results = query.order_by(GRN.created_at.asc()).all()

    transactions = []
    chart_data = []
    vendor_rates = {}  # vendor_id -> list of rates + metadata

    for grn_item, grn, vendor, po in results:
        base_rate = float(grn_item.rate or 0)
        tax_pct = gst_rate
        tax_amount = round(base_rate * (tax_pct / 100.0), 2)
        net_rate = round(base_rate + tax_amount, 2) if include_tax else base_rate
        display_rate = net_rate if include_tax else base_rate
        qty = float(grn_item.accepted_quantity or grn_item.received_quantity or 0)
        total_amount = round(display_rate * qty, 2)

        grn_date = grn.created_at.strftime("%Y-%m-%d") if grn.created_at else ""
        grn_date_display = grn.created_at.strftime("%d-%b-%Y") if grn.created_at else ""

        transactions.append({
            "grn_number": grn.grn_number,
            "grn_date": grn_date,
            "grn_date_display": grn_date_display,
            "vendor_name": vendor.name,
            "vendor_id": vendor.id,
            "material_code": material.code,
            "material_name": material.name,
            "qty_received": qty,
            "purchase_rate": base_rate,
            "tax_pct": tax_pct,
            "tax_amount": tax_amount,
            "net_rate": net_rate,
            "total_amount": total_amount,
            "invoice_number": grn.invoice_number or "-",
            "invoice_date": grn.invoice_date.strftime("%d-%b-%Y") if grn.invoice_date else "-",
            "po_number": po.po_number if po else "-"
        })

        chart_data.append({
            "date": grn_date,
            "date_display": grn_date_display,
            "rate": display_rate,
            "vendor": vendor.name,
            "vendor_id": vendor.id,
            "grn": grn.grn_number
        })

        # Build vendor summary
        if vendor.id not in vendor_rates:
            vendor_rates[vendor.id] = {
                "vendor_id": vendor.id,
                "vendor_name": vendor.name,
                "rates": [],
                "latest_date": None,
                "latest_rate": 0
            }
        vendor_rates[vendor.id]["rates"].append(display_rate)
        if vendor_rates[vendor.id]["latest_date"] is None or (grn.created_at and grn.created_at > vendor_rates[vendor.id]["latest_date"]):
            vendor_rates[vendor.id]["latest_date"] = grn.created_at
            vendor_rates[vendor.id]["latest_rate"] = display_rate

    # Compute vendor summary
    vendor_summary = []
    for vid, vdata in vendor_rates.items():
        rates = vdata["rates"]
        vendor_summary.append({
            "vendor_id": vdata["vendor_id"],
            "vendor_name": vdata["vendor_name"],
            "min_rate": round(min(rates), 2),
            "max_rate": round(max(rates), 2),
            "avg_rate": round(sum(rates) / len(rates), 2),
            "latest_rate": round(vdata["latest_rate"], 2),
            "txn_count": len(rates)
        })

    vendor_summary.sort(key=lambda x: x["avg_rate"])

    return {
        "material": {
            "id": material.id,
            "code": material.code,
            "name": material.name,
            "gst_rate": gst_rate
        },
        "transactions": transactions,
        "vendor_summary": vendor_summary,
        "chart_data": chart_data
    }

