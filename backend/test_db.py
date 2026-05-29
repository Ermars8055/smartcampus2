import sqlite3

def check_db():
    conn = sqlite3.connect('nissigrid_stores.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("--- Users ---")
    users = cursor.execute("SELECT id, username, first_name, is_active FROM users").fetchall()
    for u in users:
        print(dict(u))

    print("\n--- Tenants ---")
    tenants = cursor.execute("SELECT id, name FROM tenants").fetchall()
    for t in tenants:
        print(dict(t))

    print("\n--- Sites ---")
    sites = cursor.execute("SELECT id, name, tenant_id FROM sites").fetchall()
    for s in sites:
        print(dict(s))
        
    print("\n--- User Sites ---")
    us = cursor.execute("SELECT user_id, site_id FROM user_sites").fetchall()
    for u in us:
        print(dict(u))

    print("\n--- Materials (count) ---")
    mat_count = cursor.execute("SELECT COUNT(*) as c FROM materials").fetchone()['c']
    print("Total materials:", mat_count)

    print("\n--- GRNs (count) ---")
    grn_count = cursor.execute("SELECT COUNT(*) as c FROM grns").fetchone()['c']
    print("Total GRNs:", grn_count)
    
check_db()
