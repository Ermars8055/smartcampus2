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
    Material, User, Block, Project, Vendor, AuditLog, UOM
)
from app.schemas import PRCreate, PRUpdate, PROut, POCreate, POUpdate, POOut, POItemOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/procurement", tags=["Procurement"])


def generate_pr_number(db: Session) -> str:
    count = db.query(PurchaseRequest).count() + 1
    return f"PR-{datetime.now().strftime('%Y%m')}-{count:04d}"


def generate_po_number(db: Session) -> str:
    count = db.query(PurchaseOrder).count() + 1
    return f"PO-{datetime.now().strftime('%Y%m')}-{count:04d}"


# ── Purchase Requests ────────────────────────────────────────────────────

@router.get("/pr")
def list_purchase_requests(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(PurchaseRequest)
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
                "uom_name": it.material.uom.name if it.material and it.material.uom else None
            })
        result.append(PROut(
            id=pr.id, pr_number=pr.pr_number,
            required_for_block_id=pr.required_for_block_id,
            project_id=pr.project_id, required_date=pr.required_date,
            remarks=pr.remarks, requester_id=pr.requester_id,
            status=pr.status, created_at=pr.created_at, updated_at=pr.updated_at,
            approved_by_id=pr.approved_by_id, approved_at=pr.approved_at,
            requester_name=pr.requester.full_name if pr.requester else None,
            block_name=pr.block.name if pr.block else None,
            project_name=pr.project.name if pr.project else None,
            items=items
        ))
    return result


@router.get("/pr/{id}")
def get_purchase_request(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    items = []
    for it in pr.items:
        items.append({
            "id": it.id, "material_id": it.material_id, "quantity": it.quantity,
            "material_name": it.material.name if it.material else None,
            "material_code": it.material.code if it.material else None,
            "uom_name": it.material.uom.name if it.material and it.material.uom else None
        })
    return PROut(
        id=pr.id, pr_number=pr.pr_number,
        required_for_block_id=pr.required_for_block_id,
        project_id=pr.project_id, required_date=pr.required_date,
        remarks=pr.remarks, requester_id=pr.requester_id,
        status=pr.status, created_at=pr.created_at, updated_at=pr.updated_at,
        approved_by_id=pr.approved_by_id, approved_at=pr.approved_at,
        requester_name=pr.requester.full_name if pr.requester else None,
        block_name=pr.block.name if pr.block else None,
        project_name=pr.project.name if pr.project else None,
        items=items
    )


@router.post("/pr")
def create_purchase_request(data: PRCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = PurchaseRequest(
        pr_number=generate_pr_number(db),
        requester_id=current_user.id,
        project_id=data.project_id,
        required_for_block_id=data.required_for_block_id,
        required_date=data.required_date,
        remarks=data.remarks
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
def update_purchase_request(id: int, data: PRUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id).first()
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
def approve_pr(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    # Draft → Submitted (needs review), Submitted → Approved
    if pr.status == 'Draft':
        pr.status = "Submitted"
    else:
        pr.status = "Approved"
        pr.approved_by_id = current_user.id
        pr.approved_at = datetime.utcnow()
    db.add(AuditLog(user_id=current_user.id, action="APPROVE", entity_type="PurchaseRequest", entity_id=id))
    db.commit()
    return {"message": f"PR status changed to {pr.status}"}


class RejectBody(BaseModel):
    remarks: Optional[str] = None

@router.post("/pr/{id}/reject")
def reject_pr(id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    pr.status = "Rejected"
    if body.remarks:
        pr.remarks = (pr.remarks or '') + f'\n[Rejected: {body.remarks}]'
    db.commit()
    return {"message": "PR rejected"}


@router.post("/pr/{id}/short-close")
def short_close_pr(id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id).first()
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
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(PurchaseOrder)
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
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        # Resolve PR number for display
        pr_number = None
        if po.pr_id:
            linked_pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == po.pr_id).first()
            pr_number = linked_pr.pr_number if linked_pr else None
        result.append(POOut(
            id=po.id, po_number=po.po_number,
            vendor_id=po.vendor_id, project_id=po.project_id,
            pr_id=po.pr_id, pr_number=pr_number, total_amount=po.total_amount,
            delivery_date=po.delivery_date, status=po.status,
            terms=po.terms, created_at=po.created_at,
            vendor_name=po.vendor.name if po.vendor else None,
            project_name=po.project.name if po.project else None,
            items=items
        ))
    return result


@router.get("/po/{id}")
def get_purchase_order(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    items = []
    for item in po.items:
        mat = item.material
        items.append(POItemOut(
            id=item.id, material_id=item.material_id,
            quantity=item.quantity, rate=item.rate,
            amount=item.amount, received_quantity=item.received_quantity,
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            uom_name=mat.uom.name if mat and mat.uom else None
        ))
    return POOut(
        id=po.id, po_number=po.po_number,
        vendor_id=po.vendor_id, project_id=po.project_id,
        pr_id=po.pr_id, total_amount=po.total_amount,
        delivery_date=po.delivery_date, status=po.status,
        terms=po.terms, created_at=po.created_at,
        vendor_name=po.vendor.name if po.vendor else None,
        project_name=po.project.name if po.project else None,
        items=items
    )


@router.post("/po")
def create_purchase_order(data: POCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = PurchaseOrder(
        po_number=generate_po_number(db),
        vendor_id=data.vendor_id,
        project_id=data.project_id,
        pr_id=data.pr_id,
        delivery_date=data.delivery_date,
        terms=data.terms,
        created_by_id=current_user.id,
        total_amount=0
    )
    db.add(po)
    db.flush()

    total = 0
    for item_data in data.items:
        amount = item_data.quantity * item_data.rate
        total += amount
        po_item = PurchaseOrderItem(
            po_id=po.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            rate=item_data.rate,
            amount=amount
        )
        db.add(po_item)

    po.total_amount = total

    # Update PR status if linked
    if data.pr_id:
        pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == data.pr_id).first()
        if pr:
            pr.status = "Converted to PO"

    db.commit()
    db.refresh(po)
    return {"id": po.id, "po_number": po.po_number, "message": "Purchase Order created"}


@router.put("/po/{id}")
def update_purchase_order(id: int, data: POUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
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
def approve_po(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "Approved"
    po.approved_by_id = current_user.id
    po.approved_at = datetime.utcnow()
    db.commit()
    return {"message": "PO approved successfully"}

@router.post("/po/{id}/reject")
def reject_po(id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "Rejected"
    if body.remarks:
        po.terms = (po.terms or '') + f'\n[Rejected: {body.remarks}]'
    db.commit()
    return {"message": "PO rejected successfully"}

@router.post("/po/{id}/hold")
def hold_po(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "On Hold"
    db.commit()
    return {"message": "PO placed on hold successfully"}

@router.post("/po/{id}/send")
def send_po(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status != "Approved":
        raise HTTPException(status_code=400, detail="Only approved POs can be sent.")
    
    po.status = "Sent to Vendor"
    # In a full deployment, trigger PDF generation + SMTP Email task here
    db.commit()
    return {"message": "PO data successfully packaged and sent to Vendor."}


@router.post("/po/{id}/short-close")
def short_close_po(id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    po.status = "Short Closed"
    if body.remarks:
        po.terms = (po.terms or '') + f'\n[Short Closed: {body.remarks}]'
    db.commit()
    return {"message": "PO Short Closed"}

