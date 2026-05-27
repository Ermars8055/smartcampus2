"""Invoice routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import Invoice, User, GateEntry, Vendor, PurchaseOrder
from app.schemas import InvoiceCreate, InvoiceOut, InvoiceUpdate
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
from app.utils.tz import get_now_ist

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


@router.get("", response_model=List[InvoiceOut])
def list_invoices(
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    po_id: Optional[int] = None,
    gate_entry_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("invoice", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Invoice).filter(
        Invoice.tenant_id == tenant_id, Invoice.site_id == site_id,
        Invoice.is_deleted == False
    )
    if status:
        q = q.filter(Invoice.status == status)
    if vendor_id:
        q = q.filter(Invoice.vendor_id == vendor_id)
    if po_id:
        q = q.filter(Invoice.po_id == po_id)
    if gate_entry_id:
        q = q.filter(Invoice.gate_entry_id == gate_entry_id)
        
    invoices = q.order_by(Invoice.created_at.desc()).all()
    result = []
    for inv in invoices:
        result.append(InvoiceOut(
            id=inv.id,
            invoice_number=inv.invoice_number,
            invoice_date=inv.invoice_date,
            gate_entry_id=inv.gate_entry_id,
            vendor_id=inv.vendor_id,
            po_id=inv.po_id,
            total_amount=inv.total_amount,
            tax_amount=inv.tax_amount,
            status=inv.status,
            scan_url=inv.scan_url,
            remarks=inv.remarks,
            created_at=inv.created_at,
            vendor_name=inv.vendor.name if inv.vendor else None,
            po_number=inv.purchase_order.po_number if inv.purchase_order else None,
            gate_entry_number=inv.gate_entry.entry_number if inv.gate_entry else None,
            created_by_name=inv.created_by.full_name if inv.created_by else None,
        ))
    return result


@router.post("", response_model=InvoiceOut)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("invoice", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    # Check vendor exists
    vendor = db.query(Vendor).filter(Vendor.id == data.vendor_id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id).first()
    if not vendor:
        raise HTTPException(status_code=400, detail="Invalid vendor")

    invoice = Invoice(
        tenant_id=tenant_id,
        site_id=site_id,
        invoice_number=data.invoice_number,
        invoice_date=data.invoice_date,
        gate_entry_id=data.gate_entry_id,
        vendor_id=data.vendor_id,
        po_id=data.po_id,
        total_amount=data.total_amount,
        tax_amount=data.tax_amount,
        scan_url=data.scan_url,
        remarks=data.remarks,
        created_by_id=current_user.id,
        status="Draft"
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    return InvoiceOut(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        gate_entry_id=invoice.gate_entry_id,
        vendor_id=invoice.vendor_id,
        po_id=invoice.po_id,
        total_amount=invoice.total_amount,
        tax_amount=invoice.tax_amount,
        status=invoice.status,
        scan_url=invoice.scan_url,
        remarks=invoice.remarks,
        created_at=invoice.created_at,
        vendor_name=invoice.vendor.name if invoice.vendor else None,
        po_number=invoice.purchase_order.po_number if invoice.purchase_order else None,
        gate_entry_number=invoice.gate_entry.entry_number if invoice.gate_entry else None,
        created_by_name=invoice.created_by.full_name if invoice.created_by else None,
    )


@router.put("/{id}", response_model=InvoiceOut)
def update_invoice(
    id: int,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("invoice", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == id,
        Invoice.tenant_id == tenant_id,
        Invoice.site_id == site_id,
        Invoice.is_deleted == False
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(invoice, key, value)
        
    db.commit()
    db.refresh(invoice)
    
    return InvoiceOut(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        gate_entry_id=invoice.gate_entry_id,
        vendor_id=invoice.vendor_id,
        po_id=invoice.po_id,
        total_amount=invoice.total_amount,
        tax_amount=invoice.tax_amount,
        status=invoice.status,
        scan_url=invoice.scan_url,
        remarks=invoice.remarks,
        created_at=invoice.created_at,
        vendor_name=invoice.vendor.name if invoice.vendor else None,
        po_number=invoice.purchase_order.po_number if invoice.purchase_order else None,
        gate_entry_number=invoice.gate_entry.entry_number if invoice.gate_entry else None,
        created_by_name=invoice.created_by.full_name if invoice.created_by else None,
    )
