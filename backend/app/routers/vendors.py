"""Vendor management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import Vendor, VendorCategory, Category, User, VendorStatus, ApprovalFlow, VendorApproval, VendorHistory
from app.schemas import VendorCreate, VendorUpdate, VendorOut, VendorApprovalCreate, VendorHistoryOut
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
        if v.status == VendorStatus.SUBMITTED.value:
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
            previous_status=v.previous_status,
            previous_status_by_id=v.previous_status_by_id,
            previous_status_at=v.previous_status_at,
            previous_status_by_name=v.previous_approver.full_name if v.previous_approver else None,
            last_changes=v.last_changes,
            rejected_by_id=v.rejected_by_id,
            rejected_at=v.rejected_at,
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
    can_user_approve = False
    if v.status == VendorStatus.SUBMITTED.value:
        flows = db.query(ApprovalFlow).filter(
            ApprovalFlow.tenant_id == tenant_id,
            ApprovalFlow.site_id == site_id,
            ApprovalFlow.document_type == "VENDOR",
            ApprovalFlow.level == v.current_approval_level,
            ApprovalFlow.is_active == True
        ).all()
        user_roles = getattr(current_user, "_roles", [])
        is_platform_admin = getattr(current_user, "_is_platform_admin", False)
        can_override = is_platform_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'
        
        if not flows and can_override:
            can_user_approve = True
        else:
            for f in flows:
                if can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles):
                    can_user_approve = True
                    break

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
            previous_status=v.previous_status,
            previous_status_by_id=v.previous_status_by_id,
            previous_status_at=v.previous_status_at,
            previous_status_by_name=v.previous_approver.full_name if v.previous_approver else None,
            last_changes=v.last_changes,
            rejected_by_id=v.rejected_by_id,
            rejected_at=v.rejected_at,
            created_at=v.created_at,
            categories=[c[0] for c in cats],
            can_user_approve=can_user_approve
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
    vendor_data["is_active"] = False
    vendor = Vendor(**vendor_data, status=VendorStatus.SUBMITTED.value, current_approval_level=1, tenant_id=tenant_id, site_id=site_id)
    db.add(vendor)
    db.flush()
    for cat_id in data.category_ids:
        db.add(VendorCategory(vendor_id=vendor.id, category_id=cat_id))
    db.add(VendorHistory(vendor_id=vendor.id, action="Created", action_by_id=current_user.id))
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
    
    if "name" in update_data:
        del update_data["name"]
        
    if "status" in update_data and update_data["status"] == vendor.status:
        del update_data["status"]

    changes = {}
    for k, v in update_data.items():
        if k != "status":
            old_val = getattr(vendor, k, None)
            if old_val != v:
                changes[k] = {"old": old_val, "new": v}
                
    if data.category_ids is not None:
        old_cat_ids = [c.category_id for c in db.query(VendorCategory).filter(VendorCategory.vendor_id == vendor.id).all()]
        if set(old_cat_ids) != set(data.category_ids):
            old_cat_names = [c.name for c in db.query(Category).filter(Category.id.in_(old_cat_ids)).all()]
            new_cat_names = [c.name for c in db.query(Category).filter(Category.id.in_(data.category_ids)).all()]
            changes["categories"] = {"old": old_cat_names, "new": new_cat_names}

    # Check if changes warrant re-approval (exclude is_active and rating)
    trigger_approval = any(k for k in changes.keys() if k not in ["is_active", "rating"])

    if trigger_approval and vendor.status in [VendorStatus.APPROVED.value, VendorStatus.REJECTED.value] and "status" not in update_data:
        vendor.previous_status = vendor.status
        if vendor.status == VendorStatus.APPROVED.value:
            vendor.previous_status_by_id = vendor.approved_by_id
            vendor.previous_status_at = vendor.approved_at
        else:
            vendor.previous_status_by_id = vendor.rejected_by_id
            vendor.previous_status_at = vendor.rejected_at
        vendor.last_changes = changes
        
        update_data["status"] = VendorStatus.SUBMITTED.value
        update_data["current_approval_level"] = 1
        update_data["rejection_remarks"] = None
        update_data["is_active"] = False
        
        db.query(VendorApproval).filter(VendorApproval.vendor_id == vendor.id).delete()
        
        db.add(VendorHistory(vendor_id=vendor.id, action="Edited and Resubmitted", changes=changes, action_by_id=current_user.id))
    elif changes:
        db.add(VendorHistory(vendor_id=vendor.id, action="Edited", changes=changes, action_by_id=current_user.id))

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
    if vendor.status != VendorStatus.SUBMITTED.value:
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
        db.add(VendorHistory(vendor_id=vendor.id, action=f"Approved at Level {vendor.current_approval_level-1}", action_by_id=user_id))
        db.commit()
        return {"message": f"Moved to level {next_level}", "status": vendor.status, "current_level": vendor.current_approval_level}
    else:
        vendor.status = VendorStatus.APPROVED.value
        vendor.is_active = True
        vendor.approved_by_id = user_id
        vendor.approved_at = datetime.utcnow()
        db.add(VendorHistory(vendor_id=vendor.id, action="Fully Approved", action_by_id=user_id))
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
    vendor.is_active = False
    vendor.rejected_by_id = current_user.id
    vendor.rejected_at = datetime.utcnow()
    if data and data.remarks:
        vendor.rejection_remarks = data.remarks
    db.add(VendorHistory(vendor_id=vendor.id, action="Rejected", remarks=data.remarks if data else None, action_by_id=current_user.id))
    db.commit()
    return {"message": "Rejected", "status": vendor.status}

@router.get("/{id}/history", response_model=List[VendorHistoryOut])
def get_vendor_history(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    history = db.query(VendorHistory).filter(VendorHistory.vendor_id == id).order_by(VendorHistory.action_at.desc()).all()
    for h in history:
        h.action_by_name = h.action_by.full_name if h.action_by else None
    return history
