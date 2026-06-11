import asyncio
from app.database import SessionLocal
from app.models import Role, RolePermission

db = SessionLocal()
role = db.query(Role).filter_by(id=12).first()
if role:
    # Update or create finance_invoices
    inv_perm = db.query(RolePermission).filter_by(role_id=12, resource='finance_invoices').first()
    if not inv_perm:
        inv_perm = RolePermission(role_id=12, resource='finance_invoices')
        db.add(inv_perm)
    inv_perm.can_read = True
    inv_perm.can_create = True
    inv_perm.can_update = True
    inv_perm.can_delete = True

    # Update or create report_finance
    rep_perm = db.query(RolePermission).filter_by(role_id=12, resource='report_finance').first()
    if not rep_perm:
        rep_perm = RolePermission(role_id=12, resource='report_finance')
        db.add(rep_perm)
    rep_perm.can_read = True

    db.commit()
    print("Successfully granted all Finance permissions to Admin role!")
else:
    print("Role 12 not found")
