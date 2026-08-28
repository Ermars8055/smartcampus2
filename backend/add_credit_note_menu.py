from app.database import SessionLocal
from app.models import MenuItem

def add_menu():
    db = SessionLocal()
    # Find "Store Operations"
    store_ops = db.query(MenuItem).filter(MenuItem.text == "Store Operations").first()
    if not store_ops:
        print("Store Operations menu not found.")
        return

    # Check if Credit Notes already exists
    existing = db.query(MenuItem).filter(MenuItem.text == "Credit Notes", MenuItem.parent_id == store_ops.id).first()
    if existing:
        print("Credit Notes menu already exists.")
        return

    # Find highest order in Store Operations children
    children = db.query(MenuItem).filter(MenuItem.parent_id == store_ops.id).all()
    max_order = max([c.order for c in children]) if children else 0

    new_menu = MenuItem(
        text="Credit Notes",
        icon_name="ReceiptLong",
        path="/credit-notes",
        parent_id=store_ops.id,
        order=max_order + 1,
        is_active=True
    )
    db.add(new_menu)
    db.commit()
    print("Added Credit Notes menu.")

if __name__ == "__main__":
    add_menu()
