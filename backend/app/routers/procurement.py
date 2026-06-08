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
from app.schemas import PRCreate, PRUpdate, PRFullUpdate, PROut, POCreate, POUpdate, POOut, POItemOut, POFullUpdate, POApproveRequest
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
    
    # --- ROW-LEVEL SECURITY / DATA SCOPING ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope in ["Full Administrative Access", "Organization"]:
            pass
        elif scope == "Department":
            if current_user.department:
                q = q.filter(PurchaseRequest.department_name == current_user.department)
            else:
                q = q.filter(PurchaseRequest.requester_id == current_user.id)
        else:
            q = q.filter(PurchaseRequest.requester_id == current_user.id)
            
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
                "approved_quantity": it.approved_quantity,
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
            status=pr.status, current_approval_level=pr.current_approval_level or 1, created_at=pr.created_at, updated_at=pr.updated_at,
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
            "approved_quantity": it.approved_quantity,
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
        status=pr.status, current_approval_level=pr.current_approval_level or 1, created_at=pr.created_at, updated_at=pr.updated_at,
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
        status=data.status or "Draft",
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

@router.put("/pr/{id}/full")
def full_update_purchase_request(
    id: int, data: PRFullUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    pr = db.query(PurchaseRequest).filter(
        PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id
    ).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
        
    if pr.status != 'Draft':
        raise HTTPException(status_code=400, detail="Only draft PRs can be edited")

    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data:
        pr.status = update_data["status"]
    
    for k in ["project_id", "required_date", "priority", "remarks", "required_for_room_id", "building_id", "department_name"]:
        if k in update_data:
            setattr(pr, k, update_data[k])
            
    if "items" in update_data:
        db.query(PurchaseRequestItem).filter(PurchaseRequestItem.pr_id == id).delete()
        for item in data.items:
            pr_item = PurchaseRequestItem(
                pr_id=pr.id,
                material_id=item.material_id,
                quantity=item.quantity
            )
            db.add(pr_item)
            
    db.commit()
    return {"message": "PR full update successful"}


from app.models import ApprovalFlow, PurchaseRequestApproval, PurchaseOrderApproval
from app.schemas import PRApproveRequest
from typing import Optional

@router.post("/pr/{id}/approve")
def approve_pr(
    id: int, data: Optional[PRApproveRequest] = None, db: Session = Depends(get_db), 
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
        db.commit()
        return {"message": "PR Submitted", "status": pr.status}

    if pr.status != 'Submitted':
        raise HTTPException(400, "PR is not awaiting approval")

    if pr.current_approval_level is None:
        pr.current_approval_level = 1

    # Calculate total amount for flow matching
    total_amount = 0
    for item in pr.items:
        if item.material and item.material.standard_cost:
            total_amount += item.quantity * item.material.standard_cost

    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "PURCHASE_REQUEST",
        ApprovalFlow.level == pr.current_approval_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
    ).all()

    if not flows:
        return handle_pr_next_level(db, pr, tenant_id, site_id, total_amount, current_user.id)

    user_roles = getattr(current_user, "_roles", [])
    is_admin = getattr(current_user, "_is_platform_admin", False)
    perms = getattr(current_user, "_permissions", {})
    can_override = is_admin or perms.get('purchase_requests', {}).get('extended_actions', {}).get('can_approve', False)

    applicable_flows = [
        f for f in flows 
        if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)
    ]
    
    if not applicable_flows:
        raise HTTPException(403, f"You do not have permission to approve at level {pr.current_approval_level}")

    new_approvals = 0
    approved_quantities_dict = {}
    if data and data.items:
        for it in data.items:
            approved_quantities_dict[str(it.pr_item_id)] = {
                "quantity": it.approved_quantity,
                "remarks": it.remarks
            }
            db_item = next((i for i in pr.items if i.id == it.pr_item_id), None)
            if db_item:
                db_item.approved_quantity = it.approved_quantity

    for f in applicable_flows:
        existing = db.query(PurchaseRequestApproval).filter(PurchaseRequestApproval.pr_id == id, PurchaseRequestApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(PurchaseRequestApproval(
                pr_id=id, 
                approval_flow_id=f.id, 
                approver_id=current_user.id,
                approved_quantities=approved_quantities_dict,
                remarks=data.remarks if data else None
            ))
            new_approvals += 1

    if new_approvals == 0:
        raise HTTPException(400, "You have already approved this PR at the current level")

    db.add(AuditLog(tenant_id=tenant_id, site_id=site_id, user_id=current_user.id, action="APPROVE", entity_type="PurchaseRequest", entity_id=id))
    db.commit()

    approvals_count = db.query(PurchaseRequestApproval).filter(PurchaseRequestApproval.pr_id == id).join(ApprovalFlow).filter(ApprovalFlow.level == pr.current_approval_level).count()
    if approvals_count >= len(flows):
        return handle_pr_next_level(db, pr, tenant_id, site_id, total_amount, current_user.id)

    return {"message": "Approval recorded", "status": pr.status, "current_level": pr.current_approval_level}

def handle_pr_next_level(db, pr, tenant_id, site_id, total_amount, user_id=None):
    next_level = pr.current_approval_level + 1
    has_more = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "PURCHASE_REQUEST",
        ApprovalFlow.level >= next_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
    ).first()

    if has_more:
        pr.current_approval_level = next_level
        db.commit()
        return {"message": f"Moved to level {next_level}", "status": pr.status, "current_level": pr.current_approval_level}
    else:
        pr.status = "Approved"
        pr.approved_by_id = user_id
        pr.approved_at = datetime.utcnow()
        db.commit()
        return {"message": "Fully Approved", "status": pr.status, "current_level": pr.current_approval_level}


