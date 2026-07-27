import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT po_number, advance_percentage FROM purchase_orders WHERE po_number = 'EPCET/PO-00001';")).fetchone()
    print("DB Result:", dict(result._mapping) if result else "Not found")
