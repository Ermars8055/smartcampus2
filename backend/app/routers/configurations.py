from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TenantConfiguration
from app.schemas import TenantConfigurationOut, TenantConfigurationCreate, TenantConfigurationUpdate
from app.auth import get_tenant_id, get_site_id, require_permission, get_current_user
from app.models import LocationMaster, User
from app.schemas import LocationMasterOut, LocationMasterCreate
from typing import List

router = APIRouter(prefix="/api/configurations", tags=["Configurations"])

@router.get("", response_model=TenantConfigurationOut)
def get_tenant_configuration(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_permission("configurations", "read"))
):
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User does not belong to a tenant")
    
    config = db.query(TenantConfiguration).filter(
        TenantConfiguration.tenant_id == tenant_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
        
    return config

@router.put("", response_model=TenantConfigurationOut)
def update_tenant_configuration(
    config_in: TenantConfigurationUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_permission("configurations", "update"))
):
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User does not belong to a tenant")
        
    # Basic validation
    if abs((config_in.cgst_share_percent + config_in.sgst_share_percent) - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail="CGST and SGST share must sum to exactly 100%")

    config = db.query(TenantConfiguration).filter(
        TenantConfiguration.tenant_id == tenant_id
    ).first()
    
    if config:
        config.base_state = config_in.base_state
        config.cgst_share_percent = config_in.cgst_share_percent
        config.sgst_share_percent = config_in.sgst_share_percent
    else:
        config = TenantConfiguration(
            tenant_id=tenant_id,
            base_state=config_in.base_state,
            cgst_share_percent=config_in.cgst_share_percent,
            sgst_share_percent=config_in.sgst_share_percent
        )
        db.add(config)
        
    db.commit()
    db.refresh(config)
    return config

@router.get("/locations", response_model=List[LocationMasterOut])
def get_locations(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    current_user: User = Depends(get_current_user)
):
    locations = db.query(LocationMaster).filter(
        LocationMaster.tenant_id == tenant_id,
        LocationMaster.site_id == site_id
    ).all()
    return locations

@router.post("/locations", response_model=LocationMasterOut)
def create_location(
    location_in: LocationMasterCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    current_user: User = Depends(require_permission("locations", "create"))
):
    location = LocationMaster(
        tenant_id=tenant_id,
        site_id=site_id,
        location_name=location_in.location_name,
        location_code=location_in.location_code,
        is_active=location_in.is_active
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location

@router.put("/locations/{location_id}", response_model=LocationMasterOut)
def update_location(
    location_id: int,
    location_in: LocationMasterCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    current_user: User = Depends(require_permission("locations", "update"))
):
    location = db.query(LocationMaster).filter(
        LocationMaster.id == location_id,
        LocationMaster.tenant_id == tenant_id,
        LocationMaster.site_id == site_id
    ).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
        
    location.location_name = location_in.location_name
    location.location_code = location_in.location_code
    location.is_active = location_in.is_active
    db.commit()
    db.refresh(location)
    return location