@router.get("/pr/{id}/approval-history")

def handle_po_next_level(db, po, tenant_id, site_id, total_amount, user_id=None):
    current_lvl = po.current_approval_level or 0
    next_level = current_lvl + 1
    has_more = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "PURCHASE_ORDER",
        ApprovalFlow.level >= next_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
    ).first()

    if has_more:
        po.current_approval_level = next_level
        db.commit()
        return {"message": f"Moved to level {next_level}", "status": po.status, "current_level": po.current_approval_level}
    else:
        po.status = "Approved"
        po.approved_by_id = user_id
        po.approved_at = datetime.utcnow()
        db.commit()
        return {"message": "Fully Approved", "status": po.status, "current_level": po.current_approval_level}

@router.get("/pr/{id}/approval-history")
def get_pr_approval_history(
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

    approvals = db.query(PurchaseRequestApproval).filter(
        PurchaseRequestApproval.pr_id == id
    ).order_by(PurchaseRequestApproval.approved_at.asc()).all()

    entries = []
    for approval in approvals:
        flow = approval.flow
        approver = approval.approver

        items = []
        for item in pr.items:
            item_id_str = str(item.id)
            qty_val = (approval.approved_quantities or {}).get(item_id_str)
            if isinstance(qty_val, dict):
                qty = qty_val.get("quantity")
                item_rem = qty_val.get("remarks")
            else:
                qty = qty_val
                item_rem = None

            items.append({
                "material_id": item.material_id,
                "material_name": item.material.name if item.material else None,
                "material_code": item.material.code if item.material else None,
                "uom_name": item.material.uom.name if item.material and item.material.uom else None,
                "requested_quantity": item.quantity,
                "approved_quantity": qty,
                "remarks": item_rem
            })

        status = "Approved"
        for item in pr.items:
            item_id_str = str(item.id)
            qty_val = (approval.approved_quantities or {}).get(item_id_str)
            qty = qty_val.get("quantity") if isinstance(qty_val, dict) else qty_val
            if qty is not None and qty != item.quantity:
                status = "Modified"
                break

        entries.append({
            "level": flow.level if flow else 0,
            "approver_name": approver.full_name if approver else "Unknown",
            "role_name": flow.role_name if flow else "Unknown",
            "approved_at": approval.approved_at,
            "remarks": approval.remarks,
            "status": status,
            "items": items
        })

    return {
        "pr_id": pr.id,
        "pr_number": pr.pr_number,
        "current_approval_level": pr.current_approval_level,
        "entries": entries
    }



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

    # --- ROW-LEVEL SECURITY / DATA SCOPING ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope in ["Full Administrative Access", "Organization"]:
            pass
        else:
            # For POs, if they don't have Org/Admin access, they only see what they created
            # as POs don't have a strict department mapping.
            q = q.filter(PurchaseOrder.created_by_id == current_user.id)

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
                is_gst_inclusive=item.is_gst_inclusive,
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
            vendor_name=f"{po.vendor.code} - {po.vendor.name}" if po.vendor else None,
            vendor_address=f"{po.vendor.address_line_1 or ''}{', ' + po.vendor.address_line_2 if po.vendor.address_line_2 else ''}" if po.vendor else None,
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
            is_gst_inclusive=item.is_gst_inclusive,
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
        vendor_name=f"{po.vendor.code} - {po.vendor.name}" if po.vendor else None,
        vendor_address=f"{po.vendor.address_line_1 or ''}{', ' + po.vendor.address_line_2 if po.vendor.address_line_2 else ''}" if po.vendor else None,
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
    actual_status = data.status or "Draft"
    if data.pr_id or data.indent_id or data.qr_id:
        actual_status = "Submitted"

    po = PurchaseOrder(
        po_number=get_next_number(db, tenant_id, site_id, "PURCHASE_ORDER", "PO"),
        vendor_id=data.vendor_id,
        project_id=data.project_id,
        pr_id=data.pr_id,
        indent_id=data.indent_id,
        qr_id=data.qr_id,
        po_type=data.po_type or ("Formal" if (data.pr_id or data.indent_id or data.qr_id) else "Informal"),
        delivery_date=data.delivery_date,
        status=actual_status,
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
        gross_amt = round(item_data.quantity * item_data.rate, 2)
        disc_amt = round(gross_amt * (item_data.discount_percent / 100), 2)
        net_amt = gross_amt - disc_amt
        
        total_gst_pct = item_data.cgst_percentage + item_data.sgst_percentage + item_data.igst_percentage
        if item_data.is_gst_inclusive and total_gst_pct > 0:
            item_total = net_amt
        else:
            tax_amt = round(net_amt * (total_gst_pct / 100), 2)
            item_total = net_amt + tax_amt
            
        total += item_total
        
        po_item = PurchaseOrderItem(
            po_id=po.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            rate=item_data.rate,
            amount=gross_amt,
            discount_percent=item_data.discount_percent,
            cgst_percentage=item_data.cgst_percentage,
            sgst_percentage=item_data.sgst_percentage,
            igst_percentage=item_data.igst_percentage,
            is_gst_inclusive=item_data.is_gst_inclusive
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
    
    res = {"id": po.id, "po_number": po.po_number, "message": "Purchase Order created"}
    if po.status == "Submitted":
        flow_res = handle_po_next_level(db, po, tenant_id, site_id, po.total_amount, current_user.id)
        res.update(flow_res)
        
    return res


@router.put("/po/{id}")
def update_purchase_order(
    id: int, data: POFullUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    if po.status != 'Draft':
        raise HTTPException(status_code=400, detail="Only draft POs can be edited")

    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data:
        if (po.pr_id or po.indent_id or po.qr_id) and update_data["status"] == "Draft":
            po.status = "Submitted"
        else:
            po.status = update_data["status"]
    
    for k in ["vendor_id", "project_id", "delivery_date", "po_type", "terms"]:
        if k in update_data:
            setattr(po, k, update_data[k])
            
    if "items" in update_data:
        db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == id).delete()
        
        total = 0
        for item_data in data.items:
            gross_amt = round(item_data.quantity * item_data.rate, 2)
            disc_amt = round(gross_amt * (item_data.discount_percent / 100), 2)
            net_amt = gross_amt - disc_amt
            
            total_gst_pct = item_data.cgst_percentage + item_data.sgst_percentage + item_data.igst_percentage
            if item_data.is_gst_inclusive and total_gst_pct > 0:
                item_total = net_amt
            else:
                tax_amt = round(net_amt * (total_gst_pct / 100), 2)
                item_total = net_amt + tax_amt
                
            total += item_total
            
            po_item = PurchaseOrderItem(
                po_id=po.id,
                material_id=item_data.material_id,
                quantity=item_data.quantity,
                rate=item_data.rate,
                amount=gross_amt,
                discount_percent=item_data.discount_percent,
                cgst_percentage=item_data.cgst_percentage,
                sgst_percentage=item_data.sgst_percentage,
                igst_percentage=item_data.igst_percentage,
                is_gst_inclusive=item_data.is_gst_inclusive
            )
            db.add(po_item)
            
        po.total_amount = round(total, 2)

    db.commit()
    
    if po.status == "Submitted":
        return handle_po_next_level(db, po, tenant_id, site_id, po.total_amount, current_user.id)

    return {"message": "PO updated successfully"}


@router.post("/po/{id}/approve")
def approve_po(
    id: int, data: Optional[POApproveRequest] = None, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    po = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
        
    if po.status == 'Draft':
        po.status = "Submitted"
        db.commit()
        return {"message": "PO Submitted", "status": po.status}

    if po.status != 'Submitted':
        raise HTTPException(400, "PO is not awaiting approval")

    if po.current_approval_level is None:
        po.current_approval_level = 1

    total_amount = po.total_amount

    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "PURCHASE_ORDER",
        ApprovalFlow.level == po.current_approval_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
    ).all()

    if not flows:
        return handle_po_next_level(db, po, tenant_id, site_id, total_amount, current_user.id)

    user_roles = getattr(current_user, "_roles", [])
    is_admin = getattr(current_user, "_is_platform_admin", False)
    perms = getattr(current_user, "_permissions", {})
    can_override = is_admin or perms.get('purchase_orders', {}).get('extended_actions', {}).get('can_approve', False)

    applicable_flows = [
        f for f in flows 
        if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)
    ]
    
    if not applicable_flows:
        raise HTTPException(403, f"You do not have permission to approve at level {po.current_approval_level}")

    new_approvals = 0
    approved_quantities_dict = {}
    if data and data.items:
        for it in data.items:
            approved_quantities_dict[str(it.po_item_id)] = {
                "quantity": it.approved_quantity,
                "remarks": it.remarks
            }

    for f in applicable_flows:
        existing = db.query(PurchaseOrderApproval).filter(PurchaseOrderApproval.po_id == id, PurchaseOrderApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(PurchaseOrderApproval(
                po_id=id, 
                approval_flow_id=f.id, 
                approver_id=current_user.id,
                approved_quantities=approved_quantities_dict,
                remarks=data.remarks if data else None
            ))
            new_approvals += 1

    if new_approvals == 0:
        raise HTTPException(400, "You have already approved this PO at the current level")

    db.add(AuditLog(tenant_id=tenant_id, site_id=site_id, user_id=current_user.id, action="APPROVE", entity_type="PurchaseOrder", entity_id=id))
    db.commit()

    approvals_count = db.query(PurchaseOrderApproval).filter(PurchaseOrderApproval.po_id == id).join(ApprovalFlow).filter(ApprovalFlow.level == po.current_approval_level).count()
    if approvals_count >= len(flows):
        return handle_po_next_level(db, po, tenant_id, site_id, total_amount, current_user.id)

    return {"message": "Approval recorded", "status": po.status, "current_level": po.current_approval_level}



@router.get("/po/{id}/approval-history")
def get_po_approval_history(
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

    approvals = db.query(PurchaseOrderApproval).filter(
        PurchaseOrderApproval.po_id == id
    ).order_by(PurchaseOrderApproval.approved_at.asc()).all()

    entries = []
    
    # Track the latest approved quantities across levels
    latest_approved_quantities = {}
    
    for approval in approvals:
        flow = approval.flow
        approver = approval.approver

        if approval.approved_quantities:
            for it_id, it_data in approval.approved_quantities.items():
                if isinstance(it_data, dict):
                    latest_approved_quantities[it_id] = it_data.get("quantity")
                else:
                    latest_approved_quantities[it_id] = it_data

        items = []
        for item in po.items:
            item_id_str = str(item.id)
            qty_val = (approval.approved_quantities or {}).get(item_id_str)
            if isinstance(qty_val, dict):
                qty = qty_val.get("quantity")
                item_rem = qty_val.get("remarks")
            else:
                qty = qty_val
                item_rem = None

            items.append({
                "material_id": item.material_id,
                "material_name": item.material.name if item.material else None,
                "material_code": item.material.code if item.material else None,
                "uom_name": item.material.uom.name if item.material and item.material.uom else None,
                "requested_quantity": item.quantity,
                "approved_quantity": qty,
                "remarks": item_rem
            })

        status = "Approved"

        entries.append({
            "level": flow.level if flow else 0,
            "approver_name": approver.full_name if approver else "Unknown",
            "role_name": flow.role_name if flow else "Unknown",
            "approved_at": approval.approved_at,
            "remarks": approval.remarks,
            "status": status,
            "items": items
        })

    return {
        "po_id": po.id,
        "po_number": po.po_number,
        "current_approval_level": po.current_approval_level,
        "entries": entries
    }

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
