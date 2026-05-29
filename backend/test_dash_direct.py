import sys
from app.database import SessionLocal
from app.routers.dashboard import get_dashboard_stats
from app.models import User

db = SessionLocal()
try:
    user = User(
        id=4, username="gradmin", email="admin@grinfra.com", full_name="Fredrick"
    )
    user._tenant_id = 3
    user._site_ids = [3]
    user._active_site_id = 3
    user._roles = ["STOREADMIN"]
    user._permissions = {"dashboard": {"can_read": True}}
    user._is_platform_admin = False
    
    stats = get_dashboard_stats(start_date=None, end_date=None, db=db, current_user=user, tenant_id=3, site_id=3)
    print("Dashboard Stats:", stats.dict())
finally:
    db.close()
