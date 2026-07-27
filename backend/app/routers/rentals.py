from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.database import get_db
from app.models import ReagentConsumptionLog, EquipmentItem, User
from app.schemas import ReagentConsumptionLogCreate, ReagentConsumptionLogOut
from app.auth import require_permission, get_tenant_id, get_site_id, get_current_user

router = APIRouter(prefix="/api/rentals", tags=["Rentals"])

@router.post("/consumption", response_model=ReagentConsumptionLogOut)
def log_consumption(
    data: ReagentConsumptionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    # Verify equipment exists and belongs to the site
    equipment = db.query(EquipmentItem).filter(
        EquipmentItem.id == data.equipment_id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()

    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    if equipment.rental_type != "Reagent Rental" and not equipment.cost_per_test:
        raise HTTPException(status_code=400, detail="This equipment is not configured for Reagent Rental or Cost Per Test")
    
    cost_per_test = equipment.cost_per_test or 0.0
    total_cost = data.tests_performed * cost_per_test

    log_entry = ReagentConsumptionLog(
        tenant_id=tenant_id,
        site_id=site_id,
        equipment_id=data.equipment_id,
        consumption_date=data.consumption_date,
        tests_performed=data.tests_performed,
        cost_per_test=cost_per_test,
        total_cost=total_cost,
        remarks=data.remarks,
        logged_by_id=current_user.id
    )

    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return log_entry

@router.get("/consumption/{equipment_id}", response_model=List[ReagentConsumptionLogOut])
def get_consumption_logs(
    equipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    logs = db.query(ReagentConsumptionLog).filter(
        ReagentConsumptionLog.equipment_id == equipment_id,
        ReagentConsumptionLog.tenant_id == tenant_id,
        ReagentConsumptionLog.site_id == site_id
    ).order_by(ReagentConsumptionLog.consumption_date.desc()).all()
    
    return logs
