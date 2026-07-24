import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models import (
    GRN, GRNItem, PurchaseOrder, GateEntry, StockLedger, PurchaseOrderItem, GRNStatus
)

def restore():
    db = SessionLocal()
    tenant_id = 3
    site_id = 3

    print("Starting restoration of GRNs 1-15...")

    for i in range(1, 16):
        grn_number = f"GRN-{str(i).zfill(5)}"
        po_number = f"PO-{str(i).zfill(5)}"
        ge_number = f"GE-{str(i).zfill(5)}"

        # Check if GRN already exists
        existing = db.query(GRN).filter_by(tenant_id=tenant_id, site_id=site_id, grn_number=grn_number).first()
        if existing:
            print(f"{grn_number} already exists, skipping.")
            continue

        po = db.query(PurchaseOrder).filter_by(tenant_id=tenant_id, site_id=site_id, po_number=po_number).first()
        ge = db.query(GateEntry).filter_by(tenant_id=tenant_id, site_id=site_id, entry_number=ge_number).first()
        
        if not po or not ge:
            print(f"Skipping {grn_number}: Missing PO or GE.")
            continue

        ledgers = db.query(StockLedger).filter_by(tenant_id=tenant_id, site_id=site_id, reference_number=grn_number, transaction_type='GRN').all()
        if not ledgers:
            print(f"Skipping {grn_number}: No StockLedger entries found.")
            continue

        # Get unique warehouse_id from ledger
        warehouse_id = ledgers[0].warehouse_id
        created_at = ledgers[0].created_at
        user_id = ledgers[0].created_by_id

        grn = GRN(
            tenant_id=tenant_id, site_id=site_id,
            grn_number=grn_number,
            po_id=po.id, gate_entry_id=ge.id,
            warehouse_id=warehouse_id, project_id=po.project_id,
            vendor_id=po.vendor_id,
            invoice_number=f"INV-{i*123}",
            invoice_date=created_at.date(),
            status=GRNStatus.COMPLETED.value,
            received_by_id=user_id,
            created_at=created_at,
            completed_at=created_at
        )
        db.add(grn)
        db.flush()

        total_invoice_amt = 0
        for ledger in ledgers:
            po_item = db.query(PurchaseOrderItem).filter_by(po_id=po.id, material_id=ledger.material_id).first()
            if not po_item:
                continue
            
            rec_qty = ledger.quantity
            line_amt = round(rec_qty * po_item.rate, 2)
            total_invoice_amt += line_amt
            
            db.add(GRNItem(
                grn_id=grn.id, material_id=po_item.material_id, po_item_id=po_item.id,
                ordered_quantity=po_item.quantity, received_quantity=rec_qty,
                accepted_quantity=rec_qty, rate=po_item.rate,
                taxable_amount=line_amt
            ))
            
        grn.invoice_amount = round(total_invoice_amt, 2)
        grn.total_taxable_amount = round(total_invoice_amt, 2)
        db.commit()
        print(f"Restored {grn_number}")

    print("Restoration complete.")
    db.close()

if __name__ == "__main__":
    restore()
