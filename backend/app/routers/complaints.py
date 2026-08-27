from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.database import get_db
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.models import User, Complaint, ComplaintImage, ComplaintStatus, Building, Room, MaterialIssue, Department, Institution
from app.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintOut, ComplaintImageOut,
    ComplaintAssign, ComplaintInspect, ComplaintResolve, ComplaintVerify
)
from app.utils.sequences import get_next_number
from app.utils.email_utils import send_html_email
import threading

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


# ── Helper: load virtual fields for response ─────────────────────────────
def _enrich(complaint: Complaint, db: Session = None):
    """Populate virtual fields so the Pydantic model can serialize them."""
    complaint.building_name = complaint.building.name if complaint.building else None
    complaint.room_name = complaint.room.name if complaint.room else None
    complaint.assigned_to_name = complaint.assigned_to.full_name if complaint.assigned_to else None
    complaint.created_by_name = complaint.created_by.full_name if complaint.created_by else None
    complaint.resolved_by_name = complaint.resolved_by.full_name if complaint.resolved_by else None
    complaint.verified_by_name = complaint.verified_by.full_name if complaint.verified_by else None
    complaint.admin_approved_by_name = complaint.admin_approver.full_name if complaint.admin_approver else None
    complaint.manager_approved_by_name = complaint.manager_approver.full_name if complaint.manager_approver else None
    complaint.equipment_code = complaint.equipment.equipment_code if complaint.equipment else None
    
    complaint.equipment_name = None
    complaint.equipment_make = None
    complaint.equipment_model = None
    complaint.equipment_serial_number = None
    complaint.equipment_photo_url = None
    complaint.serial_number_photo_url = None
    complaint.installation_report_url = None
    
    complaint.equipment_warranty_status = None
    if complaint.equipment:
        eq = complaint.equipment
        complaint.equipment_make = eq.make
        complaint.equipment_model = eq.model
        complaint.equipment_serial_number = eq.serial_number
        complaint.equipment_photo_url = eq.equipment_photo_url
        complaint.serial_number_photo_url = eq.serial_number_photo_url
        complaint.installation_report_url = eq.installation_report_url
        if eq.material:
            complaint.equipment_name = eq.material.name
            
        now_date = datetime.now().date()
        if eq.warranty_available and eq.warranty_expiry_date and eq.warranty_expiry_date >= now_date:
            complaint.equipment_warranty_status = "Warranty"
        elif eq.amc_cmc_status == "AMC" and eq.amc_cmc_end_date and eq.amc_cmc_end_date >= now_date:
            complaint.equipment_warranty_status = "AMC"
        elif eq.amc_cmc_status == "CMC" and eq.amc_cmc_end_date and eq.amc_cmc_end_date >= now_date:
            complaint.equipment_warranty_status = "CMC"
        else:
            complaint.equipment_warranty_status = "Out of Warranty"

    # Derive institution_id and floor_id from room -> floor -> building -> institution
    complaint.floor_id = None
    complaint.floor_name = None
    complaint.institution_id = None
    complaint.institution_name = None
    if complaint.room and complaint.room.floor:
        complaint.floor_id = complaint.room.floor.id
        complaint.floor_name = complaint.room.floor.name
        if complaint.room.floor.building:
            if not complaint.building_id:
                complaint.building_id = complaint.room.floor.building.id
                complaint.building_name = complaint.room.floor.building.name
            if complaint.room.floor.building.institution:
                complaint.institution_id = complaint.room.floor.building.institution.id
                complaint.institution_name = complaint.room.floor.building.institution.name
    elif complaint.building:
        if complaint.building.institution:
            complaint.institution_id = complaint.building.institution.id
            complaint.institution_name = complaint.building.institution.name

    # Fallback: Derive institution from department if no building is set
    if not complaint.institution_id and db and complaint.department_name:
        dept = db.query(Department).filter(
            Department.name == complaint.department_name,
            Department.tenant_id == complaint.tenant_id,
            Department.site_id == complaint.site_id
        ).first()
        if dept and dept.institution_id:
            inst = db.query(Institution).filter(Institution.id == dept.institution_id).first()
            if inst:
                complaint.institution_id = inst.id
                complaint.institution_name = inst.name

    return complaint


