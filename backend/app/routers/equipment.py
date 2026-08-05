"""Equipment Management router for serial numbers and installation tracking."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import EquipmentItem, Material, GRN, Warehouse, Project, User, AuditLog
from app.schemas import EquipmentItemOut, EquipmentItemCreate, EquipmentUpdateSerial, EquipmentInstallationUpdate, PMScheduleOut, PMScheduleUpdate, EquipmentUpdate
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
import os
import uuid

router = APIRouter(prefix="/api/equipment", tags=["Equipment"])


@router.get("", response_model=List[EquipmentItemOut])
def list_equipment(
    search: Optional[str] = None,
    tab: Optional[str] = "all",  # "all", "pending_serial", "pending_installation"
    warehouse_id: Optional[int] = None,
    is_biomedical: Optional[bool] = None,
    requires_installation: Optional[bool] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(EquipmentItem).filter(
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    )

    if tab == "pending_serial":
        q = q.filter(
            (EquipmentItem.serial_number_status == "Pending Update") |
            (EquipmentItem.serial_number == None) |
            (EquipmentItem.serial_number == "")
        )
    elif tab == "pending_installation":
        q = q.filter(EquipmentItem.installation_status == "Pending Installation")

    if warehouse_id:
        q = q.filter(EquipmentItem.warehouse_id == warehouse_id)

    if is_biomedical is not None:
        q = q.filter(EquipmentItem.is_biomedical == is_biomedical)

    if requires_installation is not None:
        q = q.filter(EquipmentItem.requires_installation == requires_installation)

    if status:
        q = q.filter(EquipmentItem.status == status)

    if search:
        search_pattern = f"%{search}%"
        q = q.join(EquipmentItem.material).filter(
            (EquipmentItem.equipment_code.ilike(search_pattern)) |
            (EquipmentItem.serial_number.ilike(search_pattern)) |
            (Material.name.ilike(search_pattern)) |
            (Material.code.ilike(search_pattern))
        )

    items = q.order_by(EquipmentItem.created_at.desc()).all()

    result = []
    for item in items:
        mat = item.material
        grn = item.grn
        wh = item.warehouse
        proj = item.project
        out = EquipmentItemOut.model_validate(item)
        out.material_name = mat.name if mat else None
        out.material_code = mat.code if mat else None
        out.grn_number = grn.grn_number if grn else None
        out.warehouse_name = wh.name if wh else None
        out.project_name = proj.name if proj else None
        out.location_name = item.location.location_name if item.location else None
        out.institution_name = item.institution.name if item.institution else None
        result.append(out)
    return result


@router.post("", response_model=EquipmentItemOut)
def create_equipment(
    item_in: EquipmentItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    from app.models import EquipmentHistory

    # Check if equipment code already exists
    existing = db.query(EquipmentItem).filter(
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.equipment_code == item_in.equipment_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Equipment Code already exists in this tenant.")

    new_item = EquipmentItem(
        tenant_id=tenant_id,
        site_id=site_id,
        **item_in.dict()
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Record History
    history = EquipmentHistory(
        equipment_id=new_item.id,
        event_type="Manual Registration",
        description="Equipment added manually",
        created_by_id=current_user.id
    )
    db.add(history)
    db.commit()

    # Load extra fields for response
    mat = new_item.material
    wh = new_item.warehouse
    proj = new_item.project

    out = EquipmentItemOut.model_validate(new_item)
    out.material_name = mat.name if mat else None
    out.material_code = mat.code if mat else None
    out.warehouse_name = wh.name if wh else None
    out.project_name = proj.name if proj else None
    out.location_name = new_item.location.location_name if new_item.location else None
    out.institution_name = new_item.institution.name if new_item.institution else None

    return out


@router.get("/pm-schedule", response_model=List[PMScheduleOut])
def get_pm_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id)
):
    from app.models import PMSchedule
    schedules = db.query(PMSchedule).filter(PMSchedule.tenant_id == tenant_id).all()
    if not schedules:
        # Seed default data
        defaults = [
            {"department_name": "EMERGENCY", "jan": True, "jul": True},
            {"department_name": "ICU", "feb": True, "aug": True},
            {"department_name": "OT", "mar": True, "sep": True},
            {"department_name": "LABOUR ROOM/POST OP", "apr": True, "oct": True},
            {"department_name": "CATH LAB", "may": True, "nov": True},
            {"department_name": "CENTRAL LAB", "jun": True, "dec": True},
            {"department_name": "BLOOD BANK/IMD", "jan": True, "jul": True},
            {"department_name": "DIALYSIS", "feb": True, "aug": True},
            {"department_name": "RADIOLOGY", "mar": True, "sep": True},
            {"department_name": "CSSD/PHYSIOTHERAPY", "apr": True, "oct": True},
            {"department_name": "OPD'S", "may": True, "nov": True},
            {"department_name": "WARDS", "jun": True, "dec": True}
        ]
        for d in defaults:
            db.add(PMSchedule(tenant_id=tenant_id, **d))
        db.commit()
        schedules = db.query(PMSchedule).filter(PMSchedule.tenant_id == tenant_id).all()
    return schedules

@router.put("/pm-schedule")
def update_pm_schedule(
    payload: List[PMScheduleUpdate],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id)
):
    from app.models import PMSchedule
    for update_data in payload:
        record = db.query(PMSchedule).filter(
            PMSchedule.tenant_id == tenant_id,
            PMSchedule.department_name == update_data.department_name
        ).first()
        if record:
            for key, value in update_data.model_dump().items():
                if key != "department_name":
                    setattr(record, key, value)
        else:
            new_record = PMSchedule(tenant_id=tenant_id, **update_data.model_dump())
            db.add(new_record)
            
    db.commit()
    return {"message": "PM Schedule updated successfully"}

@router.post("/generate-maintenance-calls")
def generate_maintenance_calls(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    from app.models import Complaint, LocationMaster, PMSchedule
    from datetime import date
    
    current_month_index = date.today().month
    month_names = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    current_month_col = month_names[current_month_index - 1]
    
    # Get departments scheduled for this month
    schedules = db.query(PMSchedule).filter(
        PMSchedule.tenant_id == tenant_id,
        getattr(PMSchedule, current_month_col) == True
    ).all()
    scheduled_depts = [s.department_name.lower() for s in schedules]
    
    # Find all equipment needing PM
    equipments = db.query(EquipmentItem).join(
        LocationMaster, EquipmentItem.location_id == LocationMaster.id
    ).filter(
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id,
        EquipmentItem.status == "Operational",
        EquipmentItem.pm_required == True
    ).all()
    
    generated_count = 0
    for eq in equipments:
        if eq.location_id:
            loc = db.query(LocationMaster).get(eq.location_id)
            if loc and loc.location_name.lower() in scheduled_depts:
                # Check if a PM complaint already exists for this equipment that is open
                existing = db.query(Complaint).filter(
                    Complaint.equipment_id == eq.id,
                    Complaint.complaint_type == "Preventive Maintenance Call",
                    Complaint.status != "Closed"
                ).first()
                
                if not existing:
                    # Check if one was closed recently in this same month
                    recent_pm = db.query(Complaint).filter(
                        Complaint.equipment_id == eq.id,
                        Complaint.complaint_type == "Preventive Maintenance Call",
                        db.func.extract('month', Complaint.complaint_date) == current_month_index,
                        db.func.extract('year', Complaint.complaint_date) == date.today().year
                    ).first()
                    
                    if not recent_pm:
                        new_complaint = Complaint(
                            tenant_id=tenant_id,
                            site_id=site_id,
                            docket_no=f"PM-{date.today().strftime('%Y%m')}-{eq.equipment_code}",
                            complaint_date=date.today(),
                            department_name=loc.location_name,
                            equipment_id=eq.id,
                            nature_of_complaint="Scheduled Preventive Maintenance",
                            complaint_type="Preventive Maintenance Call",
                            status="Open",
                            is_pm_calibration_call=True,
                            created_by_id=current_user.id
                        )
                        db.add(new_complaint)
                        generated_count += 1
                        
    # Handle Calibration Generation
    cal_equipments = db.query(EquipmentItem).filter(
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id,
        EquipmentItem.status == "Operational",
        EquipmentItem.calibration_required == True
    ).all()
    
    cal_generated_count = 0
    for eq in cal_equipments:
        if eq.next_calibration_due_date:
            if eq.next_calibration_due_date <= date.today():
                existing = db.query(Complaint).filter(
                    Complaint.equipment_id == eq.id,
                    Complaint.complaint_type == "Calibration Call",
                    Complaint.status != "Closed"
                ).first()
                if not existing:
                    recent_cal = db.query(Complaint).filter(
                        Complaint.equipment_id == eq.id,
                        Complaint.complaint_type == "Calibration Call",
                        db.func.extract('month', Complaint.complaint_date) == current_month_index,
                        db.func.extract('year', Complaint.complaint_date) == date.today().year
                    ).first()
                    if not recent_cal:
                        new_complaint = Complaint(
                            tenant_id=tenant_id,
                            site_id=site_id,
                            docket_no=f"CAL-{date.today().strftime('%Y%m')}-{eq.equipment_code}",
                            complaint_date=date.today(),
                            department_name="Biomedical",
                            equipment_id=eq.id,
                            nature_of_complaint="Scheduled Calibration",
                            complaint_type="Calibration Call",
                            status="Open",
                            is_pm_calibration_call=True,
                            created_by_id=current_user.id
                        )
                        db.add(new_complaint)
                        cal_generated_count += 1
                    
    db.commit()
    return {
        "message": "Maintenance generation complete", 
        "pm_calls_generated": generated_count,
        "calibration_calls_generated": cal_generated_count
    }

@router.get("/{id}", response_model=EquipmentItemOut)
def get_equipment_item(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    mat = item.material
    grn = item.grn
    wh = item.warehouse
    proj = item.project
    return EquipmentItemOut(
        id=item.id,
        equipment_code=item.equipment_code,
        material_id=item.material_id,
        grn_id=item.grn_id,
        grn_item_id=item.grn_item_id,
        serial_number=item.serial_number,
        serial_number_status=item.serial_number_status or "Pending Update",
        is_biomedical=item.is_biomedical or False,
        requires_installation=item.requires_installation or False,
        installation_status=item.installation_status or "Not Required",
        installation_date=item.installation_date,
        installation_report_url=item.installation_report_url,
        installation_remarks=item.installation_remarks,
        warehouse_id=item.warehouse_id,
        project_id=item.project_id,
        status=item.status or "In Store",
        created_at=item.created_at,
        updated_at=item.updated_at,
        material_name=mat.name if mat else None,
        material_code=mat.code if mat else None,
        grn_number=grn.grn_number if grn else None,
        warehouse_name=wh.name if wh else None,
        project_name=proj.name if proj else None
    )

@router.put("/{id}", response_model=EquipmentItemOut)
def update_equipment_item(
    id: int,
    payload: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    update_data = payload.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(item, key, value)
        
    item.updated_at = datetime.utcnow()
    
    db.add(AuditLog(
        tenant_id=tenant_id, site_id=site_id,
        user_id=current_user.id, action="UPDATE",
        entity_type="EquipmentItem", entity_id=item.id,
        new_values=f"Equipment properties updated for {item.equipment_code}"
    ))
    db.commit()
    db.refresh(item)
    
    mat = item.material
    grn = item.grn
    wh = item.warehouse
    proj = item.project
    return EquipmentItemOut(
        id=item.id,
        equipment_code=item.equipment_code,
        material_id=item.material_id,
        grn_id=item.grn_id,
        grn_item_id=item.grn_item_id,
        serial_number=item.serial_number,
        serial_number_status=item.serial_number_status or "Pending Update",
        is_biomedical=item.is_biomedical or False,
        requires_installation=item.requires_installation or False,
        installation_status=item.installation_status or "Not Required",
        installation_date=item.installation_date,
        installation_report_url=item.installation_report_url,
        installation_remarks=item.installation_remarks,
        warehouse_id=item.warehouse_id,
        project_id=item.project_id,
        status=item.status or "In Store",
        created_at=item.created_at,
        updated_at=item.updated_at,
        material_name=mat.name if mat else None,
        material_code=mat.code if mat else None,
        grn_number=grn.grn_number if grn else None,
        warehouse_name=wh.name if wh else None,
        project_name=proj.name if proj else None,
        # Other fields to support full return
        make=item.make,
        model=item.model,
        machine_cost=item.machine_cost,
        machine_type=item.machine_type,
        warranty_available=item.warranty_available,
        warranty_expiry_date=item.warranty_expiry_date,
        amc_cmc_end_date=item.amc_cmc_end_date,
        amc_po_number=item.amc_po_number,
        amc_cost=item.amc_cost,
        pm_required=item.pm_required,
        calibration_required=item.calibration_required,
        battery_details=item.battery_details
    )


@router.put("/{id}/serial-number")
def update_serial_number(
    id: int,
    payload: EquipmentUpdateSerial,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    old_sn = item.serial_number
    item.serial_number = payload.serial_number.strip()
    item.serial_number_status = "Captured"
    item.updated_at = datetime.utcnow()

    db.add(AuditLog(
        tenant_id=tenant_id, site_id=site_id,
        user_id=current_user.id, action="UPDATE",
        entity_type="EquipmentItem", entity_id=item.id,
        new_values=f"Serial number updated for {item.equipment_code} from '{old_sn}' to '{item.serial_number}'"
    ))
    db.commit()
    return {"message": "Serial number updated successfully", "serial_number": item.serial_number}


@router.post("/{id}/installation")
def complete_installation(
    id: int,
    serial_number: str = Form(...),
    installation_date: str = Form(...),
    installation_remarks: Optional[str] = Form(None),
    installed_by: str = Form(...),
    contact_number: str = Form(...),
    location_id: int = Form(...),
    file: UploadFile = File(...),
    equipment_photo: UploadFile = File(...),
    serial_number_photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")

    if not serial_number.strip() or not installed_by.strip() or not contact_number.strip():
        raise HTTPException(status_code=400, detail="Missing required fields")

    item.serial_number = serial_number.strip()
    item.serial_number_status = "Captured"

    try:
        item.installation_date = datetime.fromisoformat(installation_date.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid installation date")

    if installation_remarks:
        item.installation_remarks = installation_remarks
        
    item.installed_by = installed_by
    item.contact_number = contact_number
    item.location_id = location_id
    # Update Asset Code if location is set
    from app.models import LocationMaster, Institution
    from app.utils.sequences import get_next_number
    
    loc = db.query(LocationMaster).filter(LocationMaster.id == location_id).first()
    inst = db.query(Institution).filter(Institution.id == item.institution_id).first() if item.institution_id else None
    
    loc_code = loc.location_code.rstrip("_").rstrip("-") if loc and loc.location_code else "LOC"
    inst_code = inst.code if inst else "INST"
    mat_code_full = item.material.code if item.material else "EQP"
    mat_prefix = mat_code_full.split("-")[0] if "-" in mat_code_full else mat_code_full
    
    if loc and item.status != "Operational":
        # Generate new asset code
        seq_num = get_next_number(db, tenant_id, site_id, f"EQP_{loc_code}", f"EQP_{loc_code}")
        # Format: {Institution}-{Location Code}-{Material Prefix}-{Running Serial Number}
        seq = seq_num.split('-')[-1] if '-' in seq_num else seq_num[-3:]
        new_asset_code = f"{inst_code}-{loc_code}-{mat_prefix}-{seq}"
        item.equipment_code = new_asset_code

    def handle_upload(upload_file: UploadFile, folder: str):
        allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"]
        if upload_file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type for {folder}")
        contents = upload_file.file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File size for {folder} must be less than 10MB.")
        dir_path = os.path.join(f"uploads/{folder}", str(tenant_id))
        os.makedirs(dir_path, exist_ok=True)
        ext = os.path.splitext(upload_file.filename)[1] or ".pdf"
        unique_name = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(dir_path, unique_name)
        with open(file_path, "wb") as f:
            f.write(contents)
        return f"/api/{file_path}"

    if file:
        item.installation_report_url = handle_upload(file, "installation_reports")
    if equipment_photo:
        item.equipment_photo_url = handle_upload(equipment_photo, "equipment_photos")
    if serial_number_photo:
        item.serial_number_photo_url = handle_upload(serial_number_photo, "serial_number_photos")

    item.installation_status = "Installed"
    item.status = "Operational"
    item.updated_at = datetime.utcnow()
    
    # Create History
    from app.models import EquipmentHistory
    db.add(EquipmentHistory(
        equipment_id=item.id,
        event_type="Installation",
        description=f"Installed by {installed_by or 'Unknown'} at {item.installation_date}",
        created_by_id=current_user.id
    ))

    db.add(AuditLog(
        tenant_id=tenant_id, site_id=site_id,
        user_id=current_user.id, action="UPDATE",
        entity_type="EquipmentItem", entity_id=item.id,
        new_values=f"Installation completed for {item.equipment_code} (Serial: {item.serial_number})"
    ))
    db.commit()

    return {
        "message": "Equipment installation completed successfully",
        "equipment_code": item.equipment_code,
        "serial_number": item.serial_number,
        "installation_status": item.installation_status,
        "status": item.status,
        "installation_report_url": item.installation_report_url
    }

@router.get("/{id}/qr")
def get_qr_data(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")
        
    return {
        "department": "Biomedical Engineering Department" if item.is_biomedical else "Facilities Department",
        "asset_id": item.equipment_code,
        "equipment_name": item.material.name if item.material else "",
        "department_used": item.location.location_name if item.location else "",
        "make_model": f"{item.make or ''} / {item.model or ''}".strip(" /"),
        "serial_number": item.serial_number or "",
        "machine_type": item.machine_type or "",
        "grn_number": item.grn.grn_number if item.grn else "",
        "pm_due_date": item.next_pm_due_date.isoformat() if item.next_pm_due_date else ""
    }

@router.get("/by-code/{asset_code}")
def get_equipment_by_code(
    asset_code: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.equipment_code == asset_code,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")
        
    return {
        "department": "Biomedical Engineering Department" if item.is_biomedical else "Facilities Department",
        "asset_id": item.equipment_code,
        "equipment_name": item.material.name if item.material else "",
        "department_used": item.location.location_name if item.location else "",
        "make_model": f"{item.make or ''} / {item.model or ''}".strip(" /"),
        "serial_number": item.serial_number or "",
        "machine_type": item.machine_type or "",
        "grn_number": item.grn.grn_number if item.grn else "",
        "pm_due_date": item.next_pm_due_date.isoformat() if item.next_pm_due_date else "",
        "status": item.status,
        "installation_status": item.installation_status,
        "warranty_available": item.warranty_available,
        "warranty_expiry_date": item.warranty_expiry_date.isoformat() if item.warranty_expiry_date else "",
        "amc_cmc_status": item.amc_cmc_status or "None",
        "amc_cmc_end_date": item.amc_cmc_end_date.isoformat() if item.amc_cmc_end_date else "",
        "procurement_type": item.procurement_type,
        "is_biomedical": item.is_biomedical,
        "requires_installation": item.requires_installation
    }

from pydantic import BaseModel
class WriteOffRequest(BaseModel):
    write_off_date: str
    reason: str
    approval_details: Optional[str] = None
    document_url: Optional[str] = None

from app.schemas import EquipmentRelocate
from app.models import EquipmentHistory, LocationMaster
from datetime import datetime

@router.post("/{id}/relocate", response_model=EquipmentItemOut)
def relocate_equipment(
    id: int,
    payload: EquipmentRelocate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")
        
    if item.status != "Operational":
        raise HTTPException(status_code=400, detail="Only operational equipment can be relocated")
        
    old_location = db.query(LocationMaster).filter(LocationMaster.id == item.location_id).first()
    new_location = db.query(LocationMaster).filter(LocationMaster.id == payload.new_location_id).first()
    if not new_location:
        raise HTTPException(status_code=404, detail="New location not found")
        
    old_loc_name = old_location.location_name if old_location else "Unknown"
    
    # Update location
    item.location_id = payload.new_location_id
    
    # Record history
    history = EquipmentHistory(
        equipment_id=item.id,
        event_type="Relocation",
        event_date=payload.relocation_date,
        description=f"Relocated from {old_loc_name} to {new_location.location_name}. Remarks: {payload.remarks or 'None'}",
        created_by_id=current_user.id
    )
    db.add(history)
    
    db.commit()
    db.refresh(item)
    return item

@router.post("/{id}/writeoff")
def write_off_equipment(
    id: int,
    payload: WriteOffRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    item = db.query(EquipmentItem).filter(
        EquipmentItem.id == id,
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Equipment item not found")
        
    from app.models import EquipmentWriteOff, EquipmentHistory
    from datetime import date
    
    writeoff = EquipmentWriteOff(
        equipment_id=item.id,
        write_off_date=date.fromisoformat(payload.write_off_date.replace("Z", "+00:00").split("T")[0]),
        reason=payload.reason,
        approval_details=payload.approval_details,
        document_url=payload.document_url,
        created_by_id=current_user.id
    )
    db.add(writeoff)
    
    item.status = "Written Off"
    item.updated_at = datetime.utcnow()
    
    db.add(EquipmentHistory(
        equipment_id=item.id,
        event_type="Write-off",
        description=payload.reason,
        created_by_id=current_user.id
    ))
    
    db.commit()
    return {"message": "Equipment written off successfully"}

@router.get("/reports/count")
def get_equipment_counts(
    institution_id: Optional[int] = None,
    category_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    location_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    from sqlalchemy import func
    q = db.query(
        Material.name.label("equipment_name"), 
        func.count(EquipmentItem.id).label("count")
    ).join(
        EquipmentItem, EquipmentItem.material_id == Material.id
    ).filter(
        EquipmentItem.tenant_id == tenant_id,
        EquipmentItem.site_id == site_id
    )
    
    if institution_id:
        q = q.filter(EquipmentItem.institution_id == institution_id)
    if location_id:
        q = q.filter(EquipmentItem.location_id == location_id)
    if status:
        q = q.filter(EquipmentItem.status == status)
    if category_id:
        q = q.filter(Material.category_id == category_id)
        
    # Vendor would be via GRN->PO->Vendor or rental_vendor
    if vendor_id:
        from app.models import GRN
        q = q.outerjoin(GRN, EquipmentItem.grn_id == GRN.id).filter(GRN.vendor_id == vendor_id)
        
    results = q.group_by(Material.name).all()
    
    return [
        {"equipment_name": r.equipment_name, "count": r.count}
        for r in results
    ]

