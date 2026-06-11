"""Finance routes — Payment Processing, Hard Copy Tracking, Payment Status, Reports."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models import Invoice, InvoiceItem, User, Vendor
from app.schemas import (
    InvoiceOut, SendForPaymentRequest, HardCopyUpdate, PaymentStatusUpdate, HardCopySentRequest
)
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.tz import get_now_ist

# Re-use _build_invoice_out from invoices router
from app.routers.invoices import _build_invoice_out

router = APIRouter(prefix="/api/finance", tags=["Finance"])


# ── Invoice listing for Finance ─────────────────────────────────────────

@router.get("/invoices", response_model=List[InvoiceOut])
def list_finance_invoices(
    payment_status: Optional[str] = None,
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """List all invoices visible to Finance — optionally filtered by payment_status."""
    q = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False
    )
    if payment_status:
        q = q.filter(Invoice.payment_status == payment_status)
    if status:
        q = q.filter(Invoice.status == status)
    if vendor_id:
        q = q.filter(Invoice.vendor_id == vendor_id)
    invoices = q.order_by(Invoice.created_at.desc()).all()
    return [_build_invoice_out(inv) for inv in invoices]


# ── Payment Processing: Approved invoices eligible for payment ──────────

@router.get("/verified-invoices", response_model=List[InvoiceOut])
def list_verified_invoices(
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """List verified invoices with payment_status='Pending' — eligible for payment processing."""
    q = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.status == "Approved",
        Invoice.payment_status == "Pending"
    )
    if vendor_id:
        q = q.filter(Invoice.vendor_id == vendor_id)
    invoices = q.order_by(Invoice.invoice_date.asc()).all()
    return [_build_invoice_out(inv) for inv in invoices]


@router.put("/send-for-payment")
def send_for_payment(
    data: SendForPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Mark selected invoices as 'Sent for Payment'. Total must be ≤ target_amount."""
    if not data.invoice_ids:
        raise HTTPException(status_code=400, detail="No invoices selected")

    invoices = db.query(Invoice).filter(
        Invoice.id.in_(data.invoice_ids),
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.status == "Approved",
        Invoice.payment_status == "Pending"
    ).all()

    if len(invoices) != len(data.invoice_ids):
        raise HTTPException(
            status_code=400,
            detail="Some invoices are not eligible (must be Approved and payment Pending)"
        )

    total = sum(inv.total_amount or 0 for inv in invoices)
    if data.target_amount > 0 and total > data.target_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Selected total ₹{total:,.2f} exceeds target ₹{data.target_amount:,.2f}. Must be exact or less."
        )

    now = get_now_ist()
    for inv in invoices:
        inv.payment_status = "Sent for Payment"
        inv.sent_for_payment_at = now
        inv.sent_for_payment_by_id = current_user.id

    db.commit()
    return {
        "message": f"{len(invoices)} invoice(s) sent for payment",
        "total_amount": total,
        "count": len(invoices)
    }


# ── Hard Copy Tracking ──────────────────────────────────────────────────

@router.get("/hard-copy/pending", response_model=List[InvoiceOut])
def list_pending_hard_copy(
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """List invoices pending hard copy receipt (status=Approved/Submitted, hard_copy_received=False)."""
    q = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.hard_copy_received == False,
        Invoice.status.in_(["Submitted", "Approved"])
    )
    if vendor_id:
        q = q.filter(Invoice.vendor_id == vendor_id)
    invoices = q.order_by(Invoice.created_at.desc()).all()
    return [_build_invoice_out(inv) for inv in invoices]