def _get_complaint(db: Session, complaint_id: int, tenant_id: int, site_id: int) -> Complaint:
    """Fetch a complaint or raise 404."""
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


# ── Metadata endpoints ───────────────────────────────────────────────────────

@router.get("/metadata/statuses", response_model=List[str])
def get_complaint_statuses():
    """Return the ordered list of active complaint statuses for the frontend UI."""
    return [
        ComplaintStatus.REGISTERED.value,
        ComplaintStatus.OPEN.value,
        ComplaintStatus.ASSIGNED.value,
        ComplaintStatus.UNDER_INSPECTION.value,
        ComplaintStatus.MATERIAL_PENDING.value,
        ComplaintStatus.IN_PROGRESS.value,
        "Pending Approval",
        ComplaintStatus.CLOSED.value,
        ComplaintStatus.REOPENED.value,
        "All"
    ]

# ── CRUD endpoints ───────────────────────────────────────────────────────

@router.post("", response_model=ComplaintOut)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    try:
        docket_no = complaint_in.docket_no
        if not docket_no:
            docket_no = get_next_number(db, tenant_id, site_id, "COMPLAINT", "CMP")
            
        now = datetime.now()
        c_date = complaint_in.complaint_date or now.date()
        c_time = complaint_in.complaint_time or now.strftime("%H:%M")

        new_complaint = Complaint(
            tenant_id=tenant_id,
            site_id=site_id,
            docket_no=docket_no,
            complaint_date=c_date,
            complaint_time=c_time,
            department_name=complaint_in.department_name,
            building_id=complaint_in.building_id,
            room_id=complaint_in.room_id,
            equipment_id=complaint_in.equipment_id,
            location=complaint_in.location,
            nature_of_complaint=complaint_in.nature_of_complaint,
            individual_detailed=complaint_in.individual_detailed,
            name_and_trade=complaint_in.name_and_trade,
            complaint_type=complaint_in.complaint_type or "Breakdown",
            status=ComplaintStatus.REGISTERED.value,
            created_by_id=current_user.id
        )
        db.add(new_complaint)
        db.flush() # To get the ID for images

        if complaint_in.equipment_id:
            from app.models import ContractItem, Contract, EquipmentItem
            today = datetime.utcnow().date()
            eq = db.query(EquipmentItem).filter(EquipmentItem.id == complaint_in.equipment_id).first()
            if eq:
                if complaint_in.complaint_type != "Installation":
                    eq.status = "Under Repair"
                
            c_item = db.query(ContractItem).join(Contract).filter(
                ContractItem.equipment_id == complaint_in.equipment_id,
                Contract.status.in_(["Approved", "Active"]),
                Contract.start_date <= today,
                Contract.end_date >= today,
                Contract.contract_type.in_(["AMC", "CMC"])
            ).first()

            if c_item:
                new_complaint.contract_id = c_item.contract_id

        for img_url in complaint_in.image_urls:
            new_img = ComplaintImage(
                complaint_id=new_complaint.id,
                image_url=img_url,
                is_resolution_image=False
            )
            db.add(new_img)

        db.commit()
        db.refresh(new_complaint)
        
        # Trigger email asynchronously
        if current_user.email:
            subject = f"New Complaint Logged: {new_complaint.docket_no}"
            html_body = f"""
            <h2>New Complaint Logged</h2>
            <p><strong>Docket No:</strong> {new_complaint.docket_no}</p>
            <p><strong>Department:</strong> {new_complaint.department_name}</p>
            <p><strong>Nature of Complaint:</strong> {new_complaint.nature_of_complaint}</p>
            <p><strong>Logged By:</strong> {current_user.full_name}</p>
            <p><strong>Type:</strong> {new_complaint.complaint_type}</p>
            """
            threading.Thread(
                target=send_html_email,
                args=(current_user.email, subject, html_body)
            ).start()
            
        return _enrich(new_complaint, db)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Docket number already exists.")

