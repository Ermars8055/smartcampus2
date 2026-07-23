@router.get("/{qr_id}/comparative-statement/excel")
def download_comparative_statement_excel(
    qr_id: int, db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("purchase_requests", "read")),
    tenant_id: int = Depends(get_tenant_id),
    site_id: int = Depends(get_site_id)
):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
    from io import BytesIO
    from fastapi.responses import StreamingResponse
    from app.models import Material, VendorQuotationItem, VendorQuotation

    comp_data = generate_comparison(qr_id, db, current_user, tenant_id, site_id)
    sorted_vendors = sorted(comp_data.vendor_totals, key=lambda x: x['total_value'])

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Comparative Statement"

    ws.views.sheetView[0].showGridLines = True

    # Typography & Styles
    title_font = Font(name="Segoe UI", size=14, bold=True, color="FFFFFF")
    header_font = Font(name="Segoe UI", size=10, bold=True, color="000000")
    data_font = Font(name="Segoe UI", size=10, color="000000")

    # Colors
    title_fill = PatternFill(start_color="5B5B5B", end_color="5B5B5B", fill_type="solid") # Dark gray for "comparison" title
    base_header_fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid") # Light gray for base items

    # Pastel colors for vendors
    vendor_colors = [
        "E2EFDA", # Pastel Green
        "F4CCCC", # Pastel Red/Pink
        "DDEBF7", # Pastel Blue
        "E4DFEC", # Pastel Purple
        "FFF2CC", # Pastel Yellow
        "D9EAD3", # Light Green
        "C9DAF8"  # Light Blue
    ]

    # Alignments
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center")

    # Borders
    thin_border = Border(
        left=Side(style="thin", color="000000"),
        right=Side(style="thin", color="000000"),
        top=Side(style="thin", color="000000"),
        bottom=Side(style="thin", color="000000")
    )

    # 1. Sheet Title block
    num_vendors = len(sorted_vendors)
    total_cols = 3 + (num_vendors * 8)
    last_col_letter = get_column_letter(total_cols) if total_cols > 0 else "G"
    
    ws.merge_cells(f"A1:{last_col_letter}1")
    ws["A1"] = "comparison"
    ws["A1"].font = title_font
    ws["A1"].fill = title_fill
    ws["A1"].alignment = align_center
    ws.row_dimensions[1].height = 25

    # 2. Build Column Headers (Row 2 and Row 3)
    ws.merge_cells("A2:A3")
    ws["A2"] = "Sl No"
    ws["A2"].font = header_font
    ws["A2"].fill = base_header_fill
    ws["A2"].alignment = align_center
    ws["A2"].border = thin_border
    ws["A3"].border = thin_border

    ws.merge_cells("B2:B3")
    ws["B2"] = "Item Description"
    ws["B2"].font = header_font
    ws["B2"].fill = base_header_fill
    ws["B2"].alignment = align_center
    ws["B2"].border = thin_border
    ws["B3"].border = thin_border

    ws.merge_cells("C2:C3")
    ws["C2"] = "Per"
    ws["C2"].font = header_font
    ws["C2"].fill = base_header_fill
    ws["C2"].alignment = align_center
    ws["C2"].border = thin_border
    ws["C3"].border = thin_border

    # Build Vendor Columns Header block
    for v_idx, vt in enumerate(sorted_vendors):
        start_col = 4 + v_idx * 8
        end_col = start_col + 7
        
        start_letter = get_column_letter(start_col)
        end_letter = get_column_letter(end_col)
        
        v_color = vendor_colors[v_idx % len(vendor_colors)]
        v_fill = PatternFill(start_color=v_color, end_color=v_color, fill_type="solid")
        
        ws.merge_cells(f"{start_letter}2:{end_letter}2")
        cell = ws[f"{start_letter}2"]
        cell.value = vt['vendor_name']
        cell.font = header_font
        cell.fill = v_fill
        cell.alignment = align_center
        
        for col_i in range(start_col, end_col + 1):
            ws.cell(row=2, column=col_i).border = thin_border
            ws.cell(row=2, column=col_i).fill = v_fill
        
        subheaders = ["Unit Rate (₹)", "Qty", "Disc %", "", "", "", "GST %", "Final Amt (₹)"]
        for sh_idx, sh_text in enumerate(subheaders):
            c_col = start_col + sh_idx
            c_cell = ws.cell(row=3, column=c_col)
            c_cell.value = sh_text
            c_cell.font = header_font
            c_cell.fill = v_fill
            c_cell.alignment = align_center
            c_cell.border = thin_border

    ws.row_dimensions[2].height = 20
    ws.row_dimensions[3].height = 30

    # 3. Fill Items / Materials
    start_row = 4
    for m_idx, mat in enumerate(comp_data.materials):
        row_idx = start_row + m_idx
        ws.row_dimensions[row_idx].height = 35

        ws.cell(row=row_idx, column=1, value=m_idx + 1).alignment = align_center
        ws.cell(row=row_idx, column=2, value=mat.material_name).alignment = align_left
        ws.cell(row=row_idx, column=3, value=mat.uom_name).alignment = align_center

        for col in range(1, 4):
            ws.cell(row=row_idx, column=col).font = data_font
            ws.cell(row=row_idx, column=col).border = thin_border

        db_material = db.query(Material).filter(Material.id == mat.material_id).first()
        gst_rate = db_material.gst_rate if db_material else 0.0

        for v_idx, vt in enumerate(sorted_vendors):
            start_col = 4 + v_idx * 8
            quote = next((q for q in mat.vendor_quotes if q.vendor_id == vt['vendor_id']), None)
            
            vqi = db.query(VendorQuotationItem).join(VendorQuotation).filter(
                VendorQuotationItem.qr_item_id == mat.qr_item_id,
                VendorQuotation.vendor_id == vt['vendor_id']
            ).first()

            v_color = vendor_colors[v_idx % len(vendor_colors)]
            v_fill = PatternFill(start_color=v_color, end_color=v_color, fill_type="solid")

            if quote and vqi:
                conv_factor = vqi.uom_conversion_factor or 1.0
                quoted_rate = vqi.quoted_rate / conv_factor
                qty = mat.quantity
                discount_pct = vqi.discount_percent or 0.0
                
                disc_amt = quoted_rate * (discount_pct / 100.0)
                rate_after_disc = quoted_rate - disc_amt
                total_taxable = rate_after_disc * qty
                final_amt = total_taxable * (1 + (gst_rate / 100.0))
                
                vals = [quoted_rate, qty, discount_pct, disc_amt, rate_after_disc, total_taxable, gst_rate, final_amt]
                
                for offset, val in enumerate(vals):
                    c_col = start_col + offset
                    cell = ws.cell(row=row_idx, column=c_col, value=val)
                    cell.font = data_font
                    cell.border = thin_border
                    cell.fill = v_fill
                    
                    if offset in [1, 2, 6]:
                        cell.alignment = align_center
                        if offset == 2:
                            cell.number_format = "0.0\"%\""
                        elif offset == 6:
                            cell.number_format = "0.0\"%\""
                    else:
                        cell.alignment = align_right
                        cell.number_format = "#,##0.00"
            else:
                for offset in range(8):
                    c_col = start_col + offset
                    cell = ws.cell(row=row_idx, column=c_col, value="")
                    if offset == 0:
                        cell.value = "-"
                    cell.font = data_font
                    cell.border = thin_border
                    cell.alignment = align_center
                    cell.fill = v_fill

    # 4. Auto-adjust Column Widths
    ws.column_dimensions["A"].width = 8   
    ws.column_dimensions["B"].width = 30  
    ws.column_dimensions["C"].width = 12  

    for v_idx in range(num_vendors):
        start_col = 4 + v_idx * 8
        ws.column_dimensions[get_column_letter(start_col)].width = 14     
        ws.column_dimensions[get_column_letter(start_col + 1)].width = 10  
        ws.column_dimensions[get_column_letter(start_col + 2)].width = 10  
        ws.column_dimensions[get_column_letter(start_col + 3)].width = 14 
        ws.column_dimensions[get_column_letter(start_col + 4)].width = 14 
        ws.column_dimensions[get_column_letter(start_col + 5)].width = 14 
        ws.column_dimensions[get_column_letter(start_col + 6)].width = 10  
        ws.column_dimensions[get_column_letter(start_col + 7)].width = 16 

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=CS_{comp_data.qr_number}.xlsx"}
    )
