from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    print("\n--- Materials ---")
    res = conn.execute(text("SELECT tenant_id, site_id, count(*) as count FROM materials group by tenant_id, site_id")).fetchall()
    for row in res:
        print(row)
