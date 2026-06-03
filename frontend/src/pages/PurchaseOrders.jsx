import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  InputLabel, IconButton, Tooltip, Divider, InputAdornment, Paper, TableSortLabel, useTheme, useMediaQuery,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl
} from '@mui/material';
import { Add, Delete, CheckCircle, Archive, Send, Cancel, Pause, Search, ShoppingCart, Store, Assignment, CalendarMonth, ArrowDropDown } from '@mui/icons-material';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

export default function PurchaseOrders() {
  const { showMessage } = useMessage();
  const { hasAction, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    vendor_id: '', project_id: '', delivery_date: dayjs().add(14, 'day'), terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '', discount_percent: 0, cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }]
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPOs = useMemo(() => {
    const list = [...pos];
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'vendor') aVal = a.vendor_name;
        if (sortConfig.key === 'vendor') bVal = b.vendor_name;
        if (sortConfig.key === 'total_amount') {
           aVal = calculatePOTotalNet(a);
           bVal = calculatePOTotalNet(b);
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [pos, sortConfig]);

  const calculatePOTotalNet = (po) => {
    if (!po || !po.items) return 0;
    let totalNetAmountSum = 0;
    po.items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const discAmt = amount * ((item.discount_percent || 0) / 100);
      const netAmtAfterDisc = amount - discAmt;
      
      let taxable = netAmtAfterDisc;
      const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
      if (item.is_gst_inclusive && totalGst > 0) {
          taxable = netAmtAfterDisc / (1 + (totalGst / 100));
      }
      
      const cgstVal = taxable * ((item.cgst_percentage || 0) / 100);
      const sgstVal = taxable * ((item.sgst_percentage || 0) / 100);
      const igstVal = taxable * ((item.igst_percentage || 0) / 100);
      
      if (item.is_gst_inclusive) {
          totalNetAmountSum += netAmtAfterDisc;
      } else {
          totalNetAmountSum += (netAmtAfterDisc + cgstVal + sgstVal + igstVal);
      }
    });
    return Math.round(totalNetAmountSum);
  };

  const formatCurrency = (amount) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false, po: null });
  const [reason, setReason] = useState('');

  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false, po = null) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason, po });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); setReason(''); };
  const handleCancelConfirm = () => { setConfirm({ ...confirm, open: false }); setReason(''); };

  const load = () => { api.get('/api/procurement/po', { params: { search: search || undefined } }).then(r => setPos(r.data)); };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/terms').then(r => setTermsTemplates(r.data));
  }, []);

  useEffect(() => {
    if (location.state?.indentData && projects.length > 0) {
      const ind = location.state.indentData;
      setForm({
        vendor_id: '',
        project_id: projects[0]?.id || '',
        delivery_date: dayjs().add(21, 'day'),
        terms: '',
        po_type: 'Formal',
        indent_id: ind.id,
        items: ind.items.filter(it => it.requested_quantity > it.issued_quantity).map(it => ({
          material_id: it.material_id,
          quantity: it.requested_quantity - it.issued_quantity,
          rate: '',
          discount_percent: 0,
          cgst_percentage: 0,
          sgst_percentage: 0,
          igst_percentage: 0,
          is_gst_inclusive: false,
          uom_name: '',
          base_rate: 0
        }))
      });
      setDialog(true);
      // Clean up state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, projects, location.pathname, navigate]);

  const addItem = () => setForm({ ...form, items: [...form.items, { material_id: '', quantity: '', rate: '', discount_percent: 0, cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    if (field === 'material_id') {
      const mat = materials.find(m => m.id === val);
      if (mat) {
        items[i].uom_name = mat.uom_name || '';
        items[i].base_rate = mat.standard_cost || 0;
      }
    }
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    if (!form.terms || !form.terms.trim()) {
      showMessage("Terms and Conditions are mandatory.", "Validation Error", "warning");
      return;
    }
    try {
      const mappedItems = form.items.map(it => {
        const inputRate = parseFloat(it.rate) || 0;
        const totalGstPercent = (parseFloat(it.cgst_percentage) || 0) + (parseFloat(it.sgst_percentage) || 0) + (parseFloat(it.igst_percentage) || 0);
        return {
          material_id: it.material_id,
          quantity: parseFloat(it.quantity) || 0,
          rate: inputRate,
          discount_percent: parseFloat(it.discount_percent) || 0,
          cgst_percentage: parseFloat(it.cgst_percentage) || 0,
          sgst_percentage: parseFloat(it.sgst_percentage) || 0,
          igst_percentage: parseFloat(it.igst_percentage) || 0,
          is_gst_inclusive: it.is_gst_inclusive || false
        };
      });
      const hasInvalidNumbers = mappedItems.some(it => it.quantity <= 0 || it.rate < 0);
      if (hasInvalidNumbers) {
        showMessage("Quantity must be greater than 0, and rate cannot be negative.", "Validation Error", "warning");
        return;
      }
      const payload = {
        ...form,
        delivery_date: form.delivery_date ? dayjs(form.delivery_date).format('YYYY-MM-DD') : null,
        items: mappedItems
      };
      if (payload.indent_id) {
        // Pass indent_id optionally
        await api.post('/api/procurement/po', payload);
        // Also could call convert-po endpoint but PO endpoint works if indent_id is set
      } else {
        await api.post('/api/procurement/po', payload);
      }
      setDialog(false); load();
      showMessage("Purchase Order created successfully!", "Success", "success");
    } catch (err) { showMessage(err.response?.data?.detail || 'Error', "Error", "error"); }
  };

  const approvePO = async (id) => { await api.post(`/api/procurement/po/${id}/approve`); load(); };
  const rejectPO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/reject`, { remarks }); load(); };
  const holdPO = async (id) => { await api.post(`/api/procurement/po/${id}/hold`); load(); };
  const sendPO = async (id) => {
    try {
      const res = await api.post(`/api/procurement/po/${id}/send`);
      showMessage(res.data.message, "PO Sent", "success");
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error sending PO", "Error", "error");
    }
  };
  const shortClosePO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/short-close`, { remarks }); load(); };

  // Status helpers
  const statusColor = {
    'Draft': 'default', 'Approved': 'success', 'Sent to Vendor': 'info',
    'Partially Received': 'warning', 'Closed': 'default', 'Short Closed': 'warning',
    'Rejected': 'error', 'On Hold': 'secondary'
  };

  const canApprove = (s) => s === 'Draft' || s === 'On Hold';
  const canReject = (s) => s === 'Draft';
  const canHold = (s) => s === 'Draft' || s === 'Approved';
  const canSend = (s) => s === 'Approved';
  const canShortClose = (s) => s !== 'Short Closed' && s !== 'Closed' && s !== 'Rejected' && s !== 'Draft';

  const numberToWords = (num) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() || 'Zero';
  };

  const handlePrintPO = (poToPrint = null) => {
    const po = poToPrint || detailDialog;
    if (!po) return;
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTaxable = 0;
    let totalNetAmountSum = 0;
    
    po.items.forEach((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const discAmt = amount * ((item.discount_percent || 0) / 100);
      const netAmtAfterDisc = amount - discAmt;
      
      let taxable = netAmtAfterDisc;
      const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
      if (item.is_gst_inclusive && totalGst > 0) {
          taxable = netAmtAfterDisc / (1 + (totalGst / 100));
      }
      
      const cgstVal = taxable * ((item.cgst_percentage || 0) / 100);
      const sgstVal = taxable * ((item.sgst_percentage || 0) / 100);
      const igstVal = taxable * ((item.igst_percentage || 0) / 100);
      
      let itemBaseAmount = amount;
      if (item.is_gst_inclusive && totalGst > 0) {
          itemBaseAmount = amount / (1 + (totalGst / 100));
      }

      totalCgst += cgstVal;
      totalSgst += sgstVal;
      totalIgst += igstVal;
      totalDiscount += discAmt;
      totalTaxable += taxable;
      grandTotal += amount;
      
      if (item.is_gst_inclusive) {
          totalNetAmountSum += netAmtAfterDisc;
      } else {
          totalNetAmountSum += (netAmtAfterDisc + cgstVal + sgstVal + igstVal);
      }
      
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.material_name}<br/><small>${item.material_code}</small></td>
          <td>-</td>
          <td>${qty.toFixed(2)}</td>
          <td>${item.uom_name || 'NOS'}</td>
          <td style="text-align:right">${rate.toFixed(2)}</td>
          <td style="text-align:right">${(item.discount_percent || 0).toFixed(2)}</td>
          <td style="text-align:right">${(item.cgst_percentage || 0).toFixed(2)}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align:right">${(item.sgst_percentage || 0).toFixed(2)}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align:right">${(item.igst_percentage || 0).toFixed(2)}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align:right">${itemBaseAmount.toFixed(2)}</td>
        </tr>
      `;
    });
    
    const grandTotalWithTax = totalNetAmountSum;
    const roundOff = (Math.round(grandTotalWithTax) - grandTotalWithTax).toFixed(2);
    const totalNetAmount = Math.round(grandTotalWithTax).toFixed(2);
    const activeTerms = po.terms || termsTemplates.find(t => t.is_default)?.content || (termsTemplates.length > 0 ? termsTemplates[0].content : '');
    const termsHtml = (activeTerms || '').split('\n').filter(t => t.trim()).map(t => `<li>${t}</li>`).join('');

    const html = `
      <html>
        <head>
          <title>PO - ${po.po_number}</title>
          <style>
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; color: #000; background-color: #f8fafc; }
            .print-wrapper { max-width: 800px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px; }
            @media print {
              body { background-color: white; padding: 0; }
              .print-wrapper { max-width: 100%; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
            }
            .action-bar { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 20px; }
            .btn { padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; font-family: Arial, sans-serif; }
            .btn-print { background: #2563EB; color: white; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3); }
            .btn-print:hover { background: #1D4ED8; }
            .btn-close { background: #e2e8f0; color: #334155; }
            .btn-close:hover { background: #cbd5e1; }
            .header-container { text-align: center; margin-bottom: 20px; }
            .org-title { font-size: 16px; font-weight: bold; margin: 0; }
            .org-address { font-size: 11px; margin: 5px 0; }
            .doc-title { font-size: 14px; font-weight: bold; text-decoration: underline; margin-top: 15px; }
            .info-table { width: 100%; border: none; margin-bottom: 15px; }
            .info-table td { vertical-align: top; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 4px; text-align: center; }
            .items-table th { font-weight: bold; }
            .items-table td:nth-child(2) { text-align: left; }
            .terms-list { margin: 5px 0 20px 0; padding-left: 20px; list-style-type: none; font-size: 10px; }
            .terms-list li { margin-bottom: 3px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .sig-box { text-align: center; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="action-bar no-print">
              <button class="btn btn-close" onclick="window.close()">Close</button>
              <button class="btn btn-print" onclick="window.print()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print
              </button>
            </div>
            <div class="header-container">
            <h2 class="org-title">EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER</h2>
            <p class="org-address">113, JNANA PRABHA CAMPUS, BIDARAHALLI, VIRGO NAGAR POST, BANGALORE - 560049</p>
            <div class="doc-title">PURCHASE ORDER</div>
          </div>
          
          <table class="info-table">
            <tr>
              <td style="width: 60%;">
                <b>To,</b><br/>
                <b>M/S. ${po.vendor_name ? (po.vendor_name.includes(' - ') ? po.vendor_name.split(' - ').slice(1).join(' - ') : po.vendor_name) : 'VENDOR'}</b><br/>
                ${po.vendor_address ? `<span style="font-size: 10px; color: #333;">${po.vendor_address}</span><br/>` : ''}
                ${po.vendor_gst_number ? `<span style="font-size: 10px; color: #333;">GSTIN: ${po.vendor_gst_number}</span><br/>` : ''}
              </td>
              <td style="width: 40%;">
                <table style="width: 100%">
                  <tr><td style="width: 40%">PO Number</td><td>: <b>${po.po_number}</b></td></tr>
                  <tr><td>PO Date</td><td>: ${formatDate(po.created_at)}</td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          <div style="margin-bottom: 15px;">
            Dear Sir/Madam,<br/>
            We are pleased to place an order for the following items, terms & conditions mentioned below.
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Sr.<br/>No.</th>
                <th style="width:30%">Item Description</th>
                <th>HSN<br/>Code</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>RATE</th>
                <th>Disc.<br/>%</th>
                <th>CGST<br/>%</th>
                <th>SGST/<br/>UTGST %</th>
                <th>IGST<br/>%</th>
                <th>Item<br/>Amt.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          
          <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
            <div style="width: 60%">
              Total Net Amount in Word : <b>Rupees ${numberToWords(Math.round(grandTotalWithTax))} Only -/</b>
            </div>
            <div style="width: 40%">
              <table style="width:100%; border-collapse: collapse;">
                <tr><td style="text-align:right">Total Amount</td><td style="text-align:right; width: 100px;">: ${(totalTaxable + totalDiscount).toFixed(2)}</td></tr>
                <tr><td style="text-align:right; color: #d97706;">Less: Discount</td><td style="text-align:right; color: #d97706;">: ${totalDiscount.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Taxable Amount</td><td style="text-align:right">: ${totalTaxable.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Add: CGST</td><td style="text-align:right">: ${totalCgst.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Add: SGST</td><td style="text-align:right">: ${totalSgst.toFixed(2)}</td></tr>
                ${totalIgst > 0 ? `<tr><td style="text-align:right">Add: IGST</td><td style="text-align:right">: ${totalIgst.toFixed(2)}</td></tr>` : ''}
                <tr><td style="text-align:right">Round Off</td><td style="text-align:right">: ${roundOff}</td></tr>
                <tr><td style="text-align:right"><b>Total Net Amount</b></td><td style="text-align:right"><b>: ${totalNetAmount}</b></td></tr>
              </table>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            Please expedite supplies accordingly, and arrange to send the bill of cost in duplicate for arranging payment of the same on receipt and inspection of materials at our end.
          </div>
          
          <b style="font-size:10px;">TERMS AND CONDITIONS:</b>
          <ul class="terms-list">
            ${termsHtml}
          </ul>
          
          <div style="margin-top: 10px;">Thanking You</div>
          <div style="margin-top: 20px; margin-bottom: 30px;"><b>For EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER</b></div>
          
            <div class="signatures">
              <div class="sig-box" style="text-align: left;">
                Managing Trustee
                <br/><br/>
                CC: Manager Accounts<br/>
                Remarks: ${po.remarks || ''}
              </div>
              <div class="sig-box" style="text-align: right;">
                ${formatDate(new Date())}<br/>
                Prepared By ADMIN
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const detailData = useMemo(() => {
    if (!detailDialog) return null;
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTaxable = 0;
    let totalNetAmountSum = 0;
    
    (detailDialog.items || []).forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const discAmt = amount * ((item.discount_percent || 0) / 100);
      const netAmtAfterDisc = amount - discAmt;
      
      let taxable = netAmtAfterDisc;
      const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
      if (item.is_gst_inclusive && totalGst > 0) {
          taxable = netAmtAfterDisc / (1 + (totalGst / 100));
      }
      
      const cgstVal = taxable * ((item.cgst_percentage || 0) / 100);
      const sgstVal = taxable * ((item.sgst_percentage || 0) / 100);
      const igstVal = taxable * ((item.igst_percentage || 0) / 100);
      
      totalDiscount += discAmt;
      totalCgst += cgstVal;
      totalSgst += sgstVal;
      totalIgst += igstVal;
      totalTaxable += taxable;
      grandTotal += amount;
      
      if (item.is_gst_inclusive) {
          totalNetAmountSum += netAmtAfterDisc;
      } else {
          totalNetAmountSum += (netAmtAfterDisc + cgstVal + sgstVal + igstVal);
      }
    });
    
    const grandTotalWithTax = totalNetAmountSum;
    const roundOff = (Math.round(grandTotalWithTax) - grandTotalWithTax).toFixed(2);
    const totalNetAmount = Math.round(grandTotalWithTax).toFixed(2);
    const activeTerms = detailDialog.terms || termsTemplates.find(t => t.is_default)?.content || (termsTemplates.length > 0 ? termsTemplates[0].content : '');

    return {
      grandTotal,
      totalDiscount,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTaxable,
      grandTotalWithTax,
      roundOff,
      totalNetAmount,
      activeTerms
    };
  }, [detailDialog, termsTemplates]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Purchase Orders</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{pos.length} orders</Typography>
        </Box>
        {hasPermission('purchase_orders', 'can_create') && (
          <Button variant="contained" startIcon={<Add />} onClick={() => {
            setForm({ vendor_id: '', project_id: projects[0]?.id || '', delivery_date: dayjs().add(21, 'day'), terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '', discount_percent: 0, cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }] });
            setDialog(true);
          }}>Create PO</Button>
        )}
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search PO numbers..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Card>
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {sortedPOs.length === 0 && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No purchase orders found.
              </Typography>
            )}
            {sortedPOs.map(po => (
              <Card key={po.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => setDetailDialog(po)}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>{po.po_number}</Typography>
                    <Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                 </Box>
                 <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Vendor:</strong> {po.vendor_name}</Typography>
                 <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Amount:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(calculatePOTotalNet(po))}</span></Typography>
                 <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(po.created_at)} • {po.items?.length || 0} items</Typography>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={po.po_type} size="small" variant="outlined" color={po.po_type === 'Formal' ? 'primary' : 'default'} sx={{ height: 22, fontSize: '0.7rem' }} />
                    <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                      <Tooltip title="Approve">
                        <span><IconButton size="small" color="success" disabled={!canApprove(po.status) || !hasAction('purchase_orders', 'can_approve')}
                          onClick={() => showConfirm('Approve PO?', `Are you sure you want to approve ${po.po_number}?`, 'Yes, Approve', 'success', () => approvePO(po.id))}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={!canReject(po.status) || !hasAction('purchase_orders', 'can_reject')}
                          onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Put on Hold">
                        <span><IconButton size="small" color="secondary" disabled={!canHold(po.status) || !hasAction('purchase_orders', 'can_hold')}
                          onClick={() => showConfirm('Hold PO?', `Place ${po.po_number} on hold?`, 'Yes, Hold', 'warning', () => holdPO(po.id))}>
                          <Pause fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Send to Vendor">
                        <span><IconButton size="small" disabled={!canSend(po.status) || !hasAction('purchase_orders', 'can_send_to_vendor')}
                          sx={{ color: '#8b5cf6', '&.Mui-disabled': { color: 'text.disabled' } }}
                          onClick={() => showConfirm('Send to Vendor?', `Send ${po.po_number} to vendor?`, 'Yes, Send', 'primary', () => sendPO(po.id), false, po)}>
                          <Send fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                    </Box>
                 </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 0.5, py: 0.5, borderBottom: '1px solid #f1f5f9' } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'po_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('po_number')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      PO No
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'indent_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('indent_number')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      INDENT
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'pr_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('pr_number')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      PR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'qr_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('qr_number')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      QUOTATION
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'vendor'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('vendor')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      VENDOR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ITEMS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                     <TableSortLabel
                      active={sortConfig.key === 'total_amount'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('total_amount')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      AMOUNT
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>TYPE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'created_at'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('created_at')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      DATE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>DELIVERY</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'status'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('status')}
                      IconComponent={ArrowDropDown}
                      sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                    >
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPOs.map(po => (
                  <TableRow key={po.id} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }} onClick={() => setDetailDialog(po)}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{po.po_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>{po.indent_number || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>{po.pr_number || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>{po.qr_number || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>{po.vendor_name}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem' }}>{po.items?.length || 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(calculatePOTotalNet(po))}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>
                      <Chip label={po.po_type} size="small" variant="outlined" color={po.po_type === 'Formal' ? 'primary' : 'default'} sx={{ fontSize: '0.6rem', height: 18 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.delivery_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }} /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Approve">
                          <span><IconButton size="small" color="success" disabled={!canApprove(po.status) || !hasAction('purchase_orders', 'can_approve')}
                            onClick={() => showConfirm('Approve PO?', `Are you sure you want to approve ${po.po_number}?`, 'Yes, Approve', 'success', () => approvePO(po.id))}>
                            <CheckCircle fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span><IconButton size="small" color="error" disabled={!canReject(po.status) || !hasAction('purchase_orders', 'can_reject')}
                            onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                            <Cancel fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Put on Hold">
                          <span><IconButton size="small" color="secondary" disabled={!canHold(po.status) || !hasAction('purchase_orders', 'can_hold')}
                            onClick={() => showConfirm('Hold PO?', `Place ${po.po_number} on hold?`, 'Yes, Hold', 'warning', () => holdPO(po.id))}>
                            <Pause fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Send to Vendor">
                          <span><IconButton size="small" disabled={!canSend(po.status) || !hasAction('purchase_orders', 'can_send_to_vendor')}
                            sx={{ color: '#8b5cf6', '&.Mui-disabled': { color: 'text.disabled' } }}
                            onClick={() => showConfirm('Send to Vendor?', `Send ${po.po_number} to vendor?`, 'Yes, Send', 'primary', () => sendPO(po.id), false, po)}>
                            <Send fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Short Close">
                          <span><IconButton size="small" color="warning" disabled={!canShortClose(po.status) || !hasAction('purchase_orders', 'can_short_close')}
                            onClick={() => showConfirm('Short Close PO?', `Short close ${po.po_number}?`, 'Yes, Short Close', 'warning', (r) => shortClosePO(po.id, r), true)}>
                            <Archive fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* PO Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.po_number} — Order Details</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>VENDOR</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography>
                {detailDialog?.vendor_gst_number && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>GSTIN: {detailDialog.vendor_gst_number}</Typography>
                )}
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>INDENT</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.indent_number || '-'}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PR</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.pr_number || '-'}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>QUOTATION</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.qr_number || '-'}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>STATUS</Typography>
                <Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
              </Grid>

              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PO TYPE</Typography>
                <Box><Chip label={detailDialog?.po_type} size="small" variant="outlined" color={detailDialog?.po_type === 'Formal' ? 'primary' : 'default'} sx={{ fontSize: '0.7rem' }} /></Box>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PO DATE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.created_at)}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>DELIVERY</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.delivery_date) || '-'}</Typography>
              </Grid>
              <Grid item xs={4.5}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>TOTAL NET AMOUNT</Typography>
                <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.2rem' }}>{formatCurrency(calculatePOTotalNet(detailDialog))}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>Material Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Sr. No.</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Item Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>HSN Code</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>UOM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>RATE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Disc. %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>CGST %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>SGST %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>IGST %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Item Amt.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Received</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailDialog?.items?.map((item, idx) => {
                    const qty = parseFloat(item.quantity) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const amount = qty * rate;
                    return (
                      <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {item.material_name}<br/>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>-</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{qty.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{item.uom_name || 'NOS'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{rate.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{(item.discount_percent || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {(item.cgst_percentage || 0).toFixed(2)}<br/><Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>{item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {(item.sgst_percentage || 0).toFixed(2)}<br/><Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>{item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {(item.igst_percentage || 0).toFixed(2)}<br/><Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>{item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {(() => {
                            const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
                            let itemBaseAmount = amount;
                            if (item.is_gst_inclusive && totalGst > 0) {
                                itemBaseAmount = amount / (1 + (totalGst / 100));
                            }
                            return itemBaseAmount.toFixed(2);
                          })()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={item.received_quantity} size="small" color={item.received_quantity >= item.quantity ? 'success' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {detailData && (
              <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'flex-end', alignItems: 'flex-start', borderBottom: '1px dashed #cbd5e1', pb: 2, gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '40%' } }}>
                  <Table size="small" sx={{ '& td': { borderBottom: 'none', py: 0.5, px: 1 } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Total Amount</TableCell>
                        <TableCell align="right" sx={{ width: '120px' }}>: {(detailData.totalTaxable + detailData.totalDiscount).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#d97706', fontWeight: 600 }}>Less: Discount</TableCell>
                        <TableCell align="right" sx={{ color: '#d97706' }}>: {detailData.totalDiscount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Taxable Amount</TableCell>
                        <TableCell align="right">: {detailData.totalTaxable.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Add: CGST</TableCell>
                        <TableCell align="right">: {detailData.totalCgst.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Add: SGST</TableCell>
                        <TableCell align="right">: {detailData.totalSgst.toFixed(2)}</TableCell>
                      </TableRow>
                      {detailData.totalIgst > 0 && (
                        <TableRow>
                          <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Add: IGST</TableCell>
                          <TableCell align="right">: {detailData.totalIgst.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Round Off</TableCell>
                        <TableCell align="right">: {detailData.roundOff}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Total Net Amount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>: {detailData.totalNetAmount}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}

            {detailData && detailData.activeTerms && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', display: 'block', mb: 1 }}>TERMS AND CONDITIONS:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, fontSize: '0.75rem', color: '#334155' } }}>
                  {detailData.activeTerms.split('\n').filter(t => t.trim()).map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          {detailDialog?.status !== 'Draft' && detailDialog?.status !== 'Rejected' && detailDialog?.status !== 'On Hold' && (
            <Button onClick={() => handlePrintPO()} variant="contained" sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', mr: 2, bgcolor: '#2563EB' }}>Print PO</Button>
          )}
          <Button onClick={() => setDetailDialog(null)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Purchase Order</Typography>
              <Typography variant="body2" color="text.secondary">Issue a new purchase order to the vendor.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1, mb: 2 }}>
            <FormControl fullWidth required size="small">
              <InputLabel>Vendor</InputLabel>
              <Select
                value={form.vendor_id}
                label="Vendor"
                onChange={e => setForm({ ...form, vendor_id: e.target.value })}
                startAdornment={<InputAdornment position="start"><Store sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>PO Type</InputLabel>
              <Select
                value={form.po_type || 'Informal'}
                label="PO Type"
                onChange={e => setForm({ ...form, po_type: e.target.value })}
                startAdornment={<InputAdornment position="start"><Assignment sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="Formal">Formal</MenuItem>
                <MenuItem value="Informal">Informal</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label="Delivery Date"
              value={dayjs(form.delivery_date)}
              onChange={val => setForm({ ...form, delivery_date: val })}
              format="DD-MMM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  InputProps: {
                    startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: '#94A3B8' }} /></InputAdornment>
                  }
                }
              }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Line Items</Typography>
            {!form.indent_id && (
              <Button size="small" startIcon={<Add />} onClick={addItem} sx={{ fontWeight: 600 }}>Add Item</Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {form.items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const inputRate = parseFloat(item.rate) || 0;
              const discPercent = parseFloat(item.discount_percent) || 0;
              const cgstPercent = parseFloat(item.cgst_percentage) || 0;
              const sgstPercent = parseFloat(item.sgst_percentage) || 0;
              const igstPercent = parseFloat(item.igst_percentage) || 0;
              const totalGstPercent = cgstPercent + sgstPercent + igstPercent;
              
              const grossAmt = qty * inputRate;
              const discAmt = grossAmt * (discPercent / 100);
              const netAmtAfterDisc = grossAmt - discAmt;
              
              let taxableAmt = netAmtAfterDisc;
              if (item.is_gst_inclusive && totalGstPercent > 0) {
                taxableAmt = netAmtAfterDisc / (1 + (totalGstPercent / 100));
              }
              const cgstAmt = taxableAmt * (cgstPercent / 100);
              const sgstAmt = taxableAmt * (sgstPercent / 100);
              const igstAmt = taxableAmt * (igstPercent / 100);
              const netAmt = item.is_gst_inclusive ? netAmtAfterDisc : (taxableAmt + cgstAmt + sgstAmt + igstAmt);

              return (
              <Box key={i} sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.5fr 0.5fr 0.8fr 1fr 0.8fr' },
                gap: 1.5,
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <Box>
                  <MaterialSelect
                    materials={materials}
                    value={item.material_id}
                    onChange={val => updateItem(i, 'material_id', val)}
                    size="small"
                  />
                </Box>
                <TextField size="small" label="Unit" value={item.uom_name || '-'} InputProps={{ readOnly: true }} />
                <TextField size="small" label="Qty" type="number" value={item.quantity} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'quantity', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0 }} />
                <Box>
                  <TextField fullWidth size="small" label="Rate (₹)" type="number" value={item.rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'rate', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0 }} />
                  {item.base_rate > 0 && <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>Base Rate: ₹{item.base_rate}</Typography>}
                </Box>
                <FormControl size="small">
                  <InputLabel>GST</InputLabel>
                  <Select label="GST" value={item.is_gst_inclusive ? 'inclusive' : 'exclusive'} onChange={e => updateItem(i, 'is_gst_inclusive', e.target.value === 'inclusive')}>
                    <MenuItem value="exclusive">Exclusive</MenuItem>
                    <MenuItem value="inclusive">Inclusive</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                  <Box display="flex" gap={1}>
                    <TextField size="small" label="Disc %" type="number" value={item.discount_percent} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'discount_percent', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100 }} sx={{ flex: 1 }} />
                    <TextField size="small" label="Disc (₹)" value={discAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                  </Box>
                  <Box display="flex" gap={1}>
                    <TextField size="small" label="CGST %" type="number" value={item.cgst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'cgst_percentage', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100 }} sx={{ flex: 1 }} />
                    <TextField size="small" label="CGST (₹)" value={cgstAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                  </Box>
                  <Box display="flex" gap={1}>
                    <TextField size="small" label="SGST %" type="number" value={item.sgst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'sgst_percentage', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100 }} sx={{ flex: 1 }} />
                    <TextField size="small" label="SGST (₹)" value={sgstAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                  </Box>
                  <Box display="flex" gap={1}>
                    <TextField size="small" label="IGST %" type="number" value={item.igst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'igst_percentage', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100 }} sx={{ flex: 1 }} />
                    <TextField size="small" label="IGST (₹)" value={igstAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                  </Box>
                </Box>
                
                <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                  {form.items.length > 1 ? (
                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => removeItem(i)}>Remove</Button>
                  ) : <Box />}
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>NET AMOUNT</Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      ₹{netAmt.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
            })}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>Terms & Conditions *</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Template</InputLabel>
            <Select
              label="Select Template"
              onChange={e => {
                const t = termsTemplates.find(x => x.id === e.target.value);
                if (t) setForm({ ...form, terms: t.content });
              }}
              defaultValue=""
            >
              <MenuItem value=""><em>Select a Template</em></MenuItem>
              {termsTemplates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            required
            rows={4}
            label="Terms and Conditions"
            value={form.terms}
            onChange={e => setForm({ ...form, terms: e.target.value })}
            placeholder="Enter terms and conditions..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}>Create PO</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog with optional Reason */}
      <Dialog open={confirm.open} onClose={handleCancelConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{confirm.message}</Typography>
          {confirm.needsReason && (
            <TextField fullWidth label="Reason (required)" value={reason} onChange={e => setReason(e.target.value)}
              multiline rows={2} required autoFocus />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConfirm} sx={{ textTransform: 'none' }}>Cancel</Button>
          {confirm.title === 'Send to Vendor?' && (
            <Button onClick={() => handlePrintPO(confirm.po)} variant="outlined" size="small" sx={{ fontWeight: 600, textTransform: 'none', mx: 1 }}>
              Print PO
            </Button>
          )}
          <Button variant="contained" color={confirm.confirmColor}
            disabled={confirm.needsReason && !reason.trim()}
            onClick={handleConfirm} sx={{ fontWeight: 600, textTransform: 'none' }}>
            {confirm.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
