import sys
from sqlalchemy import create_engine, text
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    print("--- Users ---")
    res = conn.execute(text("SELECT id, username, full_name, is_active FROM users")).fetchall()
    for row in res:
        print(row)

    print("\n--- Tenants ---")
    res = conn.execute(text("SELECT id, name, slug FROM tenants")).fetchall()
    for row in res:
        print(row)
        
    print("\n--- Sites ---")
    res = conn.execute(text("SELECT id, tenant_id, name, code FROM sites")).fetchall()
    for row in res:
        print(row)

    print("\n--- Current Stocks ---")
    res = conn.execute(text("SELECT tenant_id, site_id, count(*) as count FROM current_stock group by tenant_id, site_id")).fetchall()
    for row in res:
        print(row)
        
    print("\n--- Material Issues ---")
    res = conn.execute(text("SELECT tenant_id, site_id, count(*) as count FROM material_issues group by tenant_id, site_id")).fetchall()
    for row in res:
        print(row)
