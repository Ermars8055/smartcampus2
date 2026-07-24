"""Sites routes: Manage Tenant Sites and User Access."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Site, UserRoleAssignment
from app.schemas import SiteCreate, SiteOut
from app.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/sites", tags=["Sites"])

@router.get("", response_model=List[SiteOut])
def list_sites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If Super Admin, return all
    if current_user.tenant_id is None:
        return db.query(Site).all()
        
    # Standard user: return sites they have access to
    access = db.query(UserRoleAssignment).filter(UserRoleAssignment.user_id == current_user.id).all()
    site_ids = [a.site_id for a in access]
    return db.query(Site).filter(Site.id.in_(site_ids)).all()


@router.post("", response_model=SiteOut)
def create_site(
    data: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_users", "create")) # Or separate admin_sites permission
):
    if current_user.tenant_id is None:
        raise HTTPException(status_code=400, detail="Super Admins cannot create tenant sites this way.")
        
    site = Site(
        name=data.name,
        location=data.location,
        is_active=data.is_active,
        tenant_id=current_user.tenant_id
    )
    db.add(site)
    db.flush()
    
    # Automatically give the creator access to the new site
    # In multi-tenant, site access is usually managed via Role Assignments
    access = UserRoleAssignment(user_id=current_user.id, site_id=site.id, tenant_id=site.tenant_id, role_id=1) # Defaulting role
    db.add(access)
    
    db.commit()
    db.refresh(site)
    return site

@router.put("/{id}", response_model=SiteOut)
def update_site(
    id: int,
    data: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_users", "update"))
):
    site = db.query(Site).filter(
        Site.id == id,
        Site.tenant_id == current_user.tenant_id
    ).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
        
    site.name = data.name
    site.location = data.location
    site.is_active = data.is_active
    
    db.commit()
    db.refresh(site)
    return site
