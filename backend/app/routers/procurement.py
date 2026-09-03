"""Procurement routes: Purchase Requests and Purchase Orders."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import PurchaseRequest, PurchaseRequestItem, PurchaseOrder, PurchaseOrderItem, QuotationRequest, Material, User, Building, Project, Vendor, AuditLog, UOM
from app.schemas import PRCreate, PRUpdate, PRFullUpdate, PROut, POCreate, POUpdate, POOut, POItemOut, POFullUpdate, POApproveRequest
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
router = APIRouter(prefix='/api/procurement', tags=['Procurement'])
ORG_NAME = 'EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER'

def get_lpp(db: Session, material_id: int, tenant_id: int, site_id: int) -> float | None:
    last_po_item = db.query(PurchaseOrderItem).join(PurchaseOrder).filter(PurchaseOrderItem.material_id == material_id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id, PurchaseOrder.status != 'Draft').order_by(PurchaseOrder.created_at.desc()).first()
    return last_po_item.rate if last_po_item else None

class RejectBody(BaseModel):
    remarks: Optional[str] = None

@router.get('/pr')
def list_purchase_requests(search: Optional[str]=None, status: Optional[str]=None, project_id: Optional[int]=None, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    q = db.query(PurchaseRequest).filter(PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id, PurchaseRequest.is_deleted == False)
    is_platform_admin = getattr(current_user, '_is_platform_admin', False)
    if not is_platform_admin:
        scope = getattr(current_user, '_data_access_scope', 'Self Only')
        if scope in ['Full Administrative Access', 'Organization']:
            pass
        elif scope == 'Department':
            if current_user.department:
                q = q.filter(PurchaseRequest.department_name == current_user.department)
            else:
                q = q.filter(PurchaseRequest.requester_id == current_user.id)
        else:
            q = q.filter(PurchaseRequest.requester_id == current_user.id)
    if search:
        q = q.filter(PurchaseRequest.pr_number.ilike(f'%{search}%'))
    if status:
        q = q.filter(PurchaseRequest.status == status)
    if project_id:
        q = q.filter(PurchaseRequest.project_id == project_id)
    prs = q.order_by(PurchaseRequest.created_at.desc()).all()
    from app.models import ApprovalFlow
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_REQUEST', ApprovalFlow.is_active == True).all()
    user_roles = getattr(current_user, '_roles', [])
    is_admin = getattr(current_user, '_is_platform_admin', False)
    can_override = is_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    result = []
    for pr in prs:
        items = []
        for it in pr.items:
            items.append({'id': it.id, 'material_id': it.material_id, 'quantity': it.quantity, 'approved_quantity': it.approved_quantity, 'material_name': it.material.name if it.material else None, 'material_code': it.material.code if it.material else None, 'uom_name': it.material.uom.abbreviation if it.material and it.material.uom else None, 'uom_allow_decimal': it.material.uom.allow_decimal if it.material and it.material.uom else False, 'last_purchase_price': get_lpp(db, it.material_id, tenant_id, site_id)})
        can_user_approve = False
        if pr.status == 'Submitted':
            total_amount = sum((item.quantity * (item.material.standard_cost or 0) for item in pr.items if item.material))
            applicable_flows = [f for f in flows if f.level == pr.current_approval_level and f.min_amount <= total_amount and (f.max_amount is None or f.max_amount >= total_amount) and (can_override or f.user_id == current_user.id or (not f.user_id and f.role_name in user_roles))]
            can_user_approve = len(applicable_flows) > 0
        result.append(PROut(id=pr.id, pr_number=pr.pr_number, required_for_room_id=pr.required_for_room_id, building_id=pr.building_id, department_name=pr.department_name, project_id=pr.project_id, institution_id=pr.institution_id, required_date=pr.required_date, remarks=pr.remarks, requester_id=pr.requester_id, status=pr.status, current_approval_level=pr.current_approval_level or 1, created_at=pr.created_at, updated_at=pr.updated_at, approved_by_id=pr.approved_by_id, approved_at=pr.approved_at, requester_name=pr.requester.full_name if pr.requester else None, room_name=pr.room.name if pr.room else None, project_name=pr.project.name if pr.project else None, institution_name=pr.institution.name if pr.institution else None, building_name=pr.building.name if pr.building else None, items=items, can_user_approve=can_user_approve))
    return result

@router.get('/pr/{id}')
def get_purchase_request(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    items = []
    for it in pr.items:
        items.append({'id': it.id, 'material_id': it.material_id, 'quantity': it.quantity, 'approved_quantity': it.approved_quantity, 'material_name': it.material.name if it.material else None, 'material_code': it.material.code if it.material else None, 'uom_name': it.material.uom.abbreviation if it.material and it.material.uom else None, 'uom_allow_decimal': it.material.uom.allow_decimal if it.material and it.material.uom else False, 'last_purchase_price': get_lpp(db, it.material_id, tenant_id, site_id)})
    return PROut(id=pr.id, pr_number=pr.pr_number, required_for_room_id=pr.required_for_room_id, building_id=pr.building_id, department_name=pr.department_name, project_id=pr.project_id, institution_id=pr.institution_id, required_date=pr.required_date, remarks=pr.remarks, requester_id=pr.requester_id, status=pr.status, current_approval_level=pr.current_approval_level or 1, created_at=pr.created_at, updated_at=pr.updated_at, approved_by_id=pr.approved_by_id, approved_at=pr.approved_at, requester_name=pr.requester.full_name if pr.requester else None, room_name=pr.room.name if pr.room else None, project_name=pr.project.name if pr.project else None, institution_name=pr.institution.name if pr.institution else None, building_name=pr.building.name if pr.building else None, items=items)

@router.post('/pr')
def create_purchase_request(data: PRCreate, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'create')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = PurchaseRequest(pr_number=get_next_number(db, tenant_id, site_id, 'PURCHASE_REQUEST', 'PR'), requester_id=current_user.id, project_id=data.project_id, institution_id=data.institution_id, required_for_room_id=data.required_for_room_id, building_id=data.building_id, department_name=data.department_name, required_date=data.required_date, remarks=data.remarks, procurement_type=data.procurement_type, rental_type=data.rental_type, rental_duration=data.rental_duration, rental_duration_unit=data.rental_duration_unit, estimated_rental_cost=data.estimated_rental_cost, cost_per_test=data.cost_per_test, reagent_rental_required=data.reagent_rental_required, justification=data.justification, status=data.status or 'Draft', tenant_id=tenant_id, site_id=site_id)
    db.add(pr)
    db.flush()
    for item in data.items:
        pr_item = PurchaseRequestItem(pr_id=pr.id, material_id=item.material_id, quantity=item.quantity)
        db.add(pr_item)
    db.commit()
    db.refresh(pr)
    return {'id': pr.id, 'pr_number': pr.pr_number, 'message': 'Purchase Request created'}

@router.put('/pr/{id}')
def update_purchase_request(id: int, data: PRUpdate, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    update_data = data.model_dump(exclude_unset=True)
    if 'status' in update_data:
        if update_data['status'] == 'Approved':
            pr.approved_by_id = current_user.id
            pr.approved_at = datetime.utcnow()
    for k, v in update_data.items():
        setattr(pr, k, v)
    db.commit()
    return {'message': 'PR updated successfully'}

@router.put('/pr/{id}/full')
def full_update_purchase_request(id: int, data: PRFullUpdate, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    if pr.status != 'Draft':
        raise HTTPException(status_code=400, detail='Only draft PRs can be edited')
    update_data = data.model_dump(exclude_unset=True)
    if 'status' in update_data:
        pr.status = update_data['status']
    for k in ['project_id', 'institution_id', 'required_date', 'priority', 'remarks', 'required_for_room_id', 'building_id', 'department_name']:
        if k in update_data:
            setattr(pr, k, update_data[k])
    if 'items' in update_data:
        db.query(PurchaseRequestItem).filter(PurchaseRequestItem.pr_id == id).delete()
        for item in data.items:
            pr_item = PurchaseRequestItem(pr_id=pr.id, material_id=item.material_id, quantity=item.quantity)
            db.add(pr_item)
    db.commit()
    return {'message': 'PR full update successful'}
from app.models import ApprovalFlow, PurchaseRequestApproval, PurchaseOrderApproval
from app.schemas import PRApproveRequest
from typing import Optional

@router.post('/pr/{id}/approve')
def approve_pr(id: int, data: Optional[PRApproveRequest]=None, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    if pr.status == 'Draft':
        pr.status = 'Submitted'
        db.commit()
        return {'message': 'PR Submitted', 'status': pr.status}
    if pr.status != 'Submitted':
        raise HTTPException(400, 'PR is not awaiting approval')
    if pr.current_approval_level is None:
        pr.current_approval_level = 1
    total_amount = 0
    for item in pr.items:
        if item.material and item.material.standard_cost:
            total_amount += item.quantity * item.material.standard_cost
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_REQUEST', ApprovalFlow.level == pr.current_approval_level, ApprovalFlow.is_active == True, ApprovalFlow.min_amount <= total_amount, (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)).all()
    if not flows:
        return handle_pr_next_level(db, pr, tenant_id, site_id, total_amount, current_user.id)
    user_roles = getattr(current_user, '_roles', [])
    is_admin = getattr(current_user, '_is_platform_admin', False)
    perms = getattr(current_user, '_permissions', {})
    can_override = is_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    applicable_flows = [f for f in flows if can_override or f.user_id == current_user.id or (not f.user_id and f.role_name in user_roles)]
    if not applicable_flows:
        raise HTTPException(403, f'You do not have permission to approve at level {pr.current_approval_level}')
    new_approvals = 0
    approved_quantities_dict = {}
    if data and data.items:
        for it in data.items:
            approved_quantities_dict[str(it.pr_item_id)] = {'quantity': it.approved_quantity, 'remarks': it.remarks}
            db_item = next((i for i in pr.items if i.id == it.pr_item_id), None)
            if db_item:
                if db_item.material and db_item.material.uom and (not db_item.material.uom.allow_decimal):
                    if not float(it.approved_quantity).is_integer():
                        raise HTTPException(400, f'Decimal values are not allowed for material {db_item.material.name}')
                db_item.approved_quantity = it.approved_quantity
    for f in applicable_flows:
        existing = db.query(PurchaseRequestApproval).filter(PurchaseRequestApproval.pr_id == id, PurchaseRequestApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(PurchaseRequestApproval(pr_id=id, approval_flow_id=f.id, approver_id=current_user.id, approved_quantities=approved_quantities_dict, remarks=data.remarks if data else None))
            new_approvals += 1
    if new_approvals == 0:
        raise HTTPException(400, 'You have already approved this PR at the current level')
    db.commit()
    if new_approvals > 0:
        return handle_pr_next_level(db, pr, tenant_id, site_id, total_amount, current_user.id)
    return {'message': 'Approval recorded', 'status': pr.status, 'current_level': pr.current_approval_level}

def handle_pr_next_level(db, pr, tenant_id, site_id, total_amount, user_id=None):
    next_level = pr.current_approval_level + 1
    has_more = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_REQUEST', ApprovalFlow.level >= next_level, ApprovalFlow.is_active == True, ApprovalFlow.min_amount <= total_amount, (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)).order_by(ApprovalFlow.level.asc()).first()
    if has_more:
        pr.current_approval_level = has_more.level
        db.commit()
        return {'message': f'Moved to level {has_more.level}', 'status': pr.status, 'current_level': pr.current_approval_level}
    else:
        pr.status = 'Approved'
        pr.approved_by_id = user_id
        pr.approved_at = datetime.utcnow()
        db.commit()
        return {'message': 'Fully Approved', 'status': pr.status, 'current_level': pr.current_approval_level}

def handle_po_next_level(db, po, tenant_id, site_id, total_amount, user_id=None):
    current_lvl = po.current_approval_level or 0
    next_level = current_lvl + 1
    has_more = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_ORDER', ApprovalFlow.level >= next_level, ApprovalFlow.is_active == True, ApprovalFlow.min_amount <= total_amount, (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)).order_by(ApprovalFlow.level.asc()).first()
    if has_more:
        po.current_approval_level = has_more.level
        db.commit()
        return {'message': f'Moved to level {has_more.level}', 'status': po.status, 'current_level': po.current_approval_level}
    else:
        po.status = 'Approved'
        po.approved_by_id = user_id
        po.approved_at = datetime.utcnow()
        db.commit()
        return {'message': 'Fully Approved', 'status': po.status, 'current_level': po.current_approval_level}

@router.get('/pr/{id}/approval-history')
def get_pr_approval_history(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    approvals = db.query(PurchaseRequestApproval).filter(PurchaseRequestApproval.pr_id == id).order_by(PurchaseRequestApproval.approved_at.asc()).all()
    entries = []
    for approval in approvals:
        flow = approval.flow
        approver = approval.approver
        items = []
        for item in pr.items:
            item_id_str = str(item.id)
            qty_val = (approval.approved_quantities or {}).get(item_id_str)
            if isinstance(qty_val, dict):
                qty = qty_val.get('quantity')
                item_rem = qty_val.get('remarks')
            else:
                qty = qty_val
                item_rem = None
            items.append({'material_id': item.material_id, 'material_name': item.material.name if item.material else None, 'material_code': item.material.code if item.material else None, 'uom_name': item.material.uom.abbreviation if item.material and item.material.uom else None, 'requested_quantity': item.quantity, 'approved_quantity': qty, 'remarks': item_rem})
        status = approval.status or 'Approved'
        if status == 'Approved':
            for item in pr.items:
                item_id_str = str(item.id)
                qty_val = (approval.approved_quantities or {}).get(item_id_str)
                qty = qty_val.get('quantity') if isinstance(qty_val, dict) else qty_val
                if qty is not None and qty != item.quantity:
                    status = 'Modified'
                    break
        entries.append({'level': flow.level if flow else 0, 'approver_name': approver.full_name if approver else 'Unknown', 'role_name': flow.role_name if flow else 'Unknown', 'approved_at': approval.approved_at, 'remarks': approval.remarks, 'status': status, 'items': items})
    deduped = {}
    for entry in entries:
        level = entry['level']
        if level not in deduped:
            deduped[level] = entry
        else:
            deduped[level] = entry
    deduped_entries = list(deduped.values())
    return {'pr_id': pr.id, 'pr_number': pr.pr_number, 'current_approval_level': pr.current_approval_level, 'entries': deduped_entries}

@router.post('/pr/{id}/reject')
def reject_pr(id: int, body: RejectBody=RejectBody(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
        
    total_amount = 0
    for item in pr.items:
        if item.material and item.material.standard_cost:
            total_amount += item.quantity * item.material.standard_cost
            
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_REQUEST', ApprovalFlow.level == pr.current_approval_level, ApprovalFlow.is_active == True, ApprovalFlow.min_amount <= total_amount, (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)).all()
    flow_id = None
    if flows:
        user_roles = getattr(current_user, '_roles', [])
        is_admin = getattr(current_user, '_is_platform_admin', False)
        can_override = is_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
        applicable_flows = [f for f in flows if can_override or f.user_id == current_user.id or (not f.user_id and f.role_name in user_roles)]
        if applicable_flows:
            flow_id = applicable_flows[0].id

    db.add(PurchaseRequestApproval(
        pr_id=id, 
        approval_flow_id=flow_id, 
        approver_id=current_user.id, 
        approved_quantities={}, 
        status="Rejected",
        remarks=body.remarks
    ))
    
    pr.status = 'Rejected'
    db.commit()
    return {'message': 'PR rejected'}

@router.post('/pr/{id}/hold')
def hold_pr(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    pr.status = 'On Hold'
    db.commit()
    return {'message': 'PR placed on hold'}

@router.post('/pr/{id}/short-close')
def short_close_pr(id: int, body: RejectBody=RejectBody(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    if pr.status != 'Approved':
        raise HTTPException(status_code=400, detail='Only Approved PRs can be Short Closed')
    pr.status = 'Short Closed'
    if body.remarks:
        pr.remarks = (pr.remarks or '') + f'\n[Short Closed: {body.remarks}]'
    db.commit()
    return {'message': 'PR Short Closed'}

@router.post('/pr/{id}/cancel')
def cancel_pr(id: int, body: RejectBody=RejectBody(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_requests', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail='PR not found')
    if pr.status not in ['Draft', 'Submitted']:
        raise HTTPException(status_code=400, detail='Only Draft or Submitted PRs can be Cancelled')
    pr.status = 'Cancelled'
    if body.remarks:
        pr.remarks = (pr.remarks or '') + f'\n[Cancelled: {body.remarks}]'
    db.commit()
    return {'message': 'PR Cancelled'}

@router.get('/po')
def list_purchase_orders(search: Optional[str]=None, status: Optional[str]=None, project_id: Optional[int]=None, qr_id: Optional[int]=None, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    q = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id, PurchaseOrder.is_deleted == False)
    is_platform_admin = getattr(current_user, '_is_platform_admin', False)
    if not is_platform_admin:
        scope = getattr(current_user, '_data_access_scope', 'Self Only')
        if scope in ['Full Administrative Access', 'Organization']:
            pass
        else:
            q = q.filter(PurchaseOrder.created_by_id == current_user.id)
    if search:
        q = q.filter(PurchaseOrder.po_number.ilike(f'%{search}%'))
    if status:
        q = q.filter(PurchaseOrder.status == status)
    if project_id:
        q = q.filter(PurchaseOrder.project_id == project_id)
    if qr_id:
        q = q.filter(PurchaseOrder.qr_id == qr_id)
    pos = q.order_by(PurchaseOrder.created_at.desc()).all()
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_ORDER', ApprovalFlow.is_active == True).all()
    user_roles = getattr(current_user, '_roles', [])
    can_override = getattr(current_user, '_is_platform_admin', False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    result = []
    for po in pos:
        items = []
        for item in po.items:
            mat = item.material
            items.append(POItemOut(id=item.id, material_id=item.material_id, quantity=item.quantity, rate=item.rate, amount=item.amount, received_quantity=item.received_quantity, approved_quantity=item.approved_quantity, discount_percent=item.discount_percent, cgst_percentage=item.cgst_percentage, sgst_percentage=item.sgst_percentage, igst_percentage=item.igst_percentage, is_gst_inclusive=item.is_gst_inclusive, material_name=mat.name if mat else None, material_code=mat.code if mat else None, uom_name=mat.uom.abbreviation if mat and mat.uom else None, uom_allow_decimal=mat.uom.allow_decimal if mat and mat.uom else False))
        pr_number = None
        if po.pr_id:
            pr_number = po.purchase_request.pr_number if po.purchase_request else None
        elif po.qr_id:
            pr_nums = [pr.purchase_request.pr_number for pr in po.quotation_request.linked_prs if pr.purchase_request]
            if pr_nums:
                pr_number = ', '.join(pr_nums)
        indent_number = None
        if po.indent_id:
            indent_number = po.indent.indent_number if po.indent else None
        elif po.qr_id:
            pass
        qr_number = po.quotation_request.qr_number if po.quotation_request else None
        can_user_approve = False
        if po.status == 'Submitted':
            total_amount = po.total_amount
            applicable_flows = [f for f in flows if f.level == (po.current_approval_level or 1) and f.min_amount <= total_amount and (f.max_amount is None or f.max_amount >= total_amount) and (can_override or f.user_id == current_user.id or (not f.user_id and f.role_name in user_roles))]
            can_user_approve = len(applicable_flows) > 0
        result.append(POOut(id=po.id, po_number=po.po_number, vendor_id=po.vendor_id, project_id=po.project_id, pr_id=po.pr_id, pr_number=pr_number, indent_id=po.indent_id, indent_number=indent_number, qr_id=po.qr_id, qr_number=qr_number, po_type=po.po_type, purchase_mode=po.purchase_mode, marketplace_name=po.marketplace_name, advance_percentage=po.advance_percentage, procurement_type=po.procurement_type or 'Purchase', rental_type=po.rental_type, rental_agreement_number=po.rental_agreement_number, rental_agreement_document=po.rental_agreement_document, rental_start_date=po.rental_start_date, rental_end_date=po.rental_end_date, billing_frequency=po.billing_frequency, security_deposit=po.security_deposit or 0, cost_per_test=po.cost_per_test, linked_reagent_agreement=po.linked_reagent_agreement, vendor_maintenance_responsibility=po.vendor_maintenance_responsibility or False, return_conditions=po.return_conditions, renewal_terms=po.renewal_terms, total_amount=po.total_amount, delivery_date=po.delivery_date, status=po.status, current_approval_level=po.current_approval_level or 1, terms=po.terms, annexure=po.annexure, remarks=po.remarks, created_at=po.created_at, vendor_name=f'{po.vendor.code} - {po.vendor.name}' if po.vendor else None, vendor_address=((po.vendor.address_line_1 or '') + (', ' + po.vendor.address_line_2 if po.vendor.address_line_2 else '')) if po.vendor else None, vendor_city=po.vendor.city if po.vendor else None, vendor_state=(po.vendor.state.split(' - ', 1)[1] if po.vendor.state and ' - ' in po.vendor.state else po.vendor.state) if po.vendor else None, vendor_pincode=po.vendor.pincode if po.vendor else None, vendor_gst_number=po.vendor.gst_number if po.vendor else None, project_name=po.project.name if po.project else None, institution_id=po.institution_id, institution_name=po.institution.name if po.institution else None, can_user_approve=can_user_approve, items=items))
    return result

@router.get('/po/{id}')
def get_purchase_order(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    items = []
    for item in po.items:
        mat = item.material
        items.append(POItemOut(id=item.id, material_id=item.material_id, quantity=item.quantity, rate=item.rate, amount=item.amount, received_quantity=item.received_quantity, approved_quantity=item.approved_quantity, discount_percent=item.discount_percent, cgst_percentage=item.cgst_percentage, sgst_percentage=item.sgst_percentage, igst_percentage=item.igst_percentage, is_gst_inclusive=item.is_gst_inclusive, material_name=mat.name if mat else None, material_code=mat.code if mat else None, uom_name=mat.uom.abbreviation if mat and mat.uom else None, uom_allow_decimal=mat.uom.allow_decimal if mat and mat.uom else False))
    pr_number = None
    if po.pr_id:
        pr_number = po.purchase_request.pr_number if po.purchase_request else None
    elif po.qr_id:
        pr_nums = [pr.purchase_request.pr_number for pr in po.quotation_request.linked_prs if pr.purchase_request]
        if pr_nums:
            pr_number = ', '.join(pr_nums)
    indent_number = po.indent.indent_number if po.indent else None
    qr_number = po.quotation_request.qr_number if po.quotation_request else None
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_ORDER', ApprovalFlow.is_active == True).all()
    user_roles = getattr(current_user, '_roles', [])
    can_override = getattr(current_user, '_is_platform_admin', False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    can_user_approve = False
    if po.status == 'Submitted':
        total_amount = po.total_amount
        applicable_flows = [f for f in flows if f.level == (po.current_approval_level or 1) and f.min_amount <= total_amount and (f.max_amount is None or f.max_amount >= total_amount) and (can_override or f.user_id == current_user.id or (not f.user_id and f.role_name in user_roles))]
        can_user_approve = len(applicable_flows) > 0
    return POOut(id=po.id, po_number=po.po_number, vendor_id=po.vendor_id, project_id=po.project_id, pr_id=po.pr_id, pr_number=pr_number, indent_id=po.indent_id, indent_number=indent_number, qr_id=po.qr_id, qr_number=qr_number, po_type=po.po_type, purchase_mode=po.purchase_mode, marketplace_name=po.marketplace_name, advance_percentage=po.advance_percentage, procurement_type=po.procurement_type or 'Purchase', rental_type=po.rental_type, rental_agreement_number=po.rental_agreement_number, rental_agreement_document=po.rental_agreement_document, rental_start_date=po.rental_start_date, rental_end_date=po.rental_end_date, billing_frequency=po.billing_frequency, security_deposit=po.security_deposit or 0, cost_per_test=po.cost_per_test, linked_reagent_agreement=po.linked_reagent_agreement, vendor_maintenance_responsibility=po.vendor_maintenance_responsibility or False, return_conditions=po.return_conditions, renewal_terms=po.renewal_terms, total_amount=po.total_amount, delivery_date=po.delivery_date, status=po.status, current_approval_level=po.current_approval_level or 1, terms=po.terms, annexure=po.annexure, remarks=po.remarks, created_at=po.created_at, vendor_name=f'{po.vendor.code} - {po.vendor.name}' if po.vendor else None, vendor_address=((po.vendor.address_line_1 or '') + (', ' + po.vendor.address_line_2 if po.vendor.address_line_2 else '')) if po.vendor else None, vendor_city=po.vendor.city if po.vendor else None, vendor_state=(po.vendor.state.split(' - ', 1)[1] if po.vendor.state and ' - ' in po.vendor.state else po.vendor.state) if po.vendor else None, vendor_pincode=po.vendor.pincode if po.vendor else None, vendor_gst_number=po.vendor.gst_number if po.vendor else None, project_name=po.project.name if po.project else None, institution_id=po.institution_id, institution_name=po.institution.name if po.institution else None, can_user_approve=can_user_approve, items=items)

@router.post('/po')
def create_purchase_order(data: POCreate, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'create')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    if not data.institution_id:
        raise HTTPException(status_code=400, detail='Institution is required to create a PO')
    from app.models import Institution
    inst = db.query(Institution).filter(Institution.id == data.institution_id, Institution.tenant_id == tenant_id, Institution.site_id == site_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail='Institution not found')
    acronym = inst.name.split(' (')[0].strip()
    prefix = f'{acronym}/PO'
    doc_type = f'PURCHASE_ORDER_{data.institution_id}'
    actual_status = data.status or 'Draft'
    po = PurchaseOrder(po_number=get_next_number(db, tenant_id, site_id, doc_type, prefix), vendor_id=data.vendor_id, project_id=data.project_id, institution_id=data.institution_id, pr_id=data.pr_id, indent_id=data.indent_id, qr_id=data.qr_id, contract_id=data.contract_id, po_type=data.po_type or ('Formal' if data.pr_id or data.indent_id or data.qr_id else 'Informal'), purchase_mode=data.purchase_mode, marketplace_name=data.marketplace_name, advance_percentage=data.advance_percentage, delivery_date=data.delivery_date, procurement_type=data.procurement_type, rental_type=data.rental_type, rental_agreement_number=data.rental_agreement_number, rental_start_date=data.rental_start_date, rental_end_date=data.rental_end_date, billing_frequency=data.billing_frequency, security_deposit=data.security_deposit, cost_per_test=data.cost_per_test, linked_reagent_agreement=data.linked_reagent_agreement, vendor_maintenance_responsibility=data.vendor_maintenance_responsibility, return_conditions=data.return_conditions, renewal_terms=data.renewal_terms, status=actual_status, terms=data.terms, annexure=data.annexure, created_by_id=current_user.id, total_amount=0, tenant_id=tenant_id, site_id=site_id)
    db.add(po)
    db.flush()
    total = 0
    contract = None
    if data.contract_id:
        from app.models import Contract
        contract = db.query(Contract).filter(Contract.id == data.contract_id).first()
    for item_data in data.items:
        rate = item_data.rate
        if contract:
            c_item = next((i for i in contract.items if i.material_id == item_data.material_id), None)
            if not c_item:
                raise HTTPException(status_code=400, detail=f'Material {item_data.material_id} not covered in contract')
            rate = c_item.rate
        gross_amt = round(item_data.quantity * rate, 2)
        disc_amt = round(gross_amt * (item_data.discount_percent / 100), 2)
        net_amt = gross_amt - disc_amt
        total_gst_pct = item_data.cgst_percentage + item_data.sgst_percentage + item_data.igst_percentage
        if item_data.is_gst_inclusive and total_gst_pct > 0:
            item_total = net_amt
        else:
            tax_amt = round(net_amt * (total_gst_pct / 100), 2)
            item_total = net_amt + tax_amt
        total += item_total
        po_item = PurchaseOrderItem(po_id=po.id, material_id=item_data.material_id, quantity=item_data.quantity, rate=rate, amount=gross_amt, discount_percent=item_data.discount_percent, cgst_percentage=item_data.cgst_percentage, sgst_percentage=item_data.sgst_percentage, igst_percentage=item_data.igst_percentage, is_gst_inclusive=item_data.is_gst_inclusive)
        db.add(po_item)
    po.total_amount = round(total, 2)
    if data.pr_id:
        pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == data.pr_id, PurchaseRequest.tenant_id == tenant_id, PurchaseRequest.site_id == site_id).first()
        if pr:
            pr.status = 'Converted to PO'
    from app.models import Indent, IndentStatus
    if data.indent_id:
        indent = db.query(Indent).filter(Indent.id == data.indent_id, Indent.tenant_id == tenant_id, Indent.site_id == site_id).first()
        if indent:
            indent.status = IndentStatus.CONVERTED.value
    db.commit()
    db.refresh(po)
    res = {'id': po.id, 'po_number': po.po_number, 'message': 'Purchase Order created'}
    if po.status == 'Submitted':
        po.current_approval_level = 0
        flow_res = handle_po_next_level(db, po, tenant_id, site_id, po.total_amount, current_user.id)
        res.update(flow_res)
    return res

@router.put('/po/{id}')
def update_purchase_order(id: int, data: POFullUpdate, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    if po.status != 'Draft':
        raise HTTPException(status_code=400, detail='Only draft POs can be edited')
    update_data = data.model_dump(exclude_unset=True)
    if 'status' in update_data:
        po.status = update_data['status']
    po_update_keys = ['vendor_id', 'project_id', 'institution_id', 'delivery_date', 'po_type', 'terms', 'annexure', 'purchase_mode', 'marketplace_name', 'advance_percentage', 'contract_id', 'procurement_type', 'rental_type', 'rental_agreement_number', 'rental_start_date', 'rental_end_date', 'billing_frequency', 'security_deposit', 'cost_per_test', 'linked_reagent_agreement', 'vendor_maintenance_responsibility', 'return_conditions', 'renewal_terms']
    for k in po_update_keys:
        if k in update_data:
            setattr(po, k, update_data[k])
    if 'items' in update_data:
        db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == id).delete()
        total = 0
        contract = None
        if po.contract_id:
            from app.models import Contract
            contract = db.query(Contract).filter(Contract.id == po.contract_id).first()
        for item_data in data.items:
            rate = item_data.rate
            if contract:
                c_item = next((i for i in contract.items if i.material_id == item_data.material_id), None)
                if not c_item:
                    raise HTTPException(status_code=400, detail=f'Material {item_data.material_id} not covered in contract')
                rate = c_item.rate
            gross_amt = round(item_data.quantity * rate, 2)
            disc_amt = round(gross_amt * (item_data.discount_percent / 100), 2)
            net_amt = gross_amt - disc_amt
            total_gst_pct = item_data.cgst_percentage + item_data.sgst_percentage + item_data.igst_percentage
            if item_data.is_gst_inclusive and total_gst_pct > 0:
                item_total = net_amt
            else:
                tax_amt = round(net_amt * (total_gst_pct / 100), 2)
                item_total = net_amt + tax_amt
            total += item_total
            po_item = PurchaseOrderItem(po_id=po.id, material_id=item_data.material_id, quantity=item_data.quantity, rate=rate, amount=gross_amt, discount_percent=item_data.discount_percent, cgst_percentage=item_data.cgst_percentage, sgst_percentage=item_data.sgst_percentage, igst_percentage=item_data.igst_percentage, is_gst_inclusive=item_data.is_gst_inclusive)
            db.add(po_item)
        po.total_amount = round(total, 2)
    db.commit()
    if po.status == 'Submitted':
        po.current_approval_level = 0
        return handle_po_next_level(db, po, tenant_id, site_id, po.total_amount, current_user.id)
    return {'message': 'PO updated successfully'}

@router.post('/po/{id}/approve')
def approve_po(id: int, data: Optional[POApproveRequest]=None, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    if po.status == 'Draft':
        po.status = 'Submitted'
        db.commit()
        return {'message': 'PO Submitted', 'status': po.status}
    if po.status != 'Submitted':
        raise HTTPException(400, 'PO is not awaiting approval')
    if po.current_approval_level is None:
        po.current_approval_level = 1
    total_amount = po.total_amount
    flows = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id, ApprovalFlow.document_type == 'PURCHASE_ORDER', ApprovalFlow.level == po.current_approval_level, ApprovalFlow.is_active == True, ApprovalFlow.min_amount <= total_amount, (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= total_amount)).all()
    if not flows:
        return handle_po_next_level(db, po, tenant_id, site_id, total_amount, current_user.id)
    user_roles = getattr(current_user, '_roles', [])
    is_admin = getattr(current_user, '_is_platform_admin', False)
    perms = getattr(current_user, '_permissions', {})
    can_override = is_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    applicable_flows = [f for f in flows if can_override or f.user_id == current_user.id or (not f.user_id and f.role_name in user_roles)]
    if not applicable_flows:
        raise HTTPException(403, f'You do not have permission to approve at level {po.current_approval_level}')
    new_approvals = 0
    approved_quantities_dict = {}
    if data and data.items:
        for it in data.items:
            approved_quantities_dict[str(it.po_item_id)] = {'quantity': it.approved_quantity, 'remarks': it.remarks}
            db_item = next((i for i in po.items if i.id == it.po_item_id), None)
            if db_item:
                if db_item.material and db_item.material.uom and (not db_item.material.uom.allow_decimal):
                    if not float(it.approved_quantity).is_integer():
                        raise HTTPException(400, f'Decimal values are not allowed for material {db_item.material.name}')
                db_item.approved_quantity = it.approved_quantity
    for f in applicable_flows:
        existing = db.query(PurchaseOrderApproval).filter(PurchaseOrderApproval.po_id == id, PurchaseOrderApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(PurchaseOrderApproval(po_id=id, approval_flow_id=f.id, approver_id=current_user.id, approved_quantities=approved_quantities_dict, remarks=data.remarks if data else None))
            new_approvals += 1
    if new_approvals == 0:
        raise HTTPException(400, 'You have already approved this PO at the current level')
    db.commit()
    if new_approvals > 0:
        return handle_po_next_level(db, po, tenant_id, site_id, total_amount, current_user.id)
    return {'message': 'Approval recorded', 'status': po.status, 'current_level': po.current_approval_level}

@router.get('/po/{id}/approval-history')
def get_po_approval_history(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    approvals = db.query(PurchaseOrderApproval).filter(PurchaseOrderApproval.po_id == id).order_by(PurchaseOrderApproval.approved_at.asc()).all()
    entries = []
    latest_approved_quantities = {}
    for approval in approvals:
        flow = approval.flow
        approver = approval.approver
        if approval.approved_quantities:
            for it_id, it_data in approval.approved_quantities.items():
                if isinstance(it_data, dict):
                    latest_approved_quantities[it_id] = it_data.get('quantity')
                else:
                    latest_approved_quantities[it_id] = it_data
        items = []
        for item in po.items:
            item_id_str = str(item.id)
            qty_val = (approval.approved_quantities or {}).get(item_id_str)
            if isinstance(qty_val, dict):
                qty = qty_val.get('quantity')
                item_rem = qty_val.get('remarks')
            else:
                qty = qty_val
                item_rem = None
            items.append({'material_id': item.material_id, 'material_name': item.material.name if item.material else None, 'material_code': item.material.code if item.material else None, 'uom_name': item.material.uom.abbreviation if item.material and item.material.uom else None, 'requested_quantity': item.quantity, 'approved_quantity': qty, 'remarks': item_rem})
        status = 'Approved'
        entries.append({'level': flow.level if flow else 0, 'approver_name': approver.full_name if approver else 'Unknown', 'role_name': flow.role_name if flow else 'Unknown', 'approved_at': approval.approved_at, 'remarks': approval.remarks, 'status': status, 'items': items})
    deduped = {}
    for entry in entries:
        level = entry['level']
        if level not in deduped:
            deduped[level] = entry
        else:
            deduped[level] = entry
    deduped_entries = list(deduped.values())
    if po.status == 'Rejected':
        rejection_log = db.query(AuditLog).filter(AuditLog.entity_type == 'PurchaseOrder', AuditLog.entity_id == id, AuditLog.action == 'REJECT').order_by(AuditLog.created_at.desc()).first()
        rej_items = []
        for item in po.items:
            rej_items.append({'material_id': item.material_id, 'material_name': item.material.name if item.material else None, 'material_code': item.material.code if item.material else None, 'uom_name': item.material.uom.abbreviation if item.material and item.material.uom else None, 'requested_quantity': item.quantity, 'approved_quantity': None, 'remarks': None})
        deduped_entries.append({'level': po.current_approval_level or 0, 'approver_name': rejection_log.user.full_name if rejection_log and rejection_log.user else 'Unknown', 'role_name': 'Rejector', 'approved_at': rejection_log.created_at if rejection_log else po.updated_at, 'remarks': po.remarks, 'status': 'Rejected', 'items': rej_items})
    return {'po_id': po.id, 'po_number': po.po_number, 'current_approval_level': po.current_approval_level, 'entries': deduped_entries}

@router.post('/po/{id}/reject')
def reject_po(id: int, body: RejectBody=RejectBody(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    po.status = 'Rejected'
    if body.remarks:
        po.remarks = (po.remarks or '') + f'\n[Rejected: {body.remarks}]'
    db.commit()
    return {'message': 'PO rejected successfully'}

@router.post('/po/{id}/hold')
def hold_po(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    po.status = 'On Hold'
    db.commit()
    return {'message': 'PO placed on hold successfully'}

def _build_po_email_template(po):
    """Build subject + html_body for a PO email. Reused by preview and send."""
    subject = f'Purchase Order {po.po_number} — {ORG_NAME}'
    html_body = f'\n    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">\n        <h2 style="color: #2563EB;">Purchase Order — {po.po_number}</h2>\n        <p>Dear Sir/Madam,</p>\n        <p>\n            Please find attached the Purchase Order <strong>{po.po_number}</strong>\n            dated <strong>{(po.created_at.strftime("%d-%b-%Y") if po.created_at else "-")}</strong>.\n        </p>\n        <p>\n            Kindly acknowledge receipt of this order and confirm the delivery schedule\n            at the earliest.\n        </p>\n        <table style="margin: 16px 0; border-collapse: collapse; font-size: 13px;">\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">PO Number</td>\n                <td style="padding: 4px 0;">{po.po_number}</td>\n            </tr>\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">Delivery Date</td>\n                <td style="padding: 4px 0;">{(po.delivery_date.strftime("%d-%b-%Y") if po.delivery_date else "As per PO")}</td>\n            </tr>\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">Total Amount</td>\n                <td style="padding: 4px 0;">₹ {po.total_amount:,.2f}</td>\n            </tr>\n        </table>\n        <p>Please expedite the supplies accordingly.</p>\n        <br/>\n        <p>Regards,</p>\n        <p><strong>{ORG_NAME}</strong></p>\n        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;"/>\n        <p style="font-size: 11px; color: #94a3b8;">\n            This is a system-generated email from Eastpoint Smart Campus | Powered by NissiGrid Technologies.\n            Please do not reply to this email.\n        </p>\n    </div>\n    '
    return (subject, html_body)

def _build_po_short_close_email_template(po, remarks, closed_by_user):
    """Build subject + html_body for a PO short-close notification email."""
    subject = f'Notification: Purchase Order {po.po_number} Short Closed'
    vendor_name = f'{po.vendor.code} - {po.vendor.name}' if po.vendor else 'Unknown Vendor'
    if getattr(po, 'advance_percentage', 0) > 0:
        advance_msg = 'An advance payment has been made against the above Purchase Order. Please review the advance payment details and take the necessary action regarding the payment/adjustment.'
    else:
        advance_msg = 'Please review the Purchase Order and take any necessary action, if required.'
    html_body = f'\n    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">\n        <p>Hello,</p>\n        <p>\n            Please be informed that the following Purchase Order has been Short Closed by {closed_by_user.full_name}.\n        </p>\n        <table style="margin: 16px 0; border-collapse: collapse; font-size: 13px;">\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">PO Number</td>\n                <td style="padding: 4px 0;">{po.po_number}</td>\n            </tr>\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">Vendor</td>\n                <td style="padding: 4px 0;">{vendor_name}</td>\n            </tr>\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">Total Amount</td>\n                <td style="padding: 4px 0;">₹{po.total_amount:,.2f}</td>\n            </tr>\n            <tr>\n                <td style="padding: 4px 12px 4px 0; font-weight: bold;">Remarks</td>\n                <td style="padding: 4px 0;">{remarks or "N/A"}</td>\n            </tr>\n        </table>\n        <p>{advance_msg}</p>\n        <br/>\n        <p>Regards,<br/>{closed_by_user.full_name}</p>\n        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;"/>\n        <p style="font-size: 11px; color: #94a3b8;">\n            This is a system-generated email from Eastpoint Smart Campus | Powered by NissiGrid Technologies.\n            Please do not reply to this email.\n        </p>\n    </div>\n    '
    return (subject, html_body)

@router.get('/po/{id}/email-preview')
def get_po_email_preview(id: int, db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    """Return email preview data for the Send to Vendor dialog."""
    from app.config import SMTP_FROM_EMAIL, SMTP_FROM_NAME, TEST_EMAIL_OVERRIDE
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    vendor = po.vendor
    vendor_email = vendor.email if vendor else ''
    vendor_name = vendor.name if vendor else 'Vendor'
    actual_to = TEST_EMAIL_OVERRIDE if TEST_EMAIL_OVERRIDE else vendor_email
    subject, html_body = _build_po_email_template(po)
    return {'from_name': SMTP_FROM_NAME, 'from_email': SMTP_FROM_EMAIL, 'to_email': actual_to, 'vendor_email': vendor_email, 'vendor_name': vendor_name, 'subject': subject, 'html_body': html_body, 'attachment_filename': f'{po.po_number}.pdf', 'test_mode': bool(TEST_EMAIL_OVERRIDE)}

class SendPORequest(BaseModel):
    cc: Optional[str] = ''
    bcc: Optional[str] = ''

@router.post('/po/{id}/send')
def send_po(id: int, body: SendPORequest=SendPORequest(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    if po.status != 'Approved':
        raise HTTPException(status_code=400, detail='Only approved POs can be sent.')
    po.status = 'Sent to Vendor'
    db.commit()
    email_status = {'success': False, 'message': 'Email not attempted'}
    try:
        from app.utils.pdf_utils import generate_po_pdf
        from app.utils.email_utils import send_email_with_attachment
        pdf_bytes = generate_po_pdf(po)
        vendor = po.vendor
        vendor_email = vendor.email if vendor else ''
        vendor_name = vendor.name if vendor else 'Vendor'
        subject, html_body = _build_po_email_template(po)
        email_status = send_email_with_attachment(to_email=vendor_email, subject=subject, html_body=html_body, attachment_bytes=pdf_bytes, attachment_filename=f'{po.po_number}.pdf', vendor_name=vendor_name, cc=body.cc or '', bcc=body.bcc or '')
    except Exception as e:
        import logging
        logging.getLogger(__name__).error('Error generating/sending PO email for %s: %s', po.po_number, e, exc_info=True)
        email_status = {'success': False, 'message': f'Email error: {str(e)}'}
    response = {'message': 'PO sent to Vendor successfully.'}
    if email_status.get('success'):
        response['email_status'] = 'Email sent successfully'
    else:
        response['email_status'] = f'Email not sent: {email_status.get("message", "Unknown error")}'
    return response

@router.post('/po/{id}/short-close')
def short_close_po(id: int, body: RejectBody=RejectBody(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    if po.status not in ['Approved', 'Sent to Vendor', 'Partially Received']:
        raise HTTPException(status_code=400, detail='Only Approved, Sent or Partially Received POs can be Short Closed')
    po.status = 'Short Closed'
    if body.remarks:
        po.remarks = (po.remarks or '') + f'\n[Short Closed: {body.remarks}]'
    db.commit()
    try:
        from app.models import TenantConfiguration, UserRoleAssignment, Role
        from app.utils.email_utils import send_html_email
        import threading
        config = db.query(TenantConfiguration).filter(TenantConfiguration.tenant_id == tenant_id).first()
        notify_roles = config.po_short_close_notify_roles if config and config.po_short_close_notify_roles else []
        if notify_roles:
            users_to_notify = db.query(User).join(UserRoleAssignment).join(Role).filter(User.is_active == True, User.email.isnot(None), Role.name.in_(notify_roles)).distinct().all()
            if users_to_notify:
                subject, html_body = _build_po_short_close_email_template(po, body.remarks, current_user)
                for u in users_to_notify:
                    threading.Thread(target=send_html_email, args=(u.email, subject, html_body)).start()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f'Failed to send short close notifications for PO {po.po_number}: {e}')
    return {'message': 'PO Short Closed'}

@router.post('/po/{id}/cancel')
def cancel_po(id: int, body: RejectBody=RejectBody(), db: Session=Depends(get_db), current_user: User=Depends(require_permission('purchase_orders', 'update')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
    if not po:
        raise HTTPException(status_code=404, detail='PO not found')
    if po.status not in ['Draft', 'Submitted']:
        raise HTTPException(status_code=400, detail='Only Draft or Submitted POs can be Cancelled')
    po.status = 'Cancelled'
    if body.remarks:
        po.remarks = (po.remarks or '') + f'\n[Cancelled: {body.remarks}]'
    db.commit()
    return {'message': 'PO Cancelled'}