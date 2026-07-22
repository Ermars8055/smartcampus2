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
    
    # --- ROW-LEVEL SECURITY ---
    is_platform_admin = getattr(current_user, "_is_platform_admin", False)
    if not is_platform_admin:
        scope = getattr(current_user, "_data_access_scope", "Self Only")
        if scope not in ["Full Administrative Access", "Organization"]:
            q = q.filter(GateEntry.recorded_by_id == current_user.id)
            
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
        material_list = []
        
        if e.material:
            material_list.append(f"{e.material.name} ({int(e.quantity or 0)})")
            
        if e.purchase_order:
            # If PO exists, we prefer items from PO
            po_items = [f"{item.material.name} ({int(item.quantity)})" for item in e.purchase_order.items if item.material]
            if po_items:
                material_names = ", ".join(po_items)
            else:
                material_names = ", ".join(material_list) if material_list else None
        else:
            material_names = ", ".join(material_list) if material_list else None

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
            invoice_number=e.invoice_number,
            invoice_date=e.invoice_date,
            invoice_amount=e.invoice_amount,
            vendor_name=f"{e.vendor.code} - {e.vendor.name}" if e.vendor else None,
            material_name=e.material.name if e.material else None,
            po_number=e.purchase_order.po_number if e.purchase_order else None,
            material_names=material_names,
            material_qtys=None, # No longer needed separately
            reference_document_type=e.reference_document_type or "Invoice",
            tare_weight=e.tare_weight,
            gross_weight=e.gross_weight,
            net_weight=e.net_weight,
            weight_report_url=e.weight_report_url
        ))
    return result


@router.post("")
def create_gate_entry(
    data: GateEntryCreate, db: Session = Depends(get_db), 
    current_user: User = Depends(require_permission("gate_entry", "create")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    entry = GateEntry(
        entry_number=get_next_number(db, tenant_id, site_id, "GATE_ENTRY", "GE"),
        recorded_by_id=current_user.id,
        arrival_time=get_now_ist(),
        status="Awaiting GRN",
        vehicle_number=data.vehicle_number,
        driver_name=data.driver_name,
        driver_phone=data.driver_phone,
        delivery_person_name=data.delivery_person_name,
        entry_type="Standard",
        invoice_number=data.invoice_number,
        invoice_date=data.invoice_date,
        invoice_amount=data.invoice_amount,
        invoice_scan_url=data.invoice_scan_url,
        reference_document_type=data.reference_document_type,
        tare_weight=data.tare_weight,
        gross_weight=data.gross_weight,
        net_weight=data.net_weight,
        weight_report_url=data.weight_report_url,
        remarks=data.remarks,
        tenant_id=tenant_id,
        site_id=site_id
    )
    db.add(entry)
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

