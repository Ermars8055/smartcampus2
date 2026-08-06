"""
Seed script to populate AMC and CMC contracts, contract items, equipment AMC/CMC details,
and generate sample AMC and CMC breakdown calls with linked Repair Work Orders (RWOs).
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from datetime import date, datetime
from app.database import SessionLocal
from app.models import (
    EquipmentItem, Vendor, Contract, ContractItem, User,
    Complaint, LocationMaster, RepairWorkOrder, Department, Institution
)
from sqlalchemy import func


def seed_amc_cmc_contracts():
    db = SessionLocal()
    try:
        tenant_id = 2
        site_id = 2

        # 1. Vendor & User
        vendor = db.query(Vendor).filter(Vendor.tenant_id == tenant_id).first()
        admin_user = db.query(User).first()
        inst = db.query(Institution).first()
        inst_id = inst.id if inst else None

        rad_dept = db.query(Department).filter(Department.name.ilike("%RADIOLOGY%")).first()
        emd_dept = db.query(Department).filter(Department.name.ilike("%EMERGENCY%")).first()

        if not vendor or not admin_user:
            print("Error: Vendor or User missing for tenant 2")
            return

        # 2. Equipment Items
        eq_amc = db.query(EquipmentItem).filter(
            EquipmentItem.tenant_id == tenant_id, EquipmentItem.status == "Operational"
        ).first()
        eq_cmc = db.query(EquipmentItem).filter(
            EquipmentItem.tenant_id == tenant_id, EquipmentItem.status == "Operational", EquipmentItem.id != eq_amc.id
        ).first()

        # Update equipment AMC/CMC details
        eq_amc.amc_cmc_status = "AMC"
        eq_amc.amc_cmc_end_date = date(2027, 12, 31)
        eq_amc.amc_po_number = "PO-AMC-2026-001"
        eq_amc.amc_cost = 45000.0

        eq_cmc.amc_cmc_status = "CMC"
        eq_cmc.amc_cmc_end_date = date(2027, 12, 31)
        eq_cmc.amc_po_number = "PO-CMC-2026-002"
        eq_cmc.amc_cost = 85000.0

        db.flush()

        # 3. AMC Contract
        amc_contract = db.query(Contract).filter(
            Contract.tenant_id == tenant_id, Contract.contract_number == "AMC-2026-001"
        ).first()

        if not amc_contract:
            amc_contract = Contract(
                tenant_id=tenant_id,
                site_id=site_id,
                contract_number="AMC-2026-001",
                contract_type="AMC",
                vendor_id=vendor.id,
                created_by_id=admin_user.id
            )
            db.add(amc_contract)
            db.flush()

        amc_contract.institution_id = inst_id
        amc_contract.department_id = rad_dept.id if rad_dept else None
        amc_contract.start_date = date(2026, 1, 1)
        amc_contract.end_date = date(2027, 12, 31)
        amc_contract.contract_value = 45000.00
        amc_contract.payment_terms = "Quarterly post-service billing (25% per quarter) upon submission of quarterly PM checklist and verification report."
        amc_contract.exclusions = "Replacement of major spare parts, power supply boards, liquid crystal displays, physical damage caused by external trauma, or electrical short circuit."
        amc_contract.renewal_terms = "Eligible for annual renewal with up to 5% price adjustment, contingent on maintaining vendor SLA compliance score >= 92%."
        amc_contract.sla_details = "Emergency Call Response Time: <= 4 hours. General Downtime Resolution: <= 24 hours. Preventive Maintenance: 4 quarterly routine visits per year included."
        amc_contract.spare_parts_included = False
        amc_contract.consumables_included = False
        amc_contract.status = "Active"
        amc_contract.current_approval_level = 2
        amc_contract.approved_by_id = admin_user.id
        amc_contract.approved_at = datetime(2026, 1, 1, 10, 0, 0)

        # AMC Contract Item
        amc_item = db.query(ContractItem).filter(
            ContractItem.contract_id == amc_contract.id, ContractItem.equipment_id == eq_amc.id
        ).first()

        if not amc_item:
            amc_item = ContractItem(contract_id=amc_contract.id, equipment_id=eq_amc.id)
            db.add(amc_item)

        amc_item.uom = "Unit"
        amc_item.rate = 45000.00
        amc_item.gst = 18.0
        amc_item.delivery_lead_time = 3
        amc_item.contract_quantity = 1.0
        amc_item.consumed_quantity = 0.0
        amc_item.remaining_quantity = 1.0
        amc_item.covered_components = "Quarterly Preventive Maintenance, safety inspection, calibration verification, minor mechanical adjustments, and labor for breakdown calls."
        amc_item.excluded_components = "Hardware spare replacements, power tubes, sensors, cables, batteries, and accessories."

        # 4. CMC Contract
        cmc_contract = db.query(Contract).filter(
            Contract.tenant_id == tenant_id, Contract.contract_number == "CMC-2026-001"
        ).first()

        if not cmc_contract:
            cmc_contract = Contract(
                tenant_id=tenant_id,
                site_id=site_id,
                contract_number="CMC-2026-001",
                contract_type="CMC",
                vendor_id=vendor.id,
                created_by_id=admin_user.id
            )
            db.add(cmc_contract)
            db.flush()

        cmc_contract.institution_id = inst_id
        cmc_contract.department_id = emd_dept.id if emd_dept else None
        cmc_contract.start_date = date(2026, 1, 1)
        cmc_contract.end_date = date(2027, 12, 31)
        cmc_contract.contract_value = 85000.00
        cmc_contract.payment_terms = "Bi-annual equal payments (50% every 6 months) verified against monthly biomedical audit and zero pending critical breakdown logs."
        cmc_contract.exclusions = "Consumables, disposable pads, battery degradation due to improper charging, and damage from unauthorized third-party repairs."
        cmc_contract.renewal_terms = "Automatic 3-year renewal option with 3% annual indexing, subject to annual hospital equipment audit board approval."
        cmc_contract.sla_details = "Priority Response Time: <= 2 hours for critical care equipment. Downtime Resolution: <= 12 hours. Standby loaner equipment provided if repair exceeds 24 hours."
        cmc_contract.spare_parts_included = True
        cmc_contract.consumables_included = True
        cmc_contract.status = "Active"
        cmc_contract.current_approval_level = 2
        cmc_contract.approved_by_id = admin_user.id
        cmc_contract.approved_at = datetime(2026, 1, 1, 10, 0, 0)

        # CMC Contract Item
        cmc_item = db.query(ContractItem).filter(
            ContractItem.contract_id == cmc_contract.id, ContractItem.equipment_id == eq_cmc.id
        ).first()

        if not cmc_item:
            cmc_item = ContractItem(contract_id=cmc_contract.id, equipment_id=eq_cmc.id)
            db.add(cmc_item)

        cmc_item.uom = "Unit"
        cmc_item.rate = 85000.00
        cmc_item.gst = 18.0
        cmc_item.delivery_lead_time = 1
        cmc_item.contract_quantity = 1.0
        cmc_item.consumed_quantity = 0.0
        cmc_item.remaining_quantity = 1.0
        cmc_item.covered_components = "Comprehensive coverage: all internal PCB modules, display screens, power supply units, internal sensors, defibrillator paddles, spare parts, and unlimited breakdown labor."
        cmc_item.excluded_components = "Single-use disposable electrodes, conductive gel, paper rolls, and user mishandling physical fractures."

        db.commit()
        print("Successfully seeded AMC and CMC contracts, items, and equipment details.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding AMC/CMC data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_amc_cmc_contracts()
