from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import TenantConfiguration
from app.schemas import TenantConfigurationOut, TenantConfigurationCreate, TenantConfigurationUpdate
from app.auth import get_tenant_id, get_site_id, require_permission, get_current_user
from app.models import LocationMaster, User, SystemLookup
from app.schemas import LocationMasterOut, LocationMasterCreate, SystemLookupOut
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
        if hasattr(config_in, 'po_short_close_notify_roles') and config_in.po_short_close_notify_roles is not None:
            config.po_short_close_notify_roles = config_in.po_short_close_notify_roles
    else:
        config = TenantConfiguration(
            tenant_id=tenant_id,
            base_state=config_in.base_state,
            cgst_share_percent=config_in.cgst_share_percent,
            sgst_share_percent=config_in.sgst_share_percent,
            po_short_close_notify_roles=config_in.po_short_close_notify_roles if hasattr(config_in, 'po_short_close_notify_roles') else []
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
        department_name=location_in.department_name,
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
    location.department_name = location_in.department_name
    location.is_active = location_in.is_active
    db.commit()
    db.refresh(location)
    return location

@router.get("/lookups/{lookup_type}", response_model=List[SystemLookupOut])
def get_system_lookups(
    lookup_type: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user)
):
    lookups = db.query(SystemLookup).filter(
        SystemLookup.tenant_id == tenant_id,
        SystemLookup.lookup_type == lookup_type
    ).all()

    # Auto-seed defaults for ComplaintType if none exist
    if not lookups and lookup_type == "ComplaintType":
        default_complaints = ["General Complaint", "Machine Not Working", "Installation", "User Training"]
        new_lookups = []
        for val in default_complaints:
            sl = SystemLookup(
                tenant_id=tenant_id,
                lookup_type=lookup_type,
                lookup_value=val,
                is_active=True
            )
            db.add(sl)
            new_lookups.append(sl)
        db.commit()
        for sl in new_lookups:
            db.refresh(sl)
        lookups = new_lookups

    return lookups
