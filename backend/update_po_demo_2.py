import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("UPDATE purchase_orders SET advance_percentage = 25 WHERE po_number = 'EPCET/PO-00001';"))
        conn.commit()
        print("Updated EPCET/PO-00001 to have 25% advance.")
    except Exception as e:
        print("Error:", e)
