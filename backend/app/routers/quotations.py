"""Quotation Management routes."""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
from app.utils.tz import get_now_ist
from typing import Optional, List, Dict, Any
import os
import shutil

from app.database import get_db
from app.models import (
    QuotationRequest, QuotationRequestItem, QuotationRequestPR, QuotationRequestVendor,
    VendorQuotation, VendorQuotationItem, QuotationComparison, QuotationRequestItemSource,
    PurchaseRequest, PurchaseOrder, PurchaseOrderItem, User, Vendor, Material
)
from app.schemas import (
    QuotationRequestCreate, QuotationRequestOut, VendorQuotationCreate, VendorQuotationOut,
    VendorOverrideRequest, ComparativeStatementOut, MaterialComparisonOut, VendorQuoteDetail,
    QRItemOut, QRLinkedPROut, QRVendorOut, VendorQuotationItemOut, QRItemSourceOut,
    QRVendorReceiptUpdate
)
from pydantic import BaseModel


class SendQuotationRequest(BaseModel):
    message: str = ""
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.models import QuotationRequestStatus, VendorQuotationStatus
from app.utils.email_utils import send_html_email

router = APIRouter(prefix="/api/quotations", tags=["Quotations"])


def generate_qr_number(db: Session, tenant_id: int, site_id: int) -> str:
    from app.utils.sequences import get_next_number
    return get_next_number(db, tenant_id, site_id, "QUOTATION_REQUEST", "QR")


def generate_po_number(db: Session, tenant_id: int, site_id: int) -> str:
    from app.utils.sequences import get_next_number
    return get_next_number(db, tenant_id, site_id, "PURCHASE_ORDER", "PO")


# ── Quotation Requests ───────────────────────────────────────────────────

