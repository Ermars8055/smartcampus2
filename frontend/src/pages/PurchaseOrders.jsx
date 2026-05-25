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

export default function PurchaseOrders() {
  const { showMessage } = useMessage();
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
    vendor_id: '', project_id: '', delivery_date: dayjs().add(14, 'day'), terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '' }]
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
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [pos, sortConfig]);

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
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
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
        terms: termsTemplates.find(t => t.is_default)?.content || '',
        po_type: 'Formal',
        indent_id: ind.id,
        items: ind.items.filter(it => it.requested_quantity > it.issued_quantity).map(it => ({
          material_id: it.material_id,
          quantity: it.requested_quantity - it.issued_quantity,
          rate: ''
        }))
      });
      setDialog(true);
      // Clean up state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, projects, location.pathname, navigate]);

  const addItem = () => setForm({ ...form, items: [...form.items, { material_id: '', quantity: '', rate: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    try {
      const mappedItems = form.items.map(it => ({
        material_id: it.material_id,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0
      }));
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
    let totalCgst = 0;
    let totalSgst = 0;
    
    po.items.forEach((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const cgstVal = amount * 0.025;
      const sgstVal = amount * 0.025;
      totalCgst += cgstVal;
      totalSgst += sgstVal;
      grandTotal += amount;
      
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.material_name}<br/><small>${item.material_code}</small></td>
          <td>-</td>
          <td>${qty.toFixed(2)}</td>
          <td>${item.uom_name || 'NOS'}</td>
          <td style="text-align:right">${rate.toFixed(2)}</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">2.50</td>
          <td style="text-align:right">2.50</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">${amount.toFixed(2)}</td>
        </tr>
      `;
    });
    
    const grandTotalWithTax = grandTotal + totalCgst + totalSgst;
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
                <b>M/S. ${po.vendor_name || 'VENDOR'}</b><br/>
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
              Total Amount in Word : <b>Rupees ${numberToWords(Math.round(grandTotalWithTax))} Only -/</b>
            </div>
            <div style="width: 40%">
              <table style="width:100%; border-collapse: collapse;">
                <tr><td style="text-align:right">Total Amount</td><td style="text-align:right; width: 100px;">: ${grandTotal.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Add: CGST @ 2.5%</td><td style="text-align:right">: ${totalCgst.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Add: SGST @ 2.5%</td><td style="text-align:right">: ${totalSgst.toFixed(2)}</td></tr>
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Purchase Orders</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{pos.length} orders</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ vendor_id: '', project_id: projects[0]?.id || '', delivery_date: dayjs().add(21, 'day'), terms: termsTemplates.find(t => t.is_default)?.content || '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '' }] });
          setDialog(true);
        }}>Create PO</Button>
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
                 <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Amount:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(po.total_amount)}</span></Typography>
                 <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(po.created_at)} • {po.items?.length || 0} items</Typography>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={po.po_type} size="small" variant="outlined" color={po.po_type === 'Formal' ? 'primary' : 'default'} sx={{ height: 22, fontSize: '0.7rem' }} />
                    <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                      <Tooltip title="Approve">
                        <span><IconButton size="small" color="success" disabled={!canApprove(po.status)}
                          onClick={() => showConfirm('Approve PO?', `Are you sure you want to approve ${po.po_number}?`, 'Yes, Approve', 'success', () => approvePO(po.id))}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={!canReject(po.status)}
                          onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Put on Hold">
                        <span><IconButton size="small" color="secondary" disabled={!canHold(po.status)}
                          onClick={() => showConfirm('Hold PO?', `Place ${po.po_number} on hold?`, 'Yes, Hold', 'warning', () => holdPO(po.id))}>
                          <Pause fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Send to Vendor">
                        <span><IconButton size="small" color="primary" disabled={!canSend(po.status)}
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
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(po.total_amount)}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>
                      <Chip label={po.po_type} size="small" variant="outlined" color={po.po_type === 'Formal' ? 'primary' : 'default'} sx={{ fontSize: '0.6rem', height: 18 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.delivery_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }} /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Approve">
                          <span><IconButton size="small" color="success" disabled={!canApprove(po.status)}
                            onClick={() => showConfirm('Approve PO?', `Are you sure you want to approve ${po.po_number}?`, 'Yes, Approve', 'success', () => approvePO(po.id))}>
                            <CheckCircle fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span><IconButton size="small" color="error" disabled={!canReject(po.status)}
                            onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                            <Cancel fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Put on Hold">
                          <span><IconButton size="small" color="secondary" disabled={!canHold(po.status)}
                            onClick={() => showConfirm('Hold PO?', `Place ${po.po_number} on hold?`, 'Yes, Hold', 'warning', () => holdPO(po.id))}>
                            <Pause fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Send to Vendor">
                          <span><IconButton size="small" color="primary" disabled={!canSend(po.status)}
                            onClick={() => showConfirm('Send to Vendor?', `Send ${po.po_number} to vendor?`, 'Yes, Send', 'primary', () => sendPO(po.id), false, po)}>
                            <Send fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Short Close">
                          <span><IconButton size="small" color="warning" disabled={!canShortClose(po.status)}
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
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>TOTAL AMOUNT</Typography>
                <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.2rem' }}>{formatCurrency(detailDialog?.total_amount)}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>Material Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <TableHead><TableRow>
                <TableCell>Material</TableCell><TableCell>Code</TableCell><TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Received</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {detailDialog?.items?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.material_name}</TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{item.material_code}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right"><Chip label={item.received_quantity} size="small" color={item.received_quantity >= item.quantity ? 'success' : 'warning'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
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
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
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
            {form.items.map((item, i) => (
              <Box key={i} sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr 1fr 110px 40px' },
                gap: 1.5,
                alignItems: 'center',
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Box>
                  <MaterialSelect
                    materials={materials}
                    value={item.material_id}
                    onChange={val => updateItem(i, 'material_id', val)}
                    size="small"
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Rate (₹)"
                  type="number"
                  value={item.rate}
                  onChange={e => updateItem(i, 'rate', e.target.value)}
                  inputProps={{ min: 0 }}
                />
                <Box sx={{ textAlign: 'right', pr: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>AMOUNT</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Box>
                  {form.items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <IconButton size="small" color="error" onClick={() => removeItem(i)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>Terms & Conditions</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Load Template</InputLabel>
            <Select
              label="Load Template"
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
