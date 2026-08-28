import sys
sys.path.append('/home/ngadmin/smartcampus2/backend')
from app.database import SessionLocal
from app.models import EquipmentItem, Material, LocationMaster

db = SessionLocal()
count = db.query(EquipmentItem).filter(
    EquipmentItem.calibration_required == True,
    EquipmentItem.status != "Written Off",
    EquipmentItem.status != "RBER"
).count()
print(f"Total equipment requiring calibration: {count}")
