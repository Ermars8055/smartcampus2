from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL
from app.models import StockLedger, Material, GRN, MaterialIssue
import os

# Assuming database URL is available in env or known
SQLALCHEMY_DATABASE_URL = DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("Checking StockLedger entries...")
materials = db.query(Material).limit(5).all()
for m in materials:
    print(f"\nMaterial: {m.code} - {m.name}")
    ledgers = db.query(StockLedger).filter(StockLedger.material_id == m.id).order_by(StockLedger.created_at.asc()).all()
    if not ledgers:
        print("  No ledger entries.")
        continue
    for l in ledgers:
        print(f"  [{l.created_at}] Type: {l.transaction_type}, Qty: {l.quantity}, Bal: {l.balance}, WH: {l.warehouse_id}")

db.close()
