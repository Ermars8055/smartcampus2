"""SaaS Super Admin routes: Manage tenants and global settings."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Tenant, User, Site, Role, RolePermission, UserRoleAssignment, TenantMembership
from app.schemas import TenantCreate, TenantOut, TenantProvisionCreate, UserCreate, UserOut, TenantDetailsOut
from app.auth import get_current_user, require_platform_admin, get_password_hash

router = APIRouter(prefix="/api/admin/saas", tags=["SaaS Admin"])

ADMIN_RESOURCES = {
    "dashboard": [],
    "materials": [],
    "categories": [],
    "subcategories": [],
    "uom": [],
    "vendors": [],
    "warehouses": [],
    "indents": ["can_approve", "can_reject", "can_convert_to_po", "can_acknowledge"],
    "purchase_requests": ["can_submit", "can_approve", "can_reject", "can_convert_to_po", "can_hold", "can_short_close"],
    "quotations": ["can_send_to_vendors", "can_receive", "can_enter_quotes", "can_compare", "can_approve", "can_convert_to_po"],
    "purchase_orders": ["can_approve", "can_reject", "can_hold", "can_send_to_vendor", "can_short_close"],
    "gate_entry": ["can_record_entry", "can_verify"],
    "invoice": ["can_register", "can_approve", "can_reject", "can_print"],
    "grn": ["can_create_grn", "can_complete"],
    "issues": ["can_issue", "can_direct_issue", "can_print"],
    "returns": ["can_return", "receive"],
    "transfers": ["can_transfer"],
    "gate_passes": ["can_create", "can_print"],
    "write_offs": ["can_create", "can_submit", "can_approve", "can_reject"],
    "acknowledgements": ["can_acknowledge"],
    "inventory": [],
    "complaints": [],
    "intelligence": [],
    "finance_invoices": ["can_send_hard_copy", "can_receive_hard_copy", "can_send_for_payment", "can_mark_paid"],
    "reports": [],
    "report_issue_summary": [],
    "report_rate_analysis": [],
    "report_receipt_summary": [],
    "report_dept_inventory": [],
    "report_finance": [],
    "report_pending_gatepass": [],
    "admin_users": [],
    "admin_roles": [],
    "audit_logs": [],
    "approval_flows": [],
    "material_allowances": [],
    "configurations": [],
    "projects": [],
    "organizations": [],
    "departments": [],
    "company_addresses": [],
    "terms": [],
    "buildings": [],
    "alerts": []
}


def create_admin_role(db: Session, tenant_id: int) -> Role:
    role = Role(
        tenant_id=tenant_id, 
        name="Admin", 
        code="admin", 
        description="Full tenant access",
        data_access_scope="Full Administrative Access"
    )
    db.add(role)
    db.flush()
    for resource, ext_actions in ADMIN_RESOURCES.items():
        extended_actions_dict = {action: True for action in ext_actions}
        db.add(RolePermission(
            role_id=role.id,
            resource=resource,
            can_read=True,
            can_create=True,
            can_update=True,
            can_delete=True,
            extended_actions=extended_actions_dict
        ))
    return role


@router.get("/tenants", response_model=List[TenantOut])
def list_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin())
):
    return db.query(Tenant).order_by(Tenant.name).all()


@router.post("/tenants", response_model=TenantOut)
def create_tenant(
    data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin())
):
    import re
    base_slug = re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-')
    
    tenant = Tenant(
        name=data.name,
        slug=base_slug,
        subscription_plan=data.subscription_type,
        status="Active" if data.is_active else "Suspended",
        max_sites=5 if data.subscription_type == "multi_site" else 1
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.post("/tenants/provision")
def provision_tenant(
    data: TenantProvisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin())
):
    existing_user = db.query(User).filter(
        (User.username == data.admin.username) | (User.email == data.admin.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin username or email already exists")

    # Generate a slug from the tenant name
    import re
    base_slug = re.sub(r'[^a-z0-9]+', '-', data.tenant.name.lower()).strip('-')
    
    tenant = Tenant(
        name=data.tenant.name,
        slug=base_slug,
        subscription_plan=data.tenant.subscription_type,
        status="Active" if data.tenant.is_active else "Suspended",
        max_sites=5 if data.tenant.subscription_type == "multi_site" else 1
    )
    db.add(tenant)
    db.flush()

    site = Site(
        tenant_id=tenant.id,
        name=data.site.name,
        location=data.site.location,
        is_active=data.site.is_active,
    )
    db.add(site)
    db.flush()

    admin_role = create_admin_role(db, tenant.id)
    admin = User(
        username=data.admin.username,
        email=data.admin.email,
        full_name=data.admin.full_name,
        hashed_password=get_password_hash(data.admin.password),
    )
    db.add(admin)
    db.flush()
    db.add(TenantMembership(user_id=admin.id, tenant_id=tenant.id))
    db.add(UserRoleAssignment(user_id=admin.id, tenant_id=tenant.id, role_id=admin_role.id, site_id=site.id))

    db.commit()
    db.refresh(tenant)
    db.refresh(site)
    db.refresh(admin)
    return {
        "tenant": tenant,
        "site": site,
        "admin": admin,
        "login_hint": {
            "username": admin.username,
            "tenant": tenant.name,
            "site": site.name,
        }
    }
@router.get("/tenants/{id}/details", response_model=TenantDetailsOut)
def get_tenant_details(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin())
):
    tenant = db.query(Tenant).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    site = db.query(Site).filter(Site.tenant_id == id).first()
    
    # Get the admin role for this tenant
    admin_role = db.query(Role).filter(Role.tenant_id == id, Role.code == "admin").first()
    
    # Get the user assigned to this admin role
    admin_user = None
    if admin_role:
        assignment = db.query(UserRoleAssignment).filter(
            UserRoleAssignment.tenant_id == id,
            UserRoleAssignment.role_id == admin_role.id
        ).first()
        if assignment:
            admin_user = db.query(User).filter(User.id == assignment.user_id).first()
            
    # Fallback to just getting a user linked to this tenant if admin_role/assignment missing
    if not admin_user:
        membership = db.query(TenantMembership).filter(TenantMembership.tenant_id == id).first()
        if membership:
            admin_user = db.query(User).filter(User.id == membership.user_id).first()
            
    if not site or not admin_user:
        raise HTTPException(status_code=404, detail="Tenant site or admin not found")
        
    return {
        "tenant": tenant,
        "site": site,
        "admin": admin_user
    }


@router.put("/tenants/{id}", response_model=TenantOut)
def update_tenant(
    id: int,
    data: TenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin())
):
    tenant = db.query(Tenant).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant.name = data.name
    tenant.subscription_plan = data.subscription_type
    tenant.status = "Active" if data.is_active else "Suspended"
    tenant.max_sites = 5 if data.subscription_type == "multi_site" else 1
        
    db.commit()
    db.refresh(tenant)
    return tenant


@router.post("/tenants/{id}/admin", response_model=UserOut)
def create_tenant_admin(
    id: int,
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_platform_admin())
):
    tenant = db.query(Tenant).filter(Tenant.id == id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role="Admin",
        tenant_id=id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
