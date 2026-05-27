from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Indent

db = SessionLocal()

print("--- Indents ---")
for ind in db.query(Indent).limit(10).all():
    print(f"Indent {ind.indent_number}: department = '{ind.department}'")

