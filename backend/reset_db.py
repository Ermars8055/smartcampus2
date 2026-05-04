"""Drop all tables and recreate them."""
from sqlalchemy import text
from app.database import engine, Base
from app import models
from app.config import DATABASE_URL

if DATABASE_URL.startswith("postgresql"):
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
elif DATABASE_URL.startswith("sqlite"):
    import os
    db_file = DATABASE_URL.replace("sqlite:///", "")
    if os.path.exists(db_file):
        os.remove(db_file)
    # Re-initialize engine because file was deleted
    from sqlalchemy import create_engine
    engine = create_engine(DATABASE_URL)


print("Schema reset. Creating all tables...")
Base.metadata.create_all(bind=engine)
print("Done.")
