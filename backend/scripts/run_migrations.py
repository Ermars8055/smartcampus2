"""
Consolidated runner for database migrations and menu synchronizations.
Safe and idempotent: can be run anytime in local or production/docker environments.

Usage:
  python scripts/run_migrations.py
  OR inside docker:
  docker compose exec backend python scripts/run_migrations.py
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.migrate_notification_settings import migrate as migrate_notifications
from scripts.migrate_equipment_documents import migrate as migrate_equipment
from scripts.sync_reports_menu import sync_reports_menu
from scripts.sync_credit_notes_menu import sync_credit_notes_menu

def main():
    print("=" * 60)
    print("Starting Smart Campus Database Migrations & Menu Sync")
    print("=" * 60)

    print("\n[1/4] Migrating Tenant Notification Settings...")
    try:
        migrate_notifications()
    except Exception as e:
        print(f"Error in migrate_notifications: {e}")

    print("\n[2/4] Migrating Equipment Documents & Photos...")
    try:
        migrate_equipment()
    except Exception as e:
        print(f"Error in migrate_equipment: {e}")

    print("\n[3/4] Syncing Reports Menu Modules...")
    try:
        sync_reports_menu()
    except Exception as e:
        print(f"Error in sync_reports_menu: {e}")

    print("\n[4/4] Syncing Credit Notes Menu & Actions...")
    try:
        sync_credit_notes_menu()
    except Exception as e:
        print(f"Error in sync_credit_notes_menu: {e}")

    print("\n" + "=" * 60)
    print("All migrations and synchronizations finished!")
    print("=" * 60)

if __name__ == "__main__":
    main()

