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

# Column Extraction Keyword Dictionaries
MATERIAL_KEYWORDS = ['item', 'material', 'description', 'name', 'particular', 'goods', 'descrip', 'product', 'chemical']
RATE_KEYWORDS = ['rate', 'price', 'cost', 'unitprice', 'basicprice', 'unitcost', 'quotedrate', 'mrp', 'amount', 'amt', 'value']
BRAND_KEYWORDS = ['brand', 'make', 'mfg', 'manufacturer', 'company', 'brandname']
UOM_KEYWORDS = ['unit', 'uom', 'measure', 'per', 'packing', 'pack', 'pkg', 'size']
DELIVERY_KEYWORDS = ['delivery', 'days', 'leadtime', 'eta', 'status', 'time', 'period', 'duration', 'dispatch']
DISCOUNT_KEYWORDS = ['disc', 'discount', 'dis', 'deduction', 'rebate', 'discpercent', 'discountpercent', 'discountpercentage']
ALL_KEYWORDS = MATERIAL_KEYWORDS + RATE_KEYWORDS + BRAND_KEYWORDS + UOM_KEYWORDS + DELIVERY_KEYWORDS + DISCOUNT_KEYWORDS


def fuzzy_match_material(extracted_name: str, qr_items: list) -> tuple:
    """Returns (list_of_best_match_items, confidence_score)"""
    if not extracted_name or not isinstance(extracted_name, str):
        return [], 0.0
    extracted_clean = re.sub(r'[^a-zA-Z0-9\s]', '', str(extracted_name)).lower().strip()
    # Strip common chemical suffixes and grades to improve matching
    extracted_clean = re.sub(r'\b(lr|ar|extrapure|pure|assay|min|max|gr|grade|anhydrous|purified|molychem|srl|extra pure)\b', '', extracted_clean).strip()
    extracted_clean = re.sub(r'\s+', ' ', extracted_clean)
    best_items = []
    best_score = 0.0
    
    for item in qr_items:
        if not item.material: continue
        mat_clean = re.sub(r'[^a-zA-Z0-9\s]', '', item.material.name).lower().strip()
        
        # Exact match
        if extracted_clean == mat_clean:
            score = 1.0
        else:
            # Partial match score using SequenceMatcher
            score = difflib.SequenceMatcher(None, extracted_clean, mat_clean).ratio()
            
            # Boost if one is a substring of another (space-agnostic)
            mat_no_space = mat_clean.replace(' ', '')
            ext_no_space = extracted_clean.replace(' ', '')
            if len(mat_no_space) > 3 and mat_no_space in ext_no_space:
                score += 0.3
            elif len(ext_no_space) > 3 and ext_no_space in mat_no_space:
                score += 0.3
            
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
            best_items = [item]
        elif score == best_score and score > 0:
            best_items.append(item)
            
    if best_items and best_score >= 0.4:
        return best_items, round(best_score, 2)
        
    return [], 0.0


