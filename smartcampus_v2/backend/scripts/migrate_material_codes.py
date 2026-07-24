import os
import sys
import re
sys.path.append('/home/ngadmin/smartcampus_v1/backend')
from app.database import SessionLocal
from app.models import Material, Category, DocumentSequence

db = SessionLocal()

materials = db.query(Material).all()
categories = db.query(Category).all()

# Map of category_id -> prefix
cat_prefix_map = {}
for c in categories:
    cat_prefix_map[c.id] = c.material_code_prefix if c.material_code_prefix else 'MAT'

# Step 1: Find the max sequence number currently used for each category based on reference_no
max_seq_map = {}
for c in categories:
    max_seq_map[c.id] = 0

for m in materials:
    if m.reference_no:
        match = re.search(r'\d+', m.reference_no)
        if match:
            num = int(match.group())
            if num > max_seq_map.get(m.category_id, 0):
                max_seq_map[m.category_id] = num

# Step 2: Assign new codes and update sequences
for c_id, max_num in max_seq_map.items():
    print(f"Category {c_id} ({cat_prefix_map.get(c_id)}) max ref sequence: {max_num}")

# Keep track of running counters for new items that don't have reference_no or digits in it
running_counters = dict(max_seq_map)

updated_count = 0
for m in materials:
    prefix = cat_prefix_map.get(m.category_id, 'MAT')
    new_code = None
    
    if m.reference_no:
        match = re.search(r'\d+', m.reference_no)
        if match:
            num = int(match.group())
            new_code = f"{prefix}-{num:05d}"
    
    if not new_code:
        running_counters[m.category_id] = running_counters.get(m.category_id, 0) + 1
        new_code = f"{prefix}-{running_counters[m.category_id]:05d}"
        
    if m.code != new_code:
        # print(f"Updating ID: {m.id}, Old Code: {m.code}, Ref: {m.reference_no}, New Code: {new_code}")
        m.code = new_code
        updated_count += 1

print(f"Updated {updated_count} materials.")

# Step 3: Update or create DocumentSequence entries so future inserts get the correct next number
for c_id, current_max in running_counters.items():
    cat = db.query(Category).get(c_id)
    if not cat: continue
    
    doc_type = f"MATERIAL_{c_id}"
    tenant_id = cat.tenant_id
    site_id = cat.site_id
    prefix = cat.material_code_prefix if cat.material_code_prefix else 'MAT'
    
    seq = db.query(DocumentSequence).filter_by(
        tenant_id=tenant_id, site_id=site_id, document_type=doc_type
    ).first()
    
    if not seq:
        seq = DocumentSequence(
            tenant_id=tenant_id,
            site_id=site_id,
            document_type=doc_type,
            prefix=prefix,
            current_number=current_max
        )
        db.add(seq)
    else:
        seq.current_number = max(seq.current_number, current_max)
        seq.prefix = prefix

db.commit()
print("Database updated and sequences synced.")
