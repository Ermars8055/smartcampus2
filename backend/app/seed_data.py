"""Seed data for multi-tenant NissiGrid Smart Campus."""
from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session
from app.models import *
from app.auth import get_password_hash

def seed_database(db: Session):
    if db.query(User).count() > 0:
        print("Database already has users. Skipping seed.")
        return

    print("Seeding NissiGrid Smart Campus Data...")

    # 1. Tenants & Sites
    t1 = Tenant(name="NissiGrid Infrastructure", slug="nissigrid", subscription_plan="enterprise", max_sites=10)
    t2 = Tenant(name="Global Builders Group", slug="global-builders", subscription_plan="multi_site", max_sites=5)
    db.add_all([t1, t2])
    db.flush()

    s1 = Site(tenant_id=t1.id, name="Bangalore North", code="BNR", location="Hebbal, Bangalore")
    s2 = Site(tenant_id=t1.id, name="Bangalore East", code="BST", location="Whitefield, Bangalore")
    s3 = Site(tenant_id=t2.id, name="Mumbai West", code="MBW", location="Andheri, Mumbai")
    db.add_all([s1, s2, s3])
    db.flush()

    # 2. Users
    pw = get_password_hash("admin123")
    superadmin = User(username="superadmin", email="super@nissigrid.com", full_name="Super Admin", hashed_password=pw, is_platform_admin=True)
    admin1 = User(username="admin", email="admin@nissigrid.com", full_name="Vikram Singh", hashed_password=pw)
    pm1 = User(username="purchase_mgr", email="pm@nissigrid.com", full_name="Rajesh Kumar", hashed_password=pw)
    sk1 = User(username="storekeeper", email="sk@nissigrid.com", full_name="Anita Sharma", hashed_password=pw)
    eng1 = User(username="engineer", email="eng@nissigrid.com", full_name="Priya Patel", hashed_password=pw)
    
    db.add_all([superadmin, admin1, pm1, sk1, eng1])
    db.flush()

    # Assignments
    db.add(TenantMembership(user_id=admin1.id, tenant_id=t1.id))
    db.add(TenantMembership(user_id=pm1.id, tenant_id=t1.id))
    db.add(TenantMembership(user_id=sk1.id, tenant_id=t1.id))
    db.add(TenantMembership(user_id=eng1.id, tenant_id=t1.id))
    db.flush()

    # Roles for Tenant 1
    r_admin = Role(tenant_id=t1.id, name="Admin", code="ADMIN", description="Full Access", is_system=True)
    r_pm = Role(tenant_id=t1.id, name="Purchase Manager", code="PURCHASE_MGR", description="Procurement")
    r_sk = Role(tenant_id=t1.id, name="Store Keeper", code="STORE_KEEPER", description="Store Operations")
    db.add_all([r_admin, r_pm, r_sk]); db.flush()

    RESOURCES = ["dashboard", "materials", "categories", "vendors", "organizations", "projects", "warehouses", 
                 "purchase_requests", "purchase_orders", "gate_entry", "grn", "issues", "returns", 
                 "transfers", "inventory", "intelligence", "reports", "admin_users", "admin_roles", "alerts", "quotations", "indents"]
    for res in RESOURCES:
        db.add(RolePermission(role_id=r_admin.id, resource=res, can_read=True, can_create=True, can_update=True, can_delete=True))
    db.flush()

    db.add(UserRoleAssignment(user_id=admin1.id, tenant_id=t1.id, role_id=r_admin.id))
    db.add(UserRoleAssignment(user_id=pm1.id, tenant_id=t1.id, role_id=r_pm.id, site_id=s1.id))
    db.add(UserRoleAssignment(user_id=sk1.id, tenant_id=t1.id, role_id=r_sk.id, site_id=s1.id))
    db.flush()

    # 4. Multi-Site Data Seeding
    for site in [s1, s2]:
        T, S = t1.id, site.id
        
        # Org
        org = Organization(tenant_id=T, site_id=S, name=f"NissiGrid - {site.name}", code=f"NIPL-{site.code}")
        db.add(org); db.flush()
        
        # Project
        proj = Project(tenant_id=T, site_id=S, organization_id=org.id, name=f"Campus Development - {site.code}", code=f"CD-{site.code}")
        db.add(proj); db.flush()
        
        # Warehouse
        wh = Warehouse(tenant_id=T, site_id=S, project_id=proj.id, name=f"Main Warehouse - {site.code}", code=f"WH-{site.code}", warehouse_type="Central")
        db.add(wh); db.flush()
        
        # Masters
        cat = Category(tenant_id=T, site_id=S, name="Civil")
        db.add(cat); db.flush()
        sc = SubCategory(tenant_id=T, site_id=S, category_id=cat.id, name="Cement")
        db.add(sc); db.flush()
        uom = UOM(tenant_id=T, site_id=S, name="Bags", abbreviation="BGS")
        db.add(uom); db.flush()
        
        # v1 = Vendor(tenant_id=T, site_id=S, name=f"UltraTech - {site.code}", code=f"VND-{site.code}-1")
        # v2 = Vendor(tenant_id=T, site_id=S, name=f"Tata Steel - {site.code}", code=f"VND-{site.code}-2")
        # db.add_all([v1, v2]); db.flush()
        
        m1 = Material(tenant_id=T, site_id=S, category_id=cat.id, subcategory_id=sc.id, uom_id=uom.id, name="OPC 53 Grade Cement", code="MAT-CEM-01", standard_cost=450)
        m2 = Material(tenant_id=T, site_id=S, category_id=cat.id, uom_id=uom.id, name="Binding Wire", code="MAT-WIR-01", standard_cost=80)
        db.add_all([m1, m2]); db.flush()
        
        # Stock
        db.add(CurrentStock(tenant_id=T, site_id=S, material_id=m1.id, warehouse_id=wh.id, quantity=1000))
        db.flush()
        
        # PR
        pr = PurchaseRequest(tenant_id=T, site_id=S, pr_number=f"PR-{site.code}-001", requester_id=eng1.id, project_id=proj.id, required_date=date.today()+timedelta(days=7), status="Approved")
        db.add(pr); db.flush()
        db.add(PurchaseRequestItem(pr_id=pr.id, material_id=m1.id, quantity=100))
        db.flush()
        
        # Quotation Flow
        # qr = QuotationRequest(tenant_id=T, site_id=S, qr_number=f"QR-{site.code}-001", project_id=proj.id, created_by_id=pm1.id, status="Received")
        # db.add(qr); db.flush()
        # qri = QuotationRequestItem(qr_id=qr.id, material_id=m1.id, quantity=100)
        # db.add(qri); db.flush()
        # db.add(QuotationRequestVendor(qr_id=qr.id, vendor_id=v1.id, is_sent=True, receipt_status="Received"))
        # db.add(QuotationRequestVendor(qr_id=qr.id, vendor_id=v2.id, is_sent=True, receipt_status="Pending"))
        # db.flush()
        
        # Vendor Quotation
        # vq = VendorQuotation(qr_id=qr.id, vendor_id=v1.id, quotation_number=f"Q-{site.code}-101", entered_by_id=pm1.id)
        # db.add(vq); db.flush()
        # db.add(VendorQuotationItem(vendor_quotation_id=vq.id, qr_item_id=qri.id, material_id=m1.id, quoted_rate=440))
        # db.flush()
        
        # PO
        # po = PurchaseOrder(tenant_id=T, site_id=S, po_number=f"PO-{site.code}-001", vendor_id=v1.id, project_id=proj.id, pr_id=pr.id, status="Approved", created_by_id=pm1.id)
        # db.add(po); db.flush()
        # db.add(PurchaseOrderItem(po_id=po.id, material_id=m1.id, quantity=100, rate=440, amount=44000))
        # db.flush()

    db.commit()
    print("Seeding Complete!")

if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    seed_database(db)
    db.close()
