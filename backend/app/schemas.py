"""Eastpoint Smart Campus - Pydantic schemas."""

from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
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
    department: Optional[str] = None
    institution: Optional[str] = None
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
    extended_actions: Dict[str, bool] = {}

class RolePermissionOut(RolePermissionBase):
    id: int
    extended_actions: Dict[str, bool] = {}
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    data_access_scope: Optional[str] = "Self Only"

class WorkflowRuleBase(BaseModel):
    document_type: str  # "INDENT", "PURCHASE_REQUEST", "PURCHASE_ORDER"
    level: int = 1
    min_amount: float = 0
    max_amount: Optional[float] = None
    user_id: Optional[int] = None
    is_active: bool = True

class RoleCreate(RoleBase):
    permissions: List[RolePermissionBase] = []
    workflow_rules: List[WorkflowRuleBase] = []

class RoleOut(RoleBase):
    id: int
    tenant_id: Optional[int] = None
    permissions: List[RolePermissionOut] = []
    workflow_rules: List[Dict[str, Any]] = []
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
    code: Optional[str] = None
    location: Optional[str] = None

class SiteCreate(SiteBase):
    tenant_id: int

class SiteOut(SiteBase):
    id: int
    tenant_id: int
    class Config:
        from_attributes = True

class TenantDetailsOut(BaseModel):
    tenant: TenantOut
    site: SiteOut
    admin: UserOut

class TenantConfigurationBase(BaseModel):
    base_state: str
    cgst_share_percent: float
    sgst_share_percent: float

class TenantConfigurationCreate(TenantConfigurationBase):
    pass

class TenantConfigurationUpdate(TenantConfigurationBase):
    pass

class TenantConfigurationOut(TenantConfigurationBase):
    id: int
    tenant_id: int
    class Config:
        from_attributes = True


# ── Master Data ──────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1)
    material_code_prefix: str = Field(..., min_length=3, max_length=3, pattern=r"^[A-Za-z]{3}$")
    description: Optional[str] = None
    is_active: Optional[bool] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    sequence_number: Optional[int] = None
    code: Optional[str] = None
    has_materials: bool = False
    class Config:
        from_attributes = True

class SubCategoryBase(BaseModel):
    name: str
    category_id: int
    is_active: Optional[bool] = None

class SubCategoryCreate(SubCategoryBase):
    pass

class SubCategoryOut(SubCategoryBase):
    id: int
    category_name: Optional[str] = None
    is_active: bool = True
    class Config:
        from_attributes = True

class UOMBase(BaseModel):
    name: str = Field(..., min_length=1)
    abbreviation: str = Field(..., min_length=1)
    allow_decimal: bool = False
    is_active: Optional[bool] = None

class UOMCreate(UOMBase):
    pass

class UOMOut(UOMBase):
    id: int
    class Config:
        from_attributes = True

class MaterialBase(BaseModel):
    code: Optional[str] = None
    name: str
    alias: Optional[str] = None
    reference_no: Optional[str] = None
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
    warehouse_id: Optional[int] = None
    description: Optional[str] = None

    @field_validator("hsn_code")
    @classmethod
    def validate_hsn_code(cls, v):
        if v:
            import re
            if not re.match(r'^(\d{2}|\d{4}|\d{6}|\d{8})$', v):
                raise ValueError("HSN Code must be exactly 2, 4, 6, or 8 numeric digits")
        return v

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    alias: Optional[str] = None
    reference_no: Optional[str] = None
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
    warehouse_id: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("hsn_code")
    @classmethod
    def validate_hsn_code(cls, v):
        if v:
            import re
            if not re.match(r'^(\d{2}|\d{4}|\d{6}|\d{8})$', v):
                raise ValueError("HSN Code must be exactly 2, 4, 6, or 8 numeric digits")
        return v

class MaterialOut(MaterialBase):
    id: int
    is_active: bool
    created_at: datetime
    category_name: Optional[str] = None
    subcategory_name: Optional[str] = None
    uom_name: Optional[str] = None
    uom_allow_decimal: Optional[bool] = False
    vendor_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    current_stock: Optional[float] = 0
    class Config:
        from_attributes = True

class VendorBase(BaseModel):
    name: str
    code: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    rating: float = 0

class VendorCreate(VendorBase):
    category_ids: List[int] = []

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    category_ids: Optional[List[int]] = None

class VendorOut(VendorBase):
    id: int
    status: str
    current_approval_level: int
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_remarks: Optional[str] = None
    is_active: bool
    created_at: datetime
    categories: List[str] = []
    can_user_approve: Optional[bool] = False
    class Config:
        from_attributes = True

class VendorApprovalCreate(BaseModel):
    remarks: Optional[str] = None

class VendorApprovalOut(BaseModel):
    id: int
    vendor_id: int
    approval_flow_id: int
    approver_id: int
    remarks: Optional[str] = None
    approved_at: datetime
    approver_name: Optional[str] = None
    class Config:
        from_attributes = True

