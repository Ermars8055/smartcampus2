from fastapi import APIRouter

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("/count")
def get_alert_count():
    return {"count": 0}
