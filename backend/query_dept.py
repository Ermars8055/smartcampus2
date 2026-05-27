from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import MaterialIssue, Department, MaterialReturn

db = SessionLocal()

print("--- Material Issues with Department ---")
for i in db.query(MaterialIssue).filter(MaterialIssue.issued_to_department != None).limit(5).all():
    print(f"Issue {i.id}: issued_to_department = '{i.issued_to_department}'")

print("--- Total Material Issues ---")
print(db.query(MaterialIssue).count())
print("--- Material Issues with Department Count ---")
print(db.query(MaterialIssue).filter(MaterialIssue.issued_to_department != None).count())

