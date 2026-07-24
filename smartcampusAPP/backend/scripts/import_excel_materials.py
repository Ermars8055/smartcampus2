import sys
import os
import pandas as pd
import random
import math

# Add the current directory to sys.path if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Category, SubCategory, UOM, Material, Warehouse, CurrentStock, StockLedger, TransactionType
from sqlalchemy.orm import Session

def get_realistic_estimates(category_name, uom_name, material_name):
    cat = str(category_name).upper() if pd.notna(category_name) else ""
    uom = str(uom_name).upper() if pd.notna(uom_name) else ""
    mat_name = str(material_name).upper() if pd.notna(material_name) else ""
    
    # Base Cost Guesses
    cost = 100.0
    if "PAINT" in cat or "CIVIL" in cat:
        if "LIT" in uom:
            cost = random.uniform(200, 450)
        elif "CAN" in uom:
            cost = random.uniform(1500, 4500)
        else:
            cost = random.uniform(500, 1500)
    elif "HOSP" in cat or "EQPT" in cat or "INSTRUMENT" in cat:
        cost = random.uniform(5000, 50000)
    elif "LAB" in cat:
        cost = random.uniform(500, 5000)
    elif "STATIONERY" in cat:
        cost = random.uniform(10, 500)
    elif "LINEN" in cat:
        cost = random.uniform(200, 2000)
    else:
        cost = random.uniform(50, 5000)
        
    cost = round(cost, 2)
    
    # Reorder Level Guesses
    if cost > 10000:
        reorder = random.randint(2, 5) # Expensive items, keep low stock
    elif cost > 1000:
        reorder = random.randint(10, 50)
    else:
        reorder = random.randint(50, 500)
        
    max_level = math.ceil(reorder * random.uniform(2.0, 4.0))
    
    return cost, float(reorder), float(max_level)

def get_store_for_category(category_name, store_map):
    cat = str(category_name).upper() if pd.notna(category_name) else ""
    if "CIVIL" in cat:
        return store_map.get("Main Civil Store")
    elif "HOSP" in cat or "LAB" in cat or "EQPT" in cat or "INSTRUMENT" in cat:
        return store_map.get("Central Warehouse")
    elif "STATIONERY" in cat:
        return store_map.get("Stationary Store")
    elif "IT" in cat:
        return store_map.get("Central Warehouse")
    elif "HOUSE" in cat or "LINEN" in cat:
        return store_map.get("Consumables Store")
    
    # fallback
    return store_map.get("Central Warehouse") or list(store_map.values())[0]

