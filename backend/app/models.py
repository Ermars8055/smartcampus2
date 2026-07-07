"""SQLAlchemy ORM models for Eastpoint Smart Campus - Multi-Tenant SaaS."""

from datetime import datetime, date, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, Date,
    ForeignKey, Enum, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


from app.utils.tz import get_now_ist


def _get_now():
    return get_now_ist()


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
    CANCELLED = "Cancelled"
    SHORT_CLOSED = "Short Closed"

class POStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    SENT = "Sent to Vendor"
    PARTIAL = "Partially Received"
    CLOSED = "Closed"
    CANCELLED = "Cancelled"
    SHORT_CLOSED = "Short Closed"

class GateEntryStatus(str, enum.Enum):
    AWAITING_GRN = "Awaiting GRN"
    COMPLETED = "Completed"

class InvoiceStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    CHANGE_REQUIRED = "Change Required"

class InvoicePaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    SENT_FOR_PAYMENT = "Sent for Payment"
    PAID = "Paid"

class GRNStatus(str, enum.Enum):
    DRAFT = "Draft"
    COMPLETED = "Completed"

class ReceiptType(str, enum.Enum):
    PO_BASED = "PO-Based"
    DIRECT_INVOICE = "Direct Invoice"

class PaymentStatus(str, enum.Enum):
    NOT_APPLICABLE = "Not Applicable"
    PENDING = "Pending"
    APPROVED = "Approved"
    PAID = "Paid"

class IssueStatus(str, enum.Enum):
    DRAFT = "Draft"
    ISSUED = "Issued"

class ReturnType(str, enum.Enum):
    UNUSED = "Unused"
    DAMAGED = "Damaged"

class TransferStatus(str, enum.Enum):
    DRAFT = "Draft"
    INITIATED = "Initiated"
    PARTIALLY_RECEIVED = "Partially Received"
    COMPLETED = "Completed"

class WriteOffStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class TransactionType(str, enum.Enum):
    GRN = "GRN"
    ISSUE = "Issue"
    RETURN = "Return"
    TRANSFER_IN = "Transfer In"
    TRANSFER_OUT = "Transfer Out"
    ADJUSTMENT = "Adjustment"
    WRITE_OFF = "Write Off"

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
    DIRECT_INVOICE = "Direct Invoice"

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
    WRITE_OFF = "Write Off"

class QuotationRequestStatus(str, enum.Enum):
    DRAFT = "Draft"
    REQUESTED = "Requested"
    RECEIVED = "Received"
    ENTERED = "Entered"
    COMPARED = "Compared"
    APPROVED = "Approved"
    ORDERED = "Ordered"
    CANCELLED = "Cancelled"

class VendorQuotationReceiptStatus(str, enum.Enum):
    PENDING = "Pending"
    RECEIVED = "Received"
    NOT_REQUIRED = "Not Required"

class VendorQuotationStatus(str, enum.Enum):
    PENDING = "Pending"
    RECEIVED = "Received"
    REJECTED = "Rejected"

class DataAccessScope(str, enum.Enum):
    SELF_ONLY = "Self Only"
    DEPARTMENT = "Department"
    INSTITUTION = "Institution"
    ORGANIZATION = "Organization"
    ADMIN = "Full Administrative Access"

class ComplaintStatus(str, enum.Enum):
    # Legacy statuses (kept for backward compatibility)
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"
    # New lifecycle statuses
    REGISTERED = "Registered"
    ASSIGNED = "Assigned"
    UNDER_INSPECTION = "Under Inspection"
    MATERIAL_PENDING = "Material Pending"
    CLOSED = "Closed"
    REOPENED = "Reopened"


# == Multi-Tenant Core ==

class TenantConfiguration(Base):
    __tablename__ = "tenant_configurations"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, nullable=False)
    base_state = Column(String(100), nullable=False)
    cgst_share_percent = Column(Float, nullable=False)
    sgst_share_percent = Column(Float, nullable=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    tenant = relationship("Tenant")

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), default=TenantStatus.ACTIVE.value)
    subscription_plan = Column(String(50), default="basic")
    max_sites = Column(Integer, default=1)
    created_at = Column(DateTime, default=_get_now)

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    location = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_get_now)
    tenant = relationship("Tenant")
    __table_args__ = (UniqueConstraint("tenant_id", "name", name="uq_site_per_tenant"),)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    institution = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_platform_admin = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    otp = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=_get_now)
    user = relationship("User")

