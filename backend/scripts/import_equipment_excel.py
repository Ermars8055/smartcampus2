import sys
import os
import datetime
import openpyxl

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import EquipmentItem, Material, LocationMaster, Category, UOM, Warehouse
from sqlalchemy.orm import Session

def get_or_create_material(db: Session, tenant_id: int, site_id: int, mat_name: str, cat_name: str) -> Material:
    mat = db.query(Material).filter_by(tenant_id=tenant_id, site_id=site_id, name=mat_name).first()
    if mat:
        return mat
    
    # Get defaults for required fields
    category = db.query(Category).filter_by(tenant_id=tenant_id, site_id=site_id).first()
    uom = db.query(UOM).filter_by(tenant_id=tenant_id, site_id=site_id).first()
    warehouse = db.query(Warehouse).filter_by(tenant_id=tenant_id, site_id=site_id).first()
    
    if not category or not uom or not warehouse:
        raise Exception("Database missing Category, UOM or Warehouse, cannot create material.")
        
    # Generate next material code
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
            
    new_code = f"MAT-{str(max_code + 1).zfill(5)}"
    
    new_mat = Material(
        tenant_id=tenant_id,
        site_id=site_id,
        code=new_code,
        name=mat_name,
        category_id=category.id,
        uom_id=uom.id,
        reorder_level=1,
        maximum_level=10,
        standard_cost=100.0,
        storage_type="Covered",
        gst_rate=18.0,
        material_type="Equipment",
        warehouse_id=warehouse.id,
        description=f"Auto-created from equipment import: {cat_name}"
    )
    db.add(new_mat)
    db.flush()
    return new_mat

def get_or_create_location(db: Session, tenant_id: int, site_id: int, loc_name: str) -> LocationMaster:
    loc = db.query(LocationMaster).filter_by(tenant_id=tenant_id, site_id=site_id, location_name=loc_name).first()
    if loc:
        return loc
    
    loc_code = str(loc_name).replace(" ", "_").upper()[:50]
    # Handle duplicate codes if any by querying first
    loc_by_code = db.query(LocationMaster).filter_by(tenant_id=tenant_id, location_code=loc_code).first()
    if loc_by_code:
        return loc_by_code
        
    new_loc = LocationMaster(
        tenant_id=tenant_id,
        site_id=site_id,
        location_name=loc_name,
        location_code=loc_code,
        is_active=True
    )
    db.add(new_loc)
    db.flush()
    return new_loc

def safe_str(val):
    if val is None or str(val).strip() == "" or str(val).strip().upper() == "NA":
        return None
    return str(val).strip()

def safe_date(val):
    if val is None or str(val).strip() == "" or str(val).strip().upper() == "NA":
        return None
    if isinstance(val, datetime.datetime):
        return val.date()
    return None

def import_equipment(file_path: str):
    print(f"Reading file: {file_path}")
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
    except Exception as e:
        print(f"Failed to open excel file: {e}")
        return
        
    sheet = wb.active
    headers = [cell.value for cell in sheet[1]]
    
    db: Session = SessionLocal()
    tenant_id = 2
    site_id = 2
    
    # Get a default warehouse
    warehouse = db.query(Warehouse).filter_by(tenant_id=tenant_id, site_id=site_id).first()
    
    added_count = 0
    skipped_count = 0
    
    for row in sheet.iter_rows(min_row=2, values_only=True):
        row_dict = {headers[i]: val for i, val in enumerate(row) if i < len(headers)}
        
        eq_name = safe_str(row_dict.get("Equipment"))
        if not eq_name:
            continue
            
        asset_code = safe_str(row_dict.get("Asset Code"))
        if not asset_code:
            print(f"Skipping row without Asset Code: {eq_name}")
            skipped_count += 1
            continue
            
        # Check if equipment already exists
        existing_eq = db.query(EquipmentItem).filter_by(tenant_id=tenant_id, equipment_code=asset_code).first()
        if existing_eq:
            print(f"Equipment with Asset Code {asset_code} already exists. Skipping.")
            skipped_count += 1
            continue
            
        cat_name = safe_str(row_dict.get("Machine category")) or "Equipment"
        
        # 1. Resolve Material
        try:
            material = get_or_create_material(db, tenant_id, site_id, eq_name, cat_name)
        except Exception as e:
            print(f"Failed to resolve material for {eq_name}: {e}")
            skipped_count += 1
            continue
            
        # 2. Resolve Location
        loc_val = safe_str(row_dict.get("LOCATION"))
        location_id = None
        if loc_val:
            loc = get_or_create_location(db, tenant_id, site_id, loc_val)
            location_id = loc.id
            
        # Parse fields
        is_bio = "Therapeutic" in cat_name or "Diagnostic" in cat_name or "Life Support" in cat_name
        
        warranty_exp = safe_date(row_dict.get("Warrenty Expire Date"))
        has_warranty = warranty_exp is not None
        
        amc_end = safe_date(row_dict.get("End Date"))
        amc_status = safe_str(row_dict.get("AMC/CMC"))
        
        pm_calib = safe_str(row_dict.get("Ccalibation/ PM"))
        pm_req = False
        calib_req = False
        if pm_calib:
            pm_calib_upper = pm_calib.upper()
            if "PM" in pm_calib_upper:
                pm_req = True
            if "CALIB" in pm_calib_upper or "C" in pm_calib_upper:
                calib_req = True
                
        status_val = safe_str(row_dict.get("Status")) or "Operational"
        
        # Create Equipment Item
        eq_item = EquipmentItem(
            tenant_id=tenant_id,
            site_id=site_id,
            equipment_code=asset_code,
            material_id=material.id,
            institution_id=None,
            location_id=location_id,
            warehouse_id=warehouse.id if warehouse else None,
            make=safe_str(row_dict.get("MAKE")),
            model=safe_str(row_dict.get("MODEL")),
            serial_number=safe_str(row_dict.get("SERIAL NUMBER")),
            serial_number_status="Captured" if safe_str(row_dict.get("SERIAL NUMBER")) else "Pending Update",
            is_biomedical=is_bio,
            requires_installation=False,
            installation_status="Installed" if safe_date(row_dict.get("INSTALLATION DATE")) else "Not Required",
            installation_date=safe_date(row_dict.get("INSTALLATION DATE")),
            installed_by=safe_str(row_dict.get("INSTALLED BY")),
            status=status_val,
            warranty_available=has_warranty,
            warranty_expiry_date=warranty_exp,
            amc_cmc_status=amc_status,
            amc_cmc_end_date=amc_end,
            amc_po_number=safe_str(row_dict.get("AMC PO no")),
            pm_required=pm_req,
            calibration_required=calib_req,
            battery_details=safe_str(row_dict.get("Battery")),
            procurement_type="Purchase",
        )
        
        db.add(eq_item)
        added_count += 1
        
    db.commit()
    db.close()
    print(f"Import completed. Added: {added_count}, Skipped: {skipped_count}")

if __name__ == "__main__":
    file_path = "/home/ngadmin/smartcampus2/EQUIPMENT LIST master.xlsx"
    import_equipment(file_path)