@router.get("", response_model=List[ComplaintOut])
def get_complaints(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    query = db.query(Complaint).filter(
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False
    )
    
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    user_roles = getattr(current_user, "_roles", [])
    is_technician = any('technician' in r.lower() for r in user_roles)

    if not is_platform_admin:
        if is_technician:
            query = query.filter(Complaint.assigned_to_id == current_user.id)
        else:
            scope = getattr(current_user, "_data_access_scope", "Self Only")
            if scope in ["Full Administrative Access", "Organization"]:
                pass
            elif scope == "Department":
                if current_user.department:
                    query = query.filter(Complaint.department_name == current_user.department)
                else:
                    query = query.filter(Complaint.created_by_id == current_user.id)
            elif scope == "Institution":
                if not current_user.institution:
                    query = query.filter(Complaint.created_by_id == current_user.id)
            else:
                query = query.filter(Complaint.created_by_id == current_user.id)
    if status:
        query = query.filter(Complaint.status == status)
        
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    result_complaints = []
    for c in complaints:
        _enrich(c, db)
        
        # Post-enrichment filtering for Institution scope
        if not getattr(current_user, "_is_platform_admin", False) and not any('technician' in r.lower() for r in getattr(current_user, "_roles", [])):
            scope = getattr(current_user, "_data_access_scope", "Self Only")
            if scope == "Institution" and current_user.institution:
                if c.institution_name != current_user.institution and c.created_by_id != current_user.id:
                    continue
                    
        result_complaints.append(c)
        
    return result_complaints

@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    current_user: User = Depends(require_permission("complaints", "read"))
):
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)
    return _enrich(complaint, db)

@router.put("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    current_user: User = Depends(require_permission("complaints", "update"))
):
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    update_data = complaint_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field not in ['image_urls', 'resolution_image_urls']:
            setattr(complaint, field, value)
            if field == 'status':
                if complaint.equipment and complaint.complaint_type != "Installation":
                    if value in [ComplaintStatus.REGISTERED.value, ComplaintStatus.OPEN.value, ComplaintStatus.REOPENED.value, ComplaintStatus.ASSIGNED.value]:
                        complaint.equipment.status = "Under Repair"
                    elif value in [ComplaintStatus.UNDER_INSPECTION.value, ComplaintStatus.IN_PROGRESS.value, "Pending Approval"]:
                        complaint.equipment.status = "Under maintenance"
                    elif value == ComplaintStatus.MATERIAL_PENDING.value:
                        complaint.equipment.status = "Spare Requested"
                    elif value in [ComplaintStatus.CLOSED.value, ComplaintStatus.RESOLVED.value]:
                        complaint.equipment.status = "Operational"

    if 'image_urls' in update_data:
        provided_urls = update_data['image_urls']
        existing_images = db.query(ComplaintImage).filter(
            ComplaintImage.complaint_id == complaint.id,
            ComplaintImage.is_resolution_image == False
        ).all()
        
        existing_urls = [img.image_url for img in existing_images]
        
        # Delete images not in provided_urls
        for img in existing_images:
            if not any(p_url.endswith(img.image_url) for p_url in provided_urls):
                db.delete(img)
                
        # Add new images
        from urllib.parse import urlparse
        for p_url in provided_urls:
            if not any(p_url.endswith(e_url) for e_url in existing_urls):
                path = urlparse(p_url).path
                new_img = ComplaintImage(
                    complaint_id=complaint.id,
                    image_url=path,
                    is_resolution_image=False
                )
                db.add(new_img)
            
    if complaint_in.resolution_image_urls:
        for img_url in complaint_in.resolution_image_urls:
            new_img = ComplaintImage(
                complaint_id=complaint.id,
                image_url=img_url,
                is_resolution_image=True
            )
            db.add(new_img)

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


# ── Lifecycle state-transition endpoints ─────────────────────────────────

