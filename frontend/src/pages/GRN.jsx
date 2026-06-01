import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  InputLabel, Divider, TableSortLabel, useTheme, useMediaQuery,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl
} from '@mui/material';
import { Add, Search, AssignmentTurnedIn } from '@mui/icons-material';
import api from '../services/api';
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
    po_id: '', gate_entry_id: '', warehouse_id: '', project_id: '', vendor_id: '',
    invoice_number: '', invoice_date: '', invoice_amount: 0, items: [],
    receipt_type: 'PO-Based'
  };

  const [form, setForm] = useState(initialForm);

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
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
  }, []);

  // Filter gate entries that are pending GRN (not yet completed)
  const pendingGateEntries = gateEntries.filter(ge =>
    ge.status === 'Gate Entry Created' || ge.status === 'Awaiting GRN'
  );

  // When a gate entry is selected, auto-populate PO and items from the linked PO
  const selectGateEntry = (geId) => {
    const ge = gateEntries.find(g => g.id === geId);
    if (ge) {
      const newForm = { ...form, gate_entry_id: geId, po_id: ge.po_id, vendor_id: ge.vendor_id, project_id: ge.project_id, receipt_type: 'PO-Based' };
      const items = ge.po_id ? (pos.find(p => p.id === ge.po_id)?.items?.map(it => ({
        material_id: it.material_id, po_item_id: it.id,
        ordered_quantity: it.quantity,
        received_quantity: Math.min(ge.quantity || it.quantity, it.quantity - (it.received_quantity || 0)),
        accepted_quantity: Math.min(ge.quantity || it.quantity, it.quantity - (it.received_quantity || 0)),
        rejected_quantity: 0,
        rate: it.rate, material_name: it.material_name
      })) || []) : [];
      const total = items.reduce((sum, it) => sum + (it.accepted_quantity * it.rate), 0);
      setForm({ ...newForm, items, invoice_amount: Number(total.toFixed(2)) });
    } else {
      setForm({ ...form, gate_entry_id: '', po_id: '', items: [] });
    }
  };

  const selectPO = (poId) => {
    const po = pos.find(p => p.id === poId);
    if (po) {
      const items = po.items?.map(it => ({
        material_id: it.material_id, po_item_id: it.id,
        ordered_quantity: it.quantity,
        received_quantity: it.quantity - (it.received_quantity || 0),
        accepted_quantity: it.quantity - (it.received_quantity || 0),
        rejected_quantity: 0,
        rate: it.rate, material_name: it.material_name
      })) || [];
      const total = items.reduce((sum, it) => sum + (it.accepted_quantity * it.rate), 0);
      setForm({
        ...form, po_id: poId, vendor_id: po.vendor_id, project_id: po.project_id, receipt_type: 'PO-Based',
        items, invoice_amount: Number(total.toFixed(2))
      });
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        invoice_date: form.invoice_date || null,
        invoice_amount: Number(parseFloat(form.invoice_amount).toFixed(2)) || 0
      };
      await api.post('/api/grn', payload);
      setDialog(false); 
      resetForm();
      load();
      // Refresh gate entries and POs
      api.get('/api/gate-entries').then(r => setGateEntries(r.data));
      api.get('/api/procurement/po').then(r => setPos(r.data));
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
          setForm({ po_id: '', gate_entry_id: '', warehouse_id: warehouses[0]?.id || '', project_id: '', vendor_id: '', invoice_number: '', invoice_date: '', invoice_amount: 0, items: [] });
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
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.grn_number} — GRN Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Store</Typography><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailDialog?.warehouse_name}</Typography></Grid>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Invoice</Typography><Typography sx={{ fontSize: '0.9rem' }}>{detailDialog?.invoice_number}</Typography></Grid>
            <Grid item xs={3}><Typography variant="caption" color="textSecondary">Received By</Typography><Typography sx={{ fontSize: '0.9rem' }}>{detailDialog?.received_by_name}</Typography></Grid>
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
      <Dialog open={dialog} onClose={() => { setDialog(false); resetForm(); }} maxWidth="lg" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
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
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            {/* Gate Entry Selection (primary link) */}
            <Grid item xs={4}>
              <FormControl fullWidth><InputLabel>Gate Entry (Pending)</InputLabel>
                <Select value={form.gate_entry_id} label="Gate Entry (Pending)" onChange={e => selectGateEntry(e.target.value)}>
                  <MenuItem value="">None (select PO directly)</MenuItem>
                  {pendingGateEntries.map(ge => (
                    <MenuItem key={ge.id} value={ge.id}>
                      {ge.entry_number} — {ge.vehicle_number} ({ge.vendor_name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth required><InputLabel>Purchase Order</InputLabel>
                <Select value={form.po_id} label="Purchase Order" onChange={e => selectPO(e.target.value)}
                  disabled={!!form.gate_entry_id}>
                  {pos.filter(p => p.status !== 'Closed' && p.status !== 'Draft').map(p => <MenuItem key={p.id} value={p.id}>{p.po_number} - {p.vendor_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth required><InputLabel>Store</InputLabel>
                <Select value={form.warehouse_id} label="Store" onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField fullWidth label="Invoice Number" value={form.invoice_number || ''} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Invoice Date" type="date" value={form.invoice_date || ''} onChange={e => setForm({ ...form, invoice_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Invoice Amount (₹)" type="number" inputProps={{ step: "0.01" }} value={form.invoice_amount} onChange={e => setForm({ ...form, invoice_amount: parseFloat(e.target.value) || 0 })} /></Grid>
          </Grid>

          {form.gate_entry_id && (
            <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1, border: '1px solid #bbf7d0', mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#166534' }}>
                ✓ Gate Entry linked — GRN will automatically update gate entry status to "Completed"
              </Typography>
            </Box>
          )}

          {form.items.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Items from PO</Typography>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Material</TableCell><TableCell align="right">Ordered</TableCell>
                  <TableCell align="right">Received</TableCell><TableCell align="right">Accepted</TableCell>
                  <TableCell align="right">Rejected</TableCell><TableCell align="right">Rate</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {form.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.material_name || materials.find(m => m.id === item.material_id)?.name}</TableCell>
                      <TableCell align="right">{item.ordered_quantity}</TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" inputProps={{ step: "1" }} value={item.received_quantity ?? ''} sx={{ width: 80 }}
                          onChange={e => {
                            const items = [...form.items];
                            items[i].received_quantity = Math.round(parseFloat(e.target.value) || 0);
                            const total = items.reduce((sum, it) => sum + (it.accepted_quantity * it.rate), 0);
                            setForm({ ...form, items, invoice_amount: Number(total.toFixed(2)) });
                          }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" inputProps={{ step: "1" }} value={item.accepted_quantity ?? ''} sx={{ width: 80 }}
                          onChange={e => {
                            const items = [...form.items];
                            items[i].accepted_quantity = Math.round(parseFloat(e.target.value) || 0);
                            const total = items.reduce((sum, it) => sum + (it.accepted_quantity * it.rate), 0);
                            setForm({ ...form, items, invoice_amount: Number(total.toFixed(2)) });
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
                      <TableCell align="right">₹{item.rate?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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
