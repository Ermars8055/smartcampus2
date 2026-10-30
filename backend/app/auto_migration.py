"""
Automatic lightweight schema migrations and compatibility checks on startup.
Ensures that any new columns added to models exist in PostgreSQL tables
even when using pre-existing volumes/databases where create_all() does not ALTER tables.
"""
import logging
from sqlalchemy import text
from app.database import engine

log = logging.getLogger(__name__)

MIGRATION_STATEMENTS = [
    # Tenant configurations: PO/WO short close notifications & PM/Calibration advance notifications
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS po_short_close_notify_users JSON DEFAULT '[]'::json;",
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS wo_short_close_notify_roles JSON DEFAULT '[]'::json;",
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS pm_advance_email_frequency_tiers JSON DEFAULT '[]'::json;",
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS calibration_advance_email_enabled BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS calibration_advance_email_roles JSON DEFAULT '[]'::json;",
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS calibration_advance_email_users JSON DEFAULT '[]'::json;",
    "ALTER TABLE tenant_configurations ADD COLUMN IF NOT EXISTS calibration_advance_email_frequency_tiers JSON DEFAULT '[]'::json;",

    # Equipment items: multiple photos, installation and other documents
    "ALTER TABLE equipment_items ADD COLUMN IF NOT EXISTS equipment_photos JSON DEFAULT '[]'::json;",
    "ALTER TABLE equipment_items ADD COLUMN IF NOT EXISTS serial_number_photos JSON DEFAULT '[]'::json;",
    "ALTER TABLE equipment_items ADD COLUMN IF NOT EXISTS installation_documents JSON DEFAULT '[]'::json;",
    "ALTER TABLE equipment_items ADD COLUMN IF NOT EXISTS other_documents JSON DEFAULT '[]'::json;",

    # Normalize NULLs to empty JSON arrays where applicable
    "UPDATE tenant_configurations SET po_short_close_notify_users = '[]'::json WHERE po_short_close_notify_users IS NULL;",
    "UPDATE tenant_configurations SET wo_short_close_notify_roles = '[]'::json WHERE wo_short_close_notify_roles IS NULL;",
    "UPDATE tenant_configurations SET pm_advance_email_frequency_tiers = '[]'::json WHERE pm_advance_email_frequency_tiers IS NULL;",
    "UPDATE tenant_configurations SET calibration_advance_email_enabled = FALSE WHERE calibration_advance_email_enabled IS NULL;",
    "UPDATE tenant_configurations SET calibration_advance_email_roles = '[]'::json WHERE calibration_advance_email_roles IS NULL;",
    "UPDATE tenant_configurations SET calibration_advance_email_users = '[]'::json WHERE calibration_advance_email_users IS NULL;",
    "UPDATE tenant_configurations SET calibration_advance_email_frequency_tiers = '[]'::json WHERE calibration_advance_email_frequency_tiers IS NULL;",
    "UPDATE equipment_items SET equipment_photos = '[]'::json WHERE equipment_photos IS NULL;",
    "UPDATE equipment_items SET serial_number_photos = '[]'::json WHERE serial_number_photos IS NULL;",
    "UPDATE equipment_items SET installation_documents = '[]'::json WHERE installation_documents IS NULL;",
    "UPDATE equipment_items SET other_documents = '[]'::json WHERE other_documents IS NULL;",

    # Backfill legacy equipment single photos and documents if JSON arrays are empty
    """
    UPDATE equipment_items 
    SET equipment_photos = json_build_array(json_build_object('url', equipment_photo_url, 'name', 'Equipment Photo'))
    WHERE equipment_photo_url IS NOT NULL 
      AND equipment_photo_url != '' 
      AND (equipment_photos IS NULL OR equipment_photos::text = '[]' OR equipment_photos::text = 'null');
    """,
    """
    UPDATE equipment_items 
    SET serial_number_photos = json_build_array(json_build_object('url', serial_number_photo_url, 'name', 'Serial Number Photo'))
    WHERE serial_number_photo_url IS NOT NULL 
      AND serial_number_photo_url != '' 
      AND (serial_number_photos IS NULL OR serial_number_photos::text = '[]' OR serial_number_photos::text = 'null');
    """,
    """
    UPDATE equipment_items 
    SET installation_documents = json_build_array(json_build_object('url', installation_report_url, 'name', 'Installation Report'))
    WHERE installation_report_url IS NOT NULL 
      AND installation_report_url != '' 
      AND (installation_documents IS NULL OR installation_documents::text = '[]' OR installation_documents::text = 'null');
    """
]

def run_auto_migrations():
    """Run idempotent ALTER TABLE IF NOT EXISTS statements on startup."""
    try:
        with engine.connect() as conn:
            for stmt in MIGRATION_STATEMENTS:
                try:
                    conn.execute(text(stmt))
                except Exception as inner_err:
                    log.warning(f"Auto-migration statement skipped or failed: {inner_err}")
            conn.commit()
        log.info("Auto-migrations executed successfully.")
    except Exception as e:
        log.error(f"Error running auto-migrations on startup: {e}")

    try:
        from scripts.sync_reports_menu import sync_reports_menu
        sync_reports_menu()
    except Exception as e:
        log.warning(f"Reports menu sync during auto-migration skipped: {e}")

    try:
        from scripts.sync_credit_notes_menu import sync_credit_notes_menu
        sync_credit_notes_menu()
    except Exception as e:
        log.warning(f"Credit notes menu sync during auto-migration skipped: {e}")


