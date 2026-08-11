"""Work Orders management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import (
    WorkOrder, WorkOrderItem, WorkOrderApproval,
    EquipmentItem, Contract, Project, Vendor, AuditLog, ApprovalFlow, User
)
from app.schemas import (
    WorkOrderCreate, WorkOrderUpdate, WorkOrderFullUpdate, WorkOrderOut, WorkOrderItemOut,
    WorkOrderApproveRequest
)
from app.routers.procurement import RejectBody
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api/procurement/work-orders", tags=["Procurement"])

def handle_wo_next_level(db, wo, tenant_id, site_id, total_amount, user_id=None):
    current_lvl = wo.current_approval_level or 0
    next_level = current_lvl + 1
    has_more = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "WORK_ORDER",
        ApprovalFlow.level >= next_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
    ).order_by(ApprovalFlow.level.asc()).first()

    if has_more:
        wo.current_approval_level = has_more.level
        db.commit()
        return {"message": f"Moved to level {has_more.level}", "status": wo.status, "current_level": wo.current_approval_level}
    else:
        wo.status = "Approved"
        wo.approved_by_id = user_id
        wo.approved_at = datetime.utcnow()
        db.commit()
        return {"message": "Fully Approved", "status": wo.status, "current_level": wo.current_approval_level}


@router.get("")
def list_work_orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("work_orders", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id,
        WorkOrder.is_deleted == False
    )

    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            q = q.filter(WorkOrder.created_by_id == current_user.id)

    if search:
        q = q.filter(WorkOrder.wo_number.ilike(f"%{search}%"))
    if status:
        q = q.filter(WorkOrder.status == status)
    if project_id:
        q = q.filter(WorkOrder.project_id == project_id)
    wos = q.order_by(WorkOrder.created_at.desc()).all()
    
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "WORK_ORDER",
        ApprovalFlow.is_active == True
    ).all()
    user_roles = getattr(current_user, "_roles", [])
    can_override = getattr(current_user, "_is_platform_admin", False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'

    result = []
    for wo in wos:
        items = []
        for item in wo.items:
            mat = item.material
            items.append(WorkOrderItemOut(
                id=item.id, material_id=item.material_id,
                quantity=item.quantity, rate=item.rate,
                amount=item.amount, received_quantity=item.received_quantity,
                approved_quantity=item.approved_quantity,
                discount_percent=item.discount_percent,
                cgst_percentage=item.cgst_percentage,
                sgst_percentage=item.sgst_percentage,
                igst_percentage=item.igst_percentage,
                is_gst_inclusive=item.is_gst_inclusive,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.abbreviation if mat and mat.uom else None,
                uom_allow_decimal=mat.uom.allow_decimal if mat and mat.uom else False
            ))
        
        can_user_approve = False
        if wo.status == "Submitted":
            total_amount = wo.total_amount
            applicable_flows = [
                f for f in flows
                if f.level == (wo.current_approval_level or 1) and
                   f.min_amount <= total_amount and
                   (f.max_amount is None or f.max_amount >= total_amount) and
                   (can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles))
            ]
            can_user_approve = len(applicable_flows) > 0

        result.append(WorkOrderOut(
            id=wo.id, wo_number=wo.wo_number,
            vendor_id=wo.vendor_id, project_id=wo.project_id,
            institution_id=wo.institution_id,
            contract_id=wo.contract_id, equipment_id=wo.equipment_id,
            wo_type=wo.wo_type,
            advance_percentage=wo.advance_percentage,
            total_amount=wo.total_amount,
            target_completion_date=wo.target_completion_date,
            status=wo.status,
            current_approval_level=wo.current_approval_level or 1,
            terms=wo.terms, annexure=wo.annexure, remarks=wo.remarks, created_at=wo.created_at,
            vendor_name=f"{wo.vendor.code} - {wo.vendor.name}" if wo.vendor else None,
            vendor_address=f"{wo.vendor.address_line_1 or ''}{', ' + wo.vendor.address_line_2 if wo.vendor.address_line_2 else ''}" if wo.vendor else None,
            vendor_city=wo.vendor.city if wo.vendor else None,
            vendor_state=(wo.vendor.state.split(' - ', 1)[1] if wo.vendor.state and ' - ' in wo.vendor.state else wo.vendor.state) if wo.vendor else None,
            vendor_pincode=wo.vendor.pincode if wo.vendor else None,
            vendor_gst_number=wo.vendor.gst_number if wo.vendor else None,
            vendor_phone=wo.vendor.phone if wo.vendor else None,
            vendor_email=wo.vendor.email if wo.vendor else None,
            project_name=wo.project.name if wo.project else None,
            institution_name=wo.institution.name if wo.institution else None,
            contract_number=wo.contract.contract_number if wo.contract else None,
            equipment_name=wo.equipment.material.name if wo.equipment and wo.equipment.material else None,
            equipment_code=wo.equipment.equipment_code if wo.equipment else None,
            can_user_approve=can_user_approve,
            items=items
        ))
    return result

@router.get("/{id}")
def get_work_order(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    
    items = []
    for item in wo.items:
        mat = item.material
        items.append(WorkOrderItemOut(
            id=item.id, material_id=item.material_id,
            quantity=item.quantity, rate=item.rate,
            amount=item.amount, received_quantity=item.received_quantity,
            approved_quantity=item.approved_quantity,
            discount_percent=item.discount_percent,
            cgst_percentage=item.cgst_percentage,
            sgst_percentage=item.sgst_percentage,
            igst_percentage=item.igst_percentage,
            is_gst_inclusive=item.is_gst_inclusive,
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            uom_name=mat.uom.abbreviation if mat and mat.uom else None,
            uom_allow_decimal=mat.uom.allow_decimal if mat and mat.uom else False
        ))

    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "WORK_ORDER",
        ApprovalFlow.is_active == True
    ).all()
    user_roles = getattr(current_user, "_roles", [])
    can_override = getattr(current_user, "_is_platform_admin", False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'

    can_user_approve = False
    if wo.status == "Submitted":
        total_amount = wo.total_amount
        applicable_flows = [
            f for f in flows
            if f.level == (wo.current_approval_level or 1) and
               f.min_amount <= total_amount and
               (f.max_amount is None or f.max_amount >= total_amount) and
               (can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles))
        ]
        can_user_approve = len(applicable_flows) > 0

    return WorkOrderOut(
        id=wo.id, wo_number=wo.wo_number,
        vendor_id=wo.vendor_id, project_id=wo.project_id,
        institution_id=wo.institution_id,
        contract_id=wo.contract_id, equipment_id=wo.equipment_id,
        wo_type=wo.wo_type,
        advance_percentage=wo.advance_percentage,
        total_amount=wo.total_amount,
        target_completion_date=wo.target_completion_date,
        status=wo.status,
        current_approval_level=wo.current_approval_level or 1,
        terms=wo.terms, annexure=wo.annexure, remarks=wo.remarks, created_at=wo.created_at,
        vendor_name=f"{wo.vendor.code} - {wo.vendor.name}" if wo.vendor else None,
        vendor_address=f"{wo.vendor.address_line_1 or ''}{', ' + wo.vendor.address_line_2 if wo.vendor.address_line_2 else ''}" if wo.vendor else None,
        vendor_city=wo.vendor.city if wo.vendor else None,
        vendor_state=wo.vendor.state if wo.vendor else None,
        vendor_pincode=wo.vendor.pincode if wo.vendor else None,
        vendor_gst_number=wo.vendor.gst_number if wo.vendor else None,
        vendor_phone=wo.vendor.phone if wo.vendor else None,
        vendor_email=wo.vendor.email if wo.vendor else None,
        project_name=wo.project.name if wo.project else None,
        institution_name=wo.institution.name if wo.institution else None,
        contract_number=wo.contract.contract_number if wo.contract else None,
        equipment_name=wo.equipment.material.name if wo.equipment and wo.equipment.material else None,
        equipment_code=wo.equipment.equipment_code if wo.equipment else None,
        can_user_approve=can_user_approve,
        items=items
    )

@router.post("")
def create_work_order(
    data: WorkOrderCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    total_amount = 0
    for item in data.items:
        net_amt = (item.quantity * item.rate) * (1 - (item.discount_percent or 0) / 100)
        total_gst = (item.cgst_percentage or 0) + (item.sgst_percentage or 0) + (item.igst_percentage or 0)
        if item.is_gst_inclusive and total_gst > 0:
            taxable = net_amt / (1 + (total_gst / 100))
            total_amount += net_amt
        else:
            taxable = net_amt
            total_amount += taxable + (taxable * (total_gst / 100))
            
    wo = WorkOrder(
        wo_number=get_next_number(db, tenant_id, site_id, "WORK_ORDER", "WO"),
        vendor_id=data.vendor_id,
        project_id=data.project_id,
        institution_id=data.institution_id,
        contract_id=data.contract_id,
        equipment_id=data.equipment_id,
        wo_type=data.wo_type,
        advance_percentage=data.advance_percentage,
        total_amount=round(total_amount),
        target_completion_date=data.target_completion_date,
        status=data.status or "Draft",
        terms=data.terms,
        annexure=data.annexure,
        created_by_id=current_user.id,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(wo)
    db.flush()
    for item in data.items:
        net_amt = (item.quantity * item.rate) * (1 - (item.discount_percent or 0) / 100)
        total_gst = (item.cgst_percentage or 0) + (item.sgst_percentage or 0) + (item.igst_percentage or 0)
        if item.is_gst_inclusive and total_gst > 0:
            taxable = net_amt / (1 + (total_gst / 100))
            item_total = net_amt
        else:
            taxable = net_amt
            item_total = taxable + (taxable * (total_gst / 100))
            
        wo_item = WorkOrderItem(
            wo_id=wo.id,
            material_id=item.material_id,
            quantity=item.quantity,
            rate=item.rate,
            amount=round(item_total),
            discount_percent=item.discount_percent,
            cgst_percentage=item.cgst_percentage,
            sgst_percentage=item.sgst_percentage,
            igst_percentage=item.igst_percentage,
            is_gst_inclusive=item.is_gst_inclusive
        )
        db.add(wo_item)
    db.commit()
    db.refresh(wo)
    db.add(AuditLog(tenant_id=tenant_id, site_id=site_id, user_id=current_user.id, action="CREATE", entity_type="WorkOrder", entity_id=wo.id))
    db.commit()
    return {"id": wo.id, "wo_number": wo.wo_number, "message": "Work Order created"}

@router.put("/{id}")
def update_work_order(
    id: int, data: WorkOrderFullUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
        
    if wo.status != 'Draft':
        if data.status and data.status == 'Submitted' and wo.status == 'Draft':
             wo.status = 'Submitted'
        else:
            raise HTTPException(status_code=400, detail="Only draft Work Orders can be edited")

    update_data = data.model_dump(exclude_unset=True)
    if "status" in update_data:
        wo.status = update_data["status"]
    
    for k in ["vendor_id", "project_id", "institution_id", "contract_id", "equipment_id", "wo_type", "advance_percentage", "target_completion_date", "terms", "annexure"]:
        if k in update_data:
            setattr(wo, k, update_data[k])
            
    if "items" in update_data and update_data["items"]:
        db.query(WorkOrderItem).filter(WorkOrderItem.wo_id == id).delete()
        total_amount = 0
        for item in data.items:
            net_amt = (item.quantity * item.rate) * (1 - (item.discount_percent or 0) / 100)
            total_gst = (item.cgst_percentage or 0) + (item.sgst_percentage or 0) + (item.igst_percentage or 0)
            if item.is_gst_inclusive and total_gst > 0:
                taxable = net_amt / (1 + (total_gst / 100))
                item_total = net_amt
            else:
                taxable = net_amt
                item_total = taxable + (taxable * (total_gst / 100))
                
            total_amount += item_total
            
            wo_item = WorkOrderItem(
                wo_id=wo.id,
                material_id=item.material_id,
                quantity=item.quantity,
                rate=item.rate,
                amount=round(item_total),
                discount_percent=item.discount_percent,
                cgst_percentage=item.cgst_percentage,
                sgst_percentage=item.sgst_percentage,
                igst_percentage=item.igst_percentage,
                is_gst_inclusive=item.is_gst_inclusive
            )
            db.add(wo_item)
        wo.total_amount = round(total_amount)
        
    db.commit()
    db.add(AuditLog(tenant_id=tenant_id, site_id=site_id, user_id=current_user.id, action="UPDATE", entity_type="WorkOrder", entity_id=wo.id))
    db.commit()
    return {"message": "Work Order updated successfully"}

@router.post("/{id}/approve")
def approve_work_order(
    id: int, data: Optional[WorkOrderApproveRequest] = None, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")

    if wo.status == 'Draft':
        wo.status = "Submitted"
        db.commit()
        return {"message": "Work Order Submitted", "status": wo.status}

    if wo.status != 'Submitted':
        raise HTTPException(400, "Work Order is not awaiting approval")

    if wo.current_approval_level is None:
        wo.current_approval_level = 1

    total_amount = wo.total_amount

    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "WORK_ORDER",
        ApprovalFlow.level == wo.current_approval_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= total_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)
    ).all()

    if not flows:
        return handle_wo_next_level(db, wo, tenant_id, site_id, total_amount, current_user.id)

    user_roles = getattr(current_user, "_roles", [])
    is_admin = getattr(current_user, "_is_platform_admin", False)
    can_override = is_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'

    applicable_flows = [
        f for f in flows 
        if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)
    ]
    
    if not applicable_flows:
        raise HTTPException(403, f"You do not have permission to approve at level {wo.current_approval_level}")

    new_approvals = 0
    approved_quantities_dict = {}
    if data and data.items:
        for it in data.items:
            approved_quantities_dict[str(it.wo_item_id)] = {
                "quantity": it.approved_quantity,
                "remarks": it.remarks
            }
            db_item = next((i for i in wo.items if i.id == it.wo_item_id), None)
            if db_item:
                db_item.approved_quantity = it.approved_quantity

    for f in applicable_flows:
        existing = db.query(WorkOrderApproval).filter(WorkOrderApproval.wo_id == id, WorkOrderApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(WorkOrderApproval(
                wo_id=id, 
                approval_flow_id=f.id, 
                approver_id=current_user.id,
                approved_quantities=approved_quantities_dict,
                remarks=data.remarks if data else None
            ))
            new_approvals += 1

    if new_approvals == 0:
        raise HTTPException(400, "You have already approved this WO at the current level")

    db.add(AuditLog(tenant_id=tenant_id, site_id=site_id, user_id=current_user.id, action="APPROVE", entity_type="WorkOrder", entity_id=id))
    db.commit()

    if new_approvals > 0:
        return handle_wo_next_level(db, wo, tenant_id, site_id, total_amount, current_user.id)

    return {"message": "Approval recorded", "status": wo.status, "current_level": wo.current_approval_level}

@router.post("/{id}/reject")
def reject_work_order(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    wo.status = "Rejected"
    if body.remarks:
        wo.remarks = (wo.remarks or '') + f'\n[Rejected: {body.remarks}]'
    db.commit()
    return {"message": "Work Order rejected"}

@router.post("/{id}/send")
def send_work_order(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    if wo.status != "Approved":
        raise HTTPException(status_code=400, detail="Only Approved Work Orders can be Sent")
    wo.status = "Sent to Vendor"
    db.commit()
    return {"message": "Work Order Sent to Vendor"}

@router.post("/{id}/short-close")
def short_close_work_order(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    if wo.status not in ["Approved", "Sent to Vendor", "Partially Received"]:
        raise HTTPException(status_code=400, detail="Only Approved, Sent or Partially Received Work Orders can be Short Closed")
    wo.status = "Short Closed"
    if body.remarks:
        wo.remarks = (wo.remarks or '') + f'\n[Short Closed: {body.remarks}]'
    db.commit()
    return {"message": "Work Order Short Closed"}

@router.post("/{id}/cancel")
def cancel_work_order(
    id: int, body: RejectBody = RejectBody(), db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("work_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == id, WorkOrder.tenant_id == tenant_id, WorkOrder.site_id == site_id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work Order not found")
    if wo.status not in ["Draft", "Submitted", "Approved", "Sent to Vendor"]:
        raise HTTPException(status_code=400, detail="Only Draft, Submitted, Approved or Sent Work Orders can be Cancelled")
    wo.status = "Cancelled"
    if body.remarks:
        wo.remarks = (wo.remarks or '') + f'\n[Cancelled: {body.remarks}]'
    db.commit()
    return {"message": "Work Order Cancelled"}
