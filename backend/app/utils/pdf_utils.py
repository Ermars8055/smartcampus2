"""Generate Purchase Order PDFs using ReportLab — matching the frontend Print PO layout."""

import logging
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

# ── Organisation details ────────────────────────────────────────────────
ORG_NAME = "EASTPOINT GROUP OF INSTITUTIONS"
ORG_ADDRESS = "Virgo nagar post, East Point Campus, Jnana Prabha, Aavalahalli, Hirandahalli, Karnataka 560049"


def _fmt_date(dt) -> str:
    """Format a date/datetime to DD-MMM-YYYY."""
    if dt is None:
        return "-"
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt)
        except Exception:
            return dt
    return dt.strftime("%d-%b-%Y")


def _number_to_words(num: int) -> str:
    """Convert an integer to Indian English words (up to crore)."""
    a = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
        'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
        'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ]
    b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    if num == 0:
        return 'Zero'

    s = str(num)
    if len(s) > 9:
        return 'Amount too large'

    s = s.zfill(9)
    n = [int(s[0:2]), int(s[2:4]), int(s[4:6]), int(s[6]), int(s[7:9])]

    parts = []
    labels = ['Crore', 'Lakh', 'Thousand']
    for i, label in enumerate(labels):
        val = n[i]
        if val:
            if val < 20:
                parts.append(f'{a[val]} {label}')
            else:
                parts.append(f'{b[val // 10]} {a[val % 10]} {label}'.strip())
    if n[3]:
        parts.append(f'{a[n[3]]} Hundred')
    if n[4]:
        if parts:
            parts.append('and')
        if n[4] < 20:
            parts.append(a[n[4]])
        else:
            parts.append(f'{b[n[4] // 10]} {a[n[4] % 10]}'.strip())

    return ' '.join(parts).strip() or 'Zero'


# ── Styles ──────────────────────────────────────────────────────────────

_org_title = ParagraphStyle(
    "OrgTitle", fontName="Helvetica-Bold", fontSize=13, alignment=TA_CENTER,
    leading=16, spaceAfter=2,
)
_org_addr = ParagraphStyle(
    "OrgAddr", fontName="Helvetica", fontSize=9, alignment=TA_CENTER,
    leading=11, spaceAfter=4,
)
_doc_title = ParagraphStyle(
    "DocTitle", fontName="Helvetica-Bold", fontSize=12, alignment=TA_CENTER,
    leading=15, spaceAfter=10, underline=True,
)
_normal = ParagraphStyle("N", fontName="Helvetica", fontSize=10, leading=13)
_normal_small = ParagraphStyle("NS", fontName="Helvetica", fontSize=9, leading=11)
_bold = ParagraphStyle("B", fontName="Helvetica-Bold", fontSize=10, leading=13)
_bold_small = ParagraphStyle("BS", fontName="Helvetica-Bold", fontSize=9, leading=11)
_cell = ParagraphStyle("Cell", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_CENTER)
_cell_left = ParagraphStyle("CellL", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_LEFT)
_cell_right = ParagraphStyle("CellR", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_RIGHT)
_cell_bold = ParagraphStyle("CellB", fontName="Helvetica-Bold", fontSize=9, leading=11, alignment=TA_CENTER)
_cell_bold_right = ParagraphStyle("CellBR", fontName="Helvetica-Bold", fontSize=9, leading=11, alignment=TA_RIGHT)
_cell_tiny = ParagraphStyle("CellT", fontName="Helvetica", fontSize=7, leading=9, alignment=TA_CENTER, textColor=colors.grey)
_total_label = ParagraphStyle("TL", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_RIGHT)
_total_value = ParagraphStyle("TV", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_RIGHT)
_total_bold_label = ParagraphStyle("TBL", fontName="Helvetica-Bold", fontSize=9, leading=11, alignment=TA_RIGHT)
_total_bold_value = ParagraphStyle("TBV", fontName="Helvetica-Bold", fontSize=9, leading=11, alignment=TA_RIGHT)
_discount_label = ParagraphStyle("DL", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_RIGHT, textColor=colors.HexColor("#d97706"))
_discount_value = ParagraphStyle("DV", fontName="Helvetica", fontSize=9, leading=11, alignment=TA_RIGHT, textColor=colors.HexColor("#d97706"))
_terms_style = ParagraphStyle("Terms", fontName="Helvetica", fontSize=8, leading=10)
_terms_title = ParagraphStyle("TermsT", fontName="Helvetica-Bold", fontSize=9, leading=11)


