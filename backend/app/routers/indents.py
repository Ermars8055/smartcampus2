"""Indents Router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database import get_db
from sqlalchemy import func
from app.models import (
    Indent, IndentItem, IndentStatus, ApprovalFlow, User, Material, CurrentStock, IndentApproval, PurchaseOrder, PurchaseOrderItem, DepartmentMaterialLimit
)
from app.schemas import IndentCreate, IndentOut, IndentAcknowledgeRequest, IndentApproveRequest
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/indents", tags=["Indents"])

def generate_indent_number(db: Session, tenant_id: int, site_id: int) -> str:
    return get_next_number(db, tenant_id, site_id, "INDENT", "IND")

@router.get("", response_model=List[IndentOut])
def list_indents(
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("indents", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    query = db.query(Indent).filter(Indent.tenant_id == tenant_id, Indent.site_id == site_id)
    
    # --- ROW-LEVEL SECURITY / DATA SCOPING ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        
        if scope in ["Full Administrative Access", "Organization"]:
            pass # No additional filtering
        elif scope == "Department":
            if current_user.department:
                query = query.filter(Indent.department == current_user.department)
            else:
                query = query.filter(Indent.requester_id == current_user.id)
        else:
            # Self Only
            query = query.filter(Indent.requester_id == current_user.id)
    
    if search:
        search_term = f"%{search}%"
        query = query.join(User, Indent.requester_id == User.id).filter(
            (Indent.indent_number.ilike(search_term)) |
            (Indent.department.ilike(search_term)) |
            (User.full_name.ilike(search_term))
        )
    
    indents = query.order_by(Indent.created_at.desc()).all()
    # Add manual material details to items for Out schema
    for indent in indents:
        indent.requester_name = indent.requester.full_name if indent.requester else None
        indent.room_name = indent.room.name if indent.room else None
        indent.building_name = indent.building.name if indent.building else (indent.room.floor.building.name if indent.room and indent.room.floor and indent.room.floor.building else None)
        indent.institution_name = indent.institution.name if indent.institution else None
        indent.floor = indent.floor or (indent.room.floor.name if indent.room and indent.room.floor else None)
        indent.department = indent.department or (indent.room.department_name if indent.room else None)
        indent.project_id = indent.building.project_id if indent.building else (indent.room.floor.building.project_id if indent.room and indent.room.floor and indent.room.floor.building else (indent.institution.project_id if indent.institution else None))
        for item in indent.items:
            if item.material:
                item.material_name = item.material.name
                item.material_code = item.material.code
                item.uom_name = item.material.uom.name if item.material.uom else None
                item.warehouse_id = item.material.warehouse_id
                item.warehouse_name = item.material.warehouse.name if item.material.warehouse else None
                
                # Fetch current stock
                stock = db.query(CurrentStock).filter(CurrentStock.material_id == item.material_id, CurrentStock.site_id == site_id).first()
                item.current_stock = stock.quantity if stock else 0
                
                # Calculate pending
                approved_qty = item.approved_quantity if item.approved_quantity is not None else item.requested_quantity
                item.pending_quantity = max(0, approved_qty - item.issued_quantity)
                
                # Availability status
                if item.current_stock == 0:
                    item.availability_status = "No Stock"
                elif item.current_stock < item.pending_quantity:
                    item.availability_status = "Low Stock"
                else:
                    item.availability_status = "Available"
    return indents

@router.post("", response_model=IndentOut)
def create_indent(
    data: IndentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("indents", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    try:
        # Check material limits first
        department = data.department or (current_user.department if current_user else None)
        if department:
            first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            for item_data in data.items:
                limit_obj = db.query(DepartmentMaterialLimit).filter(
                    DepartmentMaterialLimit.tenant_id == tenant_id,
                    DepartmentMaterialLimit.site_id == site_id,
                    DepartmentMaterialLimit.department == department,
                    DepartmentMaterialLimit.material_id == item_data.material_id
                ).first()

                if limit_obj:
                    # Calculate total requested this month
                    total_requested = db.query(func.sum(IndentItem.requested_quantity)).join(Indent).filter(
                        Indent.tenant_id == tenant_id,
                        Indent.site_id == site_id,
                        Indent.department == department,
                        IndentItem.material_id == item_data.material_id,
                        Indent.created_at >= first_day_of_month,
                        Indent.status != IndentStatus.REJECTED.value
                    ).scalar() or 0.0

                    if total_requested + item_data.requested_quantity > limit_obj.monthly_limit:
                        mat = db.query(Material).filter(Material.id == item_data.material_id).first()
                        mat_name = mat.name if mat else "Unknown Material"
                        remaining = max(0, limit_obj.monthly_limit - total_requested)
                        raise HTTPException(
                            status_code=400,
                            detail=f"The limit per month for '{mat_name}' is {int(limit_obj.monthly_limit)}. You can request only {int(remaining)} more."
                        )

        # Calculate total amount based on material standard costs
        total = 0
        for item_data in data.items:
            mat = db.query(Material).filter(Material.id == item_data.material_id).first()
            if mat:
                total += round((mat.standard_cost or 0) * item_data.requested_quantity, 2)

        indent = Indent(
            tenant_id=tenant_id,
            site_id=site_id,
            indent_number=generate_indent_number(db, tenant_id, site_id),
            requester_id=current_user.id,
            institution_id=data.institution_id,
            room_id=data.room_id,
            building_id=data.building_id,
            floor=data.floor,
            location=data.location,
            department=data.department,
            remarks=data.remarks,
            total_amount=round(total, 2),
            status=IndentStatus.AWAITING_APPROVAL.value,
            current_approval_level=1
        )
        db.add(indent)
        db.flush()
        
        for item_data in data.items:
            item = IndentItem(
                indent_id=indent.id,
                material_id=item_data.material_id,
                requested_quantity=item_data.requested_quantity
            )
            db.add(item)
            
        db.commit()
        db.refresh(indent)
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        import logging
        logging.error(f"Error creating indent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    
    indent.requester_name = current_user.full_name
    indent.room_name = indent.room.name if indent.room else None
    for item in indent.items:
        if item.material:
            item.material_name = item.material.name
            item.material_code = item.material.code
            item.uom_name = item.material.uom.name if item.material.uom else None
            item.current_stock = 0
            
    return indent

@router.get("/{id}", response_model=IndentOut)
def get_indent(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("indents", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    indent = db.query(Indent).filter(Indent.id == id, Indent.tenant_id == tenant_id, Indent.site_id == site_id).first()
    if not indent:
        raise HTTPException(404, "Indent not found")
        
    indent.requester_name = indent.requester.full_name if indent.requester else None
    indent.room_name = indent.room.name if indent.room else None
    indent.building_name = indent.building.name if indent.building else (indent.room.floor.building.name if indent.room and indent.room.floor and indent.room.floor.building else None)
    indent.institution_name = indent.institution.name if indent.institution else None
    indent.floor = indent.floor or (indent.room.floor.name if indent.room and indent.room.floor else None)
    indent.department = indent.department or (indent.room.department_name if indent.room else None)
    indent.project_id = indent.building.project_id if indent.building else (indent.room.floor.building.project_id if indent.room and indent.room.floor and indent.room.floor.building else (indent.institution.project_id if indent.institution else None))
    for item in indent.items:
        if item.material:
            item.material_name = item.material.name
            item.material_code = item.material.code
            item.uom_name = item.material.uom.name if item.material.uom else None
            item.warehouse_id = item.material.warehouse_id
            item.warehouse_name = item.material.warehouse.name if item.material.warehouse else None
            stock = db.query(CurrentStock).filter(CurrentStock.material_id == item.material_id, CurrentStock.site_id == site_id).first()
            item.current_stock = stock.quantity if stock else 0
            
            approved_qty = item.approved_quantity if item.approved_quantity is not None else item.requested_quantity
            item.pending_quantity = max(0, approved_qty - item.issued_quantity)
            
            if item.current_stock == 0:
                item.availability_status = "No Stock"
            elif item.current_stock < item.pending_quantity:
                item.availability_status = "Low Stock"
            else:
                item.availability_status = "Available"
            
    return indent

@router.post("/{id}/approve")
def approve_indent(
    id: int,
    data: Optional[IndentApproveRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    indent = db.query(Indent).filter(Indent.id == id, Indent.tenant_id == tenant_id, Indent.site_id == site_id).first()
    if not indent:
        raise HTTPException(404, "Indent not found")
    if indent.status != IndentStatus.AWAITING_APPROVAL.value:
        raise HTTPException(400, "Indent is not awaiting approval")

    # 1. Get all flows for the current level that apply to this amount
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "INDENT",
        ApprovalFlow.level == indent.current_approval_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= indent.total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= indent.total_amount)
    ).all()

    if not flows:
        # If no flows for this level/amount, move to next level or approve
        return handle_next_level(db, indent, tenant_id, site_id)

    # 2. Check which flows the current user can satisfy
    # Check by user_id first, then by role_name if user_id is null
    user_roles = getattr(current_user, "_roles", [])
    
    is_admin = getattr(current_user, "_is_platform_admin", False)
    perms = getattr(current_user, "_permissions", {})
    can_override = is_admin or perms.get('indents', {}).get('extended_actions', {}).get('can_approve', False)
    
    applicable_flows = [
        f for f in flows 
        if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)
    ]
    
    if not applicable_flows:
        raise HTTPException(403, f"You do not have permission to approve at level {indent.current_approval_level}")

    # 3. Record approvals for applicable flows
    new_approvals = 0
    approved_quantities_dict = {}
    if data and data.items:
        for it in data.items:
            approved_quantities_dict[str(it.indent_item_id)] = {
                "quantity": it.approved_quantity,
                "remarks": it.remarks
            }
            db_item = next((i for i in indent.items if i.id == it.indent_item_id), None)
            if db_item:
                db_item.approved_quantity = it.approved_quantity

    for f in applicable_flows:
        existing = db.query(IndentApproval).filter(IndentApproval.indent_id == id, IndentApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(IndentApproval(
                indent_id=id, 
                approval_flow_id=f.id, 
                approver_id=current_user.id,
                approved_quantities=approved_quantities_dict,
                remarks=data.remarks if data else None
            ))
            new_approvals += 1

    if new_approvals == 0:
        raise HTTPException(400, "You have already approved this indent at the current level")

    db.commit()

    # 4. Check if ALL required flows for this level are met
    approvals_count = db.query(IndentApproval).filter(IndentApproval.indent_id == id).join(ApprovalFlow).filter(ApprovalFlow.level == indent.current_approval_level).count()
    
    if approvals_count >= len(flows):
        # All flows for current level met, move to next
        return handle_next_level(db, indent, tenant_id, site_id, current_user.id)

    return {"message": "Approval recorded", "status": indent.status, "current_level": indent.current_approval_level}

def handle_next_level(db, indent, tenant_id, site_id, user_id=None):
    next_level = indent.current_approval_level + 1
    # Check if there are any flows for ANY higher level
    has_more = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "INDENT",
        ApprovalFlow.level >= next_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= indent.total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= indent.total_amount)
    ).first()

    if has_more:
        indent.current_approval_level = next_level
        db.commit()
        return {"message": f"Moved to level {next_level}", "status": indent.status, "current_level": indent.current_approval_level}
    else:
        indent.status = IndentStatus.APPROVED.value
        indent.approved_by_id = user_id
        indent.approved_at = datetime.utcnow()
        db.commit()
        return {"message": "Fully Approved", "status": indent.status, "current_level": indent.current_approval_level}

@router.get("/{id}/approval-history")
def get_approval_history(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("indents", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Get the complete approval history for an indent, showing per-material quantities at each level."""
    indent = db.query(Indent).filter(
        Indent.id == id, Indent.tenant_id == tenant_id, Indent.site_id == site_id
    ).first()
    if not indent:
        raise HTTPException(404, "Indent not found")

    approvals = db.query(IndentApproval).filter(
        IndentApproval.indent_id == id
    ).order_by(IndentApproval.approved_at.asc()).all()

    entries = []
    for approval in approvals:
        flow = approval.flow
        approver = approval.approver

        items = []
        for item in indent.items:
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
                "requested_quantity": item.requested_quantity,
                "approved_quantity": qty,
                "remarks": item_rem
            })

        # Determine status: if any qty differs from requested, it's "Modified"
        status = "Approved"
        for item in indent.items:
            item_id_str = str(item.id)
            qty_val = (approval.approved_quantities or {}).get(item_id_str)
            qty = qty_val.get("quantity") if isinstance(qty_val, dict) else qty_val
            if qty is not None and qty != item.requested_quantity:
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
        "indent_id": indent.id,
        "indent_number": indent.indent_number,
        "current_approval_level": indent.current_approval_level,
        "entries": entries
    }

