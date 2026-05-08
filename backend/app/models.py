"""SQLAlchemy ORM models for NissiGrid Smart Campus - Multi-Tenant SaaS."""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, Date,
    ForeignKey, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# == Enums ==
class TenantStatus(str, enum.Enum):
    ACTIVE = "Active"
    SUSPENDED = "Suspended"
    INACTIVE = "Inactive"

class PRStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CONVERTED = "Converted to PO"

class POStatus(str, enum.Enum):
    DRAFT = "Draft"
    APPROVED = "Approved"
    SENT = "Sent to Vendor"
    PARTIAL = "Partially Received"
    CLOSED = "Closed"

class GateEntryStatus(str, enum.Enum):
    CREATED = "Gate Entry Created"
    AWAITING_GRN = "Awaiting GRN"
    COMPLETED = "Completed"

class GRNStatus(str, enum.Enum):
    DRAFT = "Draft"
    COMPLETED = "Completed"

class IssueStatus(str, enum.Enum):
    DRAFT = "Draft"
    ISSUED = "Issued"

class ReturnType(str, enum.Enum):
    UNUSED = "Unused"
    DAMAGED = "Damaged"

class TransferStatus(str, enum.Enum):
    DRAFT = "Draft"
    IN_TRANSIT = "In Transit"
    COMPLETED = "Completed"

class TransactionType(str, enum.Enum):
    GRN = "GRN"
    ISSUE = "Issue"
    RETURN = "Return"
    TRANSFER_IN = "Transfer In"
    TRANSFER_OUT = "Transfer Out"
    ADJUSTMENT = "Adjustment"

class AlertType(str, enum.Enum):
    LOW_STOCK = "Low Stock"
    PENDING_PR = "Pending PR Approval"
    DELAYED_PO = "Delayed PO Delivery"
    STOCK_DISCREPANCY = "Stock Discrepancy"

class AlertSeverity(str, enum.Enum):
    INFO = "Info"
    WARNING = "Warning"
    CRITICAL = "Critical"

class GateEntryType(str, enum.Enum):
    VEHICLE = "Vehicle"
    CARRY_ON_HAND = "Carry on hand"

class IndentStatus(str, enum.Enum):
    DRAFT = "Draft"
    AWAITING_APPROVAL = "Awaiting Approval"
    APPROVED = "Approved"
    PARTIALLY_ISSUED = "Partially Issued"
    ISSUED = "Issued"
    CONVERTED = "Converted to PO"
    REJECTED = "Rejected"
    CLOSED = "Closed"

class ApprovalDocumentType(str, enum.Enum):
    INDENT = "Indent"
    PURCHASE_REQUEST = "Purchase Request"
    PURCHASE_ORDER = "Purchase Order"

class QuotationRequestStatus(str, enum.Enum):
    DRAFT = "Draft"
    SENT = "Sent to Vendors"
    RECEIVED = "Quotations Received"
    COMPARED = "Comparison Done"
    APPROVED = "Approved"
    CONVERTED = "Converted to PO"
    CANCELLED = "Cancelled"

class VendorQuotationStatus(str, enum.Enum):
    PENDING = "Pending"
    RECEIVED = "Received"
    REJECTED = "Rejected"


# == Multi-Tenant Core ==

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), default=TenantStatus.ACTIVE.value)
    subscription_plan = Column(String(50), default="basic")
    max_sites = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    location = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    tenant = relationship("Tenant")
    __table_args__ = (UniqueConstraint("tenant_id", "name", name="uq_site_per_tenant"),)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_platform_admin = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TenantMembership(Base):
    __tablename__ = "tenant_memberships"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")
    tenant = relationship("Tenant")
    __table_args__ = (UniqueConstraint("user_id", "tenant_id", name="uq_user_tenant"),)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(100), nullable=False)
    description = Column(Text)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_role_code_per_tenant"),)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    resource = Column(String(100), nullable=False)
    can_read = Column(Boolean, default=False)
    can_create = Column(Boolean, default=False)
    can_update = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    role = relationship("Role", back_populates="permissions")
    __table_args__ = (UniqueConstraint("role_id", "resource", name="uq_role_resource"),)

class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    role = relationship("Role")
    site = relationship("Site")


