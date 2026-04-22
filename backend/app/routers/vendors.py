"""Vendor management routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.database import get_db
from app.models import Vendor, VendorCategory, Category, User
from app.schemas import VendorCreate, VendorUpdate, VendorOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api/vendors", tags=["Vendors"])


@router.get("")
def list_vendors(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("vendors", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(Vendor).filter(
        Vendor.tenant_id == tenant_id, Vendor.site_id == site_id, Vendor.is_active == True
    )
    if search:
        q = q.filter(or_(
            Vendor.name.ilike(f"%{search}%"),
            Vendor.code.ilike(f"%{search}%")
        ))
    vendors = q.order_by(Vendor.name).all()
    result = []
    for v in vendors:
        cats = db.query(Category.name).join(
            VendorCategory, VendorCategory.category_id == Category.id
        ).filter(VendorCategory.vendor_id == v.id).all()
        result.append(VendorOut(
            id=v.id, name=v.name, code=v.code,
            contact_person=v.contact_person, phone=v.phone,
            email=v.email, gst_number=v.gst_number,
            pan_number=v.pan_number, address=v.address,
            city=v.city, state=v.state, pincode=v.pincode,
            rating=v.rating, is_active=v.is_active,
            created_at=v.created_at,
            categories=[c[0] for c in cats]
        ))
    return result


@router.get("/{id}")
def get_vendor(
    id: int, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("vendors", "read")),
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
            pan_number=v.pan_number, address=v.address,
            city=v.city, state=v.state, pincode=v.pincode,
            rating=v.rating, is_active=v.is_active,
            created_at=v.created_at,
            categories=[c[0] for c in cats]
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
    existing = db.query(Vendor).filter(
        Vendor.code == data.code, Vendor.tenant_id == tenant_id, Vendor.site_id == site_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor code already exists")
    vendor_data = data.model_dump(exclude={"category_ids"})
    vendor = Vendor(**vendor_data, tenant_id=tenant_id, site_id=site_id)
    db.add(vendor)
    db.flush()
    for cat_id in data.category_ids:
        db.add(VendorCategory(vendor_id=vendor.id, category_id=cat_id))
    db.commit()
    db.refresh(vendor)
    return {"id": vendor.id, "message": "Vendor created successfully"}


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
