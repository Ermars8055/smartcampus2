"""Admin Users router: Manage users for a tenant."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models import User, TenantMembership, UserRoleAssignment, Tenant, Role, Site
from app.auth import get_current_user, require_permission, get_password_hash, validate_password_strength

router = APIRouter(prefix="/api/admin/users", tags=["Admin Users"])

class SiteInfo(BaseModel):
    site_id: int
    site_name: str

class AdminUserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: str
    tenant_name: Optional[str] = None
    tenant_id: Optional[int] = None
    role_name: Optional[str] = None
    role: Optional[str] = None
    role_id: Optional[int] = None
    department: Optional[str] = None
    institution: Optional[str] = None
    sites: List[SiteInfo] = []
    
    class Config:
        from_attributes = True

class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role_id: Optional[int] = None
    tenant_id: Optional[int] = None
    department: Optional[str] = None
    institution: Optional[str] = None
    site_ids: List[int] = []
    is_active: bool = True

class AdminUserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    password: Optional[str] = None
    role_id: Optional[int] = None
    tenant_id: Optional[int] = None
    department: Optional[str] = None
    institution: Optional[str] = None
    site_ids: List[int] = []
    is_active: bool = True

@router.get("", response_model=List[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_users", "read"))
):
    tenant_id = getattr(current_user, '_tenant_id', None)
    
    # Query users
    query = db.query(User).filter(User.is_deleted == False)
    
    if tenant_id:
        # Tenant admins only see users in their tenant
        query = query.join(TenantMembership).filter(TenantMembership.tenant_id == tenant_id)
    
    users = query.all()
    
    result = []
    for u in users:
        u_tenant_id = None
        tenant_name = None
        role_name = None
        role_id = None
        sites = []
        
        # Get the membership for the current tenant context
        if tenant_id:
            membership = db.query(TenantMembership).filter(
                TenantMembership.user_id == u.id,
                TenantMembership.tenant_id == tenant_id
            ).first()
        else:
            membership = db.query(TenantMembership).filter(TenantMembership.user_id == u.id).first()
        if membership:
            u_tenant_id = membership.tenant_id
            tenant = db.query(Tenant).filter(Tenant.id == membership.tenant_id).first()
            if tenant:
                tenant_name = tenant.name
                
            assignments = db.query(UserRoleAssignment).filter(
                UserRoleAssignment.user_id == u.id,
                UserRoleAssignment.tenant_id == membership.tenant_id
            ).all()
            
            if assignments:
                role = db.query(Role).filter(Role.id == assignments[0].role_id).first()
                if role:
                    role_name = role.name
                    role_id = role.id
                
                # Deduplicate sites
                site_ids_seen = set()
                for a in assignments:
                    if a.site_id and a.site_id not in site_ids_seen:
                        site_ids_seen.add(a.site_id)
                        site = db.query(Site).filter(Site.id == a.site_id).first()
                        if site:
                            sites.append(SiteInfo(site_id=site.id, site_name=site.name))
        
        result.append(AdminUserOut(
            id=u.id,
            username=u.username,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active,
            created_at=u.created_at.isoformat() if u.created_at else "",
            tenant_name=tenant_name,
            tenant_id=u_tenant_id,
            role_name=role_name,
            role=role_name,
            role_id=role_id,
            department=u.department,
            institution=u.institution,
            sites=sites
        ))
    return result

@router.post("", response_model=AdminUserOut)
def create_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_users", "create"))
):
    target_tenant_id = getattr(current_user, '_tenant_id', None)
    if not target_tenant_id:
        target_tenant_id = data.tenant_id
        
    if not target_tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID is required")
        
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
        
    # Check if role belongs to tenant
    if data.role_id:
        role = db.query(Role).filter(Role.id == data.role_id, Role.tenant_id == target_tenant_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role for this tenant")
            
    # Check sites
    if data.site_ids:
        sites = db.query(Site).filter(Site.id.in_(data.site_ids), Site.tenant_id == target_tenant_id).all()
        if len(sites) != len(set(data.site_ids)):
            raise HTTPException(status_code=400, detail="Invalid sites for this tenant")

    pwd_err = validate_password_strength(data.password)
    if pwd_err:
        raise HTTPException(400, pwd_err)
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        department=data.department,
        institution=data.institution,
        hashed_password=get_password_hash(data.password),
        is_active=data.is_active
    )
    db.add(user)
    db.flush()
    
    db.add(TenantMembership(user_id=user.id, tenant_id=target_tenant_id, is_active=data.is_active))
    
    if data.role_id:
        if not data.site_ids:
            db.add(UserRoleAssignment(user_id=user.id, tenant_id=target_tenant_id, role_id=data.role_id, site_id=None))
        else:
            for sid in set(data.site_ids):
                db.add(UserRoleAssignment(user_id=user.id, tenant_id=target_tenant_id, role_id=data.role_id, site_id=sid))
                
    db.commit()
    db.refresh(user)
    
    # Simple return (the GET method will properly format it)
    # We can just return a dummy mapping or partial data since the frontend reloads the list anyway
    return AdminUserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        department=user.department,
        institution=user.institution,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )

@router.put("/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_users", "update"))
):
    target_tenant_id = getattr(current_user, '_tenant_id', None)
    if not target_tenant_id:
        target_tenant_id = data.tenant_id
        
    user = db.query(User).filter(User.id == user_id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if current user has access to this user (must be in same tenant)
    if getattr(current_user, '_tenant_id', None):
        membership = db.query(TenantMembership).filter(
            TenantMembership.user_id == user.id, 
            TenantMembership.tenant_id == target_tenant_id
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Not authorized to edit this user")

    # Update basic fields
    user.full_name = data.full_name
    user.email = data.email
    user.department = data.department
    user.institution = data.institution
    user.is_active = data.is_active
    
    if data.password:
        user.hashed_password = get_password_hash(data.password)
    
    membership = db.query(TenantMembership).filter(
        TenantMembership.user_id == user.id, 
        TenantMembership.tenant_id == target_tenant_id
    ).first()
    if membership:
        membership.is_active = data.is_active
        
    # Check if role belongs to tenant
    if data.role_id:
        role = db.query(Role).filter(Role.id == data.role_id, Role.tenant_id == target_tenant_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Invalid role for this tenant")

    # Re-assign roles
    if data.role_id:
        db.query(UserRoleAssignment).filter(
            UserRoleAssignment.user_id == user.id,
            UserRoleAssignment.tenant_id == target_tenant_id
        ).delete()
        
        if not data.site_ids:
            db.add(UserRoleAssignment(user_id=user.id, tenant_id=target_tenant_id, role_id=data.role_id, site_id=None))
        else:
            for sid in set(data.site_ids):
                db.add(UserRoleAssignment(user_id=user.id, tenant_id=target_tenant_id, role_id=data.role_id, site_id=sid))
                
    db.commit()
    
    return AdminUserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        department=user.department,
        institution=user.institution,
        is_active=user.is_active,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )
