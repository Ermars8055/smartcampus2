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

# ── Flat keyword lists (used for header row detection) ──────────────────
MATERIAL_KEYWORDS = ['item', 'material', 'description', 'name', 'particular', 'goods', 'descrip', 'product', 'chemical']
RATE_KEYWORDS = ['rate', 'price', 'cost', 'unitprice', 'basicprice', 'unitcost', 'quotedrate', 'mrp', 'amount', 'amt', 'value']
BRAND_KEYWORDS = ['brand', 'make', 'mfg', 'manufacturer', 'company', 'brandname']
UOM_KEYWORDS = ['unit', 'uom', 'measure', 'per', 'packing', 'pack', 'pkg', 'size']
DELIVERY_KEYWORDS = ['delivery', 'days', 'leadtime', 'eta', 'status', 'time', 'period', 'duration', 'dispatch']
DISCOUNT_KEYWORDS = ['disc', 'discount', 'dis', 'deduction', 'rebate', 'discpercent', 'discountpercent', 'discountpercentage']
ALL_KEYWORDS = MATERIAL_KEYWORDS + RATE_KEYWORDS + BRAND_KEYWORDS + UOM_KEYWORDS + DELIVERY_KEYWORDS + DISCOUNT_KEYWORDS

# ── Weighted scoring dictionaries (higher = more preferred) ─────────────
MATERIAL_SCORED = {
    'description': 10, 'itemdescription': 10, 'productsdescription': 10,
    'material': 9, 'particular': 9, 'product': 8, 'chemical': 8,
    'item': 7, 'goods': 7, 'name': 5, 'descrip': 6,
}
MATERIAL_ANTI = ['code', 'hsn', 'sac', 'slno', 'sno', 'srno', 'serial']

RATE_SCORED = {
    'rate': 10, 'unitprice': 10, 'quotedrate': 10, 'basicprice': 10,
    'sellingprice': 9, 'price': 8, 'unitcost': 8,
    'mrp': 6, 'cost': 5, 'amt': 3, 'amount': 2, 'value': 1,
}
RATE_ANTI = ['total', 'sub', 'subtotal', 'taxable', 'gst', 'cgst', 'sgst',
             'igst', 'gross', 'final', 'net', 'after', 'disc']

BRAND_SCORED = {'brand': 10, 'make': 8, 'manufacturer': 8, 'mfg': 7, 'company': 5, 'brandname': 10}
UOM_SCORED = {'uom': 10, 'unit': 8, 'packing': 9, 'pack': 7, 'per': 6, 'pkg': 7, 'size': 5, 'measure': 6}
DELIVERY_SCORED = {'delivery': 10, 'leadtime': 10, 'eta': 8, 'dispatch': 7, 'status': 3, 'days': 5}
DISCOUNT_SCORED = {'discount': 10, 'disc': 8, 'dis': 6, 'deduction': 7, 'rebate': 7}
DISCOUNT_ANTI = ['amount', 'amt', 'after', 'value']

# ── Known brand names for inline extraction ─────────────────────────────
KNOWN_BRANDS = [
    'SRL', 'SD FINE', 'SDFINE', 'NICE', 'MOLYCHEM', 'LOBA', 'LOBA CHEMIE',
    'MERCK', 'HIMEDIA', 'RANKEM', 'FISHER', 'SIGMA', 'CDH', 'QUALIGENS',
    'THOMAS BAKER', 'FINAR', 'SPECTRUM', 'AVRA', 'TCI', 'OTTO',
    'BOROSIL', 'QUALIKEMS', 'THERMO FISHER', 'CENTRAL DRUG HOUSE',
]

# ── UOM normalization map ───────────────────────────────────────────────
UOM_NORMALIZE = {
    'gm': ('g', 1), 'gms': ('g', 1), 'g': ('g', 1), 'gram': ('g', 1), 'grams': ('g', 1),
    'kg': ('g', 1000), 'kgs': ('g', 1000),
    'mg': ('g', 0.001),
    'ml': ('ml', 1), 'ltr': ('ml', 1000), 'l': ('ml', 1000),
    'litre': ('ml', 1000), 'liter': ('ml', 1000),
    'each': ('each', 1), 'nos': ('each', 1), 'pcs': ('each', 1),
    'pack': ('pack', 1), 'set': ('set', 1), 'kit': ('kit', 1),
}

# ── Chemical synonyms for fuzzy matching ────────────────────────────────
CHEMICAL_SYNONYMS = {
    'sulph': 'sulf',       # Sulphuric -> Sulfuric
    'aluminium': 'aluminum',
    'poly ethylene': 'polyethylene',
    'h2o': 'water',
    'h2so4': 'sulfuric acid',
    'hcl': 'hydrochloric acid',
    'nacl': 'sodium chloride',
    'etoh': 'ethanol',
    'meoh': 'methanol'
}


# ═══════════════════════════════════════════════════════════════════════════
#  UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

def score_column(col_name, scored_keywords, anti_keywords=None):
    """Score a column header against weighted keywords. Higher = better match."""
    col_clean = re.sub(r'[^a-z]', '', str(col_name).lower())
    score = 0
    for kw, weight in scored_keywords.items():
        if kw in col_clean:
            score += weight
    if anti_keywords:
        for neg in anti_keywords:
            if neg in col_clean:
                score -= 5
    return score


def pick_best_column(columns, scored_keywords, anti_keywords=None, exclude_indices=None):
    """Pick the column with the highest positive score. Returns column name/index or None."""
    best_col = None
    best_score = 0
    for col in columns:
        if exclude_indices and col in exclude_indices:
            continue
        s = score_column(col, scored_keywords, anti_keywords)
        if s > best_score:
            best_score = s
            best_col = col
    return best_col


def pick_best_column_idx(row_cells, scored_keywords, anti_keywords=None, exclude_indices=None):
    """Pick the best column INDEX from a PDF header row of cells."""
    best_idx = None
    best_score = 0
    for i, cell in enumerate(row_cells):
        if not cell:
            continue
        if exclude_indices and i in exclude_indices:
            continue
        s = score_column(cell, scored_keywords, anti_keywords)
        if s > best_score:
            best_score = s
            best_idx = i
    return best_idx


def detect_discount_format(values):
    """Detect if discount values are fractions (0.4=40%) or percentages (25=25%).
    Column-level heuristic: if >80% of non-zero values are <=1.0, treat as fraction."""
    numeric_vals = []
    for v in values:
        try:
            n = float(str(v).replace(',', '').strip())
            if n > 0:
                numeric_vals.append(n)
        except:
            pass
    if not numeric_vals:
        return 'percentage'
    fraction_count = sum(1 for v in numeric_vals if v <= 1.0)
    if fraction_count / len(numeric_vals) > 0.8:
        return 'fraction'
    return 'percentage'


def normalize_discount(raw_val, format_type):
    """Convert raw discount value to percentage."""
    try:
        val = float(str(raw_val).replace(',', '').strip())
    except:
        return 0.0
    if format_type == 'fraction' and val <= 1.0:
        return round(val * 100, 2)
    return val


def extract_brand_from_text(text):
    """Extract brand name from description text when no Brand column exists."""
    if not text:
        return None
    # 1. Check for quoted brand: 'Acetone LR "MOLYCHEM"'
    quoted = re.findall(r'["\u201c\u201d\']+([A-Za-z\s]+)["\u201c\u201d\']+', text)
    for q in quoted:
        q_upper = q.strip().upper()
        for brand in KNOWN_BRANDS:
            if brand == q_upper or brand.replace(' ', '') == q_upper.replace(' ', ''):
                return brand
    # 2. Check for known brand names anywhere in text (longest first to avoid partial)
    text_upper = text.upper()
    for brand in sorted(KNOWN_BRANDS, key=len, reverse=True):
        pattern = r'\b' + re.escape(brand) + r'\b'
        if re.search(pattern, text_upper):
            return brand
    return None


def parse_uom_string(uom_str):
    """Parse '500gm' -> (500_in_base_units, 'g'), '1 Each' -> (1, 'each')."""
    if not uom_str:
        return None, None
    s = str(uom_str).strip()
    match = re.match(r'(\d+(?:\.\d+)?)\s*([a-zA-Z]+)', s)
    if not match:
        return None, None
    qty = float(match.group(1))
    unit = match.group(2).lower()
    # Remove trailing 's' for plurals but not for 'gms' etc handled directly
    if unit in UOM_NORMALIZE:
        base_unit, factor = UOM_NORMALIZE[unit]
        return qty * factor, base_unit
    # Try without trailing 's'
    unit_singular = unit.rstrip('s')
    if unit_singular in UOM_NORMALIZE:
        base_unit, factor = UOM_NORMALIZE[unit_singular]
        return qty * factor, base_unit
    return qty, unit