def generate_po_pdf(po, db=None) -> bytes:
    """
    Generate a PDF for a Purchase Order — matching the frontend Print PO view.

    ``po`` should be a SQLAlchemy PurchaseOrder model instance with its
    relationships loaded (vendor, items, items→material, items→material→uom).

    Returns the PDF as raw bytes.
    """

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=12 * mm, bottomMargin=12 * mm,
    )
    W = doc.width
    elements = []

    # ── Header ──────────────────────────────────────────────────────────
    elements.append(Paragraph(f"<b>{ORG_NAME}</b>", _org_title))
    if ORG_ADDRESS:
        elements.append(Paragraph(ORG_ADDRESS, _org_addr))
    elements.append(Paragraph("<u><b>PURCHASE ORDER</b></u>", _doc_title))

    # ── Vendor + PO Info ────────────────────────────────────────────────
    vendor = po.vendor
    v_name = "VENDOR"
    if vendor:
        raw = vendor.name or ""
        # Strip vendor code prefix like "VEN-0001 - "
        v_name = raw.split(" - ", 1)[1] if " - " in raw else raw

    v_addr = ""
    v_city_state = ""
    if vendor:
        parts = []
        if vendor.address_line_1:
            parts.append(vendor.address_line_1)
        if vendor.address_line_2:
            parts.append(vendor.address_line_2)
        v_addr = ", ".join(parts)
        # Build city/state/pincode line
        cs_parts = []
        if vendor.city:
            cs_parts.append(vendor.city)
        if vendor.state:
            state_name = vendor.state.split(' - ', 1)[1] if ' - ' in vendor.state else vendor.state
            cs_parts.append(state_name)
        if vendor.pincode:
            cs_parts.append(f"- {vendor.pincode}")
        if cs_parts:
            v_city_state = " ".join(cs_parts)

    v_gst = vendor.gst_number if vendor else ""

    left_lines = f"""<b>To,</b><br/>
<b>M/S. {v_name}</b><br/>"""
    if v_addr:
        left_lines += f'<font size="9" color="#333333">{v_addr}</font><br/>'
    if v_city_state:
        left_lines += f'<font size="9" color="#333333">{v_city_state}</font><br/>'
    if v_gst:
        left_lines += f'<font size="9" color="#333333">GSTIN: {v_gst}</font>'

    right_lines = f"""<table>
<tr><td>PO Number</td><td>: <b>{po.po_number}</b></td></tr>
<tr><td>PO Date</td><td>: {_fmt_date(po.created_at)}</td></tr>
</table>"""

    # Use simple Paragraphs in a table for the vendor/PO info layout
    right_para = (
        f"PO Number&nbsp;&nbsp;: <b>{po.po_number}</b><br/>"
        f"PO Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {_fmt_date(po.created_at)}"
    )

    info_table = Table(
        [[Paragraph(left_lines, _normal_small), Paragraph(right_para, _normal_small)]],
        colWidths=[W * 0.6, W * 0.4],
    )
    info_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))

    # ── Salutation ──────────────────────────────────────────────────────
    elements.append(Paragraph(
        "Dear Sir/Madam,<br/>"
        "We are pleased to place an order for the following items, terms &amp; conditions mentioned below.",
        _normal_small,
    ))
    elements.append(Spacer(1, 10))

    # ── Items Table ─────────────────────────────────────────────────────
    header_row = [
        Paragraph("<b>Sr.<br/>No.</b>", _cell_bold),
        Paragraph("<b>Item Description</b>", _cell_bold),
        Paragraph("<b>HSN<br/>Code</b>", _cell_bold),
        Paragraph("<b>Qty</b>", _cell_bold),
        Paragraph("<b>UOM</b>", _cell_bold),
        Paragraph("<b>RATE</b>", _cell_bold),
        Paragraph("<b>Disc.<br/>%</b>", _cell_bold),
        Paragraph("<b>CGST<br/>%</b>", _cell_bold),
        Paragraph("<b>SGST/<br/>UTGST %</b>", _cell_bold),
        Paragraph("<b>IGST<br/>%</b>", _cell_bold),
        Paragraph("<b>Item<br/>Amt.</b>", _cell_bold),
    ]

    table_data = [header_row]
    grand_total = 0
    total_discount = 0
    total_cgst = 0
    total_sgst = 0
    total_igst = 0
    total_taxable = 0
    total_net = 0

    for idx, item in enumerate(po.items, 1):
        qty = float(item.quantity or 0)
        rate = float(item.rate or 0)
        amount = qty * rate
        disc_pct = float(item.discount_percent or 0)
        disc_amt = amount * (disc_pct / 100)
        net_after_disc = amount - disc_amt

        total_gst_pct = (
            float(item.cgst_percentage or 0) +
            float(item.sgst_percentage or 0) +
            float(item.igst_percentage or 0)
        )

        taxable = net_after_disc
        if item.is_gst_inclusive and total_gst_pct > 0:
            taxable = net_after_disc / (1 + (total_gst_pct / 100))

        cgst_val = taxable * (float(item.cgst_percentage or 0) / 100)
        sgst_val = taxable * (float(item.sgst_percentage or 0) / 100)
        igst_val = taxable * (float(item.igst_percentage or 0) / 100)

        item_base = amount
        if item.is_gst_inclusive and total_gst_pct > 0:
            item_base = amount / (1 + (total_gst_pct / 100))

        if item.is_gst_inclusive:
            item_net = net_after_disc
        else:
            item_net = net_after_disc + cgst_val + sgst_val + igst_val

        total_discount += disc_amt
        total_cgst += cgst_val
        total_sgst += sgst_val
        total_igst += igst_val
        total_taxable += taxable
        total_net += item_net
        grand_total += amount

        mat = item.material
        mat_name = mat.name if mat else "—"
        mat_code = mat.code if mat else ""
        uom_name = mat.uom.name if mat and mat.uom else "NOS"
        gst_label = "(Incl)" if item.is_gst_inclusive else "(Excl)"

        table_data.append([
            Paragraph(str(idx), _cell),
            Paragraph(f"{mat_name}<br/><font size='7' color='grey'>{mat_code}</font>", _cell_left),
            Paragraph("-", _cell),
            Paragraph(f"{qty:.2f}", _cell),
            Paragraph(uom_name, _cell),
            Paragraph(f"{rate:.2f}", _cell_right),
            Paragraph(f"{disc_pct:.2f}", _cell_right),
            Paragraph(f"{float(item.cgst_percentage or 0):.2f}<br/><font size='7' color='grey'>{gst_label}</font>", _cell_right),
            Paragraph(f"{float(item.sgst_percentage or 0):.2f}<br/><font size='7' color='grey'>{gst_label}</font>", _cell_right),
            Paragraph(f"{float(item.igst_percentage or 0):.2f}<br/><font size='7' color='grey'>{gst_label}</font>", _cell_right),
            Paragraph(f"{item_base:.2f}", _cell_right),
        ])

    col_widths = [
        W * 0.05,   # Sr No
        W * 0.20,   # Item Description
        W * 0.06,   # HSN
        W * 0.07,   # Qty
        W * 0.09,   # UOM
        W * 0.08,   # Rate
        W * 0.055,  # Disc
        W * 0.07,   # CGST
        W * 0.09,   # SGST
        W * 0.065,  # IGST
        W * 0.10,   # Item Amt
    ]

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8))

    # ── Totals Section ──────────────────────────────────────────────────
    round_off = round(round(total_net) - total_net, 2)
    net_amount = round(total_net)
    amount_words = _number_to_words(net_amount)

    # Build totals rows
    totals_rows = [
        [Paragraph("Total Amount", _total_label), Paragraph(f": {(total_taxable + total_discount):.2f}", _total_value)],
        [Paragraph("Less: Discount", _discount_label), Paragraph(f": {total_discount:.2f}", _discount_value)],
        [Paragraph("Taxable Amount", _total_label), Paragraph(f": {total_taxable:.2f}", _total_value)],
        [Paragraph("Add: CGST", _total_label), Paragraph(f": {total_cgst:.2f}", _total_value)],
        [Paragraph("Add: SGST", _total_label), Paragraph(f": {total_sgst:.2f}", _total_value)],
    ]
    if total_igst > 0:
        totals_rows.append([Paragraph("Add: IGST", _total_label), Paragraph(f": {total_igst:.2f}", _total_value)])
    totals_rows.append([Paragraph("Round Off", _total_label), Paragraph(f": {round_off:.2f}", _total_value)])
    totals_rows.append([Paragraph("<b>Total Net Amount</b>", _total_bold_label), Paragraph(f"<b>: {net_amount:,.2f}</b>", _total_bold_value)])

    totals_table = Table(totals_rows, colWidths=[W * 0.25, W * 0.15])
    totals_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    # Combine amount in words + totals side by side
    words_para = Paragraph(
        f"Total Net Amount in Word : <b>Rupees {amount_words} Only -/</b>",
        _normal_small,
    )
    summary_table = Table(
        [[words_para, totals_table]],
        colWidths=[W * 0.55, W * 0.45],
    )
    summary_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(summary_table)
    elements.append(Spacer(1, 6))

    # Dashed separator
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc"), dash=(3, 3)))
    elements.append(Spacer(1, 8))

    # ── Closing text ────────────────────────────────────────────────────
    elements.append(Paragraph(
        "Please expedite supplies accordingly, and arrange to send the bill of cost "
        "in duplicate for arranging payment of the same on receipt and inspection of "
        "materials at our end.",
        _normal_small,
    ))
    elements.append(Spacer(1, 8))

    # ── Terms & Conditions ──────────────────────────────────────────────
    terms_text = po.terms or ""
    if terms_text.strip():
        elements.append(Paragraph("<b>TERMS AND CONDITIONS:</b>", _terms_title))
        for line in terms_text.strip().split("\n"):
            line = line.strip()
            if line:
                elements.append(Paragraph(f"• {line}", _terms_style))
        elements.append(Spacer(1, 10))

    # ── Thanking You ────────────────────────────────────────────────────
    elements.append(Paragraph("Thanking You", _normal_small))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>For {ORG_NAME}</b>", _normal_small))
    elements.append(Spacer(1, 50))

    # ── Signatures ──────────────────────────────────────────────────────
    remarks_text = getattr(po, 'remarks', '') or ''
    sig_left = Paragraph(
        "Managing Trustee<br/><br/>"
        "CC: Manager Accounts<br/>"
        f"Remarks: {remarks_text}",
        _normal_small,
    )
    sig_right = Paragraph(
        f"{_fmt_date(datetime.utcnow())}<br/>Prepared By ADMIN",
        ParagraphStyle("SigR", parent=_normal_small, alignment=TA_RIGHT),
    )
    sig_table = Table(
        [[sig_left, "", sig_right]],
        colWidths=[W * 0.4, W * 0.2, W * 0.4],
    )
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(sig_table)

    # ── Build ───────────────────────────────────────────────────────────
    doc.build(elements)
    pdf_bytes = buf.getvalue()
    buf.close()
    logger.info("Generated PO PDF for %s (%d bytes)", po.po_number, len(pdf_bytes))
    return pdf_bytes