@router.put("/send-hard-copy")
def send_hard_copy(
    data: HardCopySentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Mark an invoice's hard copy as sent."""
    invoice = db.query(Invoice).filter(
        Invoice.id == data.invoice_id,
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.hard_copy_sent = True
    invoice.hard_copy_sent_at = get_now_ist()
    invoice.hard_copy_sent_by_id = current_user.id

    db.commit()
    db.refresh(invoice)
    return _build_invoice_out(invoice)


@router.get("/hard-copy/all", response_model=List[InvoiceOut])
def list_all_hard_copy(
    hard_copy_received: Optional[bool] = None,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """List all invoices for hard copy tracking — optionally filtered by receipt status."""
    q = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.status.in_(["Submitted", "Approved"])
    )
    if hard_copy_received is not None:
        q = q.filter(Invoice.hard_copy_received == hard_copy_received)
    if vendor_id:
        q = q.filter(Invoice.vendor_id == vendor_id)
    invoices = q.order_by(Invoice.created_at.desc()).all()
    return [_build_invoice_out(inv) for inv in invoices]


@router.put("/hard-copy")
def update_hard_copy(
    data: HardCopyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Record hard copy invoice receipt."""
    invoice = db.query(Invoice).filter(
        Invoice.id == data.invoice_id,
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.hard_copy_received = data.hard_copy_received
    invoice.hard_copy_received_at = get_now_ist() if data.hard_copy_received else None
    invoice.hard_copy_received_by_id = current_user.id if data.hard_copy_received else None
    invoice.hard_copy_remarks = data.hard_copy_remarks

    db.commit()
    db.refresh(invoice)
    return _build_invoice_out(invoice)


# ── Payment Status Management ───────────────────────────────────────────

@router.put("/update-payment-status")
def update_payment_status(
    data: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finance_invoices", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Mark selected invoices as 'Paid'."""
    if not data.invoice_ids:
        raise HTTPException(status_code=400, detail="No invoices selected")

    invoices = db.query(Invoice).filter(
        Invoice.id.in_(data.invoice_ids),
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.payment_status == "Sent for Payment"
    ).all()

    if len(invoices) != len(data.invoice_ids):
        raise HTTPException(
            status_code=400,
            detail="Some invoices are not eligible (must have payment status 'Sent for Payment')"
        )

    now = get_now_ist()
    for inv in invoices:
        inv.payment_status = "Paid"
        inv.payment_completed_at = now
        inv.payment_completed_by_id = current_user.id
        inv.payment_reference = data.payment_reference

    db.commit()
    return {
        "message": f"{len(invoices)} invoice(s) marked as Paid",
        "count": len(invoices)
    }


# ── Finance Reports ─────────────────────────────────────────────────────

@router.get("/reports/vendor-pending-invoices")
def vendor_pending_invoices_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_finance", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Vendor-wise pending invoices — count and total value of invoices not yet 'Approved'."""
    results = db.query(
        Vendor.id.label("vendor_id"),
        Vendor.code.label("vendor_code"),
        Vendor.name.label("vendor_name"),
        func.count(Invoice.id).label("invoice_count"),
        func.coalesce(func.sum(Invoice.total_amount), 0).label("total_value")
    ).join(
        Invoice, Invoice.vendor_id == Vendor.id
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.status.in_(["Draft", "Submitted", "Change Required"])
    ).group_by(
        Vendor.id, Vendor.code, Vendor.name
    ).order_by(
        Vendor.name
    ).all()

    data = []
    total_invoices = 0
    total_value = 0
    for row in results:
        inv_count = row.invoice_count or 0
        val = round(float(row.total_value or 0), 2)
        total_invoices += inv_count
        total_value += val
        data.append({
            "vendor_id": row.vendor_id,
            "vendor_code": row.vendor_code,
            "vendor_name": row.vendor_name,
            "invoice_count": inv_count,
            "total_value": val
        })

    return {
        "data": data,
        "summary": {
            "total_vendors": len(data),
            "total_invoices": total_invoices,
            "total_value": round(total_value, 2)
        },
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S")
    }


@router.get("/reports/vendor-pending-payments")
def vendor_pending_payments_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_finance", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Vendor-wise pending payments — outstanding amount from unpaid invoices (Approved but not Paid)."""
    results = db.query(
        Vendor.id.label("vendor_id"),
        Vendor.code.label("vendor_code"),
        Vendor.name.label("vendor_name"),
        func.count(Invoice.id).label("invoice_count"),
        func.coalesce(func.sum(Invoice.total_amount), 0).label("total_outstanding")
    ).join(
        Invoice, Invoice.vendor_id == Vendor.id
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False,
        Invoice.status == "Approved",
        Invoice.payment_status.in_(["Pending", "Sent for Payment"])
    ).group_by(
        Vendor.id, Vendor.code, Vendor.name
    ).order_by(
        Vendor.name
    ).all()

    data = []
    total_outstanding = 0
    total_invoices = 0
    for row in results:
        inv_count = row.invoice_count or 0
        outstanding = round(float(row.total_outstanding or 0), 2)
        total_invoices += inv_count
        total_outstanding += outstanding
        data.append({
            "vendor_id": row.vendor_id,
            "vendor_code": row.vendor_code,
            "vendor_name": row.vendor_name,
            "invoice_count": inv_count,
            "total_outstanding": outstanding
        })

    return {
        "data": data,
        "summary": {
            "total_vendors": len(data),
            "total_invoices": total_invoices,
            "total_outstanding": round(total_outstanding, 2)
        },
        "generated_at": get_now_ist().strftime("%d-%b-%Y %H:%M:%S")
    }


@router.get("/reports/vendor-pending-invoices/details")
def vendor_pending_invoices_details(
    vendor_id: int = Query(...),
    report_type: str = Query("pending_invoices", description="pending_invoices or pending_payments"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("report_finance", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Drill-down: individual invoices for a specific vendor."""
    q = db.query(Invoice).filter(
        Invoice.vendor_id == vendor_id,
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False
    )

    if report_type == "pending_payments":
        q = q.filter(
            Invoice.status == "Approved",
            Invoice.payment_status.in_(["Pending", "Sent for Payment"])
        )
    else:
        q = q.filter(
            Invoice.status.in_(["Draft", "Submitted", "Change Required"])
        )

    invoices = q.order_by(Invoice.invoice_date.desc()).all()
    return [_build_invoice_out(inv) for inv in invoices]
