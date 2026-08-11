from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc, case
from typing import List, Optional
from datetime import datetime
from app.utils.tz import get_now_ist

from app.database import get_db
from app.models import (
    MaterialIssue, MaterialIssueItem, Material, UOM, StockLedger, User,
    GRN, GRNItem, Vendor, PurchaseOrder, Category, SubCategory, Warehouse,
    Department, MaterialReturn, MaterialReturnItem, GatePass, GatePassItem,
    Institution
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
    institution_id: Optional[int] = None,
    include_zero: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_issue_summary", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # Base query for materials
    material_query = db.query(Material, UOM.abbreviation.label("uom_name")).join(UOM, Material.uom_id == UOM.id).filter(
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

    project_id = None
    if institution_id:
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if inst:
            project_id = inst.project_id

    # Opening Stocks query (Sum of latest balance per warehouse before from_date)
    sl_op_query = db.query(StockLedger.material_id, StockLedger.warehouse_id, StockLedger.balance).filter(
        StockLedger.tenant_id == tenant_id,
        StockLedger.site_id == site_id,
        StockLedger.material_id.in_(material_ids),
        StockLedger.created_at < dt_from
    )
    if warehouse_id:
        sl_op_query = sl_op_query.filter(StockLedger.warehouse_id == warehouse_id)
    if project_id:
        sl_op_query = sl_op_query.filter(StockLedger.project_id == project_id)

    sl_op_entries = sl_op_query.order_by(StockLedger.created_at.desc()).all()
    
    op_stocks_per_wh = {} # (material_id, warehouse_id) -> balance
    for entry in sl_op_entries:
        key = (entry.material_id, entry.warehouse_id)
        if key not in op_stocks_per_wh:
            op_stocks_per_wh[key] = entry.balance
    
    opening_stocks = {}
    for (m_id, wh_id), bal in op_stocks_per_wh.items():
        opening_stocks[m_id] = opening_stocks.get(m_id, 0) + bal


    # Receipts query within date range (from StockLedger)
    sl_rcpt_query = db.query(
        StockLedger.material_id, 
        func.sum(StockLedger.quantity).label("total_received")
    ).filter(
        StockLedger.tenant_id == tenant_id,
        StockLedger.site_id == site_id,
        StockLedger.material_id.in_(material_ids),
        StockLedger.created_at >= dt_from,
        StockLedger.created_at <= dt_to,
        StockLedger.quantity > 0
    )
    if warehouse_id:
        sl_rcpt_query = sl_rcpt_query.filter(StockLedger.warehouse_id == warehouse_id)
    if project_id:
        sl_rcpt_query = sl_rcpt_query.filter(StockLedger.project_id == project_id)
    
    sl_rcpt_results = sl_rcpt_query.group_by(StockLedger.material_id).all()
    material_receipts = {row.material_id: row.total_received for row in sl_rcpt_results}

    # Total Outward query within date range (from StockLedger where quantity < 0)
    sl_outward_query = db.query(
        StockLedger.material_id, 
        func.sum(StockLedger.quantity).label("total_outward")
    ).filter(
        StockLedger.tenant_id == tenant_id,
        StockLedger.site_id == site_id,
        StockLedger.material_id.in_(material_ids),
        StockLedger.created_at >= dt_from,
        StockLedger.created_at <= dt_to,
        StockLedger.quantity < 0
    )
    if warehouse_id:
        sl_outward_query = sl_outward_query.filter(StockLedger.warehouse_id == warehouse_id)
    if project_id:
        sl_outward_query = sl_outward_query.filter(StockLedger.project_id == project_id)
    
    sl_outward_results = sl_outward_query.group_by(StockLedger.material_id).all()
    material_outward = {row.material_id: abs(row.total_outward) for row in sl_outward_results}

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
    if project_id:
        issue_query = issue_query.filter(MaterialIssue.project_id == project_id)
        
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope == "Department" and current_user.department:
            department = current_user.department
        elif scope == "Self Only":
            issue_query = issue_query.filter(MaterialIssue.issued_by_id == current_user.id)

    if department:
        dept_list = [d.strip() for d in department.split(',')]
        issue_query = issue_query.filter(MaterialIssue.issued_to_department.in_(dept_list))

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
        op_stock = round(opening_stocks.get(m_id, 0.0))
        issues = aggregated_data.get(m_id, {})
        total_issue = round(sum(issues.values()))
        total_received = round(material_receipts.get(m_id, 0.0))
        total_outward_all = round(material_outward.get(m_id, 0.0))
        other_outward = max(0, total_outward_all - total_issue)
        closing_stock = op_stock + total_received - (total_issue + other_outward)
        
        issue_numbers_str = ", ".join(sorted(list(material_issue_numbers.get(m_id, set()))))

        has_transactions = (total_issue > 0) or (total_received > 0)
        
        # Include logic: Include if include_zero is True and (opening_stock > 0 or has_transactions)
        if not include_zero and not has_transactions:
            continue

        final_data.append({
            "material_id": mat.id,
            "material_code": mat.code,
            "material_name": mat.name,
            "uom": uom,
            "opening_stock": op_stock,
            "total_received": total_received,
            "departments": issues,
            "total_issue": total_issue,
            "other_outward": other_outward,
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
    institution_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_issue_summary", "read")),
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

    if institution_id:
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if inst and inst.project_id:
            query = query.filter(MaterialIssue.project_id == inst.project_id)

    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope == "Department" and current_user.department:
            department = current_user.department
        elif scope == "Self Only":
            query = query.filter(MaterialIssue.issued_by_id == current_user.id)

    if department == "UNKNOWN":
        query = query.filter((MaterialIssue.issued_to_department == None) | (MaterialIssue.issued_to_department == ""))
    else:
        query = query.filter(MaterialIssue.issued_to_department == department)

    results = query.order_by(MaterialIssue.created_at.desc()).all()

    return [
        {
            "issue_no": row.issue_number,
            "date": row.created_at.strftime("%Y-%m-%d %H:%M") if row.created_at else "",
            "qty": round(row.quantity or 0),
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
    current_user: User = Depends(require_permission("report_rate_analysis", "read")),
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
        UOM.abbreviation.label("uom_name"),
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
        UOM, Material.uom_id == UOM.id
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
        GRNItem.material_id, Material.code, Material.name, UOM.abbreviation, Category.name
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
            "uom": row.uom_name,
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
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S"),
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
    current_user: User = Depends(require_permission("report_rate_analysis", "read")),
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
        qty = round(float(grn_item.accepted_quantity or grn_item.received_quantity or 0))
        total_amount = round(display_rate * qty, 2)

        grn_date = grn.created_at.strftime("%Y-%m-%d") if grn.created_at else ""
        grn_date_display = grn.created_at.strftime("%d-%b-%Y") if grn.created_at else ""

        transactions.append({
            "grn_number": grn.grn_number,
            "grn_date": grn_date,
            "grn_date_display": grn_date_display,
            "vendor_name": f"{vendor.code} - {vendor.name}",
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
                "vendor_name": f"{vendor.code} - {vendor.name}",
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


# ==========================================
# RECEIPT SUMMARY REPORT
# ==========================================

@router.get("/receipt-summary")
def get_receipt_summary(
    from_date: str = Query(..., description="From Date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="To Date (YYYY-MM-DD)"),
    warehouse_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    search: Optional[str] = None,
    grn_number: Optional[str] = None,
    include_cancelled: bool = False,
    only_receipts: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_receipt_summary", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Main Store Items - Receipt Summary Report with dynamic vendor columns."""
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    # 1. Base Query for GRN Items
    query = db.query(
        GRNItem.material_id,
        Material.code.label("material_code"),
        Material.name.label("material_name"),
        UOM.abbreviation.label("uom"),
        Material.category_id,
        Material.subcategory_id,
        Vendor.id.label("vendor_id"),
        Vendor.code.label("vendor_code"),
        Vendor.name.label("vendor_name"),
        GRN.grn_number,
        GRN.invoice_number,
        GRN.invoice_date,
        GRNItem.accepted_quantity,
        GRNItem.rate,
        GRNItem.taxable_amount,
        (GRNItem.taxable_amount + GRNItem.cgst_amount + GRNItem.sgst_amount + GRNItem.igst_amount).label("total_amount")
    ).join(GRN, GRNItem.grn_id == GRN.id)\
     .join(Material, GRNItem.material_id == Material.id)\
     .join(UOM, Material.uom_id == UOM.id)\
     .join(Vendor, GRN.vendor_id == Vendor.id)\
     .filter(
        GRN.tenant_id == tenant_id,
        GRN.site_id == site_id,
        GRN.status == "Completed",
        GRN.created_at >= dt_from,
        GRN.created_at <= dt_to
    )

    if not include_cancelled:
        query = query.filter(GRN.is_deleted == False)

    if warehouse_id:
        query = query.filter(GRN.warehouse_id == warehouse_id)
    if vendor_id:
        query = query.filter(GRN.vendor_id == vendor_id)
    if category_id:
        query = query.filter(Material.category_id == category_id)
    if subcategory_id:
        query = query.filter(Material.subcategory_id == subcategory_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter((Material.code.ilike(search_term)) | (Material.name.ilike(search_term)))
    if grn_number:
        query = query.filter(GRN.grn_number.ilike(f"%{grn_number}%"))

    results = query.all()

    # 2. Pivot data in Python
    # Structure: { material_id: { info: {...}, vendors: { vendor_id: { sum_qty, sum_amt, latest_bill... } } } }
    pivoted = {}
    unique_vendors = {} # vendor_id -> name

    for row in results:
        m_id = row.material_id
        v_id = row.vendor_id
        unique_vendors[v_id] = {"name": row.vendor_name, "code": row.vendor_code}

        if m_id not in pivoted:
            pivoted[m_id] = {
                "material_id": m_id,
                "material_code": row.material_code,
                "material_name": row.material_name,
                "uom": row.uom,
                "vendor_details": {}
            }
        
        if v_id not in pivoted[m_id]["vendor_details"]:
            pivoted[m_id]["vendor_details"][v_id] = {
                "vendor_id": v_id,
                "vendor_name": row.vendor_name,
                "qty": 0.0,
                "amount": 0.0,
                "total": 0.0,
                "latest_bill_no": row.invoice_number,
                "latest_bill_date": row.invoice_date,
                "rate": row.rate, # We'll use the latest rate for display, or could avg
                "transactions": []
            }
        
        v_data = pivoted[m_id]["vendor_details"][v_id]
        v_data["qty"] = round(v_data["qty"] + float(row.accepted_quantity or 0))
        v_data["amount"] = round(v_data["amount"] + float(row.taxable_amount or 0), 2)
        v_data["total"] = round(v_data["total"] + float(row.total_amount or 0), 2)
        
        # Update latest bill if this one is newer
        if row.invoice_date and (not v_data["latest_bill_date"] or row.invoice_date > v_data["latest_bill_date"]):
            v_data["latest_bill_no"] = row.invoice_number
            v_data["latest_bill_date"] = row.invoice_date
            v_data["rate"] = row.rate

        v_data["transactions"].append({
            "bill_no": row.invoice_number,
            "bill_date": row.invoice_date,
            "qty": round(float(row.accepted_quantity or 0)),
            "rate": float(row.rate or 0),
            "amount": round(float(row.taxable_amount or 0), 2),
            "total": round(float(row.total_amount or 0), 2)
        })

    # Convert to list and sort
    final_data = list(pivoted.values())
    final_data.sort(key=lambda x: x["material_name"])

    # Sorted vendors for column consistency
    sorted_vendors = [{"id": vid, "name": vdata["name"], "code": vdata["code"]} for vid, vdata in sorted(unique_vendors.items(), key=lambda x: x[1]["name"])]

    return {
        "vendors": sorted_vendors,
        "data": final_data,
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S")
    }

@router.get("/receipt-summary/details")
def get_receipt_summary_details(
    material_id: int = Query(...),
    vendor_id: int = Query(...),
    from_date: str = Query(...),
    to_date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_receipt_summary", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Fetch all GRN items for a specific material and vendor within the range."""
    try:
        dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
        dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    items = db.query(
        GRN.grn_number,
        GRN.created_at.label("grn_date"),
        Vendor.code.label("vendor_code"),
        Vendor.name.label("vendor_name"),
        GRN.invoice_number,
        GRN.invoice_date,
        Material.code.label("material_code"),
        Material.name.label("material_name"),
        UOM.abbreviation.label("uom"),
        GRNItem.accepted_quantity,
        GRNItem.rate,
        GRNItem.taxable_amount,
        (GRNItem.cgst_amount + GRNItem.sgst_amount + GRNItem.igst_amount).label("tax_amount"),
        (GRNItem.taxable_amount + GRNItem.cgst_amount + GRNItem.sgst_amount + GRNItem.igst_amount).label("total_amount"),
        Warehouse.name.label("warehouse_name"),
        User.full_name.label("received_by"),
        GRN.remarks
    ).join(GRN, GRNItem.grn_id == GRN.id)\
     .join(Material, GRNItem.material_id == Material.id)\
     .join(UOM, Material.uom_id == UOM.id)\
     .join(Vendor, GRN.vendor_id == Vendor.id)\
     .join(Warehouse, GRN.warehouse_id == Warehouse.id)\
     .join(User, GRN.received_by_id == User.id)\
     .filter(
        GRN.tenant_id == tenant_id,
        GRN.site_id == site_id,
        GRNItem.material_id == material_id,
        GRN.vendor_id == vendor_id,
        GRN.status == "Completed",
        GRN.is_deleted == False,
        GRN.created_at >= dt_from,
        GRN.created_at <= dt_to
    ).order_by(GRN.created_at.desc()).all()

    return [
        {
            "grn_number": row.grn_number,
            "grn_date": row.grn_date.strftime("%d-%b-%Y") if row.grn_date else "",
            "vendor_name": f"{row.vendor_code} - {row.vendor_name}",
            "bill_number": row.invoice_number,
            "bill_date": row.invoice_date.strftime("%d-%b-%Y") if row.invoice_date else "",
            "material_code": row.material_code,
            "material_name": row.material_name,
            "uom": row.uom,
            "qty_received": round(row.accepted_quantity or 0),
            "rate": round(float(row.rate or 0), 2),
            "tax_amount": round(float(row.tax_amount or 0), 2),
            "total_amount": round(float(row.total_amount or 0), 2),
            "store_name": row.warehouse_name,
            "received_by": row.received_by,
            "remarks": row.remarks
        }
        for row in items
    ]



@router.get("/department-inventory")
def get_department_inventory_report(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    institution_id: Optional[int] = None,
    only_with_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_dept_inventory", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """
    Consolidated live inventory snapshot across all departments.
    Calculated as: Issues to Dept - Returns from Dept.
    """
    # 1. Fetch all active materials
    mat_query = db.query(Material, UOM.abbreviation.label("uom_name")).join(UOM, Material.uom_id == UOM.id).filter(
        Material.tenant_id == tenant_id,
        Material.site_id == site_id,
        Material.is_deleted == False
    )
    if category_id:
        mat_query = mat_query.filter(Material.category_id == category_id)
    if search:
        search_term = f"%{search}%"
        mat_query = mat_query.filter((Material.code.ilike(search_term)) | (Material.name.ilike(search_term)))
    
    materials = mat_query.all()
    material_ids = [m.Material.id for m in materials]
    
    if not material_ids:
        return {"departments": [], "data": []}

    project_id = None
    if institution_id:
        inst = db.query(Institution).filter(Institution.id == institution_id).first()
        if inst:
            project_id = inst.project_id

    # 2. Fetch all active departments for dynamic columns
    dept_query = db.query(Department, Institution.name.label("institution_name"))\
        .outerjoin(Institution, Department.institution_id == Institution.id)\
        .filter(
            Department.tenant_id == tenant_id,
            Department.site_id == site_id,
            Department.is_active == True,
            Department.is_deleted == False
        )
    if department_id:
        dept_ids = [int(id.strip()) for id in department_id.split(',')]
        dept_query = dept_query.filter(Department.id.in_(dept_ids))
    if institution_id:
        dept_query = dept_query.filter(Department.institution_id == institution_id)
    
    all_depts = dept_query.order_by(Institution.name, Department.name).all()
    
    institutions_dict = {}
    dept_names = []
    
    for dept, inst_name in all_depts:
        inst = inst_name or "General"
        if inst not in institutions_dict:
            institutions_dict[inst] = {"name": inst, "departments": []}
            
        institutions_dict[inst]["departments"].append(dept.name)
        if dept.name not in dept_names:
            dept_names.append(dept.name)
            
    institutions_list = list(institutions_dict.values())
    
    if not institutions_list:
        return {"institutions": [], "departments": [], "data": []}

    # 3. Calculate Issues per material per department
    issues_query = db.query(
        MaterialIssueItem.material_id,
        MaterialIssue.issued_to_department,
        func.sum(MaterialIssueItem.quantity).label("total_issued")
    ).join(MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id).filter(
        MaterialIssue.tenant_id == tenant_id,
        MaterialIssue.site_id == site_id,
        MaterialIssue.is_deleted == False,
        MaterialIssue.status == "Completed",
        MaterialIssueItem.material_id.in_(material_ids)
    )
    if project_id:
        issues_query = issues_query.filter(MaterialIssue.project_id == project_id)
        
    issues_query = issues_query.group_by(MaterialIssueItem.material_id, MaterialIssue.issued_to_department).all()

    issues_map = {} # (material_id, department_name) -> qty
    for row in issues_query:
        dept = row.issued_to_department.upper() if row.issued_to_department else "UNKNOWN"
        # Since multiple casings could map to the same upper-case, we accumulate
        issues_map[(row.material_id, dept)] = issues_map.get((row.material_id, dept), 0) + row.total_issued

    # 4. Calculate Returns per material per department
    returns_query = db.query(
        MaterialReturnItem.material_id,
        MaterialReturn.returned_from_department,
        func.sum(MaterialReturnItem.returned_qty).label("total_returned")
    ).join(MaterialReturn, MaterialReturnItem.return_id == MaterialReturn.id).filter(
        MaterialReturn.tenant_id == tenant_id,
        MaterialReturn.site_id == site_id,
        MaterialReturn.is_deleted == False,
        MaterialReturnItem.material_id.in_(material_ids)
    )
    if project_id:
        returns_query = returns_query.filter(MaterialReturn.project_id == project_id)
        
    returns_query = returns_query.group_by(MaterialReturnItem.material_id, MaterialReturn.returned_from_department).all()

    returns_map = {} # (material_id, department_name) -> qty
    for row in returns_query:
        dept = row.returned_from_department.upper() if row.returned_from_department else "UNKNOWN"
        returns_map[(row.material_id, dept)] = returns_map.get((row.material_id, dept), 0) + row.total_returned

    # 5. Build final data matrix
    final_data = []
    for m in materials:
        mat = m.Material
        uom = m.uom_name
        
        dept_inventory = {}
        total_mat_inv = 0.0
        
        for d_name in dept_names:
            issued = issues_map.get((mat.id, d_name.upper()), 0.0)
            returned = returns_map.get((mat.id, d_name.upper()), 0.0)
            net = round(max(0.0, issued - returned))
            
            dept_inventory[d_name] = net
            total_mat_inv += net
        
        if only_with_stock and total_mat_inv <= 0:
            continue
            
        final_data.append({
            "material_id": mat.id,
            "material_code": mat.code,
            "material_name": mat.name,
            "uom": uom,
            "department_inventory": dept_inventory,
            "total_inventory": round(total_mat_inv)
        })

    return {
        "institutions": institutions_list,
        "departments": dept_names,
        "data": final_data,
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S")
    }

# ==========================================
# PENDING GATEPASS RETURNS REPORT
# ==========================================

@router.get("/pending-gatepass-returns")
def get_pending_gatepass_returns(
    from_date: Optional[str] = Query(None, description="From Date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="To Date (YYYY-MM-DD)"),
    vendor_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_pending_gatepass", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Pending Gatepass Returns Report - Returnable items that are not yet received."""
    query = db.query(
        GatePassItem.material_id,
        GatePass.vendor_id,
        GatePass.gate_pass_number,
        GatePass.created_at.label("gate_pass_date"),
        Vendor.name.label("vendor_name"),
        Vendor.code.label("vendor_code"),
        GatePass.vendor_custom_name,
        Material.code.label("material_code"),
        Material.name.label("material_name"),
        UOM.abbreviation.label("uom_name"),
        GatePassItem.quantity,
        GatePass.status,
        GatePass.from_department,
        GatePass.from_store,
        GatePass.driver_name,
        GatePass.vehicle_number
    ).join(GatePassItem, GatePass.id == GatePassItem.gate_pass_id)\
     .join(Material, GatePassItem.material_id == Material.id)\
     .outerjoin(UOM, Material.uom_id == UOM.id)\
     .outerjoin(Vendor, GatePass.vendor_id == Vendor.id)\
     .filter(
        GatePass.tenant_id == tenant_id,
        GatePass.site_id == site_id,
        GatePass.gate_pass_type == "Returnable",
        GatePass.status != "Received"
    )

    if from_date and to_date:
        try:
            dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
            dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(GatePass.created_at >= dt_from, GatePass.created_at <= dt_to)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format.")

    if vendor_id:
        query = query.filter(GatePass.vendor_id == vendor_id)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (GatePass.gate_pass_number.ilike(search_term)) | 
            (Vendor.name.ilike(search_term)) |
            (GatePass.vendor_custom_name.ilike(search_term)) |
            (Material.name.ilike(search_term))
        )

    results = query.order_by(GatePass.created_at.desc()).all()

    pivoted = {}
    unique_vendors = {} # vendor_id -> name

    for row in results:
        m_id = row.material_id
        # vendor identity
        v_id = row.vendor_id or f"custom_{row.vendor_custom_name}"
        vendor_name = f"{row.vendor_code} - {row.vendor_name}" if row.vendor_name else row.vendor_custom_name
        unique_vendors[v_id] = vendor_name

        if m_id not in pivoted:
            pivoted[m_id] = {
                "material_id": m_id,
                "material_code": row.material_code,
                "material_name": row.material_name,
                "uom_name": row.uom_name,
                "vendor_details": {}
            }
        
        if v_id not in pivoted[m_id]["vendor_details"]:
            pivoted[m_id]["vendor_details"][v_id] = {
                "vendor_id": v_id,
                "vendor_name": vendor_name,
                "transactions": []
            }
            
        age_days = (datetime.now().date() - row.gate_pass_date.date()).days if row.gate_pass_date else 0
        
        pivoted[m_id]["vendor_details"][v_id]["transactions"].append({
            "gate_pass_number": row.gate_pass_number,
            "gate_pass_date": row.gate_pass_date.strftime("%d-%b-%Y") if row.gate_pass_date else "",
            "quantity": round(row.quantity or 0, 2),
            "status": row.status,
            "from_location": row.from_department or row.from_store or "N/A",
            "driver_name": row.driver_name,
            "vehicle_number": row.vehicle_number,
            "age_days": age_days
        })

    final_data = list(pivoted.values())
    final_data.sort(key=lambda x: x["material_name"])
    
    sorted_vendors = [{"id": vid, "name": vname} for vid, vname in sorted(unique_vendors.items(), key=lambda x: x[1])]

    return {
        "vendors": sorted_vendors,
        "data": final_data,
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S"),
        "generated_by": current_user.full_name
    }


@router.get("/equipment-count")
def get_equipment_count_report(
    institution_id: Optional[int] = None,
    category_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    location_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    include_zero: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    from app.models import EquipmentItem, Material, GRN
    from sqlalchemy import func, or_

    if include_zero:
        q = db.query(
            Material.name.label("equipment_name"),
            func.count(EquipmentItem.id).label("count")
        ).select_from(Material).outerjoin(
            EquipmentItem, 
            (EquipmentItem.material_id == Material.id) & 
            (EquipmentItem.tenant_id == tenant_id) & 
            (EquipmentItem.site_id == site_id)
        ).filter(
            Material.tenant_id == tenant_id,
            Material.is_deleted == False
        )
        if institution_id:
            q = q.filter(or_(EquipmentItem.institution_id == institution_id, EquipmentItem.id == None))
        if location_id:
            q = q.filter(or_(EquipmentItem.location_id == location_id, EquipmentItem.id == None))
        if status:
            q = q.filter(or_(EquipmentItem.status == status, EquipmentItem.id == None))
        if category_id:
            q = q.filter(Material.category_id == category_id)
        if vendor_id:
            q = q.outerjoin(GRN, EquipmentItem.grn_id == GRN.id).filter(or_(GRN.vendor_id == vendor_id, EquipmentItem.id == None))
    else:
        q = db.query(
            Material.name.label("equipment_name"), 
            func.count(EquipmentItem.id).label("count")
        ).join(
            EquipmentItem, EquipmentItem.material_id == Material.id
        ).filter(
            EquipmentItem.tenant_id == tenant_id,
            EquipmentItem.site_id == site_id
        )
        if institution_id:
            q = q.filter(EquipmentItem.institution_id == institution_id)
        if location_id:
            q = q.filter(EquipmentItem.location_id == location_id)
        if status:
            q = q.filter(EquipmentItem.status == status)
        if category_id:
            q = q.filter(Material.category_id == category_id)
        if vendor_id:
            q = q.outerjoin(GRN, EquipmentItem.grn_id == GRN.id).filter(GRN.vendor_id == vendor_id)

    if search:
        q = q.filter(Material.name.ilike(f"%{search}%"))

    results = q.group_by(Material.name).order_by(Material.name.asc()).all()

    return [
        {"equipment_name": r.equipment_name, "count": r.count}
        for r in results
    ]


@router.get("/department-equipment")
def get_department_equipment_report(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    institution_id: Optional[int] = None,
    only_with_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_dept_inventory", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    from app.models import EquipmentItem, LocationMaster, Material, UOM, Institution
    from sqlalchemy import func

    mat_query = db.query(Material, UOM.abbreviation.label("uom_name")).join(UOM, Material.uom_id == UOM.id).join(
        EquipmentItem, EquipmentItem.material_id == Material.id
    ).filter(
        Material.tenant_id == tenant_id,
        Material.site_id == site_id,
        Material.is_deleted == False,
        EquipmentItem.status != "Written Off",
        EquipmentItem.status != "Transferred"
    )
    if category_id:
        mat_query = mat_query.filter(Material.category_id == category_id)
    if search:
        search_term = f"%{search}%"
        mat_query = mat_query.filter((Material.code.ilike(search_term)) | (Material.name.ilike(search_term)))
    
    mat_query = mat_query.distinct()
    materials = mat_query.all()
    material_ids = [m.Material.id for m in materials]
    
    if not material_ids:
        return {"departments": [], "data": []}

    loc_query = db.query(LocationMaster).filter(
        LocationMaster.tenant_id == tenant_id,
        LocationMaster.site_id == site_id,
        LocationMaster.is_active == True
    )
    if department_id:
        loc_ids = [int(id.strip()) for id in department_id.split(',')]
        loc_query = loc_query.filter(LocationMaster.id.in_(loc_ids))
        
    all_locs = loc_query.order_by(LocationMaster.location_name).all()
    loc_names = [l.location_name for l in all_locs]

    count_query = db.query(
        EquipmentItem.material_id,
        LocationMaster.location_name,
        func.count(EquipmentItem.id).label("total_qty")
    ).join(LocationMaster, EquipmentItem.location_id == LocationMaster.id).filter(
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id,
        EquipmentItem.status != "Written Off",
        EquipmentItem.status != "Transferred",
        EquipmentItem.material_id.in_(material_ids)
    )
    if institution_id:
        count_query = count_query.filter(EquipmentItem.institution_id == institution_id)
        
    count_query = count_query.group_by(EquipmentItem.material_id, LocationMaster.location_name).all()

    count_map = {} 
    for row in count_query:
        loc = row.location_name.upper() if row.location_name else "UNKNOWN"
        count_map[(row.material_id, loc)] = row.total_qty

    final_data = []
    for m in materials:
        mat = m.Material
        uom = m.uom_name
        
        dept_inventory = {}
        total_mat_inv = 0
        
        for loc_name in loc_names:
            qty = count_map.get((mat.id, loc_name.upper()), 0)
            dept_inventory[loc_name] = qty
            total_mat_inv += qty
            
        if only_with_stock and total_mat_inv <= 0:
            continue
            
        final_data.append({
            "material_code": mat.code,
            "material_name": mat.name,
            "uom": uom,
            "category": getattr(mat.category, 'name', 'N/A') if hasattr(mat, 'category') else 'N/A',
            "total_inventory": total_mat_inv,
            "department_inventory": dept_inventory
        })

    return {
        "departments": loc_names,
        "data": final_data,
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S"),
        "generated_by": current_user.full_name
    }


# ==========================================
# CALL STATUS REPORT
# ==========================================

@router.get("/call-status")
def get_call_status_report(
    start_date: Optional[str] = Query(None, description="Start Date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End Date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Report for Maintenance Call Statuses (AMC, CMC, Warranty, No Contract)"""
    from app.models import Complaint, EquipmentItem
    from datetime import timedelta
    from app.routers.complaints import _enrich
    
    now = get_now_ist()
    
    if start_date:
        dt_start = datetime.strptime(start_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
    else:
        dt_start = (now - timedelta(days=30)).replace(hour=0, minute=0, second=0)
        
    if end_date:
        dt_end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    else:
        dt_end = now.replace(hour=23, minute=59, second=59)

    query = db.query(Complaint).outerjoin(EquipmentItem).filter(
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False,
        Complaint.created_at >= dt_start,
        Complaint.created_at <= dt_end
    )
    
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    summary = {
        "AMC": 0,
        "CMC": 0,
        "Warranty": 0,
        "Out of Warranty": 0,
        "Preventive Maintenance": 0,
        "Calibration": 0,
        "Installation": 0
    }
    
    history = []
    
    for c in complaints:
        enriched_c = _enrich(c, db)
        status = enriched_c.equipment_warranty_status
        ctype = c.complaint_type or "Breakdown"
        
        if status == "AMC":
            display_status = "AMC"
            summary["AMC"] += 1
        elif status == "CMC":
            display_status = "CMC"
            summary["CMC"] += 1
        elif status == "Warranty":
            display_status = "Warranty"
            summary["Warranty"] += 1
        else:
            if ctype in ("PM", "Preventive Maintenance Call"):
                display_status = "Preventive Maintenance"
                summary["Preventive Maintenance"] += 1
            elif ctype in ("Calibration", "Calibration Call"):
                display_status = "Calibration"
                summary["Calibration"] += 1
            elif ctype == "Installation":
                display_status = "Installation"
                summary["Installation"] += 1
            else:
                display_status = "Out of Warranty"
                summary["Out of Warranty"] += 1
            
        history.append({
            "docket_no": enriched_c.docket_no,
            "created_at": enriched_c.created_at.strftime("%Y-%m-%d %H:%M") if enriched_c.created_at else "",
            "department": enriched_c.department_name or "-",
            "nature_of_complaint": enriched_c.nature_of_complaint or "-",
            "assigned_to": enriched_c.assigned_to_name or "-",
            "status": enriched_c.status,
            "service_category": display_status,
            "equipment_code": enriched_c.equipment_code or "-",
            "resolved_at": enriched_c.resolved_at.strftime("%Y-%m-%d %H:%M") if enriched_c.resolved_at else "-"
        })
        
    return {
        "summary": summary,
        "history": history
    }