def generate_qr_pdf(qr) -> bytes:
    """
    Generate a PDF for a Quotation Request containing only Material Name, Qty, and UOM.
    """
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=12 * mm, bottomMargin=12 * mm,
    )
    W = doc.width
    elements = []

    # ── Header ──────────────────────────────────────────────────────────
    elements.append(Paragraph(f"<b>{ORG_NAME}</b>", _org_title))
    if ORG_ADDRESS:
        elements.append(Paragraph(ORG_ADDRESS, _org_addr))
    elements.append(Paragraph("<u><b>QUOTATION REQUEST</b></u>", _doc_title))

    # ── QR Info ─────────────────────────────────────────────────────────
    left_lines = f"<b>QR Number:</b> {qr.qr_number}<br/>"
    left_lines += f"<b>Date:</b> {_fmt_date(qr.created_at)}<br/>"
        
    info_table = Table(
        [[Paragraph(left_lines, _normal_small), ""]],
        colWidths=[W * 0.6, W * 0.4],
    )
    info_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # ── Items Table ─────────────────────────────────────────────────────
    header_row = [
        Paragraph("<b>Sr.<br/>No.</b>", _cell_bold),
        Paragraph("<b>Material Description</b>", _cell_bold),
        Paragraph("<b>Qty</b>", _cell_bold),
        Paragraph("<b>UOM</b>", _cell_bold),
    ]

    table_data = [header_row]

    for idx, item in enumerate(qr.items, 1):
        mat = item.material
        mat_name = mat.name if mat else "—"
        mat_code = mat.code if mat else ""
        uom_name = mat.uom.name if mat and mat.uom else "NOS"
        
        qty = float(item.quantity or 0)

        table_data.append([
            Paragraph(str(idx), _cell),
            Paragraph(mat_name, _cell_left),
            Paragraph(f"{qty:g}", _cell),
            Paragraph(uom_name, _cell),
        ])

    col_widths = [W * 0.08, W * 0.62, W * 0.15, W * 0.15]

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # ── Build ───────────────────────────────────────────────────────────
    doc.build(elements)
    pdf_bytes = buf.getvalue()
    buf.close()
    
    logger.info("Generated QR PDF for %s (%d bytes)", qr.qr_number, len(pdf_bytes))
    return pdf_bytes

