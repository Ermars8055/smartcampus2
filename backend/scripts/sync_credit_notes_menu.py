import os
import sys
from datetime import datetime

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import MenuItem, Role, RolePermission

DESIRED_STORE_OP_ORDER = {
    "/gate-entry": 0,
    "/invoices": 1,
    "/credit-notes": 2,
    "/grn": 3,
    "/issues": 4,
    "/returns": 5,
    "/transfers": 6,
    "/write-offs": 7,
    "/gate-passes": 8,
    "/pending-acknowledgments": 9
}

EXTENDED_ACTIONS = [
    {"key": "can_approve", "label": "Approve", "color": "#10B981"},
    {"key": "can_reject", "label": "Reject", "color": "#EF4444"},
    {"key": "can_print", "label": "Print", "color": "#8B5CF6"}
]

def sync_credit_notes_menu():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # 1. Locate Store Operations parent menu
        store_op = db.query(MenuItem).filter(MenuItem.id == 18).first()
        if not store_op:
            store_op = db.query(MenuItem).filter(MenuItem.text == "Store Operations", MenuItem.parent_id == None).first()
            if not store_op:
                print("Error: 'Store Operations' parent menu item not found.")
                return

        print(f"Parent menu found: {store_op.text} (ID: {store_op.id})")

        # 2. Check for existing Credit Notes menu item
        cn_item = db.query(MenuItem).filter(
            (MenuItem.path == "/credit-notes") | (MenuItem.id == 65)
        ).first()

        if cn_item:
            print(f"Updating existing Credit Notes menu item (ID: {cn_item.id})")
            cn_item.text = "Credit Notes"
            cn_item.icon_name = "ReceiptLong"
            cn_item.path = "/credit-notes"
            cn_item.resource = "credit_note"
            cn_item.platform_only = False
            cn_item.parent_id = store_op.id
            cn_item.order = 2
            cn_item.is_active = True
            cn_item.basic_actions = ["read", "create", "update", "delete"]
            cn_item.extended_actions = EXTENDED_ACTIONS
            cn_item.updated_at = now
        else:
            print("Creating new Credit Notes menu item (ID: 65)...")
            # Check if ID 65 is taken
            id_65_taken = db.query(MenuItem).filter(MenuItem.id == 65).first() is not None
            cn_item_data = {
                "text": "Credit Notes",
                "icon_name": "ReceiptLong",
                "path": "/credit-notes",
                "resource": "credit_note",
                "platform_only": False,
                "parent_id": store_op.id,
                "order": 2,
                "is_active": True,
                "basic_actions": ["read", "create", "update", "delete"],
                "extended_actions": EXTENDED_ACTIONS,
                "created_at": now,
                "updated_at": now
            }
            if not id_65_taken:
                cn_item_data["id"] = 65
            cn_item = MenuItem(**cn_item_data)
            db.add(cn_item)

        db.flush()

        # 3. Re-order siblings under Store Operations
        siblings = db.query(MenuItem).filter(MenuItem.parent_id == store_op.id).all()
        for sib in siblings:
            if sib.path in DESIRED_STORE_OP_ORDER:
                sib.order = DESIRED_STORE_OP_ORDER[sib.path]
                print(f"  -> Sibling '{sib.text}' set to order {sib.order}")

        # 4. Synchronize role permissions for credit_note
        roles = db.query(Role).all()
        added_perms = 0
        updated_perms = 0

        for role in roles:
            # Check if role has invoice permission
            inv_perm = db.query(RolePermission).filter(
                RolePermission.role_id == role.id,
                RolePermission.resource == "invoice"
            ).first()

            is_admin_role = any(kw in role.name.lower() for kw in ["admin", "manager", "store"])

            if inv_perm or is_admin_role:
                cn_perm = db.query(RolePermission).filter(
                    RolePermission.role_id == role.id,
                    RolePermission.resource == "credit_note"
                ).first()

                can_read = inv_perm.can_read if inv_perm else True
                can_create = inv_perm.can_create if inv_perm else True
                can_update = inv_perm.can_update if inv_perm else True
                can_delete = inv_perm.can_delete if inv_perm else False
                
                inv_ext = inv_perm.extended_actions if (inv_perm and inv_perm.extended_actions) else {}
                cn_ext = {
                    "can_approve": inv_ext.get("can_approve", True if is_admin_role else False),
                    "can_reject": inv_ext.get("can_reject", True if is_admin_role else False),
                    "can_print": inv_ext.get("can_print", True)
                }

                if not cn_perm:
                    new_perm = RolePermission(
                        role_id=role.id,
                        resource="credit_note",
                        can_read=can_read,
                        can_create=can_create,
                        can_update=can_update,
                        can_delete=can_delete,
                        extended_actions=cn_ext
                    )
                    db.add(new_perm)
                    added_perms += 1
                    print(f"  + Added credit_note permission for role: {role.name} (ID: {role.id})")
                else:
                    cn_perm.can_read = can_read
                    cn_perm.can_create = can_create
                    cn_perm.can_update = can_update
                    cn_perm.can_delete = can_delete
                    cn_perm.extended_actions = cn_ext
                    updated_perms += 1
                    print(f"  * Updated credit_note permission for role: {role.name} (ID: {role.id})")

        db.commit()
        print(f"\nSync complete! Menu synced, {added_perms} role permissions created, {updated_perms} updated.")

    except Exception as e:
        db.rollback()
        print(f"Error syncing credit notes menu: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    sync_credit_notes_menu()
