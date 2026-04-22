"""Drop all tables and recreate them."""
from sqlalchemy import text
from app.database import engine, Base
from app import models

with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
    conn.commit()

print("Schema reset. Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
