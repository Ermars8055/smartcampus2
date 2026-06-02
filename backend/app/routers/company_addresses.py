"""Company Address routes - Manage Ship-to and Bill-to addresses."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import CompanyAddress, User
from app.schemas import CompanyAddressCreate, CompanyAddressOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api/company-addresses", tags=["Company Addresses"])


@router.get("", response_model=List[CompanyAddressOut])
def list_company_addresses(
    address_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(CompanyAddress).filter(
        CompanyAddress.tenant_id == tenant_id,
        CompanyAddress.site_id == site_id,
        CompanyAddress.is_deleted == False,
        CompanyAddress.is_active == True
    )
    if address_type:
        q = q.filter(CompanyAddress.address_type == address_type)
    
    return q.order_by(CompanyAddress.name).all()


@router.post("", response_model=CompanyAddressOut)
def create_company_address(
    data: CompanyAddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    payload = data.model_dump()
    if not payload.get("code"):
        payload["code"] = get_next_number(db, tenant_id, site_id, "COMPANY_ADDRESS", "ADDR")
        
    addr = CompanyAddress(
        tenant_id=tenant_id,
        site_id=site_id,
        **payload
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr


@router.put("/{id}", response_model=CompanyAddressOut)
def update_company_address(
    id: int,
    data: CompanyAddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    addr = db.query(CompanyAddress).filter(
        CompanyAddress.id == id,
        CompanyAddress.tenant_id == tenant_id,
        CompanyAddress.site_id == site_id,
        CompanyAddress.is_deleted == False
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(addr, key, value)
        
    db.commit()
    db.refresh(addr)
    return addr


@router.delete("/{id}")
def delete_company_address(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    addr = db.query(CompanyAddress).filter(
        CompanyAddress.id == id,
        CompanyAddress.tenant_id == tenant_id,
        CompanyAddress.site_id == site_id,
        CompanyAddress.is_deleted == False
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    
    addr.is_deleted = True
    db.commit()
    return {"detail": "Address deleted"}
