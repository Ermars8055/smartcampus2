import os
import sys

# Add the backend path so we can import app modules
sys.path.append('/home/ngadmin/smartcampus2/backend')

from app.database import SessionLocal
from app.models import MenuItem

def add_menu_item():
    db = SessionLocal()
    reports_menu = db.query(MenuItem).filter(MenuItem.text == 'Reports').first()
    if reports_menu:
        cal_menu = db.query(MenuItem).filter(MenuItem.text == 'Calibration Details').first()
        if not cal_menu:
            children = db.query(MenuItem).filter(MenuItem.parent_id == reports_menu.id).all()
            max_order = max([c.order for c in children] + [0])
            cal_menu = MenuItem(
                text='Calibration Details',
                path='/reports/calibration-details',
                parent_id=reports_menu.id,
                order=max_order + 1,
                resource='report_equipment',
                basic_actions=['read']
            )
            db.add(cal_menu)
            db.commit()
            print("Calibration Details Menu added successfully")
        else:
            print("Menu already exists")
    else:
        print("Reports menu not found")

if __name__ == "__main__":
    add_menu_item()
