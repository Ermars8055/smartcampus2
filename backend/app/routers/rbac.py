"""RBAC routes: Manage Roles and Permissions."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Role, RolePermission, ApprovalFlow, UserRoleAssignment
from app.schemas import RoleCreate, RoleOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api/rbac", tags=["RBAC"])


def _build_role_out(role, db, tenant_id, site_id):
    """Build RoleOut dict with permissions and workflow_rules."""
    data = {
        "id": role.id,
        "name": role.name,
        "code": role.code,
        "description": role.description,
        "tenant_id": role.tenant_id,
        "permissions": [
            {
                "id": p.id,
                "resource": p.resource,
                "can_read": p.can_read,
                "can_create": p.can_create,
                "can_update": p.can_update,
                "can_delete": p.can_delete,
            }
            for p in (role.permissions or [])
        ],
        "workflow_rules": [],
    }
    # Fetch approval flows linked to this role name
    if tenant_id and site_id:
        flows = (
            db.query(ApprovalFlow)
            .filter(
                ApprovalFlow.tenant_id == tenant_id,
                ApprovalFlow.site_id == site_id,
                ApprovalFlow.role_name == role.name,
                ApprovalFlow.is_active == True,
            )
            .order_by(ApprovalFlow.level)
            .all()
        )
        data["workflow_rules"] = [
            {
                "id": f.id,
                "document_type": f.document_type,
                "level": f.level,
                "min_amount": f.min_amount,
                "max_amount": f.max_amount,
                "user_id": f.user_id,
                "is_active": f.is_active,
            }
            for f in flows
        ]
    return data


@router.get("/roles", response_model=List[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
):
    if tenant_id is None:
        roles = db.query(Role).all()
    else:
        roles = db.query(Role).filter(Role.tenant_id == tenant_id).all()
    return [_build_role_out(r, db, tenant_id, site_id) for r in roles]


@router.get("/roles/{id}")
def get_role(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
):
    role = db.query(Role).filter(Role.id == id, Role.tenant_id == tenant_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return _build_role_out(role, db, tenant_id, site_id)


@router.post("/roles", response_model=RoleOut)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
):
    if tenant_id is None:
        raise HTTPException(status_code=400, detail="Super Admins cannot create tenant roles this way.")

    role = Role(
        name=data.name,
        code=data.code,
        description=data.description,
        tenant_id=tenant_id,
    )
    db.add(role)
    db.flush()

    # Permissions
    for perm_data in data.permissions:
        perm = RolePermission(
            role_id=role.id,
            resource=perm_data.resource,
            can_read=perm_data.can_read,
            can_create=perm_data.can_create,
            can_update=perm_data.can_update,
            can_delete=perm_data.can_delete,
        )
        db.add(perm)

    # Workflow rules (approval flows)
    if site_id:
        for rule in data.workflow_rules:
            flow = ApprovalFlow(
                tenant_id=tenant_id,
                site_id=site_id,
                document_type=rule.document_type,
                level=rule.level,
                role_name=data.name,
                min_amount=rule.min_amount,
                max_amount=rule.max_amount,
                user_id=rule.user_id,
                is_active=rule.is_active,
            )
            db.add(flow)

    db.commit()
    db.refresh(role)
    return _build_role_out(role, db, tenant_id, site_id)


@router.put("/roles/{id}", response_model=RoleOut)
def update_role(
    id: int,
    data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
):
    role = db.query(Role).filter(Role.id == id, Role.tenant_id == tenant_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    old_name = role.name
    role.name = data.name
    role.code = data.code
    role.description = data.description

    # Replace permissions
    db.query(RolePermission).filter(RolePermission.role_id == id).delete()
    for perm_data in data.permissions:
        perm = RolePermission(
            role_id=role.id,
            resource=perm_data.resource,
            can_read=perm_data.can_read,
            can_create=perm_data.can_create,
            can_update=perm_data.can_update,
            can_delete=perm_data.can_delete,
        )
        db.add(perm)

    # Replace workflow rules for this role
    if site_id:
        db.query(ApprovalFlow).filter(
            ApprovalFlow.tenant_id == tenant_id,
            ApprovalFlow.site_id == site_id,
            ApprovalFlow.role_name == old_name,
        ).delete()
        for rule in data.workflow_rules:
            flow = ApprovalFlow(
                tenant_id=tenant_id,
                site_id=site_id,
                document_type=rule.document_type,
                level=rule.level,
                role_name=data.name,
                min_amount=rule.min_amount,
                max_amount=rule.max_amount,
                user_id=rule.user_id,
                is_active=rule.is_active,
            )
            db.add(flow)

    db.commit()
    db.refresh(role)
    return _build_role_out(role, db, tenant_id, site_id)


@router.delete("/roles/{id}")
def delete_role(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "delete")),
    tenant_id: int = Depends(get_tenant_id),
):
    role = db.query(Role).filter(Role.id == id, Role.tenant_id == tenant_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check if role is used
    assigned = (
        db.query(UserRoleAssignment)
        .filter(UserRoleAssignment.role_id == id)
        .first()
    )
    if assigned:
        raise HTTPException(status_code=400, detail="Cannot delete role assigned to active users.")

    db.delete(role)
    db.commit()
    return {"detail": "Role deleted"}
