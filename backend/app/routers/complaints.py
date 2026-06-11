from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.models import User, Complaint, ComplaintImage, ComplaintStatus, Building, Room, MaterialIssue
from app.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintOut, ComplaintImageOut,
    ComplaintAssign, ComplaintInspect, ComplaintResolve, ComplaintVerify
)
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


# ── Helper: load virtual fields for response ─────────────────────────────
def _enrich(complaint: Complaint):
    """Populate virtual fields so the Pydantic model can serialize them."""
    complaint.building_name = complaint.building.name if complaint.building else None
    complaint.room_name = complaint.room.name if complaint.room else None
    complaint.assigned_to_name = complaint.assigned_to.full_name if complaint.assigned_to else None
    complaint.created_by_name = complaint.created_by.full_name if complaint.created_by else None
    complaint.resolved_by_name = complaint.resolved_by.full_name if complaint.resolved_by else None
    complaint.verified_by_name = complaint.verified_by.full_name if complaint.verified_by else None

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
            location=complaint_in.location,
            nature_of_complaint=complaint_in.nature_of_complaint,
            individual_detailed=complaint_in.individual_detailed,
            name_and_trade=complaint_in.name_and_trade,
            status=ComplaintStatus.REGISTERED.value,
            created_by_id=current_user.id
        )
        db.add(new_complaint)
        db.flush() # To get the ID for images

        for img_url in complaint_in.image_urls:
            new_img = ComplaintImage(
                complaint_id=new_complaint.id,
                image_url=img_url,
                is_resolution_image=False
            )
            db.add(new_img)

        db.commit()
        db.refresh(new_complaint)
        return _enrich(new_complaint)
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
    
    if not getattr(current_user, "_is_platform_admin", False):
        query = query.filter(Complaint.created_by_id == current_user.id)
    
    if status:
        query = query.filter(Complaint.status == status)
        
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    for c in complaints:
        _enrich(c)
        
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    current_user: User = Depends(require_permission("complaints", "read"))
):
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)
    return _enrich(complaint)

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

    if complaint_in.status:
        complaint.status = complaint_in.status
    if complaint_in.assigned_to_id is not None:
        complaint.assigned_to_id = complaint_in.assigned_to_id
    if complaint_in.resolution_remarks is not None:
        complaint.resolution_remarks = complaint_in.resolution_remarks

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint)


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
    """Assign a technician. Valid from: Registered, Open, Reopened."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    allowed = [
        ComplaintStatus.REGISTERED.value,
        ComplaintStatus.OPEN.value,
        ComplaintStatus.REOPENED.value,
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
    db.commit()
    db.refresh(complaint)
    return _enrich(complaint)


@router.post("/{complaint_id}/inspect", response_model=ComplaintOut)
def inspect_complaint(
    complaint_id: int,
    payload: ComplaintInspect,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("complaints", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """Start inspection and decide if material is needed.
    Valid from: Assigned.
    If material_required → Material Pending, else → In Progress."""
    complaint = _get_complaint(db, complaint_id, tenant_id, site_id)

    if complaint.status != ComplaintStatus.ASSIGNED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot inspect from status '{complaint.status}'. Must be 'Assigned'."
        )

    complaint.material_required = payload.material_required
    if payload.material_required:
        complaint.status = ComplaintStatus.MATERIAL_PENDING.value
    else:
        complaint.status = ComplaintStatus.IN_PROGRESS.value

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint)


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
    db.commit()
    db.refresh(complaint)
    return _enrich(complaint)


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

    complaint.status = ComplaintStatus.RESOLVED.value
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

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint)


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
    else:
        complaint.status = ComplaintStatus.REOPENED.value
        complaint.rejection_remarks = payload.rejection_remarks

    db.commit()
    db.refresh(complaint)
    return _enrich(complaint)
