"""
SmartCampus v2 — Comprehensive Data Dictionary Extractor
Generates a well-organised CSV with logical module grouping,
database constraints, backend schema validations, and frontend error messages.
"""

import os, sys, inspect, csv, re
sys.path.insert(0, '/home/ngadmin/smartcampus_v2/backend')

from sqlalchemy import inspection as sa_inspect
from app import models
from app.database import Base

# ──────────────────────────────────────────────────────────────────────────────
# 1. LOGICAL GROUPING  —  models ordered by business domain
# ──────────────────────────────────────────────────────────────────────────────
SECTION_ORDER = [
    ("1. Platform & Auth", [
        "Tenant", "TenantConfiguration", "Site", "User", "PasswordResetToken",
        "TenantMembership", "Role", "RolePermission", "UserRoleAssignment",
    ]),
    ("2. Organization Structure", [
        "Organization", "Project", "Institution", "Building",
        "Department", "Floor", "Room", "Warehouse",
    ]),
    ("3. Master Data", [
        "Category", "SubCategory", "UOM", "Material",
        "Vendor", "VendorCategory", "CompanyAddress",
    ]),
    ("4. Procurement — Indents", [
        "Indent", "IndentItem", "IndentApproval",
    ]),
    ("5. Procurement — Purchase Requests", [
        "PurchaseRequest", "PurchaseRequestItem", "PurchaseRequestApproval",
    ]),
    ("6. Procurement — Purchase Orders", [
        "PurchaseOrder", "PurchaseOrderItem", "PurchaseOrderApproval",
    ]),
    ("7. Procurement — Quotations", [
        "QuotationRequest", "QuotationRequestItem", "QuotationRequestItemSource",
        "QuotationRequestPR", "QuotationRequestVendor",
        "VendorQuotation", "VendorQuotationItem", "QuotationComparison",
    ]),
    ("8. Inward — Gate Entry & GRN", [
        "GateEntry", "GRN", "GRNItem",
    ]),
    ("9. Invoices & Finance", [
        "Invoice", "InvoiceItem",
    ]),
    ("10. Store Operations", [
        "MaterialIssue", "MaterialIssueItem",
        "MaterialReturn", "MaterialReturnItem",
        "StockTransfer", "StockTransferItem",
    ]),
    ("11. Outward — Gate Passes", [
        "GatePass", "GatePassItem",
    ]),
    ("12. Inventory", [
        "CurrentStock", "StockLedger",
    ]),
    ("13. Write-Offs", [
        "WriteOff", "WriteOffItem",
    ]),
    ("14. Maintenance & Complaints", [
        "Complaint", "ComplaintImage",
    ]),
    ("15. Alerts & Notifications", [
        "Alert",
    ]),
    ("16. Workflows & Approvals", [
        "ApprovalFlow",
    ]),
    ("17. System / Audit", [
        "AuditLog", "DocumentSequence", "TermsAndConditions",
        "DepartmentMaterialLimit",
    ]),
]

# Build model_name → section_name map and ordered list
_model_section = {}
_ordered_models = []
for section, model_names in SECTION_ORDER:
    for mn in model_names:
        _model_section[mn] = section
        _ordered_models.append(mn)

# ──────────────────────────────────────────────────────────────────────────────
# 2. FRONTEND VALIDATION PARSER  —  maps JSX page → model(s)
# ──────────────────────────────────────────────────────────────────────────────
FE_PAGE_TO_MODELS = {
    'Materials.jsx':          ['Material'],
    'Vendors.jsx':            ['Vendor'],
    'Warehouses.jsx':         ['Warehouse'],
    'Categories.jsx':         ['Category'],
    'SubCategories.jsx':      ['SubCategory'],
    'UOM.jsx':                ['UOM'],
    'PurchaseRequests.jsx':   ['PurchaseRequest'],
    'PurchaseOrders.jsx':     ['PurchaseOrder'],
    'Indents.jsx':            ['Indent'],
    'GatePasses.jsx':         ['GatePass'],
    'GateEntry.jsx':          ['GateEntry'],
    'Quotations.jsx':         ['QuotationRequest'],
    'RegisterInvoice.jsx':    ['Invoice'],
    'GRN.jsx':                ['GRN'],
    'MaterialIssue.jsx':      ['MaterialIssue'],
    'Returns.jsx':            ['MaterialReturn'],
    'StockTransfers.jsx':     ['StockTransfer'],
    'WriteOffs.jsx':          ['WriteOff'],
    'CompanyAddresses.jsx':   ['CompanyAddress'],
    'Configurations.jsx':     ['TenantConfiguration'],
}

