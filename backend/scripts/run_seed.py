from app.database import SessionLocal
from app.seed_data import seed_database

db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()
