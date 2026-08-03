"""Contracts management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import Contract, ContractItem, User, ApprovalFlow, Vendor, Institution, Department, ContractApproval, Alert
from app.schemas import ContractCreate, ContractUpdate, ContractOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id, require_action
from app.utils.sequences import get_next_number
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/contracts", tags=["Contracts"])

@router.get("")
def list_contracts(
    search: Optional[str] = None,
    contract_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Contract).filter(
        Contract.tenant_id == tenant_id, Contract.site_id == site_id, Contract.is_deleted == False
    )
    if contract_type:
        q = q.filter(Contract.contract_type == contract_type)
    if status:
        q = q.filter(Contract.status == status)
    if search:
        q = q.filter(or_(
            Contract.contract_number.ilike(f"%{search}%")
        ))
    contracts = q.order_by(Contract.id.desc()).all()
    
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "CONTRACT",
        ApprovalFlow.is_active == True
    ).all()
    user_roles = getattr(current_user, "_roles", [])
    can_override = getattr(current_user, "_is_platform_admin", False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'

    result = []
    for c in contracts:
        out = ContractOut.model_validate(c)
        out.vendor_name = c.vendor.name if c.vendor else None
        out.institution_name = c.institution.name if c.institution else None
        out.department_name = c.department.name if c.department else None
        
        out.can_user_approve = False
        if c.status == "Submitted":
            c_amount = c.contract_value or 0
            lvl = c.current_approval_level or 1
            for f in flows:
                if f.level == lvl and \
                   f.min_amount <= c_amount and \
                   (f.max_amount is None or f.max_amount >= c_amount) and \
                   (can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)):
                    out.can_user_approve = True
                    break
        
        result.append(out)
    return result

@router.get("/{id}")
def get_contract(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    c = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    out = ContractOut.model_validate(c)
    out.vendor_name = c.vendor.name if c.vendor else None
    out.institution_name = c.institution.name if c.institution else None
    out.department_name = c.department.name if c.department else None
    
    out.can_user_approve = False
    if c.status == "Submitted":
        flows = db.query(ApprovalFlow).filter(
            ApprovalFlow.tenant_id == tenant_id,
            ApprovalFlow.site_id == site_id,
            ApprovalFlow.document_type == "CONTRACT",
            ApprovalFlow.is_active == True
        ).all()
        user_roles = getattr(current_user, "_roles", [])
        can_override = getattr(current_user, "_is_platform_admin", False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
        c_amount = c.contract_value or 0
        lvl = c.current_approval_level or 1
        for f in flows:
            if f.level == lvl and \
               f.min_amount <= c_amount and \
               (f.max_amount is None or f.max_amount >= c_amount) and \
               (can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)):
                out.can_user_approve = True
                break
    
    for idx, item in enumerate(out.items):
        db_item = c.items[idx]
        if db_item.material:
            item.material_name = db_item.material.name
        if db_item.equipment:
            item.equipment_serial = db_item.equipment.serial_number or db_item.equipment.name
            
    return out

@router.post("")
def create_contract(
    data: ContractCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("contracts", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    contract_data = data.model_dump(exclude={"items"})
    contract_number = get_next_number(db, tenant_id, site_id, "CONTRACT", "CNT")
    
    contract = Contract(
        **contract_data,
        contract_number=contract_number,
        status="Draft",
        current_approval_level=1,
        created_by_id=current_user.id,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(contract)
    db.flush()
    
    for item_data in data.items:
        db.add(ContractItem(**item_data.model_dump(), contract_id=contract.id, remaining_quantity=item_data.contract_quantity))
        
    db.commit()
    return {"id": contract.id, "contract_number": contract.contract_number, "message": "Contract created successfully"}

@router.put("/{id}")
def update_contract(
    id: int, data: ContractUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("contracts", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    contract = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(contract, k, v)
        
    db.commit()
    return {"message": "Contract updated successfully"}

class RejectRemarks(BaseModel):
    remarks: str

@router.post("/{id}/approve")
def approve_contract(
    id: int, payload: RejectRemarks = None, db: Session = Depends(get_db), 
    current_user: User = Depends(require_action("contracts", "can_approve")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    contract = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    if contract.status not in ["Draft", "Submitted"]:
        raise HTTPException(status_code=400, detail="Contract is not in a valid state for approval")
        
    # Multi-level approval logic
    c_amount = contract.contract_value or 0
    lvl = contract.current_approval_level or 1
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "CONTRACT",
        ApprovalFlow.level == lvl,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= c_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= c_amount)
    ).all()

    if not flows:
        return handle_contract_next_level(db, contract, tenant_id, site_id)

    user_roles = getattr(current_user, "_roles", [])
    can_override = getattr(current_user, "_is_platform_admin", False) or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    
    applicable_flows = [
        f for f in flows 
        if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)
    ]
    
    if not applicable_flows:
        raise HTTPException(403, f"You do not have permission to approve at level {lvl}")
        
    new_approvals = 0
    for f in applicable_flows:
        existing = db.query(ContractApproval).filter(
            ContractApproval.contract_id == id, ContractApproval.approval_flow_id == f.id
        ).first()
        if not existing:
            db.add(ContractApproval(
                contract_id=id, 
                approval_flow_id=f.id, 
                approver_id=current_user.id,
                remarks=payload.remarks if payload else None
            ))
            new_approvals += 1

    if new_approvals == 0:
        raise HTTPException(400, "You have already approved this contract at the current level")

    db.commit()

    if new_approvals > 0:
        return handle_contract_next_level(db, contract, tenant_id, site_id, current_user.id)

    return {"message": f"Approval recorded for Contract {contract.contract_number} by {current_user.full_name}", "status": contract.status, "current_level": contract.current_approval_level or 1}

def handle_contract_next_level(db, contract, tenant_id, site_id, user_id=None):
    next_level = (contract.current_approval_level or 1) + 1
    c_amount = contract.contract_value or 0
    has_more = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "CONTRACT",
        ApprovalFlow.level >= next_level,
        ApprovalFlow.is_active == True,
        ApprovalFlow.min_amount <= c_amount,
        (ApprovalFlow.max_amount == None) | (ApprovalFlow.max_amount >= c_amount)
    ).first()

    approver = db.query(User).filter(User.id == user_id).first() if user_id else None
    approver_name = approver.full_name if approver else "Unknown Approver"

    if has_more:
        contract.current_approval_level = next_level
        contract.status = "Submitted"
        db.commit()
        return {"message": f"Contract {contract.contract_number} approved at Level {next_level - 1} by {approver_name}. Moved to Level {next_level}.", "status": contract.status, "current_level": contract.current_approval_level}
    else:
        contract.status = "Approved"
        contract.approved_by_id = user_id
        contract.approved_at = datetime.utcnow()
        
        approver = db.query(User).filter(User.id == user_id).first() if user_id else None
        approver_name = approver.full_name if approver else "Unknown Approver"
        alert = Alert(
            tenant_id=tenant_id,
            site_id=site_id,
            alert_type="Contract Approved",
            severity="Success",
            title=f"Contract {contract.contract_number} Approved",
            message=f"The contract ({contract.contract_number}) has been approved by {approver_name}.",
            reference_type="ContractApproved",
            reference_id=contract.id,
            user_id=contract.created_by_id,
            is_read=False,
            is_resolved=False
        )
        db.add(alert)
        
        db.commit()
        return {"message": f"Contract {contract.contract_number} has been fully approved by {approver_name}", "status": contract.status, "current_level": contract.current_approval_level}


@router.post("/{id}/reject")
def reject_contract(
    id: int, payload: RejectRemarks, db: Session = Depends(get_db), 
    current_user: User = Depends(require_action("contracts", "can_reject")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    contract = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    if contract.status not in ["Draft", "Submitted"]:
        raise HTTPException(status_code=400, detail="Contract is not in a valid state for rejection")
        
    contract.status = "Rejected"
    contract.approval_remarks = payload.remarks
    db.commit()
    return {"message": "Contract rejected", "status": "Rejected"}

@router.post("/{id}/activate")
def activate_contract(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_action("contracts", "can_approve")),
    tenant_id: int = Depends(get_tenant_id),

    site_id: int = Depends(get_site_id)
):
    contract = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    if contract.status != "Approved":
        raise HTTPException(status_code=400, detail="Only approved contracts can be activated")
        
    contract.status = "Active"
    db.commit()
    return {"message": "Contract activated"}

@router.post("/{id}/suspend")
def suspend_contract(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_action("contracts", "can_approve")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    contract = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    contract.status = "Suspended"
    db.commit()
    return {"message": "Contract suspended"}
