import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  TableSortLabel, Divider, IconButton, Tooltip, Tabs, Tab
} from '@mui/material';
import { Add, Search, AttachFile, OpenInNew, ReceiptLong, Edit, CheckCircle, Cancel, Print } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { numberToWords } from '../utils/numberUtils';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function Invoices() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { hasAction } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pos, setPos] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [uploading, setUploading] = useState(false);
  const [currentTab, setCurrentTab] = useState('Draft');



  const load = () => {
    api.get('/api/invoices').then(r => setInvoices(r.data));
  };

  const handlePrintInvoice = (invoice = null) => {
    const inv = invoice || detailDialog;
    if (!inv) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showMessage("Please allow popups to print invoices", 'Validation Error', 'warning');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${inv.invoice_number}</title>
          <style>
            body { font-family: 'Arial', sans-serif; color: #000; line-height: 1.4; padding: 20px; font-size: 12px; }
            .print-wrapper { max-width: 800px; margin: 0 auto; border: 1px solid #000; }
            @media print {
              body { padding: 0; }
              .print-wrapper { max-width: 100%; border: 1px solid #000; }
              .no-print { display: none !important; }
            }
            .header-title { text-align: center; font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding: 5px; }
            .top-grid { display: grid; grid-template-columns: 50% 50%; }
            .left-col { border-right: 1px solid #000; display: flex; flex-direction: column; }
            .right-col { display: flex; flex-direction: column; }
            .box { padding: 5px 10px; border-bottom: 1px solid #000; flex: 1; }
            .box:last-child { border-bottom: none; }
            .box-title { font-size: 10px; color: #555; margin-bottom: 2px; }
            .box-value { font-weight: bold; font-size: 12px; }
            .grid-2 { display: grid; grid-template-columns: 50% 50%; border-bottom: 1px solid #000; }
            .grid-2 > div { padding: 5px 10px; border-right: 1px solid #000; }
            .grid-2 > div:last-child { border-right: none; }
            table { width: 100%; border-collapse: collapse; border-top: 1px solid #000; border-bottom: 1px solid #000; }
            th { border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px; text-align: left; }
            th:last-child, td:last-child { border-right: none; }
            td { border-right: 1px solid #000; padding: 5px; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .bottom-section { display: flex; border-bottom: 1px solid #000; }
            .bottom-left { flex: 1; border-right: 1px solid #000; padding: 10px; }
            .bottom-right { width: 300px; padding: 10px; text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
            .amount-words { font-weight: bold; font-style: italic; margin-top: 10px; }
            .action-bar { text-align: right; margin-bottom: 20px; }
            .btn-print { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600; }
            .totals-table { width: 100%; border-collapse: collapse; }
            .totals-table td { border: none; padding: 2px 5px; }
            .totals-table td:last-child { text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="action-bar no-print">
            <button class="btn-print" onclick="window.print()">Print Document</button>
          </div>
          <div class="print-wrapper">
            <div class="header-title">TAX INVOICE</div>
            
            <div class="top-grid">
              <div class="left-col">
                <div class="box">
                  <div class="box-title">Vendor / Seller</div>
                  <div class="box-value">${inv.vendor_name || '-'}</div>
                </div>
                <div class="box">
                  <div class="box-title">Consignee (Ship to) / Buyer (Bill to)</div>
                  <div class="box-value">SmartCampus Construction LLP</div>
                  <div>Site No 92, Bangalore Urban</div>
                  <div>Karnataka, India</div>
                </div>
              </div>
              
              <div class="right-col">
                <div class="grid-2">
                  <div>
                    <div class="box-title">Invoice No.</div>
                    <div class="box-value">${inv.invoice_number || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Dated</div>
                    <div class="box-value">${formatDate(inv.invoice_date) || '-'}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div>
                    <div class="box-title">Delivery Note</div>
                    <div class="box-value">${inv.delivery_note || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Mode/Terms of Payment</div>
                    <div class="box-value">${inv.payment_terms || '-'}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div>
                    <div class="box-title">Buyer's Order No. (PO Ref)</div>
                    <div class="box-value">${inv.po_number || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Gate Entry</div>
                    <div class="box-value">${inv.gate_entry_number || '-'}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div>
                    <div class="box-title">Dispatch Doc No.</div>
                    <div class="box-value">${inv.dispatch_doc_number || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Dispatched through</div>
                    <div class="box-value">${inv.dispatched_through || '-'}</div>
                  </div>
                </div>
                <div class="grid-2" style="border-bottom: none;">
                  <div>
                    <div class="box-title">Destination</div>
                    <div class="box-value">${inv.destination || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Motor Vehicle No.</div>
                    <div class="box-value">${inv.vehicle_number || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Description of Goods</th>
                  <th>HSN/SAC</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">CGST%</th>
                  <th class="text-right">SGST%</th>
                  <th class="text-right">IGST%</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody style="min-height: 200px;">
                ${(inv.items || []).map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <strong>${item.material_code || '-'}</strong><br/>
                      <span>${item.material_name || item.description || ''}</span>
                    </td>
                    <td>${item.hsn_sac || '-'}</td>
                    <td class="text-right">${item.quantity} ${item.uom || ''}</td>
                    <td class="text-right">${Number(item.rate?.toFixed(2)) || '0.00'}</td>
                    <td class="text-right">${Number(item.cgst_rate?.toFixed(2)) || '0.00'}%</td>
                    <td class="text-right">${Number(item.sgst_rate?.toFixed(2)) || '0.00'}%</td>
                    <td class="text-right">${Number(item.igst_rate?.toFixed(2)) || '0.00'}%</td>
                    <td class="text-right">${Number(item.amount?.toFixed(2)) || '0.00'}</td>
                  </tr>
                `).join('')}
                ${(!inv.items || inv.items.length === 0) ? '<tr><td colspan="9" class="text-center">No line items found.</td></tr>' : ''}
              </tbody>
            </table>
            
            <div class="bottom-section">
              <div class="bottom-left">
                <div class="box-title">Amount Chargeable (in words)</div>
                <div class="amount-words">${numberToWords(inv.total_amount)}</div>
                
                <div style="margin-top: 30px;">
                  <div class="box-title">Company's Bank Details</div>
                  <div>A/c Holder's Name : SmartCampus</div>
                  <div>Bank Name : HDFC BANK</div>
                </div>
              </div>
              <div class="bottom-right">
                <table class="totals-table">
                  <tr><td>Total Taxable Value</td><td>₹${Number(inv.total_taxable_amount?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Total CGST</td><td>₹${Number(inv.total_cgst?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Total SGST</td><td>₹${Number(inv.total_sgst?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Total IGST</td><td>₹${Number(inv.total_igst?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Transport Charges</td><td>₹${Number(inv.transport_charges?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td style="font-size: 14px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px;">Grand Total</td><td style="font-size: 14px; border-top: 1px solid #000; padding-top: 5px;">₹${Number(inv.total_amount?.toFixed(2)) || '0.00'}</td></tr>
                </table>
                <div style="margin-top: 40px; font-weight: bold;">Authorised Signatory</div>
              </div>
            </div>
            
            <div style="text-align: center; font-size: 10px; padding: 5px;">
              SUBJECT TO BANGALORE JURISDICTION<br/>
              This is a Computer Generated Document
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/gate-entries').then(r => setGateEntries(r.data.filter(g => g.status !== 'Completed')));
    api.get('/api/procurement/po').then(r => setPos(r.data));
  }, []);


  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/invoices/${id}`, { status });
      load();
      if (detailDialog) setDetailDialog({ ...detailDialog, status });
    } catch (err) {
      showMessage("Failed to update status", 'Error', 'error');
    }
  };

  const statusColor = { 'Draft': 'default', 'Submitted': 'info', 'Approved': 'success', 'Change Required': 'error', 'Pending': 'warning', 'Sent for Payment': 'info', 'Paid': 'success' };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredInvoices = invoices.filter(i => 
    (currentTab === 'All' || i.status === currentTab) &&
    (i.invoice_number?.toLowerCase().includes(search.toLowerCase()) || 
    i.vendor_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (valA == null) valA = '';
    if (valB == null) valB = '';
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Invoices</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Register vendor invoices prior to GRN</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} disabled={!hasAction('invoice', 'can_register')} onClick={() => navigate('/invoices/register')}>Register Invoice</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search invoices..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300, mb: 2 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Draft (${invoices.filter(i => i.status === 'Draft').length})`} value="Draft" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Submitted (${invoices.filter(i => i.status === 'Submitted').length})`} value="Submitted" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Change Required (${invoices.filter(i => i.status === 'Change Required').length})`} value="Change Required" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Approved (${invoices.filter(i => i.status === 'Approved').length})`} value="Approved" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`All (${invoices.length})`} value="All" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto' }} />
        </Tabs>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell><TableSortLabel active={sortConfig.key === 'invoice_number'} direction={sortConfig.key === 'invoice_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_number')}>Invoice No.</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'invoice_date'} direction={sortConfig.key === 'invoice_date' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_date')}>Date</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'po_number'} direction={sortConfig.key === 'po_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('po_number')}>PO Ref</TableSortLabel></TableCell>
              <TableCell align="right"><TableSortLabel active={sortConfig.key === 'total_amount'} direction={sortConfig.key === 'total_amount' ? sortConfig.direction : 'asc'} onClick={() => handleSort('total_amount')}>Total Amount</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {sortedInvoices.map(i => (
                <TableRow key={i.id} sx={{ cursor: 'pointer' }} onClick={() => {
                  if (i.status === 'Draft') navigate(`/invoices/edit/${i.id}`);
                  else setDetailDialog(i);
                }}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{i.invoice_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(i.invoice_date)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{i.vendor_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{i.po_number || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{Number(i.total_amount?.toFixed(2))}</TableCell>
                  <TableCell><Chip label={i.status} size="small" color={statusColor[i.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <span>
                        <IconButton size="small" color={(i.status === 'Draft' || i.status === 'Change Required') ? "warning" : "default"} disabled={i.status !== 'Draft' && i.status !== 'Change Required'} onClick={(e) => { e.stopPropagation(); navigate(`/invoices/edit/${i.id}`); }}>
                          <Edit color="primary" fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    <Tooltip title="Approve">
                      <span>
                        <IconButton size="small" color={i.status === 'Submitted' ? "success" : "default"} disabled={i.status !== 'Submitted'} onClick={(e) => { e.stopPropagation(); setDetailDialog(i); }}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                  </TableCell>
                </TableRow>
              ))}
              {sortedInvoices.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: '#64748B' }}>No invoices found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Invoice: {detailDialog?.invoice_number}</span>
          <Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} />
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#F8FAFC' }}>
          <Grid container spacing={3}>
            {/* Left Column: General & Dispatch Details */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>General Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Invoice Date</Typography><Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.invoice_date)}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vendor_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Registered By</Typography><Typography>{detailDialog?.created_by_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">PO Ref</Typography><Typography>{detailDialog?.po_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Gate Entry</Typography><Typography>{detailDialog?.gate_entry_number || '-'}</Typography></Grid>
                </Grid>
              </Card>

              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Dispatch & Transport Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">e-Way Bill No.</Typography><Typography>{detailDialog?.eway_bill_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Vehicle No.</Typography><Typography>{detailDialog?.vehicle_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Delivery Note</Typography><Typography>{detailDialog?.delivery_note || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Delivery Note Date</Typography><Typography>{formatDate(detailDialog?.delivery_note_date)}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Dispatch Doc No.</Typography><Typography>{detailDialog?.dispatch_doc_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Dispatched Through</Typography><Typography>{detailDialog?.dispatched_through || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Destination</Typography><Typography>{detailDialog?.destination || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">LR-RR No.</Typography><Typography>{detailDialog?.lr_rr_number || '-'}</Typography></Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Right Column: References & Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Other References</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Reference No.</Typography><Typography>{detailDialog?.reference_number || '-'}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Reference Date</Typography><Typography>{formatDate(detailDialog?.reference_date)}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Mode/Terms of Payment</Typography><Typography>{detailDialog?.payment_terms || '-'}</Typography></Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Remarks</Typography>
                    <Typography>{detailDialog?.remarks || '-'}</Typography>
                  </Grid>
                  {detailDialog?.scan_url && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Invoice Scan</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                          onClick={() => window.open(getFileUrl(detailDialog.scan_url), '_blank')}>View Invoice Scan</Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Card>

            </Grid>
          </Grid>

          {/* Line Items */}
          <Card sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Line Items</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>HSN</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Rate</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Disc%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>CGST%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>SGST%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>IGST%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailDialog?.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.material_code}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>{item.material_name}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{item.hsn_sac || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.quantity} {item.uom}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{Number(item.rate?.toFixed(2))}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.discount_percent?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.cgst_rate?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.sgst_rate?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.igst_rate?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{Number(item.amount?.toFixed(2))}</TableCell>
                    </TableRow>
                  ))}
                  {(!detailDialog?.items || detailDialog?.items.length === 0) && (
                    <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3, color: '#64748B' }}>No line items found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Summary */}
          <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }} elevation={0}>
            <Grid container justifyContent="flex-end">
              <Grid item xs={12} sm={8} md={5}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Summary</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{Number(detailDialog?.total_taxable_amount?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total CGST</Typography><Typography>₹{Number(detailDialog?.total_cgst?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total SGST</Typography><Typography>₹{Number(detailDialog?.total_sgst?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total IGST</Typography><Typography>₹{Number(detailDialog?.total_igst?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Transport Charges</Typography><Typography>₹{Number(detailDialog?.transport_charges?.toFixed(2)) || '0.00'}</Typography></Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="h6" sx={{ fontWeight: 600 }}>Gross Total</Typography><Typography variant="h6" sx={{ fontWeight: 600 }}>₹{Number(detailDialog?.total_amount?.toFixed(2))}</Typography></Box>
                {detailDialog?.credit_note_amount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>Less: Credit Notes</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>-₹{Number(detailDialog?.credit_note_amount?.toFixed(2))}</Typography>
                  </Box>
                )}
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h5" sx={{ fontWeight: 800 }}>Net Payable</Typography><Typography variant="h5" sx={{ fontWeight: 800, color: '#059669' }}>₹{Number(detailDialog?.net_payable?.toFixed(2))}</Typography></Box>
              </Grid>
            </Grid>
          </Card>
          
          {/* Linked Credit Notes */}
          {detailDialog?.linked_credit_notes?.length > 0 && (
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#0F172A' }}>Linked Credit Notes</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Credit Note No.</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailDialog.linked_credit_notes.map((cn) => (
                      <TableRow key={cn.id}>
                        <TableCell sx={{ fontWeight: 500, color: '#2563EB' }}>{cn.credit_note_number}</TableCell>
                        <TableCell>{formatDate(cn.date)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{Number(cn.total_amount?.toFixed(2))}</TableCell>
                        <TableCell align="right"><Chip label={cn.status} size="small" color={statusColor[cn.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialog(null)}>Close</Button>
            {hasAction('invoice', 'can_print') && (
              <Button variant="outlined" startIcon={<Print />} onClick={() => handlePrintInvoice()}>Print</Button>
            )}
            {detailDialog?.status === 'Submitted' && (
              <>
                <Button variant="contained" color="error" startIcon={<ReceiptLong />} onClick={() => { handleStatusUpdate(detailDialog.id, 'Change Required'); setDetailDialog(null); }}>Change Required</Button>
                <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => { handleStatusUpdate(detailDialog.id, 'Approved'); setDetailDialog(null); }}>Approve Invoice</Button>
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
