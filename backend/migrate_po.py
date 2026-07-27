import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN is_cash_purchase BOOLEAN DEFAULT FALSE;"))
        print("Added is_cash_purchase")
    except Exception as e:
        print("Error adding is_cash_purchase:", e)
    
    try:
        conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN advance_percentage FLOAT DEFAULT 0;"))
        print("Added advance_percentage")
    except Exception as e:
        print("Error adding advance_percentage:", e)
    
    conn.commit()

print("Done")
