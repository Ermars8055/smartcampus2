"""Terms and Conditions routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import TermsAndConditions, User
from app.schemas import TermCreate, TermUpdate, TermOut
from app.auth import require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api/terms", tags=["Terms & Conditions"])

@router.get("")
def list_terms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_orders", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    terms = db.query(TermsAndConditions).filter(
        TermsAndConditions.tenant_id == tenant_id,
        TermsAndConditions.site_id == site_id,
        TermsAndConditions.is_active == True
    ).order_by(TermsAndConditions.name).all()
    return terms


@router.post("")
def create_term(
    data: TermCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if data.is_default:
        db.query(TermsAndConditions).filter(
            TermsAndConditions.tenant_id == tenant_id,
            TermsAndConditions.site_id == site_id
        ).update({"is_default": False})

    term = TermsAndConditions(**data.model_dump(), tenant_id=tenant_id, site_id=site_id)
    db.add(term)
    db.commit()
    return {"id": term.id, "message": "Terms and conditions created successfully"}


@router.put("/{id}")
def update_term(
    id: int, 
    data: TermUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    term = db.query(TermsAndConditions).filter(
        TermsAndConditions.id == id, 
        TermsAndConditions.tenant_id == tenant_id, 
        TermsAndConditions.site_id == site_id
    ).first()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    update_data = data.model_dump(exclude_unset=True)
    
    if update_data.get("is_default"):
        db.query(TermsAndConditions).filter(
            TermsAndConditions.tenant_id == tenant_id,
            TermsAndConditions.site_id == site_id,
            TermsAndConditions.id != id
        ).update({"is_default": False})
        
    for k, v in update_data.items():
        setattr(term, k, v)
        
    db.commit()
    return {"message": "Terms and conditions updated successfully"}


@router.delete("/{id}")
def delete_term(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("purchase_orders", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    term = db.query(TermsAndConditions).filter(
        TermsAndConditions.id == id, 
        TermsAndConditions.tenant_id == tenant_id, 
        TermsAndConditions.site_id == site_id
    ).first()
    
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")
        
    term.is_active = False
    if term.is_default:
        term.is_default = False
    db.commit()
    return {"message": "Terms and conditions deactivated"}
