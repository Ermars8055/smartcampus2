"""Seed data for multi-tenant NissiGrid Smart Stores."""
from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session
from app.models import *
from app.auth import get_password_hash

def seed_database(db: Session):
    if db.query(User).count() > 0:
        print("Already seeded."); return

    print("Seeding...")

    # Tenants
    t1 = Tenant(name="ABC Infrastructure Pvt Ltd", slug="abc-infra", subscription_plan="multi_site", max_sites=5)
    t2 = Tenant(name="City Medical Campus Trust", slug="cmc-trust", subscription_plan="basic", max_sites=1)
    db.add_all([t1, t2]); db.flush()

    # Sites
    s1 = Site(tenant_id=t1.id, name="Mumbai HQ", code="MUM", location="Mumbai, Maharashtra")
    s2 = Site(tenant_id=t1.id, name="Pune Site", code="PUN", location="Pune, Maharashtra")
    s3 = Site(tenant_id=t2.id, name="CMC Campus", code="CMC", location="Bangalore, Karnataka")
    db.add_all([s1, s2, s3]); db.flush()

    # Users
    superadmin = User(username="superadmin", email="super@nissigrid.com", full_name="NissiGrid Super Admin", hashed_password=get_password_hash("admin123"), is_platform_admin=True)
    admin1 = User(username="admin", email="admin@abcinfra.com", full_name="Vikram Singh", hashed_password=get_password_hash("admin123"))
    pm1 = User(username="purchase_mgr", email="purchase@abcinfra.com", full_name="Rajesh Kumar", hashed_password=get_password_hash("pass123"))
    sk1 = User(username="storekeeper", email="store@abcinfra.com", full_name="Anita Sharma", hashed_password=get_password_hash("pass123"))
    sec1 = User(username="security", email="security@abcinfra.com", full_name="Mohan Das", hashed_password=get_password_hash("pass123"))
    eng1 = User(username="engineer1", email="engineer1@abcinfra.com", full_name="Priya Patel", hashed_password=get_password_hash("pass123"))
    cmc_admin = User(username="cmc_admin", email="admin@cmc.org", full_name="Lakshmi R", hashed_password=get_password_hash("admin123"))
    db.add_all([superadmin, admin1, pm1, sk1, sec1, eng1, cmc_admin]); db.flush()
    users = [superadmin, admin1, pm1, sk1, sec1, eng1, cmc_admin]

    # Memberships
    for u in [admin1, pm1, sk1, sec1, eng1]:
        db.add(TenantMembership(user_id=u.id, tenant_id=t1.id))
    db.add(TenantMembership(user_id=cmc_admin.id, tenant_id=t2.id))
    db.flush()

    # Roles for tenant 1
    RESOURCES = ["dashboard","materials","categories","vendors","organizations","projects","warehouses","purchase_requests","purchase_orders","gate_entry","grn","issues","returns","transfers","inventory","intelligence","reports","admin_users","admin_roles","alerts"]
    r_admin = Role(tenant_id=t1.id, name="Admin", code="ADMIN", description="Full access", is_system=True)
    r_pm = Role(tenant_id=t1.id, name="Purchase Manager", code="PURCHASE_MGR", description="Procurement")
    r_sk = Role(tenant_id=t1.id, name="Store Keeper", code="STORE_KEEPER", description="Store ops")
    r_eng = Role(tenant_id=t1.id, name="Engineer", code="ENGINEER", description="Requestor")
    db.add_all([r_admin, r_pm, r_sk, r_eng]); db.flush()

    for res in RESOURCES:
        db.add(RolePermission(role_id=r_admin.id, resource=res, can_read=True, can_create=True, can_update=True, can_delete=True))
    for res in ["dashboard","materials","categories","vendors","purchase_requests","purchase_orders","inventory","reports","alerts"]:
        db.add(RolePermission(role_id=r_pm.id, resource=res, can_read=True, can_create=True, can_update=True, can_delete=False))
    for res in ["dashboard","gate_entry","grn","issues","returns","transfers","inventory","materials","reports","alerts"]:
        db.add(RolePermission(role_id=r_sk.id, resource=res, can_read=True, can_create=True, can_update=True, can_delete=False))
    for res in ["dashboard","purchase_requests","materials","inventory"]:
        db.add(RolePermission(role_id=r_eng.id, resource=res, can_read=True, can_create=res=="purchase_requests", can_update=False, can_delete=False))
    db.flush()

    # Roles for tenant 2
    r_cmc_admin = Role(tenant_id=t2.id, name="Admin", code="ADMIN", description="Full access", is_system=True)
    db.add(r_cmc_admin); db.flush()
    for res in RESOURCES:
        db.add(RolePermission(role_id=r_cmc_admin.id, resource=res, can_read=True, can_create=True, can_update=True, can_delete=True))
    db.flush()

    # Role assignments
    db.add(UserRoleAssignment(user_id=admin1.id, tenant_id=t1.id, role_id=r_admin.id))
    db.add(UserRoleAssignment(user_id=pm1.id, tenant_id=t1.id, role_id=r_pm.id, site_id=s1.id))
    db.add(UserRoleAssignment(user_id=sk1.id, tenant_id=t1.id, role_id=r_sk.id, site_id=s1.id))
    db.add(UserRoleAssignment(user_id=sec1.id, tenant_id=t1.id, role_id=r_eng.id, site_id=s1.id))
    db.add(UserRoleAssignment(user_id=eng1.id, tenant_id=t1.id, role_id=r_eng.id, site_id=s1.id))
    db.add(UserRoleAssignment(user_id=cmc_admin.id, tenant_id=t2.id, role_id=r_cmc_admin.id))
    db.flush()

    # == TENANT 1 SITE 1 DATA ==
    T, S = t1.id, s1.id

    org1 = Organization(tenant_id=T, site_id=S, name="ABC Infrastructure Pvt Ltd", code="ABC-INFRA", address="123 Construction Lane, Mumbai", phone="022-12345678", email="info@abcinfra.com")
    db.add(org1); db.flush()

    proj1 = Project(tenant_id=T, site_id=S, name="Green Valley Residency", code="GVR-001", organization_id=org1.id, location="Pune", start_date=date(2025,1,15), end_date=date(2027,6,30), status="Active", budget=50_00_00_000)
    db.add(proj1); db.flush()

    blocks_data = [("Tower A","GVR-TA","Tower",14),("Tower B","GVR-TB","Tower",14),("Tower C","GVR-TC","Tower",10)]
    blocks = []
    for nm, cd, bt, fl in blocks_data:
        b = Block(tenant_id=T, site_id=S, name=nm, code=cd, project_id=proj1.id, block_type=bt, floors=fl)
        db.add(b); blocks.append(b)
    db.flush()

    wh_data = [("Main Store","WH-GVR-MAIN","Main"),("Civil Yard","WH-GVR-CIVIL","Civil"),("Electrical Store","WH-GVR-ELEC","Electrical")]
    warehouses = []
    for nm, cd, wt in wh_data:
        w = Warehouse(tenant_id=T, site_id=S, name=nm, code=cd, project_id=proj1.id, warehouse_type=wt)
        db.add(w); warehouses.append(w)
    db.flush()

    # Categories
    cat_data = [("Civil","Civil construction materials"),("Electrical","Electrical materials"),("Plumbing","Plumbing supplies"),("Hardware","Hardware items")]
    categories = []
    for nm, desc in cat_data:
        c = Category(tenant_id=T, site_id=S, name=nm, description=desc)
        db.add(c); categories.append(c)
    db.flush()

    subcat_data = [(0,"Cement"),(0,"Steel"),(0,"Aggregates"),(1,"Wiring"),(1,"Switchgear"),(2,"Pipes"),(2,"Fittings"),(3,"Fasteners")]
    subcats = []
    for ci, nm in subcat_data:
        sc = SubCategory(tenant_id=T, site_id=S, name=nm, category_id=categories[ci].id)
        db.add(sc); subcats.append(sc)
    db.flush()

    uom_data = [("Bag","Bag"),("Kilogram","Kg"),("Ton","Ton"),("Piece","Pcs"),("Litre","Ltr"),("Meter","Mtr"),("Box","Box"),("Bundle","Bdl"),("Sqft","Sqft"),("Cubic Meter","Cum")]
    uoms = []
    for nm, ab in uom_data:
        u = UOM(tenant_id=T, site_id=S, name=nm, abbreviation=ab)
        db.add(u); uoms.append(u)
    db.flush()

    # Vendors
    vnd_data = [("UltraTech Cement Dealers","VND-001"),("Tata Steel Distributors","VND-002"),("Supreme Pipes India","VND-003"),("Havells Electrical Supply","VND-004"),("Bosch Hardware Tools","VND-005")]
    vendors = []
    for nm, cd in vnd_data:
        v = Vendor(tenant_id=T, site_id=S, name=nm, code=cd, rating=round(random.uniform(3.5,5.0),1))
        db.add(v); vendors.append(v)
    db.flush()

    # Materials (20 key items)
    mat_data = [
        ("MAT-001","Cement OPC 53 Grade",0,0,0,100,500,380,0),
        ("MAT-002","TMT Steel 12mm",0,1,1,500,5000,60,1),
        ("MAT-003","TMT Steel 16mm",0,1,1,1000,10000,58,1),
        ("MAT-004","River Sand",0,2,9,10,100,2500,None),
        ("MAT-005","Crushed Stone 20mm",0,2,9,10,80,1600,None),
        ("MAT-006","Concrete Blocks 6-inch",0,None,3,500,5000,45,None),
        ("MAT-007","Floor Tiles 2x2",0,None,8,100,1000,48,None),
        ("MAT-008","Electrical Cable 2.5mm",1,3,5,20,200,2800,3),
        ("MAT-009","MCB 16A Single Pole",1,4,3,50,300,185,3),
        ("MAT-010","LED Panel Light 18W",1,None,3,50,300,380,3),
        ("MAT-011","PVC Pipe 4-inch",2,5,5,50,300,320,2),
        ("MAT-012","PVC Elbow 4-inch",2,6,3,50,300,45,2),
        ("MAT-013","Ball Valve 1-inch",2,None,3,20,100,280,2),
        ("MAT-014","GI Binding Wire",3,7,1,50,300,85,4),
        ("MAT-015","Nails 3-inch",3,7,1,20,200,120,4),
        ("MAT-016","Safety Helmet",3,None,3,20,100,350,4),
        ("MAT-017","Cement PPC Grade",0,0,0,80,400,360,0),
        ("MAT-018","TMT Steel 8mm",0,1,1,500,5000,65,1),
        ("MAT-019","Ceiling Fan 1200mm",1,None,3,20,100,1650,3),
        ("MAT-020","Silicone Sealant 280ml",3,None,3,20,100,280,4),
    ]
    materials = []
    for code, name, ci, sci, ui, reorder, maxl, cost, vi in mat_data:
        m = Material(tenant_id=T, site_id=S, code=code, name=name, category_id=categories[ci].id,
                     subcategory_id=subcats[sci].id if sci is not None else None, uom_id=uoms[ui].id,
                     reorder_level=reorder, maximum_level=maxl, standard_cost=cost,
                     preferred_vendor_id=vendors[vi].id if vi is not None else None)
        db.add(m); materials.append(m)
    db.flush()

    # Stock
    stock_entries = [(0,0,200),(1,1,1500),(2,1,2500),(3,1,15),(4,1,12),(5,1,800),(6,0,150),(7,2,25),(8,2,80),(9,2,60),(10,0,80),(11,0,80),(12,0,15),(13,0,40),(14,0,15),(15,0,18),(16,0,100),(17,1,800),(18,2,15),(19,0,15)]
    for mi, wi, qty in stock_entries:
        cs = CurrentStock(tenant_id=T, site_id=S, material_id=materials[mi].id, warehouse_id=warehouses[wi].id, quantity=qty)
        db.add(cs)
        db.flush()
        db.add(StockLedger(tenant_id=T, site_id=S, material_id=materials[mi].id, warehouse_id=warehouses[wi].id,
                           transaction_type="GRN", quantity=qty, balance=qty, reference_type="GRN",
                           reference_number="Initial Stock", project_id=proj1.id, created_by_id=sk1.id,
                           created_at=datetime.utcnow()-timedelta(days=random.randint(10,30))))
    db.flush()

    # PRs
    pr1 = PurchaseRequest(tenant_id=T, site_id=S, pr_number="PR-2026-0001", requester_id=eng1.id, project_id=proj1.id, required_date=date.today()+timedelta(days=14), status="Approved", approved_by_id=pm1.id, approved_at=datetime.utcnow()-timedelta(days=5))
    pr2 = PurchaseRequest(tenant_id=T, site_id=S, pr_number="PR-2026-0002", requester_id=eng1.id, project_id=proj1.id, required_date=date.today()+timedelta(days=7), status="Submitted")
    db.add_all([pr1, pr2]); db.flush()
    db.add(PurchaseRequestItem(pr_id=pr1.id, material_id=materials[0].id, quantity=500))
    db.add(PurchaseRequestItem(pr_id=pr2.id, material_id=materials[1].id, quantity=2000))
    db.flush()

    # PO
    po1 = PurchaseOrder(tenant_id=T, site_id=S, po_number="PO-2026-0001", vendor_id=vendors[0].id, project_id=proj1.id, pr_id=pr1.id, total_amount=190000, delivery_date=date.today()+timedelta(days=10), status="Closed", created_by_id=pm1.id, approved_by_id=admin1.id)
    po2 = PurchaseOrder(tenant_id=T, site_id=S, po_number="PO-2026-0002", vendor_id=vendors[1].id, project_id=proj1.id, total_amount=120000, delivery_date=date.today()+timedelta(days=5), status="Approved", created_by_id=pm1.id, approved_by_id=admin1.id)
    db.add_all([po1, po2]); db.flush()
    db.add(PurchaseOrderItem(po_id=po1.id, material_id=materials[0].id, quantity=500, rate=380, amount=190000, received_quantity=500))
    db.add(PurchaseOrderItem(po_id=po2.id, material_id=materials[1].id, quantity=2000, rate=60, amount=120000))
    db.flush()

    # GRN for PO1
    grn1 = GRN(tenant_id=T, site_id=S, grn_number="GRN-2026-0001", po_id=po1.id, vendor_id=vendors[0].id, project_id=proj1.id, warehouse_id=warehouses[0].id, received_by_id=sk1.id, status="Completed")
    db.add(grn1); db.flush()
    db.add(GRNItem(grn_id=grn1.id, material_id=materials[0].id, received_quantity=500, accepted_quantity=500, rate=380))
    db.flush()

    # Material Issues (Consumptions) - THIS POPULATES THE GRAPHS
    # Issue Cement to Tower A
    iss1 = MaterialIssue(tenant_id=T, site_id=S, issue_number="ISS-202604-0001", warehouse_id=warehouses[0].id, project_id=proj1.id, issued_to_block_id=blocks[0].id, issued_by_id=sk1.id, received_by_name="Contractor A", status="Completed", created_at=datetime.utcnow()-timedelta(days=2))
    db.add(iss1); db.flush()
    db.add(MaterialIssueItem(issue_id=iss1.id, material_id=materials[0].id, quantity=50, rate=380))
    
    # Issue Steel to Tower B
    iss2 = MaterialIssue(tenant_id=T, site_id=S, issue_number="ISS-202604-0002", warehouse_id=warehouses[1].id, project_id=proj1.id, issued_to_block_id=blocks[1].id, issued_by_id=sk1.id, received_by_name="Contractor B", status="Completed", created_at=datetime.utcnow()-timedelta(days=1))
    db.add(iss2); db.flush()
    db.add(MaterialIssueItem(issue_id=iss2.id, material_id=materials[1].id, quantity=300, rate=60))

    # Issue Electrical Cable to Tower C
    iss3 = MaterialIssue(tenant_id=T, site_id=S, issue_number="ISS-202604-0003", warehouse_id=warehouses[2].id, project_id=proj1.id, issued_to_block_id=blocks[2].id, issued_by_id=sk1.id, received_by_name="Electrician Team", status="Completed", created_at=datetime.utcnow())
    db.add(iss3); db.flush()
    db.add(MaterialIssueItem(issue_id=iss3.id, material_id=materials[7].id, quantity=10, rate=2800))
    db.flush()

    # Alerts
    for cs_obj in db.query(CurrentStock).join(Material).filter(CurrentStock.tenant_id==T, CurrentStock.quantity < Material.reorder_level, CurrentStock.quantity > 0).limit(3).all():
        db.add(Alert(tenant_id=T, site_id=S, alert_type="Low Stock", severity="Warning", title=f"Low stock: {cs_obj.material.name}", message=f"Current: {cs_obj.quantity}, Reorder: {cs_obj.material.reorder_level}", reference_type="Material", reference_id=cs_obj.material_id, project_id=proj1.id))
    db.flush()

    db.commit()
    print("Seeding complete!")
