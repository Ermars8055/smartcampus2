"""Vendor management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import Vendor, VendorCategory, Category, User, VendorStatus, ApprovalFlow, VendorApproval
from app.schemas import VendorCreate, VendorUpdate, VendorOut, VendorApprovalCreate
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
from datetime import datetime

router = APIRouter(prefix="/api/vendors", tags=["Vendors"])


@router.get("")
def list_vendors(
    search: Optional[str] = None,
    include_inactive: bool = False,
    all_status: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Vendor).filter(
        Vendor.tenant_id == tenant_id, Vendor.site_id == site_id, Vendor.is_deleted == False
    )
    if not include_inactive:
        q = q.filter(Vendor.is_active == True)
    if not all_status:
        q = q.filter(Vendor.status == VendorStatus.APPROVED.value)
    if search:
        q = q.filter(or_(
            Vendor.name.ilike(f"%{search}%"),
            Vendor.code.ilike(f"%{search}%")
        ))
    vendors = q.order_by(Vendor.name).all()
    
    # Pre-fetch approval flows to calculate can_user_approve
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "VENDOR",
        ApprovalFlow.is_active == True
    ).all()
    user_roles = getattr(current_user, "_roles", [])
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    can_override = is_platform_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    
    result = []
    for v in vendors:
        v.can_user_approve = False
        if v.status == VendorStatus.AWAITING_APPROVAL.value:
            level_flows = [f for f in flows if f.level == v.current_approval_level]
            if not level_flows and can_override:
                v.can_user_approve = True
            else:
                for f in level_flows:
                    if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles):
                        v.can_user_approve = True
                        break
                    
        cats = db.query(Category.name).join(
            VendorCategory, VendorCategory.category_id == Category.id
        ).filter(VendorCategory.vendor_id == v.id).all()
        result.append(VendorOut(
            id=v.id, name=v.name, code=v.code,
            contact_person=v.contact_person, phone=v.phone,
            email=v.email, gst_number=v.gst_number,
            pan_number=v.pan_number, address_line_1=v.address_line_1,
            address_line_2=v.address_line_2, city=v.city, state=v.state, pincode=v.pincode,
            rating=v.rating, status=v.status, current_approval_level=v.current_approval_level,
            approved_by_id=v.approved_by_id, approved_at=v.approved_at, rejection_remarks=v.rejection_remarks,
            is_active=v.is_active,
            created_at=v.created_at,
            categories=[c[0] for c in cats],
            can_user_approve=v.can_user_approve
        ))
    return result


@router.get("/{id}")
def get_vendor(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    v = db.query(Vendor).filter(
        Vendor.id == id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    cats = db.query(Category.name).join(
        VendorCategory, VendorCategory.category_id == Category.id
    ).filter(VendorCategory.vendor_id == v.id).all()
    cat_ids = db.query(VendorCategory.category_id).filter(VendorCategory.vendor_id == v.id).all()
    return {
        **VendorOut(
            id=v.id, name=v.name, code=v.code,
            contact_person=v.contact_person, phone=v.phone,
            email=v.email, gst_number=v.gst_number,
            pan_number=v.pan_number, address_line_1=v.address_line_1,
            address_line_2=v.address_line_2, city=v.city, state=v.state, pincode=v.pincode,
            rating=v.rating, status=v.status, current_approval_level=v.current_approval_level,
            approved_by_id=v.approved_by_id, approved_at=v.approved_at, rejection_remarks=v.rejection_remarks,
            is_active=v.is_active,
            created_at=v.created_at,
            categories=[c[0] for c in cats],
            can_user_approve=False
        ).model_dump(),
        "category_ids": [c[0] for c in cat_ids]
    }


@router.post("")
def create_vendor(
    data: VendorCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("vendors", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor_data = data.model_dump(exclude={"category_ids"})
    # Auto-generate code if not provided
    if not vendor_data.get("code"):
        vendor_data["code"] = get_next_number(db, tenant_id, site_id, "VENDOR", "VND")
    else:
        existing = db.query(Vendor).filter(
            Vendor.code == vendor_data["code"], Vendor.tenant_id == tenant_id, Vendor.site_id == site_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Vendor code already exists")
    vendor = Vendor(**vendor_data, status=VendorStatus.AWAITING_APPROVAL.value, current_approval_level=1, tenant_id=tenant_id, site_id=site_id)
    db.add(vendor)
    db.flush()
    for cat_id in data.category_ids:
        db.add(VendorCategory(vendor_id=vendor.id, category_id=cat_id))
    db.commit()
    return {"id": vendor.id, "code": vendor.code, "message": "Vendor created successfully"}


@router.put("/{id}")
def update_vendor(
    id: int, data: VendorUpdate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("vendors", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor = db.query(Vendor).filter(
        Vendor.id == id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    update_data = data.model_dump(exclude_unset=True, exclude={"category_ids"})
    
    # If the vendor was rejected and is being updated, resubmit it for approval
    if vendor.status == VendorStatus.REJECTED.value and "status" not in update_data:
        update_data["status"] = VendorStatus.AWAITING_APPROVAL.value
        update_data["current_approval_level"] = 1
        update_data["rejection_remarks"] = None
        
    for k, v in update_data.items():
        setattr(vendor, k, v)
    if data.category_ids is not None:
        db.query(VendorCategory).filter(VendorCategory.vendor_id == id).delete()
        for cat_id in data.category_ids:
            db.add(VendorCategory(vendor_id=id, category_id=cat_id))
    db.commit()
    return {"message": "Vendor updated successfully"}


@router.delete("/{id}")
def delete_vendor(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("vendors", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor = db.query(Vendor).filter(
        Vendor.id == id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id
    ).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.is_active = False
    db.commit()
    return {"message": "Vendor deactivated"}

@router.post("/{id}/approve")
def approve_vendor(
    id: int,
    data: Optional[VendorApprovalCreate] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor = db.query(Vendor).filter(Vendor.id == id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id).first()
    if not vendor:
        raise HTTPException(404, "Vendor not found")
    if vendor.status != VendorStatus.AWAITING_APPROVAL.value:
        raise HTTPException(400, "Vendor is not awaiting approval")

    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "VENDOR",
        ApprovalFlow.level == vendor.current_approval_level,
        ApprovalFlow.is_active == True
    ).all()

    if not flows:
        # Move to next level if no flows defined for this level
        return handle_vendor_next_level(db, vendor, tenant_id, site_id, current_user.id)

    user_roles = getattr(current_user, "_roles", [])
    is_admin = getattr(current_user, "_is_platform_admin", False)
    can_override = is_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
    
    applicable_flows = [
        f for f in flows 
        if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)
    ]
    
    if not applicable_flows:
        raise HTTPException(403, f"You do not have permission to approve at level {vendor.current_approval_level}")

    new_approvals = 0
    for f in applicable_flows:
        existing = db.query(VendorApproval).filter(VendorApproval.vendor_id == id, VendorApproval.approval_flow_id == f.id).first()
        if not existing:
            db.add(VendorApproval(
                vendor_id=id, 
                approval_flow_id=f.id, 
                approver_id=current_user.id,
                remarks=data.remarks if data else None
            ))
            new_approvals += 1

    if new_approvals == 0:
        raise HTTPException(400, "You have already approved this vendor at the current level")

    db.commit()

    if new_approvals > 0:
        return handle_vendor_next_level(db, vendor, tenant_id, site_id, current_user.id)

    return {"message": "Approval recorded", "status": vendor.status, "current_level": vendor.current_approval_level}

def handle_vendor_next_level(db, vendor, tenant_id, site_id, user_id=None):
    next_level = vendor.current_approval_level + 1
    has_more = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "VENDOR",
        ApprovalFlow.level >= next_level,
        ApprovalFlow.is_active == True
    ).first()

    if has_more:
        vendor.current_approval_level = next_level
        db.commit()
        return {"message": f"Moved to level {next_level}", "status": vendor.status, "current_level": vendor.current_approval_level}
    else:
        vendor.status = VendorStatus.APPROVED.value
        vendor.approved_by_id = user_id
        vendor.approved_at = datetime.utcnow()
        db.commit()
        return {"message": "Fully Approved", "status": vendor.status, "current_level": vendor.current_approval_level}

@router.post("/{id}/reject")
def reject_vendor(
    id: int,
    data: VendorApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    vendor = db.query(Vendor).filter(Vendor.id == id, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id).first()
    if not vendor:
        raise HTTPException(404, "Vendor not found")
        
    vendor.status = VendorStatus.REJECTED.value
    if data and data.remarks:
        vendor.rejection_remarks = data.remarks
    db.commit()
    return {"message": "Rejected", "status": vendor.status}
