import sys
import os
import re

# Add the parent directory to the path so we can import the app module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Vendor

def generate_dummy_email(vendor_name: str, contact_person: str) -> str:
    name_part = contact_person if contact_person else vendor_name
    if not name_part:
        return "vendor@dummy.com"
    
    # Remove non-alphanumeric characters, replace space with dot, lowercase
    clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', name_part).strip()
    email_prefix = re.sub(r'\s+', '.', clean_name).lower()
    
    # Remove common suffixes and non-alphanumeric chars for vendor
    clean_vendor = re.sub(r'(?i)\b(ltd|limited|pvt|private|company|co)\b', '', vendor_name)
    clean_vendor = re.sub(r'[^a-zA-Z0-9\s]', '', clean_vendor).strip()
    
    # Take only the first word for a short domain
    vendor_words = clean_vendor.split()
    vendor_prefix = vendor_words[0].lower() if vendor_words else "vendor"
    
    if not email_prefix:
        email_prefix = "contact"
    
    domain = f"{vendor_prefix}.com" if vendor_prefix else "dummy.com"
    
    return f"{email_prefix}@{domain}"

def main():
    db: Session = SessionLocal()
    try:
        vendors = db.query(Vendor).all()
        count = 0
        for vendor in vendors:
            # Generate email if it's missing or if we want to overwrite it all (user asked to feed it in the email id column)
            new_email = generate_dummy_email(vendor.name, vendor.contact_person)
            vendor.email = new_email
            count += 1
            print(f"Updated vendor {vendor.name} with email: {new_email}")
        
        db.commit()
        print(f"Successfully updated {count} vendors.")
    except Exception as e:
        print(f"An error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