def calc_conversion_factor(vendor_uom_str, system_uom_name):
    """Calculate conversion factor: vendor_qty_in_base / system_qty_in_base.
    e.g., vendor='500gm', system='Kg' -> 0.5
    e.g., vendor='500ml', system='500 ML' -> 1.0"""
    v_qty, v_base = parse_uom_string(vendor_uom_str)
    s_qty, s_base = parse_uom_string(system_uom_name)
    if v_qty is None or s_qty is None:
        return 1.0
    if v_base != s_base:
        return 1.0  # incompatible units
    if s_qty == 0:
        return 1.0
    return round(v_qty / s_qty, 4)


def find_header_rows(df, max_scan=30):
    """Find header row range — may be 1-3 consecutive rows with keywords."""
    candidates = []
    for i in range(min(max_scan, len(df))):
        row_vals = [str(x).lower() for x in df.iloc[i].values if pd.notna(x)]
        match_count = sum(1 for v in row_vals
                         if any(k in re.sub(r'[^a-z]', '', v) for k in ALL_KEYWORDS))
        if match_count >= 2:
            candidates.append((i, match_count))

    if not candidates:
        return None, None

    # Find best cluster of consecutive/near-consecutive header rows
    best_start = candidates[0][0]
    best_end = best_start
    best_total = candidates[0][1]
    cur_start = candidates[0][0]
    cur_end = candidates[0][0]
    cur_total = candidates[0][1]

    for j in range(1, len(candidates)):
        if candidates[j][0] <= cur_end + 2:  # within 2 rows gap
            cur_end = candidates[j][0]
            cur_total += candidates[j][1]
        else:
            if cur_total > best_total:
                best_start, best_end, best_total = cur_start, cur_end, cur_total
            cur_start = candidates[j][0]
            cur_end = candidates[j][0]
            cur_total = candidates[j][1]
    if cur_total > best_total:
        best_start, best_end, best_total = cur_start, cur_end, cur_total

    return best_start, best_end


def merge_header_rows(df, start, end):
    """Merge multi-row headers into single header labels per column."""
    merged = []
    for col_idx in range(len(df.columns)):
        parts = []
        for row_idx in range(start, end + 1):
            val = df.iloc[row_idx, col_idx]
            if pd.notna(val) and str(val).strip():
                parts.append(str(val).strip())
        merged.append(' '.join(parts) if parts else f'col_{col_idx}')
    return merged


def normalize_chemical_name(name: str) -> str:
    """Normalize chemical name using synonym dictionary."""
    if not name:
        return ""
    norm = name.lower()
    for k, v in CHEMICAL_SYNONYMS.items():
        norm = re.sub(r'\b' + re.escape(k) + r'\b', v, norm)
    return norm


