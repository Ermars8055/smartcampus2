"""Comprehensive seed data for NissiGrid Smart Stores demo."""

from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session
from app.models import (
    User, Organization, Project, Block, Warehouse,
    Category, SubCategory, UOM, Material, Vendor, VendorCategory,
    PurchaseRequest, PurchaseRequestItem, PurchaseOrder, PurchaseOrderItem,
    GateEntry, GRN, GRNItem,
    MaterialIssue, MaterialIssueItem, MaterialReturn, MaterialReturnItem,
    StockTransfer, StockTransferItem,
    CurrentStock, StockLedger, Alert
)
from app.auth import get_password_hash


def seed_database(db: Session):
    """Populate the database with comprehensive demo data."""

    # Check if already seeded
    if db.query(User).count() > 0:
        print("Database already seeded. Skipping.")
        return

    print("🌱 Seeding database...")

    # ── Users ────────────────────────────────────────────────────────────
    users_data = [
        ("admin", "admin@nissigrid.com", "System Administrator", "Admin", "admin123"),
        ("purchase_mgr", "purchase@nissigrid.com", "Rajesh Kumar", "Purchase Manager", "pass123"),
        ("storekeeper", "store@nissigrid.com", "Anita Sharma", "Store Keeper", "pass123"),
        ("security", "security@nissigrid.com", "Mohan Das", "Security", "pass123"),
        ("engineer1", "engineer1@nissigrid.com", "Priya Patel", "Engineer", "pass123"),
        ("engineer2", "engineer2@nissigrid.com", "Suresh Menon", "Engineer", "pass123"),
        ("mgmt", "mgmt@nissigrid.com", "Vikram Singh", "Management", "pass123"),
    ]
    users = []
    for uname, email, name, role, pwd in users_data:
        u = User(username=uname, email=email, full_name=name, role=role,
                 hashed_password=get_password_hash(pwd))
        db.add(u)
        users.append(u)
    db.flush()
    print("  ✅ Users created")

    # ── Organizations ────────────────────────────────────────────────────
    org1 = Organization(name="ABC Infrastructure Pvt Ltd", code="ABC-INFRA",
                        address="123 Construction Lane, Mumbai", phone="022-12345678",
                        email="info@abcinfra.com")
    org2 = Organization(name="City Medical Campus Trust", code="CMC-TRUST",
                        address="45 Health Avenue, Bangalore", phone="080-87654321",
                        email="admin@citymedical.org")
    org3 = Organization(name="National Education Foundation", code="NEF",
                        address="78 Knowledge Park, Chennai", phone="044-55667788",
                        email="info@nefedu.org")
    db.add_all([org1, org2, org3])
    db.flush()

    # Link admin to org1
    users[0].organization_id = org1.id
    for u in users[1:]:
        u.organization_id = org1.id
    print("  ✅ Organizations created")

    # ── Projects ─────────────────────────────────────────────────────────
    proj1 = Project(name="Green Valley Residency", code="GVR-001",
                    organization_id=org1.id, location="Pune, Maharashtra",
                    start_date=date(2025, 1, 15), end_date=date(2027, 6, 30),
                    status="Active", budget=50_00_00_000)
    proj2 = Project(name="City Medical Campus", code="CMC-001",
                    organization_id=org2.id, location="Bangalore, Karnataka",
                    start_date=date(2025, 3, 1), end_date=date(2027, 12, 31),
                    status="Active", budget=75_00_00_000)
    proj3 = Project(name="Sunrise Tech Park", code="STP-001",
                    organization_id=org1.id, location="Hyderabad, Telangana",
                    start_date=date(2025, 6, 1), end_date=date(2028, 5, 31),
                    status="Active", budget=120_00_00_000)
    db.add_all([proj1, proj2, proj3])
    db.flush()
    print("  ✅ Projects created")

    # ── Blocks ───────────────────────────────────────────────────────────
    blocks_data = [
        (proj1.id, "Tower A", "GVR-TA", "Tower", 14),
        (proj1.id, "Tower B", "GVR-TB", "Tower", 14),
        (proj1.id, "Tower C", "GVR-TC", "Tower", 10),
        (proj2.id, "OPD Block", "CMC-OPD", "Building", 4),
        (proj2.id, "ICU Block", "CMC-ICU", "Building", 3),
        (proj2.id, "Hostel Block", "CMC-HST", "Building", 6),
        (proj3.id, "Block Alpha", "STP-A", "Tower", 20),
        (proj3.id, "Block Beta", "STP-B", "Tower", 18),
    ]
    blocks = []
    for pid, name, code, btype, floors in blocks_data:
        b = Block(project_id=pid, name=name, code=code, block_type=btype, floors=floors)
        db.add(b)
        blocks.append(b)
    db.flush()
    print("  ✅ Blocks created")

    # ── Warehouses ───────────────────────────────────────────────────────
    wh_data = [
        (proj1.id, "Main Store", "WH-GVR-MAIN", "Main", "Central Area", "5000 sqft", "Anita Sharma"),
        (proj1.id, "Civil Yard", "WH-GVR-CIVIL", "Civil", "Near Tower A", "10000 sqft", "Ram Kumar"),
        (proj1.id, "Electrical Store", "WH-GVR-ELEC", "Electrical", "Near Substation", "2000 sqft", "Sunil Verma"),
        (proj2.id, "Main Store CMC", "WH-CMC-MAIN", "Main", "Central Campus", "4000 sqft", "Lakshmi R"),
        (proj2.id, "Housekeeping Store", "WH-CMC-HK", "Housekeeping", "Service Block", "1000 sqft", "Meera K"),
        (proj3.id, "Central Warehouse", "WH-STP-MAIN", "Main", "Basement Level", "8000 sqft", "Ajay P"),
    ]
    warehouses = []
    for pid, name, code, wtype, loc, cap, mgr in wh_data:
        w = Warehouse(project_id=pid, name=name, code=code, warehouse_type=wtype,
                      location=loc, capacity=cap, manager_name=mgr)
        db.add(w)
        warehouses.append(w)
    db.flush()
    print("  ✅ Warehouses created")

    # ── Categories ───────────────────────────────────────────────────────
    cat_data = [
        ("Civil", "Civil construction materials"),
        ("Electrical", "Electrical materials and components"),
        ("Plumbing", "Plumbing pipes, fittings, and fixtures"),
        ("Housekeeping", "Cleaning and housekeeping supplies"),
        ("Maintenance", "Maintenance tools and consumables"),
        ("Hardware", "Hardware items, fasteners, and tools"),
    ]
    categories = []
    for name, desc in cat_data:
        c = Category(name=name, description=desc)
        db.add(c)
        categories.append(c)
    db.flush()

    # Subcategories
    subcat_data = [
        (categories[0].id, "Cement"), (categories[0].id, "Steel"), (categories[0].id, "Aggregates"),
        (categories[0].id, "Blocks & Bricks"), (categories[0].id, "Tiles"),
        (categories[1].id, "Wiring"), (categories[1].id, "Switchgear"), (categories[1].id, "Lighting"),
        (categories[2].id, "Pipes"), (categories[2].id, "Fittings"), (categories[2].id, "Valves"),
        (categories[3].id, "Cleaning Chemicals"), (categories[3].id, "Disposables"),
        (categories[4].id, "Tools"), (categories[4].id, "Lubricants"),
        (categories[5].id, "Fasteners"), (categories[5].id, "Power Tools"),
    ]
    subcats = []
    for cid, name in subcat_data:
        sc = SubCategory(category_id=cid, name=name)
        db.add(sc)
        subcats.append(sc)
    db.flush()
    print("  ✅ Categories created")

    # ── UOM ──────────────────────────────────────────────────────────────
    uom_data = [
        ("Bag", "Bag"), ("Kilogram", "Kg"), ("Ton", "Ton"),
        ("Piece", "Pcs"), ("Litre", "Ltr"), ("Meter", "Mtr"),
        ("Box", "Box"), ("Bundle", "Bdl"), ("Sqft", "Sqft"),
        ("Cubic Meter", "Cum"), ("Roll", "Roll"), ("Set", "Set"),
    ]
    uoms = []
    for name, abbr in uom_data:
        u = UOM(name=name, abbreviation=abbr)
        db.add(u)
        uoms.append(u)
    db.flush()
    print("  ✅ UOM created")

    # ── Vendors ──────────────────────────────────────────────────────────
    vendors_data = [
        ("UltraTech Cement Dealers", "VND-001", "Arun Mehta", "9876543210", "arun@ultratech.com",
         "27AABCU1234F1ZH", "Plot 5, Industrial Area, Pune", "Pune", "Maharashtra"),
        ("Tata Steel Distributors", "VND-002", "Sneha Reddy", "9876543211", "sneha@tatasteel.com",
         "29AABCT5678G2ZK", "Steel Market, MIDC, Mumbai", "Mumbai", "Maharashtra"),
        ("Supreme Pipes India", "VND-003", "Karan Shah", "9876543212", "karan@supreme.com",
         "27AABCS9012H3ZL", "Plumbing Avenue, Nashik", "Nashik", "Maharashtra"),
        ("Havells Electrical Supply", "VND-004", "Nisha Gupta", "9876543213", "nisha@havells.com",
         "07AABCH3456I4ZM", "Light Street, Delhi", "Delhi", "Delhi"),
        ("Asian Paints Store", "VND-005", "Deepak Joshi", "9876543214", "deepak@asianpaints.com",
         "27AABCA7890J5ZN", "Paint Plaza, Pune", "Pune", "Maharashtra"),
        ("ACC Concrete Solutions", "VND-006", "Ramesh Iyer", "9876543215", "ramesh@acc.com",
         "29AABCA1234K6ZO", "Concrete Hub, Bangalore", "Bangalore", "Karnataka"),
        ("Finolex Cables Ltd", "VND-007", "Pooja Nair", "9876543216", "pooja@finolex.com",
         "27AABCF5678L7ZP", "Cable Market, Pune", "Pune", "Maharashtra"),
        ("Johnson Tiles Agency", "VND-008", "Manoj Kumar", "9876543217", "manoj@johnson.com",
         "32AABCJ9012M8ZQ", "Tile World, Chennai", "Chennai", "Tamil Nadu"),
        ("Hindustan Cleaning Supplies", "VND-009", "Sita Devi", "9876543218", "sita@hcs.com",
         "27AABCH3456N9ZR", "Clean Street, Mumbai", "Mumbai", "Maharashtra"),
        ("Bosch Hardware Tools", "VND-010", "Ravi Shankar", "9876543219", "ravi@bosch.com",
         "29AABCB7890P0ZS", "Tool Market, Bangalore", "Bangalore", "Karnataka"),
    ]
    vendors = []
    for vdata in vendors_data:
        v = Vendor(name=vdata[0], code=vdata[1], contact_person=vdata[2],
                   phone=vdata[3], email=vdata[4], gst_number=vdata[5],
                   address=vdata[6], city=vdata[7], state=vdata[8], rating=round(random.uniform(3.5, 5.0), 1))
        db.add(v)
        vendors.append(v)
    db.flush()

    # Vendor-Category mapping
    vendor_cat_map = [
        (0, [0]), (1, [0]), (2, [2]), (3, [1]), (4, [0, 4]),
        (5, [0]), (6, [1]), (7, [0]), (8, [3]), (9, [5, 4]),
    ]
    for vi, cat_indices in vendor_cat_map:
        for ci in cat_indices:
            db.add(VendorCategory(vendor_id=vendors[vi].id, category_id=categories[ci].id))
    db.flush()
    print("  ✅ Vendors created")

    # ── Materials (50) ───────────────────────────────────────────────────
    materials_data = [
        # Civil Materials
        ("MAT-001", "Cement OPC 53 Grade", 0, 0, 0, 100, 500, 380, 0, "Covered"),
        ("MAT-002", "Cement PPC Grade", 0, 0, 0, 80, 400, 360, 0, "Covered"),
        ("MAT-003", "TMT Steel 8mm", 0, 1, 1, 500, 5000, 65, 1, "Open Yard"),
        ("MAT-004", "TMT Steel 10mm", 0, 1, 1, 500, 5000, 62, 1, "Open Yard"),
        ("MAT-005", "TMT Steel 12mm", 0, 1, 1, 1000, 10000, 60, 1, "Open Yard"),
        ("MAT-006", "TMT Steel 16mm", 0, 1, 1, 1000, 10000, 58, 1, "Open Yard"),
        ("MAT-007", "TMT Steel 20mm", 0, 1, 1, 500, 5000, 57, 1, "Open Yard"),
        ("MAT-008", "TMT Steel 25mm", 0, 1, 1, 300, 3000, 56, 1, "Open Yard"),
        ("MAT-009", "River Sand", 0, 2, 9, 10, 100, 2500, None, "Open Yard"),
        ("MAT-010", "M-Sand (Manufactured)", 0, 2, 9, 10, 100, 1800, None, "Open Yard"),
        ("MAT-011", "Crushed Stone 20mm", 0, 2, 9, 10, 80, 1600, None, "Open Yard"),
        ("MAT-012", "Crushed Stone 40mm", 0, 2, 9, 10, 80, 1500, None, "Open Yard"),
        ("MAT-013", "Concrete Blocks 6-inch", 0, 3, 3, 500, 5000, 45, None, "Open Yard"),
        ("MAT-014", "Concrete Blocks 4-inch", 0, 3, 3, 500, 5000, 35, None, "Open Yard"),
        ("MAT-015", "Red Bricks", 0, 3, 3, 1000, 8000, 8, None, "Open Yard"),
        ("MAT-016", "AAC Blocks", 0, 3, 3, 200, 2000, 55, None, "Covered"),
        ("MAT-017", "Floor Tiles 2x2", 0, 4, 8, 100, 1000, 48, 7, "Covered"),
        ("MAT-018", "Wall Tiles 1x1", 0, 4, 8, 100, 1000, 32, 7, "Covered"),
        ("MAT-019", "Vitrified Tiles 2x2", 0, 4, 8, 50, 500, 85, 7, "Covered"),
        ("MAT-020", "Ready Mix Concrete M25", 0, None, 9, 5, 50, 5200, 5, "Immediate Use"),
        # Electrical Materials
        ("MAT-021", "Electrical Cable 1.5mm", 1, 5, 5, 20, 200, 1800, 3, "Covered"),
        ("MAT-022", "Electrical Cable 2.5mm", 1, 5, 5, 20, 200, 2800, 3, "Covered"),
        ("MAT-023", "Electrical Cable 4mm", 1, 5, 5, 10, 100, 4200, 3, "Covered"),
        ("MAT-024", "MCB 16A Single Pole", 1, 6, 3, 50, 300, 185, 3, "Covered"),
        ("MAT-025", "MCB 32A Double Pole", 1, 6, 3, 30, 200, 420, 3, "Covered"),
        ("MAT-026", "Distribution Board 8-Way", 1, 6, 3, 10, 50, 1800, 3, "Covered"),
        ("MAT-027", "LED Panel Light 18W", 1, 7, 3, 50, 300, 380, 3, "Covered"),
        ("MAT-028", "LED Tube Light 20W", 1, 7, 3, 50, 300, 220, 3, "Covered"),
        ("MAT-029", "Ceiling Fan 1200mm", 1, None, 3, 20, 100, 1650, 3, "Covered"),
        ("MAT-030", "Switch Board Modular 8M", 1, 6, 3, 30, 200, 280, 3, "Covered"),
        # Plumbing Materials
        ("MAT-031", "PVC Pipe 4-inch", 2, 8, 5, 50, 300, 320, 2, "Covered"),
        ("MAT-032", "PVC Pipe 3-inch", 2, 8, 5, 50, 300, 240, 2, "Covered"),
        ("MAT-033", "PVC Pipe 2-inch", 2, 8, 5, 50, 300, 180, 2, "Covered"),
        ("MAT-034", "CPVC Pipe 1-inch", 2, 8, 5, 30, 200, 420, 2, "Covered"),
        ("MAT-035", "PVC Elbow 4-inch", 2, 9, 3, 50, 300, 45, 2, "Covered"),
        ("MAT-036", "PVC Tee 4-inch", 2, 9, 3, 30, 200, 65, 2, "Covered"),
        ("MAT-037", "Ball Valve 1-inch", 2, 10, 3, 20, 100, 280, 2, "Covered"),
        ("MAT-038", "Water Tank 1000L", 2, None, 3, 3, 20, 7500, 2, "Open Area"),
        # Housekeeping Materials
        ("MAT-039", "Floor Cleaner 5L", 3, 11, 4, 20, 100, 380, 8, "Covered"),
        ("MAT-040", "Glass Cleaner 5L", 3, 11, 4, 10, 50, 420, 8, "Covered"),
        ("MAT-041", "Bleaching Powder 5Kg", 3, 11, 1, 20, 100, 180, 8, "Covered"),
        ("MAT-042", "Phenyl 5L", 3, 11, 4, 20, 100, 220, 8, "Covered"),
        ("MAT-043", "Garbage Bags Large", 3, 12, 6, 20, 100, 280, 8, "Covered"),
        ("MAT-044", "Tissue Paper Roll", 3, 12, 6, 50, 200, 45, 8, "Covered"),
        # Maintenance Materials
        ("MAT-045", "WD-40 Spray 400ml", 4, 14, 3, 10, 50, 380, 9, "Covered"),
        ("MAT-046", "Teflon Tape Roll", 4, None, 10, 30, 200, 35, 9, "Covered"),
        ("MAT-047", "Silicone Sealant 280ml", 4, None, 3, 20, 100, 280, 9, "Covered"),
        # Hardware Materials
        ("MAT-048", "GI Binding Wire", 5, 15, 1, 50, 300, 85, 9, "Covered"),
        ("MAT-049", "Nails 3-inch", 5, 15, 1, 20, 200, 120, 9, "Covered"),
        ("MAT-050", "Safety Helmet", 5, None, 3, 20, 100, 350, 9, "Covered"),
    ]
    materials = []
    for mdata in materials_data:
        code, name, cat_idx, subcat_idx, uom_idx, reorder, max_lvl, cost, vend_idx, storage = mdata
        m = Material(
            code=code, name=name,
            category_id=categories[cat_idx].id,
            subcategory_id=subcats[subcat_idx].id if subcat_idx is not None else None,
            uom_id=uoms[uom_idx].id,
            reorder_level=reorder, maximum_level=max_lvl,
            standard_cost=cost,
            preferred_vendor_id=vendors[vend_idx].id if vend_idx is not None else None,
            storage_type=storage
        )
        db.add(m)
        materials.append(m)
    db.flush()
    print("  ✅ 50 Materials created")

    # ── Purchase Requests ────────────────────────────────────────────────
    pr_data = [
        (0, 500, 0, proj1.id, "Approved", -30),     # Cement
        (4, 2000, 1, proj1.id, "Approved", -28),     # TMT 12mm
        (5, 3000, 2, proj1.id, "Approved", -25),     # TMT 16mm
        (8, 20, None, proj1.id, "Approved", -22),     # River Sand
        (12, 1000, 0, proj1.id, "Converted to PO", -20),  # Concrete blocks
        (16, 200, 1, proj1.id, "Approved", -18),     # Tiles
        (20, 40, 0, proj1.id, "Approved", -15),      # Cable 1.5mm
        (30, 100, None, proj1.id, "Submitted", -10),   # PVC Pipe 4"
        (38, 30, None, proj2.id, "Approved", -12),    # Floor cleaner
        (40, 50, 3, proj2.id, "Submitted", -8),      # Bleaching Powder
        (23, 100, 4, proj2.id, "Draft", -5),          # MCB 16A
        (47, 10, None, proj1.id, "Submitted", -3),    # Silicone Sealant
        (0, 300, 6, proj3.id, "Approved", -20),       # Cement for STP
        (4, 1500, 6, proj3.id, "Approved", -18),      # Steel 12mm for STP
    ]
    prs = []
    for i, (mat_idx, qty, blk_idx, pid, status, days_ago) in enumerate(pr_data):
        pr = PurchaseRequest(
            pr_number=f"PR-202603-{i+1:04d}",
            requester_id=users[4].id,
            required_for_block_id=blocks[blk_idx].id if blk_idx is not None else None,
            project_id=pid,
            required_date=date.today() + timedelta(days=days_ago + 14),
            status=status,
            approved_by_id=users[1].id if status in ("Approved", "Converted to PO") else None,
            approved_at=datetime.utcnow() + timedelta(days=days_ago + 2) if status in ("Approved", "Converted to PO") else None,
            created_at=datetime.utcnow() + timedelta(days=days_ago)
        )
        db.add(pr)
        db.flush()
        
        # Add the single item for this PR
        db.add(PurchaseRequestItem(
            pr_id=pr.id,
            material_id=materials[mat_idx].id,
            quantity=qty
        ))
        
        prs.append(pr)
    db.flush()
    print("  ✅ Purchase Requests created")

    # ── Purchase Orders ──────────────────────────────────────────────────
    po_configs = [
        # (vendor_idx, project, pr_idx, status, items: [(mat_idx, qty, rate)], days_ago)
        (0, proj1.id, 0, "Closed", [(0, 500, 380), (1, 200, 360)], -25),
        (1, proj1.id, 1, "Closed", [(4, 2000, 60), (5, 3000, 58)], -22),
        (0, proj1.id, None, "Partially Received", [(0, 300, 382), (8, 15, 2500)], -15),
        (3, proj1.id, None, "Approved", [(20, 40, 1800), (21, 30, 2800)], -12),
        (7, proj1.id, 5, "Sent to Vendor", [(16, 200, 48), (17, 150, 32)], -10),
        (8, proj2.id, 8, "Closed", [(38, 30, 380), (41, 20, 220)], -10),
        (0, proj3.id, 12, "Closed", [(0, 300, 378)], -15),
        (1, proj3.id, 13, "Partially Received", [(4, 1500, 61)], -12),
    ]
    pos = []
    po_items_all = []
    for i, (vend_idx, pid, pr_idx, status, items, days_ago) in enumerate(po_configs):
        total = sum(q * r for _, q, r in items)
        po = PurchaseOrder(
            po_number=f"PO-202603-{i+1:04d}",
            vendor_id=vendors[vend_idx].id,
            project_id=pid,
            pr_id=prs[pr_idx].id if pr_idx is not None else None,
            total_amount=total,
            delivery_date=date.today() + timedelta(days=days_ago + 20),
            status=status,
            created_by_id=users[1].id,
            approved_by_id=users[0].id if status != "Draft" else None,
            created_at=datetime.utcnow() + timedelta(days=days_ago)
        )
        db.add(po)
        db.flush()

        for mat_idx, qty, rate in items:
            rcv_qty = qty if status == "Closed" else (qty // 2 if status == "Partially Received" else 0)
            poi = PurchaseOrderItem(
                po_id=po.id, material_id=materials[mat_idx].id,
                quantity=qty, rate=rate, amount=qty * rate,
                received_quantity=rcv_qty
            )
            db.add(poi)
            po_items_all.append(poi)
        pos.append(po)
    db.flush()
    print("  ✅ Purchase Orders created")

    # ── GRN and Stock ────────────────────────────────────────────────────
    grn_configs = [
        # (po_idx, wh_idx, project_id, items: [(mat_idx, ordered, received, accepted, rejected, rate)])
        (0, 0, proj1.id, [(0, 500, 500, 490, 10, 380), (1, 200, 200, 200, 0, 360)]),
        (1, 1, proj1.id, [(4, 2000, 2000, 1980, 20, 60), (5, 3000, 3000, 2990, 10, 58)]),
        (2, 0, proj1.id, [(0, 300, 150, 150, 0, 382)]),  # Partial
        (5, 3, proj2.id, [(38, 30, 30, 30, 0, 380), (41, 20, 20, 18, 2, 220)]),
        (6, 5, proj3.id, [(0, 300, 300, 295, 5, 378)]),
        (7, 5, proj3.id, [(4, 1500, 800, 795, 5, 61)]),  # Partial
    ]
    for i, (po_idx, wh_idx, pid, items) in enumerate(grn_configs):
        grn = GRN(
            grn_number=f"GRN-202603-{i+1:04d}",
            po_id=pos[po_idx].id,
            warehouse_id=warehouses[wh_idx].id,
            project_id=pid,
            vendor_id=pos[po_idx].vendor_id,
            invoice_number=f"INV-{random.randint(10000, 99999)}",
            invoice_date=date.today() - timedelta(days=random.randint(5, 25)),
            invoice_amount=sum(acc * rate for _, _, _, acc, _, rate in items),
            status="Completed",
            received_by_id=users[2].id,
            created_at=datetime.utcnow() - timedelta(days=random.randint(5, 25)),
            completed_at=datetime.utcnow() - timedelta(days=random.randint(3, 20))
        )
        db.add(grn)
        db.flush()

        for mat_idx, ordered, received, accepted, rejected, rate in items:
            grn_item = GRNItem(
                grn_id=grn.id, material_id=materials[mat_idx].id,
                ordered_quantity=ordered, received_quantity=received,
                accepted_quantity=accepted, rejected_quantity=rejected,
                rate=rate
            )
            db.add(grn_item)

            # Update current stock
            stock = db.query(CurrentStock).filter(
                CurrentStock.material_id == materials[mat_idx].id,
                CurrentStock.warehouse_id == warehouses[wh_idx].id
            ).first()
            if not stock:
                stock = CurrentStock(
                    material_id=materials[mat_idx].id,
                    warehouse_id=warehouses[wh_idx].id,
                    quantity=0
                )
                db.add(stock)
                db.flush()
            stock.quantity += accepted

            # Stock ledger entry
            db.add(StockLedger(
                material_id=materials[mat_idx].id,
                warehouse_id=warehouses[wh_idx].id,
                transaction_type="GRN",
                quantity=accepted,
                balance=stock.quantity,
                reference_type="GRN",
                reference_id=grn.id,
                reference_number=grn.grn_number,
                project_id=pid,
                created_by_id=users[2].id,
                created_at=grn.created_at
            ))
    db.flush()
    print("  ✅ GRN and initial stock created")

    # ── Material Issues ──────────────────────────────────────────────────
    issue_configs = [
        # (wh_idx, project_id, block_idx, department, items: [(mat_idx, qty, rate)])
        (0, proj1.id, 0, None, [(0, 200, 380), (1, 80, 360)]),   # Cement to Tower A
        (0, proj1.id, 1, None, [(0, 150, 380)]),                  # Cement to Tower B
        (0, proj1.id, 2, None, [(0, 80, 380)]),                   # Cement to Tower C
        (1, proj1.id, 0, None, [(4, 800, 60), (5, 1200, 58)]),   # Steel to Tower A
        (1, proj1.id, 1, None, [(4, 600, 60), (5, 900, 58)]),    # Steel to Tower B
        (1, proj1.id, 2, None, [(4, 400, 60), (5, 600, 58)]),    # Steel to Tower C
        (3, proj2.id, 5, None, [(38, 10, 380), (41, 8, 220)]),   # Cleaner to Hostel
        (3, proj2.id, 3, None, [(38, 8, 380)]),                   # Cleaner to OPD
        (3, proj2.id, 4, None, [(38, 5, 380)]),                   # Cleaner to ICU
        (5, proj3.id, 6, None, [(0, 120, 378)]),                  # Cement to Block Alpha
        (5, proj3.id, 7, None, [(0, 80, 378)]),                   # Cement to Block Beta
        (5, proj3.id, 6, None, [(4, 400, 61)]),                   # Steel to Block Alpha
    ]
    for i, (wh_idx, pid, blk_idx, dept, items) in enumerate(issue_configs):
        issue = MaterialIssue(
            issue_number=f"ISS-202603-{i+1:04d}",
            warehouse_id=warehouses[wh_idx].id,
            project_id=pid,
            issued_to_block_id=blocks[blk_idx].id if blk_idx is not None else None,
            issued_to_department=dept,
            purpose="Construction work",
            issued_by_id=users[2].id,
            received_by_name=f"Supervisor {random.choice(['A', 'B', 'C', 'D'])}",
            status="Issued",
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 20))
        )
        db.add(issue)
        db.flush()

        for mat_idx, qty, rate in items:
            db.add(MaterialIssueItem(
                issue_id=issue.id,
                material_id=materials[mat_idx].id,
                quantity=qty, rate=rate
            ))

            # Update stock
            stock = db.query(CurrentStock).filter(
                CurrentStock.material_id == materials[mat_idx].id,
                CurrentStock.warehouse_id == warehouses[wh_idx].id
            ).first()
            if stock:
                stock.quantity -= qty
                db.add(StockLedger(
                    material_id=materials[mat_idx].id,
                    warehouse_id=warehouses[wh_idx].id,
                    transaction_type="Issue",
                    quantity=-qty,
                    balance=stock.quantity,
                    reference_type="Issue",
                    reference_id=issue.id,
                    reference_number=issue.issue_number,
                    project_id=pid,
                    block_id=blocks[blk_idx].id if blk_idx is not None else None,
                    created_by_id=users[2].id,
                    created_at=issue.created_at
                ))
    db.flush()
    print("  ✅ Material Issues created")

    # ── Returns ──────────────────────────────────────────────────────────
    ret1 = MaterialReturn(
        return_number="RET-202603-0001",
        warehouse_id=warehouses[0].id, project_id=proj1.id,
        returned_from_block_id=blocks[0].id,
        return_type="Unused", remarks="Excess cement returned",
        returned_by_name="Supervisor A", received_by_id=users[2].id,
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(ret1)
    db.flush()
    db.add(MaterialReturnItem(
        return_id=ret1.id, material_id=materials[0].id,
        quantity=20, condition="Good"
    ))
    # Update stock for return
    stock = db.query(CurrentStock).filter(
        CurrentStock.material_id == materials[0].id,
        CurrentStock.warehouse_id == warehouses[0].id
    ).first()
    if stock:
        stock.quantity += 20
        db.add(StockLedger(
            material_id=materials[0].id, warehouse_id=warehouses[0].id,
            transaction_type="Return", quantity=20, balance=stock.quantity,
            reference_type="Return", reference_id=ret1.id,
            reference_number=ret1.return_number, project_id=proj1.id,
            block_id=blocks[0].id, created_by_id=users[2].id
        ))
    db.flush()
    print("  ✅ Returns created")

    # ── Stock Transfers ──────────────────────────────────────────────────
    # Transfer some steel from Civil Yard to Main Store
    trf1 = StockTransfer(
        transfer_number="TRF-202603-0001",
        from_warehouse_id=warehouses[1].id, to_warehouse_id=warehouses[0].id,
        project_id=proj1.id, status="Completed",
        created_by_id=users[2].id, completed_at=datetime.utcnow() - timedelta(days=2),
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(trf1)
    db.flush()
    trf_qty = 100
    db.add(StockTransferItem(
        transfer_id=trf1.id, material_id=materials[4].id, quantity=trf_qty
    ))
    # Transfer Out from Civil Yard
    stock_from = db.query(CurrentStock).filter(
        CurrentStock.material_id == materials[4].id,
        CurrentStock.warehouse_id == warehouses[1].id
    ).first()
    if stock_from:
        stock_from.quantity -= trf_qty
        db.add(StockLedger(
            material_id=materials[4].id, warehouse_id=warehouses[1].id,
            transaction_type="Transfer Out", quantity=-trf_qty, balance=stock_from.quantity,
            reference_type="Transfer", reference_id=trf1.id,
            reference_number=trf1.transfer_number, project_id=proj1.id
        ))
    # Transfer In to Main Store
    stock_to = db.query(CurrentStock).filter(
        CurrentStock.material_id == materials[4].id,
        CurrentStock.warehouse_id == warehouses[0].id
    ).first()
    if not stock_to:
        stock_to = CurrentStock(material_id=materials[4].id, warehouse_id=warehouses[0].id, quantity=0)
        db.add(stock_to)
        db.flush()
    stock_to.quantity += trf_qty
    db.add(StockLedger(
        material_id=materials[4].id, warehouse_id=warehouses[0].id,
        transaction_type="Transfer In", quantity=trf_qty, balance=stock_to.quantity,
        reference_type="Transfer", reference_id=trf1.id,
        reference_number=trf1.transfer_number, project_id=proj1.id
    ))
    db.flush()
    print("  ✅ Stock Transfers created")

    # ── Add stock for remaining materials in various warehouses ───────
    # Give some baseline stock to many materials so inventory looks realistic
    extra_stock_entries = [
        # (mat_idx, wh_idx, qty)
        (12, 1, 800), (13, 1, 600), (14, 1, 2000), (15, 0, 300),
        (16, 0, 150), (17, 0, 100), (18, 0, 40), (19, 1, 8),
        (20, 2, 30), (21, 2, 25), (22, 2, 8), (23, 2, 80),
        (24, 2, 40), (25, 2, 8), (26, 2, 60), (27, 2, 50),
        (28, 2, 15), (29, 2, 25),
        (30, 0, 80), (31, 0, 60), (32, 0, 40), (33, 0, 20),
        (34, 0, 80), (35, 0, 40), (36, 0, 15), (37, 0, 5),
        (38, 3, 12), (39, 3, 8), (40, 3, 15), (41, 3, 10),
        (42, 3, 15), (43, 3, 40),
        (44, 0, 8), (45, 0, 25), (46, 0, 15),
        (47, 0, 40), (48, 0, 15), (49, 0, 18),
    ]
    for mat_idx, wh_idx, qty in extra_stock_entries:
        existing = db.query(CurrentStock).filter(
            CurrentStock.material_id == materials[mat_idx].id,
            CurrentStock.warehouse_id == warehouses[wh_idx].id
        ).first()
        if not existing:
            cs = CurrentStock(
                material_id=materials[mat_idx].id,
                warehouse_id=warehouses[wh_idx].id,
                quantity=qty
            )
            db.add(cs)
            db.flush()
            db.add(StockLedger(
                material_id=materials[mat_idx].id,
                warehouse_id=warehouses[wh_idx].id,
                transaction_type="GRN", quantity=qty, balance=qty,
                reference_type="GRN", reference_number="Initial Stock",
                project_id=warehouses[wh_idx].project_id,
                created_by_id=users[2].id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 30))
            ))
    db.flush()
    print("  ✅ Additional stock entries created")

    # ── Alerts ───────────────────────────────────────────────────────────
    # Generate low stock alerts
    low_stock_items = db.query(CurrentStock).join(Material).filter(
        CurrentStock.quantity < Material.reorder_level,
        CurrentStock.quantity > 0
    ).all()
    for cs in low_stock_items[:5]:
        alert = Alert(
            alert_type="Low Stock", severity="Warning",
            title=f"Low stock: {cs.material.name}",
            message=f"{cs.material.name} in {cs.warehouse.name} is at {cs.quantity} {cs.material.uom.abbreviation}. Reorder level: {cs.material.reorder_level}",
            reference_type="Material", reference_id=cs.material_id,
            project_id=cs.warehouse.project_id
        )
        db.add(alert)

    # Pending PR alerts
    pending = db.query(PurchaseRequest).filter(PurchaseRequest.status == "Submitted").all()
    for pr in pending:
        # Get first item for the alert message
        first_item = pr.items[0] if pr.items else None
        mat_name = first_item.material.name if first_item else "Unknown"
        qty_val = first_item.quantity if first_item else 0
        
        db.add(Alert(
            alert_type="Pending PR Approval", severity="Info",
            title=f"PR {pr.pr_number} pending approval",
            message=f"{mat_name} - {qty_val} units requested by {pr.requester.full_name}",
            reference_type="PurchaseRequest", reference_id=pr.id,
            project_id=pr.project_id
        ))

    # Delayed PO alert
    db.add(Alert(
        alert_type="Delayed PO Delivery", severity="Critical",
        title="PO-202603-0005 delivery overdue",
        message="Tiles delivery from Johnson Tiles Agency is overdue by 3 days",
        reference_type="PurchaseOrder", reference_id=pos[4].id,
        project_id=proj1.id
    ))

    db.flush()
    print("  ✅ Alerts created")

    # ── Gate Entries ─────────────────────────────────────────────────────
    gate_entries = [
        ("GE-20260401-0001", "MH12AB1234", vendors[0].id, pos[0].id, proj1.id, materials[0].id, 500, "Ramesh Driver"),
        ("GE-20260402-0002", "MH14CD5678", vendors[1].id, pos[1].id, proj1.id, materials[4].id, 2000, "Sunil Transport"),
        ("GE-20260405-0003", "KA01EF9012", vendors[0].id, pos[2].id, proj1.id, materials[0].id, 150, "Deepak Logistics"),
    ]
    for entry_num, veh, vid, poid, pid, mid, qty, driver in gate_entries:
        db.add(GateEntry(
            entry_number=entry_num, vehicle_number=veh,
            vendor_id=vid, po_id=poid, project_id=pid,
            material_id=mid, quantity=qty,
            driver_name=driver, recorded_by_id=users[3].id,
            status="Completed",
            created_at=datetime.utcnow() - timedelta(days=random.randint(5, 25))
        ))
    db.flush()
    print("  ✅ Gate Entries created")

    db.commit()
    print("🎉 Database seeding complete!")