@router.post("/{complaint_id}/assign", response_model=ComplaintOut)
def assign_complaint(
    complaint_id: int,
    payload: ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Assign a technician. Valid from: Registered, Open, Reopened, Assigned (for reassignment)."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    allowed = [
        ComplaintStatus.REGISTERED.value,
        ComplaintStatus.OPEN.value,
        ComplaintStatus.REOPENED.value,
        ComplaintStatus.ASSIGNED.value,
    ]
    if complaint.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign from status '{complaint.status}'. Must be one of: {allowed}"
        )

    # Validate technician exists
    tech = db.query(User).filter(User.id == payload.assigned_to_id, User.is_active == True).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")

    complaint.assigned_to_id = payload.assigned_to_id
    complaint.status = ComplaintStatus.ASSIGNED.value
    if complaint.equipment and complaint.complaint_type != "Installation":
        complaint.equipment.status = "Under Repair"
    
    from app.models import Alert
    alert = Alert(
        tenant_id=tenant_id,
        site_id=site_id,
        alert_type="Complaint Assigned",
        severity="Info",
        title=f"Complaint Assigned: {complaint.docket_no}",
        message=f"You have been assigned to complaint {complaint.docket_no}. Nature of complaint: {complaint.nature_of_complaint}",
        reference_type="ComplaintAssigned",
        reference_id=complaint.id,
        user_id=payload.assigned_to_id,
        is_read=False,
        is_resolved=False
    )
    db.add(alert)
    
    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


@router.post("/{complaint_id}/inspect", response_model=ComplaintOut)
def inspect_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Start inspection. Valid from: Assigned. Transitions to Under Inspection."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    if complaint.status != ComplaintStatus.ASSIGNED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start inspection from status '{complaint.status}'. Must be 'Assigned'."
        )

    complaint.status = ComplaintStatus.UNDER_INSPECTION.value
    if complaint.equipment and complaint.complaint_type != "Installation":
        complaint.equipment.status = "Under maintenance"

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


@router.post("/{complaint_id}/complete-inspection", response_model=ComplaintOut)
def complete_inspection(
    complaint_id: int,
    payload: ComplaintInspect,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Complete inspection and decide if material is needed.
    Valid from: Under Inspection.
    If material_required → Material Pending, else → In Progress."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    if complaint.status != ComplaintStatus.UNDER_INSPECTION.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete inspection from status '{complaint.status}'. Must be 'Under Inspection'."
        )

    if payload.repair_method == 'Material Required':
        complaint.material_required = True
    else:
        complaint.material_required = False

    if payload.inspection_details is not None:
        complaint.inspection_details = payload.inspection_details

    if payload.repair_method == 'Material Required':
        complaint.status = ComplaintStatus.MATERIAL_PENDING.value
        if complaint.equipment and complaint.complaint_type != "Installation":
            complaint.equipment.status = "Spare Requested"
    else:
        complaint.status = ComplaintStatus.IN_PROGRESS.value
        if complaint.equipment and complaint.complaint_type != "Installation":
            complaint.equipment.status = "Under maintenance"

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


@router.post("/{complaint_id}/start-repair", response_model=ComplaintOut)
def start_repair(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Move from Material Pending → In Progress once materials are procured."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    allowed = [
        ComplaintStatus.MATERIAL_PENDING.value,
        ComplaintStatus.UNDER_INSPECTION.value,
    ]
    if complaint.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start repair from status '{complaint.status}'. Must be 'Material Pending' or 'Under Inspection'."
        )

    complaint.status = ComplaintStatus.IN_PROGRESS.value
    if complaint.equipment and complaint.complaint_type != "Installation":
        complaint.equipment.status = "Under maintenance"
    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


