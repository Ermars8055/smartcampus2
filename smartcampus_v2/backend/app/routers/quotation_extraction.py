from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import shutil
import pandas as pd
import difflib
import re

from app.database import get_db
from app.auth import get_current_user, require_permission, get_tenant_id, get_site_id
from app.models import QuotationRequest, User
from app.schemas import ExtractionResultItem

router = APIRouter(prefix="/api/quotations", tags=["Quotation Extraction"])


def fuzzy_match_material(extracted_name: str, qr_items: list) -> tuple:
    """Returns (best_match_item, confidence_score)"""
    if not extracted_name or not isinstance(extracted_name, str):
        return None, 0.0
        
    names = [item.material.name for item in qr_items if item.material]
    extracted_name = str(extracted_name).strip()
    
    matches = difflib.get_close_matches(extracted_name, names, n=1, cutoff=0.5)
    
    if matches:
        best_name = matches[0]
        # Calculate a simple confidence score
        confidence = difflib.SequenceMatcher(None, extracted_name.lower(), best_name.lower()).ratio()
        
        for item in qr_items:
            if item.material and item.material.name == best_name:
                return item, round(confidence, 2)
                
    return None, 0.0


def extract_from_excel(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
            
        # Basic mapping heuristic for column headers
        col_map = {
            'material': None,
            'rate': None,
            'brand': None,
            'uom': None,
            'delivery': None
        }
        
        for col in df.columns:
            col_lower = str(col).lower()
            if any(x in col_lower for x in ['item', 'material', 'description', 'name']):
                col_map['material'] = col
            elif any(x in col_lower for x in ['rate', 'price', 'unit price', 'cost']):
                col_map['rate'] = col
            elif 'brand' in col_lower or 'make' in col_lower:
                col_map['brand'] = col
            elif any(x in col_lower for x in ['unit', 'uom', 'measure']):
                col_map['uom'] = col
            elif any(x in col_lower for x in ['delivery', 'days', 'lead time']):
                col_map['delivery'] = col
                
        if not col_map['material']:
            # Fallback to first string column
            for col in df.columns:
                if df[col].dtype == 'object':
                    col_map['material'] = col
                    break
                    
        if not col_map['rate']:
            # Fallback to first numeric column
            for col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    col_map['rate'] = col
                    break

        matched_qr_ids = set()
        parsed_rows = []
        for index, row in df.iterrows():
            mat_name = str(row[col_map['material']]) if col_map['material'] and pd.notna(row[col_map['material']]) else ""
            if not mat_name or mat_name.lower() == 'nan':
                continue
                
            rate_val = row[col_map['rate']] if col_map['rate'] and pd.notna(row[col_map['rate']]) else 0.0
            try:
                rate_val = float(str(rate_val).replace(',', '').strip())
            except:
                rate_val = 0.0
                
            brand_val = str(row[col_map['brand']]) if col_map['brand'] and pd.notna(row[col_map['brand']]) else None
            uom_val = str(row[col_map['uom']]) if col_map['uom'] and pd.notna(row[col_map['uom']]) else None
            if brand_val and brand_val.lower() == 'nan': brand_val = None
            if uom_val and uom_val.lower() == 'nan': uom_val = None

            delivery_val = row[col_map['delivery']] if col_map['delivery'] and pd.notna(row[col_map['delivery']]) else None
            if delivery_val is not None:
                try:
                    delivery_val = int(float(str(delivery_val).strip()))
                except:
                    delivery_val = None

            matched_item, conf = fuzzy_match_material(mat_name, qr_items)
            
            parsed_rows.append({
                'mat_name': mat_name,
                'rate': rate_val,
                'brand': brand_val,
                'uom': uom_val,
                'delivery': delivery_val,
                'matched_item': matched_item,
                'confidence': conf
            })
            if matched_item:
                matched_qr_ids.add(matched_item.id)

        # Unmatched QR items in order
        unmatched_qr_items = [item for item in qr_items if item.id not in matched_qr_ids]
        
        # Pass 2: Fallback for rows that had no fuzzy match
        unmatched_idx = 0
        for p_row in parsed_rows:
            if not p_row['matched_item'] and unmatched_idx < len(unmatched_qr_items):
                p_row['matched_item'] = unmatched_qr_items[unmatched_idx]
                p_row['confidence'] = 0.5  # default/fallback confidence
                unmatched_idx += 1
                
            # Append to final results
            matched_item = p_row['matched_item']
            results.append(ExtractionResultItem(
                material_id=matched_item.material_id if matched_item else None,
                material_name=matched_item.material.name if matched_item else p_row['mat_name'],
                quoted_rate=p_row['rate'],
                brand=p_row['brand'],
                vendor_uom_name=p_row['uom'],
                delivery_days=p_row['delivery'],
                uom_conversion_factor=1.0,
                confidence_score=p_row['confidence'],
                raw_text=p_row['mat_name']
            ))
            
    except Exception as e:
        print(f"Excel extraction error: {e}")
        
    return results


def extract_from_pdf(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if not row or not any(row): continue
                        
                        # Very basic heuristic: 
                        # Longest text is probably material, first numeric is probably rate
                        row_texts = [str(cell).strip().replace('\n', ' ') for cell in row if cell]
                        
                        mat_name = ""
                        rate_val = 0.0
                        
                        for text in row_texts:
                            if len(text) > len(mat_name) and not text.replace('.', '', 1).isdigit():
                                mat_name = text
                                
                            # Extract rate
                            money_match = re.search(r'(?:Rs\.?|INR|\$|£)?\s*(\d+(?:,\d+)*(?:\.\d+)?)', text)
                            if money_match and rate_val == 0.0:
                                try:
                                    rate_val = float(money_match.group(1).replace(',', ''))
                                except:
                                    pass
                                    
                        if mat_name:
                            matched_item, conf = fuzzy_match_material(mat_name, qr_items)
                            results.append(ExtractionResultItem(
                                material_id=matched_item.material_id if matched_item else None,
                                material_name=matched_item.material.name if matched_item else mat_name,
                                quoted_rate=rate_val,
                                confidence_score=conf,
                                raw_text=mat_name
                            ))
    except Exception as e:
        print(f"PDF extraction error: {e}")
        
    return results


def extract_from_image(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        import pytesseract
        from PIL import Image
        
        text = pytesseract.image_to_string(Image.open(file_path))
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            # Look for lines that look like "Item Name ... 500.00"
            money_match = re.search(r'(?:Rs\.?|INR|\$|£)?\s*(\d+(?:,\d+)*(?:\.\d+)?)', line)
            
            if money_match:
                rate_val = 0.0
                try:
                    rate_val = float(money_match.group(1).replace(',', ''))
                except:
                    pass
                    
                # Remove the money part to get the name
                mat_name = line.replace(money_match.group(0), '').strip()
                # Clean up trailing special chars
                mat_name = re.sub(r'[^a-zA-Z0-9\s\(\)]+$', '', mat_name).strip()
                
                if len(mat_name) > 3:
                    matched_item, conf = fuzzy_match_material(mat_name, qr_items)
                    results.append(ExtractionResultItem(
                        material_id=matched_item.material_id if matched_item else None,
                        material_name=matched_item.material.name if matched_item else mat_name,
                        quoted_rate=rate_val,
                        confidence_score=conf,
                        raw_text=line
                    ))
                    
    except Exception as e:
        print(f"Image extraction error: {e}")
        
    return results


@router.post("/{qr_id}/vendor-quotation/extract", response_model=List[ExtractionResultItem])
def extract_quotation_data(
    qr_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "update")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    qr = db.query(QuotationRequest).filter(
        QuotationRequest.id == qr_id, QuotationRequest.tenant_id == tenant_id, QuotationRequest.site_id == site_id
    ).first()
    
    if not qr:
        raise HTTPException(status_code=404, detail="Quotation Request not found")

    upload_dir = "uploads/temp"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        ext = file.filename.lower()
        results = []
        
        if ext.endswith(('.xlsx', '.xls', '.csv')):
            results = extract_from_excel(file_path, qr.items)
        elif ext.endswith('.pdf'):
            results = extract_from_pdf(file_path, qr.items)
        elif ext.endswith(('.png', '.jpg', '.jpeg')):
            results = extract_from_image(file_path, qr.items)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload Excel, PDF, or Image.")
            
        return results
        
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