# == Organization Structure ==

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_org_code_per_tenant"),)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    location = Column(String(255))
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(50), default="Active")
    budget = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    organization = relationship("Organization", back_populates="projects")
    blocks = relationship("Block", back_populates="project", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="project", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_proj_code_per_tenant"),)

class Block(Base):
    __tablename__ = "blocks"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    block_type = Column(String(100))
    block_number = Column(String(50))
    floors = Column(Integer, default=1)
    rooms = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="blocks")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    warehouse_type = Column(String(100))
    location = Column(String(255))
    capacity = Column(String(100))
    manager_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    project = relationship("Project", back_populates="warehouses")
    current_stocks = relationship("CurrentStock", back_populates="warehouse")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_wh_code_per_tenant"),)


# == Master Data ==

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    subcategories = relationship("SubCategory", back_populates="category", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="category")
    __table_args__ = (UniqueConstraint("site_id", "name", name="uq_cat_per_site"),)

class SubCategory(Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    category = relationship("Category", back_populates="subcategories")

class UOM(Base):
    __tablename__ = "uom"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)
    abbreviation = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    __table_args__ = (UniqueConstraint("site_id", "name", name="uq_uom_per_site"),)

class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id"), nullable=True)
    uom_id = Column(Integer, ForeignKey("uom.id"), nullable=False)
    reorder_level = Column(Float, default=0)
    maximum_level = Column(Float, default=0)
    standard_cost = Column(Float, default=0)
    preferred_vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    storage_type = Column(String(100), default="General")
    hsn_code = Column(String(20))
    gst_rate = Column(Float, default=0)
    material_type = Column(String(50), default="Consumable") # Consumable, Non-Consumable
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    category = relationship("Category", back_populates="materials")
    subcategory = relationship("SubCategory")
    uom = relationship("UOM")
    preferred_vendor = relationship("Vendor", foreign_keys=[preferred_vendor_id])
    __table_args__ = (UniqueConstraint("site_id", "code", name="uq_mat_code_per_site"),)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    contact_person = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    gst_number = Column(String(20))
    pan_number = Column(String(15))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    bank_name = Column(String(100))
    bank_account = Column(String(50))
    ifsc_code = Column(String(20))
    rating = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    vendor_categories = relationship("VendorCategory", back_populates="vendor", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("site_id", "code", name="uq_vendor_code_per_site"),)

class VendorCategory(Base):
    __tablename__ = "vendor_categories"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    vendor = relationship("Vendor", back_populates="vendor_categories")
    category = relationship("Category")
    __table_args__ = (UniqueConstraint("vendor_id", "category_id", name="uq_vendor_category"),)


# == Procurement ==

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    pr_number = Column(String(50), nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    required_for_block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    required_date = Column(Date, nullable=False)
    remarks = Column(Text)
    status = Column(String(50), default=PRStatus.DRAFT.value)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    block = relationship("Block")
    project = relationship("Project")
    items = relationship("PurchaseRequestItem", back_populates="purchase_request", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "pr_number", name="uq_pr_per_tenant"),)

class PurchaseRequestItem(Base):
    __tablename__ = "purchase_request_items"
    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    purchase_request = relationship("PurchaseRequest", back_populates="items")
    material = relationship("Material")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    po_number = Column(String(50), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=True)
    indent_id = Column(Integer, ForeignKey("indents.id"), nullable=True)
    po_type = Column(String(50), default="Formal") # Formal, Informal
    total_amount = Column(Float, default=0)
    delivery_date = Column(Date)
    status = Column(String(50), default=POStatus.DRAFT.value)
    terms = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    vendor = relationship("Vendor")
    project = relationship("Project")
    purchase_request = relationship("PurchaseRequest")
    indent = relationship("Indent")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "po_number", name="uq_po_per_tenant"),)

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    received_quantity = Column(Float, default=0)
    remarks = Column(Text)
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    material = relationship("Material")


# == Gate Entry ==

