"""Invoice routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import Invoice, InvoiceItem, User, GateEntry, Vendor, PurchaseOrder
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
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            q = q.filter(Invoice.created_by_id == current_user.id)
            
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
            eway_bill_number=inv.eway_bill_number,
            delivery_note=inv.delivery_note,
            delivery_note_date=inv.delivery_note_date,
            payment_terms=inv.payment_terms,
            reference_number=inv.reference_number,
            reference_date=inv.reference_date,
            dispatch_doc_number=inv.dispatch_doc_number,
            dispatched_through=inv.dispatched_through,
            destination=inv.destination,
            lr_rr_number=inv.lr_rr_number,
            vehicle_number=inv.vehicle_number,
            terms_of_delivery=inv.terms_of_delivery,
            total_taxable_amount=inv.total_taxable_amount,
            total_cgst=inv.total_cgst,
            total_sgst=inv.total_sgst,
            total_igst=inv.total_igst,
            total_discount=inv.total_discount,
            total_amount=inv.total_amount,
            tax_amount=inv.tax_amount,
            status=inv.status,
            scan_url=inv.scan_url,
            remarks=inv.remarks,
            created_at=inv.created_at,
            vendor_name=f"{inv.vendor.code} - {inv.vendor.name}" if inv.vendor else None,
            po_number=inv.purchase_order.po_number if inv.purchase_order else None,
            gate_entry_number=inv.gate_entry.entry_number if inv.gate_entry else None,
            created_by_name=inv.created_by.full_name if inv.created_by else None,
            items=[{"id": i.id, "material_id": i.material_id, "description": i.description, "hsn_sac": i.hsn_sac, "quantity": i.quantity, "rate": i.rate, "uom": i.uom, "discount_percent": i.discount_percent, "cgst_rate": i.cgst_rate, "sgst_rate": i.sgst_rate, "igst_rate": i.igst_rate, "cgst_amount": i.cgst_amount, "sgst_amount": i.sgst_amount, "igst_amount": i.igst_amount, "taxable_amount": i.taxable_amount, "amount": i.amount, "material_name": i.material.name if i.material else None, "material_code": i.material.code if i.material else None} for i in inv.items]
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
        eway_bill_number=data.eway_bill_number,
        delivery_note=data.delivery_note,
        delivery_note_date=data.delivery_note_date,
        payment_terms=data.payment_terms,
        reference_number=data.reference_number,
        reference_date=data.reference_date,
        dispatch_doc_number=data.dispatch_doc_number,
        dispatched_through=data.dispatched_through,
        destination=data.destination,
        lr_rr_number=data.lr_rr_number,
        vehicle_number=data.vehicle_number,
        terms_of_delivery=data.terms_of_delivery,
        total_taxable_amount=data.total_taxable_amount,
        total_cgst=data.total_cgst,
        total_sgst=data.total_sgst,
        total_igst=data.total_igst,
        total_discount=data.total_discount,
        total_amount=data.total_amount,
        tax_amount=data.tax_amount,
        scan_url=data.scan_url,
        remarks=data.remarks,
        created_by_id=current_user.id,
        status="Draft"
    )
    db.add(invoice)
    db.flush()

    for item_data in data.items:
        item = InvoiceItem(
            invoice_id=invoice.id,
            material_id=item_data.material_id,
            description=item_data.description,
            hsn_sac=item_data.hsn_sac,
            quantity=item_data.quantity,
            rate=item_data.rate,
            uom=item_data.uom,
            discount_percent=item_data.discount_percent,
            cgst_rate=item_data.cgst_rate,
            sgst_rate=item_data.sgst_rate,
            igst_rate=item_data.igst_rate,
            cgst_amount=item_data.cgst_amount,
            sgst_amount=item_data.sgst_amount,
            igst_amount=item_data.igst_amount,
            taxable_amount=item_data.taxable_amount,
            amount=item_data.amount
        )
        db.add(item)

    db.commit()
    db.refresh(invoice)
    
    return InvoiceOut(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        gate_entry_id=invoice.gate_entry_id,
        vendor_id=invoice.vendor_id,
        po_id=invoice.po_id,
        eway_bill_number=invoice.eway_bill_number,
        delivery_note=invoice.delivery_note,
        delivery_note_date=invoice.delivery_note_date,
        payment_terms=invoice.payment_terms,
        reference_number=invoice.reference_number,
        reference_date=invoice.reference_date,
        dispatch_doc_number=invoice.dispatch_doc_number,
        dispatched_through=invoice.dispatched_through,
        destination=invoice.destination,
        lr_rr_number=invoice.lr_rr_number,
        vehicle_number=invoice.vehicle_number,
        terms_of_delivery=invoice.terms_of_delivery,
        total_taxable_amount=invoice.total_taxable_amount,
        total_cgst=invoice.total_cgst,
        total_sgst=invoice.total_sgst,
        total_igst=invoice.total_igst,
        total_discount=invoice.total_discount,
        total_amount=invoice.total_amount,
        tax_amount=invoice.tax_amount,
        status=invoice.status,
        scan_url=invoice.scan_url,
        remarks=invoice.remarks,
        created_at=invoice.created_at,
        vendor_name=f"{invoice.vendor.code} - {invoice.vendor.name}" if invoice.vendor else None,
        po_number=invoice.purchase_order.po_number if invoice.purchase_order else None,
        gate_entry_number=invoice.gate_entry.entry_number if invoice.gate_entry else None,
        created_by_name=invoice.created_by.full_name if invoice.created_by else None,
        items=[{"id": i.id, "material_id": i.material_id, "description": i.description, "hsn_sac": i.hsn_sac, "quantity": i.quantity, "rate": i.rate, "uom": i.uom, "discount_percent": i.discount_percent, "cgst_rate": i.cgst_rate, "sgst_rate": i.sgst_rate, "igst_rate": i.igst_rate, "cgst_amount": i.cgst_amount, "sgst_amount": i.sgst_amount, "igst_amount": i.igst_amount, "taxable_amount": i.taxable_amount, "amount": i.amount, "material_name": i.material.name if i.material else None, "material_code": i.material.code if i.material else None} for i in invoice.items]
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
        
    for key, value in data.model_dump(exclude_unset=True, exclude={"items"}).items():
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
        eway_bill_number=invoice.eway_bill_number,
        delivery_note=invoice.delivery_note,
        delivery_note_date=invoice.delivery_note_date,
        payment_terms=invoice.payment_terms,
        reference_number=invoice.reference_number,
        reference_date=invoice.reference_date,
        dispatch_doc_number=invoice.dispatch_doc_number,
        dispatched_through=invoice.dispatched_through,
        destination=invoice.destination,
        lr_rr_number=invoice.lr_rr_number,
        vehicle_number=invoice.vehicle_number,
        terms_of_delivery=invoice.terms_of_delivery,
        total_taxable_amount=invoice.total_taxable_amount,
        total_cgst=invoice.total_cgst,
        total_sgst=invoice.total_sgst,
        total_igst=invoice.total_igst,
        total_discount=invoice.total_discount,
        total_amount=invoice.total_amount,
        tax_amount=invoice.tax_amount,
        status=invoice.status,
        scan_url=invoice.scan_url,
        remarks=invoice.remarks,
        created_at=invoice.created_at,
        vendor_name=f"{invoice.vendor.code} - {invoice.vendor.name}" if invoice.vendor else None,
        po_number=invoice.purchase_order.po_number if invoice.purchase_order else None,
        gate_entry_number=invoice.gate_entry.entry_number if invoice.gate_entry else None,
        created_by_name=invoice.created_by.full_name if invoice.created_by else None,
        items=[{"id": i.id, "material_id": i.material_id, "description": i.description, "hsn_sac": i.hsn_sac, "quantity": i.quantity, "rate": i.rate, "uom": i.uom, "discount_percent": i.discount_percent, "cgst_rate": i.cgst_rate, "sgst_rate": i.sgst_rate, "igst_rate": i.igst_rate, "cgst_amount": i.cgst_amount, "sgst_amount": i.sgst_amount, "igst_amount": i.igst_amount, "taxable_amount": i.taxable_amount, "amount": i.amount, "material_name": i.material.name if i.material else None, "material_code": i.material.code if i.material else None} for i in invoice.items]
    )
