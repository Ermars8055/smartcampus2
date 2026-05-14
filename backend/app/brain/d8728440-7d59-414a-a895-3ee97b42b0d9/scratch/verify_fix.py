from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import DATABASE_URL
from app.models import StockLedger, Material
from datetime import datetime
import os

# Assuming database URL is available in env or known
SQLALCHEMY_DATABASE_URL = DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Mocking the report parameters
from_date = "2026-05-14"
to_date = "2026-05-14"
dt_from = datetime.strptime(from_date, "%Y-%m-%d").replace(hour=0, minute=0, second=0)
dt_to = datetime.strptime(to_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)

# Get material MAT-00001
mat = db.query(Material).filter(Material.code == "MAT-00001").first()
if not mat:
    print("Material MAT-00001 not found.")
    exit()

material_ids = [mat.id]

# --- Opening Stock Logic ---
sl_op_query = db.query(StockLedger.material_id, StockLedger.warehouse_id, StockLedger.balance).filter(
    StockLedger.material_id.in_(material_ids),
    StockLedger.created_at < dt_from
)
sl_op_entries = sl_op_query.order_by(StockLedger.created_at.desc()).all()
op_stocks_per_wh = {}
for entry in sl_op_entries:
    key = (entry.material_id, entry.warehouse_id)
    if key not in op_stocks_per_wh:
        op_stocks_per_wh[key] = entry.balance
opening_stocks = {}
for (m_id, wh_id), bal in op_stocks_per_wh.items():
    opening_stocks[m_id] = opening_stocks.get(m_id, 0) + bal

# --- Closing Stock Logic ---
sl_cl_query = db.query(StockLedger.material_id, StockLedger.warehouse_id, StockLedger.balance).filter(
    StockLedger.material_id.in_(material_ids),
    StockLedger.created_at <= dt_to
)
sl_cl_entries = sl_cl_query.order_by(StockLedger.created_at.desc()).all()
cl_stocks_per_wh = {}
for entry in sl_cl_entries:
    key = (entry.material_id, entry.warehouse_id)
    if key not in cl_stocks_per_wh:
        cl_stocks_per_wh[key] = entry.balance
closing_stocks = {}
for (m_id, wh_id), bal in cl_stocks_per_wh.items():
    closing_stocks[m_id] = closing_stocks.get(m_id, 0) + bal

print(f"Material: {mat.code} - {mat.name}")
print(f"Opening Stock: {opening_stocks.get(mat.id, 0.0)}")
print(f"Closing Stock: {closing_stocks.get(mat.id, 0.0)}")

db.close()
