from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
import json

from app.database import get_db
from app.auth import get_current_user
from app.core.context import current_tenant_id, current_site_id, current_user_id
from app.models import (
    VendorWorkOrder, VendorWorkOrderItem, VendorWorkOrderImage, 
    VendorWorkOrderDocument, Vendor, Complaint, EquipmentItem, Institution, Material
)
from app import schemas
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api/vendor-work-orders", tags=["Vendor Work Orders"])

@router.get("/", response_model=List[schemas.VendorWorkOrderOut])
def get_vendor_work_orders(
    skip: int = 0,
    limit: int = 100,
    vendor_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    tenant_id = current_tenant_id.get()
    site_id = current_site_id.get()
    
    query = db.query(VendorWorkOrder).filter(
        VendorWorkOrder.tenant_id == tenant_id,
        VendorWorkOrder.site_id == site_id,
        VendorWorkOrder.is_deleted == False
    )
    
    if vendor_id:
        query = query.filter(VendorWorkOrder.vendor_id == vendor_id)
    if status:
        query = query.filter(VendorWorkOrder.status == status)
        
    vwos = query.order_by(desc(VendorWorkOrder.created_at)).offset(skip).limit(limit).all()
    print("VWO count in db query:", len(vwos), "Tenant:", tenant_id, "Site:", site_id)
    
    # Enrich with names
    result = []
    for vwo in vwos:
        out_dict = {c.name: getattr(vwo, c.name) for c in vwo.__table__.columns}
        
        # Vendor Name
        vendor = db.query(Vendor).filter(Vendor.id == vwo.vendor_id).first()
        out_dict['vendor_name'] = vendor.name if vendor else None
        
        # Institution Name
        if vwo.institution_id:
            inst = db.query(Institution).filter(Institution.id == vwo.institution_id).first()
            out_dict['institution_name'] = inst.name if inst else None
            

        # Equipment info
        equip = db.query(EquipmentItem).filter(EquipmentItem.id == vwo.equipment_id).first()
        if equip:
            out_dict['equipment_code'] = equip.equipment_code
            if equip.material:
                out_dict['equipment_name'] = equip.material.name
                
        # Created by
        out_dict['created_by_name'] = vwo.created_by.full_name if vwo.created_by else None
        
        result.append(out_dict)
        
    return result


@router.post("/", response_model=schemas.VendorWorkOrderOut, status_code=status.HTTP_201_CREATED)
def create_vendor_work_order(
    vwo: schemas.VendorWorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    tenant_id = current_tenant_id.get()
    site_id = current_site_id.get()
    
    # Generate VWO Number
    vwo_number = get_next_number(db, tenant_id, site_id, "VENDOR_WORK_ORDER", "VWO")
    
    db_vwo = VendorWorkOrder(
        tenant_id=tenant_id,
        site_id=site_id,
        vwo_number=vwo_number,
        institution_id=vwo.institution_id if hasattr(vwo, 'institution_id') else None,
        vendor_id=vwo.vendor_id,

        equipment_id=vwo.equipment_id,
        priority=vwo.priority,
        target_date=vwo.target_date,
        service_type=vwo.service_type,
        scope_of_work=vwo.scope_of_work,
        vendor_instructions=vwo.vendor_instructions,
        quotation_no=vwo.quotation_no,
        vendor_quote_amount=vwo.vendor_quote_amount,
        labour_charges=vwo.labour_charges,
        service_charges=vwo.service_charges,
        tax=vwo.tax,
        total_approved_amount=vwo.total_approved_amount,
        status=vwo.status,
        created_by_id=current_user_id.get()
    )
    
    db.add(db_vwo)
    db.commit()
    db.refresh(db_vwo)
    
    # Add Items if any
    for item in vwo.items:
        db_item = VendorWorkOrderItem(
            vwo_id=db_vwo.id,
            material_id=item.material_id,
            description=item.description,
            quantity=item.quantity,
            rate=item.rate,
            amount=item.amount
        )
        db.add(db_item)
        

    db.commit()
    return get_vwo_detail(db_vwo.id, db)


@router.get("/{vwo_id}", response_model=schemas.VendorWorkOrderOut)
def get_vwo_by_id(
    vwo_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return get_vwo_detail(vwo_id, db)


@router.put("/{vwo_id}", response_model=schemas.VendorWorkOrderOut)
def update_vendor_work_order(
    vwo_id: int,
    vwo_update: schemas.VendorWorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    tenant_id = current_tenant_id.get()
    db_vwo = db.query(VendorWorkOrder).filter(
        VendorWorkOrder.id == vwo_id,
        VendorWorkOrder.tenant_id == tenant_id,
        VendorWorkOrder.is_deleted == False
    ).first()
    
    if not db_vwo:
        raise HTTPException(status_code=404, detail="Vendor Work Order not found")
        
    update_data = vwo_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vwo, key, value)
        
    db.commit()
    return get_vwo_detail(vwo_id, db)


def get_vwo_detail(vwo_id: int, db: Session):
    tenant_id = current_tenant_id.get()
    vwo = db.query(VendorWorkOrder).filter(
        VendorWorkOrder.id == vwo_id,
        VendorWorkOrder.tenant_id == tenant_id,
        VendorWorkOrder.is_deleted == False
    ).first()
    
    if not vwo:
        raise HTTPException(status_code=404, detail="Vendor Work Order not found")
        
    out_dict = {c.name: getattr(vwo, c.name) for c in vwo.__table__.columns}
    
    # Enrichment
    vendor = db.query(Vendor).filter(Vendor.id == vwo.vendor_id).first()
    out_dict['vendor_name'] = vendor.name if vendor else None
    
    if vwo.institution_id:
        inst = db.query(Institution).filter(Institution.id == vwo.institution_id).first()
        out_dict['institution_name'] = inst.name if inst else None
        

    equip = db.query(EquipmentItem).filter(EquipmentItem.id == vwo.equipment_id).first()
    if equip:
        out_dict['equipment_code'] = equip.equipment_code
        if equip.material:
            out_dict['equipment_name'] = equip.material.name
            
    out_dict['created_by_name'] = vwo.created_by.full_name if vwo.created_by else None
    
    # Items
    items_out = []
    for item in vwo.items:
        i_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        if item.material:
            i_dict['material_name'] = item.material.name
            i_dict['material_code'] = item.material.code
            i_dict['uom_name'] = item.material.uom.name if item.material.uom else None
        items_out.append(i_dict)
    out_dict['items'] = items_out
    
    # Attachments
    out_dict['images'] = [
        {c.name: getattr(img, c.name) for c in img.__table__.columns} 
        for img in vwo.images
    ]
    out_dict['documents'] = []
    for doc in vwo.documents:
        d_dict = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}
        if doc.uploaded_by:
            d_dict['uploaded_by_name'] = doc.uploaded_by.full_name
        out_dict['documents'].append(d_dict)
        
    return out_dict
