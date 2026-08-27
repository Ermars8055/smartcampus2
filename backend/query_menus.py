from app.database import SessionLocal
from app.models import MenuItem

db = SessionLocal()
menus = db.query(MenuItem).filter(MenuItem.parent_id == None).all()
print("ROOT MENUS:")
for m in menus:
    print(f"ID: {m.id} | Name: {m.text}")
    children = db.query(MenuItem).filter(MenuItem.parent_id == m.id).all()
    for c in children:
        print(f"  ID: {c.id} | Name: {c.text} | Path: {c.path}")

db.close()
