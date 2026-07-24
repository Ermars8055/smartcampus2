"""Seed script to append Hospital Material Categories and Subcategories for Tenant 3, Site 3."""
import sys
import os

# Add the current directory to sys.path if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Category, SubCategory
from sqlalchemy.orm import Session

MAPPINGS = {
    "CIVIL": ["PAINTING"],
    "ELECTRICAL": ["ELECTRICAL"],
    "HOSP EQPT": ["GEN", "HOSP EQPT", "IT"],
    "HOSPITAL": [
        "BIOMEDICAL", "CathLab", "CSSD", "Dental", "DIALYSIS CENTRE",
        "ELECTRICAL", "EMD", "EQPT", "GEN", "LINEN", "OT", "PHARMACY",
        "RADIOLOGY", "STATIONERY", "LAB"
    ],
    "INSTRUMENTS": ["LAB"],
    "HOUSE KEEPING": ["GEN", "HSK"],
    "IT": ["IT"],
    "LAB": [
        "BIOCHEMISTRY", "BLOOD BANK", "GEN", "HAEMATOLOGY", "LAB",
        "MICRO BIOLOGY", "PATHOLOGY", "STATIONERY"
    ],
    "LINEN": ["LINEN"],
    "PLUMBING": ["PLUMBING"],
    "RADIOLOGY": ["STATIONERY"],
    "STATIONERY": [
        "BLOOD BANK", "EMD", "GEN", "LAB", "PHARMACY", "STATIONERY"
    ]
}

def seed_hospital_categories():
    db: Session = SessionLocal()
    tenant_id = 3
    site_id = 3

    print(f"Adding Hospital Categories and Subcategories for Tenant {tenant_id}, Site {site_id}...")

    # Fetch existing categories to determine the next code sequence
    existing_categories = db.query(Category).filter_by(tenant_id=tenant_id, site_id=site_id).all()
    category_map = {c.name.lower(): c for c in existing_categories}
    
    max_seq = len(existing_categories)
    
    # Process each category in the MAPPINGS
    for cat_name, subcategories in MAPPINGS.items():
        cat_key = cat_name.lower()
        if cat_key in category_map:
            category = category_map[cat_key]
            print(f"Category already exists: {cat_name} (ID: {category.id})")
        else:
            max_seq += 1
            code = f"CAT-{str(max_seq).zfill(4)}"
            category = Category(
                tenant_id=tenant_id, 
                site_id=site_id, 
                name=cat_name, 
                code=code, 
                description=f"Hospital category: {cat_name}"
            )
            db.add(category)
            db.flush() # flush to get the ID
            category_map[cat_key] = category
            print(f"Added new Category: {cat_name} ({code})")

        # Now add subcategories
        existing_subs = db.query(SubCategory).filter_by(
            tenant_id=tenant_id, 
            site_id=site_id, 
            category_id=category.id
        ).all()
        sub_map = {s.name.lower(): s for s in existing_subs}

        for sub_name in subcategories:
            sub_key = sub_name.lower()
            if sub_key in sub_map:
                print(f"  SubCategory already exists: {sub_name} under {cat_name}")
            else:
                sub_category = SubCategory(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    name=sub_name,
                    category_id=category.id
                )
                db.add(sub_category)
                db.flush()
                sub_map[sub_key] = sub_category
                print(f"  Added new SubCategory: {sub_name} under {cat_name}")

    db.commit()
    print("Hospital Categories and Subcategories seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_hospital_categories()
