"""Equipment Management router for serial numbers and installation tracking."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import EquipmentItem, Material, GRN, Warehouse, Project, User, AuditLog
from app.schemas import EquipmentItemOut, EquipmentUpdateSerial, EquipmentInstallationUpdate
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
        result.append(EquipmentItemOut(
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
        ))
    return result


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
    serial_number: Optional[str] = Form(None),
    installation_date: Optional[str] = Form(None),
    installation_remarks: Optional[str] = Form(None),
    installed_by: Optional[str] = Form(None),
    contact_number: Optional[str] = Form(None),
    location_id: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    equipment_photo: Optional[UploadFile] = File(None),
    serial_number_photo: Optional[UploadFile] = File(None),
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

    if serial_number and serial_number.strip():
        item.serial_number = serial_number.strip()
        item.serial_number_status = "Captured"

    if installation_date:
        try:
            item.installation_date = datetime.fromisoformat(installation_date.replace("Z", "+00:00"))
        except Exception:
            item.installation_date = datetime.utcnow()
    else:
        item.installation_date = datetime.utcnow()

    if installation_remarks:
        item.installation_remarks = installation_remarks
        
    if installed_by:
        item.installed_by = installed_by
    if contact_number:
        item.contact_number = contact_number
        
    if location_id:
        item.location_id = location_id
        # Update Asset Code if location is set
        from app.models import LocationMaster, Institution
        from app.utils.sequences import get_next_number
        
        loc = db.query(LocationMaster).filter(LocationMaster.id == location_id).first()
        inst = db.query(Institution).filter(Institution.id == item.institution_id).first() if item.institution_id else None
        
        loc_code = loc.location_code if loc else "LOC"
        inst_code = inst.code if inst else "INST"
        mat_code = item.material.code if item.material else "EQP"
        
        if loc and item.status != "Operational":
            # Generate new asset code
            seq_num = get_next_number(db, tenant_id, site_id, f"EQP_{loc_code}", f"EQP_{loc_code}")
            # Format: {Institution}-{Location Code}-{Equipment Code}-{Running Serial Number}
            # The get_next_number usually returns something like EQP_WD17-001, we want to format it custom.
            # We will use a custom sequence generation here or just format the returned string
            seq = seq_num.split('-')[-1] if '-' in seq_num else seq_num[-3:]
            new_asset_code = f"{inst_code}-{loc_code}-{mat_code}-{seq}"
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

from pydantic import BaseModel
class WriteOffRequest(BaseModel):
    write_off_date: str
    reason: str
    approval_details: Optional[str] = None
    document_url: Optional[str] = None

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
