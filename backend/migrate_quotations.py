
import sys
import os
sys.path.append(os.getcwd())

from app.database import engine, SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        # 1. Add column if not exists
        print("Adding receipt_status column to quotation_request_vendors...")
        try:
            # Check if column exists first (Postgres specific check)
            res = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='quotation_request_vendors' AND column_name='receipt_status';
            """)).fetchone()
            
            if not res:
                db.execute(text("ALTER TABLE quotation_request_vendors ADD COLUMN receipt_status VARCHAR(50) DEFAULT 'Pending'"))
                db.commit()
                print("Column added.")
            else:
                print("Column already exists.")
        except Exception as e:
            db.rollback()
            print(f"Error adding column: {e}")

        # 2. Update statuses
        print("Updating QuotationRequest statuses...")
        status_map = {
            "Sent to Vendors": "Requested",
            "Quotations Received": "Entered",
            "Comparison Done": "Compared",
            "Converted to PO": "Ordered"
        }
        for old, new in status_map.items():
            try:
                result = db.execute(text("UPDATE quotation_requests SET status = :new WHERE status = :old"), {"new": new, "old": old})
                print(f"Updated {result.rowcount} records from '{old}' to '{new}'")
            except Exception as e:
                print(f"Error updating '{old}': {e}")
        
        db.commit()
        print("Migration complete.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
