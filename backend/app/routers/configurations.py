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
    sgst = config_in.sgst_share_percent if config_in.sgst_share_percent is not None else (100.0 - (config_in.cgst_share_percent or 0.0))
    if abs(((config_in.cgst_share_percent or 0.0) + sgst) - 100.0) > 0.01:
        raise HTTPException(status_code=400, detail="CGST and SGST share must sum to exactly 100%")

    # Extended workflow actions check
    is_platform = getattr(current_user, '_is_platform_admin', False) if current_user else True
    cfg_perms = getattr(current_user, '_permissions', {}).get("configurations", {}) if current_user else {}
    ext = cfg_perms.get("extended_actions", {})
    has_ext = bool(ext)

    can_tax = is_platform or (ext.get("can_manage_tax_settings", True) if has_ext else True)
    can_po = is_platform or (ext.get("can_manage_po_short_close", True) if has_ext else True)
    can_pm = is_platform or (ext.get("can_manage_pm_notifications", True) if has_ext else True)
    can_cal = is_platform or (ext.get("can_manage_calibration_notifications", True) if has_ext else True)

    config = db.query(TenantConfiguration).filter(
        TenantConfiguration.tenant_id == tenant_id
    ).first()
    
    if config:
        if can_tax:
            config.base_state = config_in.base_state
            config.cgst_share_percent = config_in.cgst_share_percent
            config.sgst_share_percent = sgst
        if can_po:
            if hasattr(config_in, 'po_short_close_notify_roles') and config_in.po_short_close_notify_roles is not None:
                config.po_short_close_notify_roles = config_in.po_short_close_notify_roles
            if hasattr(config_in, 'po_short_close_notify_users') and config_in.po_short_close_notify_users is not None:
                config.po_short_close_notify_users = config_in.po_short_close_notify_users
        
        if can_pm:
            config.pm_advance_email_enabled = config_in.pm_advance_email_enabled
            config.pm_advance_email_types = config_in.pm_advance_email_types
            config.pm_advance_email_days = config_in.pm_advance_email_days
            config.pm_advance_email_roles = config_in.pm_advance_email_roles
            config.pm_advance_email_users = config_in.pm_advance_email_users
        
        if can_pm:
            # Enforce whole integers for PM tiers
            pm_tiers = []
            for t in (config_in.pm_advance_email_frequency_tiers or []):
                try:
                    pm_tiers.append({
                        "from_days": int(round(float(t.get("from_days", 0)))),
                        "to_days": int(round(float(t.get("to_days", 0)))),
                        "frequency_days": max(1, int(round(float(t.get("frequency_days", 1))))),
                        "label": str(t.get("label", ""))
                    })
                except (ValueError, TypeError):
                    continue
            config.pm_advance_email_frequency_tiers = pm_tiers

        if can_cal:
            config.calibration_advance_email_enabled = config_in.calibration_advance_email_enabled or False
            config.calibration_advance_email_roles = config_in.calibration_advance_email_roles or []
            config.calibration_advance_email_users = config_in.calibration_advance_email_users or []

            # Enforce whole integers for Calibration tiers
            cal_tiers = []
            for t in (config_in.calibration_advance_email_frequency_tiers or []):
                try:
                    cal_tiers.append({
                        "from_days": int(round(float(t.get("from_days", 0)))),
                        "to_days": int(round(float(t.get("to_days", 0)))),
                        "frequency_days": max(1, int(round(float(t.get("frequency_days", 1))))),
                        "label": str(t.get("label", ""))
                    })
                except (ValueError, TypeError):
                    continue
            config.calibration_advance_email_frequency_tiers = cal_tiers
    else:
        # Enforce whole integers for PM tiers
        pm_tiers = []
        for t in (config_in.pm_advance_email_frequency_tiers or []):
            try:
                pm_tiers.append({
                    "from_days": int(round(float(t.get("from_days", 0)))),
                    "to_days": int(round(float(t.get("to_days", 0)))),
                    "frequency_days": max(1, int(round(float(t.get("frequency_days", 1))))),
                    "label": str(t.get("label", ""))
                })
            except (ValueError, TypeError):
                continue

        # Enforce whole integers for Calibration tiers
        cal_tiers = []
        for t in (config_in.calibration_advance_email_frequency_tiers or []):
            try:
                cal_tiers.append({
                    "from_days": int(round(float(t.get("from_days", 0)))),
                    "to_days": int(round(float(t.get("to_days", 0)))),
                    "frequency_days": max(1, int(round(float(t.get("frequency_days", 1))))),
                    "label": str(t.get("label", ""))
                })
            except (ValueError, TypeError):
                continue

        config = TenantConfiguration(
            tenant_id=tenant_id,
            base_state=config_in.base_state,
            cgst_share_percent=config_in.cgst_share_percent,
            sgst_share_percent=sgst,
            po_short_close_notify_roles=config_in.po_short_close_notify_roles if hasattr(config_in, 'po_short_close_notify_roles') else [],
            po_short_close_notify_users=config_in.po_short_close_notify_users if hasattr(config_in, 'po_short_close_notify_users') else [],
            pm_advance_email_enabled=config_in.pm_advance_email_enabled,
            pm_advance_email_types=config_in.pm_advance_email_types,
            pm_advance_email_days=config_in.pm_advance_email_days,
            pm_advance_email_roles=config_in.pm_advance_email_roles,
            pm_advance_email_users=config_in.pm_advance_email_users,
            pm_advance_email_frequency_tiers=pm_tiers,
            calibration_advance_email_enabled=config_in.calibration_advance_email_enabled or False,
            calibration_advance_email_roles=config_in.calibration_advance_email_roles or [],
            calibration_advance_email_users=config_in.calibration_advance_email_users or [],
            calibration_advance_email_frequency_tiers=cal_tiers
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


@router.post("/trigger-pm-notifications")
def trigger_pm_notifications(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_permission("configurations", "update"))
):
    """Manually triggers the PM advance email dispatcher for this tenant."""
    from app.scheduler import send_pm_advance_emails
    result = send_pm_advance_emails(tenant_id=tenant_id)
    return {"message": "PM notification dispatch completed", "details": result}


@router.post("/trigger-calibration-notifications")
def trigger_calibration_notifications(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_permission("configurations", "update"))
):
    """Manually triggers the Calibration advance email dispatcher for this tenant."""
    from app.scheduler import send_calibration_advance_emails
    result = send_calibration_advance_emails(tenant_id=tenant_id)
    return {"message": "Calibration notification dispatch completed", "details": result}