def generate_wo_pdf(wo, db=None) -> bytes:
    """Generate a PDF for a Work Order."""
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=12 * mm, bottomMargin=12 * mm,
    )
    W = doc.width
    elements = []

    # ── Header ──────────────────────────────────────────────────────────
    elements.append(Paragraph(f"<b>{ORG_NAME}</b>", _org_title))
    if ORG_ADDRESS:
        elements.append(Paragraph(ORG_ADDRESS, _org_addr))
    elements.append(Paragraph("<u><b>WORK ORDER</b></u>", _doc_title))

    # ── Vendor + WO Info ────────────────────────────────────────────────
    vendor = wo.vendor
    v_name = "VENDOR"
    if vendor:
        raw = vendor.name or ""
        v_name = raw.split(" - ", 1)[1] if " - " in raw else raw

    v_addr = ""
    v_city_state = ""
    if vendor:
        parts = []
        if vendor.address_line_1:
            parts.append(vendor.address_line_1)
        if vendor.address_line_2:
            parts.append(vendor.address_line_2)
        v_addr = ", ".join(parts)
        cs_parts = []
        if vendor.city:
            cs_parts.append(vendor.city)
        if vendor.state:
            state_name = vendor.state.split(' - ', 1)[1] if ' - ' in vendor.state else vendor.state
            cs_parts.append(state_name)
        if vendor.pincode:
            cs_parts.append(f"- {vendor.pincode}")
        if cs_parts:
            v_city_state = " ".join(cs_parts)

    v_gst = vendor.gst_number if vendor else ""

    left_lines = f"<b>To,</b><br/><b>M/S. {v_name}</b><br/>"
    if v_addr:
        left_lines += f'<font size="9" color="#333333">{v_addr}</font><br/>'
    if v_city_state:
        left_lines += f'<font size="9" color="#333333">{v_city_state}</font><br/>'
    if v_gst:
        left_lines += f'<font size="9" color="#333333">GSTIN: {v_gst}</font>'

    right_para = (
        f"WO Number&nbsp;&nbsp;: <b>{wo.wo_number}</b><br/>"
        f"WO Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {_fmt_date(wo.created_at)}<br/>"
        f"WO Type&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {getattr(wo, 'wo_type', 'AMC')}"
    )

    info_table = Table(
        [[Paragraph(left_lines, _normal_small), Paragraph(right_para, _normal_small)]],
        colWidths=[W * 0.6, W * 0.4],
    )
    info_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(info_table)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph(
        "Dear Sir/Madam,<br/>"
        "We are pleased to place an order for the following work, terms &amp; conditions mentioned below.",
        _normal_small,
    ))
    elements.append(Spacer(1, 10))

    # ── Items Table ─────────────────────────────────────────────────────
    header_row = [
        Paragraph("<b>Sr.<br/>No.</b>", _cell_bold),
        Paragraph("<b>Item Description</b>", _cell_bold),
        Paragraph("<b>HSN<br/>Code</b>", _cell_bold),
        Paragraph("<b>Qty</b>", _cell_bold),
        Paragraph("<b>UOM</b>", _cell_bold),
        Paragraph("<b>RATE</b>", _cell_bold),
        Paragraph("<b>Disc.<br/>%</b>", _cell_bold),
        Paragraph("<b>CGST<br/>%</b>", _cell_bold),
        Paragraph("<b>SGST/<br/>UTGST %</b>", _cell_bold),
        Paragraph("<b>IGST<br/>%</b>", _cell_bold),
        Paragraph("<b>Item<br/>Amt.</b>", _cell_bold),
    ]

    table_data = [header_row]
    grand_total = 0
    total_discount = 0
    total_cgst = 0
    total_sgst = 0
    total_igst = 0
    total_taxable = 0
    total_net = 0

    for idx, item in enumerate(wo.items, 1):
        qty = float(item.quantity or 0)
        rate = float(item.rate or 0)
        amount = qty * rate
        disc_pct = float(item.discount_percent or 0)
        disc_amt = amount * (disc_pct / 100)
        net_after_disc = amount - disc_amt

        total_gst_pct = (
            float(item.cgst_percentage or 0) +
            float(item.sgst_percentage or 0) +
            float(item.igst_percentage or 0)
        )

        taxable = net_after_disc
        if item.is_gst_inclusive and total_gst_pct > 0:
            taxable = net_after_disc / (1 + (total_gst_pct / 100))

        cgst_val = taxable * (float(item.cgst_percentage or 0) / 100)
        sgst_val = taxable * (float(item.sgst_percentage or 0) / 100)
        igst_val = taxable * (float(item.igst_percentage or 0) / 100)

        item_base = amount
        if item.is_gst_inclusive and total_gst_pct > 0:
            item_base = amount / (1 + (total_gst_pct / 100))

        if item.is_gst_inclusive:
            item_net = net_after_disc
        else:
            item_net = net_after_disc + cgst_val + sgst_val + igst_val

        total_discount += disc_amt
        total_cgst += cgst_val
        total_sgst += sgst_val
        total_igst += igst_val
        total_taxable += taxable
        total_net += item_net
        grand_total += amount

        mat = item.material
        mat_name = mat.name if mat else "—"
        mat_code = mat.code if mat else ""
        uom_name = mat.uom.name if mat and mat.uom else "NOS"
        gst_label = "(Incl)" if item.is_gst_inclusive else "(Excl)"

        table_data.append([
            Paragraph(str(idx), _cell),
            Paragraph(f"{mat_name}<br/><font size='7' color='grey'>{mat_code}</font>", _cell_left),
            Paragraph("-", _cell),
            Paragraph(f"{qty:.2f}", _cell),
            Paragraph(uom_name, _cell),
            Paragraph(f"{rate:.2f}", _cell_right),
            Paragraph(f"{disc_pct:.2f}", _cell_right),
            Paragraph(f"{float(item.cgst_percentage or 0):.2f}<br/><font size='7' color='grey'>{gst_label}</font>", _cell_right),
            Paragraph(f"{float(item.sgst_percentage or 0):.2f}<br/><font size='7' color='grey'>{gst_label}</font>", _cell_right),
            Paragraph(f"{float(item.igst_percentage or 0):.2f}<br/><font size='7' color='grey'>{gst_label}</font>", _cell_right),
            Paragraph(f"{item_base:.2f}", _cell_right),
        ])

    col_widths = [W * 0.05, W * 0.20, W * 0.06, W * 0.07, W * 0.09, W * 0.08, W * 0.055, W * 0.07, W * 0.09, W * 0.065, W * 0.10]

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 8))

    # ── Totals Section ──────────────────────────────────────────────────
    round_off = round(round(total_net) - total_net, 2)
    net_amount = round(total_net)
    amount_words = _number_to_words(net_amount)

    totals_rows = [
        [Paragraph("Total Amount", _total_label), Paragraph(f": {(total_taxable + total_discount):.2f}", _total_value)],
        [Paragraph("Less: Discount", _discount_label), Paragraph(f": {total_discount:.2f}", _discount_value)],
        [Paragraph("Taxable Amount", _total_label), Paragraph(f": {total_taxable:.2f}", _total_value)],
        [Paragraph("Add: CGST", _total_label), Paragraph(f": {total_cgst:.2f}", _total_value)],
        [Paragraph("Add: SGST", _total_label), Paragraph(f": {total_sgst:.2f}", _total_value)],
    ]
    if total_igst > 0:
        totals_rows.append([Paragraph("Add: IGST", _total_label), Paragraph(f": {total_igst:.2f}", _total_value)])
    totals_rows.append([Paragraph("Round Off", _total_label), Paragraph(f": {round_off:.2f}", _total_value)])
    totals_rows.append([Paragraph("<b>Total Net Amount</b>", _total_bold_label), Paragraph(f"<b>: {net_amount:,.2f}</b>", _total_bold_value)])

    totals_table = Table(totals_rows, colWidths=[W * 0.25, W * 0.15])
    totals_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))

    words_para = Paragraph(f"Total Net Amount in Word : <b>Rupees {amount_words} Only -/</b>", _normal_small)
    summary_table = Table([[words_para, totals_table]], colWidths=[W * 0.55, W * 0.45])
    summary_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(summary_table)
    elements.append(Spacer(1, 6))

    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc"), dash=(3, 3)))
    elements.append(Spacer(1, 8))

    elements.append(Paragraph(
        "Please expedite the work accordingly, and arrange to send the bill of cost "
        "in duplicate for arranging payment of the same on completion.",
        _normal_small,
    ))
    elements.append(Spacer(1, 8))

    terms_text = wo.terms or ""
    if terms_text.strip():
        elements.append(Paragraph("<b>TERMS AND CONDITIONS:</b>", _terms_title))
        for line in terms_text.strip().split("\n"):
            line = line.strip()
            if line:
                elements.append(Paragraph(f"• {line}", _terms_style))
        elements.append(Spacer(1, 10))

    elements.append(Paragraph("Thanking You", _normal_small))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>For {ORG_NAME}</b>", _normal_small))
    elements.append(Spacer(1, 50))

    remarks_text = getattr(wo, 'remarks', '') or ''
    sig_left = Paragraph(f"Remarks: {remarks_text}", _normal_small)
    sig_right = Paragraph(f"{_fmt_date(datetime.utcnow())}<br/>Prepared By ADMIN", ParagraphStyle("SigR", parent=_normal_small, alignment=TA_RIGHT))
    sig_table = Table([[sig_left, "", sig_right]], colWidths=[W * 0.4, W * 0.2, W * 0.4])
    sig_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(sig_table)

    doc.build(elements)
    pdf_bytes = buf.getvalue()
    buf.close()
    logger.info("Generated WO PDF for %s (%d bytes)", wo.wo_number, len(pdf_bytes))
    return pdf_bytes
