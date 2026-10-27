import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def migrate():
    columns_to_add = [
        ("pm_advance_email_frequency_tiers", "JSON DEFAULT '[]'::json"),
        ("calibration_advance_email_enabled", "BOOLEAN DEFAULT FALSE"),
        ("calibration_advance_email_roles", "JSON DEFAULT '[]'::json"),
        ("calibration_advance_email_users", "JSON DEFAULT '[]'::json"),
        ("calibration_advance_email_frequency_tiers", "JSON DEFAULT '[]'::json"),
        ("po_short_close_notify_users", "JSON DEFAULT '[]'::json"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_def in columns_to_add:
            query = text(f"ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS {col_name} {col_def};")
            conn.execute(query)
            print(f"Added column (if not exists): {col_name}")
        conn.commit()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
