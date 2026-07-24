from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import DepartmentMaterialLimit, User, Material
from app.schemas import DepartmentMaterialLimitCreate, DepartmentMaterialLimitUpdate, DepartmentMaterialLimitOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
import datetime

router = APIRouter(prefix="/api/material-limits", tags=["Material Limits"])

@router.get("", response_model=List[DepartmentMaterialLimitOut])
def list_material_limits(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("material_allowances", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    limits = db.query(DepartmentMaterialLimit).filter(
        DepartmentMaterialLimit.tenant_id == tenant_id,
        DepartmentMaterialLimit.site_id == site_id
    ).order_by(DepartmentMaterialLimit.department, DepartmentMaterialLimit.created_at.desc()).all()
    
    for limit in limits:
        limit.created_by_name = limit.created_by.full_name if limit.created_by else None
        if limit.material:
            limit.material_name = limit.material.name
            limit.material_code = limit.material.code
            limit.uom_name = limit.material.uom.abbreviation if limit.material.uom else None

    return limits

@router.post("", response_model=List[DepartmentMaterialLimitOut])
def create_material_limit(
    data: DepartmentMaterialLimitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("material_allowances", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    created_limits = []
    
    for dept in data.departments:
        # Check if exists
        existing = db.query(DepartmentMaterialLimit).filter(
            DepartmentMaterialLimit.tenant_id == tenant_id,
            DepartmentMaterialLimit.site_id == site_id,
            DepartmentMaterialLimit.department == dept,
            DepartmentMaterialLimit.material_id == data.material_id
        ).first()
        
        if existing:
            # Overwrite existing limit
            existing.monthly_limit = data.monthly_limit
            db.commit()
            db.refresh(existing)
            limit = existing
        else:
            limit = DepartmentMaterialLimit(
                tenant_id=tenant_id,
                site_id=site_id,
                department=dept,
                material_id=data.material_id,
                monthly_limit=data.monthly_limit,
                created_by_id=current_user.id
            )
            db.add(limit)
            db.commit()
            db.refresh(limit)
            
        limit.created_by_name = current_user.full_name
        if limit.material:
            limit.material_name = limit.material.name
            limit.material_code = limit.material.code
            limit.uom_name = limit.material.uom.abbreviation if limit.material.uom else None
        
        created_limits.append(limit)
        
    return created_limits

@router.put("/{limit_id}", response_model=DepartmentMaterialLimitOut)
def update_material_limit(
    limit_id: int,
    data: DepartmentMaterialLimitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("material_allowances", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    limit = db.query(DepartmentMaterialLimit).filter(
        DepartmentMaterialLimit.id == limit_id,
        DepartmentMaterialLimit.tenant_id == tenant_id,
        DepartmentMaterialLimit.site_id == site_id
    ).first()
    
    if not limit:
        raise HTTPException(404, "Material limit not found")
        
    limit.monthly_limit = data.monthly_limit
    db.commit()
    db.refresh(limit)
    
    limit.created_by_name = limit.created_by.full_name if limit.created_by else None
    if limit.material:
        limit.material_name = limit.material.name
        limit.material_code = limit.material.code
        limit.uom_name = limit.material.uom.abbreviation if limit.material.uom else None
        
    return limit

@router.delete("/{limit_id}")
def delete_material_limit(
    limit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("material_allowances", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    limit = db.query(DepartmentMaterialLimit).filter(
        DepartmentMaterialLimit.id == limit_id,
        DepartmentMaterialLimit.tenant_id == tenant_id,
        DepartmentMaterialLimit.site_id == site_id
    ).first()
    
    if not limit:
        raise HTTPException(404, "Material limit not found")
        
    db.delete(limit)
    db.commit()
    return {"message": "Material limit deleted successfully"}
