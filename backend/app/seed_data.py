"""Minimal seed: creates only a platform super-admin so the system can be bootstrapped via UI."""
from sqlalchemy.orm import Session
from app.models import User
from app.auth import get_password_hash


def seed_database(db: Session):
    if db.query(User).count() > 0:
        return  # already bootstrapped

    print("Creating platform super-admin …")
    db.add(User(
        username="superadmin",
        email="super@nissigrid.com",
        full_name="Super Admin",
        hashed_password=get_password_hash("admin123"),
        is_platform_admin=True,
    ))
    db.commit()
    print("Done — log in at /platform/login with superadmin / admin123")
