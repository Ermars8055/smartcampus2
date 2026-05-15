"""Seeding script for transactional data (Procurement & Store Operations) for GRinfra (Tenant 3, Site 3)."""
from app.database import SessionLocal
from app.models import (
    Material, Vendor, Warehouse, Project, Room, Building, User,
    Indent, IndentItem, PurchaseRequest, PurchaseRequestItem,
    QuotationRequest, QuotationRequestItem, QuotationRequestVendor, VendorQuotation, 
    VendorQuotationItem, QuotationComparison, PurchaseOrder, 
    PurchaseOrderItem, GateEntry, GRN, GRNItem, MaterialIssue, 
    MaterialIssueItem, CurrentStock, StockLedger, TransactionType,
    IndentStatus, PRStatus, POStatus, GateEntryStatus, GRNStatus,
    IssueStatus, ReceiptType, PaymentStatus, GateEntryType,
    QuotationRequestStatus, VendorQuotationStatus, VendorQuotationReceiptStatus
)
from datetime import datetime, timedelta, date
import random
import math

def seed_transactions():
    db = SessionLocal()
    tenant_id = 3
    site_id = 3
    user_id = 4 # Site Admin
    project_id = 1 # GRInfraBangalore

    print(f"Cleaning existing transactional data for Tenant {tenant_id}, Site {site_id}...")
    
    # 1. GRN
    grn_ids = [g.id for g in db.query(GRN).filter_by(tenant_id=tenant_id).all()]
    if grn_ids:
        db.query(GRNItem).filter(GRNItem.grn_id.in_(grn_ids)).delete(synchronize_session=False)
        db.query(GRN).filter(GRN.id.in_(grn_ids)).delete(synchronize_session=False)

    # 2. Gate Entry
    db.query(GateEntry).filter_by(tenant_id=tenant_id).delete()

    # 3. PO
    po_ids = [p.id for p in db.query(PurchaseOrder).filter_by(tenant_id=tenant_id).all()]
    if po_ids:
        db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id.in_(po_ids)).delete(synchronize_session=False)
        db.query(PurchaseOrder).filter(PurchaseOrder.id.in_(po_ids)).delete(synchronize_session=False)

    # 4. Quotations
    qr_ids = [q.id for q in db.query(QuotationRequest).filter_by(tenant_id=tenant_id).all()]
    if qr_ids:
        db.query(QuotationComparison).filter(QuotationComparison.qr_id.in_(qr_ids)).delete(synchronize_session=False)
        vq_ids = [vq.id for vq in db.query(VendorQuotation).filter(VendorQuotation.qr_id.in_(qr_ids)).all()]
        if vq_ids:
            db.query(VendorQuotationItem).filter(VendorQuotationItem.vendor_quotation_id.in_(vq_ids)).delete(synchronize_session=False)
            db.query(VendorQuotation).filter(VendorQuotation.id.in_(vq_ids)).delete(synchronize_session=False)
        db.query(QuotationRequestItem).filter(QuotationRequestItem.qr_id.in_(qr_ids)).delete(synchronize_session=False)
        db.query(QuotationRequest).filter(QuotationRequest.id.in_(qr_ids)).delete(synchronize_session=False)

    # 5. PR
    pr_ids = [p.id for p in db.query(PurchaseRequest).filter_by(tenant_id=tenant_id).all()]
    if pr_ids:
        db.query(PurchaseRequestItem).filter(PurchaseRequestItem.pr_id.in_(pr_ids)).delete(synchronize_session=False)
        db.query(PurchaseRequest).filter(PurchaseRequest.id.in_(pr_ids)).delete(synchronize_session=False)

    # 6. Issues
    issue_ids = [i.id for i in db.query(MaterialIssue).filter_by(tenant_id=tenant_id).all()]
    if issue_ids:
        db.query(MaterialIssueItem).filter(MaterialIssueItem.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(MaterialIssue).filter(MaterialIssue.id.in_(issue_ids)).delete(synchronize_session=False)

    # 7. Indents
    indent_ids = [i.id for i in db.query(Indent).filter_by(tenant_id=tenant_id).all()]
    if indent_ids:
        db.query(IndentItem).filter(IndentItem.indent_id.in_(indent_ids)).delete(synchronize_session=False)
        db.query(Indent).filter(Indent.id.in_(indent_ids)).delete(synchronize_session=False)
    
    # 8. Ledger (Non-Opening Balance)
    db.query(StockLedger).filter(StockLedger.tenant_id == tenant_id, StockLedger.reference_type != "Opening Balance").delete(synchronize_session=False)
    
    db.commit()

    print("Fetching reference data...")
    materials = db.query(Material).filter_by(tenant_id=tenant_id).all()
    vendors = db.query(Vendor).filter_by(tenant_id=tenant_id).all()
    warehouses = db.query(Warehouse).filter_by(tenant_id=tenant_id).all()
    buildings = db.query(Building).filter_by(tenant_id=tenant_id).all()
    rooms = db.query(Room).filter_by(tenant_id=tenant_id).all()
    
    if not materials or not vendors or not warehouses:
        print("Error: Master data missing. Please run seed_civil_data.py first.")
        return

    base_date = datetime.now() - timedelta(days=30)

    # 1. Indents (15)
    print("Seeding 15 Indents...")
    for i in range(1, 16):
        status = random.choice([IndentStatus.APPROVED.value, IndentStatus.ISSUED.value, IndentStatus.AWAITING_APPROVAL.value])
        indent = Indent(
            tenant_id=tenant_id, site_id=site_id,
            indent_number=f"IND-{str(i).zfill(5)}",
            requester_id=user_id,
            room_id=random.choice(rooms).id,
            building_id=random.choice(buildings).id,
            floor="Floor 1",
            department="Civil",
            status=status,
            created_at=base_date + timedelta(days=i/2)
        )
        db.add(indent)
        db.flush()
        for _ in range(random.randint(2, 3)):
            db.add(IndentItem(
                indent_id=indent.id,
                material_id=random.choice(materials).id,
                requested_quantity=random.randint(10, 50),
                issued_quantity=random.randint(0, 10) if status == IndentStatus.ISSUED.value else 0
            ))
    db.commit()

    # 2. PRs (15)
    print("Seeding 15 PRs...")
    for i in range(1, 16):
        status = random.choice([PRStatus.APPROVED.value, PRStatus.SUBMITTED.value, PRStatus.CONVERTED.value])
        pr = PurchaseRequest(
            tenant_id=tenant_id, site_id=site_id,
            pr_number=f"PR-{str(i).zfill(5)}",
            requester_id=user_id,
            project_id=project_id,
            building_id=random.choice(buildings).id,
            department_name="Civil",
            required_date=(base_date + timedelta(days=i + 10)).date(),
            status=status,
            created_at=base_date + timedelta(days=i)
        )
        db.add(pr)
        db.flush()
        for _ in range(random.randint(2, 4)):
            db.add(PurchaseRequestItem(
                pr_id=pr.id,
                material_id=random.choice(materials).id,
                quantity=random.randint(50, 200)
            ))
    db.commit()

    # 3. QRs (15)
    print("Seeding 15 QRs...")
    for i in range(1, 16):
        status = random.choice([QuotationRequestStatus.RECEIVED.value, QuotationRequestStatus.COMPARED.value, QuotationRequestStatus.APPROVED.value])
        qr = QuotationRequest(
            tenant_id=tenant_id, site_id=site_id,
            qr_number=f"QR-{str(i).zfill(5)}",
            project_id=project_id,
            created_by_id=user_id,
            status=status,
            created_at=base_date + timedelta(days=i + 2)
        )
        db.add(qr)
        db.flush()
        selected_mats = random.sample(materials, 2)
        qr_items = []
        for mat in selected_mats:
            item = QuotationRequestItem(qr_id=qr.id, material_id=mat.id, quantity=100)
            db.add(item)
            db.flush()
            qr_items.append(item)
        for vendor in random.sample(vendors, 3):
            db.add(QuotationRequestVendor(qr_id=qr.id, vendor_id=vendor.id, is_sent=True, sent_at=base_date + timedelta(days=i + 3), receipt_status=VendorQuotationReceiptStatus.RECEIVED.value))
            db.flush()
            vq = VendorQuotation(qr_id=qr.id, vendor_id=vendor.id, quotation_number=f"QTN-{vendor.code}-{i}", status=VendorQuotationStatus.RECEIVED.value, entered_by_id=user_id)
            db.add(vq)
            db.flush()
            for qri in qr_items:
                db.add(VendorQuotationItem(vendor_quotation_id=vq.id, qr_item_id=qri.id, material_id=qri.material_id, quoted_rate=round(random.uniform(10, 500), 2), delivery_days=random.randint(1, 15)))
    db.commit()

    # 4. POs (15)
    print("Seeding 15 POs...")
    pos = []
    for i in range(1, 16):
        status = random.choice([POStatus.APPROVED.value, POStatus.SENT.value, POStatus.PARTIAL.value, POStatus.CLOSED.value])
        po = PurchaseOrder(
            tenant_id=tenant_id, site_id=site_id,
            po_number=f"PO-{str(i).zfill(5)}",
            vendor_id=random.choice(vendors).id,
            project_id=project_id,
            status=status,
            created_by_id=user_id,
            created_at=base_date + timedelta(days=i + 5)
        )
        db.add(po)
        db.flush()
        total_amt = 0
        for _ in range(random.randint(2, 3)):
            qty = random.randint(50, 100)
            rate = random.uniform(100, 1000)
            amt = qty * rate
            total_amt += amt
            db.add(PurchaseOrderItem(
                po_id=po.id, material_id=random.choice(materials).id,
                quantity=qty, rate=rate, amount=amt,
                received_quantity=qty if status == POStatus.CLOSED.value else (qty/2 if status == POStatus.PARTIAL.value else 0)
            ))
        po.total_amount = total_amt
        pos.append(po)
    db.commit()

    # 5. Gate Entries (15)
    print("Seeding 15 Gate Entries...")
    ges = []
    for i in range(1, 16):
        linked_po = pos[i-1]
        ge = GateEntry(
            tenant_id=tenant_id, site_id=site_id,
            entry_number=f"GE-{str(i).zfill(5)}",
            vehicle_number=f"KA-01-HH-{random.randint(1000, 9999)}",
            vendor_id=linked_po.vendor_id,
            po_id=linked_po.id,
            arrival_time=base_date + timedelta(days=i + 10),
            driver_name=random.choice(["Ravi Kumar", "Suresh Raina", "Amit Sharma", "Vikram Singh", "Deepak Gupta", "Sunil Yadav", "Manoj Kumar", "Rajesh Patel"]),
            status=GateEntryStatus.COMPLETED.value,
            recorded_by_id=user_id
        )
        db.add(ge)
        ges.append(ge)
    db.commit()

    # 6. GRNs (15)
    print("Seeding 15 GRNs...")
    for i in range(1, 16):
        linked_po = pos[i-1]
        linked_ge = ges[i-1]
        wh = random.choice(warehouses)
        grn = GRN(
            tenant_id=tenant_id, site_id=site_id,
            grn_number=f"GRN-{str(i).zfill(5)}",
            po_id=linked_po.id, gate_entry_id=linked_ge.id,
            warehouse_id=wh.id, project_id=project_id,
            vendor_id=linked_po.vendor_id,
            invoice_number=f"INV-{i*123}",
            invoice_date=(base_date + timedelta(days=i + 10)).date(),
            status=GRNStatus.COMPLETED.value,
            received_by_id=user_id,
            created_at=base_date + timedelta(days=i + 11)
        )
        db.add(grn)
        db.flush()
        
        total_invoice_amt = 0
        for po_item in linked_po.items:
            rec_qty = po_item.quantity if i <= 10 else po_item.quantity / 2
            line_amt = round(rec_qty * po_item.rate, 2)
            total_invoice_amt += line_amt
            db.add(GRNItem(
                grn_id=grn.id, material_id=po_item.material_id, po_item_id=po_item.id,
                ordered_quantity=po_item.quantity, received_quantity=rec_qty,
                accepted_quantity=rec_qty, rate=po_item.rate,
                taxable_amount=line_amt
            ))
            stock = db.query(CurrentStock).filter_by(material_id=po_item.material_id, warehouse_id=wh.id).first()
            if not stock:
                stock = CurrentStock(tenant_id=tenant_id, site_id=site_id, material_id=po_item.material_id, warehouse_id=wh.id, quantity=0)
                db.add(stock)
            stock.quantity += rec_qty
            db.flush()
            db.add(StockLedger(
                tenant_id=tenant_id, site_id=site_id, material_id=po_item.material_id,
                warehouse_id=wh.id, transaction_type=TransactionType.GRN.value,
                quantity=rec_qty, balance=stock.quantity, reference_type="GRN",
                reference_id=grn.id, reference_number=grn.grn_number,
                project_id=project_id, created_by_id=user_id
            ))
        grn.invoice_amount = round(total_invoice_amt, 2)
        grn.total_taxable_amount = round(total_invoice_amt, 2)
    db.commit()

    # 7. Issues (15)
    print("Seeding 15 Material Issues...")
    for i in range(1, 16):
        wh = random.choice(warehouses)
        issue = MaterialIssue(
            tenant_id=tenant_id, site_id=site_id,
            issue_number=f"ISS-{str(i).zfill(5)}",
            warehouse_id=wh.id, project_id=project_id,
            building_id=random.choice(buildings).id,
            issued_to_room_id=random.choice(rooms).id,
            status=IssueStatus.ISSUED.value,
            issued_by_id=user_id,
            created_at=base_date + timedelta(days=i + 15)
        )
        db.add(issue)
        db.flush()
        stocks = db.query(CurrentStock).filter(CurrentStock.warehouse_id == wh.id, CurrentStock.quantity > 5).all()
        if stocks:
            target_stock = random.choice(stocks)
            mat = db.query(Material).filter(Material.id == target_stock.material_id).first()
            rate = mat.standard_cost if mat else 0
            issue_qty = random.randint(1, 5)
            db.add(MaterialIssueItem(issue_id=issue.id, material_id=target_stock.material_id, quantity=float(issue_qty), rate=rate))
            target_stock.quantity -= issue_qty
            db.flush()
            db.add(StockLedger(
                tenant_id=tenant_id, site_id=site_id, material_id=target_stock.material_id,
                warehouse_id=wh.id, transaction_type=TransactionType.ISSUE.value,
                quantity=-issue_qty, balance=target_stock.quantity,
                reference_type="Material Issue", reference_id=issue.id,
                reference_number=issue.issue_number, project_id=project_id,
                created_by_id=user_id
            ))
    db.commit()
    print("Done seeding transactions.")
    db.close()

if __name__ == "__main__":
    seed_transactions()
