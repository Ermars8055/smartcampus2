import sys
import os

# Add backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Department, Building
from app.utils.sequences import get_next_number

DEPARTMENTS_DATA = """CAMP WARD 2 ND FLOOR 	Tower1
CLINICAL DEPARTMENT 	Tower1
COMM- CENTRE BELUVAl 	Tower1
COMMUNITY CENTRE - SHAKTHI 	Tower1
GAS MANIFOLD 	Tower1
GENERIC PHARMACY 	Tower1
2DECHO AND TMT ROOM 	Tower1
ACCOUNTS DEPT 	Tower1
ADMIN BLOCK 	Tower1
AIR-CONDITIONING -MAINTENANCE 	Tower1
ALLIED HEALTH SCIENCE 	Tower1
ANATOMY 	Tower1
ART CENTRE 	Tower1
BILLING SECTION 	Tower1
BIO CHEMISTRY 	Tower1
BIOCHEMISTRY MEDICAL COLLEGE 	Tower1
BIO-MEDICAL 	Tower1
BLOOD BANK 	Tower1
CAFETERIA 	Tower1
CAMP, 	Tower1
Camp-Inpatient 	Tower1
CARDIO THORACIC 0.T 	Tower1
CARDIO THORACIC UNIT 	Tower1
CARPENTER DEPARTMENT 	Tower1
CASUALTY 	Tower1
CEO SIR CABIN 	Tower1
CHINNAPPA CANTEEN 	Tower1
CIVIL DEPARTMENT 	Tower1
CLINICAL PHARMACOLOGY 	Tower1
COLLEGE OF NURSING 	Tower1
COMMUNITY CENTER PERAR 	Tower1
Community Centre - Goodshedde 	Tower1
COMMUNITY CENTRE - KAVOOR 	Tower1
COMMUNITY CENTRE - PANE MANGAL 	Tower1
COMMUNITY MEDICINE 	Tower1
COMPUTER DEPARTMENT 	Tower1
CORPORATE 	Tower1
COU 	Tower1
COUNCIL ROOM MEDICAL COLLEGE 	Tower1
CVS 	Tower1
CYTO PATHOLOGY 	Tower1
DENTAL - ORTHODONTICS 	Tower1
DENTAL DEPARTMENTS MATERIAL 	Tower1
DENTAL LIBRARY 	Tower1
Dental O.P.D Oral Surgery 	Tower1
DENTAL ORAL MEDICINE & RADIOLOGY 	Tower1
DENTAL PEDODONTICS 	Tower1
DENTAL PROSTHODONTICS 	Tower1
DENTAL-LIBRARY 	Tower1
DENTAL-PERIODONTICS 	Tower1
DEPARTMENT OF PHARMACY PRACTICE 	Tower1
DEPT OF CSSD 	Tower1
DEPT OF OPTHALMOLOGY 	Tower1
DEPT OF ORTHOPAEDIC 	Tower1
DIALYSIS 	Tower1
DIETARY DEPARTMENT 	Tower1
DRUG INFORMATION CENTRE 	Tower1
EAST POINT COLLEGE OF ENGINEERING AND TECHNOLOGY 	Tower1
EAST POINT COLLEGE OF HIGHER EDUCATION 	Tower1
EAST POINT COLLEGE OF NURSING 	Tower1
EAST POINT COLLEGE OF PHARMACY 	Tower1
ELECTRICAL DG -MAINTENANCE 	Tower1
EMERGENCY GREEN ZONE 	Tower1
EMERGENCY ICU 	Tower1
EMERGENCY YELLOW ZONE 	Tower1
ENDOSCOPY 	Tower1
ENGINEERING COLLEGE DEPARTMENT 	Tower1
EQUIPMENT -DEPT 	Tower1
EXAMINATION HALL, 	Tower1
FACILITIES MANAGEMENT 	Tower1
FACULTY SECTION MEDICAL COLLEGE 	Tower1
FORENSIC MEDICINE 	Tower1
GRAPHIC DESIGNING SECTION 	Tower1
HELIOS CONSTRUCTION DEPARTMENT 	Tower1
HELP 	Tower1
HISTOPATHOLOGY 	Tower1
HOSPITAL ADMINISTRATION 	Tower1
HOSPITAL SUPERVISOR 	Tower1
ICT 	Tower1
INFECTION CONTROL DEPARTMENT 	Tower1
INSTITUTIONAL ETHICS DEPARTMENT 	Tower1
INSURANCE DEPARTMENT 	Tower1
INTERNAL AUDIT DEPARTMENT 	Tower1
IT DEPARTMENT 	Tower1
ITU 	Tower1
LAUNDRY 	Tower1
M.G CHARITABLE TRUST 	Tower1
MAINTENANCE 	Tower1
MAINTENANCE MEDICAL OXYGEN 	Tower1
MARKETING DEPARTMENT 	Tower1
MECHANICAL MAINTENANCE 	Tower1
MEDICAL COLLEGE 	Tower1
MEDICAL COLLEGE HSK SUPERVISOR 	Tower1
MEDICAL EDUCATION UNIT - AJIMS 	Tower1
MEDICAL SOCIAL WORKER 	Tower1
MEDICAL-LIBRARY 	Tower1
MICU 	Tower1
MORTUARY 	Tower1
MRD 	Tower1
NABH 	Tower2
NESCAFE 	Tower2
NEW ROYAL COLLEGE OF NURSING 	Tower2
NICU 	Tower2
NUCLEAR MEDICINE 	Tower2
OBG ADMINISTRATION 	Tower2
OBG MARKETING 	Tower2
OBG-HDU 	Tower2
OCCUPATIONAL THERAPY DEPARTMENT 	Tower2
PACKAGE - ASD CLOSURE 	Tower2
PAINTING DEPARTMENT 	Tower2
PARAMEDICAL 	Tower2
PATHOLOGY 	Tower2
PATHOLOGY MEDICAL COLLEGE 	Tower2
PHARMACOLOGY 	Tower2
PHARMACOLOGY CLINICAL TRIAL UNIT 	Tower2
PHARMACY COLLEGE 	Tower2
PHYSIOLOGY 	Tower2
PICU 	Tower2
PLUMBING -MAINTENANCE 	Tower2
POST OPERATIVE 	Tower2
POW&SPW 	Tower2
PRO MARKETING 	Tower2
PROJECT MANAGER SECTION 	Tower2
PUC DEPARTMENT 	Tower2
PURCHASE DEPARTMENT 	Tower2
RADIOLOGY 	Tower2
REGISTRATION 	Tower2
RHTC 	Tower2
SAMPLE COLLECTION 	Tower2
SECURITY 	Tower2
SECURITY DEPT 	Tower2
SEROLOGY 	Tower2
SICU 	Tower2
SOCIAL AND PREVENTIVE MEDICINE 	Tower2
SPORTS DEPARTMENT 	Tower2
STUDENT SECTION MEDICAL COLLEGE 	Tower2
TAILORING DEPARTMENT 	Tower2
TRANSPORT DEPARTMENT 	Tower2
UHTC 	Tower2
WELDING DEPARTMENT 	Tower2
CATH LAB 	Tower2
CATH LAB TECHNICIAN 	Tower2
CATH LABORATORY 	Tower2
LAB COMMUNITY CENTER - KAROOR 	Tower2
LAB COMMUNITY CENTRE - PANEMAN 	Tower2
LABORATORY 	Tower2
LABOUR ROOM 	Tower2
MICROBIOLOGY 	Tower2
MICROBIOLOGY MEDICAL COLLEGE 	Tower2
ONCOPATHOLOGY-LAB 	Tower2
PCR LAB 	Tower2
SKILL LAB FOR JEEVA RAKSHA WORKSHOP 	Tower2
DEAN OFFICE, 	Tower2
FRONT OFFICE 	Tower2
MATRON OFFICE 	Tower2
MEDICAL DIRECTOR 	Tower2
MEDICAL SUPERINTENDENT OFFICE 	Tower2
MS OFFICE AJIMS 	Tower2
NURSING SUPERINTENDENT 	Tower2
PHYSICAL EDUCATIONAL DIRECTOR 	Tower2
PRINCIPLE OFFICE MEDICAL COLLEGE 	Tower2
TRUST OFFICE 	Tower2
CARDIOLOGY OPD 	Tower2
Dental OPD 	Tower2
DERMOTOLOGY OPD 	Tower2
ENT OPD 	Tower2
MEDICINE OPD 	Tower2
NEPHROLOGY OPD 	Tower2
NEUROLOGY OPD 	Tower2
OBG OPD 	Tower2
OPD 	Tower2
OPD Medical College 	Tower2
OPD MEDICAL COLLEGE FREE 	Tower2
OPD RECEPTION 	Tower2
OPTHALMOLOGY OPD 	Tower2
ORTHOPAEDIC OPD 	Tower2
PEADATRIC OPD 	Tower2
PSYCHIATRY OPD 	Tower2
RESPIRATORY OPD 	Tower2
SUPER SPECIALITY OPD 	Tower2
SURGERY OPD 	Tower2
UROLOGY OPD 	Tower2
HAEMOTOLOGY 	Tower2
MAJOR OT 	Tower2
MINOR OPERATION THEATRE 	Tower2
MINOR OT 	Tower2
OT- PLASTIC SURGERY 	Tower2
OT SUB STORE 	Tower2
OT-NEURO 	Tower2
OT-ORTHO 	Tower2
OT-UROLOGY 	Tower2
PHYSIOTHERAPY 	Tower2
PHYSIOTHERAPY COLLEGE 	Tower2
IP GENERIC PHARMACY MAIN STORE 	Tower2
IP PHARMACY MAIN STORE 	Tower2
PHARMACY MAIN STORE 	Tower2
102 WARD 	Tower3
103 WARD 	Tower3
104 WARD 	Tower3
105 WARD 	Tower3
106 WARD 	Tower3
107 WARD 	Tower3
108 WARD 	Tower3
109 WARD 	Tower3
110 WARD 	Tower3
111 WARD 	Tower3
112 WARD 	Tower3
2 ND FLOOR SPECIAL WARD 	Tower3
201 WARD 	Tower3
202 WARD 	Tower3
203 WARD 	Tower3
204 WARD 	Tower3
205 WARD 	Tower3
206 WARD 	Tower3
207 WARD 	Tower3
208 WARD 	Tower3
209 WARD 	Tower3
210 WARD 	Tower3
212WARD 	Tower3
213 WARD 	Tower3
214 WARD 	Tower3
215 WARD 	Tower3
216 WARD 	Tower3
217 WARD 	Tower3
401 WARD 	Tower3
402 WARD 	Tower3
403 WARD 	Tower3
404 WARD 	Tower3
405 WARD 	Tower3
406 WARD 	Tower3
4TH FLOOR ASHRAMA WARD 	Tower3
4TH FLOOR SPECIAL WARD 	Tower3
4TH FLOOR WARD 	Tower3
ASHRAMA WARD 2 ND FLOOR 	Tower3
CARDIAC WARD 217 	Tower3
CASUALITY OBSERVATION WARD 	Tower3
COVID-19 WARD 	Tower3
ENT WARD 	Tower3
FEMALE MEDICINE WARD-110 	Tower3
FEMALE ORTHO SURGERY WARD-111 	Tower3
FEMALE SURGERY WARD-108 	Tower3
MALE MEDICINE WARD-216 	Tower3
MALE ORTHO WARD 109 	Tower3
MALE SURGERY WARD-210 	Tower3
OBG WARD 	Tower3
OBSERVATION WARD -17 	Tower3
OBSERVATION WARD -18 	Tower3
OPTHALMOLOGY WARD 	Tower3
PAEDIATRIC WARD 	Tower3
PSYCHIATRY WARD 214 & 215 	Tower3
RESPIRATORY WARD 	Tower3
SPECIAL WARD 	Tower3
SPECIAL WARD 1ST. FLOOR 	Tower3
SRD FLOOR SPECIAL WARD 	Tower3
WARD SECRATORY 	Tower3"""