class IndentRejectRequest(BaseModel):
    remarks: Optional[str] = None

@router.post("/{id}/reject")
def reject_indent(
    id: int,
    data: IndentRejectRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("indents", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    indent = db.query(Indent).filter(Indent.id == id, Indent.tenant_id == tenant_id, Indent.site_id == site_id).first()
    if not indent:
        raise HTTPException(404, "Indent not found")
        
    indent.status = IndentStatus.REJECTED.value
    if data and data.remarks:
        indent.remarks = (indent.remarks or '') + f'\n[Rejected: {data.remarks}]'
    db.commit()
    return {"message": "Rejected", "status": indent.status}

@router.post("/{id}/acknowledge")
def acknowledge_indent(
    id: int,
    data: IndentAcknowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("indents", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    indent = db.query(Indent).filter(Indent.id == id, Indent.tenant_id == tenant_id, Indent.site_id == site_id).first()
    if not indent:
        raise HTTPException(404, "Indent not found")
        
    # User must be requester
    if indent.requester_id != current_user.id:
        raise HTTPException(403, "Only the requester can acknowledge")

    for ack_item in data.items:
        item = next((i for i in indent.items if i.id == ack_item.indent_item_id), None)
        if item:
            item.acknowledged_quantity += ack_item.acknowledged_quantity
            
    # Check if fully acknowledged (or partially)
    all_ack = all(i.acknowledged_quantity >= i.issued_quantity for i in indent.items if i.issued_quantity > 0)
    has_ack = any(i.acknowledged_quantity > 0 for i in indent.items)
    all_issued = all(i.issued_quantity >= i.requested_quantity for i in indent.items)
    
    if all_ack and all_issued:
        indent.status = IndentStatus.CLOSED.value
    
    db.commit()
    return {"message": "Acknowledged successfully"}