@router.post("/{complaint_id}/resolve", response_model=ComplaintOut)
def resolve_complaint(
    complaint_id: int,
    complaint_in: ComplaintResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Mark complaint as resolved. Valid from: In Progress (or legacy Open/In Progress)."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    allowed = [
        ComplaintStatus.IN_PROGRESS.value,
        ComplaintStatus.OPEN.value,           # Legacy support
        ComplaintStatus.MATERIAL_PENDING.value,
    ]
    if complaint.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot resolve from status '{complaint.status}'."
        )

    complaint.status = ComplaintStatus.CLOSED.value
    if complaint.equipment and complaint.complaint_type != "Installation":
        complaint.equipment.status = "Operational"
    complaint.resolved_at = datetime.utcnow()
    complaint.resolved_by_id = current_user.id
    
    if complaint_in.resolution_remarks is not None:
        complaint.resolution_remarks = complaint_in.resolution_remarks

    for img_url in complaint_in.resolution_image_urls:
        new_img = ComplaintImage(
            complaint_id=complaint.id,
            image_url=img_url,
            is_resolution_image=True
        )
        db.add(new_img)

    from app.models import Alert
    alert = Alert(
        tenant_id=tenant_id,
        site_id=site_id,
        alert_type="Complaint Resolved",
        severity="Success",
        title="Complaint Resolved & Closed",
        message=f"Complaint {complaint.docket_no} has been resolved and closed by {current_user.full_name}.",
        reference_type="ComplaintResolved",
        reference_id=complaint.id,
        user_id=complaint.created_by_id,
        is_read=False,
        is_resolved=False
    )
    db.add(alert)

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


@router.post("/{complaint_id}/verify", response_model=ComplaintOut)
def verify_complaint(
    complaint_id: int,
    payload: ComplaintVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Verify resolution: accept → Closed, reject → Reopened.
    Valid from: Resolved."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    if complaint.status != ComplaintStatus.RESOLVED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot verify from status '{complaint.status}'. Must be 'Resolved'."
        )

    complaint.verified_by_id = current_user.id
    complaint.verified_at = datetime.utcnow()

    if payload.is_accepted:
        complaint.status = ComplaintStatus.CLOSED.value
        if complaint.equipment and complaint.complaint_type != "Installation":
            complaint.equipment.status = "Operational"
        if payload.feedback:
            complaint.feedback = payload.feedback
    else:
        complaint.status = ComplaintStatus.REOPENED.value
        if complaint.equipment and complaint.complaint_type != "Installation":
            complaint.equipment.status = "Under Repair"
        complaint.rejection_remarks = payload.rejection_remarks

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)

from app.schemas import ComplaintCloseRequest, ComplaintApproveRequest, ComplaintReopenRequest
from app.models import ComplaintDocument

@router.post("/{complaint_id}/close", response_model=ComplaintOut)
def close_complaint(
    complaint_id: int,
    payload: ComplaintCloseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Initiate dual-approval closure process."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)
    
    allowed = [
        ComplaintStatus.RESOLVED.value,
        ComplaintStatus.IN_PROGRESS.value,
        ComplaintStatus.OPEN.value,
        ComplaintStatus.CLOSED.value # Allow updating closure details
    ]
    if complaint.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot initiate closure from status '{complaint.status}'."
        )

    if complaint.complaint_type == "Installation":
        if not payload.equipment_photo_url or not payload.installation_report_url:
            raise HTTPException(status_code=400, detail="Equipment photo and Installation Report are mandatory for Installation complaints.")
            
        if not payload.serial_number_photo_url and payload.serial_number != 'NA':
            raise HTTPException(status_code=400, detail="Serial Number photo is mandatory unless Serial Number is NA.")
        
        if complaint.equipment:
            complaint.equipment.equipment_photo_url = payload.equipment_photo_url
            if payload.serial_number_photo_url:
                complaint.equipment.serial_number_photo_url = payload.serial_number_photo_url
            complaint.equipment.installation_report_url = payload.installation_report_url
            
            if payload.serial_number and payload.serial_number != 'NA':
                complaint.equipment.serial_number = payload.serial_number
            elif payload.serial_number == 'NA':
                complaint.equipment.serial_number = None

    complaint.resolution_entered = payload.resolution_entered
    complaint.closure_reason = payload.closure_reason
    complaint.status_on_work_completion = payload.status_on_work_completion
    if payload.job_completed_satisfactorily is not None:
        complaint.job_completed_satisfactorily = payload.job_completed_satisfactorily
    complaint.completion_date = payload.completion_date
    complaint.completion_time = payload.completion_time
    if payload.pm_checklist_data is not None:
        complaint.pm_checklist_data = payload.pm_checklist_data
    complaint.status = "Pending Approval"
    if complaint.equipment and complaint.complaint_type != "Installation":
        complaint.equipment.status = "Under maintenance"
    
    # Add documents
    for url in payload.document_urls:
        doc = ComplaintDocument(
            complaint_id=complaint.id,
            file_url=url,
            uploaded_by_id=current_user.id
        )
        db.add(doc)
        
    for img_url in payload.resolution_image_urls:
        new_img = ComplaintImage(
            complaint_id=complaint.id,
            image_url=img_url,
            is_resolution_image=True
        )
        db.add(new_img)

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)


