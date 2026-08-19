"""Seed menu items

Revision ID: f1a2b3c4d5e6
Revises: eef19244a3af
Create Date: 2026-08-19 19:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import Integer, String, Boolean, JSON, DateTime
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'eef19244a3af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

menu_items_table = table(
    'menu_items',
    column('id', Integer),
    column('text', String),
    column('icon_name', String),
    column('path', String),
    column('resource', String),
    column('platform_only', Boolean),
    column('parent_id', Integer),
    column('order', Integer),
    column('is_active', Boolean),
    column('basic_actions', JSON),
    column('extended_actions', JSON),
    column('created_at', DateTime),
    column('updated_at', DateTime)
)

# Extract from SQL dump
MENU_ITEMS = [
    {"id": 1, "text": "Dashboard", "icon_name": "Dashboard", "path": "/", "resource": None, "platform_only": False, "parent_id": None, "order": 0, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 2, "text": "Dashboard", "icon_name": None, "path": "/", "resource": "dashboard", "platform_only": False, "parent_id": 1, "order": 0, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 3, "text": "Master Data", "icon_name": "Category", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 1, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 4, "text": "Materials", "icon_name": None, "path": "/materials", "resource": "materials", "platform_only": False, "parent_id": 3, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 5, "text": "Categories", "icon_name": None, "path": "/categories", "resource": "categories", "platform_only": False, "parent_id": 3, "order": 1, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 6, "text": "Sub Categories", "icon_name": None, "path": "/subcategories", "resource": "subcategories", "platform_only": False, "parent_id": 3, "order": 2, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 7, "text": "UOM", "icon_name": None, "path": "/uom", "resource": "uom", "platform_only": False, "parent_id": 3, "order": 3, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 8, "text": "Vendors", "icon_name": None, "path": "/vendors", "resource": "vendors", "platform_only": False, "parent_id": 3, "order": 4, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}]},
    {"id": 9, "text": "Stores", "icon_name": None, "path": "/warehouses", "resource": "warehouses", "platform_only": False, "parent_id": 3, "order": 5, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 10, "text": "Equipment", "icon_name": None, "path": "/equipment", "resource": "equipment", "platform_only": False, "parent_id": 3, "order": 6, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 11, "text": "Procurement", "icon_name": "ShoppingCart", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 2, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 12, "text": "Indents", "icon_name": None, "path": "/indents", "resource": "indents", "platform_only": False, "parent_id": 11, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}, {"key": "can_convert_to_po", "label": "Convert to PO", "color": "#3B82F6"}, {"key": "can_acknowledge", "label": "Acknowledge", "color": "#F59E0B"}]},
    {"id": 13, "text": "Purchase Requests", "icon_name": None, "path": "/purchase-requests", "resource": "purchase_requests", "platform_only": False, "parent_id": 11, "order": 1, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_submit", "label": "Submit", "color": "#3B82F6"}, {"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}, {"key": "can_convert_to_po", "label": "Convert to PO", "color": "#3B82F6"}, {"key": "can_hold", "label": "Hold", "color": "#F59E0B"}, {"key": "can_short_close", "label": "Short Close", "color": "#F97316"}]},
    {"id": 14, "text": "Quotations", "icon_name": None, "path": "/quotations", "resource": "quotations", "platform_only": False, "parent_id": 11, "order": 2, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_send_to_vendors", "label": "Send to Vendors", "color": "#3B82F6"}, {"key": "can_receive", "label": "Receive", "color": "#10B981"}, {"key": "can_enter_quotes", "label": "Enter Quotes", "color": "#F59E0B"}, {"key": "can_compare", "label": "Compare", "color": "#8B5CF6"}, {"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_convert_to_po", "label": "Convert to PO", "color": "#3B82F6"}]},
    {"id": 15, "text": "Contracts", "icon_name": None, "path": "/contracts", "resource": "contracts", "platform_only": False, "parent_id": 11, "order": 3, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}]},
    {"id": 16, "text": "Purchase Orders", "icon_name": None, "path": "/purchase-orders", "resource": "purchase_orders", "platform_only": False, "parent_id": 11, "order": 4, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}, {"key": "can_hold", "label": "Hold", "color": "#F59E0B"}, {"key": "can_send_to_vendor", "label": "Send to Vendor", "color": "#3B82F6"}, {"key": "can_short_close", "label": "Short Close", "color": "#F97316"}]},
    {"id": 17, "text": "Work Orders", "icon_name": None, "path": "/work-orders", "resource": "work_orders", "platform_only": False, "parent_id": 11, "order": 5, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}, {"key": "can_send_to_vendor", "label": "Send to Vendor", "color": "#3B82F6"}, {"key": "can_short_close", "label": "Short Close", "color": "#F97316"}]},
    {"id": 62, "text": "Vendor Work Orders", "icon_name": "assignment_turned_in", "path": "/procurement/vendor-work-orders", "resource": "vendor_work_orders", "platform_only": False, "parent_id": 11, "order": 6, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 18, "text": "Store Operations", "icon_name": "Store", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 3, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 19, "text": "Gate Entry", "icon_name": None, "path": "/gate-entry", "resource": "gate_entry", "platform_only": False, "parent_id": 18, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_record_entry", "label": "Record Entry", "color": "#3B82F6"}, {"key": "can_verify", "label": "Verify", "color": "#10B981"}]},
    {"id": 20, "text": "Invoices", "icon_name": None, "path": "/invoices", "resource": "invoice", "platform_only": False, "parent_id": 18, "order": 1, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_register", "label": "Register", "color": "#3B82F6"}, {"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}, {"key": "can_print", "label": "Print", "color": "#8B5CF6"}]},
    {"id": 21, "text": "GRN", "icon_name": None, "path": "/grn", "resource": "grn", "platform_only": False, "parent_id": 18, "order": 2, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_create_grn", "label": "Create GRN", "color": "#3B82F6"}, {"key": "can_complete", "label": "Complete", "color": "#10B981"}]},
    {"id": 22, "text": "Material Issue", "icon_name": None, "path": "/issues", "resource": "issues", "platform_only": False, "parent_id": 18, "order": 3, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_issue", "label": "Issue Materials", "color": "#3B82F6"}, {"key": "can_direct_issue", "label": "Direct Issue", "color": "#10B981"}, {"key": "can_print", "label": "Print", "color": "#8B5CF6"}]},
    {"id": 23, "text": "Returns", "icon_name": None, "path": "/returns", "resource": "returns", "platform_only": False, "parent_id": 18, "order": 4, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_return", "label": "Return Materials", "color": "#3B82F6"}, {"key": "receive", "label": "Receive Return", "color": "#10B981"}]},
    {"id": 24, "text": "Stock Transfer", "icon_name": None, "path": "/transfers", "resource": "transfers", "platform_only": False, "parent_id": 18, "order": 5, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_transfer", "label": "Transfer Stock", "color": "#3B82F6"}]},
    {"id": 25, "text": "Write Off", "icon_name": None, "path": "/write-offs", "resource": "write_offs", "platform_only": False, "parent_id": 18, "order": 6, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_submit", "label": "Submit", "color": "#3B82F6"}, {"key": "can_approve", "label": "Approve", "color": "#10B981"}, {"key": "can_reject", "label": "Reject", "color": "#EF4444"}]},
    {"id": 26, "text": "Gate Pass", "icon_name": None, "path": "/gate-passes", "resource": "gate_passes", "platform_only": False, "parent_id": 18, "order": 7, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_create", "label": "Create", "color": "#3B82F6"}, {"key": "can_print", "label": "Print", "color": "#8B5CF6"}]},
    {"id": 27, "text": "Issue Acknowledgement", "icon_name": None, "path": "/pending-acknowledgments", "resource": "acknowledgements", "platform_only": False, "parent_id": 18, "order": 8, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_acknowledge", "label": "Acknowledge Receipt", "color": "#F59E0B"}]},
    {"id": 28, "text": "Inventory", "icon_name": "Warehouse", "path": "/inventory", "resource": None, "platform_only": False, "parent_id": None, "order": 4, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 29, "text": "Inventory", "icon_name": None, "path": "/inventory", "resource": "inventory", "platform_only": False, "parent_id": 28, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 30, "text": "Maintenance", "icon_name": "Build", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 5, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 31, "text": "Complaints", "icon_name": None, "path": "/complaints", "resource": "complaints", "platform_only": False, "parent_id": 30, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_assign", "label": "Assign", "color": "#3B82F6"}, {"key": "can_approve_level1", "label": "Level 1 Approve", "color": "#10B981"}, {"key": "can_approve_level2", "label": "Level 2 Approve", "color": "#10B981"}]},
    {"id": 32, "text": "PM Schedule", "icon_name": None, "path": "/equipment/pm-schedule", "resource": "pm_schedule", "platform_only": False, "parent_id": 30, "order": 1, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "generate_calls", "label": "Generate Calls", "color": "#3B82F6"}]},
    {"id": 33, "text": "Calibration Schedule", "icon_name": None, "path": "/equipment/calibration-schedule", "resource": "calibration_schedule", "platform_only": False, "parent_id": 30, "order": 2, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "generate_calls", "label": "Generate Calls", "color": "#3B82F6"}]},
    {"id": 34, "text": "Intelligence", "icon_name": "Insights", "path": "/intelligence", "resource": None, "platform_only": False, "parent_id": None, "order": 6, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 35, "text": "Intelligence", "icon_name": None, "path": "/intelligence", "resource": "intelligence", "platform_only": False, "parent_id": 34, "order": 0, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 36, "text": "Finance", "icon_name": "AccountBalance", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 7, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 37, "text": "Invoice Tracking", "icon_name": None, "path": "/invoice-tracking", "resource": "finance_invoices", "platform_only": False, "parent_id": 36, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": [{"key": "can_send_hard_copy", "label": "Send Hard Copy", "color": "#3B82F6"}, {"key": "can_receive_hard_copy", "label": "Receive Hard Copy", "color": "#10B981"}, {"key": "can_send_for_payment", "label": "Send for Payment", "color": "#F59E0B"}, {"key": "can_mark_paid", "label": "Mark as Paid", "color": "#8B5CF6"}]},
    {"id": 38, "text": "Pending Invoices Report", "icon_name": None, "path": "/finance/reports/pending-invoices", "resource": "report_finance", "platform_only": False, "parent_id": 36, "order": 1, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 39, "text": "Pending Payments Report", "icon_name": None, "path": "/finance/reports/pending-payments", "resource": "report_finance", "platform_only": False, "parent_id": 36, "order": 2, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 40, "text": "Reports", "icon_name": "Assessment", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 8, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 41, "text": "General Reports", "icon_name": None, "path": "/reports", "resource": "reports", "platform_only": False, "parent_id": 40, "order": 0, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 42, "text": "Issue Summary", "icon_name": None, "path": "/reports/issue-summary", "resource": "report_issue_summary", "platform_only": False, "parent_id": 40, "order": 1, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 43, "text": "Rate Analysis", "icon_name": None, "path": "/reports/rate-analysis", "resource": "report_rate_analysis", "platform_only": False, "parent_id": 40, "order": 2, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 44, "text": "Equipment Count", "icon_name": None, "path": "/reports/equipment-count", "resource": "report_equipment_count", "platform_only": False, "parent_id": 40, "order": 3, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 45, "text": "Receipt Summary", "icon_name": None, "path": "/reports/receipt-summary", "resource": "report_receipt_summary", "platform_only": False, "parent_id": 40, "order": 4, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 46, "text": "Department Inventory", "icon_name": None, "path": "/reports/department-inventory", "resource": "report_dept_inventory", "platform_only": False, "parent_id": 40, "order": 5, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 47, "text": "Department Equipment", "icon_name": None, "path": "/reports/department-equipment", "resource": "report_dept_inventory", "platform_only": False, "parent_id": 40, "order": 6, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 48, "text": "Pending Gatepass Returns", "icon_name": None, "path": "/reports/pending-gatepass-returns", "resource": "report_pending_gatepass", "platform_only": False, "parent_id": 40, "order": 7, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 49, "text": "Call Status", "icon_name": None, "path": "/reports/call-status", "resource": "reports", "platform_only": False, "parent_id": 40, "order": 8, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 50, "text": "Admin", "icon_name": "Settings", "path": None, "resource": None, "platform_only": False, "parent_id": None, "order": 9, "is_active": True, "basic_actions": [], "extended_actions": []},
    {"id": 51, "text": "Users", "icon_name": None, "path": "/admin/users", "resource": "admin_users", "platform_only": False, "parent_id": 50, "order": 0, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 52, "text": "Roles", "icon_name": None, "path": "/admin/roles", "resource": "admin_roles", "platform_only": False, "parent_id": 50, "order": 1, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 53, "text": "Audit Logs", "icon_name": None, "path": "/admin/audit-logs", "resource": "audit_logs", "platform_only": False, "parent_id": 50, "order": 2, "is_active": True, "basic_actions": ["read"], "extended_actions": []},
    {"id": 54, "text": "Approval Flows", "icon_name": None, "path": "/admin/approval-flows", "resource": "approval_flows", "platform_only": False, "parent_id": 50, "order": 3, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 55, "text": "Material Allowances", "icon_name": None, "path": "/admin/material-allowances", "resource": "material_allowances", "platform_only": False, "parent_id": 50, "order": 4, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 56, "text": "Configurations", "icon_name": None, "path": "/admin/configurations", "resource": "configurations", "platform_only": False, "parent_id": 50, "order": 5, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 57, "text": "Locations", "icon_name": None, "path": "/admin/locations", "resource": "locations", "platform_only": False, "parent_id": 50, "order": 6, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 58, "text": "Projects", "icon_name": None, "path": "/projects", "resource": "projects", "platform_only": False, "parent_id": 50, "order": 7, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 59, "text": "Terms & Conditions", "icon_name": None, "path": "/terms", "resource": "terms", "platform_only": False, "parent_id": 50, "order": 8, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 60, "text": "Company Addresses", "icon_name": None, "path": "/company-addresses", "resource": "company_addresses", "platform_only": False, "parent_id": 50, "order": 9, "is_active": True, "basic_actions": ["read", "create", "update", "delete"], "extended_actions": []},
    {"id": 61, "text": "SaaS Admin", "icon_name": "Security", "path": "/saas-admin", "resource": None, "platform_only": True, "parent_id": None, "order": 10, "is_active": True, "basic_actions": [], "extended_actions": []}
]

def upgrade() -> None:
    now = datetime.utcnow()
    # First clear existing to avoid conflicts if some were inserted
    op.execute("DELETE FROM menu_items")
    
    # Insert new data
    for item in MENU_ITEMS:
        item["created_at"] = now
        item["updated_at"] = now
        
    op.bulk_insert(menu_items_table, MENU_ITEMS)
    
    # Update sequence
    op.execute("SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items))")


def downgrade() -> None:
    op.execute("DELETE FROM menu_items")
