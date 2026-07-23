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
    file: Optional[UploadFile] = File(None),
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

    # Process file upload if provided
    if file:
        allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only PDF and Image files are allowed for installation reports.")
        
        contents = file.file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Installation report file size must be less than 10MB.")

        dir_path = os.path.join("uploads/installation_reports", str(tenant_id))
        os.makedirs(dir_path, exist_ok=True)
        ext = os.path.splitext(file.filename)[1] or ".pdf"
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_name = f"{timestamp}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(dir_path, unique_name)

        with open(file_path, "wb") as f:
            f.write(contents)

        item.installation_report_url = f"/api/{file_path}"

    item.installation_status = "Installed"
    item.status = "Operational"
    item.updated_at = datetime.utcnow()

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