@router.post("/{complaint_id}/approve-closure", response_model=ComplaintOut)
def approve_closure(
    complaint_id: int,
    payload: ComplaintApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Approve closure. Requires both admin and manager approval."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)
    
    if payload.approval_type == 'admin':
        complaint.admin_approved_by_id = current_user.id
        complaint.admin_approved_at = datetime.utcnow()
    elif payload.approval_type == 'manager':
        complaint.manager_approved_by_id = current_user.id
        complaint.manager_approved_at = datetime.utcnow()
    else:
        raise HTTPException(status_code=400, detail="Invalid approval type")
        
    # If both approved, move to closed and update equipment
    if complaint.admin_approved_by_id and complaint.manager_approved_by_id:
        complaint.status = ComplaintStatus.CLOSED.value
        if complaint.equipment and complaint.complaint_type != "Installation":
            complaint.equipment.status = "Operational"
        
        # Auto-update PM/Calibration if applicable
        if complaint.is_pm_calibration_call and complaint.equipment:
            eq = complaint.equipment
            from datetime import timedelta
            if complaint.complaint_type == "PM":
                eq.last_pm_date = datetime.utcnow().date()
                eq.next_pm_due_date = eq.last_pm_date + timedelta(days=90) # Default to 90 days or fetch from contract
            elif complaint.complaint_type == "Calibration":
                eq.last_calibration_date = datetime.utcnow().date()
                eq.next_calibration_due_date = eq.last_calibration_date + timedelta(days=365) # Default to 1 year

        # Auto-update Equipment Installation Status
        if complaint.complaint_type == "Installation" and complaint.equipment:
            eq = complaint.equipment
            eq.installation_status = "Installed"
            eq.status = "Operational"
            if not eq.installation_date:
                eq.installation_date = datetime.utcnow()
            
            from app.models import EquipmentHistory
            db.add(EquipmentHistory(
                equipment_id=eq.id,
                event_type="Installation",
                description=f"Installation completed via Complaint Ticket {complaint.docket_no}",
                created_by_id=current_user.id
            ))

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)

@router.post("/{complaint_id}/reopen", response_model=ComplaintOut)
def reopen_complaint(
    complaint_id: int,
    payload: ComplaintReopenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Reopen a closed complaint."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)
    
    if complaint.status != ComplaintStatus.CLOSED.value:
        raise HTTPException(status_code=400, detail="Only closed complaints can be reopened.")
        
    complaint.status = ComplaintStatus.REOPENED.value
    if complaint.equipment and complaint.complaint_type != "Installation":
        complaint.equipment.status = "Under Repair"
    
    # Reset approval fields
    complaint.admin_approved_by_id = None
    complaint.manager_approved_by_id = None
    complaint.admin_approved_at = None
    complaint.manager_approved_at = None
    
    # Append reopen reason
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    reopen_msg = f"Reopened on {timestamp} by {current_user.full_name}. Reason: {payload.reason}"
    
    if complaint.rejection_remarks:
        complaint.rejection_remarks = f"{complaint.rejection_remarks}\n\n{reopen_msg}"
    else:
        complaint.rejection_remarks = reopen_msg
        
    db.commit()
    db.refresh(complaint)
    return _enrich(complaint, db)