def main():
    db: Session = SessionLocal()
    
    # Pre-fetch the buildings to map names to IDs and get tenant/site contexts
    buildings = db.query(Building).all()
    building_map = {b.name: b for b in buildings}
    
    added_count = 0
    skipped_count = 0
    
    print("Starting to process departments...")
    
    lines = DEPARTMENTS_DATA.strip().split('\n')
    for line in lines:
        if not line.strip():
            continue
            
        parts = line.split('\t')
        if len(parts) != 2:
            print(f"Skipping malformed line: {line}")
            continue
            
        dept_name = parts[0].strip()
        tower_name = parts[1].strip()
        
        building = building_map.get(tower_name)
        if not building:
            print(f"Warning: Building '{tower_name}' not found for department '{dept_name}'. Skipping.")
            continue
            
        # Check if it already exists in the same building
        existing = db.query(Department).filter(
            Department.tenant_id == building.tenant_id,
            Department.building_id == building.id,
            Department.name.ilike(dept_name)
        ).first()
        
        if existing:
            print(f"Skipping '{dept_name}' in {tower_name} (Already exists)")
            if existing.is_deleted:
                # restore if it was deleted
                existing.is_deleted = False
                existing.is_active = True
                db.commit()
                added_count += 1
                print(f"Restored deleted department '{dept_name}' in {tower_name}")
            else:
                skipped_count += 1
            continue
            
        # Generate code
        code = get_next_number(db, building.tenant_id, building.site_id, "DEPARTMENT", "DEPT")
        
        new_dept = Department(
            tenant_id=building.tenant_id,
            site_id=building.site_id,
            name=dept_name,
            code=code,
            building_id=building.id,
            is_active=True,
            is_deleted=False
        )
        
        db.add(new_dept)
        db.commit()
        added_count += 1
        print(f"Added '{dept_name}' to {tower_name} (Code: {code})")
        
    print(f"\nFinished! Added (or restored): {added_count}, Skipped: {skipped_count}")

if __name__ == "__main__":
    main()
