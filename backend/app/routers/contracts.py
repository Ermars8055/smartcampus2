"""Contracts management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import Contract, ContractItem, User, ApprovalFlow, Vendor, Institution, Department
from app.schemas import ContractCreate, ContractUpdate, ContractOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
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
    
    result = []
    for c in contracts:
        out = ContractOut.model_validate(c)
        out.vendor_name = c.vendor.name if c.vendor else None
        out.institution_name = c.institution.name if c.institution else None
        out.department_name = c.department.name if c.department else None
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

@router.post("/{id}/approve")
def approve_contract(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("contracts", "approve")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    contract = db.query(Contract).filter(
        Contract.id == id, Contract.tenant_id == tenant_id, Contract.site_id == site_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    if contract.status not in ["Draft", "Pending Approval"]:
        raise HTTPException(status_code=400, detail="Contract is not in a valid state for approval")
        
    contract.status = "Approved"
    contract.approved_by_id = current_user.id
    contract.approved_at = datetime.utcnow()
    db.commit()
    return {"message": "Contract approved"}

@router.post("/{id}/activate")
def activate_contract(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("contracts", "approve")),
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
    current_user: User = Depends(require_permission("contracts", "approve")),
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
