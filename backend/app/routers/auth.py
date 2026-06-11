"""Auth router with workspace-based login (like OHC NG)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models import User, Tenant, TenantMembership, Role, RolePermission, UserRoleAssignment, Site, DataAccessScope
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.models import AuditLog

SCOPE_RANKS = {
    "Self Only": 1,
    "Department": 2,
    "Organization": 3,
    "Full Administrative Access": 4
}

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str
    workspace: Optional[str] = None  # tenant slug

class RegisterRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.get("/workspaces")
def list_workspaces(db: Session = Depends(get_db)):
    """Public endpoint: list available workspace slugs for login dropdown."""
    tenants = db.query(Tenant).filter(Tenant.status == "Active").all()
    return [{"slug": t.slug, "name": t.name} for t in tenants]

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username, User.is_deleted == False).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Account disabled")

    # Platform admin login (no workspace needed)
    if user.is_platform_admin and not request.workspace:
        token = create_access_token({
            "sub": user.username, "is_platform_admin": True,
            "tenant_id": None, "site_ids": [], "roles": [], "permissions": {},
            "data_access_scope": "Full Administrative Access"
        })
        db.add(AuditLog(user_id=user.id, action="LOGIN", entity_type="User", entity_id=user.id))
        db.commit()
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_platform_admin": True
            },
            "tenant": None,
            "sites": [],
            "roles": ["PLATFORM_ADMIN"],
            "permissions": {},
            "data_access_scope": "Full Administrative Access"
        }

    # Workspace required for non-platform-admins
    if not request.workspace:
        raise HTTPException(400, "Workspace ID is required")

    tenant = db.query(Tenant).filter(Tenant.slug == request.workspace.lower()).first()
    if not tenant:
        raise HTTPException(404, "Workspace not found")
    if tenant.status != "Active":
        raise HTTPException(403, "Workspace is suspended")

    membership = db.query(TenantMembership).filter_by(
        user_id=user.id, tenant_id=tenant.id, is_active=True
    ).first()
    if not membership:
        raise HTTPException(403, "No access to this workspace")

    # Fetch role assignments + permissions
    assignments = db.query(UserRoleAssignment).filter_by(
        user_id=user.id, tenant_id=tenant.id
    ).all()
    if not assignments:
        raise HTTPException(403, "No roles assigned in this workspace")

    roles = []
    site_ids = []
    permissions = {}
    highest_scope_val = 0
    data_access_scope = "Self Only"
    
    for a in assignments:
        if a.role:
            roles.append(a.role.code)
            roles.append(a.role.name)
            scope = a.role.data_access_scope or "Self Only"
            if SCOPE_RANKS.get(scope, 1) > highest_scope_val:
                highest_scope_val = SCOPE_RANKS.get(scope, 1)
                data_access_scope = scope
            for p in a.role.permissions:
                if p.resource not in permissions:
                    permissions[p.resource] = {"can_read": False, "can_create": False, "can_update": False, "can_delete": False, "extended_actions": {}}
                if p.can_read: permissions[p.resource]["can_read"] = True
                if p.can_create: permissions[p.resource]["can_create"] = True
                if p.can_update: permissions[p.resource]["can_update"] = True
                if p.can_delete: permissions[p.resource]["can_delete"] = True
                # Merge extended actions (OR across roles)
                if p.extended_actions:
                    for action_key, action_val in p.extended_actions.items():
                        if action_key not in permissions[p.resource]["extended_actions"]:
                            permissions[p.resource]["extended_actions"][action_key] = action_val
                        else:
                            permissions[p.resource]["extended_actions"][action_key] = permissions[p.resource]["extended_actions"][action_key] or action_val
        if a.site_id and a.site_id not in site_ids:
            site_ids.append(a.site_id)

    # If no site_ids from assignments, give access to all tenant sites
    if not site_ids:
        all_sites = db.query(Site).filter_by(tenant_id=tenant.id, is_active=True).all()
        site_ids = [s.id for s in all_sites]

    roles = list(set(roles))
    active_site_id = site_ids[0] if site_ids else None

    # Build site info for frontend
    sites_info = []
    if site_ids:
        sites_db = db.query(Site).filter(Site.id.in_(site_ids)).all()
        sites_info = [{"id": s.id, "name": s.name, "location": s.location} for s in sites_db]

    token = create_access_token({
        "sub": user.username,
        "tenant_id": tenant.id,
        "site_ids": site_ids,
        "active_site_id": active_site_id,
        "roles": roles,
        "permissions": permissions,
        "is_platform_admin": user.is_platform_admin,
        "data_access_scope": data_access_scope
    })

    db.add(AuditLog(tenant_id=tenant.id, user_id=user.id, action="LOGIN", entity_type="User", entity_id=user.id))
    db.commit()

    return {
        "access_token": token, "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "email": user.email, "full_name": user.full_name},
        "tenant": {"id": tenant.id, "name": tenant.name, "slug": tenant.slug},
        "sites": sites_info,
        "active_site_id": active_site_id,
        "roles": roles,
        "permissions": permissions,
        "data_access_scope": data_access_scope
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tid = getattr(current_user, '_tenant_id', None)
    sites_info = []
    tenant_info = None
    
    roles = getattr(current_user, '_roles', [])
    permissions = getattr(current_user, '_permissions', {})
    data_access_scope = getattr(current_user, '_data_access_scope', "Self Only")

    if tid:
        tenant = db.query(Tenant).filter_by(id=tid).first()
        if tenant:
            tenant_info = {"id": tenant.id, "name": tenant.name, "slug": tenant.slug}
        site_ids = getattr(current_user, '_site_ids', [])
        if site_ids:
            sites_db = db.query(Site).filter(Site.id.in_(site_ids)).all()
            sites_info = [{"id": s.id, "name": s.name, "location": s.location} for s in sites_db]
            
        # Refresh roles and permissions from DB to ensure frontend gets latest updates
        if not getattr(current_user, '_is_platform_admin', False):
            assignments = db.query(UserRoleAssignment).filter_by(
                user_id=current_user.id, tenant_id=tid
            ).all()
            if assignments:
                fresh_roles = []
                fresh_permissions = {}
                highest_scope_val = 0
                
                for a in assignments:
                    if a.role:
                        fresh_roles.append(a.role.code)
                        fresh_roles.append(a.role.name)
                        scope = a.role.data_access_scope or "Self Only"
                        if SCOPE_RANKS.get(scope, 1) > highest_scope_val:
                            highest_scope_val = SCOPE_RANKS.get(scope, 1)
                            data_access_scope = scope
                            
                        for p in a.role.permissions:
                            if p.resource not in fresh_permissions:
                                fresh_permissions[p.resource] = {"can_read": False, "can_create": False, "can_update": False, "can_delete": False, "extended_actions": {}}
                            if p.can_read: fresh_permissions[p.resource]["can_read"] = True
                            if p.can_create: fresh_permissions[p.resource]["can_create"] = True
                            if p.can_update: fresh_permissions[p.resource]["can_update"] = True
                            if p.can_delete: fresh_permissions[p.resource]["can_delete"] = True
                            if p.extended_actions:
                                for action_key, action_val in p.extended_actions.items():
                                    if action_key not in fresh_permissions[p.resource]["extended_actions"]:
                                        fresh_permissions[p.resource]["extended_actions"][action_key] = action_val
                                    else:
                                        fresh_permissions[p.resource]["extended_actions"][action_key] = fresh_permissions[p.resource]["extended_actions"][action_key] or action_val
                roles = list(set(fresh_roles))
                permissions = fresh_permissions

    return {
        "id": current_user.id, "username": current_user.username,
        "email": current_user.email, "full_name": current_user.full_name,
        "is_platform_admin": getattr(current_user, '_is_platform_admin', False),
        "tenant": tenant_info, "sites": sites_info,
        "active_site_id": getattr(current_user, '_active_site_id', None),
        "roles": roles,
        "permissions": permissions,
        "data_access_scope": data_access_scope
    }

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password incorrect")
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password changed"}
