"""Minimal seed: creates only a platform super-admin so the system can be bootstrapped via UI."""
import os
from sqlalchemy.orm import Session
from app.models import User
from app.auth import get_password_hash


def seed_database(db: Session):
    from app.models import Role, RolePermission
    # Always sync equipment permissions for existing roles
    roles = db.query(Role).all()
    for r in roles:
        grn_perm = db.query(RolePermission).filter_by(role_id=r.id, resource='grn').first()
        mat_perm = db.query(RolePermission).filter_by(role_id=r.id, resource='materials').first()
        eq_perm = db.query(RolePermission).filter_by(role_id=r.id, resource='equipment').first()
        should_have_eq = (grn_perm and grn_perm.can_read) or (mat_perm and mat_perm.can_read) or any(k in (r.name or '') for k in ['Admin', 'Store', 'Manager', 'CEO', 'Head'])
        if should_have_eq and not eq_perm:
            db.add(RolePermission(
                role_id=r.id,
                resource='equipment',
                can_read=True,
                can_create=True,
                can_update=True,
                can_delete=True,
                extended_actions={'can_update_serial': True, 'can_install': True}
            ))
    db.commit()

    if db.query(User).count() > 0:
        return  # already bootstrapped

    superadmin_password = os.getenv("SUPERADMIN_PASSWORD")
    if not superadmin_password:
        raise RuntimeError("SUPERADMIN_PASSWORD environment variable is not set. Refusing to seed.")

    print("Creating platform super-admin …")
    db.add(User(
        username="superadmin",
        email="super@nissigrid.com",
        full_name="Super Admin",
        hashed_password=get_password_hash(superadmin_password),
        is_platform_admin=True,
    ))
    db.commit()
    print("Done — log in at /platform/login with superadmin and your configured SUPERADMIN_PASSWORD")