@router.get("/requests", response_model=List[QuotationRequestOut])
def list_quotation_requests(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(QuotationRequest).filter(
        QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id,
        QuotationRequest.is_deleted == False
    )
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            q = q.filter(QuotationRequest.created_by_id == current_user.id)
            
    if status:
        q = q.filter(QuotationRequest.status == status)
    if project_id:
        q = q.filter(QuotationRequest.project_id == project_id)
    
    qrs = q.order_by(QuotationRequest.created_at.desc()).all()
    
    result = []
    for qr in qrs:
        items = [QRItemOut(
            id=it.id, material_id=it.material_id, quantity=it.quantity,
            material_name=it.material.name if it.material else "N/A", 
            material_code=it.material.code if it.material else "N/A",
            uom_name=it.material.uom.name if it.material and it.material.uom else "Unit",
            source=it.source or "Manual",
            source_pr_number=it.source_pr.pr_number if it.source_pr else None,
            sources=[QRItemSourceOut(
                source=s.source,
                source_pr_number=s.source_pr.pr_number if s.source_pr else None,
                quantity=s.quantity
            ) for s in it.sources]
        ) for it in qr.items]
        prs = [QRLinkedPROut(id=pr.id, pr_id=pr.pr_id, pr_number=pr.purchase_request.pr_number if pr.purchase_request else "N/A") for pr in qr.linked_prs]
        vendors = [QRVendorOut(id=v.id, vendor_id=v.vendor_id, vendor_name=f"{v.vendor.code} - {v.vendor.name}" if v.vendor else "N/A", 
                               is_sent=v.is_sent, sent_at=v.sent_at, receipt_status=v.receipt_status) for v in qr.invited_vendors]
        
        vendor_quotation_count = db.query(VendorQuotation).filter(VendorQuotation.qr_id == qr.id).count()

        result.append(QuotationRequestOut(
            id=qr.id, qr_number=qr.qr_number, project_id=qr.project_id,
            project_name=qr.project.name if qr.project else None,
            required_date=qr.required_date, remarks=qr.remarks, status=qr.status,
            created_by_id=qr.created_by_id, created_by_name=qr.created_by.full_name if qr.created_by else None,
            approved_by_id=qr.approved_by_id, approved_at=qr.approved_at,
            created_at=qr.created_at, updated_at=qr.updated_at,
            items=items, linked_prs=prs, invited_vendors=vendors,
            vendor_quotation_count=vendor_quotation_count
        ))
    return result


@router.get("/requests/{id}", response_model=QuotationRequestOut)
def get_quotation_request(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == id, QuotationRequest.tenant_id == tenant_id,
        QuotationRequest.site_id == site_id, QuotationRequest.is_deleted == False
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    items = [QRItemOut(
        id=it.id, material_id=it.material_id, quantity=it.quantity,
        material_name=it.material.name, material_code=it.material.code,
        uom_name=it.material.uom.name if it.material.uom else "Unit",
        source=it.source or "Manual",
        source_pr_number=it.source_pr.pr_number if it.source_pr else None,
        sources=[QRItemSourceOut(
            source=s.source,
            source_pr_number=s.source_pr.pr_number if s.source_pr else None,
            quantity=s.quantity
        ) for s in it.sources]
    ) for it in qr.items]
    prs = [QRLinkedPROut(id=pr.id, pr_id=pr.pr_id, pr_number=pr.purchase_request.pr_number) for pr in qr.linked_prs]
    vendors = [QRVendorOut(id=v.id, vendor_id=v.vendor_id, vendor_name=f"{v.vendor.code} - {v.vendor.name}" if v.vendor else "N/A", 
                           is_sent=v.is_sent, sent_at=v.sent_at, receipt_status=v.receipt_status) for v in qr.invited_vendors]
    
    vendor_quotation_count = db.query(VendorQuotation).filter(VendorQuotation.qr_id == qr.id).count()

    return QuotationRequestOut(
        id=qr.id, qr_number=qr.qr_number, project_id=qr.project_id,
        project_name=qr.project.name if qr.project else None,
        required_date=qr.required_date, remarks=qr.remarks, status=qr.status,
        created_by_id=qr.created_by_id, created_by_name=qr.created_by.full_name if qr.created_by else None,
        approved_by_id=qr.approved_by_id, approved_at=qr.approved_at,
        created_at=qr.created_at, updated_at=qr.updated_at,
        items=items, linked_prs=prs, invited_vendors=vendors,
        vendor_quotation_count=vendor_quotation_count
    )


@router.post("/requests")
def create_quotation_request(
    data: QuotationRequestCreate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if len(data.vendor_ids) < 2:
        raise HTTPException(status_code=400, detail="Minimum two vendors must be invited for a quotation request")

    qr = QuotationRequest(
        tenant_id=tenant_id, site_id=site_id,
        qr_number=generate_qr_number(db, tenant_id, site_id),
        project_id=data.project_id,
        created_by_id=current_user.id,
        required_date=data.required_date,
        remarks=data.remarks,
        status=QuotationRequestStatus.DRAFT.value
    )
    db.add(qr)
    db.flush()

    # Consolidation Map: material_id -> QuotationRequestItem
    material_map = {}

    # 1. Process Manual Items
    for item in data.items:
        if item.material_id not in material_map:
            qr_item = QuotationRequestItem(
                qr_id=qr.id, 
                material_id=item.material_id, 
                quantity=0,
                source="Manual" # Legacy field
            )
            db.add(qr_item)
            db.flush()
            material_map[item.material_id] = qr_item
        
        target_item = material_map[item.material_id]
        target_item.quantity += item.quantity
        db.add(QuotationRequestItemSource(
            qr_item_id=target_item.id,
            source="Manual",
            source_pr_id=None,
            quantity=item.quantity
        ))
    
    # 2. Process PR Items and link sources
    for pr_id in data.pr_ids:
        db.add(QuotationRequestPR(qr_id=qr.id, pr_id=pr_id))
        pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == pr_id).first()
        if pr:
            for pr_item in pr.items:
                if pr_item.material_id not in material_map:
                    qr_item = QuotationRequestItem(
                        qr_id=qr.id, 
                        material_id=pr_item.material_id, 
                        quantity=0,
                        source="PR", # Legacy field
                        source_pr_id=pr_id # Legacy field
                    )
                    db.add(qr_item)
                    db.flush()
                    material_map[pr_item.material_id] = qr_item
                
                target_item = material_map[pr_item.material_id]
                target_item.quantity += pr_item.quantity
                db.add(QuotationRequestItemSource(
                    qr_item_id=target_item.id,
                    source="PR",
                    source_pr_id=pr_id,
                    quantity=pr_item.quantity
                ))
        
    for vendor_id in data.vendor_ids:
        db.add(QuotationRequestVendor(qr_id=qr.id, vendor_id=vendor_id))

    db.commit()
    db.refresh(qr)
    return {"id": qr.id, "qr_number": qr.qr_number, "message": "Quotation Request created successfully"}


@router.post("/requests/{id}/send")
def send_quotation_request(
    id: int, data: SendQuotationRequest = SendQuotationRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    qr.status = QuotationRequestStatus.REQUESTED.value
    for v in qr.invited_vendors:
        v.is_sent = True
        v.sent_at = get_now_ist()
        
        # Send actual email to the vendor
        if v.vendor and v.vendor.email:
            # Convert newlines to HTML breaks for basic formatting
            html_message = data.message.replace('\n', '<br>')
            send_html_email(
                to_email=v.vendor.email,
                subject=f"Request for Quotation: {qr.qr_number}",
                html_body=html_message
            )
        
    db.commit()
    return {"message": "Quotation Request sent to vendors"}


@router.post("/requests/{id}/receive")
def transition_to_receive(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    if qr.status != QuotationRequestStatus.REQUESTED.value:
        raise HTTPException(status_code=400, detail="Can only start receiving from Requested status")
        
    qr.status = QuotationRequestStatus.RECEIVED.value
    db.commit()
    return {"message": "Quotation Request transitioned to Receiving stage"}


@router.put("/requests/{qr_id}/vendors/{vendor_id}/receipt-status")
def update_vendor_receipt_status(
    qr_id: int, vendor_id: int, data: QRVendorReceiptUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor_link = db.query(QuotationRequestVendor).filter(
        QuotationRequestVendor.qr_id == qr_id, QuotationRequestVendor.vendor_id == vendor_id
    ).first()
    if not vendor_link:
        raise HTTPException(status_code=404, detail="Vendor link not found")
        
    vendor_link.receipt_status = data.receipt_status
    db.commit()
    return {"message": "Vendor receipt status updated"}


@router.post("/requests/{id}/entered")
def transition_to_entered(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    # Validation: No vendor should be in PENDING receipt status
    pending_vendors = [v for v in qr.invited_vendors if v.receipt_status == "Pending"]
    if pending_vendors:
        vendor_names = ", ".join([f"{v.vendor.code} - {v.vendor.name}" for v in pending_vendors])
        raise HTTPException(status_code=400, detail=f"Cannot proceed. Quotations are pending from: {vendor_names}")
        
    qr.status = QuotationRequestStatus.ENTERED.value
    db.commit()
    return {"message": "Quotation Request transitioned to Entry stage"}


# ── Vendor Quotations ────────────────────────────────────────────────────

import json

@router.post("/{qr_id}/vendor-quotation")
def enter_vendor_quotation(
    qr_id: int,
    vendor_id: int = Form(...),
    quotation_number: str = Form(None),
    quotation_date: str = Form(None),
    remarks: str = Form(None),
    items_json: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == qr_id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    existing = db.query(VendorQuotation).filter(
        VendorQuotation.qr_id == qr_id, VendorQuotation.vendor_id == vendor_id
    ).first()

    attachment_path = existing.attachment_path if existing else None
    if file:
        upload_dir = "uploads/quotations"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"qr_{qr_id}_v_{vendor_id}_{file.filename}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attachment_path = f"/{file_path}"
        
    q_date = datetime.strptime(quotation_date, "%Y-%m-%d").date() if quotation_date else None
    
    if existing:
        vq = existing
        vq.quotation_number = quotation_number
        vq.quotation_date = q_date
        vq.remarks = remarks
        vq.attachment_path = attachment_path
        # Delete old items to replace with new ones
        db.query(VendorQuotationItem).filter(VendorQuotationItem.vendor_quotation_id == vq.id).delete()
    else:
        vq = VendorQuotation(
            qr_id=qr_id, vendor_id=vendor_id, quotation_number=quotation_number,
            quotation_date=q_date, received_date=get_now_ist().date(),
            attachment_path=attachment_path, remarks=remarks,
            entered_by_id=current_user.id
        )
        db.add(vq)
    
    db.flush()

    try:
        items = json.loads(items_json)
        for it in items:
            db.add(VendorQuotationItem(
                vendor_quotation_id=vq.id,
                qr_item_id=it['qr_item_id'],
                material_id=it['material_id'],
                quoted_rate=it['quoted_rate'] if not it.get('is_excluded') else 0,
                delivery_days=it.get('delivery_days') if not it.get('is_excluded') else None,
                is_excluded=it.get('is_excluded', False),
                remarks=it.get('remarks')
            ))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Invalid items data: {str(e)}")

    # Status remains in ENTERED (no auto transition)
    db.commit()
    return {"message": "Vendor quotation entered successfully"}


@router.get("/{qr_id}/vendor-quotations", response_model=List[VendorQuotationOut])
def list_vendor_quotations(
    qr_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == qr_id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")

    vqs_query = db.query(VendorQuotation).filter(VendorQuotation.qr_id == qr_id)
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            vqs_query = vqs_query.filter(VendorQuotation.entered_by_id == current_user.id)
            
    vqs = vqs_query.all()
    result = []
    for vq in vqs:
        items = [VendorQuotationItemOut(
            id=it.id, qr_item_id=it.qr_item_id, material_id=it.material_id,
            quoted_rate=it.quoted_rate, delivery_days=it.delivery_days, remarks=it.remarks,
            material_name=it.material.name, material_code=it.material.code, uom_name=it.material.uom.name
        ) for it in vq.items]
        
        result.append(VendorQuotationOut(
            id=vq.id, qr_id=vq.qr_id, vendor_id=vq.vendor_id, vendor_name=f"{vq.vendor.code} - {vq.vendor.name}" if vq.vendor else "N/A",
            quotation_number=vq.quotation_number, quotation_date=vq.quotation_date,
            received_date=vq.received_date, attachment_path=vq.attachment_path,
            remarks=vq.remarks, status=vq.status,
            entered_by_name=vq.entered_by.full_name if vq.entered_by else None,
            created_at=vq.created_at, items=items
        ))
    return result


# ── Comparison & Ranking ─────────────────────────────────────────────────

@router.get("/{qr_id}/comparison", response_model=ComparativeStatementOut)
def generate_comparison(
    qr_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == qr_id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")

    # Generate or fetch comparison
    material_comparisons = []
    for qr_item in qr.items:
        # Get all vendor quotes for this material
        quotes = db.query(VendorQuotationItem).join(
            VendorQuotation, VendorQuotationItem.vendor_quotation_id == VendorQuotation.id
        ).filter(
            VendorQuotationItem.qr_item_id == qr_item.id,
            VendorQuotation.qr_id == qr_id,
            VendorQuotationItem.is_excluded == False
        ).order_by(VendorQuotationItem.quoted_rate.asc()).all()
        
        vendor_quotes = []
        auto_l1_vendor_id = quotes[0].vendor_quotation.vendor_id if quotes else None
        
        for idx, q in enumerate(quotes):
            vendor_quotes.append(VendorQuoteDetail(
                vendor_id=q.vendor_quotation.vendor_id,
                vendor_name=f"{q.vendor_quotation.vendor.code} - {q.vendor_quotation.vendor.name}" if q.vendor_quotation and q.vendor_quotation.vendor else "N/A",
                quoted_rate=q.quoted_rate,
                delivery_days=q.delivery_days,
                rank=idx + 1,
                rank_label=f"L{idx + 1}"
            ))

        # Check for existing comparison/overrides
        comp = db.query(QuotationComparison).filter(
            QuotationComparison.qr_item_id == qr_item.id
        ).first()

        if not comp and auto_l1_vendor_id:
            comp = QuotationComparison(
                qr_id=qr_id, qr_item_id=qr_item.id, material_id=qr_item.material_id,
                selected_vendor_id=auto_l1_vendor_id, auto_rank_vendor_id=auto_l1_vendor_id
            )
            db.add(comp)
            db.flush()
        elif comp and auto_l1_vendor_id:
            # Update auto rank to current lowest
            comp.auto_rank_vendor_id = auto_l1_vendor_id
            # If no manual override exists, keep selection in sync with lowest
            if not comp.is_overridden:
                comp.selected_vendor_id = auto_l1_vendor_id
            db.add(comp)
            db.flush()

        material_comparisons.append(MaterialComparisonOut(
            qr_item_id=qr_item.id, material_id=qr_item.material_id,
            material_name=qr_item.material.name, material_code=qr_item.material.code,
            uom_name=qr_item.material.uom.name, quantity=qr_item.quantity,
            vendor_quotes=vendor_quotes,
            selected_vendor_id=comp.selected_vendor_id if comp else None,
            selected_vendor_name=f"{comp.selected_vendor.code} - {comp.selected_vendor.name}" if comp and comp.selected_vendor else None,
            is_overridden=comp.is_overridden if comp else False,
            override_reason=comp.override_reason if comp else None
        ))

    # If first time comparison, update QR status
    if qr.status == QuotationRequestStatus.ENTERED.value:
        qr.status = QuotationRequestStatus.COMPARED.value
    
    db.commit()

    # Calculate totals for ALL vendors who quoted
    vendor_totals = {}
    
    # First, identify all vendors who submitted any quote for this QR
    vqs = db.query(VendorQuotation).filter(VendorQuotation.qr_id == qr_id).all()
    
    for vq in vqs:
        vid = vq.vendor_id
        vname = f"{vq.vendor.code} - {vq.vendor.name}" if vq.vendor else "N/A"
        vendor_totals[vid] = {
            "vendor_id": vid, 
            "vendor_name": vname, 
            "total_value": 0, 
            "items_won": 0,
            "is_selected_any": False
        }
        
        # Calculate potential total if we bought everything from this vendor
        # (Only counting items they actually quoted and didn't exclude)
        for q in vq.items:
            if not q.is_excluded:
                qr_item = next((it for it in qr.items if it.id == q.qr_item_id), None)
                if qr_item:
                    vendor_totals[vid]["total_value"] += qr_item.quantity * q.quoted_rate

    # Now update items_won and selection status
    for mc in material_comparisons:
        if mc.selected_vendor_id:
            vid = mc.selected_vendor_id
            if vid in vendor_totals:
                vendor_totals[vid]["items_won"] += 1
                vendor_totals[vid]["is_selected_any"] = True

    return ComparativeStatementOut(
        qr_id=qr.id, qr_number=qr.qr_number, project_name=qr.project.name if qr.project else '',
        required_date=qr.required_date, status=qr.status,
        created_by_name=qr.created_by.full_name if qr.created_by else '',
        created_at=qr.created_at, materials=material_comparisons,
        vendor_totals=list(vendor_totals.values())
    )


@router.post("/{qr_id}/override")
def override_vendor_selection(
    qr_id: int, data: VendorOverrideRequest, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    comp = db.query(QuotationComparison).filter(
        QuotationComparison.qr_id == qr_id, QuotationComparison.qr_item_id == data.qr_item_id
    ).first()
    
    if not comp:
        raise HTTPException(status_code=404, detail="Comparison not found")
        
    comp.selected_vendor_id = data.selected_vendor_id
    comp.is_overridden = True
    comp.override_reason = data.override_reason
    db.commit()
    return {"message": "Vendor selection overridden successfully"}


@router.post("/{qr_id}/approve")
def approve_comparison(
    qr_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == qr_id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    qr.status = QuotationRequestStatus.APPROVED.value
    qr.approved_by_id = current_user.id
    qr.approved_at = get_now_ist()
    
    comps = db.query(QuotationComparison).filter(QuotationComparison.qr_id == qr_id).all()
    for c in comps:
        c.approved_by_id = current_user.id
        c.approved_at = get_now_ist()
        
    db.commit()
    return {"message": "Quotation Comparison approved successfully"}


@router.post("/requests/{id}/finalize")
def finalize_comparison(
    id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
        
    qr.status = QuotationRequestStatus.COMPARED.value
    db.commit()
    return {"message": "Quotation Comparison finalized"}


class QuotationConvertItem(BaseModel):
    qr_item_id: int
    rate: float
    discount_percent: float = 0
    cgst_percentage: float = 0
    sgst_percentage: float = 0
    igst_percentage: float = 0

class QuotationConvertRequest(BaseModel):
    terms: Optional[str] = None
    items: List[QuotationConvertItem] = []

@router.post("/{qr_id}/convert-to-po")
def convert_to_pos(
    qr_id: int, 
    data: QuotationConvertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == qr_id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")
    if qr.status != QuotationRequestStatus.APPROVED.value:
        raise HTTPException(status_code=400, detail="Quotation must be approved before converting to PO")

    comps = db.query(QuotationComparison).filter(QuotationComparison.qr_id == qr_id).all()
    
    item_data = {it.qr_item_id: it for it in data.items}

    # Group by selected vendor
    vendor_items = {}
    for c in comps:
        if not c.selected_vendor_id: continue
        if c.selected_vendor_id not in vendor_items:
            vendor_items[c.selected_vendor_id] = []
            
        # Get quoted rate for this item + vendor
        vqi = db.query(VendorQuotationItem).join(VendorQuotation).filter(
            VendorQuotationItem.qr_item_id == c.qr_item_id,
            VendorQuotation.vendor_id == c.selected_vendor_id
        ).first()
        
        vendor_items[c.selected_vendor_id].append({
            "material_id": c.material_id,
            "quantity": c.qr_item.quantity,
            "rate": item_data.get(c.qr_item_id).rate if c.qr_item_id in item_data else (vqi.quoted_rate if vqi else 0),
            "discount_percent": item_data.get(c.qr_item_id).discount_percent if c.qr_item_id in item_data else 0,
            "cgst_percentage": item_data.get(c.qr_item_id).cgst_percentage if c.qr_item_id in item_data else 0,
            "sgst_percentage": item_data.get(c.qr_item_id).sgst_percentage if c.qr_item_id in item_data else 0,
            "igst_percentage": item_data.get(c.qr_item_id).igst_percentage if c.qr_item_id in item_data else 0
        })

    linked_pr_ids = [lp.pr_id for lp in qr.linked_prs]
    default_pr_id = linked_pr_ids[0] if len(linked_pr_ids) == 1 else None

    po_numbers = []
    for vendor_id, items in vendor_items.items():
        po_number = generate_po_number(db, tenant_id, site_id)
        po = PurchaseOrder(
            tenant_id=tenant_id, site_id=site_id,
            po_number=po_number, vendor_id=vendor_id,
            project_id=qr.project_id, po_type="Formal",
            qr_id=qr.id,
            pr_id=default_pr_id,
            created_by_id=current_user.id,
            terms=data.terms,
            status="Draft" # Or auto-approve based on config
        )
        db.add(po)
        db.flush()
        
        total = 0
        for it in items:
            amount = round(it["quantity"] * it["rate"], 2)
            total += amount
            db.add(PurchaseOrderItem(
                po_id=po.id, material_id=it["material_id"],
                quantity=it["quantity"], rate=it["rate"], amount=amount,
                discount_percent=it["discount_percent"], cgst_percentage=it["cgst_percentage"], sgst_percentage=it["sgst_percentage"], igst_percentage=it["igst_percentage"]
            ))
        po.total_amount = round(total, 2)
        po_numbers.append(po_number)

    qr.status = QuotationRequestStatus.ORDERED.value
    # Update linked PRs
    for link in qr.linked_prs:
        link.purchase_request.status = "Converted to PO"

    db.commit()
    return {"message": f"Successfully converted to PO(s): {', '.join(po_numbers)}"}


# ── PDF Generation ───────────────────────────────────────────────────────

from fastapi.responses import StreamingResponse
from io import BytesIO
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

@router.get("/{qr_id}/comparative-statement/pdf")
def download_comparative_statement_pdf(
    qr_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    # Fetch comparison data
    comp_data = generate_comparison(qr_id, db, current_user, tenant_id, site_id)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title & Header
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'], fontSize=16, spaceAfter=14, alignment=1
    )
    elements.append(Paragraph("Comparative Statement", title_style))
    
    header_data = [
        [Paragraph("<b>QR Number:</b>", styles['Normal']), Paragraph(comp_data.qr_number, styles['Normal']),
         Paragraph("<b>Project:</b>", styles['Normal']), Paragraph(comp_data.project_name or 'N/A', styles['Normal'])],
        [Paragraph("<b>Date:</b>", styles['Normal']), Paragraph(comp_data.created_at.strftime('%Y-%m-%d'), styles['Normal']),
         Paragraph("<b>Status:</b>", styles['Normal']), Paragraph(comp_data.status, styles['Normal'])]
    ]
    header_table = Table(header_data, colWidths=[80, 200, 80, 200])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6)
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))
    
    # --- New Vendor-Wise Breakdown PDF Logic ---
    # Instead of wide columns, we create a dedicated section for each vendor
    
    # --- Matrix Table Logic ---
    
    # Sort vendors by total value (lowest first) for column order
    sorted_vendors = sorted(comp_data.vendor_totals, key=lambda x: x['total_value'])
    
    # Prepare Table Header: Material Details + Each Vendor
    table_header = [
        Paragraph("<b>Material</b>", styles['Normal']),
        Paragraph("<b>Qty</b>", styles['Normal'])
    ]
    for vt in sorted_vendors:
        table_header.append(Paragraph(f"<b>{vt['vendor_name']}</b>", styles['Normal']))
    
    table_data = [table_header]
    
    # Prepare Table Rows: One row per material
    for mat in comp_data.materials:
        row = [
            Paragraph(f"{mat.material_name}<br/><font size='8' color='grey'>{mat.material_code}</font>", styles['Normal']),
            f"{mat.quantity} {mat.uom_name}"
        ]
        for vt in sorted_vendors:
            quote = next((q for q in mat.vendor_quotes if q.vendor_id == vt['vendor_id']), None)
            if quote:
                isL1 = quote.rank == 1
                isSelected = mat.selected_vendor_id == vt['vendor_id']
                cell_text = f"{quote.quoted_rate:,.2f}"
                
                label = ""
                if isL1 and isSelected: label = " (L1 Selected)"
                elif isL1: label = " (L1)"
                elif isSelected: label = " (Selected)"
                
                if label:
                    cell_text = f"<b>{cell_text}</b><br/><font size='7' color='green'>{label}</font>"
                
                row.append(Paragraph(cell_text, styles['Normal']))
            else:
                row.append("-")
        table_data.append(row)
    
    # Create Matrix Table
    # Dynamically calculate column widths: Material (150), Qty (60), Vendors (remaining / count)
    num_vendors = len(sorted_vendors)
    vendor_col_width = (doc.width - 210) / num_vendors if num_vendors > 0 else 100
    col_widths = [150, 60] + [vendor_col_width] * num_vendors
    
    main_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    # Style for Matrix Table
    main_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f5f5f5')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'), # All vendor columns right aligned
        ('ALIGN', (1, 1), (1, -1), 'CENTER'), # Qty center aligned
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]
    
    main_table.setStyle(TableStyle(main_style))
    elements.append(main_table)
    elements.append(Spacer(1, 20))

    elements.append(Spacer(1, 10))
    elements.append(Paragraph("<b>Summary & Management Decision</b>", styles['Heading3']))
    
    summary_data = [[
        Paragraph("<b>Material</b>", styles['Normal']),
        Paragraph("<b>Selected Vendor</b>", styles['Normal']),
        Paragraph("<b>Decision / Reason</b>", styles['Normal'])
    ]]
    
    for mat in comp_data.materials:
        reason = mat.override_reason if mat.is_overridden else "Selected L1"
        summary_data.append([
            Paragraph(mat.material_name, styles['Normal']),
            Paragraph(mat.selected_vendor_name or 'Pending', styles['Normal']),
            Paragraph(reason, styles['Normal'])
        ])
        
    summary_table = Table(summary_data, colWidths=[200, 150, 250])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f8f9fa')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    
    elements.append(Spacer(1, 50))
    sig_data = [["Prepared By", "Verified By", "Approved By (Management)"]]
    sig_table = Table(sig_data, colWidths=[200, 200, 200])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LINEABOVE', (0,0), (-1,-1), 1, colors.black),
        ('TOPPADDING', (0,0), (-1,-1), 10)
    ]))
    elements.append(sig_table)
    
    doc.build(elements)
    
    buffer.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="comparative_statement_{comp_data.qr_number}.pdf"'
    }
    return StreamingResponse(buffer, media_type="application/pdf", headers=headers)

