"""NissiGrid Smart Campus - Pydantic schemas."""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# ── Auth & Users ─────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    roles: List[str] = []
    full_name: str
    tenant_id: Optional[int] = None
    site_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    tenant_id: Optional[int] = None
    site_id: Optional[int] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    is_active: bool = True
    is_platform_admin: bool = False

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    role_name: Optional[str] = None
    tenant_name: Optional[str] = None
    class Config:
        from_attributes = True

# ── RBAC ─────────────────────────────────────────────────────────────────

class RolePermissionBase(BaseModel):
    resource: str
    can_read: bool = False
    can_create: bool = False
    can_update: bool = False
    can_delete: bool = False

class RolePermissionOut(RolePermissionBase):
    id: int
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permissions: List[RolePermissionBase] = []

class RoleOut(RoleBase):
    id: int
    permissions: List[RolePermissionOut] = []
    class Config:
        from_attributes = True

# ── Multi-tenancy ────────────────────────────────────────────────────────

class TenantBase(BaseModel):
    name: str
    slug: str
    subscription_plan: str = "basic"
    max_sites: int = 1

class TenantCreate(BaseModel):
    name: str
    subscription_type: str = "basic"
    is_active: bool = True

class SiteConfigCreate(BaseModel):
    name: str
    location: str
    is_active: bool = True

class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str

class TenantProvisionCreate(BaseModel):
    tenant: TenantCreate
    site: SiteConfigCreate
    admin: AdminUserCreate

class TenantOut(TenantBase):
    id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class SiteBase(BaseModel):
    name: str
    code: str
    location: Optional[str] = None

class SiteCreate(SiteBase):
    tenant_id: int

class SiteOut(SiteBase):
    id: int
    tenant_id: int
    class Config:
        from_attributes = True

# ── Master Data ──────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class SubCategoryBase(BaseModel):
    name: str
    category_id: int

class SubCategoryCreate(SubCategoryBase):
    pass

class SubCategoryOut(SubCategoryBase):
    id: int
    category_name: Optional[str] = None
    is_active: bool = True
    class Config:
        from_attributes = True

class UOMBase(BaseModel):
    name: str
    abbreviation: str

class UOMCreate(UOMBase):
    pass

class UOMOut(UOMBase):
    id: int
    class Config:
        from_attributes = True

class MaterialBase(BaseModel):
    code: str
    name: str
    category_id: int
    subcategory_id: Optional[int] = None
    uom_id: int
    material_type: str = "Consumable"
    reorder_level: float = 0
    maximum_level: Optional[float] = None
    standard_cost: float = 0
    preferred_vendor_id: Optional[int] = None
    storage_type: Optional[str] = None
    hsn_code: Optional[str] = None
    gst_rate: float = 0
    description: Optional[str] = None

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    uom_id: Optional[int] = None
    material_type: Optional[str] = None
    reorder_level: Optional[float] = None
    maximum_level: Optional[float] = None
    standard_cost: Optional[float] = None
    preferred_vendor_id: Optional[int] = None
    storage_type: Optional[str] = None
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class MaterialOut(MaterialBase):
    id: int
    is_active: bool
    created_at: datetime
    category_name: Optional[str] = None
    subcategory_name: Optional[str] = None
    uom_name: Optional[str] = None
    vendor_name: Optional[str] = None
    current_stock: Optional[float] = 0
    class Config:
        from_attributes = True