class GateEntry(Base):
    __tablename__ = "gate_entries"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    entry_number = Column(String(50), nullable=False, index=True)
    vehicle_number = Column(String(50))
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    arrival_time = Column(DateTime, default=datetime.utcnow)
    driver_name = Column(String(255))
    driver_phone = Column(String(20))
    delivery_person_name = Column(String(255))
    entry_type = Column(String(50), default=GateEntryType.VEHICLE.value)
    photo_url = Column(String(500))
    remarks = Column(Text)
    status = Column(String(50), default=GateEntryStatus.CREATED.value)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    vendor = relationship("Vendor")
    purchase_order = relationship("PurchaseOrder")
    project = relationship("Project")
    material = relationship("Material")
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])
    __table_args__ = (UniqueConstraint("tenant_id", "entry_number", name="uq_ge_per_tenant"),)


# == GRN ==

class GRN(Base):
    __tablename__ = "grn"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    grn_number = Column(String(50), nullable=False, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    gate_entry_id = Column(Integer, ForeignKey("gate_entries.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    invoice_number = Column(String(100))
    invoice_date = Column(Date)
    invoice_amount = Column(Float, default=0)
    status = Column(String(50), default=GRNStatus.DRAFT.value)
    remarks = Column(Text)
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    purchase_order = relationship("PurchaseOrder")
    gate_entry = relationship("GateEntry")
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    vendor = relationship("Vendor")
    received_by = relationship("User", foreign_keys=[received_by_id])
    items = relationship("GRNItem", back_populates="grn", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "grn_number", name="uq_grn_per_tenant"),)

class GRNItem(Base):
    __tablename__ = "grn_items"
    id = Column(Integer, primary_key=True, index=True)
    grn_id = Column(Integer, ForeignKey("grn.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    po_item_id = Column(Integer, ForeignKey("purchase_order_items.id"), nullable=True)
    ordered_quantity = Column(Float, default=0)
    received_quantity = Column(Float, nullable=False)
    accepted_quantity = Column(Float, nullable=False)
    rejected_quantity = Column(Float, default=0)
    rate = Column(Float, default=0)
    remarks = Column(Text)
    grn = relationship("GRN", back_populates="items")
    material = relationship("Material")
    po_item = relationship("PurchaseOrderItem")


# == Store Operations ==

class MaterialIssue(Base):
    __tablename__ = "material_issues"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    issue_number = Column(String(50), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    indent_id = Column(Integer, ForeignKey("indents.id"), nullable=True)
    issued_to_block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    issued_to_department = Column(String(255))
    issued_to_contractor = Column(String(255))
    purpose = Column(Text)
    status = Column(String(50), default=IssueStatus.DRAFT.value)
    issued_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    received_by_name = Column(String(255))
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledgement_remarks = Column(Text)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    block = relationship("Block")
    indent = relationship("Indent")
    issued_by = relationship("User", foreign_keys=[issued_by_id])
    items = relationship("MaterialIssueItem", back_populates="issue", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "issue_number", name="uq_issue_per_tenant"),)

class MaterialIssueItem(Base):
    __tablename__ = "material_issue_items"
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("material_issues.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    rate = Column(Float, default=0)
    remarks = Column(Text)
    issue = relationship("MaterialIssue", back_populates="items")
    material = relationship("Material")

class MaterialReturn(Base):
    __tablename__ = "material_returns"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    return_number = Column(String(50), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    returned_from_block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    returned_from_department = Column(String(255))
    return_type = Column(String(50), default=ReturnType.UNUSED.value)
    remarks = Column(Text)
    returned_by_name = Column(String(255))
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    block = relationship("Block")
    received_by = relationship("User", foreign_keys=[received_by_id])
    items = relationship("MaterialReturnItem", back_populates="material_return", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "return_number", name="uq_ret_per_tenant"),)

class MaterialReturnItem(Base):
    __tablename__ = "material_return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("material_returns.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    condition = Column(String(50), default="Good")
    remarks = Column(Text)
    material_return = relationship("MaterialReturn", back_populates="items")
    material = relationship("Material")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    transfer_number = Column(String(50), nullable=False, index=True)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    status = Column(String(50), default=TransferStatus.DRAFT.value)
    remarks = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    project = relationship("Project")
    created_by = relationship("User", foreign_keys=[created_by_id])
    items = relationship("StockTransferItem", back_populates="transfer", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "transfer_number", name="uq_trf_per_tenant"),)

class StockTransferItem(Base):
    __tablename__ = "stock_transfer_items"
    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    remarks = Column(Text)
    transfer = relationship("StockTransfer", back_populates="items")
    material = relationship("Material")


# == Inventory ==

class CurrentStock(Base):
    __tablename__ = "current_stock"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Float, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    material = relationship("Material")
    warehouse = relationship("Warehouse", back_populates="current_stocks")
    __table_args__ = (UniqueConstraint("material_id", "warehouse_id", name="uq_material_warehouse"),)

class StockLedger(Base):
    __tablename__ = "stock_ledger"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    quantity = Column(Float, nullable=False)
    balance = Column(Float, default=0)
    reference_type = Column(String(50))
    reference_id = Column(Integer)
    reference_number = Column(String(50))
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    remarks = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    material = relationship("Material")
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    block = relationship("Block")
    created_by = relationship("User", foreign_keys=[created_by_id])


# == Alerts ==

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default=AlertSeverity.INFO.value)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    reference_type = Column(String(50))
    reference_id = Column(Integer)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    project = relationship("Project")


# == Workflows ==

class ApprovalFlow(Base):
    __tablename__ = "approval_flows"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), nullable=False)
    level = Column(Integer, nullable=False)
    role_name = Column(String(100), nullable=False)
    min_amount = Column(Float, default=0)
    max_amount = Column(Float, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", foreign_keys=[user_id])
    __table_args__ = (UniqueConstraint("tenant_id", "site_id", "document_type", "level", "role_name", "user_id", name="uq_approval_flow_detailed"),)

class Indent(Base):
    __tablename__ = "indents"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    indent_number = Column(String(50), nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    floor = Column(String(50))
    location = Column(String(255))
    remarks = Column(Text)
    total_amount = Column(Float, default=0)
    status = Column(String(50), default=IndentStatus.DRAFT.value)
    current_approval_level = Column(Integer, default=1)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    block = relationship("Block")
    items = relationship("IndentItem", back_populates="indent", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "indent_number", name="uq_indent_per_tenant"),)

class IndentItem(Base):
    __tablename__ = "indent_items"
    id = Column(Integer, primary_key=True, index=True)
    indent_id = Column(Integer, ForeignKey("indents.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    requested_quantity = Column(Float, nullable=False)
    issued_quantity = Column(Float, default=0)
    acknowledged_quantity = Column(Float, default=0)

    indent = relationship("Indent", back_populates="items")
    material = relationship("Material")


# == Audit Log ==

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer)
    old_values = Column(Text)
    new_values = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User")

class IndentApproval(Base):
    __tablename__ = "indent_approvals"
    id = Column(Integer, primary_key=True, index=True)
    indent_id = Column(Integer, ForeignKey("indents.id", ondelete="CASCADE"), nullable=False)
    approval_flow_id = Column(Integer, ForeignKey("approval_flows.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_at = Column(DateTime, default=datetime.utcnow)
    
    indent = relationship("Indent")
    flow = relationship("ApprovalFlow")
    approver = relationship("User")


# == Quotation Management ==

class QuotationRequest(Base):
    __tablename__ = "quotation_requests"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    qr_number = Column(String(50), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    required_date = Column(Date, nullable=True)
    remarks = Column(Text)
    status = Column(String(50), default=QuotationRequestStatus.DRAFT.value)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("QuotationRequestItem", back_populates="quotation_request", cascade="all, delete-orphan")
    linked_prs = relationship("QuotationRequestPR", back_populates="quotation_request", cascade="all, delete-orphan")
    invited_vendors = relationship("QuotationRequestVendor", back_populates="quotation_request", cascade="all, delete-orphan")
    vendor_quotations = relationship("VendorQuotation", back_populates="quotation_request", cascade="all, delete-orphan")
    comparisons = relationship("QuotationComparison", back_populates="quotation_request", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "qr_number", name="uq_qr_per_tenant"),)


class QuotationRequestItem(Base):
    __tablename__ = "quotation_request_items"
    id = Column(Integer, primary_key=True, index=True)
    qr_id = Column(Integer, ForeignKey("quotation_requests.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # Total consolidated quantity
    # Legacy columns kept for backward compat (deprecated)
    source = Column(String(20), default="Manual")
    source_pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=True)

    quotation_request = relationship("QuotationRequest", back_populates="items")
    material = relationship("Material")
    source_pr = relationship("PurchaseRequest", foreign_keys=[source_pr_id])
    sources = relationship("QuotationRequestItemSource", back_populates="qr_item", cascade="all, delete-orphan")


class QuotationRequestItemSource(Base):
    __tablename__ = "quotation_request_item_sources"
    id = Column(Integer, primary_key=True, index=True)
    qr_item_id = Column(Integer, ForeignKey("quotation_request_items.id", ondelete="CASCADE"), nullable=False)
    source = Column(String(20), nullable=False)         # "PR" or "Manual"
    source_pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=True)
    quantity = Column(Float, nullable=False)             # Qty contributed by this source

    qr_item = relationship("QuotationRequestItem", back_populates="sources")
    source_pr = relationship("PurchaseRequest", foreign_keys=[source_pr_id])



class QuotationRequestPR(Base):
    __tablename__ = "quotation_request_prs"
    id = Column(Integer, primary_key=True, index=True)
    qr_id = Column(Integer, ForeignKey("quotation_requests.id", ondelete="CASCADE"), nullable=False)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=False)

    quotation_request = relationship("QuotationRequest", back_populates="linked_prs")
    purchase_request = relationship("PurchaseRequest")
    __table_args__ = (UniqueConstraint("qr_id", "pr_id", name="uq_qr_pr"),)


class QuotationRequestVendor(Base):
    __tablename__ = "quotation_request_vendors"
    id = Column(Integer, primary_key=True, index=True)
    qr_id = Column(Integer, ForeignKey("quotation_requests.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    is_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)

    quotation_request = relationship("QuotationRequest", back_populates="invited_vendors")
    vendor = relationship("Vendor")
    __table_args__ = (UniqueConstraint("qr_id", "vendor_id", name="uq_qr_vendor"),)


class VendorQuotation(Base):
    __tablename__ = "vendor_quotations"
    id = Column(Integer, primary_key=True, index=True)
    qr_id = Column(Integer, ForeignKey("quotation_requests.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    quotation_number = Column(String(100))
    quotation_date = Column(Date, nullable=True)
    received_date = Column(Date, nullable=True)
    attachment_path = Column(String(500), nullable=True)
    remarks = Column(Text)
    status = Column(String(50), default=VendorQuotationStatus.RECEIVED.value)
    entered_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    quotation_request = relationship("QuotationRequest", back_populates="vendor_quotations")
    vendor = relationship("Vendor")
    entered_by = relationship("User", foreign_keys=[entered_by_id])
    items = relationship("VendorQuotationItem", back_populates="vendor_quotation", cascade="all, delete-orphan")


class VendorQuotationItem(Base):
    __tablename__ = "vendor_quotation_items"
    id = Column(Integer, primary_key=True, index=True)
    vendor_quotation_id = Column(Integer, ForeignKey("vendor_quotations.id", ondelete="CASCADE"), nullable=False)
    qr_item_id = Column(Integer, ForeignKey("quotation_request_items.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quoted_rate = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=True)
    remarks = Column(Text)

    vendor_quotation = relationship("VendorQuotation", back_populates="items")
    qr_item = relationship("QuotationRequestItem")
    material = relationship("Material")


class QuotationComparison(Base):
    __tablename__ = "quotation_comparisons"
    id = Column(Integer, primary_key=True, index=True)
    qr_id = Column(Integer, ForeignKey("quotation_requests.id", ondelete="CASCADE"), nullable=False)
    qr_item_id = Column(Integer, ForeignKey("quotation_request_items.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    selected_vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    auto_rank_vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    is_overridden = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    quotation_request = relationship("QuotationRequest", back_populates="comparisons")
    qr_item = relationship("QuotationRequestItem")
    material = relationship("Material")
    selected_vendor = relationship("Vendor", foreign_keys=[selected_vendor_id])
    auto_rank_vendor = relationship("Vendor", foreign_keys=[auto_rank_vendor_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    __table_args__ = (UniqueConstraint("qr_id", "qr_item_id", name="uq_comparison_per_qr_item"),)

