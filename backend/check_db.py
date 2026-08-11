from sqlalchemy import create_engine, inspect
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)
columns = inspector.get_columns('tenant_configurations')
for col in columns:
    print(col['name'])
