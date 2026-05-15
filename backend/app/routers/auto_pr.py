"""Auto PR generation from materials below reorder level."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Dict, Any
from app.database import get_db
from app.models import User, Material, CurrentStock, PurchaseRequest, PurchaseRequestItem, Project
from app.auth import get_current_user, get_tenant_id, get_site_id, require_permission
from app.utils.sequences import get_next_number
from pydantic import BaseModel

router = APIRouter(prefix="/api/auto-pr", tags=["Auto PR"])

class AutoPRItem(BaseModel):
    material_id: int
    quantity: float
    project_id: int

class AutoPRRequest(BaseModel):
    items: List[AutoPRItem]
    remarks: str = "Auto-generated PR from reorder levels"

@router.get("/below-reorder")
def get_materials_below_reorder(
    site_id: int = Depends(get_site_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read"))
):
    """Get all materials where current stock is below reorder level for the current site."""
    # Group stock by material
    stock_summary = db.query(
        CurrentStock.material_id,
        func.sum(CurrentStock.quantity).label("total_qty")
    ).filter(
        CurrentStock.site_id == site_id
    ).group_by(CurrentStock.material_id).subquery()
    
    # Join with materials to find those below reorder level
    materials = db.query(Material, stock_summary.c.total_qty).outerjoin(
        stock_summary, Material.id == stock_summary.c.material_id
    ).filter(
        Material.site_id == site_id,
        Material.is_deleted == False,
        Material.reorder_level > 0
    ).all()
    
    result = []
    for mat, total_qty in materials:
        qty = total_qty or 0
        if qty < mat.reorder_level:
            suggested_qty = max(0, mat.maximum_level - qty) if mat.maximum_level else (mat.reorder_level * 2 - qty)
            result.append({
                "material": mat,
                "current_stock": qty,
                "reorder_level": mat.reorder_level,
                "maximum_level": mat.maximum_level,
                "suggested_quantity": suggested_qty
            })
            
    return result

@router.post("/generate")
def generate_auto_pr(
    request: AutoPRRequest,
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "create"))
):
    """Generate a PR for selected items."""
    if not request.items:
        raise HTTPException(status_code=400, detail="No items provided")
        
    # Group items by project_id since a PR is tied to a project
    by_project = {}
    for item in request.items:
        if item.project_id not in by_project:
            by_project[item.project_id] = []
        by_project[item.project_id].append(item)
        
    prs_created = []
    
    for project_id, items in by_project.items():
        # Validate project belongs to site
        project = db.query(Project).filter(
            Project.id == project_id, 
            Project.site_id == site_id,
            Project.is_deleted == False
        ).first()
        
        if not project:
            continue
            
        pr = PurchaseRequest(
            pr_number=get_next_number(db, tenant_id, site_id, "PURCHASE_REQUEST", "PR"),
            requester_id=current_user.id,
            project_id=project_id,
            required_date=date.today(), # Or add delta
            status="Submitted",
            remarks=request.remarks,
            site_id=site_id
        )
        db.add(pr)
        db.flush()
        
        for item in items:
            pr_item = PurchaseRequestItem(
                pr_id=pr.id,
                material_id=item.material_id,
                quantity=item.quantity
            )
            db.add(pr_item)
            
        prs_created.append(pr)
        
    db.commit()
    
    return {"message": f"{len(prs_created)} Purchase Requests generated successfully.", "pr_ids": [pr.id for pr in prs_created]}
