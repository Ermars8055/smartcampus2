import os
import sys
from datetime import datetime

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import MenuItem

REPORTS_ITEMS = [
    {"id": 66, "text": "Stock Report", "path": "/reports/stock", "resource": "reports", "order": 1},
    {"id": 67, "text": "Consumption Report", "path": "/reports/consumption", "resource": "reports", "order": 2},
    {"id": 70, "text": "Material Movement", "path": "/reports/movement", "resource": "reports", "order": 3},
    {"id": 42, "text": "Issue Summary", "path": "/reports/issue-summary", "resource": "report_issue_summary", "order": 4},
    {"id": 45, "text": "Receipt Summary", "path": "/reports/receipt-summary", "resource": "report_receipt_summary", "order": 5},
    {"id": 71, "text": "Return Summary", "path": "/reports/return-summary", "resource": "reports", "order": 6},
    {"id": 46, "text": "Department Inventory", "path": "/reports/department-inventory", "resource": "report_dept_inventory", "order": 7},
    {"id": 43, "text": "Rate Analysis", "path": "/reports/rate-analysis", "resource": "report_rate_analysis", "order": 8},
    {"id": 68, "text": "PR Status", "path": "/reports/pr-status", "resource": "reports", "order": 9},
    {"id": 69, "text": "PO Status", "path": "/reports/po-status", "resource": "reports", "order": 10},
    {"id": 48, "text": "Pending Gatepass Returns", "path": "/reports/pending-gatepass-returns", "resource": "report_pending_gatepass", "order": 11},
    {"id": 44, "text": "Equipment Count", "path": "/reports/equipment-count", "resource": "report_equipment_count", "order": 12},
    {"id": 47, "text": "Department Equipment", "path": "/reports/department-equipment", "resource": "report_dept_inventory", "order": 13},
    {"id": 63, "text": "Dept. Equip Details", "path": "/reports/department-equipment-details", "resource": "reports", "order": 14},
    {"id": 64, "text": "Calibration Details", "path": "/reports/calibration-details", "resource": "reports", "order": 15},
    {"id": 72, "text": "Equipment Write-off", "path": "/reports/equipment-writeoff", "resource": "reports", "order": 16},
    {"id": 49, "text": "Complaint Status", "path": "/reports/complaint-status", "resource": "reports", "order": 17},
    {"text": "Engineer Evaluation", "path": "/reports/engineer-evaluation", "resource": "reports", "order": 18},
]

def sync_reports_menu():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        reports_parent = db.query(MenuItem).filter(MenuItem.id == 40).first()
        if not reports_parent:
            # Fallback search by text if id is different
            reports_parent = db.query(MenuItem).filter(MenuItem.text == "Reports", MenuItem.parent_id == None).first()
            if not reports_parent:
                print("Error: Reports parent menu item not found.")
                return

        parent_id = reports_parent.id
        print(f"Syncing sub-modules under parent menu: {reports_parent.text} (ID: {parent_id})")

        # 1. Delete legacy 'General Reports' (/reports)
        deleted_count = db.query(MenuItem).filter(
            MenuItem.parent_id == parent_id,
            (MenuItem.path == "/reports") | (MenuItem.text == "General Reports")
        ).delete(synchronize_session=False)
        print(f"Removed {deleted_count} legacy 'General Reports' item(s).")

        # 2. Upsert each report item
        for item in REPORTS_ITEMS:
            existing = db.query(MenuItem).filter(
                (MenuItem.parent_id == parent_id) & (MenuItem.path == item["path"])
            ).first()

            if not existing and "id" in item:
                # Also check by primary key if available
                existing = db.query(MenuItem).filter(MenuItem.id == item["id"]).first()

            if existing:
                existing.text = item["text"]
                existing.path = item["path"]
                existing.resource = item["resource"]
                existing.parent_id = parent_id
                existing.order = item["order"]
                existing.is_active = True
                existing.basic_actions = ["read"]
                existing.extended_actions = []
                existing.updated_at = now
                print(f"Updated: {item['text']} ({item['path']}) -> order {item['order']}")
            else:
                new_item = MenuItem(
                    id=item.get("id"),
                    text=item["text"],
                    icon_name=None,
                    path=item["path"],
                    resource=item["resource"],
                    platform_only=False,
                    parent_id=parent_id,
                    order=item["order"],
                    is_active=True,
                    basic_actions=["read"],
                    extended_actions=[],
                    created_at=now,
                    updated_at=now,
                )
                db.add(new_item)
                print(f"Inserted: {item['text']} ({item['path']}) -> order {item['order']}")

        db.commit()

        from sqlalchemy import text
        db.execute(text("SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));"))
        db.commit()

        print("\nReports menu successfully synchronized!")
        
        # Verify result
        active_children = db.query(MenuItem).filter(
            MenuItem.parent_id == parent_id,
            MenuItem.is_active == True
        ).order_by(MenuItem.order).all()
        print(f"\nTotal active reports sub-modules under 'Reports': {len(active_children)}")
        for c in active_children:
            print(f" [{c.order}] {c.text} -> {c.path} (resource: {c.resource})")

    except Exception as e:
        db.rollback()
        print(f"Error during menu sync: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    sync_reports_menu()
