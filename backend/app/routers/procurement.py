"""Procurement routes: Purchase Requests and Purchase Orders."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import (
    PurchaseRequest, PurchaseRequestItem, PurchaseOrder, PurchaseOrderItem,
    QuotationRequest, Material, User, Building, Project, Vendor, AuditLog, UOM
)
from app.schemas import PRCreate, PRUpdate, PROut, POCreate, POUpdate, POOut, POItemOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api/procurement", tags=["Procurement"])


def get_lpp(db: Session, material_id: int, tenant_id: int, site_id: int) -> float | None:
    last_po_item = db.query(PurchaseOrderItem).join(PurchaseOrder).filter(
        PurchaseOrderItem.material_id == material_id,
        PurchaseOrder.tenant_id == tenant_id,
        PurchaseOrder.site_id == site_id,
        PurchaseOrder.status != "Draft"
    ).order_by(PurchaseOrder.created_at.desc()).first()
    return last_po_item.rate if last_po_item else None


class RejectBody(BaseModel):
    remarks: Optional[str] = None


# ── Purchase Requests ────────────────────────────────────────────────────

@router.get("/pr")
def list_purchase_requests(
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(PurchaseRequest).filter(
        PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id,
        PurchaseRequest.is_deleted == False
    )
    if search:
        q = q.filter(PurchaseRequest.pr_number.ilike(f"%{search}%"))
    if status:
        q = q.filter(PurchaseRequest.status == status)
    if project_id:
        q = q.filter(PurchaseRequest.project_id == project_id)
    prs = q.order_by(PurchaseRequest.created_at.desc()).all()
    result = []
    for pr in prs:
        items = []
        for it in pr.items:
            items.append({
                "id": it.id, "material_id": it.material_id, "quantity": it.quantity,
                "material_name": it.material.name if it.material else None,
                "material_code": it.material.code if it.material else None,
                "uom_name": it.material.uom.name if it.material and it.material.uom else None,
                "last_purchase_price": get_lpp(db, it.material_id, tenant_id, site_id)
            })
        result.append(PROut(
            id=pr.id, pr_number=pr.pr_number,
            required_for_room_id=pr.required_for_room_id,
            building_id=pr.building_id,
            department_name=pr.department_name,
            project_id=pr.project_id, required_date=pr.required_date,
            remarks=pr.remarks, requester_id=pr.requester_id,
            status=pr.status, created_at=pr.created_at, updated_at=pr.updated_at,
            approved_by_id=pr.approved_by_id, approved_at=pr.approved_at,
            requester_name=pr.requester.full_name if pr.requester else None,
            room_name=pr.room.name if pr.room else None,
            project_name=pr.project.name if pr.project else None,
            building_name=pr.building.name if pr.building else None,
            items=items
        ))
    return result


@router.get("/pr/{id}")
def get_purchase_request(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    items = []
    for it in pr.items:
        items.append({
            "id": it.id, "material_id": it.material_id, "quantity": it.quantity,
            "material_name": it.material.name if it.material else None,
            "material_code": it.material.code if it.material else None,
            "uom_name": it.material.uom.name if it.material and it.material.uom else None,
            "last_purchase_price": get_lpp(db, it.material_id, tenant_id, site_id)
        })
    return PROut(
        id=pr.id, pr_number=pr.pr_number,
        required_for_room_id=pr.required_for_room_id,
        building_id=pr.building_id,
        department_name=pr.department_name,
        project_id=pr.project_id, required_date=pr.required_date,
        remarks=pr.remarks, requester_id=pr.requester_id,
        status=pr.status, created_at=pr.created_at, updated_at=pr.updated_at,
        approved_by_id=pr.approved_by_id, approved_at=pr.approved_at,
        requester_name=pr.requester.full_name if pr.requester else None,
        room_name=pr.room.name if pr.room else None,
        project_name=pr.project.name if pr.project else None,
        building_name=pr.building.name if pr.building else None,
        items=items
    )


@router.post("/pr")
def create_purchase_request(
    data: PRCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = PurchaseRequest(
        pr_number=get_next_number(db, tenant_id, site_id, "PURCHASE_REQUEST", "PR"),
        requester_id=current_user.id,
        project_id=data.project_id,
        required_for_room_id=data.required_for_room_id,
        building_id=data.building_id,
        department_name=data.department_name,
        required_date=data.required_date,
        remarks=data.remarks,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(pr)
    db.flush()
    for item in data.items:
        pr_item = PurchaseRequestItem(
            pr_id=pr.id,
            material_id=item.material_id,
            quantity=item.quantity
        )
        db.add(pr_item)
    db.commit()
    db.refresh(pr)
    return {"id": pr.id, "pr_number": pr.pr_number, "message": "Purchase Request created"}


@router.put("/pr/{id}")
def update_purchase_request(
    id: int, data: PRUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data:
        if update_data["status"] == "Approved":
            pr.approved_by_id = current_user.id
            pr.approved_at = datetime.utcnow()
    for k, v in update_data.items():
        setattr(pr, k, v)
    db.commit()
    return {"message": "PR updated successfully"}


@router.post("/pr/{id}/approve")
def approve_pr(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    if pr.status == 'Draft':
        pr.status = "Submitted"
    else:
        pr.status = "Approved"
        pr.approved_by_id = current_user.id
        pr.approved_at = datetime.utcnow()
    db.add(AuditLog(tenant_id=tenant_id, site_id=site_id, user_id=current_user.id, action="APPROVE", entity_type="PurchaseRequest", entity_id=id))
    db.commit()
    return {"message": f"PR status changed to {pr.status}"}


@router.post("/pr/{id}/reject")
def reject_pr(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    pr.status = "Rejected"
    if body.remarks:
        pr.remarks = (pr.remarks or '') + f'\n[Rejected: {body.remarks}]'
    db.commit()
    return {"message": "PR rejected"}


@router.post("/pr/{id}/hold")
def hold_pr(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    pr.status = "On Hold"
    db.commit()
    return {"message": "PR placed on hold"}


@router.post("/pr/{id}/short-close")
def short_close_pr(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    pr.status = "Short Closed"
    if body.remarks:
        pr.remarks = (pr.remarks or '') + f'\n[Short Closed: {body.remarks}]'
    db.commit()
    return {"message": "PR Short Closed"}


# ── Purchase Orders ──────────────────────────────────────────────────────

@router.get("/po")
def list_purchase_orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_orders", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(PurchaseOrder).filter(
        PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id,
        PurchaseOrder.is_deleted == False
    )
    if search:
        q = q.filter(PurchaseOrder.po_number.ilike(f"%{search}%"))
    if status:
        q = q.filter(PurchaseOrder.status == status)
    if project_id:
        q = q.filter(PurchaseOrder.project_id == project_id)
    pos = q.order_by(PurchaseOrder.created_at.desc()).all()
    result = []
    for po in pos:
        items = []
        for item in po.items:
            mat = item.material
            items.append(POItemOut(
                id=item.id, material_id=item.material_id,
                quantity=item.quantity, rate=item.rate,
                amount=item.amount, received_quantity=item.received_quantity,
                discount_percent=item.discount_percent,
                cgst_percentage=item.cgst_percentage,
                sgst_percentage=item.sgst_percentage,
                igst_percentage=item.igst_percentage,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        
        # Populate numbers
        pr_number = None
        if po.pr_id:
            pr_number = po.purchase_request.pr_number if po.purchase_request else None
        elif po.qr_id:
            # If no direct PR, check linked PRs in the QR
            pr_nums = [pr.purchase_request.pr_number for pr in po.quotation_request.linked_prs if pr.purchase_request]
            if pr_nums:
                pr_number = ", ".join(pr_nums)
        
        indent_number = None
        if po.indent_id:
            indent_number = po.indent.indent_number if po.indent else None
        elif po.qr_id:
            # Check if any linked PRs have an indent (if that link ever exists) 
            # Or if QR was somehow linked to indents (currently not in schema)
            pass

        qr_number = po.quotation_request.qr_number if po.quotation_request else None

        result.append(POOut(
            id=po.id, po_number=po.po_number,
            vendor_id=po.vendor_id, project_id=po.project_id,
            pr_id=po.pr_id, pr_number=pr_number, 
            indent_id=po.indent_id, indent_number=indent_number,
            qr_id=po.qr_id, qr_number=qr_number,
            po_type=po.po_type,
            total_amount=po.total_amount,
            delivery_date=po.delivery_date, status=po.status,
            terms=po.terms, created_at=po.created_at,
            vendor_name=po.vendor.name if po.vendor else None,
            vendor_address=po.vendor.address if po.vendor else None,
            vendor_gst_number=po.vendor.gst_number if po.vendor else None,
            project_name=po.project.name if po.project else None,
            items=items
        ))
    return result


@router.get("/po/{id}")
def get_purchase_order(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    items = []
    for item in po.items:
        mat = item.material
        items.append(POItemOut(
            id=item.id, material_id=item.material_id,
            quantity=item.quantity, rate=item.rate,
            amount=item.amount, received_quantity=item.received_quantity,
            discount_percent=item.discount_percent,
            cgst_percentage=item.cgst_percentage,
            sgst_percentage=item.sgst_percentage,
            igst_percentage=item.igst_percentage,
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            uom_name=mat.uom.name if mat and mat.uom else None
        ))
    # Populate numbers
    pr_number = None
    if po.pr_id:
        pr_number = po.purchase_request.pr_number if po.purchase_request else None
    elif po.qr_id:
        pr_nums = [pr.purchase_request.pr_number for pr in po.quotation_request.linked_prs if pr.purchase_request]
        if pr_nums:
            pr_number = ", ".join(pr_nums)
    
    indent_number = po.indent.indent_number if po.indent else None
    qr_number = po.quotation_request.qr_number if po.quotation_request else None

    return POOut(
        id=po.id, po_number=po.po_number,
        vendor_id=po.vendor_id, project_id=po.project_id,
        pr_id=po.pr_id, pr_number=pr_number,
        indent_id=po.indent_id, indent_number=indent_number,
        qr_id=po.qr_id, qr_number=qr_number,
        po_type=po.po_type,
        total_amount=po.total_amount,
        delivery_date=po.delivery_date, status=po.status,
        terms=po.terms, created_at=po.created_at,
        vendor_name=po.vendor.name if po.vendor else None,
        vendor_address=po.vendor.address if po.vendor else None,
        vendor_gst_number=po.vendor.gst_number if po.vendor else None,
        project_name=po.project.name if po.project else None,
        items=items
    )


@router.post("/po")
def create_purchase_order(
    data: POCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = PurchaseOrder(
        po_number=get_next_number(db, tenant_id, site_id, "PURCHASE_ORDER", "PO"),
        vendor_id=data.vendor_id,
        project_id=data.project_id,
        pr_id=data.pr_id,
        indent_id=data.indent_id,
        qr_id=data.qr_id,
        po_type=data.po_type or ("Formal" if (data.pr_id or data.indent_id or data.qr_id) else "Informal"),
        delivery_date=data.delivery_date,
        terms=data.terms,
        created_by_id=current_user.id,
        total_amount=0,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(po)
    db.flush()

    total = 0
    for item_data in data.items:
        amount = round(item_data.quantity * item_data.rate, 2)
        total += amount
        po_item = PurchaseOrderItem(
            po_id=po.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            rate=item_data.rate,
            amount=amount,
            discount_percent=item_data.discount_percent,
            cgst_percentage=item_data.cgst_percentage,
            sgst_percentage=item_data.sgst_percentage,
            igst_percentage=item_data.igst_percentage
        )
        db.add(po_item)

    po.total_amount = round(total, 2)

    if data.pr_id:
        pr = db.query(PurchaseRequest).filter(
            PurchaseRequest.id == data.pr_id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
        ).first()
        if pr:
            pr.status = "Converted to PO"

    from app.models import Indent, IndentStatus
    if data.indent_id:
        indent = db.query(Indent).filter(
            Indent.id == data.indent_id, Indent.tenant_id == tenant_id, Indent.site_id == site_id
        ).first()
        if indent:
            indent.status = IndentStatus.CONVERTED.value

    db.commit()
    db.refresh(po)
    return {"id": po.id, "po_number": po.po_number, "message": "Purchase Order created"}


@router.put("/po/{id}")
def update_purchase_order(
    id: int, data: POUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] == "Approved":
        po.approved_by_id = current_user.id
        po.approved_at = datetime.utcnow()
    for k, v in update_data.items():
        setattr(po, k, v)
    db.commit()
    return {"message": "PO updated successfully"}


@router.post("/po/{id}/approve")
def approve_po(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "Approved"
    po.approved_by_id = current_user.id
    po.approved_at = datetime.utcnow()
    db.commit()
    return {"message": "PO approved successfully"}

@router.post("/po/{id}/reject")
def reject_po(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "Rejected"
    if body.remarks:
        po.terms = (po.terms or '') + f'\n[Rejected: {body.remarks}]'
    db.commit()
    return {"message": "PO rejected successfully"}

@router.post("/po/{id}/hold")
def hold_po(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "On Hold"
    db.commit()
    return {"message": "PO placed on hold successfully"}

@router.post("/po/{id}/send")
def send_po(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status != "Approved":
        raise HTTPException(status_code=400, detail="Only approved POs can be sent.")
    
    po.status = "Sent to Vendor"
    db.commit()
    return {"message": "PO data successfully packaged and sent to Vendor."}


@router.post("/po/{id}/short-close")
def short_close_po(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "Short Closed"
    if body.remarks:
        po.terms = (po.terms or '') + f'\n[Short Closed: {body.remarks}]'
    db.commit()
    return {"message": "PO Short Closed"}
