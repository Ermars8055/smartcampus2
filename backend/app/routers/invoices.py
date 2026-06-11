"""Invoice routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import Invoice, InvoiceItem, User, GateEntry, Vendor, PurchaseOrder, CompanyAddress
from app.schemas import InvoiceCreate, InvoiceOut, InvoiceUpdate
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
from app.utils.tz import get_now_ist

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


def _build_invoice_out(inv):
    """Helper to build InvoiceOut from an Invoice ORM instance."""
    return InvoiceOut(
        id=inv.id,
        code=inv.code,
        invoice_number=inv.invoice_number,
        invoice_date=inv.invoice_date,
        gate_entry_id=inv.gate_entry_id,
        vendor_id=inv.vendor_id,
        po_id=inv.po_id,
        consignee_id=inv.consignee_id,
        buyer_id=inv.buyer_id,
        internal_reference_number=inv.internal_reference_number,
        srf_number=inv.srf_number,
        irn=inv.irn,
        ack_number=inv.ack_number,
        ack_date=inv.ack_date,
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
        transport_charges=inv.transport_charges,
        transport_hsn=inv.transport_hsn,
        transport_cgst_rate=inv.transport_cgst_rate,
        transport_sgst_rate=inv.transport_sgst_rate,
        transport_igst_rate=inv.transport_igst_rate,
        transport_discount_percent=inv.transport_discount_percent,
        status=inv.status,
        scan_url=inv.scan_url,
        remarks=inv.remarks,
        created_at=inv.created_at,
        vendor_name=f"{inv.vendor.code} - {inv.vendor.name}" if inv.vendor else None,
        po_number=inv.purchase_order.po_number if inv.purchase_order else None,
        gate_entry_number=inv.gate_entry.entry_number if inv.gate_entry else None,
        created_by_name=inv.created_by.full_name if inv.created_by else None,
        consignee_title=inv.consignee.name if inv.consignee else None,
        buyer_title=inv.buyer.name if inv.buyer else None,
        # Finance fields
        payment_status=inv.payment_status or "Pending",
        sent_for_payment_at=inv.sent_for_payment_at,
        sent_for_payment_by_name=inv.sent_for_payment_by.full_name if inv.sent_for_payment_by else None,
        hard_copy_sent=inv.hard_copy_sent or False,
        hard_copy_sent_at=inv.hard_copy_sent_at,
        hard_copy_sent_by_name=inv.hard_copy_sent_by.full_name if inv.hard_copy_sent_by else None,
        hard_copy_received=inv.hard_copy_received or False,
        hard_copy_received_at=inv.hard_copy_received_at,
        hard_copy_received_by_name=inv.hard_copy_received_by.full_name if inv.hard_copy_received_by else None,
        hard_copy_remarks=inv.hard_copy_remarks,
        payment_completed_at=inv.payment_completed_at,
        payment_completed_by_name=inv.payment_completed_by.full_name if inv.payment_completed_by else None,
        payment_reference=inv.payment_reference,
        items=[{
            "id": i.id, "material_id": i.material_id, "description": i.description,
            "hsn_sac": i.hsn_sac, "quantity": i.quantity, "rate": i.rate, "uom": i.uom,
            "discount_percent": i.discount_percent,
            "cgst_rate": i.cgst_rate, "sgst_rate": i.sgst_rate, "igst_rate": i.igst_rate,
            "cgst_amount": i.cgst_amount, "sgst_amount": i.sgst_amount, "igst_amount": i.igst_amount,
            "taxable_amount": i.taxable_amount, "amount": i.amount,
            "remarks": i.remarks,
            "material_name": i.material.name if i.material else None,
            "material_code": i.material.code if i.material else None
        } for i in inv.items]
    )


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
    return [_build_invoice_out(inv) for inv in invoices]


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

    # Auto-generate internal reference number and code
    internal_ref = get_next_number(db, tenant_id, site_id, "INVOICE_REF", "INV")

    invoice = Invoice(
        tenant_id=tenant_id,
        site_id=site_id,
        code=internal_ref,
        invoice_number=data.invoice_number,
        invoice_date=data.invoice_date,
        gate_entry_id=data.gate_entry_id,
        vendor_id=data.vendor_id,
        po_id=data.po_id,
        consignee_id=data.consignee_id,
        buyer_id=data.buyer_id,
        internal_reference_number=internal_ref,
        srf_number=data.srf_number,
        irn=data.irn,
        ack_number=data.ack_number,
        ack_date=data.ack_date,
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
        transport_charges=data.transport_charges,
        transport_hsn=data.transport_hsn,
        transport_cgst_rate=data.transport_cgst_rate,
        transport_sgst_rate=data.transport_sgst_rate,
        transport_igst_rate=data.transport_igst_rate,
        transport_discount_percent=data.transport_discount_percent,
        scan_url=data.scan_url,
        remarks=data.remarks,
        created_by_id=current_user.id,
        status=data.status or "Draft"
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
            amount=item_data.amount,
            remarks=item_data.remarks
        )
        db.add(item)

    db.commit()
    db.refresh(invoice)
    
    return _build_invoice_out(invoice)


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
        
    if data.items is not None:
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == id).delete()
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
                amount=item_data.amount,
                remarks=item_data.remarks
            )
            db.add(item)
            
    db.commit()
    db.refresh(invoice)
    
    return _build_invoice_out(invoice)
