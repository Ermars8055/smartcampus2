import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  InputLabel, Divider, TableSortLabel, useTheme, useMediaQuery,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, FormHelperText, IconButton, Autocomplete, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import { Add, Search, AssignmentTurnedIn, AttachFile, OpenInNew, Delete } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function GRNPage() {
  const { hasAction } = useAuth();
  const [grns, setGrns] = useState([]);
  const [pos, setPos] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const initialForm = {
    po_id: '', gate_entry_id: '', warehouse_id: '', project_id: '', vendor_id: '', new_vendor_name: '',
    invoice_number: '', invoice_date: '', invoice_amount: 0, invoice_scan_url: '', 
    items: [{ material_id: '', ordered_quantity: 0, received_quantity: 0, accepted_quantity: 0, rejected_quantity: 0, rate: 0 }],
    receipt_type: 'Direct Invoice'
  };

  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const resetForm = () => setForm(initialForm);

  const load = () => { api.get('/api/grn', { params: { search: search || undefined } }).then(r => setGrns(r.data)); };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    load();
    api.get('/api/procurement/po').then(r => setPos(r.data));
    api.get('/api/gate-entries').then(r => setGateEntries(r.data));
    api.get('/api/warehouses').then(r => setWarehouses(r.data));
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || []));
  }, []);

  // Filter gate entries that are pending GRN (not yet completed)
  const pendingGateEntries = gateEntries.filter(ge =>
    ge.status === 'Awaiting GRN'
  );

  // When a gate entry is selected, auto-populate invoice details
  const selectGateEntry = (geId) => {
    const ge = gateEntries.find(g => g.id === geId);
    if (ge) {
      setForm(prev => ({
        ...prev, 
        gate_entry_id: geId, 
        invoice_scan_url: ge.invoice_scan_url || '',
        invoice_number: ge.invoice_number || '',
        invoice_date: ge.invoice_date || '',
        invoice_amount: ge.invoice_amount || prev.invoice_amount || 0
      }));
    } else {
      setForm(prev => ({ ...prev, gate_entry_id: '', invoice_scan_url: '', invoice_number: '', invoice_date: '', invoice_amount: prev.invoice_amount || 0 }));
    }
  };

  const selectPO = (poId) => {
    if (!poId) {
      setForm(prev => ({ ...prev, po_id: '', receipt_type: 'Direct Invoice', items: [], invoice_amount: 0, vendor_id: '', project_id: '' }));
      return;
    }
    const po = pos.find(p => p.id === poId);
    if (po) {
      const items = po.items?.map(it => ({
        material_id: it.material_id, po_item_id: it.id,
        ordered_quantity: it.quantity,
        received_quantity: it.quantity - (it.received_quantity || 0),
        accepted_quantity: it.quantity - (it.received_quantity || 0),
        rejected_quantity: 0,
        rate: it.rate, material_name: it.material_name, material_code: it.material_code, uom_name: it.uom_name
      })) || [];
      setForm({
        ...form, po_id: poId, vendor_id: po.vendor_id, project_id: po.project_id, receipt_type: 'PO-Based',
        items
      });
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, invoice_scan_url: res.data.url }));
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
    setUploading(false);
  };

  const handleCreate = async () => {
    try {
      let finalVendorId = form.vendor_id;
      
      // Auto-create vendor if typed in Direct Invoice
      if (form.receipt_type === 'Direct Invoice' && !finalVendorId && form.new_vendor_name) {
        const vendorRes = await api.post('/api/vendors', { name: form.new_vendor_name });
        finalVendorId = vendorRes.data.id;
      }

      const payload = {
        ...form,
        vendor_id: finalVendorId || null,
        po_id: form.po_id || null,
        gate_entry_id: form.gate_entry_id || null,
        project_id: form.project_id || (projects.length > 0 ? projects[0].id : null),
        invoice_date: form.invoice_date || null,
        invoice_amount: Number(parseFloat(form.invoice_amount).toFixed(2)) || 0
      };
      await api.post('/api/grn', payload);
      setDialog(false);
      resetForm();
      load();
      // Refresh gate entries, POs, and vendors
      api.get('/api/gate-entries').then(r => setGateEntries(r.data));
      api.get('/api/procurement/po').then(r => setPos(r.data));
      api.get('/api/vendors').then(r => setVendors(r.data));
    } catch (err) {
      const msg = err.response?.data?.detail;
      alert(typeof msg === 'object' ? JSON.stringify(msg) : (msg || 'Error'));
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedGrns = [...grns].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    if (sortConfig.key === 'items') {
      valA = a.items?.length || 0;
      valB = b.items?.length || 0;
    }

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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Goods Receipt Notes</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Verify and accept received materials</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} disabled={!hasAction('grn', 'can_create_grn')} onClick={() => {
          setForm({ ...initialForm, warehouse_id: warehouses[0]?.id || '' });
          setDialog(true);
        }}>Create GRN</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search GRN number..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Card>
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {sortedGrns.length === 0 && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No GRNs found.
              </Typography>
            )}
            {sortedGrns.map(g => (
              <Card key={g.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => setDetailDialog(g)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>{g.grn_number}</Typography>
                  <Chip label={g.status} size="small" color={g.status === 'Completed' ? 'success' : 'warning'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Vendor:</strong> {g.vendor_name}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>PO Ref:</strong> {g.po_number}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Store:</strong> {g.warehouse_name}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(g.created_at)} • {g.items?.length || 0} items</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669' }}>
                    ₹{g.invoice_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Invoice: {g.invoice_number || '-'}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell><TableSortLabel active={sortConfig.key === 'grn_number'} direction={sortConfig.key === 'grn_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('grn_number')}>GRN No.</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'po_number'} direction={sortConfig.key === 'po_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('po_number')}>PO Ref</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'warehouse_name'} direction={sortConfig.key === 'warehouse_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('warehouse_name')}>Store</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'invoice_number'} direction={sortConfig.key === 'invoice_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_number')}>Invoice</TableSortLabel></TableCell>
                <TableCell align="right"><TableSortLabel active={sortConfig.key === 'invoice_amount'} direction={sortConfig.key === 'invoice_amount' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_amount')}>Amount (₹)</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'items'} direction={sortConfig.key === 'items' ? sortConfig.direction : 'asc'} onClick={() => handleSort('items')}>Items</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'created_at'} direction={sortConfig.key === 'created_at' ? sortConfig.direction : 'asc'} onClick={() => handleSort('created_at')}>Date</TableSortLabel></TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedGrns.map(g => (
                  <TableRow key={g.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(g)}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{g.grn_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{g.po_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{g.vendor_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{g.warehouse_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{g.invoice_number}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{g.invoice_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{g.items?.length}</TableCell>
                    <TableCell><Chip label={g.status} size="small" color={g.status === 'Completed' ? 'success' : 'warning'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(g.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* GRN Detail */}
      <Dialog open={!!detailDialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDetailDialog(null); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.grn_number} — GRN Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Store</Typography><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailDialog?.warehouse_name}</Typography></Grid>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Invoice</Typography><Typography sx={{ fontSize: '0.9rem' }}>{detailDialog?.invoice_number}</Typography></Grid>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Received By</Typography><Typography sx={{ fontSize: '0.9rem' }}>{detailDialog?.received_by_name}</Typography></Grid>
            {detailDialog?.invoice_scan_url && (
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Invoice Scan</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => window.open(getFileUrl(detailDialog.invoice_scan_url), '_blank')}>View Invoice Scan</Button>
                </Box>
              </Grid>
            )}
          </Grid>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Material</TableCell><TableCell align="right">Ordered</TableCell>
              <TableCell align="right">Received</TableCell><TableCell align="right">Accepted</TableCell>
              <TableCell align="right">Rejected</TableCell><TableCell align="right">Rate</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {detailDialog?.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.material_name}</TableCell>
                  <TableCell align="right">{Math.round(item.ordered_quantity)}</TableCell>
                  <TableCell align="right">{Math.round(item.received_quantity)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#059669' }}>{Math.round(item.accepted_quantity)}</TableCell>
                  <TableCell align="right" sx={{ color: item.rejected_quantity > 0 ? '#DC2626' : '#94A3B8' }}>{Math.round(item.rejected_quantity)}</TableCell>
                  <TableCell align="right">₹{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create GRN */}
      <Dialog open={dialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setDialog(false); resetForm(); } }} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <AssignmentTurnedIn fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Goods Receipt Note</Typography>
              <Typography variant="body2" color="text.secondary">Verify and accept received materials into the store.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={1} sx={{ mt: 0, mb: 1 }}>
            {/* Mode Toggle */}
            <Grid item xs={12} sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={form.receipt_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      receipt_type: newType,
                      po_id: newType === 'Direct Invoice' ? '' : prev.po_id,
                      items: newType === 'Direct Invoice' 
                        ? [{ material_id: '', ordered_quantity: 0, received_quantity: 0, accepted_quantity: 0, rejected_quantity: 0, rate: 0 }] 
                        : (prev.po_id ? prev.items : [])
                    }));
                  }}
                >
                  <FormControlLabel value="PO-Based" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Purchase Order</Typography>} sx={{ mr: 4 }} />
                  <FormControlLabel value="Direct Invoice" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Direct Invoice</Typography>} />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grid container spacing={1}>
                {/* Line 1 */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    size="small"
                    options={pendingGateEntries}
                    getOptionLabel={(option) => option.entry_number || ''}
                    value={pendingGateEntries.find(ge => ge.id === form.gate_entry_id) || null}
                    onChange={(e, newValue) => selectGateEntry(newValue ? newValue.id : '')}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="Gate Entry (Pending)" placeholder="Search GE No." />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Invoice Number" value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></Grid>

                {/* Line 2 */}
                <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Invoice Date" type="date" value={form.invoice_date || ''} onChange={e => setForm({ ...form, invoice_date: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ max: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] }} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Invoice Amount (₹)" type="number" inputProps={{ step: "0.01" }} value={form.invoice_amount} onChange={e => setForm({ ...form, invoice_amount: parseFloat(e.target.value) || 0 })} /></Grid>

                {/* Line 3 */}
                {form.receipt_type === 'PO-Based' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required size="small"><InputLabel>Purchase Order</InputLabel>
                        <Select value={form.po_id} size="small" label="Purchase Order" onChange={e => selectPO(e.target.value)}>
                          <MenuItem value="">None</MenuItem>
                          {pos.filter(p => p.status !== 'Closed' && p.status !== 'Draft').map(p => <MenuItem key={p.id} value={p.id}>{p.po_number} - {p.vendor_name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="PO Amount (₹)" value={pos.find(p => p.id === form.po_id)?.total_amount?.toFixed(2) || '0.00'} InputProps={{ readOnly: true, sx: { bgcolor: '#f8fafc', color: '#64748b' } }} />
                    </Grid>
                  </>
                )}
                {form.receipt_type === 'Direct Invoice' && (
                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      size="small"
                      freeSolo
                      options={vendors.map(v => v.name)}
                      value={form.vendor_id ? vendors.find(v => v.id === form.vendor_id)?.name || '' : form.new_vendor_name || ''}
                      onChange={(e, newValue) => {
                        const existing = vendors.find(v => v.name === newValue);
                        if (existing) {
                          setForm({ ...form, vendor_id: existing.id, new_vendor_name: '' });
                        } else {
                          setForm({ ...form, vendor_id: '', new_vendor_name: newValue || '' });
                        }
                      }}
                      onInputChange={(e, newInputValue) => {
                        const existing = vendors.find(v => v.name === newInputValue);
                        if (existing) {
                          setForm({ ...form, vendor_id: existing.id, new_vendor_name: '' });
                        } else {
                          setForm({ ...form, vendor_id: '', new_vendor_name: newInputValue || '' });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} size="small" label="Vendor" required placeholder="Search or type new" />
                      )}
                    />
                  </Grid>
                )}

                {/* Line 4 */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required size="small"><InputLabel>To Store</InputLabel>
                    <Select value={form.warehouse_id} size="small" label="To Store" onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                      {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Invoice Upload Section */}
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{
                p: 1.5,
                border: '2px dashed #1E3A8A',
                borderRadius: 2,
                bgcolor: '#F0F4F8',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1,
                minHeight: 100
              }}>
                {form.invoice_scan_url ? (
                  <Box>
                    <AttachFile sx={{ color: '#1E3A8A', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 1 }}>Invoice attached ✓</Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.invoice_scan_url), '_blank')}>View Invoice</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, invoice_scan_url: '' })}>Update</Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ mb: 0.5, fontWeight: 600, color: '#1E3A8A', fontSize: '0.9rem' }}>
                      📎 Upload / Update Invoice
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                      PDF, JPG, or PNG
                    </Typography>
                    <Button variant="contained" component="label" disabled={uploading} size="small"
                      color="primary"
                      sx={{ bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#1e2a5a' }, textTransform: 'none' }}>
                      {uploading ? 'Uploading...' : 'Choose File'}
                      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={e => handleUpload(e.target.files[0])} />
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>

          {form.gate_entry_id && (
            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1, border: '1px solid #bbf7d0', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#166534' }}>
                ✓ Gate Entry linked — GRN will automatically update gate entry status to "Completed"
              </Typography>
            </Box>
          )}

          {(form.items.length > 0 || form.receipt_type === 'Direct Invoice') && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{form.receipt_type === 'Direct Invoice' ? 'Items' : 'Items from PO'}</Typography>
                {form.receipt_type === 'Direct Invoice' && (
                  <Button size="small" startIcon={<Add />} onClick={() => setForm({...form, items: [...form.items, { material_id: '', ordered_quantity: 0, received_quantity: 0, accepted_quantity: 0, rejected_quantity: 0, rate: 0 }]})}>Add Item</Button>
                )}
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>UOM</TableCell>
                  {form.receipt_type === 'PO-Based' && <TableCell align="right">Ordered</TableCell>}
                  <TableCell align="right">Received</TableCell><TableCell align="right">Accepted</TableCell>
                  <TableCell align="right">Rejected</TableCell><TableCell align="right">Rate</TableCell>
                  {form.receipt_type === 'Direct Invoice' && <TableCell width={40}></TableCell>}
                </TableRow></TableHead>
                <TableBody>
                  {form.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ minWidth: 250 }}>
                        {form.receipt_type === 'Direct Invoice' ? (
                          <Autocomplete
                            size="small"
                            options={materials}
                            getOptionLabel={(option) => `${option.code ? option.code + ' - ' : ''}${option.name || ''}`}
                            value={materials.find(m => m.id === item.material_id) || null}
                            onChange={(e, newValue) => {
                              const items = [...form.items];
                              items[i].material_id = newValue ? newValue.id : '';
                              setForm({ ...form, items });
                            }}
                            renderInput={(params) => (
                              <TextField {...params} variant="outlined" size="small" placeholder="-- Select Material --" />
                            )}
                            componentsProps={{ paper: { sx: { fontSize: '0.85rem' } } }}
                          />
                        ) : (
                          <>
                            <Typography variant="body2">{item.material_name || materials.find(m => m.id === item.material_id)?.name}</Typography>
                            {(item.material_code || materials.find(m => m.id === item.material_id)?.code) && (
                              <Typography variant="caption" color="textSecondary">{item.material_code || materials.find(m => m.id === item.material_id)?.code}</Typography>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {item.uom_name || materials.find(m => m.id === item.material_id)?.uom_name || '-'}
                      </TableCell>
                      {form.receipt_type === 'PO-Based' && <TableCell align="right">{item.ordered_quantity}</TableCell>}
                      <TableCell align="right">
                        <TextField size="small" type="number" inputProps={{ step: "1" }} value={item.received_quantity ?? ''} sx={{ width: 80 }}
                          onChange={e => {
                            const items = [...form.items];
                            items[i].received_quantity = Math.round(parseFloat(e.target.value) || 0);
                            setForm({ ...form, items });
                          }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" inputProps={{ step: "1" }} value={item.accepted_quantity ?? ''} sx={{ width: 80 }}
                          onChange={e => {
                            const items = [...form.items];
                            items[i].accepted_quantity = Math.round(parseFloat(e.target.value) || 0);
                            setForm({ ...form, items });
                          }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" inputProps={{ step: "1" }} value={item.rejected_quantity ?? ''} sx={{ width: 80 }}
                          onChange={e => {
                            const items = [...form.items];
                            items[i].rejected_quantity = Math.round(parseFloat(e.target.value) || 0);
                            setForm({ ...form, items });
                          }} />
                      </TableCell>
                      <TableCell align="right">
                        {form.receipt_type === 'Direct Invoice' ? (
                          <TextField size="small" type="number" inputProps={{ step: "0.01" }} value={item.rate ?? ''} sx={{ width: 80 }}
                            onChange={e => {
                              const items = [...form.items];
                              items[i].rate = parseFloat(e.target.value) || 0;
                              setForm({ ...form, items });
                            }} />
                        ) : (
                          `₹${item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        )}
                      </TableCell>
                      {form.receipt_type === 'Direct Invoice' && (
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => {
                            const items = form.items.filter((_, idx) => idx !== i);
                            setForm({ ...form, items });
                          }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" disabled={!hasAction('grn', 'can_complete')} onClick={handleCreate} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}>Complete GRN</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
