from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, date

from app.database import get_db
from app.auth import get_current_user, get_tenant_id, get_site_id
from app.models import User, Complaint, ComplaintImage, ComplaintStatus, Building, Room, MaterialIssue
from app.schemas import ComplaintCreate, ComplaintUpdate, ComplaintOut, ComplaintImageOut

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("", response_model=ComplaintOut)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    try:
        new_complaint = Complaint(
            tenant_id=tenant_id,
            site_id=site_id,
            docket_no=complaint_in.docket_no,
            complaint_date=complaint_in.complaint_date,
            complaint_time=complaint_in.complaint_time,
            department_name=complaint_in.department_name,
            building_id=complaint_in.building_id,
            room_id=complaint_in.room_id,
            location=complaint_in.location,
            nature_of_complaint=complaint_in.nature_of_complaint,
            individual_detailed=complaint_in.individual_detailed,
            name_and_trade=complaint_in.name_and_trade,
            status=ComplaintStatus.OPEN.value,
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
        
        # Manually load related models for response to prevent detached instance errors
        new_complaint.building_name = new_complaint.building.name if new_complaint.building else None
        new_complaint.room_name = new_complaint.room.name if new_complaint.room else None
        new_complaint.created_by_name = new_complaint.created_by.full_name if new_complaint.created_by else None
        
        return new_complaint
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Docket number already exists.")

@router.get("", response_model=List[ComplaintOut])
def get_complaints(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    query = db.query(Complaint).filter(
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False
    )
    
    if status:
        query = query.filter(Complaint.status == status)
        
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    for c in complaints:
        c.building_name = c.building.name if c.building else None
        c.room_name = c.room.name if c.room else None
        c.assigned_to_name = c.assigned_to.full_name if c.assigned_to else None
        c.created_by_name = c.created_by.full_name if c.created_by else None
        c.resolved_by_name = c.resolved_by.full_name if c.resolved_by else None
        
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint.building_name = complaint.building.name if complaint.building else None
    complaint.room_name = complaint.room.name if complaint.room else None
    complaint.assigned_to_name = complaint.assigned_to.full_name if complaint.assigned_to else None
    complaint.created_by_name = complaint.created_by.full_name if complaint.created_by else None
    complaint.resolved_by_name = complaint.resolved_by.full_name if complaint.resolved_by else None
    
    return complaint

@router.put("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint_in.status:
        complaint.status = complaint_in.status
    if complaint_in.assigned_to_id is not None:
        complaint.assigned_to_id = complaint_in.assigned_to_id
    if complaint_in.resolution_remarks is not None:
        complaint.resolution_remarks = complaint_in.resolution_remarks

    db.commit()
    db.refresh(complaint)
    
    complaint.building_name = complaint.building.name if complaint.building else None
    complaint.room_name = complaint.room.name if complaint.room else None
    complaint.assigned_to_name = complaint.assigned_to.full_name if complaint.assigned_to else None
    complaint.created_by_name = complaint.created_by.full_name if complaint.created_by else None
    complaint.resolved_by_name = complaint.resolved_by.full_name if complaint.resolved_by else None
    
    return complaint

@router.post("/{complaint_id}/resolve", response_model=ComplaintOut)
def resolve_complaint(
    complaint_id: int,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.tenant_id == tenant_id,
        Complaint.site_id == site_id,
        Complaint.is_deleted == False
    ).first()
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

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
    
    complaint.building_name = complaint.building.name if complaint.building else None
    complaint.room_name = complaint.room.name if complaint.room else None
    complaint.assigned_to_name = complaint.assigned_to.full_name if complaint.assigned_to else None
    complaint.created_by_name = complaint.created_by.full_name if complaint.created_by else None
    complaint.resolved_by_name = complaint.resolved_by.full_name if complaint.resolved_by else None
    
    return complaint
