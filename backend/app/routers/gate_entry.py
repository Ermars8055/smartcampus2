"""Security Gate Entry routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.utils.tz import get_now_ist
from typing import Optional
from app.database import get_db
from app.models import GateEntry, User, Vendor, PurchaseOrder, PurchaseOrderItem, Material
from app.schemas import GateEntryCreate, GateEntryOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number

router = APIRouter(prefix="/api/gate-entries", tags=["Gate Entry"])




@router.get("")
def list_gate_entries(
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    entry_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("gate_entry", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(GateEntry).filter(
        GateEntry.tenant_id == tenant_id, GateEntry.site_id == site_id,
        GateEntry.is_deleted == False
    )
    if search:
        q = q.filter(GateEntry.entry_number.ilike(f"%{search}%"))
    if status:
        q = q.filter(GateEntry.status == status)
    if project_id:
        q = q.filter(GateEntry.project_id == project_id)
    if entry_type:
        q = q.filter(GateEntry.entry_type == entry_type)
    entries = q.order_by(GateEntry.created_at.desc()).all()
    result = []
    for e in entries:
        material_names = f"{e.material.name} ({e.quantity})" if e.material else None
        if e.purchase_order:
            po_materials = [f"{item.material.name} ({item.quantity})" for item in e.purchase_order.items if item.material]
            if po_materials:
                material_names = ", ".join(po_materials)

        result.append(GateEntryOut(
            id=e.id, entry_number=e.entry_number,
            vehicle_number=e.vehicle_number,
            vendor_id=e.vendor_id, po_id=e.po_id,
            project_id=e.project_id, material_id=e.material_id,
            quantity=e.quantity, driver_name=e.driver_name,
            driver_phone=e.driver_phone, remarks=e.remarks,
            arrival_time=e.arrival_time, status=e.status,
            created_at=e.created_at,
            entry_type=e.entry_type,
            delivery_person_name=e.delivery_person_name,
            invoice_scan_url=e.invoice_scan_url,
            vendor_name=e.vendor.name if e.vendor else None,
            material_name=e.material.name if e.material else None,
            po_number=e.purchase_order.po_number if e.purchase_order else None,
            material_names=material_names
        ))
    return result


@router.post("")
def create_gate_entry(
    data: GateEntryCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("gate_entry", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    is_direct = data.entry_type == "Direct Invoice"

    # Validation based on entry type
    if not is_direct:
        if not data.project_id:
            raise HTTPException(status_code=400, detail="Project is required")
        if not data.material_id:
            raise HTTPException(status_code=400, detail="Material is required")
        if not data.quantity or data.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity is required")
        if data.entry_type == "Vehicle" and (not data.vehicle_number or not data.vehicle_number.strip()):
            raise HTTPException(status_code=400, detail="Vehicle number is required for vehicle entry")
        if data.entry_type == "Carry on hand" and (not data.delivery_person_name or not data.delivery_person_name.strip()):
            raise HTTPException(status_code=400, detail="Delivery person name is required for hand carry entry")
    else:
        # Direct Invoice: vendor and invoice scan are mandatory
        if not data.vendor_id:
            raise HTTPException(status_code=400, detail="Vendor is required for Direct Invoice entry")
        if not data.invoice_scan_url:
            raise HTTPException(status_code=400, detail="Invoice scan is required for Direct Invoice entry")

    entry = GateEntry(
        entry_number=get_next_number(db, tenant_id, site_id, "GATE_ENTRY", "GE"),
        recorded_by_id=current_user.id,
        arrival_time=get_now_ist(),
        status="Awaiting Direct GRN" if is_direct else "Gate Entry Created",
        vehicle_number=data.vehicle_number,
        vendor_id=data.vendor_id,
        po_id=data.po_id if data.po_id else None,
        project_id=data.project_id if data.project_id else None,
        material_id=data.material_id if data.material_id else None,
        quantity=data.quantity if data.quantity else None,
        driver_name=data.driver_name,
        driver_phone=data.driver_phone,
        delivery_person_name=data.delivery_person_name,
        entry_type=data.entry_type,
        invoice_scan_url=data.invoice_scan_url,
        remarks=data.remarks,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(entry)
    db.flush()

    if not is_direct and data.po_id:
        po = db.query(PurchaseOrder).filter(
            PurchaseOrder.id == data.po_id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id
        ).first()
        if po:
            entry.status = "Awaiting GRN"
            any_received = any(item.received_quantity > 0 for item in po.items)
            all_received = all(item.received_quantity >= item.quantity for item in po.items)
            if all_received:
                po.status = "Closed"
            elif any_received:
                po.status = "Partially Received"

    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "entry_number": entry.entry_number, "message": "Gate Entry recorded successfully"}


@router.put("/{id}/status")
def update_gate_entry_status(
    id: int, status: str, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("gate_entry", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    entry = db.query(GateEntry).filter(
        GateEntry.id == id, GateEntry.tenant_id == tenant_id, GateEntry.site_id == site_id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Gate Entry not found")
    entry.status = status
    db.commit()
    return {"message": f"Gate Entry status updated to {status}"}