def fuzzy_match_material(extracted_name: str, qr_items: list) -> tuple:
    """Returns (list_of_best_match_items, confidence_score)"""
    if not extracted_name or not isinstance(extracted_name, str):
        return [], 0.0
    extracted_clean = re.sub(r'[^a-zA-Z0-9\s]', '', str(extracted_name)).lower().strip()
    # Strip common chemical suffixes and grades to improve matching
    extracted_clean = re.sub(r'\b(lr|ar|extrapure|pure|assay|min|max|gr|grade|anhydrous|purified|molychem|srl|extra pure)\b', '', extracted_clean).strip()
    extracted_clean = re.sub(r'\s+', ' ', extracted_clean)
    
    # Apply synonym normalization
    extracted_norm = normalize_chemical_name(extracted_clean)
    
    best_items = []
    best_score = 0.0
    
    for item in qr_items:
        if not item.material: continue
        mat_clean = re.sub(r'[^a-zA-Z0-9\s]', '', item.material.name).lower().strip()
        mat_norm = normalize_chemical_name(mat_clean)
        
        # Exact match
        if extracted_norm == mat_norm:
            score = 1.0
        else:
            # Partial match score using SequenceMatcher
            score = difflib.SequenceMatcher(None, extracted_norm, mat_norm).ratio()
            
            # Boost if one is a substring of another (space-agnostic)
            mat_no_space = mat_norm.replace(' ', '')
            ext_no_space = extracted_norm.replace(' ', '')
            if len(mat_no_space) > 3 and mat_no_space in ext_no_space:
                score += 0.3
            elif len(ext_no_space) > 3 and ext_no_space in mat_no_space:
                score += 0.3
            
            # Token set ratio equivalent logic
            ext_words = set(extracted_norm.split())
            mat_words = set(mat_norm.split())
            
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
            df_raw = pd.read_csv(file_path, header=None)
        else:
            df_raw = pd.read_excel(file_path, header=None)

        # ── Step 1: Detect header row(s) ────────────────────────────────
        h_start, h_end = find_header_rows(df_raw)

        if h_start is not None:
            if h_start == h_end:
                # Single-row header — re-read with pandas header
                if file_path.endswith('.csv'):
                    df = pd.read_csv(file_path, header=h_start)
                else:
                    df = pd.read_excel(file_path, header=h_start)
            else:
                # Multi-row header — merge and rename
                merged_header = merge_header_rows(df_raw, h_start, h_end)
                data_start = h_end + 1
                df = df_raw.iloc[data_start:].reset_index(drop=True)
                df.columns = merged_header[:len(df.columns)]
        else:
            df = df_raw

        # ── Step 2: Score-based column mapping ──────────────────────────
        used_cols = set()
        col_map = {}

        col_map['material'] = pick_best_column(df.columns, MATERIAL_SCORED, MATERIAL_ANTI)
        if col_map['material']:
            used_cols.add(col_map['material'])

        col_map['rate'] = pick_best_column(df.columns, RATE_SCORED, RATE_ANTI, exclude_indices=used_cols)
        if col_map['rate']:
            used_cols.add(col_map['rate'])

        col_map['brand'] = pick_best_column(df.columns, BRAND_SCORED, exclude_indices=used_cols)
        if col_map['brand']:
            used_cols.add(col_map['brand'])

        col_map['uom'] = pick_best_column(df.columns, UOM_SCORED, exclude_indices=used_cols)
        if col_map['uom']:
            used_cols.add(col_map['uom'])

        col_map['delivery'] = pick_best_column(df.columns, DELIVERY_SCORED, exclude_indices=used_cols)
        if col_map['delivery']:
            used_cols.add(col_map['delivery'])

        col_map['discount'] = pick_best_column(df.columns, DISCOUNT_SCORED, DISCOUNT_ANTI, exclude_indices=used_cols)

        # Fallback: if no material column found, use first string column
        if not col_map['material']:
            for col in df.columns:
                if df[col].dtype == 'object':
                    col_map['material'] = col
                    break

        # Fallback: if no rate column found, use first numeric column
        if not col_map['rate']:
            for col in df.columns:
                if col != col_map['material'] and pd.api.types.is_numeric_dtype(df[col]):
                    col_map['rate'] = col
                    break

        print(f"[Excel] Column mapping: {col_map}")

        # ── Step 3: Detect discount format (fraction vs percentage) ─────
        disc_format = 'percentage'
        if col_map['discount']:
            disc_values = df[col_map['discount']].dropna().tolist()
            disc_format = detect_discount_format(disc_values)
            print(f"[Excel] Discount format detected: {disc_format}")

        # ── Step 4: Parse rows ──────────────────────────────────────────
        matched_qr_ids = set()
        parsed_rows = []
        for index, row in df.iterrows():
            mat_name = str(row[col_map['material']]) if col_map['material'] and pd.notna(row.get(col_map['material'])) else ""
            if not mat_name or mat_name.lower() == 'nan':
                continue

            # Skip summary rows
            mat_lower = mat_name.lower()
            if any(skip in mat_lower for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'discount', 'freight', 'amount']):
                continue

            # Categorical row heuristic: if rate is empty and uom is empty and discount is empty
            if pd.isna(row.get(col_map.get('rate'))) and pd.isna(row.get(col_map.get('uom'))) and pd.isna(row.get(col_map.get('discount'))):
                continue

            # Rate
            rate_val = 0.0
            if col_map['rate'] and pd.notna(row.get(col_map['rate'])):
                try:
                    rate_val = float(str(row[col_map['rate']]).replace(',', '').strip())
                except:
                    rate_val = 0.0

            # Brand — from column or inline from description
            brand_val = None
            if col_map['brand'] and pd.notna(row.get(col_map['brand'])):
                brand_val = str(row[col_map['brand']]).strip()
                if brand_val.lower() == 'nan':
                    brand_val = None
            if not brand_val:
                brand_val = extract_brand_from_text(mat_name)

            # UOM
            uom_val = None
            if col_map['uom'] and pd.notna(row.get(col_map['uom'])):
                uom_val = str(row[col_map['uom']]).strip()
                if uom_val.lower() == 'nan':
                    uom_val = None

            # Delivery
            delivery_val = None
            if col_map['delivery'] and pd.notna(row.get(col_map['delivery'])):
                try:
                    num_match = re.search(r'\d+', str(row[col_map['delivery']]))
                    if num_match:
                        delivery_val = int(num_match.group(0))
                except:
                    pass

            # Discount (with normalization)
            discount_val = 0.0
            if col_map['discount'] and pd.notna(row.get(col_map['discount'])):
                raw_disc = str(row[col_map['discount']]).strip()
                try:
                    disc_match = re.search(r'(\d+(?:\.\d+)?)', raw_disc)
                    if disc_match:
                        discount_val = normalize_discount(disc_match.group(1), disc_format)
                except:
                    pass

            # Fuzzy match
            matched_items, conf = fuzzy_match_material(mat_name, qr_items)

            # UOM conversion factor
            conv_factor = 1.0
            if uom_val and matched_items:
                system_uom = getattr(matched_items[0].material, 'uom_name', None)
                if system_uom:
                    conv_factor = calc_conversion_factor(uom_val, system_uom)

            parsed_rows.append({
                'mat_name': mat_name,
                'rate': rate_val,
                'brand': brand_val,
                'uom': uom_val,
                'delivery': delivery_val,
                'discount': discount_val,
                'conv_factor': conv_factor,
                'matched_items': matched_items,
                'confidence': conf,
            })
            if matched_items:
                for m_item in matched_items:
                    matched_qr_ids.add(m_item.id)

        # ── Step 5: Fallback unmatched QR items ─────────────────────────
        unmatched_qr_items = [item for item in qr_items if item.id not in matched_qr_ids]

        unmatched_idx = 0
        for p_row in parsed_rows:
            if not p_row.get('matched_items') and unmatched_idx < len(unmatched_qr_items):
                p_row['matched_items'] = [unmatched_qr_items[unmatched_idx]]
                p_row['confidence'] = 0.5
                unmatched_idx += 1

            # Build results
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
                        uom_conversion_factor=p_row.get('conv_factor', 1.0),
                        confidence_score=p_row['confidence'],
                        raw_text=p_row['mat_name'],
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
                    uom_conversion_factor=p_row.get('conv_factor', 1.0),
                    confidence_score=p_row['confidence'],
                    raw_text=p_row['mat_name'],
                ))

    except Exception as e:
        print(f"Excel extraction error: {e}")
        import traceback
        traceback.print_exc()

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
            # ── Stateful Parsing: Persist col_map across pages ──────────────
            global_col_map = {
                'material': None, 'rate': None, 'brand': None, 
                'uom': None, 'delivery': None, 'discount': None
            }
            header_found_globally = False
            
            for page in pdf.pages:
                final_page_results = []
                final_valid_table = False
                best_col_map = global_col_map.copy()
                best_header_found = header_found_globally
                
                strategies = [
                    {}, # Default (lines)
                    {"vertical_strategy": "text", "horizontal_strategy": "text"} # Borderless fallback
                ]
                
                for strategy in strategies:
                    tables = page.extract_tables(strategy)
                    if not tables: continue
                    
                    page_results = []
                    valid_table_found = False
                    col_map = global_col_map.copy()
                    header_found_in_table = header_found_globally
                    
                    for table in tables:
                        # Skip garbage tables with only 1 column
                        if all(not row or len(row) <= 1 for row in table): continue
                        
                        # Phase 1: Pre-scan for discount format detection
                        disc_format = 'percentage'
                        if header_found_in_table and col_map['discount'] is not None:
                            disc_vals = []
                            for row_orig in table:
                                if not row_orig or not any(row_orig): continue
                                disc_col_idx = col_map['discount']
                                if disc_col_idx < len(row_orig) and row_orig[disc_col_idx]:
                                    disc_vals.append(str(row_orig[disc_col_idx]).strip())
                            disc_format = detect_discount_format(disc_vals)
                        
                        for row_orig in table:
                            if not row_orig or not any(row_orig): continue
                            
                            exploded_rows = explode_table_row(row_orig)
                            
                            for row in exploded_rows:
                                if not any(row): continue
                                
                                row_texts = [str(cell).strip().replace('\n', ' ') for cell in row if cell]
                                
                                if not header_found_in_table:
                                    match_count = sum(1 for v in row_texts if any(k in re.sub(r'[^a-z]', '', v.lower()) for k in ALL_KEYWORDS))
                                    if match_count >= 2:
                                        header_found_in_table = True
                                        valid_table_found = True
                                        
                                        used_cols = set()
                                        col_map['material'] = pick_best_column_idx(row, MATERIAL_SCORED, MATERIAL_ANTI)
                                        if col_map['material'] is not None: used_cols.add(col_map['material'])
                                        
                                        col_map['rate'] = pick_best_column_idx(row, RATE_SCORED, RATE_ANTI, used_cols)
                                        if col_map['rate'] is not None: used_cols.add(col_map['rate'])
                                        
                                        col_map['brand'] = pick_best_column_idx(row, BRAND_SCORED, None, used_cols)
                                        if col_map['brand'] is not None: used_cols.add(col_map['brand'])
                                        
                                        col_map['uom'] = pick_best_column_idx(row, UOM_SCORED, None, used_cols)
                                        if col_map['uom'] is not None: used_cols.add(col_map['uom'])
                                        
                                        col_map['delivery'] = pick_best_column_idx(row, DELIVERY_SCORED, None, used_cols)
                                        if col_map['delivery'] is not None: used_cols.add(col_map['delivery'])
                                        
                                        col_map['discount'] = pick_best_column_idx(row, DISCOUNT_SCORED, DISCOUNT_ANTI, used_cols)
                                        
                                    continue # Skip processing data for header row
                                    
                                mat_name = ""
                                rate_val = 0.0
                                brand_val = None
                                uom_val = None
                                delivery_val = None
                                discount_val = 0.0
                                
                                if header_found_in_table and col_map['material'] is not None:
                                    # Extract using mapped indices
                                    if col_map['material'] < len(row) and row[col_map['material']]:
                                        mat_name = str(row[col_map['material']]).strip().replace('\n', ' ')
                                        
                                    # Skip empty names or summary rows
                                    if not mat_name: continue
                                    mat_lower = mat_name.lower()
                                    if any(skip in mat_lower for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'discount', 'freight', 'amount']):
                                        continue
                                        
                                    if col_map['rate'] is not None and col_map['rate'] < len(row) and row[col_map['rate']]:
                                        try: rate_val = float(str(row[col_map['rate']]).replace(',', '').strip())
                                        except: pass
                                        
                                    if col_map['brand'] is not None and col_map['brand'] < len(row) and row[col_map['brand']]:
                                        brand_val = str(row[col_map['brand']]).strip().replace('\n', ' ')
                                    if not brand_val:
                                        brand_val = extract_brand_from_text(mat_name)
                                        
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
                                            if disc_match: discount_val = normalize_discount(disc_match.group(1), disc_format)
                                        except: pass
                                        
                                    # Categorical row heuristic: if rate=0 and uom/discount are missing, skip
                                    if rate_val == 0.0 and not uom_val and discount_val == 0.0:
                                        continue
                                            
                                    matched_items, conf = fuzzy_match_material(mat_name, qr_items)
                                    
                                    # Calculate conversion factor
                                    conv_factor = 1.0
                                    if uom_val and matched_items:
                                        sys_uom = None
                                        if hasattr(matched_items[0].material, 'uom') and matched_items[0].material.uom:
                                            sys_uom = matched_items[0].material.uom.name
                                        if sys_uom: conv_factor = calc_conversion_factor(uom_val, sys_uom)
                                    
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
                                                uom_conversion_factor=conv_factor,
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
                                            uom_conversion_factor=conv_factor,
                                            confidence_score=conf,
                                            raw_text=mat_name
                                        ))
                                        
                    # Validate strategy
                    if valid_table_found and any(r.quoted_rate and r.quoted_rate > 0 for r in page_results):
                        final_page_results = page_results
                        final_valid_table = True
                        best_col_map = col_map
                        best_header_found = header_found_in_table
                        break # Strategy successful, no need to try fallback
                
                # Apply best strategy results
                if final_valid_table or (header_found_globally and final_page_results):
                    global_col_map = best_col_map
                    header_found_globally = best_header_found
                    print(f'[PDF] Page {page.page_number} results len: {len(final_page_results)}')
                    results.extend(final_page_results)
                else:
                    # Fallback to text parsing if no valid tables found
                    text = page.extract_text()
                    if text:
                        lines = text.split('\n')
                        for line in lines:
                            money_matches = re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?\b', line)
                            if not money_matches: continue
                                
                            rate_val = 0.0
                            valid_money = []
                            for idx, m in enumerate(money_matches):
                                m_clean = m.replace(',', '')
                                if '.' in m_clean or float(m_clean) > 50:
                                    if idx == 0 and not '.' in m_clean and float(m_clean) < 1000:
                                        continue
                                    valid_money.append(m_clean)
                                    
                            if valid_money:
                                try: rate_val = float(valid_money[0])
                                except: pass
                                
                            mat_name = line
                            for m in money_matches:
                                mat_name = mat_name.replace(m, '', 1)
                            mat_name = re.sub(r'[^a-zA-Z0-9\s\(\)]+$', '', mat_name).strip()
                            mat_name = re.sub(r'(?:Rs\.?|INR|\$|£|%)', '', mat_name, flags=re.IGNORECASE).strip()
                                
                            if len(mat_name) > 3:
                                mat_lower = mat_name.lower()
                                if any(skip in mat_lower for skip in ['total', 'subtotal', 'tax', 'cgst', 'sgst', 'igst', 'amount', 'hsnsac']):
                                    continue
                                matched_items, conf = fuzzy_match_material(mat_name, qr_items)
                                brand_match = re.search(r'(?i)make:\s*([a-zA-Z0-9]+)', line)
                                brand_val = brand_match.group(1) if brand_match else extract_brand_from_text(mat_name)
                                
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
        import traceback
        traceback.print_exc()
        
    return results


