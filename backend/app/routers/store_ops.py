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
    Room, Floor, Building, DocumentSequence, GatePass
)
from app.schemas import (
    IssueCreate, IssueOut, IssueItemOut,
    ReturnCreate, ReturnOut, ReturnItemOut,
    TransferCreate, TransferOut, TransferItemOut,
    GatePassOut, GatePassUpdate
)
from app.routers.grn import update_stock
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
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
        if scope not in ["Full Administrative Access", "Organization"]:
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
            items.append(IssueItemOut(
                id=item.id, material_id=item.material_id,
                quantity=round(item.quantity or 0), rate=item.rate,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        room_name = iss.room.name if iss.room else None
        floor_name = iss.room.floor.name if iss.room and iss.room.floor else None
        building_name = iss.room.floor.building.name if iss.room and iss.room.floor and iss.room.floor.building else (iss.building.name if iss.building else None)

        dept_name = iss.issued_to_department or (iss.room.department_name if iss.room else None) or (iss.indent.department_name if getattr(iss, 'indent', None) else None)

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
            room_name=room_name,
            floor_name=floor_name,
            building_name=building_name,
            issued_by_name=iss.issued_by.full_name if iss.issued_by else None,
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
        # Group items by their material's default warehouse
        items_by_warehouse = {}
        for item_data in data.items:
            mat = db.query(Material).filter(Material.id == item_data.material_id).first()
            if not mat: continue
            w_id = mat.warehouse_id or data.warehouse_id # Fallback to global if set
            if not w_id:
                raise HTTPException(400, f"No warehouse mapped for {mat.name}")
            if w_id not in items_by_warehouse:
                items_by_warehouse[w_id] = []
            items_by_warehouse[w_id].append((item_data, mat))

        if not items_by_warehouse:
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

        created_issues = []
        for w_id, items in items_by_warehouse.items():
            issue_number = get_next_number(db, tenant_id, site_id, "ISSUE", "ISS")
            issue = MaterialIssue(
                issue_number=issue_number,
                warehouse_id=w_id,
                project_id=data.project_id,
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

            for item_data, mat in items:
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
                    project_id=data.project_id,
                    room_id=room_id,
                    user_id=current_user.id
                )
            created_issues.append({"id": issue.id, "issue_number": issue_number})

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
                
                all_fully_issued = all(it.issued_quantity >= it.requested_quantity for it in indent.items)
                indent.status = IndentStatus.ISSUED.value if all_fully_issued else IndentStatus.PARTIALLY_ISSUED.value

        db.commit()
        return {
            "created_ids": [iss["id"] for iss in created_issues],
            "message": f"{len(created_issues)} issue(s) created successfully"
        }
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
                quantity=round(item.quantity or 0), condition=item.condition,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        result.append(ReturnOut(
            id=ret.id, return_number=ret.return_number,
            warehouse_id=ret.warehouse_id, project_id=ret.project_id,
            returned_from_room_id=ret.returned_from_room_id,
            returned_from_department=ret.returned_from_department,
            return_type=ret.return_type, remarks=ret.remarks,
            returned_by_name=ret.returned_by_name,
            created_at=ret.created_at,
            warehouse_name=ret.warehouse.name if ret.warehouse else None,
            project_name=ret.project.name if ret.project else None,
            room_name=ret.room.name if ret.room else None,
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
            quantity=round(item_data.quantity),
            condition=item_data.condition,
            remarks=item_data.remarks
        )
        db.add(ret_item)

        # Determine target warehouse
        target_warehouse_id = data.warehouse_id
        if item_data.condition == "Scrap":
            scrap_w = db.query(Warehouse).filter(Warehouse.tenant_id == tenant_id, Warehouse.site_id == site_id, Warehouse.code == "SCRAP").first()
            if not scrap_w:
                scrap_w = Warehouse(tenant_id=tenant_id, site_id=site_id, code="SCRAP", name="Scrap Store", warehouse_type="Scrap", project_id=data.project_id)
                db.add(scrap_w)
                db.flush()
            target_warehouse_id = scrap_w.id

        update_stock(
            db=db,
            material_id=item_data.material_id,
            warehouse_id=target_warehouse_id,
            quantity=item_data.quantity,
            transaction_type="Return",
            reference_type="Return",
            reference_id=ret.id,
            reference_number=return_number,
            tenant_id=tenant_id,
            site_id=site_id,
            project_id=data.project_id,
            room_id=data.returned_from_room_id,
            user_id=current_user.id
        )

        if item_data.condition == "Repairable":
            mat = db.query(Material).filter(Material.id == item_data.material_id).first()
            gp_num = get_next_number(db, tenant_id, site_id, "GATEPASS", "GP")
            gp = GatePass(
                tenant_id=tenant_id,
                site_id=site_id,
                gate_pass_number=gp_num,
                return_id=ret.id,
                project_id=data.project_id,
                material_id=item_data.material_id,
                quantity=item_data.quantity,
                vendor_id=mat.preferred_vendor_id if mat else None,
                created_by_id=current_user.id
            )
            db.add(gp)
            db.flush()
            # Deduct stock immediately because it's going out for repair
            update_stock(
                db=db,
                material_id=item_data.material_id,
                warehouse_id=target_warehouse_id,
                quantity=-item_data.quantity,
                transaction_type="Outward Repair",
                reference_type="GatePass",
                reference_id=gp.id,
                reference_number=gp_num,
                tenant_id=tenant_id,
                site_id=site_id,
                project_id=data.project_id,
                room_id=data.returned_from_room_id,
                user_id=current_user.id
            )

    db.commit()
    return {"id": ret.id, "return_number": return_number, "message": "Material return recorded"}


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
            quantity=round(item_data.quantity),
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


# ── Gate Passes ──────────────────────────────────────────────────────────

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
    
    result = []
    for gp in passes:
        mat = gp.material
        vend = gp.vendor
        proj = gp.project
        result.append(GatePassOut(
            id=gp.id,
            gate_pass_number=gp.gate_pass_number,
            gate_pass_type=gp.gate_pass_type,
            project_id=gp.project_id,
            project_name=proj.name if proj else None,
            material_id=gp.material_id,
            material_name=mat.name if mat else None,
            material_code=mat.code if mat else None,
            uom_name=mat.uom.name if mat and mat.uom else None,
            quantity=gp.quantity,
            vendor_id=gp.vendor_id,
            vendor_name=vend.name if vend else None,
            vendor_address=vend.address if vend else None,
            reference_return_number=gp.material_return.return_number if gp.material_return else None,
            status=gp.status,
            driver_name=gp.driver_name,
            vehicle_number=gp.vehicle_number,
            remarks=gp.remarks,
            created_at=gp.created_at
        ))
    return result

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
        
    # If transitioning from "Pending Repair" to "Repaired & Received"
    if old_status == "Pending Repair" and data.status == "Repaired & Received":
        # Put stock back into the usable warehouse
        ret = db.query(MaterialReturn).filter(MaterialReturn.id == gp.return_id).first()
        warehouse_id = ret.warehouse_id if ret else None
        
        if warehouse_id:
            update_stock(
                db=db,
                material_id=gp.material_id,
                warehouse_id=warehouse_id,
                quantity=gp.quantity,
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