def parse_frontend_validations():
    """Scan every JSX page for `newErrors.<field> = '<message>'` patterns."""
    frontend_dir = '/home/ngadmin/smartcampus_v2/frontend/src/pages'
    # model_name → { field_name: [msg1, msg2, …] }
    result = {}
    if not os.path.isdir(frontend_dir):
        return result

    for filename in sorted(os.listdir(frontend_dir)):
        if not filename.endswith('.jsx'):
            continue
        filepath = os.path.join(frontend_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            continue

        # Find all error assignments
        error_matches = re.findall(
            r"newErrors\.(\w+)\s*=\s*['\"`](.*?)['\"`]", content
        )
        if not error_matches:
            continue

        target_models = FE_PAGE_TO_MODELS.get(filename, [])
        if not target_models:
            continue

        for model_name in target_models:
            if model_name not in result:
                result[model_name] = {}
            for field, msg in error_matches:
                if field not in result[model_name]:
                    result[model_name][field] = []
                if msg not in result[model_name][field]:
                    result[model_name][field].append(msg)

    return result


# ──────────────────────────────────────────────────────────────────────────────
# 3. PYDANTIC SCHEMA PARSER  —  Field() constraints & @field_validator msgs
# ──────────────────────────────────────────────────────────────────────────────
def parse_pydantic_schemas():
    """
    Returns two dicts:
      field_constraints:  schema_class → { field_name: { 'min_length': '1', ... } }
      validator_messages: schema_class → { field_name: [msg1, …] }
    """
    schema_file = '/home/ngadmin/smartcampus_v2/backend/app/schemas.py'
    field_constraints = {}
    validator_messages = {}

    try:
        with open(schema_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return field_constraints, validator_messages

    # ── Parse class-by-class ────────────────────────────────────────────────
    class_blocks = re.split(r'\nclass\s+', content)
    for block in class_blocks[1:]:                # skip preamble
        class_match = re.match(r'(\w+)\s*\(', block)
        if not class_match:
            continue
        cls_name = class_match.group(1)
        field_constraints[cls_name] = {}
        validator_messages[cls_name] = {}

        # Field(..., min_length=1, max_length=255, gt=0, pattern=...)
        for fm in re.finditer(
            r'(\w+):\s*.*?=\s*Field\((.*?)\)', block, re.DOTALL
        ):
            fname = fm.group(1)
            args  = fm.group(2)
            constraints = {}
            for key in ('min_length', 'max_length', 'gt', 'ge', 'lt', 'le'):
                m = re.search(rf'{key}\s*=\s*([\d.]+)', args)
                if m:
                    constraints[key] = m.group(1)
            pat = re.search(r"pattern\s*=\s*['\"](.+?)['\"]", args)
            if pat:
                constraints['pattern'] = pat.group(1)
            if constraints:
                field_constraints[cls_name][fname] = constraints

        # @field_validator → raise ValueError("...")
        for vm in re.finditer(
            r'@field_validator\(["\'](\w+)["\']\).*?def\s+\w+.*?raise\s+ValueError\(["\'](.+?)["\']\)',
            block, re.DOTALL
        ):
            fname = vm.group(1)
            msg   = vm.group(2)
            if fname not in validator_messages[cls_name]:
                validator_messages[cls_name][fname] = []
            if msg not in validator_messages[cls_name][fname]:
                validator_messages[cls_name][fname].append(msg)

    return field_constraints, validator_messages


# Map pydantic schema classes to ORM model names
SCHEMA_TO_MODEL = {
    'MaterialBase': 'Material', 'MaterialCreate': 'Material', 'MaterialUpdate': 'Material',
    'VendorBase': 'Vendor', 'VendorCreate': 'Vendor', 'VendorUpdate': 'Vendor',
    'CategoryBase': 'Category', 'CategoryCreate': 'Category',
    'SubCategoryBase': 'SubCategory', 'SubCategoryCreate': 'SubCategory',
    'UOMBase': 'UOM', 'UOMCreate': 'UOM',
    'PRBase': 'PurchaseRequest', 'PRCreate': 'PurchaseRequest',
    'PRItemBase': 'PurchaseRequestItem',
    'POBase': 'PurchaseOrder', 'POCreate': 'PurchaseOrder',
    'POItemBase': 'PurchaseOrderItem',
    'GateEntryBase': 'GateEntry', 'GateEntryCreate': 'GateEntry',
    'InvoiceBase': 'Invoice', 'InvoiceCreate': 'Invoice',
    'InvoiceItemBase': 'InvoiceItem',
    'CompanyAddressBase': 'CompanyAddress', 'CompanyAddressCreate': 'CompanyAddress',
    'WarehouseBase': 'Warehouse', 'WarehouseCreate': 'Warehouse',
    'OrganizationBase': 'Organization',
    'ProjectBase': 'Project',
    'InstitutionBase': 'Institution',
    'BuildingBase': 'Building',
    'FloorBase': 'Floor',
    'DepartmentBase': 'Department',
    'RoomBase': 'Room',
    'UserBase': 'User', 'UserCreate': 'User',
    'RoleBase': 'Role',
    'TenantConfigurationBase': 'TenantConfiguration',
}


def merge_pydantic_into(model_data, field_constraints, validator_messages):
    """Merge parsed pydantic data into model_data dict."""
    for schema_cls, model_name in SCHEMA_TO_MODEL.items():
        if model_name not in model_data:
            continue

        constraints = field_constraints.get(schema_cls, {})
        messages    = validator_messages.get(schema_cls, {})

        for field_name in model_data[model_name]:
            entry = model_data[model_name][field_name]
            # Merge constraints
            if field_name in constraints:
                for k, v in constraints[field_name].items():
                    rule = f"{k}={v}"
                    if rule not in entry['validation_rules']:
                        entry['validation_rules'].append(rule)
            # Merge validator error messages
            if field_name in messages:
                for msg in messages[field_name]:
                    if msg not in entry['error_messages']:
                        entry['error_messages'].append(msg)


# ──────────────────────────────────────────────────────────────────────────────
# 4. MAIN  —  Walk models in logical order & emit CSV
# ──────────────────────────────────────────────────────────────────────────────
def run():
    csv_file = '/home/ngadmin/smartcampus_v2/smartcampus_all_modules_data_dictionary.csv'

    # Collect all ORM classes by name
    orm_classes = {}
    for name, obj in inspect.getmembers(models):
        if inspect.isclass(obj) and issubclass(obj, Base) and obj is not Base:
            orm_classes[name] = obj

    # ── Build per-model field data from SQLAlchemy ──────────────────────────
    model_data = {}  # model_name → { field_name → {…} }

    for model_name, cls in orm_classes.items():
        try:
            mapper = sa_inspect.inspect(cls)
        except Exception:
            continue

        model_data[model_name] = {}
        for col in mapper.columns:
            field_name = col.name
            # Type
            raw_type = str(col.type)

            # Details
            details = []
            if col.primary_key:
                details.append("Primary Key")
            if col.foreign_keys:
                fks = ", ".join(fk.target_fullname for fk in col.foreign_keys)
                details.append(f"FK → {fks}")
            if col.default is not None and hasattr(col.default, 'arg'):
                val = col.default.arg
                if callable(val):
                    details.append("Default: auto-generated")
                else:
                    details.append(f"Default: {val}")
            length = getattr(col.type, 'length', None)
            if length:
                details.append(f"Max {length} chars")

            required = "No" if col.nullable else "Yes"

            model_data[model_name][field_name] = {
                'type': raw_type,
                'details': "; ".join(details) if details else "-",
                'required': required,
                'validation_rules': [],
                'error_messages': [],
            }

    # ── Merge pydantic schemas ─────────────────────────────────────────────
    field_constraints, validator_messages = parse_pydantic_schemas()
    merge_pydantic_into(model_data, field_constraints, validator_messages)

    # ── Merge frontend validations ─────────────────────────────────────────
    fe_vals = parse_frontend_validations()
    for model_name, fields in fe_vals.items():
        if model_name not in model_data:
            continue
        for field_name, msgs in fields.items():
            if field_name in model_data[model_name]:
                for msg in msgs:
                    if msg not in model_data[model_name][field_name]['error_messages']:
                        model_data[model_name][field_name]['error_messages'].append(msg)
            # Also mark required if frontend says so
            # (fields that have "is required" in their message)
            if field_name in model_data[model_name]:
                for msg in msgs:
                    if 'required' in msg.lower():
                        model_data[model_name][field_name]['required'] = 'Yes'

    # ── Write CSV in section order ─────────────────────────────────────────
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Section', 'Module', 'Field Name',
            'Field Type', 'Length / Details', 'Required',
            'Validation Rules', 'Error Messages',
        ])

        written = set()
        for section, model_names in SECTION_ORDER:
            for model_name in model_names:
                if model_name not in model_data:
                    continue
                written.add(model_name)
                for field_name, info in model_data[model_name].items():
                    rules = "; ".join(info['validation_rules']) if info['validation_rules'] else "-"
                    msgs  = "; ".join(info['error_messages'])   if info['error_messages']   else "-"
                    writer.writerow([
                        section,
                        model_name,
                        field_name,
                        info['type'],
                        info['details'],
                        info['required'],
                        rules,
                        msgs,
                    ])

        # Catch any models we missed in the section ordering
        for model_name in sorted(model_data.keys()):
            if model_name in written:
                continue
            for field_name, info in model_data[model_name].items():
                rules = "; ".join(info['validation_rules']) if info['validation_rules'] else "-"
                msgs  = "; ".join(info['error_messages'])   if info['error_messages']   else "-"
                writer.writerow([
                    "99. Uncategorised",
                    model_name,
                    field_name,
                    info['type'],
                    info['details'],
                    info['required'],
                    rules,
                    msgs,
                ])

    total_fields = sum(len(v) for v in model_data.values())
    total_models = len(model_data)
    print(f"✅ Done — {total_models} modules, {total_fields} fields → {csv_file}")


if __name__ == "__main__":
    run()
