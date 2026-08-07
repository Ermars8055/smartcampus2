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
        
    extracted_clean = re.sub(r'[^a-zA-Z0-9\s]', '', str(extracted_name)).lower().strip()
    
    best_item = None
    best_score = 0.0
    
    for item in qr_items:
        if not item.material: continue
        mat_clean = re.sub(r'[^a-zA-Z0-9\s]', '', item.material.name).lower().strip()
        
        # Exact match
        if extracted_clean == mat_clean:
            return item, 1.0
            
        # Partial match score using SequenceMatcher
        score = difflib.SequenceMatcher(None, extracted_clean, mat_clean).ratio()
        
        # Token set ratio equivalent logic (checking if all words in one are in the other)
        ext_words = set(extracted_clean.split())
        mat_words = set(mat_clean.split())
        
        if ext_words and mat_words:
            intersection = ext_words.intersection(mat_words)
            token_score = len(intersection) / max(len(ext_words), len(mat_words))
            # Boost score if token overlap is high
            score = max(score, token_score)
            
        if score > best_score:
            best_score = score
            best_item = item
            
    if best_item and best_score >= 0.4:
        return best_item, round(best_score, 2)
        
    return None, 0.0


def extract_from_excel(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path, header=None)
        else:
            df = pd.read_excel(file_path, header=None)
            
        # Try to find header row dynamically in first 10 rows
        header_idx = 0
        best_match_count = 0
        for i in range(min(10, len(df))):
            row_vals = [str(x).lower() for x in df.iloc[i].values if pd.notna(x)]
            match_count = sum(1 for v in row_vals if any(k in v for k in ['item', 'material', 'description', 'rate', 'price', 'brand', 'qty', 'quantity', 'discount', 'disc', 'dis', 'amt', 'amount']))
            if match_count > best_match_count:
                best_match_count = match_count
                header_idx = i
                
        if best_match_count >= 2:
            # Re-read with correct header
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, header=header_idx)
            else:
                df = pd.read_excel(file_path, header=header_idx)
        
        # Basic mapping heuristic for column headers
        col_map = {
            'material': None,
            'rate': None,
            'brand': None,
            'uom': None,
            'delivery': None,
            'discount': None
        }
        
        for col in df.columns:
            col_lower = str(col).lower()
            if not col_map['material'] and any(x in col_lower for x in ['item', 'material', 'description', 'name', 'particular', 'goods']):
                col_map['material'] = col
            elif not col_map['rate'] and any(x in col_lower for x in ['rate', 'price', 'cost', 'amt', 'amount']):
                col_map['rate'] = col
            elif not col_map['brand'] and any(x in col_lower for x in ['brand', 'make']):
                col_map['brand'] = col
            elif not col_map['uom'] and any(x in col_lower for x in ['unit', 'uom', 'measure', 'per', 'packing']):
                col_map['uom'] = col
            elif not col_map['delivery'] and any(x in col_lower for x in ['delivery', 'days', 'lead time', 'eta', 'status']):
                col_map['delivery'] = col
            elif not col_map['discount'] and any(x in col_lower for x in ['disc', 'discount', 'dis']):
                col_map['discount'] = col
                
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
                
            # Skip summary rows
            mat_lower = mat_name.lower()
            if any(skip in mat_lower for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'discount', 'freight', 'amount']):
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

            discount_val = 0.0
            if col_map['discount'] and pd.notna(row[col_map['discount']]):
                raw_disc = str(row[col_map['discount']]).strip().replace('%', '')
                try:
                    discount_val = float(raw_disc)
                except:
                    pass

            matched_item, conf = fuzzy_match_material(mat_name, qr_items)
            
            parsed_rows.append({
                'mat_name': mat_name,
                'rate': rate_val,
                'brand': brand_val,
                'uom': uom_val,
                'delivery': delivery_val,
                'discount': discount_val,
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
                discount_percent=p_row.get('discount', 0.0),
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
                if not tables:
                    # Fallback to text parsing if no tables found
                    text = page.extract_text()
                    if text:
                        lines = text.split('\n')
                        for line in lines:
                            money_match = re.search(r'(?:Rs\.?|INR|\$|£)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\b', line)
                            if money_match:
                                rate_val = 0.0
                                try:
                                    rate_val = float(money_match.group(1).replace(',', ''))
                                except: pass
                                
                                mat_name = line.replace(money_match.group(0), '').strip()
                                mat_name = re.sub(r'[^a-zA-Z0-9\s\(\)]+$', '', mat_name).strip()
                                
                                if len(mat_name) > 3:
                                    if any(skip in mat_name.lower() for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'amount']):
                                        continue
                                    matched_item, conf = fuzzy_match_material(mat_name, qr_items)
                                    # Contextual brand/uom extraction could go here
                                    brand_match = re.search(r'(?i)make:\s*([a-zA-Z0-9]+)', line)
                                    brand_val = brand_match.group(1) if brand_match else None
                                    
                                    results.append(ExtractionResultItem(
                                        material_id=matched_item.material_id if matched_item else None,
                                        material_name=matched_item.material.name if matched_item else mat_name,
                                        quoted_rate=rate_val,
                                        brand=brand_val,
                                        confidence_score=conf,
                                        raw_text=line
                                    ))
                    continue
                    
                for table in tables:
                    col_map = {
                        'material': None, 'rate': None, 'brand': None, 
                        'uom': None, 'delivery': None, 'discount': None
                    }
                    header_found = False
                    
                    for row in table:
                        if not row or not any(row): continue
                        
                        row_texts = [str(cell).strip().replace('\n', ' ') for cell in row if cell]
                        
                        if not header_found:
                            match_count = sum(1 for v in row_texts if any(k in v.lower() for k in ['item', 'material', 'description', 'rate', 'price', 'brand', 'qty', 'quantity', 'discount', 'disc', 'dis', 'amt', 'amount']))
                            if match_count >= 2:
                                header_found = True
                                for i, cell in enumerate(row):
                                    if not cell: continue
                                    col_lower = str(cell).lower().replace('\n', ' ').strip()
                                    if col_map['material'] is None and any(x in col_lower for x in ['item', 'material', 'description', 'name', 'particular', 'goods']):
                                        col_map['material'] = i
                                    elif col_map['rate'] is None and any(x in col_lower for x in ['rate', 'price', 'cost', 'amt', 'amount']):
                                        col_map['rate'] = i
                                    elif col_map['brand'] is None and any(x in col_lower for x in ['brand', 'make']):
                                        col_map['brand'] = i
                                    elif col_map['uom'] is None and any(x in col_lower for x in ['unit', 'uom', 'measure', 'per', 'packing']):
                                        col_map['uom'] = i
                                    elif col_map['delivery'] is None and any(x in col_lower for x in ['delivery', 'days', 'lead time', 'eta', 'status']):
                                        col_map['delivery'] = i
                                    elif col_map['discount'] is None and any(x in col_lower for x in ['disc', 'discount', 'dis']):
                                        col_map['discount'] = i
                                continue # Skip processing data for header row
                                
                        mat_name = ""
                        rate_val = 0.0
                        brand_val = None
                        uom_val = None
                        delivery_val = None
                        discount_val = 0.0
                        
                        if header_found and col_map['material'] is not None:
                            # Extract using mapped indices
                            if col_map['material'] < len(row) and row[col_map['material']]:
                                mat_name = str(row[col_map['material']]).strip().replace('\n', ' ')
                            if col_map['rate'] is not None and col_map['rate'] < len(row) and row[col_map['rate']]:
                                try: rate_val = float(str(row[col_map['rate']]).replace(',', '').strip())
                                except: pass
                            if col_map['brand'] is not None and col_map['brand'] < len(row) and row[col_map['brand']]:
                                brand_val = str(row[col_map['brand']]).strip().replace('\n', ' ')
                            if col_map['uom'] is not None and col_map['uom'] < len(row) and row[col_map['uom']]:
                                uom_val = str(row[col_map['uom']]).strip().replace('\n', ' ')
                            if col_map['delivery'] is not None and col_map['delivery'] < len(row) and row[col_map['delivery']]:
                                try: delivery_val = int(float(str(row[col_map['delivery']]).strip()))
                                except: pass
                            if col_map['discount'] is not None and col_map['discount'] < len(row) and row[col_map['discount']]:
                                try: discount_val = float(str(row[col_map['discount']]).strip().replace('%', ''))
                                except: pass
                        else:
                            # Fallback logic for unmapped tables
                            for i, text in enumerate(row_texts):
                                if len(text) > len(mat_name) and not text.replace('.', '', 1).isdigit() and len(text) > 3:
                                    mat_name = text
                                    
                                money_match = re.search(r'(?:Rs\.?|INR|\$|£)\s*(\d+(?:,\d+)*(?:\.\d+)?)\b', text, re.IGNORECASE)
                                decimal_match = re.search(r'\b(\d+(?:,\d+)*\.\d{2,})\b', text)
                                generic_match = re.search(r'\b(\d+(?:,\d+)*)\b', text)
                                
                                val_str = None
                                if money_match:
                                    val_str = money_match.group(1)
                                elif decimal_match:
                                    val_str = decimal_match.group(1)
                                elif generic_match and i > 1 and rate_val == 0.0:
                                    val_str = generic_match.group(1)
                                    
                                if val_str:
                                    try:
                                        val = float(val_str.replace(',', ''))
                                        if val > 0:
                                            if (money_match or decimal_match) or rate_val == 0.0:
                                                rate_val = val
                                    except: pass
                                    
                                if text.lower() in ['nos', 'kg', 'ltr', 'box', 'pc', 'pcs', 'pack', 'gm', 'mg', 'ml']:
                                    uom_val = text
                                    
                                if 'make' in text.lower() or 'brand' in text.lower():
                                    brand_val = text.split(':')[-1].strip()

                        if mat_name:
                            # Skip summary rows in pdf tables too
                            if any(skip in mat_name.lower() for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'amount']):
                                continue
                                
                            matched_item, conf = fuzzy_match_material(mat_name, qr_items)
                            if rate_val > 0 and conf > 0.0: conf = min(1.0, conf + 0.1)
                            
                            results.append(ExtractionResultItem(
                                material_id=matched_item.material_id if matched_item else None,
                                material_name=matched_item.material.name if matched_item else mat_name,
                                quoted_rate=rate_val,
                                brand=brand_val,
                                vendor_uom_name=uom_val,
                                delivery_days=delivery_val,
                                discount_percent=discount_val,
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
