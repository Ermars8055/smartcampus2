"""Material Issue, Returns, and Stock Transfer routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import (
    MaterialIssue, MaterialIssueItem, MaterialReturn, MaterialReturnItem,
    StockTransfer, StockTransferItem, CurrentStock, StockLedger,
    Material, Warehouse, Block, User, AuditLog, Indent, IndentItem
)
from app.schemas import (
    IssueCreate, IssueOut, IssueItemOut,
    ReturnCreate, ReturnOut, ReturnItemOut,
    TransferCreate, TransferOut, TransferItemOut
)
from app.routers.grn import update_stock
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api", tags=["Store Operations"])


# ── Material Issues ──────────────────────────────────────────────────────

@router.get("/issues")
def list_issues(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("issues", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(MaterialIssue).filter(MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id)
    if project_id:
        q = q.filter(MaterialIssue.project_id == project_id)
    issues = q.order_by(MaterialIssue.created_at.desc()).all()
    result = []
    for iss in issues:
        items = []
        for item in iss.items:
            mat = item.material
            items.append(IssueItemOut(
                id=item.id, material_id=item.material_id,
                quantity=item.quantity, rate=item.rate,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        result.append(IssueOut(
            id=iss.id, issue_number=iss.issue_number,
            warehouse_id=iss.warehouse_id, project_id=iss.project_id,
            issued_to_block_id=iss.issued_to_block_id,
            issued_to_department=iss.issued_to_department,
            issued_to_contractor=iss.issued_to_contractor,
            purpose=iss.purpose, status=iss.status,
            received_by_name=iss.received_by_name,
            indent_id=iss.indent_id,
            is_acknowledged=iss.is_acknowledged,
            acknowledged_at=iss.acknowledged_at,
            created_at=iss.created_at,
            warehouse_name=iss.warehouse.name if iss.warehouse else None,
            project_name=iss.project.name if iss.project else None,
            block_name=iss.block.name if iss.block else None,
            items=items
        ))
    return result


@router.post("/issues")
def create_issue(
    data: IssueCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("issues", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    count = db.query(MaterialIssue).filter(MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id).count() + 1
    issue_number = f"ISS-{datetime.now().strftime('%Y%m')}-{count:04d}"

    issue = MaterialIssue(
        issue_number=issue_number,
        warehouse_id=data.warehouse_id,
        project_id=data.project_id,
        indent_id=data.indent_id,
        issued_to_block_id=data.issued_to_block_id,
        issued_to_department=data.issued_to_department,
        issued_to_contractor=data.issued_to_contractor,
        purpose=data.purpose,
        received_by_name=data.received_by_name,
        issued_by_id=current_user.id,
        status="Completed",
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(issue)
    db.flush()

    for item_data in data.items:
        # Check stock
        stock = db.query(CurrentStock).filter(
            CurrentStock.material_id == item_data.material_id,
            CurrentStock.warehouse_id == data.warehouse_id,
            CurrentStock.tenant_id == tenant_id,
            CurrentStock.site_id == site_id
        ).first()
        if not stock or stock.quantity < item_data.quantity:
            mat = db.query(Material).filter(Material.id == item_data.material_id).first()
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {mat.name if mat else 'material'} in selected warehouse"
            )

        mat_info = db.query(Material).filter(Material.id == item_data.material_id).first()
        rate = mat_info.standard_cost if mat_info else 0.0

        issue_item = MaterialIssueItem(
            issue_id=issue.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            rate=rate,
            remarks=item_data.remarks
        )
        db.add(issue_item)

        update_stock(
            db=db,
            material_id=item_data.material_id,
            warehouse_id=data.warehouse_id,
            quantity=-item_data.quantity,
            transaction_type="Issue",
            reference_type="Issue",
            reference_id=issue.id,
            reference_number=issue_number,
            tenant_id=tenant_id,
            site_id=site_id,
            project_id=data.project_id,
            block_id=data.issued_to_block_id,
            user_id=current_user.id
        )

    # If this issue is linked to an indent, update indent item issued quantities
    if data.indent_id:
        indent = db.query(Indent).filter(Indent.id == data.indent_id).first()
        if indent:
            for item_data in data.items:
                indent_item = db.query(IndentItem).filter(
                    IndentItem.indent_id == indent.id,
                    IndentItem.material_id == item_data.material_id
                ).first()
                if indent_item:
                    indent_item.issued_quantity += item_data.quantity

    db.commit()
    return {"id": issue.id, "issue_number": issue_number, "message": "Material issued successfully"}


@router.put("/issues/{issue_id}/acknowledge")
def acknowledge_issue(
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_tenant_id)
):
    issue = db.query(MaterialIssue).filter(
        MaterialIssue.id == issue_id,
        MaterialIssue.tenant_id == tenant_id
    ).first()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    if issue.is_acknowledged:
        return {"message": "Already acknowledged"}

    issue.is_acknowledged = True
    issue.acknowledged_at = datetime.utcnow()
    issue.acknowledged_by_id = current_user.id
    
    # Update IndentItem acknowledged quantities if linked
    if issue.indent_id:
        for item in issue.items:
            indent_item = db.query(IndentItem).filter(
                IndentItem.indent_id == issue.indent_id,
                IndentItem.material_id == item.material_id
            ).first()
            if indent_item:
                indent_item.acknowledged_quantity += item.quantity

    db.commit()
    return {"message": "Issue acknowledged successfully"}


# ── Material Returns ─────────────────────────────────────────────────────

@router.get("/returns")
def list_returns(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("returns", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(MaterialReturn).filter(MaterialReturn.tenant_id == tenant_id, MaterialReturn.site_id == site_id)
    if project_id:
        q = q.filter(MaterialReturn.project_id == project_id)
    returns = q.order_by(MaterialReturn.created_at.desc()).all()
    result = []
    for ret in returns:
        items = []
        for item in ret.items:
            mat = item.material
            items.append(ReturnItemOut(
                id=item.id, material_id=item.material_id,
                quantity=item.quantity, condition=item.condition,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        result.append(ReturnOut(
            id=ret.id, return_number=ret.return_number,
            warehouse_id=ret.warehouse_id, project_id=ret.project_id,
            returned_from_block_id=ret.returned_from_block_id,
            returned_from_department=ret.returned_from_department,
            return_type=ret.return_type, remarks=ret.remarks,
            returned_by_name=ret.returned_by_name,
            created_at=ret.created_at,
            warehouse_name=ret.warehouse.name if ret.warehouse else None,
            project_name=ret.project.name if ret.project else None,
            block_name=ret.block.name if ret.block else None,
            items=items
        ))
    return result


@router.post("/returns")
def create_return(
    data: ReturnCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("returns", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    count = db.query(MaterialReturn).filter(MaterialReturn.tenant_id == tenant_id, MaterialReturn.site_id == site_id).count() + 1
    return_number = f"RET-{datetime.now().strftime('%Y%m')}-{count:04d}"

    ret = MaterialReturn(
        return_number=return_number,
        warehouse_id=data.warehouse_id,
        project_id=data.project_id,
        returned_from_block_id=data.returned_from_block_id,
        returned_from_department=data.returned_from_department,
        return_type=data.return_type,
        remarks=data.remarks,
        returned_by_name=data.returned_by_name,
        received_by_id=current_user.id,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(ret)
    db.flush()

    for item_data in data.items:
        ret_item = MaterialReturnItem(
            return_id=ret.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            condition=item_data.condition,
            remarks=item_data.remarks
        )
        db.add(ret_item)

        update_stock(
            db=db,
            material_id=item_data.material_id,
            warehouse_id=data.warehouse_id,
            quantity=item_data.quantity,
            transaction_type="Return",
            reference_type="Return",
            reference_id=ret.id,
            reference_number=return_number,
            tenant_id=tenant_id,
            site_id=site_id,
            project_id=data.project_id,
            block_id=data.returned_from_block_id,
            user_id=current_user.id
        )

    db.commit()
    return {"id": ret.id, "return_number": return_number, "message": "Material return recorded"}


# ── Stock Transfers ──────────────────────────────────────────────────────

@router.get("/transfers")
def list_transfers(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("transfers", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(StockTransfer).filter(StockTransfer.tenant_id == tenant_id, StockTransfer.site_id == site_id)
    if project_id:
        q = q.filter(StockTransfer.project_id == project_id)
    transfers = q.order_by(StockTransfer.created_at.desc()).all()
    result = []
    for t in transfers:
        items = []
        for item in t.items:
            mat = item.material
            items.append(TransferItemOut(
                id=item.id, material_id=item.material_id,
                quantity=item.quantity, remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        result.append(TransferOut(
            id=t.id, transfer_number=t.transfer_number,
            from_warehouse_id=t.from_warehouse_id,
            to_warehouse_id=t.to_warehouse_id,
            project_id=t.project_id, status=t.status,
            remarks=t.remarks, created_at=t.created_at,
            completed_at=t.completed_at,
            from_warehouse_name=t.from_warehouse.name if t.from_warehouse else None,
            to_warehouse_name=t.to_warehouse.name if t.to_warehouse else None,
            project_name=t.project.name if t.project else None,
            items=items
        ))
    return result


@router.post("/transfers")
def create_transfer(
    data: TransferCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("transfers", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if data.from_warehouse_id == data.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouse cannot be the same")

    count = db.query(StockTransfer).filter(StockTransfer.tenant_id == tenant_id, StockTransfer.site_id == site_id).count() + 1
    transfer_number = f"TRF-{datetime.now().strftime('%Y%m')}-{count:04d}"

    transfer = StockTransfer(
        transfer_number=transfer_number,
        from_warehouse_id=data.from_warehouse_id,
        to_warehouse_id=data.to_warehouse_id,
        project_id=data.project_id,
        remarks=data.remarks,
        created_by_id=current_user.id,
        status="Completed",
        completed_at=datetime.utcnow(),
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(transfer)
    db.flush()

    for item_data in data.items:
        stock = db.query(CurrentStock).filter(
            CurrentStock.material_id == item_data.material_id,
            CurrentStock.warehouse_id == data.from_warehouse_id,
            CurrentStock.tenant_id == tenant_id,
            CurrentStock.site_id == site_id
        ).first()
        if not stock or stock.quantity < item_data.quantity:
            mat = db.query(Material).filter(Material.id == item_data.material_id).first()
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {mat.name if mat else 'material'} in source warehouse"
            )

        t_item = StockTransferItem(
            transfer_id=transfer.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            remarks=item_data.remarks
        )
        db.add(t_item)

        update_stock(
            db=db,
            material_id=item_data.material_id,
            warehouse_id=data.from_warehouse_id,
            quantity=-item_data.quantity,
            transaction_type="Transfer Out",
            reference_type="Transfer",
            reference_id=transfer.id,
            reference_number=transfer_number,
            tenant_id=tenant_id,
            site_id=site_id,
            project_id=data.project_id,
            user_id=current_user.id
        )

        update_stock(
            db=db,
            material_id=item_data.material_id,
            warehouse_id=data.to_warehouse_id,
            quantity=item_data.quantity,
            transaction_type="Transfer In",
            reference_type="Transfer",
            reference_id=transfer.id,
            reference_number=transfer_number,
            tenant_id=tenant_id,
            site_id=site_id,
            project_id=data.project_id,
            user_id=current_user.id
        )

    db.commit()
    return {"id": transfer.id, "transfer_number": transfer_number, "message": "Stock transfer completed"}

