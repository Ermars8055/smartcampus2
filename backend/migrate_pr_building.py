"""Quick migration to add building_id and department_name to purchase_requests table."""
import psycopg2

DB_URL = "postgresql+psycopg2://postgres:postgres123@localhost:5432/smartcampus_local"

# Parse connection params from SQLAlchemy URL
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="smartcampus_local",
    user="postgres",
    password="postgres123"
)
conn.autocommit = True
cur = conn.cursor()

# Check if columns already exist before adding
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_requests' AND column_name = 'building_id'
""")
if not cur.fetchone():
    cur.execute("ALTER TABLE purchase_requests ADD COLUMN building_id INTEGER REFERENCES buildings(id)")
    print("Added building_id column")
else:
    print("building_id column already exists")

cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'purchase_requests' AND column_name = 'department_name'
""")
if not cur.fetchone():
    cur.execute("ALTER TABLE purchase_requests ADD COLUMN department_name VARCHAR(255)")
    print("Added department_name column")
else:
    print("department_name column already exists")

cur.close()
conn.close()
print("Migration complete!")
