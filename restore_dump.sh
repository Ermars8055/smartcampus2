#!/usr/bin/env bash

echo "=== [1/4] Preparing PostgreSQL schema and roles ==="
docker compose exec -T db psql -U nissigrid -d nissigrid_stores << 'EOF'
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres WITH SUPERUSER LOGIN;
  END IF;
END $$;
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO nissigrid;
GRANT ALL ON SCHEMA public TO public;
EOF

echo "=== [2/4] Restoring full database dump ==="
docker compose exec -T db psql -U nissigrid -d nissigrid_stores < database/nissigrid_stores_dump.sql || true

echo "=== [3/4] Granting privileges to user nissigrid ==="
docker compose exec -T db psql -U nissigrid -d nissigrid_stores << 'EOF'
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nissigrid;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nissigrid;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nissigrid;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nissigrid;
EOF

echo "=== [4/4] Setting default passwords to Admin@123 ==="
docker compose exec backend python -c "
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

db = SessionLocal()
for uname in ['superadmin', 'epadmin', 'admin', 'EPCET']:
    u = db.query(User).filter_by(username=uname).first()
    if u:
        u.hashed_password = get_password_hash('Admin@123')
        print(f'Set password for {uname}')
db.commit()
db.close()
"

echo "=== Restarting Backend ==="
docker compose restart backend

echo ""
echo "=========================================================="
echo "SUCCESS! Database restored and credentials configured."
echo "Tenant Login:  https://smartcampus.nissigrid.com/login"
echo "  Workspace ID : eastpoint"
echo "  Username     : epadmin"
echo "  Password     : Admin@123"
echo "----------------------------------------------------------"
echo "Platform Admin: https://smartcampus.nissigrid.com/platform/login"
echo "  Username     : superadmin"
echo "  Password     : Admin@123"
echo "=========================================================="
