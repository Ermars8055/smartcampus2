"""Goods Receipt Note routes with automatic stock updates."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import (
    GRN, GRNItem, PurchaseOrder, PurchaseOrderItem, GateEntry,
    CurrentStock, StockLedger, Material, Warehouse, User, AuditLog
)
from app.schemas import GRNCreate, GRNOut, GRNItemOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/grn", tags=["GRN"])


def generate_grn_number(db: Session) -> str:
    count = db.query(GRN).count() + 1
    return f"GRN-{datetime.now().strftime('%Y%m')}-{count:04d}"


def update_stock(db: Session, material_id: int, warehouse_id: int, quantity: float,
                 transaction_type: str, reference_type: str, reference_id: int,
                 reference_number: str, project_id: int = None, block_id: int = None,
                 user_id: int = None):
    """Update current stock and create ledger entry."""
    stock = db.query(CurrentStock).filter(
        CurrentStock.material_id == material_id,
        CurrentStock.warehouse_id == warehouse_id
    ).first()
    if not stock:
        stock = CurrentStock(material_id=material_id, warehouse_id=warehouse_id, quantity=0)
        db.add(stock)
        db.flush()

    stock.quantity += quantity
    new_balance = stock.quantity

    ledger = StockLedger(
        material_id=material_id,
        warehouse_id=warehouse_id,
        transaction_type=transaction_type,
        quantity=quantity,
        balance=new_balance,
        reference_type=reference_type,
        reference_id=reference_id,
        reference_number=reference_number,
        project_id=project_id,
        block_id=block_id,
        created_by_id=user_id
    )
    db.add(ledger)


@router.get("")
def list_grn(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(GRN)
    if status:
        q = q.filter(GRN.status == status)
    if project_id:
        q = q.filter(GRN.project_id == project_id)
    grns = q.order_by(GRN.created_at.desc()).all()
    result = []
    for g in grns:
        items = []
        for item in g.items:
            mat = item.material
            items.append(GRNItemOut(
                id=item.id, material_id=item.material_id,
                ordered_quantity=item.ordered_quantity,
                received_quantity=item.received_quantity,
                accepted_quantity=item.accepted_quantity,
                rejected_quantity=item.rejected_quantity,
                rate=item.rate, po_item_id=item.po_item_id,
                remarks=item.remarks,
                material_name=mat.name if mat else None,
                material_code=mat.code if mat else None,
                uom_name=mat.uom.name if mat and mat.uom else None
            ))
        result.append(GRNOut(
            id=g.id, grn_number=g.grn_number,
            po_id=g.po_id, warehouse_id=g.warehouse_id,
            project_id=g.project_id, vendor_id=g.vendor_id,
            invoice_number=g.invoice_number, invoice_date=g.invoice_date,
            invoice_amount=g.invoice_amount, status=g.status,
            created_at=g.created_at, completed_at=g.completed_at,
            po_number=g.purchase_order.po_number if g.purchase_order else None,
            warehouse_name=g.warehouse.name if g.warehouse else None,
            project_name=g.project.name if g.project else None,
            vendor_name=g.vendor.name if g.vendor else None,
            received_by_name=g.received_by.full_name if g.received_by else None,
            items=items
        ))
    return result


@router.post("")
def create_grn(data: GRNCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    grn = GRN(
        grn_number=generate_grn_number(db),
        po_id=data.po_id,
        gate_entry_id=data.gate_entry_id,
        warehouse_id=data.warehouse_id,
        project_id=data.project_id,
        vendor_id=data.vendor_id,
        invoice_number=data.invoice_number,
        invoice_date=data.invoice_date,
        invoice_amount=data.invoice_amount,
        remarks=data.remarks,
        received_by_id=current_user.id,
        status="Completed"
    )
    db.add(grn)
    db.flush()

    for item_data in data.items:
        # Update PO item received quantity and validate
        if item_data.po_item_id:
            po_item = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.id == item_data.po_item_id).first()
            if po_item:
                if (po_item.received_quantity + item_data.accepted_quantity) > po_item.quantity:
                    db.rollback()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Cannot receive {item_data.accepted_quantity}. Only {po_item.quantity - po_item.received_quantity} remaining for this PO item."
                    )
                po_item.received_quantity += item_data.accepted_quantity

        grn_item = GRNItem(
            grn_id=grn.id,
            material_id=item_data.material_id,
            po_item_id=item_data.po_item_id,
            ordered_quantity=item_data.ordered_quantity,
            received_quantity=item_data.received_quantity,
            accepted_quantity=item_data.accepted_quantity,
            rejected_quantity=item_data.rejected_quantity,
            rate=item_data.rate,
            remarks=item_data.remarks
        )
        db.add(grn_item)

        # Update stock with accepted quantity
        if item_data.accepted_quantity > 0:
            update_stock(
                db=db,
                material_id=item_data.material_id,
                warehouse_id=data.warehouse_id,
                quantity=item_data.accepted_quantity,
                transaction_type="GRN",
                reference_type="GRN",
                reference_id=grn.id,
                reference_number=grn.grn_number,
                project_id=data.project_id,
                user_id=current_user.id
            )

        # (Moved PO item update to validation above)

    grn.completed_at = datetime.utcnow()

    # Update gate entry status
    if data.gate_entry_id:
        gate = db.query(GateEntry).filter(GateEntry.id == data.gate_entry_id).first()
        if gate:
            gate.status = "Completed"

    # Check and update PO status
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.po_id).first()
    if po:
        all_received = all(
            item.received_quantity >= item.quantity for item in po.items
        )
        any_received = any(item.received_quantity > 0 for item in po.items)
        if all_received:
            po.status = "Closed"
        elif any_received:
            po.status = "Partially Received"

    db.add(AuditLog(
        user_id=current_user.id, action="CREATE",
        entity_type="GRN", entity_id=grn.id,
        new_values=f"GRN {grn.grn_number} created"
    ))
    db.commit()
    db.refresh(grn)
    return {"id": grn.id, "grn_number": grn.grn_number, "message": "GRN created and stock updated"}
