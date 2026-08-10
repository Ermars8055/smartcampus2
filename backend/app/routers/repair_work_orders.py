"""Repair Work Orders management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import RepairWorkOrder, User, Complaint, EquipmentItem, Vendor, Contract
from app.schemas import RepairWorkOrderCreate, RepairWorkOrderUpdate, RepairWorkOrderOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
from datetime import datetime

router = APIRouter(prefix="/api/rwos", tags=["Repair Work Orders"])

def _format_rwo_out(r: RepairWorkOrder) -> RepairWorkOrderOut:
    out = RepairWorkOrderOut.model_validate(r)
    if r.complaint:
        out.docket_no = r.complaint.docket_no
        out.complaint_docket = r.complaint.docket_no
    if r.equipment:
        out.equipment_code = r.equipment.equipment_code
        out.equipment_serial = r.equipment.serial_number
        eq_name = r.equipment.material.name if (r.equipment.material and hasattr(r.equipment.material, 'name')) else None
        out.equipment_name = eq_name or r.equipment.equipment_code
    if r.vendor:
        out.vendor_name = r.vendor.name
    if r.contract:
        out.contract_number = r.contract.contract_number
    return out

@router.get("")
def list_rwos(
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(RepairWorkOrder).filter(
        RepairWorkOrder.tenant_id == tenant_id, RepairWorkOrder.site_id == site_id, RepairWorkOrder.is_deleted == False
    )
    if status:
        q = q.filter(RepairWorkOrder.status == status)
    if search:
        q = q.filter(or_(
            RepairWorkOrder.rwo_number.ilike(f"%{search}%")
        ))
    rwos = q.order_by(RepairWorkOrder.id.desc()).all()
    
    return [_format_rwo_out(r) for r in rwos]

@router.get("/{id}")
def get_rwo(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    r = db.query(RepairWorkOrder).filter(
        RepairWorkOrder.id == id, RepairWorkOrder.tenant_id == tenant_id, RepairWorkOrder.site_id == site_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Repair Work Order not found")
        
    return _format_rwo_out(r)

@router.post("")
def create_rwo(
    data: RepairWorkOrderCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("rwos", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    rwo_data = data.model_dump()
    rwo_number = get_next_number(db, tenant_id, site_id, "REPAIR_WORK_ORDER", "RWO")
    
    rwo = RepairWorkOrder(
        **rwo_data,
        rwo_number=rwo_number,
        status="Assigned",
        created_by_id=current_user.id,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(rwo)
    db.commit()
    return {"id": rwo.id, "rwo_number": rwo.rwo_number, "message": "Repair Work Order created successfully"}

@router.put("/{id}")
def update_rwo(
    id: int, data: RepairWorkOrderUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("rwos", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    rwo = db.query(RepairWorkOrder).filter(
        RepairWorkOrder.id == id, RepairWorkOrder.tenant_id == tenant_id, RepairWorkOrder.site_id == site_id
    ).first()
    if not rwo:
        raise HTTPException(status_code=404, detail="Repair Work Order not found")
        
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(rwo, k, v)
        
    db.commit()
    return {"message": "Repair Work Order updated successfully"}
