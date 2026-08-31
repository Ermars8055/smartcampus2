"""Credit Note routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import CreditNote, CreditNoteItem, CreditNoteApproval, User, Vendor, CompanyAddress, ApprovalFlow, Invoice
from app.schemas import CreditNoteCreate, CreditNoteOut, CreditNoteUpdate, CreditNoteApproveRequest
from app.auth import get_current_user, require_permission, require_action, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
from app.utils.tz import get_now_ist

router = APIRouter(prefix="/api/credit-notes", tags=["CreditNotes"])


def _build_cn_out(db, cn, current_user):
    can_user_approve = False
    if cn.status == "Submitted":
        applicable_flows = db.query(ApprovalFlow).filter(
            ApprovalFlow.tenant_id == cn.tenant_id,
            ApprovalFlow.site_id == cn.site_id,
            ApprovalFlow.document_type == "CreditNote",
            ApprovalFlow.level == cn.current_approval_level,
            ApprovalFlow.is_active == True,
            (ApprovalFlow.min_amount <= cn.total_amount) | (ApprovalFlow.min_amount == None),
            (ApprovalFlow.max_amount >= cn.total_amount) | (ApprovalFlow.max_amount == None)
        ).all()
        
        roles = getattr(current_user, "_roles", [])
        if any(flow.user_id == current_user.id or flow.role_name in roles for flow in applicable_flows):
            can_user_approve = True
        elif getattr(current_user, "_is_platform_admin", False):
            can_user_approve = True
            
    return CreditNoteOut(
        id=cn.id,
        credit_note_number=cn.credit_note_number,
        date=cn.date,
        vendor_id=cn.vendor_id,
        invoice_id=cn.invoice_id,
        consignee_id=cn.consignee_id,
        buyer_id=cn.buyer_id,
        original_invoice_number=cn.original_invoice_number,
        original_invoice_date=cn.original_invoice_date,
        reference_number=cn.reference_number,
        reference_date=cn.reference_date,
        buyer_order_number=cn.buyer_order_number,
        buyer_order_date=cn.buyer_order_date,
        dispatch_doc_number=cn.dispatch_doc_number,
        dispatched_through=cn.dispatched_through,
        destination=cn.destination,
        terms_of_delivery=cn.terms_of_delivery,
        total_taxable_amount=cn.total_taxable_amount,
        total_cgst=cn.total_cgst,
        total_sgst=cn.total_sgst,
        total_igst=cn.total_igst,
        total_discount=cn.total_discount,
        total_amount=cn.total_amount,
        status=cn.status,
        current_approval_level=cn.current_approval_level,
        remarks=cn.remarks,
        scan_url=cn.scan_url,
        created_at=cn.created_at,
        vendor_name=f"{cn.vendor.code} - {cn.vendor.name}" if cn.vendor else None,
        vendor_address=cn.vendor.address_line_1 if cn.vendor else None,
        vendor_city=cn.vendor.city if cn.vendor else None,
        vendor_state=cn.vendor.state if cn.vendor else None,
        vendor_pincode=cn.vendor.pincode if cn.vendor else None,
        vendor_gst_number=cn.vendor.gst_number if cn.vendor else None,
        invoice_number=cn.invoice.invoice_number if cn.invoice else None,
        created_by_name=cn.created_by.full_name if cn.created_by else None,
        consignee_title=cn.consignee.name if cn.consignee else None,
        buyer_title=cn.buyer.name if cn.buyer else None,
        can_user_approve=can_user_approve,
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
        } for i in cn.items]
    )

@router.get("", response_model=List[CreditNoteOut])
def list_credit_notes(
    status: Optional[str] = None,
    vendor_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("credit_note", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(CreditNote).filter(
        CreditNote.tenant_id == tenant_id, CreditNote.site_id == site_id,
        CreditNote.is_deleted == False
    )
    
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            q = q.filter(CreditNote.created_by_id == current_user.id)
            
    if status:
        q = q.filter(CreditNote.status == status)
    if vendor_id:
        q = q.filter(CreditNote.vendor_id == vendor_id)
        
    cns = q.order_by(CreditNote.created_at.desc()).all()
    return [_build_cn_out(db, cn, current_user) for cn in cns]

@router.get("/{id}", response_model=CreditNoteOut)
def get_credit_note(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("credit_note", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    cn = db.query(CreditNote).filter(
        CreditNote.id == id,
        CreditNote.tenant_id == tenant_id,
        CreditNote.site_id == site_id,
        CreditNote.is_deleted == False
    ).first()
    
    if not cn:
        raise HTTPException(status_code=404, detail="Credit Note not found")
        
    return _build_cn_out(db, cn, current_user)

@router.post("", response_model=CreditNoteOut)
def create_credit_note(
    data: CreditNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("credit_note", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor = db.query(Vendor).filter(Vendor.id == data.vendor_id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id).first()
    if not vendor:
        raise HTTPException(status_code=400, detail="Invalid vendor")

    if data.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == data.invoice_id, Invoice.tenant_id == tenant_id, Invoice.site_id == site_id).first()
        if invoice:
            existing_cns = db.query(CreditNote).filter(
                CreditNote.invoice_id == invoice.id,
                CreditNote.is_deleted == False,
                CreditNote.status != "Rejected"
            ).all()
            existing_total = sum(cn.total_amount for cn in existing_cns)
            if existing_total + data.total_amount > invoice.total_amount:
                raise HTTPException(status_code=400, detail=f"Total Credit Note amount ({existing_total + data.total_amount}) exceeds Invoice amount ({invoice.total_amount})")

    cn_number = get_next_number(db, tenant_id, site_id, "CREDIT_NOTE", "CN")

    cn = CreditNote(
        tenant_id=tenant_id,
        site_id=site_id,
        credit_note_number=cn_number,
        date=data.date,
        vendor_id=data.vendor_id,
        invoice_id=data.invoice_id,
        consignee_id=data.consignee_id,
        buyer_id=data.buyer_id,
        original_invoice_number=data.original_invoice_number,
        original_invoice_date=data.original_invoice_date,
        reference_number=data.reference_number,
        reference_date=data.reference_date,
        buyer_order_number=data.buyer_order_number,
        buyer_order_date=data.buyer_order_date,
        dispatch_doc_number=data.dispatch_doc_number,
        dispatched_through=data.dispatched_through,
        destination=data.destination,
        terms_of_delivery=data.terms_of_delivery,
        total_taxable_amount=data.total_taxable_amount,
        total_cgst=data.total_cgst,
        total_sgst=data.total_sgst,
        total_igst=data.total_igst,
        total_discount=data.total_discount,
        total_amount=data.total_amount,
        scan_url=data.scan_url,
        remarks=data.remarks,
        created_by_id=current_user.id,
        status=data.status or "Draft"
    )
    db.add(cn)
    db.flush()

    for item_data in data.items:
        item = CreditNoteItem(
            credit_note_id=cn.id,
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
    db.refresh(cn)
    
    return _build_cn_out(db, cn, current_user)


@router.put("/{id}", response_model=CreditNoteOut)
def update_credit_note(
    id: int,
    data: CreditNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("credit_note", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    cn = db.query(CreditNote).filter(
        CreditNote.id == id,
        CreditNote.tenant_id == tenant_id,
        CreditNote.site_id == site_id,
        CreditNote.is_deleted == False
    ).first()
    
    if not cn:
        raise HTTPException(status_code=404, detail="Credit Note not found")
        
    # Validation against Invoice Amount
    invoice_id_to_check = data.invoice_id if data.invoice_id is not None else cn.invoice_id
    if invoice_id_to_check:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id_to_check, Invoice.tenant_id == tenant_id, Invoice.site_id == site_id).first()
        if invoice:
            existing_cns = db.query(CreditNote).filter(
                CreditNote.invoice_id == invoice.id,
                CreditNote.is_deleted == False,
                CreditNote.status != "Rejected",
                CreditNote.id != id
            ).all()
            existing_total = sum(existing_cn.total_amount for existing_cn in existing_cns)
            new_total = data.total_amount if data.total_amount is not None else cn.total_amount
            if existing_total + new_total > invoice.total_amount:
                raise HTTPException(status_code=400, detail=f"Total Credit Note amount ({existing_total + new_total}) exceeds Invoice amount ({invoice.total_amount})")
                
    for key, value in data.model_dump(exclude_unset=True, exclude={"items"}).items():
        setattr(cn, key, value)
        
    if data.items is not None:
        db.query(CreditNoteItem).filter(CreditNoteItem.credit_note_id == id).delete()
        for item_data in data.items:
            item = CreditNoteItem(
                credit_note_id=cn.id,
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
    db.refresh(cn)
    
    return _build_cn_out(db, cn, current_user)

@router.post("/{id}/approve")
def approve_credit_note(
    id: int,
    data: CreditNoteApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_action("credit_note", "can_approve")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    cn = db.query(CreditNote).filter(CreditNote.id == id, CreditNote.tenant_id == tenant_id, CreditNote.site_id == site_id, CreditNote.is_deleted == False).first()
    if not cn:
        raise HTTPException(404, "Credit Note not found")

    if cn.status != "Submitted":
        raise HTTPException(400, "Credit Note must be in Submitted state to approve")

    applicable_flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "CreditNote",
        ApprovalFlow.level == cn.current_approval_level,
        ApprovalFlow.is_active == True,
        (ApprovalFlow.min_amount <= cn.total_amount) | (ApprovalFlow.min_amount == None),
        (ApprovalFlow.max_amount >= cn.total_amount) | (ApprovalFlow.max_amount == None)
    ).all()

    roles = getattr(current_user, "_roles", [])
    matched_flow = next((flow for flow in applicable_flows if flow.user_id == current_user.id or flow.role_name in roles), None)

    if getattr(current_user, "_is_platform_admin", False):
        matched_flow = applicable_flows[0] if applicable_flows else None

    if not matched_flow and not getattr(current_user, "_is_platform_admin", False):
        raise HTTPException(403, f"You do not have permission to approve at level {cn.current_approval_level}")

    existing_approval = db.query(CreditNoteApproval).filter(
        CreditNoteApproval.credit_note_id == cn.id,
        CreditNoteApproval.approver_id == current_user.id,
        CreditNoteApproval.approval_flow_id == matched_flow.id if matched_flow else 0
    ).first()

    if existing_approval:
         raise HTTPException(400, "You have already approved this at the current level")

    if matched_flow:
        approval = CreditNoteApproval(
            credit_note_id=cn.id,
            approval_flow_id=matched_flow.id,
            approver_id=current_user.id,
            remarks=data.remarks
        )
        db.add(approval)

    next_level = cn.current_approval_level + 1
    next_flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "CreditNote",
        ApprovalFlow.level == next_level,
        ApprovalFlow.is_active == True,
        (ApprovalFlow.min_amount <= cn.total_amount) | (ApprovalFlow.min_amount == None),
        (ApprovalFlow.max_amount >= cn.total_amount) | (ApprovalFlow.max_amount == None)
    ).all()

    if not next_flows:
        cn.status = "Approved"
        cn.approved_by_id = current_user.id
        cn.approved_at = get_now_ist()
    else:
        cn.current_approval_level = next_level

    db.commit()
    db.refresh(cn)
    return {"message": "Approved successfully", "status": cn.status}

@router.post("/{id}/reject")
def reject_credit_note(
    id: int,
    data: CreditNoteApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_action("credit_note", "can_reject")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    cn = db.query(CreditNote).filter(CreditNote.id == id, CreditNote.tenant_id == tenant_id, CreditNote.site_id == site_id).first()
    if not cn:
        raise HTTPException(404, "Credit Note not found")

    if cn.status not in ["Submitted"]:
        raise HTTPException(400, "Cannot reject in this state")

    cn.status = "Rejected"
    cn.remarks = (cn.remarks or "") + f"\n[Rejected by {current_user.full_name}]: {data.remarks}"
    db.commit()
    return {"message": "Rejected"}
