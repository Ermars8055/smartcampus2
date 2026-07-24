"""Approval Flows Router."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import ApprovalFlow, User
from app.schemas import ApprovalFlowCreate, ApprovalFlowOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api/approval-flows", tags=["Approval Flows"])

@router.get("", response_model=List[ApprovalFlowOut])
def list_approval_flows(
    document_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(ApprovalFlow).filter(ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id)
    if document_type:
        q = q.filter(ApprovalFlow.document_type == document_type)
    flows = q.order_by(ApprovalFlow.level).all()
    
    results = []
    for f in flows:
        out = ApprovalFlowOut.from_orm(f)
        if f.user:
            out.user_full_name = f.user.full_name
        results.append(out)
    return results

@router.post("", response_model=ApprovalFlowOut)
def create_approval_flow(
    data: ApprovalFlowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    flow = ApprovalFlow(
        tenant_id=tenant_id,
        site_id=site_id,
        **data.dict()
    )
    db.add(flow)
    db.commit()
    db.refresh(flow)
    
    out = ApprovalFlowOut.from_orm(flow)
    if flow.user:
        out.user_full_name = flow.user.full_name
    return out

@router.put("/{id}", response_model=ApprovalFlowOut)
def update_approval_flow(
    id: int,
    data: ApprovalFlowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    flow = db.query(ApprovalFlow).filter(
        ApprovalFlow.id == id, ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id
    ).first()
    if not flow:
        raise HTTPException(404, "Approval Flow not found")
        
    for k, v in data.dict().items():
        setattr(flow, k, v)
        
    db.commit()
    db.refresh(flow)
    
    out = ApprovalFlowOut.from_orm(flow)
    if flow.user:
        out.user_full_name = flow.user.full_name
    return out

@router.delete("/{id}")
def delete_approval_flow(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("admin_roles", "delete")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    flow = db.query(ApprovalFlow).filter(
        ApprovalFlow.id == id, ApprovalFlow.tenant_id == tenant_id, ApprovalFlow.site_id == site_id
    ).first()
    if not flow:
        raise HTTPException(404, "Approval Flow not found")
        
    db.delete(flow)
    db.commit()
    return {"detail": "Deleted"}