class VendorBase(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    rating: float = 0

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    rating: Optional[float] = None
    is_active: Optional[bool] = None

class VendorOut(VendorBase):
    id: int
    class Config:
        from_attributes = True

class OrganizationBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    id: int
    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str
    code: str
    organization_id: int
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: int
    status: str
    organization_name: Optional[str] = None
    class Config:
        from_attributes = True

class BlockBase(BaseModel):
    name: str
    code: str
    project_id: int
    block_type: str = "Building"
    block_number: Optional[str] = None
    floors: int = 1
    rooms: int = 0

class BlockCreate(BlockBase):
    pass

class BlockOut(BlockBase):
    id: int
    project_name: Optional[str] = None
    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    name: str
    code: str
    project_id: int
    warehouse_type: str = "Main"
    location: Optional[str] = None
    manager_id: Optional[int] = None

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseOut(WarehouseBase):
    id: int
    project_name: Optional[str] = None
    manager_name: Optional[str] = None
    class Config:
        from_attributes = True

# ── Procurement ──────────────────────────────────────────────────────────

class PRItemBase(BaseModel):
    material_id: int
    quantity: float = Field(..., gt=0, description="Quantity must be positive")

class PRItemOut(PRItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class PRBase(BaseModel):
    project_id: int
    required_date: Optional[date] = None
    priority: str = "Normal"
    remarks: Optional[str] = None
    required_for_block_id: Optional[int] = None
    items: List[PRItemBase] = []

class PRCreate(PRBase):
    pass

class PRUpdate(BaseModel):
    required_date: Optional[date] = None
    priority: Optional[str] = None
    remarks: Optional[str] = None
    required_for_block_id: Optional[int] = None
    status: Optional[str] = None

class PROut(PRBase):
    id: int
    pr_number: str
    requester_id: int
    status: str
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    requester_name: Optional[str] = None
    block_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[PRItemOut] = []
    class Config:
        from_attributes = True

class POItemBase(BaseModel):
    material_id: int
    quantity: float = Field(..., gt=0, description="Quantity must be positive")
    rate: float = Field(..., ge=0, description="Rate cannot be negative")

class POItemOut(POItemBase):
    id: int
    amount: float
    received_quantity: float
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class POBase(BaseModel):
    vendor_id: int
    project_id: int
    pr_id: Optional[int] = None
    indent_id: Optional[int] = None
    po_type: str = "Formal"
    delivery_date: Optional[date] = None
    terms: Optional[str] = None
    items: List[POItemBase] = []

class POCreate(POBase):
    pass

class POUpdate(BaseModel):
    delivery_date: Optional[date] = None
    status: Optional[str] = None
    terms: Optional[str] = None

class POOut(BaseModel):
    id: int
    po_number: str
    vendor_id: int
    project_id: int
    pr_id: Optional[int] = None
    pr_number: Optional[str] = None
    indent_id: Optional[int] = None
    indent_number: Optional[str] = None
    po_type: str = "Formal"
    total_amount: float
    delivery_date: Optional[date] = None
    status: str
    terms: Optional[str] = None
    created_at: datetime
    vendor_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[POItemOut] = []
    class Config:
        from_attributes = True


# ── Gate Entry ───────────────────────────────────────────────────────────

class GateEntryBase(BaseModel):
    entry_type: str = "Vehicle"
    vehicle_number: Optional[str] = None
    vendor_id: Optional[int] = None
    po_id: Optional[int] = None
    project_id: int
    material_id: int
    quantity: float
    driver_name: Optional[str] = None
    delivery_person_name: Optional[str] = None
    driver_phone: Optional[str] = None
    gate_pass_number: Optional[str] = None
    remarks: Optional[str] = None

class GateEntryCreate(GateEntryBase):
    pass

class GateEntryOut(GateEntryBase):
    id: int
    entry_number: str
    status: str
    created_at: datetime
    entry_type: str
    delivery_person_name: Optional[str] = None
    vendor_name: Optional[str] = None
    po_number: Optional[str] = None
    project_name: Optional[str] = None
    class Config:
        from_attributes = True


# ── GRN ──────────────────────────────────────────────────────────────────

class GRNItemBase(BaseModel):
    po_item_id: int
    received_quantity: float = Field(..., gt=0)
    accepted_quantity: float = Field(..., gt=0)
    rejected_quantity: float = 0
    rejection_reason: Optional[str] = None

class GRNItemOut(BaseModel):
    id: int
    material_id: int
    received_quantity: float
    accepted_quantity: float
    rejected_quantity: float
    rate: float
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class GRNBase(BaseModel):
    po_id: int
    warehouse_id: int
    gate_entry_id: Optional[int] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_amount: float = 0
    remarks: Optional[str] = None
    items: List[GRNItemBase] = []

class GRNCreate(GRNBase):
    pass

class GRNOut(BaseModel):
    id: int
    grn_number: str
    po_id: int
    warehouse_id: int
    project_id: int
    vendor_id: int
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_amount: float
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    po_number: Optional[str] = None
    warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    vendor_name: Optional[str] = None
    received_by_name: Optional[str] = None
    items: List[GRNItemOut] = []
    class Config:
        from_attributes = True


# ── Material Issue ───────────────────────────────────────────────────────

class IssueItemBase(BaseModel):
    material_id: int
    quantity: float
    rate: float = 0
    remarks: Optional[str] = None

class IssueItemOut(IssueItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class IssueBase(BaseModel):
    warehouse_id: int
    project_id: int
    indent_id: Optional[int] = None
    issued_to_block_id: Optional[int] = None
    issued_to_department: Optional[str] = None
    issued_to_contractor: Optional[str] = None
    purpose: Optional[str] = None
    received_by_name: Optional[str] = None
    items: List[IssueItemBase] = []

class IssueCreate(IssueBase):
    pass

class IssueOut(BaseModel):
    id: int
    issue_number: str
    warehouse_id: int
    project_id: int
    indent_id: Optional[int] = None
    issued_to_block_id: Optional[int] = None
    issued_to_department: Optional[str] = None
    issued_to_contractor: Optional[str] = None
    purpose: Optional[str] = None
    status: str
    received_by_name: Optional[str] = None
    is_acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_id: Optional[int] = None
    acknowledgement_remarks: Optional[str] = None
    created_at: datetime
    warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    block_name: Optional[str] = None
    issued_by_name: Optional[str] = None
    items: List[IssueItemOut] = []
    class Config:
        from_attributes = True


# ── Material Return ──────────────────────────────────────────────────────

class ReturnItemBase(BaseModel):
    material_id: int
    quantity: float
    condition: str = "Good"
    remarks: Optional[str] = None

class ReturnItemOut(ReturnItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class ReturnBase(BaseModel):
    warehouse_id: int
    project_id: int
    returned_from_block_id: Optional[int] = None
    returned_from_department: Optional[str] = None
    return_type: str = "Unused"
    remarks: Optional[str] = None
    returned_by_name: Optional[str] = None
    items: List[ReturnItemBase] = []

class ReturnCreate(ReturnBase):
    pass

class ReturnOut(BaseModel):
    id: int
    return_number: str
    warehouse_id: int
    project_id: int
    returned_from_block_id: Optional[int] = None
    returned_from_department: Optional[str] = None
    return_type: str
    remarks: Optional[str] = None
    returned_by_name: Optional[str] = None
    created_at: datetime
    warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    block_name: Optional[str] = None
    items: List[ReturnItemOut] = []
    class Config:
        from_attributes = True


# ── Stock Transfer ───────────────────────────────────────────────────────

class TransferItemBase(BaseModel):
    material_id: int
    quantity: float
    remarks: Optional[str] = None

class TransferItemOut(TransferItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class TransferBase(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    project_id: int
    remarks: Optional[str] = None
    items: List[TransferItemBase] = []

class TransferCreate(TransferBase):
    pass

class TransferOut(BaseModel):
    id: int
    transfer_number: str
    from_warehouse_id: int
    to_warehouse_id: int
    project_id: int
    status: str
    remarks: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    from_warehouse_name: Optional[str] = None
    to_warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[TransferItemOut] = []
    class Config:
        from_attributes = True


# ── Inventory ────────────────────────────────────────────────────────────

class StockOut(BaseModel):
    id: int
    material_id: int
    warehouse_id: int
    quantity: float
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    category_name: Optional[str] = None
    uom_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    reorder_level: Optional[float] = 0
    maximum_level: Optional[float] = 0
    standard_cost: Optional[float] = 0
    stock_value: Optional[float] = 0
    class Config:
        from_attributes = True

class StockLedgerOut(BaseModel):
    id: int
    material_id: int
    warehouse_id: int
    transaction_type: str
    quantity: float
    balance: float
    reference_type: Optional[str] = None
    reference_number: Optional[str] = None
    created_at: datetime
    material_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    class Config:
        from_attributes = True


# ── Alerts ───────────────────────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    message: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: bool
    is_resolved: bool
    created_at: datetime
    class Config:
        from_attributes = True


# ── Dashboard ────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_materials: int = 0
    total_inventory_value: float = 0
    low_stock_items: int = 0
    pending_pr: int = 0
    pending_po: int = 0
    recent_grn_count: int = 0
    total_vendors: int = 0
    total_warehouses: int = 0

class ConsumptionByBlock(BaseModel):
    block_name: str
    total_quantity: float
    total_value: float

class StockByWarehouse(BaseModel):
    warehouse_name: str
    total_items: int
    total_value: float

class TopMaterial(BaseModel):
    material_name: str
    total_consumed: float
    uom: str

class MaterialCostByBlock(BaseModel):
    material_name: str
    block_name: str
    total_cost: float
    total_quantity: float


# ── Indent & Approval Flows ──────────────────────────────────────────────

class ApprovalFlowBase(BaseModel):
    document_type: str
    level: int
    role_name: str
    min_amount: float = 0
    max_amount: Optional[float] = None
    user_id: Optional[int] = None
    is_active: bool = True

class ApprovalFlowCreate(ApprovalFlowBase):
    pass

class ApprovalFlowOut(ApprovalFlowBase):
    id: int
    tenant_id: int
    site_id: int
    user_full_name: Optional[str] = None
    class Config:
        from_attributes = True

class IndentItemBase(BaseModel):
    material_id: int
    requested_quantity: float = Field(..., gt=0)

class IndentItemOut(IndentItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    issued_quantity: float = 0
    acknowledged_quantity: float = 0
    pending_quantity: float = 0
    current_stock: float = 0
    availability_status: str = "No Stock"
    class Config:
        from_attributes = True

class IndentBase(BaseModel):
    block_id: Optional[int] = None
    floor: Optional[str] = None
    location: Optional[str] = None
    remarks: Optional[str] = None
    total_amount: float = 0
    items: List[IndentItemBase] = []

class IndentCreate(IndentBase):
    pass

class IndentUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None

class IndentOut(BaseModel):
    id: int
    indent_number: str
    requester_id: int
    block_id: Optional[int] = None
    floor: Optional[str] = None
    location: Optional[str] = None
    remarks: Optional[str] = None
    status: str
    current_approval_level: int
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    requester_name: Optional[str] = None
    block_name: Optional[str] = None
    total_amount: float
    items: List[IndentItemOut] = []
    class Config:
        from_attributes = True

class IndentAcknowledgeItem(BaseModel):
    indent_item_id: int
    acknowledged_quantity: float = Field(..., ge=0)

class IndentAcknowledgeRequest(BaseModel):
    items: List[IndentAcknowledgeItem] = []


# ── Audit Log ────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    created_at: datetime
    user_full_name: Optional[str] = None
    class Config:
        from_attributes = True


# ── Quotation Management ─────────────────────────────────────────────────

class QRItemBase(BaseModel):
    material_id: int
    quantity: float = Field(..., gt=0)

class QRItemSourceOut(BaseModel):
    source: str                              # "PR" or "Manual"
    source_pr_number: Optional[str] = None  # e.g. "PR-2026-0001"
    quantity: float
    class Config:
        from_attributes = True

class QRItemOut(QRItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    source: Optional[str] = "Manual"          # Legacy: kept for backward compat
    source_pr_number: Optional[str] = None    # Legacy: kept for backward compat
    sources: List[QRItemSourceOut] = []       # NEW: all contributing sources
    class Config:
        from_attributes = True

class QuotationRequestCreate(BaseModel):
    project_id: int
    required_date: Optional[date] = None
    remarks: Optional[str] = None
    pr_ids: List[int] = []
    items: List[QRItemBase] = []
    vendor_ids: List[int] = []

class QRLinkedPROut(BaseModel):
    id: int
    pr_id: int
    pr_number: Optional[str] = None
    class Config:
        from_attributes = True

class QRVendorOut(BaseModel):
    id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    is_sent: bool = False
    sent_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class QuotationRequestOut(BaseModel):
    id: int
    qr_number: str
    project_id: int
    project_name: Optional[str] = None
    required_date: Optional[date] = None
    remarks: Optional[str] = None
    status: str
    created_by_id: int
    created_by_name: Optional[str] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[QRItemOut] = []
    linked_prs: List[QRLinkedPROut] = []
    invited_vendors: List[QRVendorOut] = []
    vendor_quotation_count: int = 0
    class Config:
        from_attributes = True

class VendorQuotationItemBase(BaseModel):
    qr_item_id: int
    material_id: int
    quoted_rate: float = Field(..., ge=0)
    delivery_days: Optional[int] = None
    remarks: Optional[str] = None

class VendorQuotationItemOut(VendorQuotationItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class VendorQuotationCreate(BaseModel):
    vendor_id: int
    quotation_number: Optional[str] = None
    quotation_date: Optional[date] = None
    remarks: Optional[str] = None
    items: List[VendorQuotationItemBase] = []

class VendorQuotationOut(BaseModel):
    id: int
    qr_id: int
    vendor_id: int
    vendor_name: Optional[str] = None
    quotation_number: Optional[str] = None
    quotation_date: Optional[date] = None
    received_date: Optional[date] = None
    attachment_path: Optional[str] = None
    remarks: Optional[str] = None
    status: str
    entered_by_name: Optional[str] = None
    created_at: datetime
    items: List[VendorQuotationItemOut] = []
    class Config:
        from_attributes = True

class VendorQuoteDetail(BaseModel):
    vendor_id: int
    vendor_name: str
    quoted_rate: float
    delivery_days: Optional[int] = None
    rank: int
    rank_label: str

class MaterialComparisonOut(BaseModel):
    qr_item_id: int
    material_id: int
    material_name: str
    material_code: str
    uom_name: Optional[str] = None
    quantity: float
    vendor_quotes: List[VendorQuoteDetail] = []
    selected_vendor_id: Optional[int] = None
    selected_vendor_name: Optional[str] = None
    is_overridden: bool = False
    override_reason: Optional[str] = None

class VendorOverrideRequest(BaseModel):
    qr_item_id: int
    material_id: int
    selected_vendor_id: int
    override_reason: str

class ComparativeStatementOut(BaseModel):
    qr_id: int
    qr_number: str
    project_name: str
    required_date: Optional[date] = None
    status: str
    created_by_name: str
    created_at: datetime
    materials: List[MaterialComparisonOut] = []
    vendor_totals: List[Dict[str, Any]] = []
