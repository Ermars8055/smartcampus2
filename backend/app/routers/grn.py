"""Goods Receipt Note routes with automatic stock updates."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models import GRN, GRNItem, PurchaseOrder, PurchaseOrderItem, GateEntry, CurrentStock, StockLedger, Material, Warehouse, User, AuditLog, EquipmentItem
from app.schemas import GRNCreate, GRNOut, GRNItemOut
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.utils.sequences import get_next_number
router = APIRouter(prefix='/api/grn', tags=['GRN'])

def update_stock(db: Session, material_id: int, warehouse_id: int, quantity: float, transaction_type: str, reference_type: str, reference_id: int, reference_number: str, tenant_id: int, site_id: int, project_id: int=None, room_id: int=None, user_id: int=None):
    """Update current stock and create ledger entry."""
    quantity = round(quantity)
    stock = db.query(CurrentStock).filter(CurrentStock.material_id == material_id, CurrentStock.warehouse_id == warehouse_id, CurrentStock.tenant_id == tenant_id, CurrentStock.site_id == site_id).first()
    if not stock:
        stock = CurrentStock(material_id=material_id, warehouse_id=warehouse_id, quantity=0, tenant_id=tenant_id, site_id=site_id)
        db.add(stock)
        db.flush()
    stock.quantity = round(stock.quantity + quantity)
    new_balance = stock.quantity
    ledger = StockLedger(material_id=material_id, warehouse_id=warehouse_id, transaction_type=transaction_type, quantity=quantity, balance=new_balance, reference_type=reference_type, reference_id=reference_id, reference_number=reference_number, project_id=project_id, room_id=room_id, created_by_id=user_id, tenant_id=tenant_id, site_id=site_id)
    db.add(ledger)

@router.get('')
def list_grn(search: Optional[str]=None, status: Optional[str]=None, project_id: Optional[int]=None, receipt_type: Optional[str]=None, db: Session=Depends(get_db), current_user: User=Depends(require_permission('grn', 'read')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    q = db.query(GRN).filter(GRN.tenant_id == tenant_id, GRN.site_id == site_id, GRN.is_deleted == False)
    is_platform_admin = getattr(current_user, '_is_platform_admin', False)
    if not is_platform_admin:
        scope = getattr(current_user, '_data_access_scope', 'Self Only')
        if scope not in ['Full Administrative Access', 'Organization']:
            q = q.filter(GRN.received_by_id == current_user.id)
    if search:
        q = q.filter(GRN.grn_number.ilike(f'%{search}%'))
    if status:
        q = q.filter(GRN.status == status)
    if project_id:
        q = q.filter(GRN.project_id == project_id)
    if receipt_type:
        q = q.filter(GRN.receipt_type == receipt_type)
    grns = q.order_by(GRN.created_at.desc()).all()
    result = []
    for g in grns:
        items = []
        for item in g.items:
            mat = item.material
            items.append(GRNItemOut(id=item.id, material_id=item.material_id, po_item_id=item.po_item_id, ordered_quantity=item.ordered_quantity, received_quantity=item.received_quantity, accepted_quantity=item.accepted_quantity, rejected_quantity=item.rejected_quantity, rate=item.rate, hsn_code=item.hsn_code, cgst_rate=item.cgst_rate, sgst_rate=item.sgst_rate, igst_rate=item.igst_rate, cgst_amount=item.cgst_amount, sgst_amount=item.sgst_amount, igst_amount=item.igst_amount, taxable_amount=item.taxable_amount, discount_percent=item.discount_percent, remarks=item.remarks, material_name=mat.name if mat else None, material_code=mat.code if mat else None, uom_name=mat.uom.abbreviation if mat and mat.uom else None))
        result.append(GRNOut(id=g.id, grn_number=g.grn_number, po_id=g.po_id, warehouse_id=g.warehouse_id, project_id=g.project_id, vendor_id=g.vendor_id, receipt_type=g.receipt_type, invoice_number=g.invoice_number, invoice_date=g.invoice_date, invoice_amount=g.invoice_amount, invoice_scan_url=g.invoice_scan_url, dc_number=g.dc_number, dc_date=g.dc_date, dc_scan_url=g.dc_scan_url, gate_entry_id=g.gate_entry_id, gate_entry_number=g.gate_entry.entry_number if g.gate_entry else None, remarks=g.remarks, vendor_gstin=g.vendor_gstin, total_taxable_amount=g.total_taxable_amount or 0, total_cgst=g.total_cgst or 0, total_sgst=g.total_sgst or 0, total_igst=g.total_igst or 0, total_tax=g.total_tax or 0, eway_bill_number=g.eway_bill_number, payment_status=g.payment_status or 'Not Applicable', status=g.status, created_at=g.created_at, completed_at=g.completed_at, po_number=g.purchase_order.po_number if g.purchase_order else None, warehouse_name=g.warehouse.name if g.warehouse else None, project_name=g.project.name if g.project else None, vendor_name=f'{g.vendor.code} - {g.vendor.name}' if g.vendor else None, received_by_name=g.received_by.full_name if g.received_by else None, items=items))
    return result

@router.post('')
def create_grn(data: GRNCreate, db: Session=Depends(get_db), current_user: User=Depends(require_permission('grn', 'create')), tenant_id: int=Depends(get_tenant_id), site_id: int=Depends(get_site_id)):
    try:
        is_direct = data.receipt_type == 'Direct Invoice'
        if is_direct:
            if not data.vendor_id:
                raise HTTPException(400, 'Vendor is required for Direct Invoice GRN')
            if not data.project_id:
                raise HTTPException(400, 'Project is required for Direct Invoice GRN')
            if not data.invoice_number:
                raise HTTPException(400, 'Invoice number is required for Direct Invoice GRN')
            vendor_id = data.vendor_id
            project_id = data.project_id
            contract_id = data.contract_id
        else:
            if not data.po_id:
                raise HTTPException(400, 'PO is required for PO-Based GRN')
            po = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.po_id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
            if not po:
                raise HTTPException(404, 'Purchase Order not found')
            vendor_id = po.vendor_id
            project_id = po.project_id
            contract_id = po.contract_id
        calculated_taxable = round(sum((item.accepted_quantity * item.rate for item in data.items)), 2)
        invoice_amt = data.invoice_amount
        total_taxable = data.total_taxable_amount
        if not invoice_amt or invoice_amt == 0:
            invoice_amt = calculated_taxable
        if not total_taxable or total_taxable == 0:
            total_taxable = calculated_taxable
        if total_taxable > 0 and abs(total_taxable - calculated_taxable) > 2.0:
            raise HTTPException(400, f'Taxable amount mismatch. Expected: {calculated_taxable}, Provided: {total_taxable}')
        expected_invoice_amount = round(total_taxable + data.total_tax, 2)
        if invoice_amt > 0 and expected_invoice_amount > 0 and (abs(invoice_amt - expected_invoice_amount) > 2.0):
            raise HTTPException(400, f'Invoice amount mismatch. Expected (Taxable + Tax): {expected_invoice_amount}, Provided: {invoice_amt}')
        grn = GRN(grn_number=get_next_number(db, tenant_id, site_id, 'GRN', 'GRN'), po_id=data.po_id if data.po_id else None, gate_entry_id=data.gate_entry_id, warehouse_id=data.warehouse_id, project_id=project_id, vendor_id=vendor_id, contract_id=contract_id, receipt_type=data.receipt_type, invoice_number=data.invoice_number, invoice_date=data.invoice_date, invoice_amount=invoice_amt, invoice_scan_url=data.invoice_scan_url, dc_number=data.dc_number, dc_date=data.dc_date, dc_scan_url=data.dc_scan_url, vendor_gstin=data.vendor_gstin, total_taxable_amount=total_taxable, total_cgst=data.total_cgst, total_sgst=data.total_sgst, total_igst=data.total_igst, total_tax=data.total_tax, eway_bill_number=data.eway_bill_number, payment_status='Pending' if is_direct else 'Not Applicable', remarks=data.remarks, received_by_id=current_user.id, status='Completed', tenant_id=tenant_id, site_id=site_id)
        db.add(grn)
        db.flush()
        for item_data in data.items:
            po_item = None
            if not is_direct and item_data.po_item_id:
                po_item = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.id == item_data.po_item_id).first()
                if po_item:
                    if po_item.received_quantity + item_data.accepted_quantity > po_item.quantity:
                        db.rollback()
                        raise HTTPException(status_code=400, detail=f'Cannot receive {item_data.accepted_quantity}. Only {po_item.quantity - po_item.received_quantity} remaining for this PO item.')
                    po_item.received_quantity += item_data.accepted_quantity
            mat_id = item_data.material_id
            if po_item:
                mat_id = po_item.material_id
            grn_item = GRNItem(grn_id=grn.id, material_id=mat_id, po_item_id=item_data.po_item_id if item_data.po_item_id else None, ordered_quantity=item_data.ordered_quantity or 0, received_quantity=item_data.received_quantity, accepted_quantity=item_data.accepted_quantity, rejected_quantity=item_data.rejected_quantity, rate=item_data.rate, hsn_code=item_data.hsn_code, cgst_rate=item_data.cgst_rate, sgst_rate=item_data.sgst_rate, igst_rate=item_data.igst_rate, cgst_amount=item_data.cgst_amount, sgst_amount=item_data.sgst_amount, igst_amount=item_data.igst_amount, taxable_amount=item_data.taxable_amount if item_data.taxable_amount > 0 else round(item_data.accepted_quantity * item_data.rate, 2), discount_percent=item_data.discount_percent, remarks=item_data.remarks)
            db.add(grn_item)
            db.flush()
            if contract_id and item_data.accepted_quantity > 0:
                from app.models import ContractItem
                c_item = db.query(ContractItem).filter(ContractItem.contract_id == contract_id, ContractItem.material_id == mat_id).first()
                if c_item:
                    c_item.consumed_quantity += item_data.accepted_quantity
                    if c_item.remaining_quantity is not None:
                        c_item.remaining_quantity -= item_data.accepted_quantity
            if item_data.accepted_quantity > 0:
                update_stock(db=db, material_id=mat_id, warehouse_id=data.warehouse_id, quantity=item_data.accepted_quantity, transaction_type='GRN', reference_type='GRN', reference_id=grn.id, reference_number=grn.grn_number, project_id=project_id, user_id=current_user.id, tenant_id=tenant_id, site_id=site_id)
                mat_obj = db.query(Material).filter(Material.id == mat_id).first()
                if mat_obj and (mat_obj.material_type == 'Equipment' or getattr(item_data, 'serial_numbers', None)):
                    serials = getattr(item_data, 'serial_numbers', None) or []
                    qty_int = int(round(item_data.accepted_quantity))
                    for i in range(qty_int):
                        sn = serials[i].strip() if i < len(serials) and serials[i] and serials[i].strip() else None
                        sn_status = 'Captured' if sn else 'Pending Update'
                        is_bio = getattr(mat_obj, 'is_biomedical', False) or False
                        req_inst = getattr(mat_obj, 'requires_installation', False) or False
                        inst_status = 'Pending Installation' if is_bio or req_inst else 'Not Required'
                        eq_status = 'Pending Installation' if inst_status == 'Pending Installation' else 'Operational'
                        eq_code = get_next_number(db, tenant_id, site_id, 'EQP', 'EQP')
                        po_ref = po if not is_direct else None
                        proc_type = po_ref.procurement_type if po_ref else 'Purchase'
                        eq_item = EquipmentItem(tenant_id=tenant_id, site_id=site_id, equipment_code=eq_code, material_id=mat_id, grn_id=grn.id, grn_item_id=grn_item.id, serial_number=sn, serial_number_status=sn_status, is_biomedical=is_bio, requires_installation=req_inst, installation_status=inst_status, installation_date=item_data.installation_date, warehouse_id=data.warehouse_id, project_id=project_id, status=eq_status, procurement_type=proc_type, rental_type=po_ref.rental_type if po_ref else None, rental_agreement_number=po_ref.rental_agreement_number if po_ref else None, rental_vendor_id=po_ref.vendor_id if po_ref and proc_type == 'Rental' else None, rental_start_date=item_data.rental_start_date or (po_ref.rental_start_date if po_ref else None), rental_end_date=po_ref.rental_end_date if po_ref else None, billing_frequency=po_ref.billing_frequency if po_ref else None, cost_per_test=po_ref.cost_per_test if po_ref else None, rental_status='Active' if proc_type == 'Rental' else None, expected_return_date=item_data.expected_return_date, warranty_end_date=item_data.warranty_end_date)
                        db.add(eq_item)
        grn.completed_at = datetime.utcnow()
        if data.gate_entry_id:
            gate = db.query(GateEntry).filter(GateEntry.id == data.gate_entry_id, GateEntry.tenant_id == tenant_id, GateEntry.site_id == site_id).first()
            if gate:
                gate.status = 'Completed'
        if not is_direct and data.po_id:
            po = db.query(PurchaseOrder).filter(PurchaseOrder.id == data.po_id, PurchaseOrder.tenant_id == tenant_id, PurchaseOrder.site_id == site_id).first()
            if po:
                all_received = all((item.received_quantity >= item.quantity for item in po.items))
                any_received = any((item.received_quantity > 0 for item in po.items))
                if all_received:
                    po.status = 'Closed'
                elif any_received:
                    po.status = 'Partially Received'
        db.commit()
        db.refresh(grn)
        return {'id': grn.id, 'grn_number': grn.grn_number, 'message': 'GRN created and stock updated'}
    except Exception as e:
        db.rollback()
        import logging
        logging.getLogger(__name__).error(f'GRN Creation Error: {str(e)}')
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="An internal error occurred")