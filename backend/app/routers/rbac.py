"""RBAC routes: Manage Roles and Permissions."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Role, RolePermission
from app.schemas import RoleCreate, RoleOut
from app.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/rbac", tags=["RBAC"])

@router.get("/roles", response_model=List[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "read"))
):
    tenant_id = getattr(current_user, '_tenant_id', None)
    if tenant_id is None:
        return db.query(Role).all()
    return db.query(Role).filter(Role.tenant_id == tenant_id).all()

@router.post("/roles", response_model=RoleOut)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "create"))
):
    tenant_id = getattr(current_user, '_tenant_id', None)
    if tenant_id is None:
        raise HTTPException(status_code=400, detail="Super Admins cannot create tenant roles this way.")
        
    role = Role(
        name=data.name,
        code=data.code,
        description=data.description,
        tenant_id=tenant_id
    )
    db.add(role)
    db.flush()
    
    for perm_data in data.permissions:
        perm = RolePermission(
            role_id=role.id,
            resource=perm_data.resource,
            can_read=perm_data.can_read,
            can_create=perm_data.can_create,
            can_update=perm_data.can_update,
            can_delete=perm_data.can_delete
        )
        db.add(perm)
        
    db.commit()
    db.refresh(role)
    return role

@router.put("/roles/{id}", response_model=RoleOut)
def update_role(
    id: int,
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "update"))
):
    tenant_id = getattr(current_user, '_tenant_id', None)
    role = db.query(Role).filter(
        Role.id == id,
        Role.tenant_id == tenant_id
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    role.name = data.name
    role.code = data.code
    role.description = data.description
    
    # Simple approach: clear old permissions and add new ones
    db.query(RolePermission).filter(RolePermission.role_id == id).delete()
    
    for perm_data in data.permissions:
        perm = RolePermission(
            role_id=role.id,
            resource=perm_data.resource,
            can_read=perm_data.can_read,
            can_create=perm_data.can_create,
            can_update=perm_data.can_update,
            can_delete=perm_data.can_delete
        )
        db.add(perm)
        
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{id}")
def delete_role(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "delete"))
):
    tenant_id = getattr(current_user, '_tenant_id', None)
    role = db.query(Role).filter(
        Role.id == id,
        Role.tenant_id == tenant_id
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    # Check if role is used
    if db.query(User).filter(User.role_id == id, User.is_deleted == False).first():
        raise HTTPException(status_code=400, detail="Cannot delete role assigned to active users.")
        
    db.delete(role)
    db.commit()
    return {"detail": "Role deleted"}
