import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  TableSortLabel, Divider, IconButton, Tooltip, Tabs, Tab
} from '@mui/material';
import { Add, Search, AttachFile, OpenInNew, ReceiptLong, Edit, CheckCircle, Cancel } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function Invoices() {
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
      alert("Failed to update status");
    }
  };

  const statusColor = { 'Draft': 'default', 'Submitted': 'warning', 'Verified': 'success', 'Change Required': 'error' };

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
          <Tab label={`Verified (${invoices.filter(i => i.status === 'Verified').length})`} value="Verified" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
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
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{i.total_amount?.toFixed(2)}</TableCell>
                  <TableCell><Chip label={i.status} size="small" color={statusColor[i.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <span>
                        <IconButton size="small" color={(i.status === 'Draft' || i.status === 'Change Required') ? "warning" : "default"} disabled={i.status !== 'Draft' && i.status !== 'Change Required'} onClick={(e) => { e.stopPropagation(); navigate(`/invoices/edit/${i.id}`); }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    
                    <Tooltip title="Verify">
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
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{item.rate?.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.discount_percent?.toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.cgst_rate?.toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.sgst_rate?.toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.igst_rate?.toFixed(2)}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{item.amount?.toFixed(2)}</TableCell>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{detailDialog?.total_taxable_amount?.toFixed(2)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total CGST</Typography><Typography>₹{detailDialog?.total_cgst?.toFixed(2)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total SGST</Typography><Typography>₹{detailDialog?.total_sgst?.toFixed(2)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total IGST</Typography><Typography>₹{detailDialog?.total_igst?.toFixed(2)}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Transport Charges</Typography><Typography>₹{detailDialog?.transport_charges?.toFixed(2) || '0.00'}</Typography></Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>₹{detailDialog?.total_amount?.toFixed(2)}</Typography></Box>
              </Grid>
            </Grid>
          </Card>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDetailDialog(null)}>Close</Button>
            {detailDialog?.status === 'Submitted' && (
              <>
                <Button variant="contained" color="error" startIcon={<ReceiptLong />} onClick={() => { handleStatusUpdate(detailDialog.id, 'Change Required'); setDetailDialog(null); }}>Change Required</Button>
                <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => { handleStatusUpdate(detailDialog.id, 'Verified'); setDetailDialog(null); }}>Verify Invoice</Button>
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