def extract_from_excel(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path, header=None)
        else:
            df = pd.read_excel(file_path, header=None)
            
        # Try to find header row dynamically in first 30 rows
        header_idx = 0
        best_match_count = 0
        for i in range(min(30, len(df))):
            row_vals = [str(x).lower() for x in df.iloc[i].values if pd.notna(x)]
            match_count = sum(1 for v in row_vals if any(k in v for k in ALL_KEYWORDS))
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
            col_clean = re.sub(r'[^a-z]', '', str(col).lower())
            if not col_map['material'] and any(x in col_clean for x in MATERIAL_KEYWORDS):
                col_map['material'] = col
            elif not col_map['rate'] and any(x in col_clean for x in RATE_KEYWORDS):
                col_map['rate'] = col
            elif not col_map['brand'] and any(x in col_clean for x in BRAND_KEYWORDS):
                col_map['brand'] = col
            elif not col_map['uom'] and any(x in col_clean for x in UOM_KEYWORDS):
                col_map['uom'] = col
            elif not col_map['delivery'] and any(x in col_clean for x in DELIVERY_KEYWORDS):
                col_map['delivery'] = col
            elif not col_map['discount'] and any(x in col_clean for x in DISCOUNT_KEYWORDS):
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
                    num_match = re.search(r'\d+', str(delivery_val))
                    if num_match:
                        delivery_val = int(num_match.group(0))
                    else:
                        delivery_val = None
                except:
                    delivery_val = None

            discount_val = 0.0
            if col_map['discount'] and pd.notna(row[col_map['discount']]):
                raw_disc = str(row[col_map['discount']]).strip()
                try:
                    disc_match = re.search(r'(\d+(?:\.\d+)?)', raw_disc)
                    if disc_match:
                        discount_val = float(disc_match.group(1))
                except:
                    pass

            matched_items, conf = fuzzy_match_material(mat_name, qr_items)
            
            parsed_rows.append({
                'mat_name': mat_name,
                'rate': rate_val,
                'brand': brand_val,
                'uom': uom_val,
                'delivery': delivery_val,
                'discount': discount_val,
                'matched_items': matched_items,
                'confidence': conf
            })
            if matched_items:
                for m_item in matched_items:
                    matched_qr_ids.add(m_item.id)

        # Unmatched QR items in order
        unmatched_qr_items = [item for item in qr_items if item.id not in matched_qr_ids]
        
        # Pass 2: Fallback for rows that had no fuzzy match
        unmatched_idx = 0
        for p_row in parsed_rows:
            if not p_row.get('matched_items') and unmatched_idx < len(unmatched_qr_items):
                p_row['matched_items'] = [unmatched_qr_items[unmatched_idx]]
                p_row['confidence'] = 0.5  # default/fallback confidence
                unmatched_idx += 1
                
            # Append to final results
            if p_row.get('matched_items'):
                for matched_item in p_row['matched_items']:
                    results.append(ExtractionResultItem(
                        material_id=matched_item.material_id,
                        material_name=matched_item.material.name,
                        quoted_rate=p_row['rate'],
                        brand=p_row['brand'],
                        vendor_uom_name=p_row['uom'],
                        delivery_days=p_row['delivery'],
                        discount_percent=p_row.get('discount', 0.0),
                        confidence_score=p_row['confidence'],
                        raw_text=p_row['mat_name']
                    ))
            else:
                results.append(ExtractionResultItem(
                    material_id=None,
                    material_name=p_row['mat_name'],
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


def explode_table_row(row):
    if not any(cell and '\n' in str(cell) for cell in row):
        return [row]
    
    split_cells = [str(cell).split('\n') if cell is not None else [] for cell in row]
    max_lines = max((len(c) for c in split_cells), default=0)
    multiline_count = sum(1 for c in split_cells if len(c) > 1)
    
    # Heuristic: if it looks like grouped rows (multiple columns have multiple lines, and max_lines is decent)
    if multiline_count >= 2 and max_lines >= 2:
        exploded = []
        for i in range(max_lines):
            new_row = []
            for cell_parts in split_cells:
                if i < len(cell_parts):
                    new_row.append(cell_parts[i].strip())
                else:
                    new_row.append("")
            exploded.append(new_row)
        return exploded
    else:
        # Just replace \n with space (wrapped text)
        return [[str(c).replace('\n', ' ') if c else c for c in row]]


def extract_from_pdf(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                page_results = []
                valid_table_found = False
                
                if tables:
                    for table in tables:
                        col_map = {
                            'material': None, 'rate': None, 'brand': None, 
                            'uom': None, 'delivery': None, 'discount': None
                        }
                        header_found = False
                        
                        for row_orig in table:
                            if not row_orig or not any(row_orig): continue
                            
                            exploded_rows = explode_table_row(row_orig)
                            
                            for row in exploded_rows:
                                if not any(row): continue
                                
                                row_texts = [str(cell).strip().replace('\n', ' ') for cell in row if cell]
                                
                                if not header_found:
                                    match_count = sum(1 for v in row_texts if any(k in re.sub(r'[^a-z]', '', v.lower()) for k in ALL_KEYWORDS))
                                    if match_count >= 2:
                                        header_found = True
                                        valid_table_found = True
                                    for i, cell in enumerate(row):
                                        if not cell: continue
                                        col_clean = re.sub(r'[^a-z]', '', str(cell).lower())
                                        if col_map['material'] is None and any(x in col_clean for x in MATERIAL_KEYWORDS):
                                            col_map['material'] = i
                                        elif col_map['rate'] is None and any(x in col_clean for x in RATE_KEYWORDS):
                                            col_map['rate'] = i
                                        elif col_map['brand'] is None and any(x in col_clean for x in BRAND_KEYWORDS):
                                            col_map['brand'] = i
                                        elif col_map['uom'] is None and any(x in col_clean for x in UOM_KEYWORDS):
                                            col_map['uom'] = i
                                        elif col_map['delivery'] is None and any(x in col_clean for x in DELIVERY_KEYWORDS):
                                            col_map['delivery'] = i
                                        elif col_map['discount'] is None and any(x in col_clean for x in DISCOUNT_KEYWORDS):
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
                                        try: 
                                            num_match = re.search(r'\d+', str(row[col_map['delivery']]))
                                            if num_match: delivery_val = int(num_match.group(0))
                                        except: pass
                                    if col_map['discount'] is not None and col_map['discount'] < len(row) and row[col_map['discount']]:
                                        try: 
                                            disc_match = re.search(r'(\d+(?:\.\d+)?)', str(row[col_map['discount']]))
                                            if disc_match: discount_val = float(disc_match.group(1))
                                        except: pass
                                        
                                    if mat_name:
                                        # Skip summary rows in pdf tables too
                                        if any(skip in mat_name.lower() for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'amount']):
                                            continue
                                            
                                        matched_items, conf = fuzzy_match_material(mat_name, qr_items)
                                        if rate_val > 0 and conf > 0.0: conf = min(1.0, conf + 0.1)
                                        
                                        if matched_items:
                                            for matched_item in matched_items:
                                                page_results.append(ExtractionResultItem(
                                                    material_id=matched_item.material_id,
                                                    material_name=matched_item.material.name,
                                                    quoted_rate=rate_val,
                                                    brand=brand_val,
                                                    vendor_uom_name=uom_val,
                                                    delivery_days=delivery_val,
                                                    discount_percent=discount_val,
                                                    confidence_score=conf,
                                                    raw_text=mat_name
                                                ))
                                        else:
                                            page_results.append(ExtractionResultItem(
                                                material_id=None,
                                                material_name=mat_name,
                                                quoted_rate=rate_val,
                                                brand=brand_val,
                                                vendor_uom_name=uom_val,
                                                delivery_days=delivery_val,
                                                discount_percent=discount_val,
                                                confidence_score=conf,
                                                raw_text=mat_name
                                            ))
                                
                        # Check for vertical merge or garbage table: if valid_table_found is True but we didn't extract any valid rates
                        if valid_table_found and not any(r.quoted_rate and r.quoted_rate > 0 for r in page_results):
                            valid_table_found = False
                            page_results = []
                
                if valid_table_found:
                    print(f'Page results len: {len(page_results)}')
                    results.extend(page_results)
                else:
                    # Fallback to text parsing if no valid tables found
                    text = page.extract_text()
                    if text:
                        lines = text.split('\n')
                        for line in lines:
                            # Extract all numbers from the line
                            money_matches = re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?\b', line)
                            if not money_matches:
                                continue
                                
                            rate_val = 0.0
                            
                            # Filter out matches that look like S.No or quantities (small integers without decimals)
                            valid_money = []
                            for idx, m in enumerate(money_matches):
                                m_clean = m.replace(',', '')
                                if '.' in m_clean or float(m_clean) > 50:
                                    if idx == 0 and not '.' in m_clean and float(m_clean) < 1000:
                                        continue
                                    valid_money.append(m_clean)
                                    
                            if valid_money:
                                # Often the rate is the first or second-to-last large number
                                try:
                                    rate_val = float(valid_money[0])
                                    if len(valid_money) >= 3:
                                        # e.g., Rate, Qty, Amount (so rate might be first or second of the group)
                                        # But let's just pick the first valid monetary looking value for now
                                        rate_val = float(valid_money[0])
                                except: pass
                                
                            mat_name = line
                            for m in money_matches:
                                mat_name = mat_name.replace(m, '', 1)
                            mat_name = re.sub(r'[^a-zA-Z0-9\s\(\)]+$', '', mat_name).strip()
                            # also clean up some specific symbols
                            mat_name = re.sub(r'(?:Rs\.?|INR|\$|£|%)', '', mat_name, flags=re.IGNORECASE).strip()
                                
                            if len(mat_name) > 3:
                                if any(skip in mat_name.lower() for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'amount', 'hsnsac']):
                                    continue
                                matched_items, conf = fuzzy_match_material(mat_name, qr_items)
                                brand_match = re.search(r'(?i)make:\s*([a-zA-Z0-9]+)', line)
                                brand_val = brand_match.group(1) if brand_match else None
                                
                                if matched_items:
                                    for matched_item in matched_items:
                                        results.append(ExtractionResultItem(
                                            material_id=matched_item.material_id,
                                            material_name=matched_item.material.name,
                                            quoted_rate=rate_val,
                                            brand=brand_val,
                                            confidence_score=conf,
                                            raw_text=line
                                        ))
                                else:
                                    results.append(ExtractionResultItem(
                                        material_id=None,
                                        material_name=mat_name,
                                        quoted_rate=rate_val,
                                        brand=brand_val,
                                        confidence_score=conf,
                                        raw_text=line
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
            
        # Sort descending by quoted_rate to prevent zero-rates from shadowing valid rates in the frontend
        results.sort(key=lambda r: (r.quoted_rate or 0.0), reverse=True)
        return results
        
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