class TenantMembership(Base):
    __tablename__ = "tenant_memberships"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime, default=_get_now)
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
    data_access_scope = Column(String(50), default=DataAccessScope.SELF_ONLY.value)
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
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
    extended_actions = Column(JSON, default=dict)
    role = relationship("Role", back_populates="permissions")
    __table_args__ = (UniqueConstraint("role_id", "resource", name="uq_role_resource"),)

class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=True)
    assigned_at = Column(DateTime, default=_get_now)
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
    created_at = Column(DateTime, default=_get_now)
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
    created_at = Column(DateTime, default=_get_now)
    organization = relationship("Organization", back_populates="projects")
    institutions = relationship("Institution", back_populates="project", cascade="all, delete-orphan")
    buildings = relationship("Building", back_populates="project", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="project", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_proj_code_per_tenant"),)

class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    project = relationship("Project", back_populates="institutions")
    buildings = relationship("Building", back_populates="institution", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_inst_code_per_tenant"),)

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    department_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    project = relationship("Project", back_populates="buildings")
    institution = relationship("Institution", back_populates="buildings")
    floors = relationship("Floor", back_populates="building", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="building", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    accounting_code = Column(String(100))  # For Tally / ERP integration
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    building = relationship("Building", back_populates="departments")
    __table_args__ = (UniqueConstraint("tenant_id", "institution_id", "name", name="uq_dept_per_institution"),)

class Floor(Base):
    __tablename__ = "floors"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False) # e.g. "Ground Floor", "1st Floor"
    level = Column(Integer, default=0)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    department_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    building = relationship("Building", back_populates="floors")
    rooms = relationship("Room", back_populates="floor", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    department_name = Column(String(255)) # Store department directly on room
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    floor = relationship("Floor", back_populates="rooms")

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
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    project = relationship("Project", back_populates="warehouses")
    manager = relationship("User")
    current_stocks = relationship("CurrentStock", back_populates="warehouse")
    __table_args__ = (UniqueConstraint("tenant_id", "code", name="uq_wh_code_per_tenant"),)


# == Master Data ==

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    sequence_number = Column(Integer)
    code = Column(String(50))
    material_code_prefix = Column(String(3), nullable=True)
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
    allow_decimal = Column(Boolean, default=False)
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
    alias = Column(String(500), nullable=True)
    reference_no = Column(String(50), nullable=True, index=True)
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
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    category = relationship("Category", back_populates="materials")
    subcategory = relationship("SubCategory")
    uom = relationship("UOM")
    warehouse = relationship("Warehouse")
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
    address_line_1 = Column(Text)
    address_line_2 = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    bank_name = Column(String(100))
    bank_account = Column(String(50))
    ifsc_code = Column(String(20))
    rating = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
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
    required_for_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    department_name = Column(String(255), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    required_date = Column(Date, nullable=False)
    remarks = Column(Text)
    status = Column(String(50), default=PRStatus.DRAFT.value)
    current_approval_level = Column(Integer, default=1)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    room = relationship("Room")
    building = relationship("Building")
    project = relationship("Project")
    items = relationship("PurchaseRequestItem", back_populates="purchase_request", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "pr_number", name="uq_pr_per_tenant"),)

class PurchaseRequestItem(Base):
    __tablename__ = "purchase_request_items"
    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # requested quantity
    approved_quantity = Column(Float, nullable=True)
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
    qr_id = Column(Integer, ForeignKey("quotation_requests.id"), nullable=True)
    po_type = Column(String(50), default="Formal") # Formal, Informal
    total_amount = Column(Float, default=0)
    delivery_date = Column(Date)
    status = Column(String(50), default=POStatus.DRAFT.value)
    current_approval_level = Column(Integer, default=1)
    terms = Column(Text)
    remarks = Column(Text, nullable=True)
    annexure = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    vendor = relationship("Vendor")
    project = relationship("Project")
    purchase_request = relationship("PurchaseRequest")
    indent = relationship("Indent")
    quotation_request = relationship("QuotationRequest")
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
    approved_quantity = Column(Float, nullable=True)
    discount_percent = Column(Float, default=0)
    cgst_percentage = Column(Float, default=0)
    sgst_percentage = Column(Float, default=0)
    igst_percentage = Column(Float, default=0)
    is_gst_inclusive = Column(Boolean, default=False)
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
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    quantity = Column(Float, nullable=True)
    arrival_time = Column(DateTime, default=_get_now)
    driver_name = Column(String(255))
    driver_phone = Column(String(20))
    delivery_person_name = Column(String(255))
    entry_type = Column(String(50), default=GateEntryType.VEHICLE.value)
    photo_url = Column(String(500))
    invoice_scan_url = Column(String(500))  # Scanned invoice attachment
    invoice_number = Column(String(100))
    invoice_date = Column(Date)
    invoice_amount = Column(Float, default=0)
    remarks = Column(Text)
    status = Column(String(50), default=GateEntryStatus.AWAITING_GRN.value)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    vendor = relationship("Vendor")
    purchase_order = relationship("PurchaseOrder")
    project = relationship("Project")
    material = relationship("Material")
    recorded_by = relationship("User", foreign_keys=[recorded_by_id])
    __table_args__ = (UniqueConstraint("tenant_id", "entry_number", name="uq_ge_per_tenant"),)


# == Company Addresses ==

class CompanyAddress(Base):
    __tablename__ = "company_addresses"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    address_type = Column(String(50), default="Billing")
    contact_person = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    gst_number = Column(String(20))
    pan_number = Column(String(15))
    address = Column(Text, nullable=False)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    bank_name = Column(String(100))
    bank_account = Column(String(50))
    ifsc_code = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    __table_args__ = (UniqueConstraint("tenant_id", "site_id", "name", "address_type", name="uq_company_addr_per_site"),)


# == Maintenance & Complaints ==

class Complaint(Base):
    __tablename__ = "complaints"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    docket_no = Column(String(50), nullable=False, index=True)
    complaint_date = Column(Date, nullable=False)
    complaint_time = Column(String(20), nullable=True)
    department_name = Column(String(255), nullable=True) # Name of Ward/Dept I/C or Occupant
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    location = Column(String(255), nullable=True) # General location text if not building/room
    nature_of_complaint = Column(Text, nullable=True)
    individual_detailed = Column(Text, nullable=True)
    name_and_trade = Column(String(255), nullable=True)
    
    status = Column(String(50), default=ComplaintStatus.REGISTERED.value)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_remarks = Column(Text, nullable=True)
    
    # New workflow fields
    material_required = Column(Boolean, default=False)
    inspection_details = Column(Text, nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rejection_remarks = Column(Text, nullable=True)
    feedback = Column(Text, nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resolved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    resolved_at = Column(DateTime, nullable=True)
    
    building = relationship("Building")
    room = relationship("Room")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    resolved_by = relationship("User", foreign_keys=[resolved_by_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    images = relationship("ComplaintImage", back_populates="complaint", cascade="all, delete-orphan")
    material_issues = relationship("MaterialIssue", back_populates="complaint")
    __table_args__ = (UniqueConstraint("tenant_id", "docket_no", name="uq_complaint_docket_per_tenant"),)


class ComplaintImage(Base):
    __tablename__ = "complaint_images"
    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    is_resolution_image = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=_get_now)
    
    complaint = relationship("Complaint", back_populates="images")


# == Invoices ==

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False, index=True)
    invoice_number = Column(String(100), nullable=False, index=True)
    invoice_date = Column(Date, nullable=False)
    gate_entry_id = Column(Integer, ForeignKey("gate_entries.id"), nullable=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    consignee_id = Column(Integer, ForeignKey("company_addresses.id"), nullable=True)
    buyer_id = Column(Integer, ForeignKey("company_addresses.id"), nullable=True)
    internal_reference_number = Column(String(100), nullable=True)
    srf_number = Column(String(100), nullable=True)
    irn = Column(Text, nullable=True)
    ack_number = Column(String(100), nullable=True)
    ack_date = Column(Date, nullable=True)
    
    eway_bill_number = Column(String(100))
    delivery_note = Column(String(100))
    delivery_note_date = Column(Date)
    payment_terms = Column(String(255))
    reference_number = Column(String(100))
    reference_date = Column(Date)
    dispatch_doc_number = Column(String(100))
    dispatched_through = Column(String(100))
    destination = Column(String(255))
    lr_rr_number = Column(String(100))
    vehicle_number = Column(String(50))
    terms_of_delivery = Column(Text)
    
    total_taxable_amount = Column(Float, default=0)
    total_cgst = Column(Float, default=0)
    total_sgst = Column(Float, default=0)
    total_igst = Column(Float, default=0)
    total_discount = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    transport_charges = Column(Float, default=0)
    transport_hsn = Column(String(50))
    transport_cgst_rate = Column(Float, default=0)
    transport_sgst_rate = Column(Float, default=0)
    transport_igst_rate = Column(Float, default=0)
    transport_discount_percent = Column(Float, default=0)
    
    status = Column(String(50), default=InvoiceStatus.DRAFT.value)
    scan_url = Column(String(500))
    remarks = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)

    # Finance fields
    payment_status = Column(String(50), default=InvoicePaymentStatus.PENDING.value)
    sent_for_payment_at = Column(DateTime, nullable=True)
    sent_for_payment_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    hard_copy_sent = Column(Boolean, default=False)
    hard_copy_sent_at = Column(DateTime, nullable=True)
    hard_copy_sent_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    hard_copy_received = Column(Boolean, default=False)
    hard_copy_received_at = Column(DateTime, nullable=True)
    hard_copy_received_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    hard_copy_remarks = Column(Text, nullable=True)
    payment_completed_at = Column(DateTime, nullable=True)
    payment_completed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    payment_reference = Column(String(255), nullable=True)

    gate_entry = relationship("GateEntry")
    vendor = relationship("Vendor")
    purchase_order = relationship("PurchaseOrder")
    consignee = relationship("CompanyAddress", foreign_keys=[consignee_id])
    buyer = relationship("CompanyAddress", foreign_keys=[buyer_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    sent_for_payment_by = relationship("User", foreign_keys=[sent_for_payment_by_id])
    hard_copy_sent_by = relationship("User", foreign_keys=[hard_copy_sent_by_id])
    hard_copy_received_by = relationship("User", foreign_keys=[hard_copy_received_by_id])
    payment_completed_by = relationship("User", foreign_keys=[payment_completed_by_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "invoice_number", "vendor_id", name="uq_invoice_per_vendor_tenant"),)

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    description = Column(String(255), nullable=True)
    hsn_sac = Column(String(50))
    quantity = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    uom = Column(String(50), nullable=True)
    discount_percent = Column(Float, default=0)
    cgst_rate = Column(Float, default=0)
    sgst_rate = Column(Float, default=0)
    igst_rate = Column(Float, default=0)
    cgst_amount = Column(Float, default=0)
    sgst_amount = Column(Float, default=0)
    igst_amount = Column(Float, default=0)
    taxable_amount = Column(Float, default=0)
    amount = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)
    
    invoice = relationship("Invoice", back_populates="items")
    material = relationship("Material")


# == GRN ==

class GRN(Base):
    __tablename__ = "grn"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    grn_number = Column(String(50), nullable=False, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)  # Nullable for Direct Invoice
    gate_entry_id = Column(Integer, ForeignKey("gate_entries.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    receipt_type = Column(String(50), default=ReceiptType.PO_BASED.value)  # PO-Based or Direct Invoice
    invoice_number = Column(String(100))
    invoice_date = Column(Date)
    invoice_amount = Column(Float, default=0)
    invoice_scan_url = Column(String(500))  # Scanned invoice file
    # GST fields
    vendor_gstin = Column(String(20))
    total_taxable_amount = Column(Float, default=0)
    total_cgst = Column(Float, default=0)
    total_sgst = Column(Float, default=0)
    total_igst = Column(Float, default=0)
    total_tax = Column(Float, default=0)
    eway_bill_number = Column(String(50))
    payment_status = Column(String(50), default=PaymentStatus.NOT_APPLICABLE.value)
    status = Column(String(50), default=GRNStatus.DRAFT.value)
    remarks = Column(Text)
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    completed_at = Column(DateTime, nullable=True)
    purchase_order = relationship("PurchaseOrder")
    gate_entry = relationship("GateEntry")
    invoice = relationship("Invoice")
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
    # GST per line item
    hsn_code = Column(String(20))
    cgst_rate = Column(Float, default=0)
    sgst_rate = Column(Float, default=0)
    igst_rate = Column(Float, default=0)
    cgst_amount = Column(Float, default=0)
    sgst_amount = Column(Float, default=0)
    igst_amount = Column(Float, default=0)
    taxable_amount = Column(Float, default=0)
    discount_percent = Column(Float, default=0)
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
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    issued_to_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
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
    created_at = Column(DateTime, default=_get_now)
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    building = relationship("Building")
    room = relationship("Room")
    indent = relationship("Indent")
    complaint = relationship("Complaint", back_populates="material_issues")
    issued_by = relationship("User", foreign_keys=[issued_by_id])
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
    items = relationship("MaterialIssueItem", back_populates="issue", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "issue_number", name="uq_issue_per_tenant"),)

class MaterialIssueItem(Base):
    __tablename__ = "material_issue_items"
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("material_issues.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    rate = Column(Float, default=0)
    remarks = Column(Text)
    issue = relationship("MaterialIssue", back_populates="items")
    material = relationship("Material")
    warehouse = relationship("Warehouse")

class MaterialReturn(Base):
    __tablename__ = "material_returns"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    return_number = Column(String(50), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    returned_from_room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    returned_from_department = Column(String(255))
    return_type = Column(String(50), default=ReturnType.UNUSED.value)
    remarks = Column(Text)
    returned_by_name = Column(String(255))
    status = Column(String(50), default="Pending Receipt")
    received_date = Column(DateTime, nullable=True)
    initiated_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    room = relationship("Room")
    received_by = relationship("User", foreign_keys=[received_by_id])
    initiated_by = relationship("User", foreign_keys=[initiated_by_id])
    items = relationship("MaterialReturnItem", back_populates="material_return", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "return_number", name="uq_ret_per_tenant"),)

class MaterialReturnItem(Base):
    __tablename__ = "material_return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("material_returns.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    returned_qty = Column(Float, nullable=False)
    received_qty = Column(Float, nullable=True)
    variance_qty = Column(Float, nullable=True)
    receipt_remarks = Column(Text, nullable=True)
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
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    completed_at = Column(DateTime, nullable=True)
    received_date = Column(DateTime, nullable=True)
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    project = relationship("Project")
    created_by = relationship("User", foreign_keys=[created_by_id])
    received_by = relationship("User", foreign_keys=[received_by_id])
    items = relationship("StockTransferItem", back_populates="transfer", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "transfer_number", name="uq_trf_per_tenant"),)

class StockTransferItem(Base):
    __tablename__ = "stock_transfer_items"
    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    received_qty = Column(Float, nullable=True)
    variance_qty = Column(Float, nullable=True)
    receipt_remarks = Column(Text, nullable=True)
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
    last_updated = Column(DateTime, default=_get_now, onupdate=_get_now)
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
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    remarks = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=_get_now)
    material = relationship("Material")
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    room = relationship("Room")
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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    resolved_at = Column(DateTime, nullable=True)
    project = relationship("Project")
    user = relationship("User", foreign_keys=[user_id])


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
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=True)
    floor = Column(String(50))
    location = Column(String(255))
    department = Column(String(255))
    remarks = Column(Text)
    total_amount = Column(Float, default=0)
    status = Column(String(50), default=IndentStatus.DRAFT.value)
    current_approval_level = Column(Integer, default=1)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)

    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    institution = relationship("Institution")
    building = relationship("Building")
    room = relationship("Room")
    items = relationship("IndentItem", back_populates="indent", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "indent_number", name="uq_indent_per_tenant"),)

class IndentItem(Base):
    __tablename__ = "indent_items"
    id = Column(Integer, primary_key=True, index=True)
    indent_id = Column(Integer, ForeignKey("indents.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    requested_quantity = Column(Float, nullable=False)
    approved_quantity = Column(Float, nullable=True)
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
    created_at = Column(DateTime, default=_get_now)
    user = relationship("User")

class IndentApproval(Base):
    __tablename__ = "indent_approvals"
    id = Column(Integer, primary_key=True, index=True)
    indent_id = Column(Integer, ForeignKey("indents.id", ondelete="CASCADE"), nullable=False)
    approval_flow_id = Column(Integer, ForeignKey("approval_flows.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_quantities = Column(JSON, default=dict)
    remarks = Column(Text, nullable=True)
    approved_at = Column(DateTime, default=_get_now)
    
    indent = relationship("Indent")
    flow = relationship("ApprovalFlow")
    approver = relationship("User")


class PurchaseRequestApproval(Base):
    __tablename__ = "purchase_request_approvals"
    id = Column(Integer, primary_key=True, index=True)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id", ondelete="CASCADE"), nullable=False)
    approval_flow_id = Column(Integer, ForeignKey("approval_flows.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_quantities = Column(JSON, default=dict)
    remarks = Column(Text, nullable=True)
    approved_at = Column(DateTime, default=_get_now)
    
    purchase_request = relationship("PurchaseRequest")
    flow = relationship("ApprovalFlow")
    approver = relationship("User")


class PurchaseOrderApproval(Base):
    __tablename__ = "purchase_order_approvals"
    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    approval_flow_id = Column(Integer, ForeignKey("approval_flows.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_quantities = Column(JSON, default=dict)
    remarks = Column(Text, nullable=True)
    approved_at = Column(DateTime, default=_get_now)
    
    purchase_order = relationship("PurchaseOrder")
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
    approval_remarks = Column(Text, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)

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
    receipt_status = Column(String(50), default=VendorQuotationReceiptStatus.PENDING.value)

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
    created_at = Column(DateTime, default=_get_now)

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
    is_excluded = Column(Boolean, default=False)
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


# == Document Sequences ==

class DocumentSequence(Base):
    """Atomic sequence counter for all auto-generated document/master codes."""
    __tablename__ = "document_sequences"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), nullable=False)
    prefix = Column(String(20), nullable=False)
    current_number = Column(Integer, default=0, nullable=False)
    __table_args__ = (
        UniqueConstraint("tenant_id", "site_id", "document_type", name="uq_doc_seq"),
    )


class TermsAndConditions(Base):
    __tablename__ = "terms_and_conditions"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_get_now)
    
    tenant = relationship("Tenant")
    site = relationship("Site")


class GatePass(Base):
    __tablename__ = "gate_passes"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    gate_pass_number = Column(String(50), nullable=False, index=True)
    return_id = Column(Integer, ForeignKey("material_returns.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True)
    vendor_custom_name = Column(String(255), nullable=True)
    vendor_custom_address = Column(Text, nullable=True)
    from_department = Column(String(255), nullable=True)
    from_store = Column(String(255), nullable=True)
    status = Column(String(50), default="Pending Repair")
    gate_pass_type = Column(String(50), default="Outward Repair")
    reason_code = Column(String(50), nullable=True)
    driver_name = Column(String(255), nullable=True)
    vehicle_number = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    gate_entry_number = Column(String(100), nullable=True)
    grn_number = Column(String(100), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_get_now)
    completed_by_name = Column(String(255), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    tenant = relationship("Tenant")
    site = relationship("Site")
    project = relationship("Project")
    vendor = relationship("Vendor")
    created_by = relationship("User")
    material_return = relationship("MaterialReturn")
    items = relationship("GatePassItem", back_populates="gate_pass", cascade="all, delete-orphan")


class GatePassItem(Base):
    __tablename__ = "gate_pass_items"
    id = Column(Integer, primary_key=True, index=True)
    gate_pass_id = Column(Integer, ForeignKey("gate_passes.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)
    
    gate_pass = relationship("GatePass", back_populates="items")
    material = relationship("Material")


class DepartmentMaterialLimit(Base):
    __tablename__ = "department_material_limits"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    department = Column(String(255), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    monthly_limit = Column(Float, nullable=False)
    created_at = Column(DateTime, default=_get_now)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    tenant = relationship("Tenant")
    site = relationship("Site")
    material = relationship("Material")
    created_by = relationship("User")
    __table_args__ = (UniqueConstraint("tenant_id", "site_id", "department", "material_id", name="uq_dept_mat_limit"),)


class WriteOff(Base):
    __tablename__ = "write_offs"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    write_off_number = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    write_off_type = Column(String(100), nullable=True)
    attachment_url = Column(String(500), nullable=True)
    status = Column(String(50), default="Draft")
    current_approval_level = Column(Integer, default=1)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_get_now)
    updated_at = Column(DateTime, default=_get_now, onupdate=_get_now)
    
    tenant = relationship("Tenant")
    site = relationship("Site")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("WriteOffItem", back_populates="write_off", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("tenant_id", "write_off_number", name="uq_write_off_per_tenant"),)


class WriteOffItem(Base):
    __tablename__ = "write_off_items"
    id = Column(Integer, primary_key=True, index=True)
    write_off_id = Column(Integer, ForeignKey("write_offs.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    quantity = Column(Float, nullable=False)
    rate = Column(Float, default=0)
    amount = Column(Float, default=0)
    
    write_off = relationship("WriteOff", back_populates="items")
    material = relationship("Material")
    warehouse = relationship("Warehouse")
