import asyncio
from app.database import SessionLocal
from app.models import Role, RolePermission

db = SessionLocal()
role = db.query(Role).filter_by(id=12).first()
if role:
    print(f"Role 12: {role.name}, perms: {[p.resource for p in role.permissions]}")
    # Add finance permission manually
    new_perm = RolePermission(role_id=12, resource='finance_invoices', can_read=True)
    db.add(new_perm)
    db.commit()
    print("Added perm")
else:
    print("Role 12 not found")
