import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, TableSortLabel, Divider, IconButton, Tooltip, Tabs, Tab
} from '@mui/material';
import { Add, Search, OpenInNew, ReceiptLong, Edit, CheckCircle, Print } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { numberToWords } from '../utils/numberUtils';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function CreditNotes() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { hasAction, hasPermission } = useAuth();
  const [creditNotes, setCreditNotes] = useState([]);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [currentTab, setCurrentTab] = useState('Draft');

  const load = () => {
    api.get('/api/credit-notes').then(r => setCreditNotes(r.data));
  };

  const handlePrintCreditNote = (cn = null) => {
    const doc = cn || detailDialog;
    if (!doc) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showMessage("Please allow popups to print credit notes", 'Validation Error', 'warning');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit Note - ${doc.credit_note_number}</title>
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
            <div class="header-title">CREDIT NOTE</div>
            
            <div class="top-grid">
              <div class="left-col">
                <div class="box">
                  <div class="box-title">Vendor / Seller</div>
                  <div class="box-value">${doc.vendor_name || '-'}</div>
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
                    <div class="box-title">Credit Note No.</div>
                    <div class="box-value">${doc.credit_note_number || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Dated</div>
                    <div class="box-value">${formatDate(doc.date) || '-'}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div>
                    <div class="box-title">Original Invoice No.</div>
                    <div class="box-value">${doc.invoice_number || doc.original_invoice_number || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Original Invoice Date</div>
                    <div class="box-value">${formatDate(doc.original_invoice_date) || '-'}</div>
                  </div>
                </div>
                <div class="grid-2">
                  <div>
                    <div class="box-title">Dispatch Doc No.</div>
                    <div class="box-value">${doc.dispatch_doc_number || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Dispatched through</div>
                    <div class="box-value">${doc.dispatched_through || '-'}</div>
                  </div>
                </div>
                <div class="grid-2" style="border-bottom: none;">
                  <div>
                    <div class="box-title">Destination</div>
                    <div class="box-value">${doc.destination || '-'}</div>
                  </div>
                  <div>
                    <div class="box-title">Reference No.</div>
                    <div class="box-value">${doc.reference_number || '-'}</div>
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
                ${(doc.items || []).map((item, idx) => `
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
                ${(!doc.items || doc.items.length === 0) ? '<tr><td colspan="9" class="text-center">No line items found.</td></tr>' : ''}
              </tbody>
            </table>
            
            <div class="bottom-section">
              <div class="bottom-left">
                <div class="box-title">Amount Chargeable (in words)</div>
                <div class="amount-words">${numberToWords(doc.total_amount)}</div>
                
                <div style="margin-top: 30px;">
                  <div class="box-title">Company's Bank Details</div>
                  <div>A/c Holder's Name : SmartCampus</div>
                  <div>Bank Name : HDFC BANK</div>
                </div>
              </div>
              <div class="bottom-right">
                <table class="totals-table">
                  <tr><td>Total Taxable Value</td><td>₹${Number(doc.total_taxable_amount?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Total CGST</td><td>₹${Number(doc.total_cgst?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Total SGST</td><td>₹${Number(doc.total_sgst?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td>Total IGST</td><td>₹${Number(doc.total_igst?.toFixed(2)) || '0.00'}</td></tr>
                  <tr><td style="font-size: 14px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px;">Grand Total</td><td style="font-size: 14px; border-top: 1px solid #000; padding-top: 5px;">₹${Number(doc.total_amount?.toFixed(2)) || '0.00'}</td></tr>
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
  }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        const res = await api.post(`/api/credit-notes/${id}/approve`, { remarks: "Approved" });
        showMessage(`Credit Note ${res.data.cn_number} approved successfully`, "Success", "success");
        if (detailDialog) setDetailDialog({ ...detailDialog, status: res.data.status });
      } else if (action === 'reject') {
        const res = await api.post(`/api/credit-notes/${id}/reject`, { remarks: "Rejected" });
        showMessage(`Credit Note ${res.data.cn_number} has been rejected`, "Rejected", "info");
        if (detailDialog) setDetailDialog({ ...detailDialog, status: "Rejected" });
      }
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || "Action failed", 'Error', 'error');
    }
  };

  const statusColor = { 'Draft': 'default', 'Submitted': 'info', 'Approved': 'success', 'Rejected': 'error' };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filtered = creditNotes.filter(i => 
    (currentTab === 'All' || i.status === currentTab) &&
    (i.credit_note_number?.toLowerCase().includes(search.toLowerCase()) || 
    i.vendor_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortConfig.key] || '';
    let valB = b[sortConfig.key] || '';
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Credit Notes</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Manage Vendor Credit Notes</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} disabled={!hasPermission('credit_note', 'can_create')} onClick={() => navigate('/credit-notes/new')}>Create Credit Note</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search credit notes..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300, mb: 2 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Draft (${creditNotes.filter(i => i.status === 'Draft').length})`} value="Draft" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Submitted (${creditNotes.filter(i => i.status === 'Submitted').length})`} value="Submitted" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Approved (${creditNotes.filter(i => i.status === 'Approved').length})`} value="Approved" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`All (${creditNotes.length})`} value="All" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto' }} />
        </Tabs>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell><TableSortLabel active={sortConfig.key === 'credit_note_number'} direction={sortConfig.key === 'credit_note_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('credit_note_number')}>CN No.</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'date'} direction={sortConfig.key === 'date' ? sortConfig.direction : 'asc'} onClick={() => handleSort('date')}>Date</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'invoice_number'} direction={sortConfig.key === 'invoice_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_number')}>Original Invoice</TableSortLabel></TableCell>
              <TableCell align="right"><TableSortLabel active={sortConfig.key === 'total_amount'} direction={sortConfig.key === 'total_amount' ? sortConfig.direction : 'asc'} onClick={() => handleSort('total_amount')}>Total Amount</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {sorted.map(i => (
                <TableRow key={i.id} sx={{ cursor: 'pointer' }} onClick={() => {
                  if (i.status === 'Draft') navigate(`/credit-notes/edit/${i.id}`);
                  else setDetailDialog(i);
                }}>
                  <TableCell sx={{ fontWeight: 600, color: '#059669', fontSize: '0.8rem' }}>{i.credit_note_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(i.date)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{i.vendor_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{i.invoice_number || i.original_invoice_number || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{Number(i.total_amount?.toFixed(2))}</TableCell>
                  <TableCell><Chip label={i.status} size="small" color={statusColor[i.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <span>
                        <IconButton size="small" color={i.status === 'Draft' ? "warning" : "default"} disabled={i.status !== 'Draft'} onClick={(e) => { e.stopPropagation(); navigate(`/credit-notes/edit/${i.id}`); }}>
                          <Edit color="primary" fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    <Tooltip title="Approve">
                      <span>
                        <IconButton size="small" color={i.can_user_approve ? "success" : "default"} disabled={!i.can_user_approve} onClick={(e) => { e.stopPropagation(); setDetailDialog(i); }}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748B' }}>No credit notes found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Credit Note Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Credit Note: {detailDialog?.credit_note_number}</span>
          <Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} />
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#F8FAFC' }}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>General Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Date</Typography><Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.date)}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vendor_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Registered By</Typography><Typography>{detailDialog?.created_by_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Original Invoice</Typography><Typography>{detailDialog?.invoice_number || detailDialog?.original_invoice_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Original Invoice Date</Typography><Typography>{formatDate(detailDialog?.original_invoice_date) || '-'}</Typography></Grid>
                </Grid>
              </Card>

              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Dispatch & Transport Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Dispatch Doc No.</Typography><Typography>{detailDialog?.dispatch_doc_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Dispatched Through</Typography><Typography>{detailDialog?.dispatched_through || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Destination</Typography><Typography>{detailDialog?.destination || '-'}</Typography></Grid>
                </Grid>
              </Card>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>References</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Reference No.</Typography><Typography>{detailDialog?.reference_number || '-'}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Reference Date</Typography><Typography>{formatDate(detailDialog?.reference_date)}</Typography></Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Remarks</Typography>
                    <Typography>{detailDialog?.remarks || '-'}</Typography>
                  </Grid>
                  {detailDialog?.scan_url && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Scan</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                          onClick={() => window.open(getFileUrl(detailDialog.scan_url), '_blank')}>View Scan</Button>
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
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.material_code || '-'}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>{item.material_name || item.description}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{item.hsn_sac || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.quantity} {item.uom}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{Number(item.rate?.toFixed(2))}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.cgst_rate?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.sgst_rate?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{Number(item.igst_rate?.toFixed(2))}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{Number(item.amount?.toFixed(2))}</TableCell>
                    </TableRow>
                  ))}
                  {(!detailDialog?.items || detailDialog?.items.length === 0) && (
                    <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: '#64748B' }}>No line items found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Summary */}
          <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }} elevation={0}>
            <Grid container justifyContent="flex-end">
              <Grid item xs={12} sm={8} md={5}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Summary</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{Number(detailDialog?.total_taxable_amount?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total CGST</Typography><Typography>₹{Number(detailDialog?.total_cgst?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total SGST</Typography><Typography>₹{Number(detailDialog?.total_sgst?.toFixed(2))}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total IGST</Typography><Typography>₹{Number(detailDialog?.total_igst?.toFixed(2))}</Typography></Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>₹{Number(detailDialog?.total_amount?.toFixed(2))}</Typography></Box>
              </Grid>
            </Grid>
          </Card>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialog(null)}>Close</Button>
            {hasAction('credit_note', 'can_print') && (
              <Button variant="outlined" startIcon={<Print />} onClick={() => handlePrintCreditNote()}>Print</Button>
            )}
            {detailDialog?.can_user_approve && (
              <>
                <Button variant="contained" color="error" onClick={() => { handleAction(detailDialog.id, 'reject'); }}>Reject</Button>
                <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => { handleAction(detailDialog.id, 'approve'); }}>Approve</Button>
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
