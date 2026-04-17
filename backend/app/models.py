"""SQLAlchemy ORM models for NissiGrid Smart Stores."""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, Date,
    ForeignKey, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ── Enums ────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    PURCHASE_MANAGER = "Purchase Manager"
    STORE_KEEPER = "Store Keeper"
    SECURITY = "Security"
    ENGINEER = "Engineer"
    MANAGEMENT = "Management"


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


# ── Users ────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.ENGINEER.value)
    is_active = Column(Boolean, default=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


# ── Organization Structure ───────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    users = relationship("User", back_populates="organization")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    location = Column(String(255))
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(50), default="Active")
    budget = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="projects")
    blocks = relationship("Block", back_populates="project", cascade="all, delete-orphan")
    warehouses = relationship("Warehouse", back_populates="project", cascade="all, delete-orphan")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    block_type = Column(String(100))  # Tower, Wing, Building, etc.
    floors = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="blocks")


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    warehouse_type = Column(String(100))  # Main, Civil, Electrical, etc.
    location = Column(String(255))
    capacity = Column(String(100))
    manager_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="warehouses")
    current_stocks = relationship("CurrentStock", back_populates="warehouse")


# ── Master Data ──────────────────────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    subcategories = relationship("SubCategory", back_populates="category", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="category")


class SubCategory(Base):
    __tablename__ = "subcategories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    category = relationship("Category", back_populates="subcategories")


class UOM(Base):
    __tablename__ = "uom"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    abbreviation = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
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
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="materials")
    subcategory = relationship("SubCategory")
    uom = relationship("UOM")
    preferred_vendor = relationship("Vendor", foreign_keys=[preferred_vendor_id])


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor_categories = relationship("VendorCategory", back_populates="vendor", cascade="all, delete-orphan")


class VendorCategory(Base):
    __tablename__ = "vendor_categories"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    vendor = relationship("Vendor", back_populates="vendor_categories")
    category = relationship("Category")

    __table_args__ = (
        UniqueConstraint('vendor_id', 'category_id', name='uq_vendor_category'),
    )


# ── Procurement ──────────────────────────────────────────────────────────

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    pr_number = Column(String(50), unique=True, nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    required_for_block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    required_date = Column(Date, nullable=False)
    remarks = Column(Text)
    status = Column(String(50), default=PRStatus.DRAFT.value)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    block = relationship("Block")
    project = relationship("Project")
    items = relationship("PurchaseRequestItem", back_populates="purchase_request", cascade="all, delete-orphan")


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
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=True)
    total_amount = Column(Float, default=0)
    delivery_date = Column(Date)
    status = Column(String(50), default=POStatus.DRAFT.value)
    terms = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor")
    project = relationship("Project")
    purchase_request = relationship("PurchaseRequest")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approver = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")


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


# ── Security Gate Entry ──────────────────────────────────────────────────

class GateEntry(Base):
    __tablename__ = "gate_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_number = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_number = Column(String(50))
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    arrival_time = Column(DateTime, default=datetime.utcnow)
    driver_name = Column(String(255))
    driver_phone = Column(String(20))
    photo_url = Column(String(500))
    remarks = Column(Text)
    status = Column(String(50), default=GateEntryStatus.CREATED.value)
    recorded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("Vendor")
    purchase_order = relationship("PurchaseOrder")
    project = relationship("Project")
    material = relationship("Material")
    recorded_by = relationship("User")


# ── Goods Receipt Note ───────────────────────────────────────────────────

class GRN(Base):
    __tablename__ = "grn"

    id = Column(Integer, primary_key=True, index=True)
    grn_number = Column(String(50), unique=True, nullable=False, index=True)
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
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    purchase_order = relationship("PurchaseOrder")
    gate_entry = relationship("GateEntry")
    warehouse = relationship("Warehouse")
    project = relationship("Project")
    vendor = relationship("Vendor")
    received_by = relationship("User")
    items = relationship("GRNItem", back_populates="grn", cascade="all, delete-orphan")


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


# ── Material Issue ───────────────────────────────────────────────────────

class MaterialIssue(Base):
    __tablename__ = "material_issues"

    id = Column(Integer, primary_key=True, index=True)
    issue_number = Column(String(50), unique=True, nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    issued_to_block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    issued_to_department = Column(String(255))
    issued_to_contractor = Column(String(255))
    purpose = Column(Text)
    status = Column(String(50), default=IssueStatus.DRAFT.value)
    issued_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    received_by_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    warehouse = relationship("Warehouse")
    project = relationship("Project")
    block = relationship("Block")
    issued_by = relationship("User")
    items = relationship("MaterialIssueItem", back_populates="issue", cascade="all, delete-orphan")


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


# ── Material Returns ─────────────────────────────────────────────────────

class MaterialReturn(Base):
    __tablename__ = "material_returns"

    id = Column(Integer, primary_key=True, index=True)
    return_number = Column(String(50), unique=True, nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    returned_from_block_id = Column(Integer, ForeignKey("blocks.id"), nullable=True)
    returned_from_department = Column(String(255))
    return_type = Column(String(50), default=ReturnType.UNUSED.value)
    remarks = Column(Text)
    returned_by_name = Column(String(255))
    received_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    warehouse = relationship("Warehouse")
    project = relationship("Project")
    block = relationship("Block")
    received_by = relationship("User")
    items = relationship("MaterialReturnItem", back_populates="material_return", cascade="all, delete-orphan")


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


# ── Stock Transfer ───────────────────────────────────────────────────────

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    transfer_number = Column(String(50), unique=True, nullable=False, index=True)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    status = Column(String(50), default=TransferStatus.DRAFT.value)
    remarks = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    project = relationship("Project")
    created_by = relationship("User")
    items = relationship("StockTransferItem", back_populates="transfer", cascade="all, delete-orphan")


class StockTransferItem(Base):
    __tablename__ = "stock_transfer_items"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    remarks = Column(Text)

    transfer = relationship("StockTransfer", back_populates="items")
    material = relationship("Material")


# ── Inventory ────────────────────────────────────────────────────────────

class CurrentStock(Base):
    __tablename__ = "current_stock"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Float, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    material = relationship("Material")
    warehouse = relationship("Warehouse", back_populates="current_stocks")

    __table_args__ = (
        UniqueConstraint('material_id', 'warehouse_id', name='uq_material_warehouse'),
    )


class StockLedger(Base):
    __tablename__ = "stock_ledger"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    transaction_type = Column(String(50), nullable=False)
    quantity = Column(Float, nullable=False)  # positive for in, negative for out
    balance = Column(Float, default=0)
    reference_type = Column(String(50))  # GRN, Issue, Return, Transfer
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
    created_by = relationship("User")


# ── Alerts ───────────────────────────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
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


# ── Audit Log ────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer)
    old_values = Column(Text)  # JSON string
    new_values = Column(Text)  # JSON string
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
