from app.database import SessionLocal
from app.models import MenuItem

db = SessionLocal()

# Find Reports Parent
reports_parent = db.query(MenuItem).filter(MenuItem.text == "Reports", MenuItem.parent_id == None).first()
if reports_parent:
    print(f"Found Reports parent: {reports_parent.id}")
    
    # Delete General Reports
    general_reports = db.query(MenuItem).filter(MenuItem.text == "General Reports", MenuItem.parent_id == reports_parent.id).first()
    if general_reports:
        print(f"Deleting General Reports: {general_reports.id}")
        db.delete(general_reports)
    
    # Check what order we should start at
    existing_children = db.query(MenuItem).filter(MenuItem.parent_id == reports_parent.id).all()
    max_order = max([c.order for c in existing_children]) if existing_children else 0
    
    new_reports = [
        {"text": "Stock Report", "path": "/reports/stock"},
        {"text": "Consumption Report", "path": "/reports/consumption"},
        {"text": "PR Status", "path": "/reports/pr-status"},
        {"text": "PO Status", "path": "/reports/po-status"},
        {"text": "Material Movement", "path": "/reports/movement"},
        {"text": "Return Summary", "path": "/reports/return-summary"},
        {"text": "Equipment Write-off", "path": "/reports/equipment-writeoff"},
    ]
    
    order = max_order + 1
    for report in new_reports:
        # Check if it already exists
        exists = db.query(MenuItem).filter(MenuItem.text == report["text"], MenuItem.parent_id == reports_parent.id).first()
        if not exists:
            new_item = MenuItem(
                text=report["text"],
                path=report["path"],
                resource="reports",
                parent_id=reports_parent.id,
                order=order,
                is_active=True
            )
            db.add(new_item)
            print(f"Added {report['text']}")
            order += 1
    
    db.commit()
    print("Database update complete.")
else:
    print("Could not find Reports parent.")

db.close()
