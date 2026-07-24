import sys
sys.path.append('/home/ngadmin/smartcampus_v1/backend')
from app.database import SessionLocal
from app.models import GatePass, GatePassItem

db = SessionLocal()
# Find all gate passes in tenant 1
gps = db.query(GatePass).filter(GatePass.tenant_id == 1).all()
deleted_count = 0
for gp in gps:
    # Check if any item has a material belonging to another tenant
    has_foreign_material = False
    for item in gp.items:
        if item.material and item.material.tenant_id != 1:
            has_foreign_material = True
            break
    if has_foreign_material:
        print(f"Deleting GatePass {gp.gate_pass_number} (id: {gp.id}) because it contains materials from another tenant.")
        db.delete(gp)
        deleted_count += 1

db.commit()
print(f"Deleted {deleted_count} invalid gate passes.")
