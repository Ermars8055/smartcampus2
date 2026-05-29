import sys
from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user
from app.models import User

# Override dependency to mock the current user
def override_get_current_user():
    user = User(
        id=4, username="gradmin", email="admin@grinfra.com", full_name="Fredrick"
    )
    user._tenant_id = 3
    user._site_ids = [3]
    user._active_site_id = 3
    user._roles = ["STOREADMIN"]
    user._permissions = {"dashboard": {"can_read": True}}
    user._is_platform_admin = False
    return user

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)
response = client.get("/api/dashboard/stats", headers={"X-Site-Id": "3"})
print(response.json())