class OrganizationBase(BaseModel):
    name: str
    code: Optional[str] = None
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
    code: Optional[str] = None
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

class InstitutionBase(BaseModel):
    name: str
    code: Optional[str] = None
    project_id: int

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionOut(InstitutionBase):
    id: int
    project_name: Optional[str] = None

    class Config:
        from_attributes = True

class BuildingBase(BaseModel):
    name: str
    code: Optional[str] = None
    project_id: Optional[int] = None
    institution_id: Optional[int] = None
    department_name: Optional[str] = None

class BuildingCreate(BuildingBase):
    pass

class BuildingOut(BuildingBase):
    id: int
    project_name: Optional[str] = None
    institution_name: Optional[str] = None
    class Config:
        from_attributes = True

class FloorBase(BaseModel):
    name: str
    level: int = 0
    building_id: Optional[int] = None
    department_name: Optional[str] = None

class FloorCreate(FloorBase):
    pass

class FloorOut(FloorBase):
    id: int
    building_name: Optional[str] = None
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    accounting_code: Optional[str] = None
    building_id: Optional[int] = None
    institution_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    building_name: Optional[str] = None
    class Config:
        from_attributes = True

class RoomBase(BaseModel):
    name: str
    code: Optional[str] = None
    department_name: Optional[str] = None
    floor_id: int

class RoomCreate(RoomBase):
    pass

class RoomOut(RoomBase):
    id: int
    floor_name: Optional[str] = None
    building_name: Optional[str] = None
    building_id: Optional[int] = None
    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    name: str
    code: Optional[str] = None
    project_id: int
    warehouse_type: str = "Main"
    location: Optional[str] = None
    manager_name: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None

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

class PRApproveItemRequest(BaseModel):
    pr_item_id: int
    approved_quantity: float = Field(..., ge=0)
    remarks: Optional[str] = Field(None, max_length=255)

class PRApproveRequest(BaseModel):
    items: List[PRApproveItemRequest] = []
    remarks: Optional[str] = Field(None, max_length=255)
    @model_validator(mode='after')
    def check_approval_quantities(self):
        if not self.items:
            return self
        if len(self.items) == 1 and self.items[0].approved_quantity == 0:
            raise ValueError("Approved quantity must be greater than 0 for a single-item document. Please use the Reject button instead.")
        if len(self.items) > 1 and sum(item.approved_quantity for item in self.items) == 0:
            raise ValueError("You cannot approve 0 quantity for all items. Please use the Reject button instead.")
        return self


class PRItemOut(PRItemBase):
    id: int
    approved_quantity: Optional[float] = None
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    uom_allow_decimal: Optional[bool] = False
    class Config:
        from_attributes = True

class PRBase(BaseModel):
    project_id: int
    required_date: Optional[date] = None
    priority: str = "Normal"
    remarks: Optional[str] = Field(None, max_length=255)
    required_for_room_id: Optional[int] = None
    building_id: Optional[int] = None
    department_name: Optional[str] = None
    items: List[PRItemBase] = []

class PRCreate(PRBase):
    status: Optional[str] = "Draft"
    department_name: str = Field(..., min_length=1, description="Department is required")

class PRUpdate(BaseModel):
    required_date: Optional[date] = None
    priority: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    required_for_room_id: Optional[int] = None
    status: Optional[str] = None

class PRFullUpdate(PRBase):
    status: Optional[str] = None
    department_name: str = Field(..., min_length=1, description="Department is required")

class PROut(PRBase):
    id: int
    pr_number: str
    requester_id: int
    status: str
    current_approval_level: int
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    requester_name: Optional[str] = None
    room_name: Optional[str] = None
    project_name: Optional[str] = None
    building_name: Optional[str] = None
    department_name: Optional[str] = None
    items: List[PRItemOut] = []
    can_user_approve: Optional[bool] = False
    class Config:
        from_attributes = True

class POItemBase(BaseModel):
    material_id: int
    quantity: float = Field(..., gt=0, description="Quantity must be positive")
    rate: float = Field(..., ge=0, description="Rate cannot be negative")
    discount_percent: float = 0
    cgst_percentage: float = 0
    sgst_percentage: float = 0
    igst_percentage: float = 0
    is_gst_inclusive: bool = False

class POItemOut(POItemBase):
    id: int
    amount: float
    received_quantity: float
    approved_quantity: Optional[float] = None
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    uom_allow_decimal: Optional[bool] = False
    class Config:
        from_attributes = True

class POBase(BaseModel):
    vendor_id: int
    project_id: int
    institution_id: Optional[int] = None
    pr_id: Optional[int] = None
    indent_id: Optional[int] = None
    qr_id: Optional[int] = None
    po_type: str = "Formal"
    delivery_date: Optional[date] = None
    terms: Optional[str] = None
    annexure: Optional[str] = None
    items: List[POItemBase] = []

