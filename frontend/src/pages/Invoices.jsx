import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  TableSortLabel
} from '@mui/material';
import { Add, Search, AttachFile, OpenInNew, ReceiptLong } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pos, setPos] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    invoice_number: '', invoice_date: '', gate_entry_id: '',
    vendor_id: '', po_id: '', total_amount: '', tax_amount: '',
    scan_url: '', remarks: ''
  });

  const load = () => {
    api.get('/api/invoices').then(r => setInvoices(r.data));
  };

  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/gate-entries').then(r => setGateEntries(r.data.filter(g => g.status !== 'Completed')));
    api.get('/api/procurement/po').then(r => setPos(r.data));
  }, []);

  const selectGateEntry = (geId) => {
    const ge = gateEntries.find(g => g.id === geId);
    if (ge) {
      setForm({
        ...form,
        gate_entry_id: geId,
        vendor_id: ge.vendor_id || '',
        po_id: ge.po_id || '',
        scan_url: ge.invoice_scan_url || form.scan_url
      });
    } else {
      setForm({ ...form, gate_entry_id: '' });
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, scan_url: res.data.url }));
    } catch (err) { alert('Upload failed: ' + (err.response?.data?.detail || err.message)); }
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!form.invoice_number.trim()) return alert("Invoice Number is required.");
    if (!form.invoice_date) return alert("Invoice Date is required.");
    if (!form.vendor_id) return alert("Vendor is required.");
    if (!form.scan_url) return alert("Invoice scan is required.");

    try {
      const payload = {
        invoice_number: form.invoice_number,
        invoice_date: form.invoice_date,
        gate_entry_id: form.gate_entry_id || null,
        vendor_id: form.vendor_id,
        po_id: form.po_id || null,
        total_amount: parseFloat(form.total_amount) || 0,
        tax_amount: parseFloat(form.tax_amount) || 0,
        scan_url: form.scan_url,
        remarks: form.remarks
      };

      await api.post('/api/invoices', payload);
      setDialog(false);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      alert(typeof detail === 'object' ? JSON.stringify(detail) : (detail || 'Error'));
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/invoices/${id}`, { status });
      load();
      if (detailDialog) setDetailDialog({ ...detailDialog, status });
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const statusColor = { 'Draft': 'default', 'Pending Approval': 'warning', 'Approved': 'success', 'Rejected': 'error' };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredInvoices = invoices.filter(i => 
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) || 
    i.vendor_name?.toLowerCase().includes(search.toLowerCase())
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
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ invoice_number: '', invoice_date: '', gate_entry_id: '', vendor_id: '', po_id: '', total_amount: '', tax_amount: '', scan_url: '', remarks: '' });
          setDialog(true);
        }}>Register Invoice</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search invoices..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell><TableSortLabel active={sortConfig.key === 'invoice_number'} direction={sortConfig.key === 'invoice_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_number')}>Invoice No.</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'invoice_date'} direction={sortConfig.key === 'invoice_date' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_date')}>Date</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'po_number'} direction={sortConfig.key === 'po_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('po_number')}>PO Ref</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'gate_entry_number'} direction={sortConfig.key === 'gate_entry_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('gate_entry_number')}>Gate Entry Ref</TableSortLabel></TableCell>
              <TableCell align="right"><TableSortLabel active={sortConfig.key === 'total_amount'} direction={sortConfig.key === 'total_amount' ? sortConfig.direction : 'asc'} onClick={() => handleSort('total_amount')}>Total Amount</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
            </TableRow></TableHead>
            <TableBody>
              {sortedInvoices.map(i => (
                <TableRow key={i.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(i)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{i.invoice_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(i.invoice_date)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{i.vendor_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{i.po_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{i.gate_entry_number || '-'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{i.total_amount?.toFixed(2)}</TableCell>
                  <TableCell><Chip label={i.status} size="small" color={statusColor[i.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                </TableRow>
              ))}
              {sortedInvoices.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748B' }}>No invoices found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Invoice: {detailDialog?.invoice_number}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Date</Typography><Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.invoice_date)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Total Amount</Typography><Typography sx={{ fontWeight: 600, color: '#059669' }}>₹{detailDialog?.total_amount?.toFixed(2)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Tax Amount</Typography><Typography>₹{detailDialog?.tax_amount?.toFixed(2)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">PO Ref</Typography><Typography>{detailDialog?.po_number || '-'}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Gate Entry</Typography><Typography>{detailDialog?.gate_entry_number || '-'}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Status</Typography><Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} /></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Registered By</Typography><Typography>{detailDialog?.created_by_name}</Typography></Grid>
            
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
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Box>
            {detailDialog?.status === 'Draft' && (
              <Button size="small" variant="contained" color="primary" onClick={() => handleStatusUpdate(detailDialog.id, 'Approved')}>Approve</Button>
            )}
          </Box>
          <Button onClick={() => setDetailDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ReceiptLong fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Register Invoice</Typography>
              <Typography variant="body2" color="text.secondary">Capture invoice details prior to GRN</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Link to Gate Entry (Optional)</InputLabel>
                <Select value={form.gate_entry_id} label="Link to Gate Entry (Optional)" onChange={e => selectGateEntry(e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {gateEntries.map(g => (
                    <MenuItem key={g.id} value={g.id}>{g.entry_number} — {g.vendor_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}><TextField fullWidth label="Invoice Number" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="Invoice Date" InputLabelProps={{ shrink: true }} value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} required /></Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Vendor</InputLabel>
                <Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                  {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>PO Reference (Optional)</InputLabel>
                <Select value={form.po_id} label="PO Reference (Optional)" onChange={e => setForm({ ...form, po_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {pos.map(p => <MenuItem key={p.id} value={p.id}>{p.po_number}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}><TextField fullWidth type="number" label="Total Amount" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Tax Amount" value={form.tax_amount} onChange={e => setForm({ ...form, tax_amount: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, border: '2px dashed #1E3A8A', borderRadius: 2, bgcolor: '#F0F4F8', textAlign: 'center' }}>
                {form.scan_url ? (
                  <Box>
                    <AttachFile sx={{ color: '#1E3A8A', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 1 }}>Invoice uploaded ✓</Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.scan_url), '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, scan_url: '' })}>Remove</Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ mb: 0.5, fontWeight: 600, color: '#1E3A8A', fontSize: '0.9rem' }}>
                      📎 Upload Invoice Scan *
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                      PDF, JPG, or PNG
                    </Typography>
                    <Button variant="contained" component="label" disabled={uploading} size="small"
                      sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#1e2a5a' }, textTransform: 'none' }}>
                      {uploading ? 'Uploading...' : 'Choose File'}
                      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0])} />
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, textTransform: 'none' }}>Register Invoice</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
