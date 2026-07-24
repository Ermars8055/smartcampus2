import os
import sys
sys.path.append('/home/ngadmin/smartcampus_v1/backend')
from app.database import SessionLocal
from app.models import Material, Category

db = SessionLocal()
mats = db.query(Material).filter(Material.reference_no != None, Material.reference_no != '').all()
print(f"Total materials with reference no: {len(mats)}")
for m in mats[:20]:
    cat_prefix = m.category.material_code_prefix if m.category else 'NONE'
    print(f"ID: {m.id}, Code: {m.code}, Ref: {m.reference_no}, Cat: {m.category.name if m.category else 'NONE'}, CatPrefix: {cat_prefix}")
