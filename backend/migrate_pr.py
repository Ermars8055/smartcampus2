from app.database import engine, SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # Safely create the new purchase_request_items table
    db.execute(text("""
    CREATE TABLE IF NOT EXISTS purchase_request_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pr_id INTEGER NOT NULL,
        material_id INTEGER NOT NULL,
        quantity FLOAT NOT NULL,
        FOREIGN KEY(pr_id) REFERENCES purchase_requests(id),
        FOREIGN KEY(material_id) REFERENCES materials(id)
    )
    """))
    
    # Check if purchase_requests still has material_id
    res = db.execute(text("PRAGMA table_info(purchase_requests)")).fetchall()
    cols = [r[1] for r in res]
    if 'material_id' in cols:
        print("Migrating items to purchase_request_items...")
        # Insert existing PR lines as items
        db.execute(text("""
        INSERT INTO purchase_request_items (pr_id, material_id, quantity)
        SELECT id, material_id, quantity FROM purchase_requests
        """))
        
        # We need to recreate purchase_requests without material_id and quantity
        db.execute(text("""
        CREATE TABLE purchase_requests_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pr_number VARCHAR(50) NOT NULL UNIQUE,
            requester_id INTEGER NOT NULL,
            required_for_block_id INTEGER,
            project_id INTEGER NOT NULL,
            required_date DATE NOT NULL,
            remarks TEXT,
            status VARCHAR(50),
            approved_by_id INTEGER,
            approved_at DATETIME,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY(requester_id) REFERENCES users(id),
            FOREIGN KEY(required_for_block_id) REFERENCES blocks(id),
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(approved_by_id) REFERENCES users(id)
        )
        """))
        # Copy data
        db.execute(text("""
        INSERT INTO purchase_requests_new (
            id, pr_number, requester_id, required_for_block_id, project_id,
            required_date, remarks, status, approved_by_id, approved_at,
            created_at, updated_at
        )
        SELECT 
            id, pr_number, requester_id, required_for_block_id, project_id,
            required_date, remarks, status, approved_by_id, approved_at,
            created_at, updated_at
        FROM purchase_requests
        """))
        db.execute(text("DROP TABLE purchase_requests"))
        db.execute(text("ALTER TABLE purchase_requests_new RENAME TO purchase_requests"))
        print("Migration complete!")
    else:
        print("Migration already applied.")
        
    db.commit()
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
