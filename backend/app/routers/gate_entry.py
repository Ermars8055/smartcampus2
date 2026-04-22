"""Security Gate Entry routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import GateEntry, User, Vendor, PurchaseOrder, PurchaseOrderItem, Material
from app.schemas import GateEntryCreate, GateEntryOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id

router = APIRouter(prefix="/api/gate-entries", tags=["Gate Entry"])


def generate_entry_number(db: Session, tenant_id: int, site_id: int) -> str:
    count = db.query(GateEntry).filter(
        GateEntry.tenant_id == tenant_id, GateEntry.site_id == site_id
    ).count() + 1
    return f"GE-{datetime.now().strftime('%Y%m%d')}-{count:04d}"


@router.get("")
def list_gate_entries(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("gate_entry", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    q = db.query(GateEntry).filter(
        GateEntry.tenant_id == tenant_id, GateEntry.site_id == site_id
    )
    if status:
        q = q.filter(GateEntry.status == status)
    if project_id:
        q = q.filter(GateEntry.project_id == project_id)
    entries = q.order_by(GateEntry.created_at.desc()).all()
    result = []
    for e in entries:
        result.append(GateEntryOut(
            id=e.id, entry_number=e.entry_number,
            vehicle_number=e.vehicle_number,
            vendor_id=e.vendor_id, po_id=e.po_id,
            project_id=e.project_id, material_id=e.material_id,
            quantity=e.quantity, driver_name=e.driver_name,
            driver_phone=e.driver_phone, remarks=e.remarks,
            arrival_time=e.arrival_time, status=e.status,
            created_at=e.created_at,
            vendor_name=e.vendor.name if e.vendor else None,
            material_name=e.material.name if e.material else None,
            po_number=e.purchase_order.po_number if e.purchase_order else None
        ))
    return result


@router.post("")
def create_gate_entry(
    data: GateEntryCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("gate_entry", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    if not data.vehicle_number or not data.vehicle_number.strip():
        raise HTTPException(status_code=400, detail="Vehicle number is required")

    entry = GateEntry(
        entry_number=generate_entry_number(db, tenant_id, site_id),
        recorded_by_id=current_user.id,
        arrival_time=datetime.utcnow(),
        status="Gate Entry Created",
        vehicle_number=data.vehicle_number,
        vendor_id=data.vendor_id,
        po_id=data.po_id if data.po_id else None,
        project_id=data.project_id,
        material_id=data.material_id,
        quantity=data.quantity,
        driver_name=data.driver_name,
        driver_phone=data.driver_phone,
        remarks=data.remarks,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(entry)
    db.flush()

    if data.po_id:
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