class POApproveItemRequest(BaseModel):
    po_item_id: int
    approved_quantity: float = Field(..., ge=0)
    remarks: Optional[str] = Field(None, max_length=255)

class POApproveRequest(BaseModel):
    items: List[POApproveItemRequest] = []
    remarks: Optional[str] = Field(None, max_length=255)
    @model_validator(mode='after')
    def check_approval_quantities(self):
        if not self.items:
            return self
        if len(self.items) == 1 and self.items[0].approved_quantity == 0:
            raise ValueError("Approved quantity must be greater than 0 for a single-item document. Please use the Reject button instead.")
        if len(self.items) > 1 and sum(item.approved_quantity for item in self.items) == 0:
            raise ValueError("You cannot approve 0 quantity for all items. Please use the Reject button instead.")
        return self


class POCreate(POBase):
    status: Optional[str] = "Draft"

class POFullUpdate(POBase):
    status: Optional[str] = None

class POUpdate(BaseModel):
    delivery_date: Optional[date] = None
    status: Optional[str] = None
    terms: Optional[str] = None

class POOut(BaseModel):
    id: int
    po_number: str
    vendor_id: int
    project_id: int
    institution_id: Optional[int] = None
    pr_id: Optional[int] = None
    pr_number: Optional[str] = None
    indent_id: Optional[int] = None
    indent_number: Optional[str] = None
    qr_id: Optional[int] = None
    qr_number: Optional[str] = None
    po_type: str = "Formal"
    total_amount: float
    delivery_date: Optional[date] = None
    status: str
    current_approval_level: int = 1
    terms: Optional[str] = None
    annexure: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_city: Optional[str] = None
    vendor_state: Optional[str] = None
    vendor_pincode: Optional[str] = None
    vendor_gst_number: Optional[str] = None
    project_name: Optional[str] = None
    institution_name: Optional[str] = None
    can_user_approve: Optional[bool] = False
    items: List[POItemOut] = []
    class Config:
        from_attributes = True


# ── Gate Entry ───────────────────────────────────────────────────────────

class GateEntryBase(BaseModel):
    entry_type: str = "Vehicle"
    vehicle_number: Optional[str] = None
    vendor_id: Optional[int] = None
    po_id: Optional[int] = None
    project_id: Optional[int] = None  # Optional for Direct Invoice
    material_id: Optional[int] = None  # Optional for Direct Invoice
    quantity: Optional[float] = None  # Optional for Direct Invoice
    driver_name: Optional[str] = None
    delivery_person_name: Optional[str] = None
    driver_phone: Optional[str] = None
    gate_pass_number: Optional[str] = None
    arrival_time: Optional[datetime] = None
    invoice_scan_url: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_amount: Optional[float] = 0
    reference_document_type: str = "Invoice"
    tare_weight: Optional[float] = None
    gross_weight: Optional[float] = None
    net_weight: Optional[float] = None
    weight_report_url: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)

class GateEntryCreate(GateEntryBase):
    pass

class GateEntryOut(GateEntryBase):
    id: int
    entry_number: str
    status: str
    created_at: datetime
    entry_type: str
    delivery_person_name: Optional[str] = None
    invoice_scan_url: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_amount: Optional[float] = 0
    vendor_name: Optional[str] = None
    material_name: Optional[str] = None
    po_number: Optional[str] = None
    project_name: Optional[str] = None
    material_names: Optional[str] = None
    material_qtys: Optional[str] = None
    reference_document_type: Optional[str] = "Invoice"
    tare_weight: Optional[float] = None
    gross_weight: Optional[float] = None
    net_weight: Optional[float] = None
    weight_report_url: Optional[str] = None
    class Config:
        from_attributes = True

# ── Company Addresses ────────────────────────────────────────────────────

class CompanyAddressBase(BaseModel):
    name: str
    code: Optional[str] = None
    address_type: str = "Billing"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None

class CompanyAddressCreate(CompanyAddressBase):
    pass

class CompanyAddressUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address_type: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None

class CompanyAddressOut(CompanyAddressBase):
    id: int
    is_active: bool = True
    class Config:
        from_attributes = True


# ── Invoices ─────────────────────────────────────────────────────────────

class InvoiceItemBase(BaseModel):
    material_id: Optional[int] = None
    description: Optional[str] = None
    hsn_sac: Optional[str] = None
    quantity: float = Field(..., gt=0)
    rate: float = Field(..., ge=0)
    uom: Optional[str] = None
    discount_percent: float = 0
    cgst_rate: float = 0
    sgst_rate: float = 0
    igst_rate: float = 0
    cgst_amount: float = 0
    sgst_amount: float = 0
    igst_amount: float = 0

    @field_validator("hsn_sac")
    @classmethod
    def validate_hsn(cls, v):
        if v:
            import re
            if not re.match(r'^(\d{2}|\d{4}|\d{6}|\d{8})$', v):
                raise ValueError("HSN/SAC must be exactly 2, 4, 6, or 8 numeric digits")
        return v
    taxable_amount: float = 0
    amount: float = 0
    remarks: Optional[str] = Field(None, max_length=255)