def import_materials_from_excel(file_path):
    print(f"Reading file: {file_path}")
    df = pd.read_excel(file_path)
    
    db: Session = SessionLocal()
    tenant_id = 3
    site_id = 3
    user_id = 4 # Default admin user in GRInfra
    
    print(f"Importing materials for Tenant {tenant_id}, Site {site_id}...")

    # Load existing lookups
    categories = db.query(Category).filter_by(tenant_id=tenant_id, site_id=site_id).all()
    cat_map = {c.name.strip().upper(): c for c in categories}
    
    subcategories = db.query(SubCategory).filter_by(tenant_id=tenant_id, site_id=site_id).all()
    sub_map = {f"{s.category_id}_{s.name.strip().upper()}": s for s in subcategories}
    
    uoms = db.query(UOM).filter_by(tenant_id=tenant_id, site_id=site_id).all()
    uom_map = {u.name.strip().upper(): u for u in uoms}
    
    warehouses = db.query(Warehouse).filter_by(tenant_id=tenant_id, site_id=site_id).all()
    store_map = {w.name: w.id for w in warehouses}
    if not store_map:
        print("No warehouses found. Cannot seed stock.")
        return

    # Generate Material Code sequence
    existing_materials = db.query(Material).filter_by(tenant_id=tenant_id, site_id=site_id).all()
    mat_codes = [m.code for m in existing_materials if m.code and m.code.startswith("MAT-")]
    max_code = 0
    for code in mat_codes:
        try:
            num = int(code.split("-")[1])
            if num > max_code:
                max_code = num
        except:
            pass

    materials_to_add = []
    
    for index, row in df.iterrows():
        # Read columns with safe fallback
        name = row.get("Material Name")
        if pd.isna(name) or not str(name).strip():
            continue
        
        name_full = str(name).strip()
        name = name_full[:250]
        alias = str(row.get("Material Alias")) if pd.notna(row.get("Material Alias")) else None
        ref_no = str(row.get("Material Reference No.")) if pd.notna(row.get("Material Reference No.")) else None
        cat_name = str(row.get("Material Category")).strip() if pd.notna(row.get("Material Category")) else ""
        sub_name = str(row.get("Material SubCategory")).strip() if pd.notna(row.get("Material SubCategory")) else ""
        uom_name = str(row.get("UOM")).strip() if pd.notna(row.get("UOM")) else "Numbers"
        mat_type = str(row.get("Material Type ")).strip() if pd.notna(row.get("Material Type ")) else "Consumable"
        
        gst_raw = row.get("GST Rate%")
        gst_rate = 18.0
        if pd.notna(gst_raw):
            try:
                gst_rate = float(gst_raw) * 100 if float(gst_raw) < 1 else float(gst_raw)
            except:
                pass
                
        desc = str(row.get("Description")).strip() if pd.notna(row.get("Description")) else ""
        if len(name_full) > 250:
            desc = name_full + " " + desc

        # Resolve Category
        cat_key = cat_name.upper()
        if cat_key not in cat_map:
            # create category if missing
            max_seq = len(cat_map) + 1
            new_cat_code = f"CAT-EXCEL-{str(max_seq).zfill(4)}"
            category = Category(tenant_id=tenant_id, site_id=site_id, name=cat_name, code=new_cat_code, description=f"Imported Category: {cat_name}")
            db.add(category)
            db.flush()
            cat_map[cat_key] = category
        category = cat_map[cat_key]

        # Resolve SubCategory
        subcategory = None
        if sub_name:
            sub_key = f"{category.id}_{sub_name.upper()}"
            if sub_key in sub_map:
                subcategory = sub_map[sub_key]
            else:
                # create subcategory if missing
                subcategory = SubCategory(tenant_id=tenant_id, site_id=site_id, name=sub_name, category_id=category.id)
                db.add(subcategory)
                db.flush()
                sub_map[sub_key] = subcategory

        # Resolve UOM
        uom_key = uom_name.upper()
        if uom_key not in uom_map:
            # create UOM if missing
            new_uom = UOM(tenant_id=tenant_id, site_id=site_id, name=uom_name, abbreviation=uom_name[:3].upper())
            db.add(new_uom)
            db.flush()
            uom_map[uom_key] = new_uom
        uom = uom_map[uom_key]
        
        # Realistic Estimations
        cost, reorder, max_lvl = get_realistic_estimates(cat_name, uom_name, name)
        store_id = get_store_for_category(cat_name, store_map)

        max_code += 1
        mat_code = f"MAT-{str(max_code).zfill(5)}"
        
        # Create Material
        material = Material(
            tenant_id=tenant_id,
            site_id=site_id,
            code=mat_code,
            name=name,
            alias=alias,
            reference_no=ref_no,
            category_id=category.id,
            subcategory_id=subcategory.id if subcategory else None,
            uom_id=uom.id,
            reorder_level=reorder,
            maximum_level=max_lvl,
            standard_cost=cost,
            storage_type="Covered",
            hsn_code=None, # Explicitly requested blank
            gst_rate=gst_rate,
            material_type=mat_type,
            warehouse_id=store_id,
            description=desc
        )
        db.add(material)
        db.flush()
        
        # --- Stock Seeding ---
        # "include stock also with both less and higher stocks"
        # 20% chance of low stock (below reorder), 80% chance of healthy stock
        is_low_stock = random.random() < 0.20
        if is_low_stock:
            stock_qty = float(random.randint(1, max(1, int(reorder) - 1)))
        else:
            stock_qty = float(random.randint(int(reorder) + 1, int(max_lvl)))
            
        # Add Current Stock
        db.add(CurrentStock(
            tenant_id=tenant_id, 
            site_id=site_id, 
            material_id=material.id, 
            warehouse_id=store_id, 
            quantity=stock_qty
        ))
        
        # Add Ledger Entry
        db.add(StockLedger(
            tenant_id=tenant_id, 
            site_id=site_id, 
            material_id=material.id, 
            warehouse_id=store_id, 
            transaction_type=TransactionType.ADJUSTMENT.value, 
            quantity=stock_qty, 
            balance=stock_qty, 
            reference_type="Opening Balance", 
            reference_number="OB-EXCEL", 
            remarks="Initial seed from Excel upload", 
            created_by_id=user_id
        ))

        materials_to_add.append(material)

    db.commit()
    print(f"Successfully imported {len(materials_to_add)} materials with stock levels from Excel!")
    db.close()

if __name__ == "__main__":
    file_path = "/home/ngadmin/Downloads/Material Master to Upload.xlsx"
    import_materials_from_excel(file_path)
