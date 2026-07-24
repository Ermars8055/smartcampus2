from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    Material, PurchaseOrder, PurchaseOrderItem, GRN, GRNItem,
    MaterialIssue, MaterialIssueItem, Building, Project, User, Room, Floor
)
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])

def parse_date(date_str: Optional[str]):
    if not date_str: return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None

@router.get("/consumption")
def get_consumption_report(
    project_id: Optional[int] = None,
    institution_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    sd = parse_date(start_date)
    ed = parse_date(end_date)
    
    from app.models import Institution, Indent
    from sqlalchemy.orm import aliased
    
    BuildingInst = aliased(Institution)
    IndentInst = aliased(Institution)
    
    loc_label = func.coalesce(Building.name, MaterialIssue.issued_to_department, "Unknown")
    inst_label = func.coalesce(IndentInst.name, BuildingInst.name, "Unknown Institution")
    
    query = db.query(
        loc_label.label("building_name"),
        inst_label.label("institution_name"),
        Material.name.label("material_name"),
        func.sum(MaterialIssueItem.quantity).label("total_quantity"),
        func.sum(MaterialIssueItem.quantity * MaterialIssueItem.rate).label("total_value")
    ).join(MaterialIssue, MaterialIssueItem.issue_id == MaterialIssue.id)\
     .join(Material, MaterialIssueItem.material_id == Material.id)\
     .outerjoin(Building, MaterialIssue.building_id == Building.id)\
     .outerjoin(BuildingInst, Building.institution_id == BuildingInst.id)\
     .outerjoin(Indent, MaterialIssue.indent_id == Indent.id)\
     .outerjoin(IndentInst, Indent.institution_id == IndentInst.id)\
     .filter(MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id)
    
    if project_id:
        query = query.filter(MaterialIssue.project_id == project_id)
    if institution_id:
        query = query.filter(func.coalesce(Indent.institution_id, Building.institution_id) == institution_id)
    if sd:
        query = query.filter(MaterialIssue.created_at >= sd)
    if ed:
        query = query.filter(MaterialIssue.created_at <= ed)
        
    results = query.group_by(loc_label, inst_label, Material.name).all()
    
    return [
        {
            "building_name": r.building_name,
            "institution_name": r.institution_name,
            "material_name": r.material_name,
            "total_quantity": r.total_quantity,
            "total_value": r.total_value
        } for r in results
    ]

@router.get("/query")
def query_intelligence(
    q: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    """
    A simple rule-based 'AI' bot to handle purchase history inquiries.
    In a real app, this would use an LLM or more complex NLP.
    """
    q = q.lower()
    
    # 1. Last Purchase Price (LPP) inquiries
    if "lpp" in q or "last purchase price" in q:
        # Extract material name from query (naive implementation)
        # Assuming format: "lpp for cement"
        parts = q.split("for")
        if len(parts) > 1:
            mat_query = parts[1].strip()
            # Find material
            material = db.query(Material).filter(
                Material.tenant_id == tenant_id,
                Material.name.ilike(f"%{mat_query}%")
            ).first()
            
            if material:
                # Find last purchase
                last_po_item = db.query(PurchaseOrderItem).join(PurchaseOrder).filter(
                    PurchaseOrderItem.material_id == material.id,
                    PurchaseOrder.tenant_id == tenant_id,
                    PurchaseOrder.status != "Draft"
                ).order_by(PurchaseOrder.created_at.desc()).first()
                
                if last_po_item:
                    return {
                        "answer": f"The last purchase price for **{material.name}** was **₹{last_po_item.rate}** per {material.uom.abbreviation if material.uom else 'unit'}.",
                        "data": {"lpp": last_po_item.rate, "date": last_po_item.purchase_order.created_at}
                    }
                return {"answer": f"No purchase history found for **{material.name}**."}
            return {"answer": f"Material matching '{mat_query}' not found."}

    # 2. Last 5 purchase prices
    if "last 5" in q or "last five" in q or "purchase history" in q:
        parts = q.split("for")
        if len(parts) > 1:
            mat_query = parts[1].strip()
            material = db.query(Material).filter(
                Material.tenant_id == tenant_id,
                Material.name.ilike(f"%{mat_query}%")
            ).first()
            
            if material:
                history = db.query(PurchaseOrderItem).join(PurchaseOrder).filter(
                    PurchaseOrderItem.material_id == material.id,
                    PurchaseOrder.tenant_id == tenant_id,
                    PurchaseOrder.status != "Draft"
                ).order_by(PurchaseOrder.created_at.desc()).limit(5).all()
                
                if history:
                    lines = [f"Last 5 purchases for **{material.name}**:"]
                    for it in history:
                        lines.append(f"- ₹{it.rate} ({it.purchase_order.created_at.strftime('%d %b %Y')})")
                    return {"answer": "\n".join(lines)}
                return {"answer": f"No purchase history found for **{material.name}**."}
                
    return {
        "answer": "I can help with purchase history. Try asking:\n- 'LPP for cement'\n- 'Last 5 purchase prices for steel'\n- 'Purchase history for bricks'"
    }