def extract_from_image(file_path: str, qr_items: list) -> List[ExtractionResultItem]:
    results = []
    try:
        import pytesseract
        from pytesseract import Output
        from PIL import Image
        import numpy as np
        
        # Layout-Aware OCR
        data = pytesseract.image_to_data(Image.open(file_path), output_type=Output.DATAFRAME)
        # Filter out empty text and low confidence
        data = data[data.conf > 0]
        data = data[data.text.str.strip().astype(bool)]
        
        if data.empty:
            return results
            
        # Group into rows based on 'top' coordinate (tolerance ~15px)
        data = data.sort_values(by=['top', 'left'])
        
        rows = []
        current_row_top = None
        current_row = []
        
        for index, row in data.iterrows():
            top = row['top']
            left = row['left']
            text = str(row['text']).strip()
                
            if current_row_top is None:
                current_row_top = top
                current_row.append((left, text))
            elif abs(top - current_row_top) <= 15: # 15px tolerance for same line
                current_row.append((left, text))
            else:
                rows.append(current_row)
                current_row_top = top
                current_row = [(left, text)]
                
        if current_row:
            rows.append(current_row)
            
        # Cluster 'left' coordinates to form columns
        all_lefts = [left for row in rows for left, _ in row]
        if not all_lefts: return results
        
        all_lefts.sort()
        cols = []
        curr_col = [all_lefts[0]]
        for l in all_lefts[1:]:
            if l - curr_col[-1] <= 60: # 60px tolerance for column clustering
                curr_col.append(l)
            else:
                cols.append(sum(curr_col)/len(curr_col)) # average left pos of column
                curr_col = [l]
        if curr_col:
            cols.append(sum(curr_col)/len(curr_col))
        
        # Build reconstructed DataFrame
        df_data = []
        for row in rows:
            df_row = [""] * len(cols)
            for left, text in row:
                # Find closest column index
                closest_col_idx = np.argmin([abs(left - c) for c in cols])
                if df_row[closest_col_idx]:
                    df_row[closest_col_idx] += " " + text
                else:
                    df_row[closest_col_idx] = text
            df_data.append(df_row)
            
        df = pd.DataFrame(df_data)
        
        # Route through robust Excel extraction pipeline!
        temp_csv = file_path + ".temp.csv"
        df.to_csv(temp_csv, index=False, header=False)
        results = extract_from_excel(temp_csv, qr_items)
        if os.path.exists(temp_csv): 
            os.remove(temp_csv)
            
    except Exception as e:
        print(f"Image extraction error: {e}")
        import traceback
        traceback.print_exc()
        
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
