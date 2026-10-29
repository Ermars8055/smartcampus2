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
        ("wo_short_close_notify_roles", "JSON DEFAULT '[]'::json"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_def in columns_to_add:
            query = text(f"ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS {col_name} {col_def};")
            conn.execute(query)
            print(f"Added column (if not exists): {col_name}")

        # Update any nulls to defaults
        null_fix_queries = [
            text("UPDATE tenant_configurations SET po_short_close_notify_users = '[]'::json WHERE po_short_close_notify_users IS NULL;"),
            text("UPDATE tenant_configurations SET wo_short_close_notify_roles = '[]'::json WHERE wo_short_close_notify_roles IS NULL;"),
            text("UPDATE tenant_configurations SET pm_advance_email_frequency_tiers = '[]'::json WHERE pm_advance_email_frequency_tiers IS NULL;"),
            text("UPDATE tenant_configurations SET calibration_advance_email_enabled = FALSE WHERE calibration_advance_email_enabled IS NULL;"),
            text("UPDATE tenant_configurations SET calibration_advance_email_roles = '[]'::json WHERE calibration_advance_email_roles IS NULL;"),
            text("UPDATE tenant_configurations SET calibration_advance_email_users = '[]'::json WHERE calibration_advance_email_users IS NULL;"),
            text("UPDATE tenant_configurations SET calibration_advance_email_frequency_tiers = '[]'::json WHERE calibration_advance_email_frequency_tiers IS NULL;"),
        ]
        for nfq in null_fix_queries:
            conn.execute(nfq)
        conn.commit()
    print("Notification settings migration completed successfully!")

if __name__ == "__main__":
    migrate()
