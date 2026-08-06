"""Material Issue, Returns, and Stock Transfer routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import (
    MaterialIssue, MaterialIssueItem, MaterialReturn, MaterialReturnItem,
    StockTransfer, StockTransferItem, CurrentStock, StockLedger,
    Material, Warehouse, User, AuditLog, Indent, IndentItem, IndentStatus,
    Room, Floor, Building, DocumentSequence, GatePass, GatePassItem,
    DepartmentMaterialLimit, WriteOff, WriteOffItem, WriteOffStatus
)
from app.schemas import (
    IssueCreate, IssueOut, IssueItemOut,
    ReturnCreate, ReturnOut, ReturnItemOut, ReturnReceiptRequest,
    TransferCreate, TransferOut, TransferItemOut, TransferReceiptRequest,
    GatePassCreate, GatePassOut, GatePassUpdate,
    GatePassItemOut, GatePassItemBase,
    WriteOffCreate, WriteOffOut, WriteOffItemOut
)
from app.routers.grn import update_stock
from app.auth import get_current_user, require_permission, require_action, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number

def require_issues_or_acks(current_user: User = Depends(get_current_user)):
    if getattr(current_user, '_is_platform_admin', False):
        return current_user
    perms = getattr(current_user, '_permissions', {})
    if perms.get('issues', {}).get('can_read', False) or perms.get('acknowledgements', {}).get('can_read', False):
        return current_user
    raise HTTPException(403, "Permission denied: read on issues or acknowledgements")

router = APIRouter(prefix="/api", tags=["Store Operations"])


# ── Material Issues ──────────────────────────────────────────────────────

@router.get("/issues")
def list_issues(
    search: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_issues_or_acks),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(MaterialIssue).filter(MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id)
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        
        if current_user.institution:
            from app.models import Institution
            q = q.outerjoin(Indent, MaterialIssue.indent_id == Indent.id).outerjoin(Institution, Indent.institution_id == Institution.id).filter(
                Institution.name == current_user.institution
            )
        elif scope not in ["Full Administrative Access", "Organization"]:
            q = q.outerjoin(Indent, MaterialIssue.indent_id == Indent.id)
            if scope == "Department":
                if current_user.department:
                    q = q.filter(
                        (MaterialIssue.issued_to_department == current_user.department) |
                        (Indent.department == current_user.department)
                    )
                else:
                    q = q.filter(
                        (MaterialIssue.issued_by_id == current_user.id) |
                        (Indent.requester_id == current_user.id)
                    )
            else:
                q = q.filter(
                    (MaterialIssue.issued_by_id == current_user.id) |
                    (Indent.requester_id == current_user.id)
                )

    if search:
        q = q.filter(MaterialIssue.issue_number.ilike(f"%{search}%"))
    if project_id:
        q = q.filter(MaterialIssue.project_id == project_id)
    issues = q.order_by(MaterialIssue.created_at.desc()).all()
    result = []
    for iss in issues:
        items = []
        for item in iss.items:
            mat = item.material
            wh = item.warehouse
            items.append(IssueItemOut(
                id=item.id, material_id=item.material_id,
                warehouse_id=item.warehouse_id,
                warehouse_name=wh.name if wh else None,
                quantity=round(item.quantity or 0), rate=item.rate,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.abbreviation if mat and mat.uom else None
            ))
        room_name = iss.room.name if iss.room else None
        floor_name = iss.room.floor.name if iss.room and iss.room.floor else None
        building_name = iss.room.floor.building.name if iss.room and iss.room.floor and iss.room.floor.building else (iss.building.name if iss.building else None)

        dept_name = iss.issued_to_department or (iss.room.department_name if iss.room else None) or (iss.indent.department_name if getattr(iss, 'indent', None) else None)

        inst_name = None
        if iss.indent and iss.indent.institution:
            inst_name = iss.indent.institution.name
        elif iss.building and iss.building.institution:
            inst_name = iss.building.institution.name

        result.append(IssueOut(
            id=iss.id, issue_number=iss.issue_number,
            warehouse_id=iss.warehouse_id, project_id=iss.project_id,
            issued_to_room_id=iss.issued_to_room_id,
            issued_to_department=dept_name,
            issued_to_contractor=iss.issued_to_contractor,
            purpose=iss.purpose, status=iss.status,
            received_by_name=iss.received_by_name,
            indent_id=iss.indent_id,
            is_acknowledged=iss.is_acknowledged,
            acknowledged_at=iss.acknowledged_at,
            created_at=iss.created_at,
            warehouse_name=iss.warehouse.name if iss.warehouse else None,
            project_name=iss.project.name if iss.project else None,
            institution_name=inst_name,
            room_name=room_name,
            floor_name=floor_name,
            building_name=building_name,
            issued_by_name=iss.issued_by.full_name if iss.issued_by else None,
            acknowledged_by_name=iss.acknowledged_by.full_name if getattr(iss, 'acknowledged_by', None) else None,
            indent_number=iss.indent.indent_number if iss.indent else None,
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
    # Self-healing sequence check: Ensure current_number is ahead of existing issues
    seq = db.query(DocumentSequence).filter_by(tenant_id=tenant_id, site_id=site_id, document_type="ISSUE").first()
    if seq:
        max_iss = db.query(func.max(MaterialIssue.issue_number)).filter(MaterialIssue.tenant_id == tenant_id, MaterialIssue.site_id == site_id).scalar()
        if max_iss:
            try:
                num_part = int(max_iss.split('-')[-1])
                if seq.current_number < num_part:
                    seq.current_number = num_part
                    db.flush()
            except: pass

    try:
        processed_items = []
        for item_data in data.items:
            mat = db.query(Material).filter(Material.id == item_data.material_id, Material.tenant_id == tenant_id, Material.site_id == site_id).first()
            if not mat: continue
            w_id = mat.warehouse_id or data.warehouse_id
            if not w_id:
                raise HTTPException(400, f"No warehouse mapped for {mat.name}")
            processed_items.append((item_data, mat, w_id))

        if not processed_items:
            raise HTTPException(400, "No valid items to issue")

        room_id = data.issued_to_room_id
        building_id = data.building_id
        if data.indent_id:
            indent = db.query(Indent).filter(Indent.id == data.indent_id).first()
            if indent:
                if not room_id: room_id = indent.room_id
                if not building_id: building_id = indent.building_id

        if not building_id and room_id:
            room_data = db.query(Room).filter(Room.id == room_id).first()
            if room_data and room_data.floor:
                building_id = room_data.floor.building_id

        issued_to_dept = data.issued_to_department
        if not issued_to_dept:
            if room_id:
                r_data = db.query(Room).filter(Room.id == room_id).first()
                if r_data and r_data.department_name:
                    issued_to_dept = r_data.department_name
            if not issued_to_dept and data.indent_id:
                ind_data = db.query(Indent).filter(Indent.id == data.indent_id).first()
                if ind_data and ind_data.department:
                    issued_to_dept = ind_data.department


        # Direct Issue Limit Enforcement
        if not data.indent_id and issued_to_dept:
            first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            for item_data in data.items:
                limit_obj = db.query(DepartmentMaterialLimit).filter(
                    DepartmentMaterialLimit.tenant_id == tenant_id,
                    DepartmentMaterialLimit.site_id == site_id,
                    DepartmentMaterialLimit.department == issued_to_dept,
                    DepartmentMaterialLimit.material_id == item_data.material_id
                ).first()
                if limit_obj:
                    # Sum up requested/issued quantities this month
                    total_requested = db.query(func.sum(IndentItem.requested_quantity)).join(Indent).filter(
                        Indent.tenant_id == tenant_id,
                        Indent.site_id == site_id,
                        Indent.department == issued_to_dept,
                        IndentItem.material_id == item_data.material_id,
                        Indent.created_at >= first_day_of_month,
                        Indent.status != IndentStatus.REJECTED.value
                    ).scalar() or 0.0

                    # Also sum up any other direct issues
                    total_direct_issued = db.query(func.sum(MaterialIssueItem.quantity)).join(MaterialIssue).filter(
                        MaterialIssue.tenant_id == tenant_id,
                        MaterialIssue.site_id == site_id,
                        MaterialIssue.issued_to_department == issued_to_dept,
                        MaterialIssue.indent_id == None,
                        MaterialIssueItem.material_id == item_data.material_id,
                        MaterialIssue.created_at >= first_day_of_month,
                        MaterialIssue.status != "Cancelled"
                    ).scalar() or 0.0

                    if total_requested + total_direct_issued + item_data.quantity > limit_obj.monthly_limit:
                        mat = db.query(Material).filter(Material.id == item_data.material_id, Material.tenant_id == tenant_id, Material.site_id == site_id).first()
                        mat_name = mat.name if mat else "Unknown Material"
                        remaining = max(0, limit_obj.monthly_limit - (total_requested + total_direct_issued))
                        raise HTTPException(
                            status_code=400,
                            detail=f"The limit per month for '{mat_name}' is {int(limit_obj.monthly_limit)}. You can issue only {int(remaining)} more."
                        )


        header_w_id = data.warehouse_id or processed_items[0][2]
        issue_number = get_next_number(db, tenant_id, site_id, "ISSUE", "ISS")

        issue_project_id = data.project_id
        if not issue_project_id and data.indent_id:
            ind_data = db.query(Indent).filter(Indent.id == data.indent_id).first()
            if ind_data and ind_data.institution:
                issue_project_id = ind_data.institution.project_id

        if not issue_project_id:
            from app.models import Project
            first_proj = db.query(Project).filter(Project.tenant_id == tenant_id, Project.site_id == site_id).first()
            if first_proj:
                issue_project_id = first_proj.id
            else:
                raise HTTPException(400, "project_id is required but could not be resolved")

        issue = MaterialIssue(
            issue_number=issue_number,
            warehouse_id=header_w_id,
            project_id=issue_project_id,
            indent_id=data.indent_id,
            building_id=building_id,
            issued_to_room_id=room_id,
            issued_to_department=issued_to_dept,
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

        for item_data, mat, w_id in processed_items:
            # Check stock
            stock = db.query(CurrentStock).filter(
                CurrentStock.material_id == item_data.material_id,
                CurrentStock.warehouse_id == w_id,
                CurrentStock.tenant_id == tenant_id,
                CurrentStock.site_id == site_id
            ).first()
            if not stock or stock.quantity < item_data.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {mat.name} in mapped warehouse"
                )

            rate = mat.standard_cost or 0.0
            issue_item = MaterialIssueItem(
                issue_id=issue.id,
                material_id=item_data.material_id,
                warehouse_id=w_id,
                quantity=round(item_data.quantity),
                rate=rate,
                remarks=item_data.remarks
            )
            db.add(issue_item)

            update_stock(
                db=db,
                material_id=item_data.material_id,
                warehouse_id=w_id,
                quantity=-item_data.quantity,
                transaction_type="Issue",
                reference_type="Issue",
                reference_id=issue.id,
                reference_number=issue_number,
                tenant_id=tenant_id,
                site_id=site_id,
                project_id=issue_project_id,
                room_id=room_id,
                user_id=current_user.id
            )
        created_issues = [{"id": issue.id, "issue_number": issue_number}]

        # Update indent items
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
                
                all_fully_issued = all(it.issued_quantity >= (it.approved_quantity or 0) for it in indent.items)
                indent.status = IndentStatus.ISSUED.value if all_fully_issued else IndentStatus.PARTIALLY_ISSUED.value
                
                from app.models import Alert
                alert = Alert(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    alert_type="Pending Action",
                    severity="Warning",
                    title="Action Required: Issue Acknowledgement",
                    message=f"Materials for your indent ({indent.indent_number}) have been issued. Please review and acknowledge receipt.",
                    reference_type="IndentIssued",
                    reference_id=indent.id,
                    user_id=indent.requester_id,
                    is_read=False,
                    is_resolved=False
                )
                db.add(alert)

        db.commit()
        return {
            "created_ids": [iss["id"] for iss in created_issues],
            "issue_number": created_issues[0]["issue_number"] if created_issues else None,
            "message": f"{len(created_issues)} issue(s) created successfully"
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Creation Error: {str(e)}")


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
    search: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("issues", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(MaterialReturn).filter(MaterialReturn.tenant_id == tenant_id, MaterialReturn.site_id == site_id)
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            if scope == "Department" and current_user.department:
                q = q.filter(MaterialReturn.returned_from_department == current_user.department)
            else:
                q = q.filter(MaterialReturn.received_by_id == current_user.id)
    
    if search:
        q = q.filter(MaterialReturn.return_number.ilike(f"%{search}%"))
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
                returned_qty=round(item.returned_qty or 0),
                received_qty=round(item.received_qty) if item.received_qty is not None else None,
                variance_qty=item.variance_qty,
                receipt_remarks=item.receipt_remarks,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.abbreviation if mat and mat.uom else None
            ))
        result.append(ReturnOut(
            id=ret.id, return_number=ret.return_number,
            warehouse_id=ret.warehouse_id, project_id=ret.project_id,
            returned_from_room_id=ret.returned_from_room_id,
            returned_from_department=ret.returned_from_department,
            return_type=ret.return_type, remarks=ret.remarks,
            returned_by_name=ret.returned_by_name,
            status=ret.status,
            received_date=ret.received_date,
            initiated_by_id=ret.initiated_by_id,
            received_by_id=ret.received_by_id,
            created_at=ret.created_at,
            warehouse_name=ret.warehouse.name if ret.warehouse else None,
            project_name=ret.project.name if ret.project else None,
            room_name=ret.room.name if ret.room else None,
            initiated_by_name=ret.initiated_by.full_name if ret.initiated_by else None,
            received_by_name_user=ret.received_by.full_name if ret.received_by else None,
            items=items
        ))
    return result


@router.post("/returns")
def create_return(
    data: ReturnCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("issues", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    count = db.query(MaterialReturn).filter(MaterialReturn.tenant_id == tenant_id, MaterialReturn.site_id == site_id).count() + 1
    return_number = get_next_number(db, tenant_id, site_id, "RETURN", "RET")

    ret = MaterialReturn(
        return_number=return_number,
        warehouse_id=data.warehouse_id,
        project_id=data.project_id,
        returned_from_room_id=data.returned_from_room_id,
        returned_from_department=data.returned_from_department,
        return_type=data.return_type,
        remarks=data.remarks,
        returned_by_name=data.returned_by_name,
        initiated_by_id=current_user.id,
        status="Initiated",
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(ret)
    db.flush()

    for item_data in data.items:
        ret_item = MaterialReturnItem(
            return_id=ret.id,
            material_id=item_data.material_id,
            returned_qty=round(item_data.returned_qty),
            remarks=item_data.remarks
        )
        db.add(ret_item)

    db.commit()
    return {"id": ret.id, "return_number": return_number, "message": "Material return initiated"}

@router.post("/returns/{id}/receive")
def receive_return(
    id: int,
    data: ReturnReceiptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_action("returns", "receive")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    ret = db.query(MaterialReturn).filter(
        MaterialReturn.id == id,
        MaterialReturn.tenant_id == tenant_id,
        MaterialReturn.site_id == site_id
    ).first()

    if not ret:
        raise HTTPException(status_code=404, detail="Return not found")
    
    if ret.status == "Completed":
        raise HTTPException(status_code=400, detail="Return has already been fully received")

    total_returned = 0
    total_received = 0

    for item_data in data.items:
        ret_item = db.query(MaterialReturnItem).filter(
            MaterialReturnItem.id == item_data.return_item_id,
            MaterialReturnItem.return_id == ret.id
        ).first()

        if not ret_item:
            raise HTTPException(status_code=404, detail=f"Return item {item_data.return_item_id} not found")

        if item_data.received_qty > ret_item.returned_qty:
            raise HTTPException(status_code=400, detail=f"Received quantity cannot exceed returned quantity for item {ret_item.material.name if ret_item.material else ret_item.id}")

        previously_received = ret_item.received_qty or 0
        newly_received = round(item_data.received_qty)

        if newly_received < previously_received:
            raise HTTPException(status_code=400, detail=f"Cannot reduce received quantity for item {ret_item.material.name if ret_item.material else ret_item.id}")

        diff = newly_received - previously_received

        ret_item.received_qty = newly_received
        ret_item.variance_qty = ret_item.received_qty - ret_item.returned_qty
        ret_item.receipt_remarks = item_data.receipt_remarks

        if diff > 0:
            update_stock(
                db=db,
                material_id=ret_item.material_id,
                warehouse_id=ret.warehouse_id,
                quantity=diff,
                transaction_type="Return",
                reference_type="Return",
                reference_id=ret.id,
                reference_number=ret.return_number,
                tenant_id=tenant_id,
                site_id=site_id,
                project_id=ret.project_id,
                room_id=ret.returned_from_room_id,
                user_id=current_user.id
            )


    # Calculate totals to determine final status
    for ret_item in ret.items:
        total_returned += ret_item.returned_qty
        total_received += (ret_item.received_qty or 0)

    if total_received == total_returned:
        ret.status = "Completed"
    else:
        ret.status = "Partially Received"

    ret.received_by_id = current_user.id
    ret.received_date = datetime.utcnow()

    db.commit()
    return {"message": "Return received successfully"}


# ── Stock Transfers ──────────────────────────────────────────────────────

@router.get("/transfers")
def list_transfers(
    search: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("issues", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(StockTransfer).filter(StockTransfer.tenant_id == tenant_id, StockTransfer.site_id == site_id)
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            q = q.filter(StockTransfer.created_by_id == current_user.id)
            
    if search:
        q = q.filter(StockTransfer.transfer_number.ilike(f"%{search}%"))
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
                quantity=round(item.quantity or 0), remarks=item.remarks,
                received_qty=round(item.received_qty) if item.received_qty is not None else None,
                variance_qty=item.variance_qty,
                receipt_remarks=item.receipt_remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.abbreviation if mat and mat.uom else None
            ))
        result.append(TransferOut(
            id=t.id, transfer_number=t.transfer_number,
            from_warehouse_id=t.from_warehouse_id,
            to_warehouse_id=t.to_warehouse_id,
            project_id=t.project_id, status=t.status,
            remarks=t.remarks, created_at=t.created_at,
            completed_at=t.completed_at,
            received_date=t.received_date,
            from_warehouse_name=t.from_warehouse.name if t.from_warehouse else None,
            to_warehouse_name=t.to_warehouse.name if t.to_warehouse else None,
            project_name=t.project.name if t.project else None,
            received_by_name=t.received_by.full_name if t.received_by else None,
            items=items
        ))
    return result


@router.post("/transfers")
def create_transfer(
    data: TransferCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("issues", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if data.from_warehouse_id == data.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination warehouse cannot be the same")

    count = db.query(StockTransfer).filter(StockTransfer.tenant_id == tenant_id, StockTransfer.site_id == site_id).count() + 1
    transfer_number = get_next_number(db, tenant_id, site_id, "TRANSFER", "TRF")

    transfer = StockTransfer(
        transfer_number=transfer_number,
        from_warehouse_id=data.from_warehouse_id,
        to_warehouse_id=data.to_warehouse_id,
        project_id=data.project_id,
        remarks=data.remarks,
        created_by_id=current_user.id,
        status="Initiated",
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
            mat = db.query(Material).filter(Material.id == item_data.material_id, Material.tenant_id == tenant_id, Material.site_id == site_id).first()
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {mat.name if mat else 'material'} in source warehouse"
            )

        t_item = StockTransferItem(
            transfer_id=transfer.id,
            material_id=item_data.material_id,
            quantity=round(item_data.quantity),
            remarks=item_data.remarks
        )
        db.add(t_item)

    db.commit()
    return {"id": transfer.id, "transfer_number": transfer_number, "message": "Stock transfer initiated"}

@router.post("/transfers/{id}/receive")
def receive_transfer(
    id: int,
    data: TransferReceiptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("issues", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    transfer = db.query(StockTransfer).filter(
        StockTransfer.id == id,
        StockTransfer.tenant_id == tenant_id,
        StockTransfer.site_id == site_id
    ).first()

    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.status == "Completed":
        raise HTTPException(status_code=400, detail="Transfer has already been fully received")

    total_sent = 0
    total_received = 0

    for item_data in data.items:
        t_item = db.query(StockTransferItem).filter(
            StockTransferItem.id == item_data.transfer_item_id,
            StockTransferItem.transfer_id == transfer.id
        ).first()

        if not t_item:
            raise HTTPException(status_code=404, detail=f"Transfer item {item_data.transfer_item_id} not found")

        if item_data.received_qty > t_item.quantity:
            raise HTTPException(status_code=400, detail=f"Received quantity cannot exceed sent quantity for item {t_item.material.name if t_item.material else t_item.id}")

        previously_received = t_item.received_qty or 0
        newly_received = round(item_data.received_qty)

        if newly_received < previously_received:
            raise HTTPException(status_code=400, detail=f"Cannot reduce received quantity for item {t_item.material.name if t_item.material else t_item.id}")

        diff = newly_received - previously_received

        t_item.received_qty = newly_received
        t_item.variance_qty = t_item.received_qty - t_item.quantity
        t_item.receipt_remarks = item_data.receipt_remarks

        if diff > 0:
            # Check stock one more time before deducting from source warehouse
            stock = db.query(CurrentStock).filter(
                CurrentStock.material_id == t_item.material_id,
                CurrentStock.warehouse_id == transfer.from_warehouse_id,
                CurrentStock.tenant_id == tenant_id,
                CurrentStock.site_id == site_id
            ).first()
            if not stock or stock.quantity < diff:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {t_item.material.name if t_item.material else 'material'} in source warehouse to accept receipt"
                )

            # Deduct from source
            update_stock(
                db=db,
                material_id=t_item.material_id,
                warehouse_id=transfer.from_warehouse_id,
                quantity=-diff,
                transaction_type="Transfer Out",
                reference_type="Transfer",
                reference_id=transfer.id,
                reference_number=transfer.transfer_number,
                tenant_id=tenant_id,
                site_id=site_id,
                project_id=transfer.project_id,
                user_id=current_user.id
            )

            # Add to destination
            update_stock(
                db=db,
                material_id=t_item.material_id,
                warehouse_id=transfer.to_warehouse_id,
                quantity=diff,
                transaction_type="Transfer In",
                reference_type="Transfer",
                reference_id=transfer.id,
                reference_number=transfer.transfer_number,
                tenant_id=tenant_id,
                site_id=site_id,
                project_id=transfer.project_id,
                user_id=current_user.id
            )

    for t_item in transfer.items:
        total_sent += t_item.quantity
        total_received += (t_item.received_qty or 0)

    if total_received == total_sent:
        transfer.status = "Completed"
        transfer.completed_at = datetime.utcnow()
    else:
        transfer.status = "Partially Received"

    transfer.received_by_id = current_user.id
    transfer.received_date = datetime.utcnow()

    db.commit()
    return {"message": "Transfer received successfully"}


# ── Gate Passes ──────────────────────────────────────────────────────────

def format_gate_pass(gp: GatePass) -> GatePassOut:
    vend = gp.vendor
    proj = gp.project
    
    items_out = []
    for item in gp.items:
        mat = item.material
        items_out.append(GatePassItemOut(
            id=item.id,
            material_id=item.material_id,
            quantity=item.quantity,
            remarks=item.remarks,
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            uom_name=mat.uom.abbreviation if mat and mat.uom else None
        ))
        
    let_vend_addr = None
    if vend:
        parts = []
        if vend.address_line_1:
            clean_l1 = vend.address_line_1.strip()
            if clean_l1.endswith(','): clean_l1 = clean_l1[:-1].strip()
            if clean_l1: parts.append(clean_l1)
        if vend.address_line_2:
            clean_l2 = vend.address_line_2.strip()
            if clean_l2.endswith(','): clean_l2 = clean_l2[:-1].strip()
            if clean_l2: parts.append(clean_l2)
        if vend.city:
            clean_city = vend.city.strip()
            if clean_city.endswith(','): clean_city = clean_city[:-1].strip()
            if clean_city: parts.append(clean_city)
        if vend.state:
            import re
            state_clean = re.sub(r'^\d{2}\s*-\s*', '', vend.state).strip()
            if state_clean: parts.append(state_clean)
        
        let_vend_addr = ", ".join(parts)
        if vend.pincode:
            let_vend_addr += f" - {vend.pincode.strip()}"

    return GatePassOut(
        id=gp.id,
        gate_pass_number=gp.gate_pass_number,
        gate_pass_type=gp.gate_pass_type,
        reason_code=gp.reason_code,
        project_id=gp.project_id,
        project_name=proj.name if proj else None,
        vendor_id=gp.vendor_id,
        vendor_name=f"{vend.code} - {vend.name}" if vend else None,
        vendor_address=let_vend_addr,
        vendor_custom_name=gp.vendor_custom_name,
        vendor_custom_address=gp.vendor_custom_address,
        from_department=gp.from_department,
        from_store=gp.from_store,
        reference_return_number=gp.material_return.return_number if gp.material_return else None,
        status=gp.status,
        driver_name=gp.driver_name,
        vehicle_number=gp.vehicle_number,
        remarks=gp.remarks,
        gate_entry_number=gp.gate_entry_number,
        grn_number=gp.grn_number,
        created_at=gp.created_at,
        completed_by_name=gp.completed_by_name,
        completed_at=gp.completed_at,
        items=items_out
    )

@router.get("/gate-passes")
def list_gate_passes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("issues", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    passes = db.query(GatePass).filter(
        GatePass.tenant_id == tenant_id, GatePass.site_id == site_id
    )
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            passes = passes.filter(GatePass.created_by_id == current_user.id)
            
    passes = passes.order_by(GatePass.created_at.desc()).all()
    return [format_gate_pass(gp) for gp in passes]

@router.post("/gate-passes", response_model=GatePassOut)
def create_gate_pass(
    data: GatePassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("gate_passes", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    gp_num = get_next_number(db, tenant_id, site_id, "GATEPASS", "GP")
    gp = GatePass(
        tenant_id=tenant_id,
        site_id=site_id,
        gate_pass_number=gp_num,
        project_id=data.project_id,
        vendor_id=data.vendor_id,
        vendor_custom_name=data.vendor_custom_name,
        vendor_custom_address=data.vendor_custom_address,
        from_department=data.from_department,
        from_store=data.from_store,
        status="Sent Out" if data.gate_pass_type == "Non-Returnable" else "Yet to Receive",
        gate_pass_type=data.gate_pass_type,
        reason_code=data.reason_code,
        driver_name=data.driver_name,
        vehicle_number=data.vehicle_number,
        remarks=data.remarks,
        created_by_id=current_user.id
    )
    db.add(gp)
    db.flush()
    
    for item_data in data.items:
        mat = db.query(Material).filter(Material.id == item_data.material_id, Material.tenant_id == tenant_id, Material.site_id == site_id).first()
        if not mat:
            raise HTTPException(status_code=400, detail=f"Material ID {item_data.material_id} is invalid or does not belong to your workspace.")
        item = GatePassItem(
            gate_pass_id=gp.id,
            material_id=item_data.material_id,
            quantity=item_data.quantity,
            remarks=item_data.remarks
        )
        db.add(item)
        
    db.commit()
    db.refresh(gp)
    return format_gate_pass(gp)

@router.put("/gate-passes/{id}")
def update_gate_pass(
    id: int,
    data: GatePassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("issues", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    gp = db.query(GatePass).filter(
        GatePass.id == id, GatePass.tenant_id == tenant_id, GatePass.site_id == site_id
    ).first()
    
    if not gp:
        raise HTTPException(status_code=404, detail="Gate Pass not found")
        
    old_status = gp.status
    gp.status = data.status
    if data.remarks is not None:
        gp.remarks = data.remarks
    if data.gate_entry_number is not None:
        gp.gate_entry_number = data.gate_entry_number
    if data.grn_number is not None:
        gp.grn_number = data.grn_number
    if data.completed_by_name is not None:
        gp.completed_by_name = data.completed_by_name
    if data.completed_at is not None:
        gp.completed_at = data.completed_at
        
    # If transitioning from "Yet to Receive" (or "Pending Repair") to "Received"
    if old_status in ["Pending Repair", "Yet to Receive"] and data.status == "Received":
        # Put stock back into the usable warehouse
        ret = db.query(MaterialReturn).filter(MaterialReturn.id == gp.return_id).first()
        warehouse_id = ret.warehouse_id if ret else None
        
        if warehouse_id:
            for item in gp.items:
                update_stock(
                    db=db,
                    material_id=item.material_id,
                    warehouse_id=warehouse_id,
                    quantity=item.quantity,
                    transaction_type="Repair Received",
                    reference_type="GatePass",
                    reference_id=gp.id,
                    reference_number=gp.gate_pass_number,
                    tenant_id=tenant_id,
                    site_id=site_id,
                    project_id=gp.project_id,
                    user_id=current_user.id
                )
            
    db.commit()
    return {"message": f"Gate Pass updated to {data.status}"}


# ── Write Offs ───────────────────────────────────────────────────────────

@router.get("/write-offs")
def list_write_offs(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("write_offs", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(WriteOff).filter(WriteOff.tenant_id == tenant_id, WriteOff.site_id == site_id)
    if search:
        q = q.filter(WriteOff.write_off_number.ilike(f"%{search}%"))
    
    write_offs = q.order_by(WriteOff.created_at.desc()).all()
    result = []
    
    # Pre-fetch approval flows
    from app.models import ApprovalFlow
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "WRITE_OFF",
        ApprovalFlow.is_active == True
    ).all()
    user_roles = getattr(current_user, "_roles", [])
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    can_override = is_platform_admin or getattr(current_user, '_data_access_scope', '') == 'Full Administrative Access'

    for wo in write_offs:
        wo.can_user_approve = False
        if wo.status == "Submitted":
            for f in flows:
                if f.level == wo.current_approval_level and \
                   (can_override or (f.user_id == current_user.id) or (not f.user_id and f.role_name in user_roles)):
                    wo.can_user_approve = True
                    break
            # Fallback for missing flows
            if not flows and can_override:
                wo.can_user_approve = True
                
        items = []
        for item in wo.items:
            mat = item.material
            wh = item.warehouse
            items.append(WriteOffItemOut(
                id=item.id, material_id=item.material_id,
                warehouse_id=item.warehouse_id,
                equipment_id=item.equipment_id,
                location_id=item.location_id,
                warehouse_name=wh.name if wh else None,
                location_name=item.location.location_name if item.location else None,
                quantity=item.quantity, rate=item.rate, amount=item.amount,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.abbreviation if mat and mat.uom else None
            ))
            
        result.append(WriteOffOut(
            id=wo.id, write_off_number=wo.write_off_number,
            date=wo.date, reason=wo.reason, 
            write_off_type=wo.write_off_type,
            attachment_url=wo.attachment_url,
            status=wo.status,
            current_approval_level=wo.current_approval_level,
            created_by_id=wo.created_by_id,
            created_by_name=wo.created_by.full_name if wo.created_by else None,
            approved_by_id=wo.approved_by_id,
            approved_by_name=wo.approver.full_name if wo.approver else None,
            approved_at=wo.approved_at,
            created_at=wo.created_at,
            can_user_approve=wo.can_user_approve,
            items=items
        ))
    return result

@router.post("/write-offs")
def create_write_off(
    data: WriteOffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("write_offs", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    is_equipment = any(item.equipment_id is not None for item in data.items)
    seq_type = "EQUIPMENT_WRITE_OFF" if is_equipment else "WRITE_OFF"
    seq_prefix = "EWO" if is_equipment else "WO"
    write_off_number = get_next_number(db, tenant_id, site_id, seq_type, seq_prefix)
    
    wo = WriteOff(
        tenant_id=tenant_id,
        site_id=site_id,
        write_off_number=write_off_number,
        date=data.date,
        reason=data.reason,
        write_off_type=data.write_off_type,
        attachment_url=data.attachment_url,
        department_name=data.department_name,
        certification_url=data.certification_url,
        status=WriteOffStatus.DRAFT.value,
        created_by_id=current_user.id
    )
    db.add(wo)
    db.flush()
    
    for item_data in data.items:
        mat = db.query(Material).filter(Material.id == item_data.material_id).first()
        rate = mat.standard_cost if mat and mat.standard_cost else 0
        amount = rate * item_data.quantity
        wh_id = item_data.warehouse_id or (mat.warehouse_id if mat else None)
        if not wh_id:
            raise HTTPException(400, f"No warehouse provided for material ID {item_data.material_id}")
            
        # Check if enough stock exists
        stock = db.query(CurrentStock).filter(
            CurrentStock.material_id == item_data.material_id,
            CurrentStock.warehouse_id == wh_id,
            CurrentStock.tenant_id == tenant_id,
            CurrentStock.site_id == site_id
        ).first()
        
        if not stock or stock.quantity < item_data.quantity:
            mat_name = mat.name if mat else "Unknown"
            raise HTTPException(400, f"Insufficient stock for {mat_name} in warehouse")
            
        wo_item = WriteOffItem(
            write_off_id=wo.id,
            material_id=item_data.material_id,
            warehouse_id=wh_id,
            equipment_id=item_data.equipment_id,
            location_id=item_data.location_id,
            quantity=item_data.quantity,
            rate=rate,
            amount=amount,
            has_buyback=item_data.has_buyback,
            buyback_amount=item_data.buyback_amount
        )
        db.add(wo_item)
        
    db.commit()
    return {"message": "Write Off created successfully", "id": wo.id}

@router.put("/write-offs/{id}")
def update_write_off(
    id: int,
    data: WriteOffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("write_offs", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WriteOff).filter(WriteOff.id == id, WriteOff.tenant_id == tenant_id, WriteOff.site_id == site_id).first()
    if not wo:
        raise HTTPException(404, "Write Off not found")
    if wo.status != WriteOffStatus.DRAFT.value:
        raise HTTPException(400, "Only Draft Write Offs can be updated")
        
    wo.date = data.date
    wo.reason = data.reason
    wo.write_off_type = data.write_off_type
    wo.attachment_url = data.attachment_url
    wo.department_name = data.department_name
    wo.certification_url = data.certification_url
    
    # Clear existing items
    db.query(WriteOffItem).filter(WriteOffItem.write_off_id == wo.id).delete()
    db.flush()
    
    for item_data in data.items:
        mat = db.query(Material).filter(Material.id == item_data.material_id).first()
        rate = mat.standard_cost if mat and mat.standard_cost else 0
        amount = rate * item_data.quantity
        wh_id = item_data.warehouse_id or (mat.warehouse_id if mat else None)
        if not wh_id:
            raise HTTPException(400, f"No warehouse provided for material ID {item_data.material_id}")
            
        stock = db.query(CurrentStock).filter(
            CurrentStock.material_id == item_data.material_id,
            CurrentStock.warehouse_id == wh_id,
            CurrentStock.tenant_id == tenant_id,
            CurrentStock.site_id == site_id
        ).first()
        
        if not stock or stock.quantity < item_data.quantity:
            mat_name = mat.name if mat else "Unknown"
            raise HTTPException(400, f"Insufficient stock for {mat_name} in warehouse")
            
        wo_item = WriteOffItem(
            write_off_id=wo.id,
            material_id=item_data.material_id,
            warehouse_id=wh_id,
            equipment_id=item_data.equipment_id,
            location_id=item_data.location_id,
            quantity=item_data.quantity,
            rate=rate,
            amount=amount,
            has_buyback=item_data.has_buyback,
            buyback_amount=item_data.buyback_amount
        )
        db.add(wo_item)
        
    db.commit()
    return {"message": "Write Off updated successfully", "id": wo.id}

@router.post("/write-offs/{id}/submit")
def submit_write_off(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_action("write_offs", "can_submit")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WriteOff).filter(WriteOff.id == id, WriteOff.tenant_id == tenant_id, WriteOff.site_id == site_id).first()
    if not wo:
        raise HTTPException(404, "Write Off not found")
    if wo.status != WriteOffStatus.DRAFT.value:
        raise HTTPException(400, "Only Draft Write Offs can be submitted")
        
    wo.status = WriteOffStatus.SUBMITTED.value
    db.commit()
    return {"message": "Write Off submitted for approval"}

@router.post("/write-offs/{id}/approve")
def approve_write_off(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_action("write_offs", "can_approve")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WriteOff).filter(WriteOff.id == id, WriteOff.tenant_id == tenant_id, WriteOff.site_id == site_id).first()
    if not wo:
        raise HTTPException(404, "Write Off not found")
    if wo.status != WriteOffStatus.SUBMITTED.value:
        raise HTTPException(400, "Write Off is not submitted for approval")
        
    from app.models import ApprovalFlow
    flows = db.query(ApprovalFlow).filter(
        ApprovalFlow.tenant_id == tenant_id,
        ApprovalFlow.site_id == site_id,
        ApprovalFlow.document_type == "WRITE_OFF",
        ApprovalFlow.level >= wo.current_approval_level + 1,
        ApprovalFlow.is_active == True
    ).first()
    
    if flows:
        wo.current_approval_level += 1
        db.commit()
        return {"message": f"Moved to approval level {wo.current_approval_level}"}
        
    wo.status = WriteOffStatus.APPROVED.value
    wo.approved_by_id = current_user.id
    wo.approved_at = datetime.utcnow()
    
    for item in wo.items:
        stock = db.query(CurrentStock).filter(
            CurrentStock.material_id == item.material_id,
            CurrentStock.warehouse_id == item.warehouse_id,
            CurrentStock.tenant_id == tenant_id,
            CurrentStock.site_id == site_id
        ).first()
        if not stock or stock.quantity < item.quantity:
            mat = db.query(Material).filter(Material.id == item.material_id).first()
            raise HTTPException(400, f"Insufficient stock for {mat.name if mat else 'material'} to approve")
            
        update_stock(
            db=db,
            material_id=item.material_id,
            warehouse_id=item.warehouse_id,
            quantity=-item.quantity,
            transaction_type="Write Off",
            reference_type="WriteOff",
            reference_id=wo.id,
            reference_number=wo.write_off_number,
            tenant_id=tenant_id,
            site_id=site_id,
            user_id=current_user.id
        )
        
        if item.equipment_id:
            from app.models import EquipmentItem
            equipment = db.query(EquipmentItem).filter(
                EquipmentItem.id == item.equipment_id,
                EquipmentItem.tenant_id == tenant_id,
                EquipmentItem.site_id == site_id
            ).first()
            if equipment:
                equipment.status = "Written Off"
                
    db.commit()
    return {"message": "Write Off approved and stock updated successfully"}

@router.post("/write-offs/{id}/reject")
def reject_write_off(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_action("write_offs", "can_reject")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    wo = db.query(WriteOff).filter(WriteOff.id == id, WriteOff.tenant_id == tenant_id, WriteOff.site_id == site_id).first()
    if not wo:
        raise HTTPException(404, "Write Off not found")
        
    wo.status = WriteOffStatus.REJECTED.value
    db.commit()
    return {"message": "Write Off rejected"}

