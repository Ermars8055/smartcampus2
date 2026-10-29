import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine
from sqlalchemy import text

def migrate():
    columns_to_add = [
        ("equipment_photos", "JSON DEFAULT '[]'::json"),
        ("serial_number_photos", "JSON DEFAULT '[]'::json"),
        ("installation_documents", "JSON DEFAULT '[]'::json"),
        ("other_documents", "JSON DEFAULT '[]'::json"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_def in columns_to_add:
            query = text(f"ALTER TABLE equipment_items ADD COLUMN IF NOT EXISTS {col_name} {col_def};")
            conn.execute(query)
            print(f"Added column (if not exists): {col_name}")
        
        # Backfill existing legacy columns into JSON arrays if they exist and JSON array is empty
        backfill_queries = [
            text("""
                UPDATE equipment_items 
                SET equipment_photos = json_build_array(json_build_object('url', equipment_photo_url, 'name', 'Equipment Photo'))
                WHERE equipment_photo_url IS NOT NULL 
                  AND equipment_photo_url != '' 
                  AND (equipment_photos IS NULL OR equipment_photos::text = '[]' OR equipment_photos::text = 'null');
            """),
            text("""
                UPDATE equipment_items 
                SET serial_number_photos = json_build_array(json_build_object('url', serial_number_photo_url, 'name', 'Serial Number Photo'))
                WHERE serial_number_photo_url IS NOT NULL 
                  AND serial_number_photo_url != '' 
                  AND (serial_number_photos IS NULL OR serial_number_photos::text = '[]' OR serial_number_photos::text = 'null');
            """),
            text("""
                UPDATE equipment_items 
                SET installation_documents = json_build_array(json_build_object('url', installation_report_url, 'name', 'Installation Report'))
                WHERE installation_report_url IS NOT NULL 
                  AND installation_report_url != '' 
                  AND (installation_documents IS NULL OR installation_documents::text = '[]' OR installation_documents::text = 'null');
            """)
        ]
        for bq in backfill_queries:
            res = conn.execute(bq)
            print(f"Backfill executed, rows updated: {res.rowcount}")
            
        conn.commit()
    print("Equipment documents migration completed successfully!")

if __name__ == "__main__":
    migrate()
