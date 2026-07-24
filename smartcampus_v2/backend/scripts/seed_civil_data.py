"""Seed script for civil store data for GRinfra (Tenant 3, Site 3)."""
from app.database import SessionLocal
from app.models import (
    Category, UOM, Vendor, Warehouse, Material, Project, CurrentStock, 
    StockLedger, TransactionType, IndentItem, PurchaseRequestItem,
    PurchaseOrderItem, GRNItem, MaterialIssueItem, MaterialReturnItem,
    StockTransferItem, QuotationRequestItem, VendorQuotationItem,
    QuotationComparison, GateEntry, Alert, VendorCategory,
    GRN, MaterialIssue, MaterialReturn, StockTransfer, Indent,
    QuotationRequest, QuotationRequestVendor, VendorQuotation, 
    PurchaseRequest, PurchaseOrder, MaterialReturnItem
)
import random
import math

def seed_civil_data():
    db = SessionLocal()
    tenant_id = 3
    site_id = 3
    user_id = 4
    project_id = 1 # GRInfraBangalore

    print(f"Cleaning existing data for Tenant {tenant_id}, Site {site_id}...")
    
    # 1. Delete dependent transactional data in correct order (Child -> Parent)
    
    # GRN
    db.query(GRNItem).filter(GRNItem.grn_id.in_(db.query(GRN.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(GRN).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)
    
    # Gate Entry
    db.query(GateEntry).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)
    
    # Material Issues
    db.query(MaterialIssueItem).filter(MaterialIssueItem.issue_id.in_(db.query(MaterialIssue.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(MaterialIssue).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # Material Returns
    db.query(MaterialReturnItem).filter(MaterialReturnItem.return_id.in_(db.query(MaterialReturn.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(MaterialReturn).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # Stock Transfers
    db.query(StockTransferItem).filter(StockTransferItem.transfer_id.in_(db.query(StockTransfer.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(StockTransfer).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # POs
    db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id.in_(db.query(PurchaseOrder.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(PurchaseOrder).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # Quotations
    qr_ids = [q.id for q in db.query(QuotationRequest).filter_by(tenant_id=tenant_id).all()]
    if qr_ids:
        db.query(QuotationComparison).filter(QuotationComparison.qr_id.in_(qr_ids)).delete(synchronize_session=False)
        vq_ids = [vq.id for vq in db.query(VendorQuotation).filter(VendorQuotation.qr_id.in_(qr_ids)).all()]
        if vq_ids:
            db.query(VendorQuotationItem).filter(VendorQuotationItem.vendor_quotation_id.in_(vq_ids)).delete(synchronize_session=False)
            db.query(VendorQuotation).filter(VendorQuotation.id.in_(vq_ids)).delete(synchronize_session=False)
        db.query(QuotationRequestVendor).filter(QuotationRequestVendor.qr_id.in_(qr_ids)).delete(synchronize_session=False)
        db.query(QuotationRequestItem).filter(QuotationRequestItem.qr_id.in_(qr_ids)).delete(synchronize_session=False)
        db.query(QuotationRequest).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # Indents
    db.query(IndentItem).filter(IndentItem.indent_id.in_(db.query(Indent.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(Indent).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # PRs
    db.query(PurchaseRequestItem).filter(PurchaseRequestItem.pr_id.in_(db.query(PurchaseRequest.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(PurchaseRequest).filter_by(tenant_id=tenant_id).delete(synchronize_session=False)

    # Master Tables cleanup
    db.query(VendorCategory).filter(VendorCategory.vendor_id.in_(db.query(Vendor.id).filter_by(tenant_id=tenant_id))).delete(synchronize_session=False)
    db.query(Alert).filter_by(tenant_id=tenant_id).delete()
    db.query(StockLedger).filter_by(tenant_id=tenant_id).delete()
    db.query(CurrentStock).filter_by(tenant_id=tenant_id).delete()
    db.query(Material).filter_by(tenant_id=tenant_id).delete()
    db.query(Vendor).filter_by(tenant_id=tenant_id).delete()
    db.query(Warehouse).filter_by(tenant_id=tenant_id).delete()
    db.query(Category).filter_by(tenant_id=tenant_id).delete()
    
    db.commit()

    print(f"Seeding data for Tenant {tenant_id}, Site {site_id}...")

    # 1. Categories
    categories_data = [
        ("Cement", "All types of cement"),
        ("Sand & Aggregates", "River sand, M-Sand, Aggregates"),
        ("Steel & Reinforcement", "TMT bars, Binding wire"),
        ("Bricks & Blocks", "Clay bricks, Fly ash bricks, AAC blocks"),
        ("Plumbing & Sanitary", "Pipes, Fittings, Sanitary ware"),
        ("Electricals", "Wires, Switches, Lighting"),
        ("Paints & Finishes", "Paints, Primers, Putty"),
        ("Hardware & Tools", "Nails, Screws, Power tools"),
        ("Flooring & Tiling", "Tiles, Marble, Granite"),
        ("Wood & Timber", "Plywood, Timber, Doors")
    ]
    category_map = {}
    for i, (name, desc) in enumerate(categories_data):
        code = f"CAT-{str(i+1).zfill(4)}"
        cat = Category(tenant_id=tenant_id, site_id=site_id, name=name, code=code, description=desc)
        db.add(cat)
        db.flush()
        category_map[name] = cat.id

    # 2. UOM
    uom_map = {u.name: u.id for u in db.query(UOM).filter_by(tenant_id=tenant_id).all()}

    # 3. Vendors
    vendors_input = [
        ("UltraTech Cement Ltd.", "Rajesh Kumar", "9876543210", "29ULTRA1234F1Z5", 4.8, ["Cement"]),
        ("Tata Steel Ltd.", "Sanjay Singh", "9876543211", "29TATA1234F1Z5", 4.9, ["Steel & Reinforcement"]),
        ("ACC Limited", "Amit Shah", "9876543212", "29ACC1234F1Z5", 4.7, ["Cement"]),
        ("Asian Paints Ltd.", "Vijay Mallya", "9876543213", "29ASIAN1234F1Z5", 4.6, ["Paints & Finishes"]),
        ("Kajaria Ceramics Ltd.", "Ramesh Patel", "9876543214", "29KAJAR1234F1Z5", 4.5, ["Flooring & Tiling"]),
        ("Hindware Home Innovation Ltd.", "Suresh Raina", "9876543215", "29HIND1234F1Z5", 4.4, ["Plumbing & Sanitary"]),
        ("Havells India Ltd.", "Deepak Chahar", "9876543216", "29HAVEL1234F1Z5", 4.8, ["Electricals"]),
        ("Jaquar & Company Pvt Ltd.", "Pankaj Tripathi", "9876543217", "29JAQU1234F1Z5", 4.7, ["Plumbing & Sanitary"]),
        ("Dalmia Bharat Ltd.", "Arun Jaitley", "9876543218", "29DALM1234F1Z5", 4.5, ["Cement"]),
        ("JSW Steel Ltd.", "Sajjan Jindal", "9876543219", "29JSW1234F1Z5", 4.9, ["Steel & Reinforcement"])
    ]
    vendor_ids = []
    for i, (name, contact, phone, gst, rating, cat_names) in enumerate(vendors_input):
        code = f"VEN-{str(i+1).zfill(4)}"
        vendor = Vendor(tenant_id=tenant_id, site_id=site_id, name=name, code=code, contact_person=contact, phone=phone, gst_number=gst, city="Bangalore", rating=rating)
        db.add(vendor)
        db.flush()
        vendor_ids.append(vendor.id)
        for cat_name in cat_names:
            if cat_name in category_map:
                db.add(VendorCategory(vendor_id=vendor.id, category_id=category_map[cat_name]))

    # 4. Stores (15 Refined)
    stores_data = [
        ("Main Civil Store", "Main Store"), ("Hardware Store", "Hardware"), ("Electrical Store", "Electrical"),
        ("Plumbing Store", "Plumbing"), ("Paint Store", "Paint"), ("Stationary Store", "Stationary"),
        ("Safety Equipment Store", "Safety"), ("Consumables Store", "Consumables"), ("Raw Material Store", "Raw Material"),
        ("Finished Goods Store", "Finished Goods"), ("Scrap Store", "Scrap"), ("Site Store A", "Site Store"),
        ("Site Store B", "Site Store"), ("Central Warehouse", "Central"), ("Regional Store", "Regional")
    ]
    store_map = {}
    for i, (name, wh_type) in enumerate(stores_data):
        code = f"STO-{str(i+1).zfill(4)}"
        store = Warehouse(tenant_id=tenant_id, site_id=site_id, name=name, code=code, project_id=project_id, warehouse_type=wh_type, location="Bangalore", manager_id=user_id)
        db.add(store)
        db.flush()
        store_map[name] = store.id
    print(f"Seeded 15 stores with STO-0001+ format and Bangalore location.")

    # 5. Materials (35)
    materials_input = [
        # == Consumables ==
        ("OPC 53 Grade Cement", "Cement", "Bags", 450, 18, "Main Civil Store", "Covered", "Consumable", 100, "High-strength Ordinary Portland Cement for structural concrete."),
        ("PPC Cement", "Cement", "Bags", 420, 18, "Main Civil Store", "Covered", "Consumable", 150, "Portland Pozzolana Cement for plastering and masonry works."),
        ("River Sand", "Sand & Aggregates", "Cubic Meter", 1200, 5, "Raw Material Store", "Open Yard", "Consumable", 50, "Fine river sand for high-quality concrete and mortar."),
        ("M-Sand", "Sand & Aggregates", "Cubic Meter", 800, 5, "Raw Material Store", "Open Yard", "Consumable", 80, "Manufactured sand as an eco-friendly alternative to river sand."),
        ("Aggregates 20mm", "Sand & Aggregates", "Cubic Meter", 950, 5, "Raw Material Store", "Open Yard", "Consumable", 40, "Crushed stone aggregates for structural concrete."),
        ("12mm TMT Bars", "Steel & Reinforcement", "Metric Ton", 65000, 18, "Main Civil Store", "Open Yard", "Consumable", 10, "High-ductility TMT bars for reinforcement."),
        ("16mm TMT Bars", "Steel & Reinforcement", "Metric Ton", 65000, 18, "Main Civil Store", "Open Yard", "Consumable", 10, "High-tensile strength bars for heavy load structures."),
        ("Binding Wire", "Steel & Reinforcement", "Kilograms", 85, 18, "Hardware Store", "Covered", "Consumable", 50, "Annealed binding wire for securing reinforcement bars."),
        ("Fly Ash Bricks", "Bricks & Blocks", "Numbers", 8, 5, "Raw Material Store", "Open Yard", "Consumable", 5000, "Uniform sized fly ash bricks for wall construction."),
        ("AAC Blocks 4 inch", "Bricks & Blocks", "Numbers", 65, 12, "Raw Material Store", "Open Yard", "Consumable", 2000, "Lightweight Autoclaved Aerated Concrete blocks."),
        ("PVC Pipe 4 inch", "Plumbing & Sanitary", "Running Meter", 250, 18, "Plumbing Store", "Covered", "Consumable", 100, "Heavy-duty PVC pipes for drainage systems."),
        ("Water Tank 1000L", "Plumbing & Sanitary", "Numbers", 6500, 18, "Plumbing Store", "Open Yard", "Consumable", 10, "Triple-layered HDPE water storage tank."),
        ("2.5sqmm Copper Wire", "Electricals", "Rolls", 1800, 18, "Electrical Store", "Warehouse", "Consumable", 20, "FRLS insulated copper wire for internal wiring."),
        ("LED Tube Light 20W", "Electricals", "Numbers", 350, 18, "Electrical Store", "Warehouse", "Consumable", 50, "Energy-saving LED tube lights for office and site."),
        ("Emulsion White Paint", "Paints & Finishes", "Liters", 280, 18, "Paint Store", "Covered", "Consumable", 40, "Premium interior emulsion for smooth wall finish."),
        ("Wall Putty 40kg", "Paints & Finishes", "Bags", 750, 5, "Paint Store", "Covered", "Consumable", 30, "White cement-based putty for wall leveling."),
        ("Stainless Steel Hinges", "Hardware & Tools", "Pairs", 120, 18, "Hardware Store", "Warehouse", "Consumable", 200, "Rust-free SS hinges for doors and windows."),
        ("Screws 1 inch", "Hardware & Tools", "Boxes", 450, 18, "Hardware Store", "Warehouse", "Consumable", 100, "Zinc-coated wood screws for carpentry."),
        ("Safety Helmet", "Hardware & Tools", "Numbers", 250, 18, "Safety Equipment Store", "Warehouse", "Consumable", 100, "Industrial safety helmets with adjustable straps."),
        ("Safety Shoes", "Hardware & Tools", "Pairs", 1200, 18, "Safety Equipment Store", "Warehouse", "Consumable", 50, "Steel-toe safety shoes for site engineers and workers."),
        ("Vitrified Tiles 600x600", "Flooring & Tiling", "Square Foot", 45, 18, "Finished Goods Store", "Covered", "Consumable", 1000, "Double-charged vitrified tiles for flooring."),
        ("Adhesive for Tiles 20kg", "Flooring & Tiling", "Bags", 550, 18, "Finished Goods Store", "Covered", "Consumable", 100, "Polymer-modified tile adhesive for long-lasting bond."),
        ("Plywood 18mm", "Wood & Timber", "Square Foot", 110, 18, "Main Civil Store", "Covered", "Consumable", 500, "Commercial grade MR plywood for shuttering and furniture."),
        ("Teak Wood Door 3x7", "Wood & Timber", "Numbers", 12500, 18, "Main Civil Store", "Covered", "Consumable", 20, "Solid teak wood main doors for apartments."),
        ("Concrete Curing Agent", "Cement", "Liters", 150, 18, "Main Civil Store", "Covered", "Consumable", 50, "Liquid curing compound for moisture retention in concrete."),

        # == Non-Consumables ==
        ("Concrete Mixer 10/7 CFT", "Hardware & Tools", "Numbers", 145000, 18, "Main Civil Store", "Open Yard", "Non-Consumable", 2, "Diesel-powered concrete mixer for site works."),
        ("Digital Theodolite", "Hardware & Tools", "Numbers", 85000, 18, "Main Civil Store", "Warehouse", "Non-Consumable", 1, "Precision surveying instrument for angle measurement."),
        ("Bosch Hand Grinder 4 inch", "Hardware & Tools", "Numbers", 4500, 18, "Hardware Store", "Warehouse", "Non-Consumable", 5, "Power tool for cutting and grinding steel/masonry."),
        ("Makita Hammer Drill", "Hardware & Tools", "Numbers", 9200, 18, "Hardware Store", "Warehouse", "Non-Consumable", 5, "Heavy-duty rotary hammer drill for site installation."),
        ("Office Workstation Desk", "Wood & Timber", "Numbers", 12000, 18, "Stationary Store", "Warehouse", "Non-Consumable", 10, "Modular workstation for site office staff."),
        ("Ergonomic Office Chair", "Hardware & Tools", "Numbers", 6500, 18, "Stationary Store", "Warehouse", "Non-Consumable", 10, "High-back mesh chair for office comfort."),
        ("Fire Extinguisher 6kg ABC", "Hardware & Tools", "Numbers", 3500, 18, "Safety Equipment Store", "Warehouse", "Non-Consumable", 15, "Dry powder fire extinguisher for site safety."),
        ("Heavy-duty Wheelbarrow", "Hardware & Tools", "Numbers", 4800, 18, "Raw Material Store", "Open Yard", "Non-Consumable", 20, "Steel body wheelbarrow for material transport."),
        ("Steel Shovel", "Hardware & Tools", "Numbers", 450, 18, "Hardware Store", "Warehouse", "Non-Consumable", 50, "Heavy-duty steel shovel with wooden handle."),
        ("Iron Pickaxe", "Hardware & Tools", "Numbers", 650, 18, "Hardware Store", "Warehouse", "Non-Consumable", 30, "Double-headed pickaxe for hard soil excavation.")
    ]

    total_mats = len(materials_input)
    random.shuffle(materials_input)
    above_count = int(total_mats * 0.75)
    
    materials_created = []
    for i, (name, cat_name, uom_name, cost, gst, store_name, storage, mat_type, reorder, desc) in enumerate(materials_input):
        code = f"MAT-{str(i+1).zfill(5)}"
        max_level = math.ceil(reorder * random.uniform(3.0, 5.0))
        mat = Material(tenant_id=tenant_id, site_id=site_id, code=code, name=name, category_id=category_map[cat_name], uom_id=uom_map[uom_name], standard_cost=cost, gst_rate=gst, preferred_vendor_id=random.choice(vendor_ids), warehouse_id=store_map[store_name], storage_type=storage, material_type=mat_type, reorder_level=reorder, maximum_level=max_level, description=desc)
        db.add(mat)
        db.flush()
        is_above = i < above_count
        stock_qty = random.randint(int(reorder) + 1, int(max_level)) if is_above else random.randint(1, max(1, int(reorder) - 1))
        db.add(CurrentStock(tenant_id=tenant_id, site_id=site_id, material_id=mat.id, warehouse_id=mat.warehouse_id, quantity=float(stock_qty)))
        db.add(StockLedger(tenant_id=tenant_id, site_id=site_id, material_id=mat.id, warehouse_id=mat.warehouse_id, transaction_type=TransactionType.ADJUSTMENT.value, quantity=float(stock_qty), balance=float(stock_qty), reference_type="Opening Balance", reference_number="OB-001", remarks="Initial seed stock", created_by_id=user_id))
        materials_created.append(mat)

    db.commit()
    print(f"Seeded everything with refined codes and Bangalore locations.")
    db.close()
    print("Done refining civil data.")

if __name__ == "__main__":
    seed_civil_data()