class InvoiceItemOut(InvoiceItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    invoice_number: str
    invoice_date: date
    gate_entry_id: Optional[int] = None
    vendor_id: int
    po_id: Optional[int] = None
    consignee_id: Optional[int] = None
    buyer_id: Optional[int] = None
    srf_number: Optional[str] = None
    irn: Optional[str] = None
    ack_number: Optional[str] = None
    ack_date: Optional[date] = None
    
    eway_bill_number: Optional[str] = None
    delivery_note: Optional[str] = None
    delivery_note_date: Optional[date] = None
    payment_terms: Optional[str] = None
    reference_number: Optional[str] = None
    reference_date: Optional[date] = None
    dispatch_doc_number: Optional[str] = None
    dispatched_through: Optional[str] = None
    destination: Optional[str] = None
    lr_rr_number: Optional[str] = None
    vehicle_number: Optional[str] = None
    terms_of_delivery: Optional[str] = None

    total_taxable_amount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_igst: float = 0
    total_discount: float = 0
    total_amount: float = 0
    tax_amount: float = 0
    transport_charges: float = 0
    transport_hsn: Optional[str] = None
    transport_cgst_rate: float = 0
    transport_sgst_rate: float = 0
    transport_igst_rate: float = 0
    transport_discount_percent: float = 0
    scan_url: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    items: List[InvoiceItemBase] = []

class InvoiceCreate(InvoiceBase):
    status: Optional[str] = "Draft"

class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    gate_entry_id: Optional[int] = None
    vendor_id: Optional[int] = None
    po_id: Optional[int] = None
    consignee_id: Optional[int] = None
    buyer_id: Optional[int] = None
    srf_number: Optional[str] = None
    irn: Optional[str] = None
    ack_number: Optional[str] = None
    ack_date: Optional[date] = None
    
    eway_bill_number: Optional[str] = None
    delivery_note: Optional[str] = None
    delivery_note_date: Optional[date] = None
    payment_terms: Optional[str] = None
    reference_number: Optional[str] = None
    reference_date: Optional[date] = None
    dispatch_doc_number: Optional[str] = None
    dispatched_through: Optional[str] = None
    destination: Optional[str] = None
    lr_rr_number: Optional[str] = None
    vehicle_number: Optional[str] = None
    terms_of_delivery: Optional[str] = None

    total_taxable_amount: Optional[float] = None
    total_cgst: Optional[float] = None
    total_sgst: Optional[float] = None
    total_igst: Optional[float] = None
    total_discount: Optional[float] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    transport_charges: Optional[float] = None
    transport_hsn: Optional[str] = None
    transport_cgst_rate: Optional[float] = None
    transport_sgst_rate: Optional[float] = None
    transport_igst_rate: Optional[float] = None
    transport_discount_percent: Optional[float] = None
    status: Optional[str] = None
    scan_url: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    items: Optional[List[InvoiceItemBase]] = None

class InvoiceOut(InvoiceBase):
    id: int
    code: str
    status: str
    created_at: datetime
    internal_reference_number: Optional[str] = None
    vendor_name: Optional[str] = None
    po_number: Optional[str] = None
    gate_entry_number: Optional[str] = None
    created_by_name: Optional[str] = None
    consignee_title: Optional[str] = None
    buyer_title: Optional[str] = None
    # Finance fields
    payment_status: Optional[str] = "Pending"
    sent_for_payment_at: Optional[datetime] = None
    sent_for_payment_by_name: Optional[str] = None
    
    hard_copy_sent: bool = False
    hard_copy_sent_at: Optional[datetime] = None
    hard_copy_sent_by_name: Optional[str] = None
    
    hard_copy_received: bool = False
    hard_copy_received_at: Optional[datetime] = None
    hard_copy_received_by_name: Optional[str] = None
    hard_copy_remarks: Optional[str] = Field(None, max_length=255)
    payment_completed_at: Optional[datetime] = None
    payment_completed_by_name: Optional[str] = None
    payment_reference: Optional[str] = None
    items: List[InvoiceItemOut] = []
    class Config:
        from_attributes = True


# ── Finance ──────────────────────────────────────────────────────────────

class SendForPaymentRequest(BaseModel):
    invoice_ids: List[int]
    target_amount: float = 0

class HardCopySentRequest(BaseModel):
    invoice_id: int

class HardCopyUpdate(BaseModel):
    invoice_id: int
    hard_copy_received: bool = True
    hard_copy_remarks: Optional[str] = Field(None, max_length=255)

class PaymentStatusUpdate(BaseModel):
    invoice_ids: List[int]
    payment_reference: Optional[str] = None


# ── GRN ──────────────────────────────────────────────────────────────────

class GRNItemBase(BaseModel):
    material_id: Optional[int] = None  # Required for Direct Invoice, derived from PO otherwise
    po_item_id: Optional[int] = None  # Optional for Direct Invoice
    received_quantity: float = Field(..., gt=0)
    accepted_quantity: float = Field(..., gt=0)
    rejected_quantity: float = 0
    rate: float = 0
    rejection_reason: Optional[str] = None
    # GST fields per line
    hsn_code: Optional[str] = None
    cgst_rate: float = 0
    sgst_rate: float = 0
    igst_rate: float = 0
    cgst_amount: float = 0
    sgst_amount: float = 0
    igst_amount: float = 0
    taxable_amount: float = 0
    discount_percent: float = 0
    remarks: Optional[str] = Field(None, max_length=255)
    ordered_quantity: Optional[float] = 0

    @field_validator("hsn_code")
    @classmethod
    def validate_hsn_code(cls, v):
        if v:
            import re
            if not re.match(r'^(\d{2}|\d{4}|\d{6}|\d{8})$', v):
                raise ValueError("HSN Code must be exactly 2, 4, 6, or 8 numeric digits")
        return v

class GRNItemOut(BaseModel):
    id: int
    material_id: int
    po_item_id: Optional[int] = None
    ordered_quantity: float = 0
    received_quantity: float
    accepted_quantity: float
    rejected_quantity: float
    rate: float
    hsn_code: Optional[str] = None
    cgst_rate: float = 0
    sgst_rate: float = 0
    igst_rate: float = 0
    cgst_amount: float = 0
    sgst_amount: float = 0
    igst_amount: float = 0
    taxable_amount: float = 0
    discount_percent: float = 0
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class GRNBase(BaseModel):
    po_id: Optional[int] = None  # Nullable for Direct Invoice
    warehouse_id: int
    gate_entry_id: Optional[int] = None
    project_id: Optional[int] = None  # Required — passed explicitly for Direct Invoice
    vendor_id: Optional[int] = None  # Required — passed explicitly for Direct Invoice
    receipt_type: str = "PO-Based"
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_amount: float = 0
    invoice_scan_url: Optional[str] = None
    # GST totals
    vendor_gstin: Optional[str] = None
    total_taxable_amount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_igst: float = 0
    total_tax: float = 0
    eway_bill_number: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    items: List[GRNItemBase] = []

class GRNCreate(GRNBase):
    pass

class GRNOut(BaseModel):
    id: int
    grn_number: str
    po_id: Optional[int] = None
    warehouse_id: int
    project_id: int
    vendor_id: int
    receipt_type: str = "PO-Based"
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    invoice_amount: float
    invoice_scan_url: Optional[str] = None
    vendor_gstin: Optional[str] = None
    total_taxable_amount: float = 0
    total_cgst: float = 0
    total_sgst: float = 0
    total_igst: float = 0
    total_tax: float = 0
    eway_bill_number: Optional[str] = None
    payment_status: str = "Not Applicable"
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
    remarks: Optional[str] = Field(None, max_length=255)

class IssueItemOut(IssueItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    warehouse_id: Optional[int] = None
    warehouse_name: Optional[str] = None
    class Config:
        from_attributes = True

class IssueBase(BaseModel):
    warehouse_id: Optional[int] = None
    project_id: Optional[int] = None
    indent_id: Optional[int] = None
    issued_to_room_id: Optional[int] = None
    building_id: Optional[int] = None
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
    issued_to_room_id: Optional[int] = None
    building_id: Optional[int] = None
    issued_to_department: Optional[str] = None
    issued_to_contractor: Optional[str] = None
    purpose: Optional[str] = None
    status: str
    received_by_name: Optional[str] = None
    is_acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_id: Optional[int] = None
    acknowledged_by_name: Optional[str] = None
    acknowledgement_remarks: Optional[str] = Field(None, max_length=255)
    created_at: datetime
    warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    institution_name: Optional[str] = None
    room_name: Optional[str] = None
    floor_name: Optional[str] = None
    building_name: Optional[str] = None
    issued_by_name: Optional[str] = None
    indent_number: Optional[str] = None
    items: List[IssueItemOut] = []
    class Config:
        from_attributes = True


# ── Material Return ──────────────────────────────────────────────────────

class ReturnItemBase(BaseModel):
    material_id: int
    returned_qty: float = Field(..., gt=0)
    remarks: Optional[str] = Field(None, max_length=255)

class ReturnItemOut(ReturnItemBase):
    id: int
    received_qty: Optional[float] = None
    variance_qty: Optional[float] = None
    receipt_remarks: Optional[str] = Field(None, max_length=255)
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class ReturnBase(BaseModel):
    warehouse_id: int
    project_id: int
    returned_from_room_id: Optional[int] = None
    returned_from_department: Optional[str] = None
    return_type: str = "Unused"
    remarks: Optional[str] = Field(None, max_length=255)
    returned_by_name: Optional[str] = None
    items: List[ReturnItemBase] = []

class ReturnCreate(ReturnBase):
    pass

class ReturnOut(BaseModel):
    id: int
    return_number: str
    warehouse_id: int
    project_id: int
    returned_from_room_id: Optional[int] = None
    returned_from_department: Optional[str] = None
    return_type: str
    remarks: Optional[str] = Field(None, max_length=255)
    returned_by_name: Optional[str] = None
    status: str
    received_date: Optional[datetime] = None
    initiated_by_id: int
    received_by_id: Optional[int] = None
    created_at: datetime
    warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    room_name: Optional[str] = None
    initiated_by_name: Optional[str] = None
    received_by_name_user: Optional[str] = None
    items: List[ReturnItemOut] = []
    class Config:
        from_attributes = True

class ReturnReceiptItem(BaseModel):
    return_item_id: int
    received_qty: float = Field(..., ge=0)
    receipt_remarks: Optional[str] = Field(None, max_length=255)

class ReturnReceiptRequest(BaseModel):
    items: List[ReturnReceiptItem] = []


# ── Stock Transfer ───────────────────────────────────────────────────────

class TransferItemBase(BaseModel):
    material_id: int
    quantity: float
    remarks: Optional[str] = Field(None, max_length=255)

class TransferItemOut(TransferItemBase):
    id: int
    received_qty: Optional[float] = None
    variance_qty: Optional[float] = None
    receipt_remarks: Optional[str] = Field(None, max_length=255)
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class TransferReceiptItem(BaseModel):
    transfer_item_id: int
    received_qty: float = Field(..., ge=0)
    receipt_remarks: Optional[str] = Field(None, max_length=255)

class TransferReceiptRequest(BaseModel):
    items: List[TransferReceiptItem] = []

class TransferBase(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    project_id: int
    remarks: Optional[str] = Field(None, max_length=255)
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
    remarks: Optional[str] = Field(None, max_length=255)
    created_at: datetime
    completed_at: Optional[datetime] = None
    received_date: Optional[datetime] = None
    from_warehouse_name: Optional[str] = None
    to_warehouse_name: Optional[str] = None
    project_name: Optional[str] = None
    received_by_name: Optional[str] = None
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
    created_at: Optional[datetime] = None
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
    total_issued_value: float = 0
    total_issued_qty: float = 0
    low_stock_items: int = 0
    pending_pr: int = 0
    pending_po: int = 0
    recent_grn_count: int = 0
    total_vendors: int = 0
    total_warehouses: int = 0
    open_complaints: int = 0

class ConsumptionByBuilding(BaseModel):
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

class MaterialCostByBuilding(BaseModel):
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
    uom_allow_decimal: Optional[bool] = False
    issued_quantity: float = 0
    acknowledged_quantity: float = 0
    approved_quantity: Optional[float] = None
    pending_quantity: float = 0
    current_stock: float = 0
    warehouse_id: Optional[int] = None
    warehouse_name: Optional[str] = None
    availability_status: str = "No Stock"
    class Config:
        from_attributes = True

class IndentBase(BaseModel):
    institution_id: Optional[int] = None
    complaint_id: Optional[int] = None
    room_id: Optional[int] = None
    building_id: Optional[int] = None
    floor: Optional[str] = None
    location: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    total_amount: float = 0
    items: List[IndentItemBase] = []

class IndentCreate(IndentBase):
    department: Optional[str] = None

class IndentUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)

class IndentOut(BaseModel):
    id: int
    indent_number: str
    requester_id: int
    institution_id: Optional[int] = None
    complaint_id: Optional[int] = None
    room_id: Optional[int] = None
    floor: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None
    building_name: Optional[str] = None
    institution_name: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    status: str
    current_approval_level: int
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    requester_name: Optional[str] = None
    room_name: Optional[str] = None
    total_amount: float
    project_id: Optional[int] = None
    can_user_approve: Optional[bool] = False
    items: List[IndentItemOut] = []
    class Config:
        from_attributes = True

class IndentAcknowledgeItem(BaseModel):
    indent_item_id: int
    acknowledged_quantity: float = Field(..., ge=0)

class IndentAcknowledgeRequest(BaseModel):
    items: List[IndentAcknowledgeItem] = []

class IndentApproveItemRequest(BaseModel):
    indent_item_id: int
    approved_quantity: float = Field(..., ge=0)
    remarks: Optional[str] = Field(None, max_length=255)

class IndentApproveRequest(BaseModel):
    items: List[IndentApproveItemRequest] = []
    remarks: Optional[str] = Field(None, max_length=255)
    @model_validator(mode='after')
    def check_approval_quantities(self):
        if not self.items:
            return self
        if len(self.items) == 1 and self.items[0].approved_quantity == 0:
            raise ValueError("Approved quantity must be greater than 0 for a single-item document. Please use the Reject button instead.")
        if len(self.items) > 1 and sum(item.approved_quantity for item in self.items) == 0:
            raise ValueError("You cannot approve 0 quantity for all items. Please use the Reject button instead.")
        return self



class ApprovalHistoryItemOut(BaseModel):
    material_id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    requested_quantity: float = 0
    approved_quantity: Optional[float] = None
    remarks: Optional[str] = Field(None, max_length=255)

class ApprovalHistoryEntryOut(BaseModel):
    level: int
    approver_name: str
    role_name: str
    approved_at: datetime
    remarks: Optional[str] = Field(None, max_length=255)
    status: str
    items: List[ApprovalHistoryItemOut] = []

class IndentApprovalHistoryOut(BaseModel):
    indent_id: int
    indent_number: str
    current_approval_level: int
    entries: List[ApprovalHistoryEntryOut] = []


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
    remarks: Optional[str] = Field(None, max_length=255)
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
    receipt_status: Optional[str] = "Pending"
    class Config:
        from_attributes = True

class QRVendorReceiptUpdate(BaseModel):
    receipt_status: str

class QuotationApproveRequest(BaseModel):
    remarks: Optional[str] = Field(None, max_length=255)

class QuotationRequestOut(BaseModel):
    id: int
    qr_number: str
    project_id: int
    project_name: Optional[str] = None
    required_date: Optional[date] = None
    remarks: Optional[str] = Field(None, max_length=255)
    status: str
    created_by_id: int
    created_by_name: Optional[str] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    approval_remarks: Optional[str] = Field(None, max_length=255)
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
    brand: Optional[str] = Field(None, max_length=255)
    vendor_uom_name: Optional[str] = Field(None, max_length=50)
    uom_conversion_factor: float = 1.0
    discount_percent: float = 0.0
    is_excluded: bool = False
    remarks: Optional[str] = Field(None, max_length=255)

class VendorQuotationItemOut(VendorQuotationItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    is_excluded: bool = False
    class Config:
        from_attributes = True

class VendorQuotationCreate(BaseModel):
    vendor_id: int
    quotation_number: Optional[str] = None
    quotation_date: Optional[date] = None
    remarks: Optional[str] = Field(None, max_length=255)
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
    remarks: Optional[str] = Field(None, max_length=255)
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


class NegotiationHistoryBase(BaseModel):
    discount_percent: float = 0.0
    remarks: Optional[str] = Field(None, max_length=255)

class NegotiationHistoryOut(NegotiationHistoryBase):
    id: int
    qr_id: int
    vendor_id: int
    created_by_id: int
    created_at: datetime
    created_by_name: Optional[str] = None
    class Config:
        from_attributes = True

class ExtractionResultItem(BaseModel):
    material_id: Optional[int] = None
    material_name: Optional[str] = None
    quoted_rate: Optional[float] = None
    delivery_days: Optional[int] = None
    brand: Optional[str] = None
    vendor_uom_name: Optional[str] = None
    uom_conversion_factor: float = 1.0
    discount_percent: float = 0.0
    confidence_score: float = 1.0
    raw_text: Optional[str] = None


# == Terms and Conditions ==

class TermBase(BaseModel):
    name: str
    content: str
    is_default: bool = False
    is_active: bool = True

class TermCreate(TermBase):
    pass

class TermUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None

class TermOut(TermBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# == Gate Pass ==

class GatePassItemBase(BaseModel):
    material_id: int
    quantity: float = Field(..., gt=0)
    remarks: Optional[str] = Field(None, max_length=255)

class GatePassItemOut(GatePassItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

class GatePassCreate(BaseModel):
    gate_pass_type: str = "Returnable"
    reason_code: Optional[str] = None
    project_id: int
    vendor_id: Optional[int] = None
    vendor_custom_name: Optional[str] = None
    vendor_custom_address: Optional[str] = None
    from_department: Optional[str] = None
    from_store: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    items: List[GatePassItemBase]

class GatePassUpdate(BaseModel):
    status: str
    remarks: Optional[str] = Field(None, max_length=255)
    gate_entry_number: Optional[str] = None
    grn_number: Optional[str] = None
    completed_by_name: Optional[str] = None
    completed_at: Optional[datetime] = None

class GatePassOut(BaseModel):
    id: int
    gate_pass_number: str
    gate_pass_type: str
    reason_code: Optional[str] = None
    project_id: int
    project_name: Optional[str] = None
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = None
    vendor_address: Optional[str] = None
    vendor_custom_name: Optional[str] = None
    vendor_custom_address: Optional[str] = None
    from_department: Optional[str] = None
    from_store: Optional[str] = None
    reference_return_number: Optional[str] = None
    status: str
    driver_name: Optional[str] = None
    vehicle_number: Optional[str] = None
    remarks: Optional[str] = Field(None, max_length=255)
    gate_entry_number: Optional[str] = None
    grn_number: Optional[str] = None
    created_at: datetime
    completed_by_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    items: List[GatePassItemOut] = []
    class Config:
        from_attributes = True


# == Write Off ==

class WriteOffItemBase(BaseModel):
    material_id: int
    warehouse_id: Optional[int] = None
    quantity: float = Field(..., gt=0)
    rate: float = 0
    amount: float = 0

class WriteOffItemOut(WriteOffItemBase):
    id: int
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    warehouse_name: Optional[str] = None
    class Config:
        from_attributes = True

class WriteOffBase(BaseModel):
    date: date
    reason: str
    write_off_type: Optional[str] = None
    attachment_url: Optional[str] = None
    items: List[WriteOffItemBase] = []

class WriteOffCreate(WriteOffBase):
    pass

class WriteOffOut(BaseModel):
    id: int
    write_off_number: str
    date: date
    reason: str
    write_off_type: Optional[str] = None
    attachment_url: Optional[str] = None
    status: str
    current_approval_level: int
    created_by_id: int
    created_by_name: Optional[str] = None
    approved_by_id: Optional[int] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    can_user_approve: Optional[bool] = False
    items: List[WriteOffItemOut] = []
    class Config:
        from_attributes = True


# == Material Limits ==

class DepartmentMaterialLimitBase(BaseModel):
    material_id: int
    monthly_limit: float = Field(..., gt=0)

class DepartmentMaterialLimitCreate(DepartmentMaterialLimitBase):
    departments: List[str]

class DepartmentMaterialLimitUpdate(BaseModel):
    monthly_limit: float = Field(..., gt=0)

class DepartmentMaterialLimitOut(DepartmentMaterialLimitBase):
    department: str
    id: int
    tenant_id: int
    site_id: int
    created_at: datetime
    created_by_id: int
    created_by_name: Optional[str] = None
    material_name: Optional[str] = None
    material_code: Optional[str] = None
    uom_name: Optional[str] = None
    class Config:
        from_attributes = True

# == Maintenance & Complaints ==

class ComplaintImageOut(BaseModel):
    id: int
    image_url: str
    is_resolution_image: bool
    uploaded_at: datetime
    class Config:
        from_attributes = True

class ComplaintBase(BaseModel):
    docket_no: str
    complaint_date: date
    complaint_time: Optional[str] = None
    department_name: Optional[str] = None
    building_id: Optional[int] = None
    room_id: Optional[int] = None
    location: Optional[str] = None
    nature_of_complaint: Optional[str] = None
    individual_detailed: Optional[str] = None
    name_and_trade: Optional[str] = None
    status: str = "Open"
    assigned_to_id: Optional[int] = None
    resolution_remarks: Optional[str] = Field(None, max_length=255)
    inspection_details: Optional[str] = None
    feedback: Optional[str] = None

class ComplaintCreate(BaseModel):
    docket_no: Optional[str] = None
    complaint_date: Optional[date] = None
    complaint_time: Optional[str] = None
    department_name: Optional[str] = None
    building_id: Optional[int] = None
    room_id: Optional[int] = None
    location: Optional[str] = None
    nature_of_complaint: Optional[str] = None
    individual_detailed: Optional[str] = None
    name_and_trade: Optional[str] = None
    image_urls: List[str] = []

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None
    resolution_remarks: Optional[str] = Field(None, max_length=255)
    resolution_image_urls: List[str] = []
    department_name: Optional[str] = None
    building_id: Optional[int] = None
    room_id: Optional[int] = None
    location: Optional[str] = None
    nature_of_complaint: Optional[str] = None
    individual_detailed: Optional[str] = None
    name_and_trade: Optional[str] = None
    image_urls: List[str] = []

# New workflow-specific schemas
class ComplaintAssign(BaseModel):
    assigned_to_id: int

class ComplaintInspect(BaseModel):
    material_required: bool = False
    inspection_details: Optional[str] = None

class ComplaintResolve(BaseModel):
    resolution_remarks: Optional[str] = Field(None, max_length=255)
    resolution_image_urls: List[str] = []

class ComplaintVerify(BaseModel):
    is_accepted: bool
    rejection_remarks: Optional[str] = Field(None, max_length=255)
    feedback: Optional[str] = None

class ComplaintOut(ComplaintBase):
    id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    material_required: bool = False
    verified_at: Optional[datetime] = None
    rejection_remarks: Optional[str] = Field(None, max_length=255)
    feedback: Optional[str] = None
    building_name: Optional[str] = None
    room_name: Optional[str] = None
    floor_id: Optional[int] = None
    floor_name: Optional[str] = None
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None
    assigned_to_name: Optional[str] = None
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    resolved_by_name: Optional[str] = None
    verified_by_name: Optional[str] = None
    images: List[ComplaintImageOut] = []
    class Config:
        from_attributes = True

