import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, Divider
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

export default function GRNPage() {
  const [grns, setGrns] = useState([]);
  const [pos, setPos] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [form, setForm] = useState({
    po_id: '', gate_entry_id: '', warehouse_id: '', project_id: '', vendor_id: '',
    invoice_number: '', invoice_amount: 0, items: []
  });

  const load = () => { api.get('/api/grn').then(r => setGrns(r.data)); };
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
      const newForm = { ...form, gate_entry_id: geId, vendor_id: ge.vendor_id, project_id: ge.project_id };
      if (ge.po_id) {
        newForm.po_id = ge.po_id;
        // Load PO items
        const po = pos.find(p => p.id === ge.po_id);
        if (po) {
          newForm.items = po.items?.map(it => ({
            material_id: it.material_id, po_item_id: it.id,
            ordered_quantity: it.quantity,
            received_quantity: Math.min(ge.quantity, it.quantity - (it.received_quantity || 0)),
            accepted_quantity: Math.min(ge.quantity, it.quantity - (it.received_quantity || 0)),
            rejected_quantity: 0,
            rate: it.rate, material_name: it.material_name
          })) || [];
        }
      }
      setForm(newForm);
    }
  };

  const selectPO = (poId) => {
    const po = pos.find(p => p.id === poId);
    if (po) {
      setForm({
        ...form, po_id: poId, vendor_id: po.vendor_id, project_id: po.project_id,
        items: po.items?.map(it => ({
          material_id: it.material_id, po_item_id: it.id,
          ordered_quantity: it.quantity, received_quantity: it.quantity - (it.received_quantity || 0),
          accepted_quantity: it.quantity - (it.received_quantity || 0), rejected_quantity: 0,
          rate: it.rate, material_name: it.material_name
        })) || []
      });
    }
  };

  const handleCreate = async () => {
    try {
      const payload = {
        ...form,
        invoice_date: form.invoice_date || null,
        invoice_amount: parseFloat(form.invoice_amount) || 0
      };
      await api.post('/api/grn', payload);
      setDialog(false); load();
      // Refresh gate entries and POs
      api.get('/api/gate-entries').then(r => setGateEntries(r.data));
      api.get('/api/procurement/po').then(r => setPos(r.data));
    } catch (err) {
      const msg = err.response?.data?.detail;
      alert(typeof msg === 'object' ? JSON.stringify(msg) : (msg || 'Error'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Goods Receipt Notes</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Verify and accept received materials</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ po_id: '', gate_entry_id: '', warehouse_id: warehouses[0]?.id || '', project_id: '', vendor_id: '', invoice_number: '', invoice_amount: 0, items: [] });
          setDialog(true);
        }}>Create GRN</Button>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>GRN No.</TableCell><TableCell>PO Ref</TableCell><TableCell>Vendor</TableCell>
              <TableCell>Warehouse</TableCell><TableCell>Invoice</TableCell><TableCell align="right">Amount (₹)</TableCell>
              <TableCell>Items</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {grns.map(g => (
                <TableRow key={g.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(g)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{g.grn_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{g.po_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{g.vendor_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{g.warehouse_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{g.invoice_number}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{g.invoice_amount?.toLocaleString()}</TableCell>
                  <TableCell>{g.items?.length}</TableCell>
                  <TableCell><Chip label={g.status} size="small" color={g.status === 'Completed' ? 'success' : 'warning'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(g.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* GRN Detail */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.grn_number} — GRN Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={3}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid size={3}><Typography variant="caption" color="textSecondary">Warehouse</Typography><Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{detailDialog?.warehouse_name}</Typography></Grid>
            <Grid size={3}><Typography variant="caption" color="textSecondary">Invoice</Typography><Typography sx={{ fontSize: '0.9rem' }}>{detailDialog?.invoice_number}</Typography></Grid>
            <Grid size={3}><Typography variant="caption" color="textSecondary">Received By</Typography><Typography sx={{ fontSize: '0.9rem' }}>{detailDialog?.received_by_name}</Typography></Grid>
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
                  <TableCell align="right">{item.ordered_quantity}</TableCell>
                  <TableCell align="right">{item.received_quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#059669' }}>{item.accepted_quantity}</TableCell>
                  <TableCell align="right" sx={{ color: item.rejected_quantity > 0 ? '#DC2626' : '#94A3B8' }}>{item.rejected_quantity}</TableCell>
                  <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create GRN */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Goods Receipt Note</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            {/* Gate Entry Selection (primary link) */}
            <Grid size={4}>
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
            <Grid size={4}>
              <FormControl fullWidth required><InputLabel>Purchase Order</InputLabel>
                <Select value={form.po_id} label="Purchase Order" onChange={e => selectPO(e.target.value)}
                  disabled={!!form.gate_entry_id}>
                  {pos.filter(p => p.status !== 'Closed' && p.status !== 'Draft').map(p => <MenuItem key={p.id} value={p.id}>{p.po_number} - {p.vendor_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth required><InputLabel>Warehouse</InputLabel>
                <Select value={form.warehouse_id} label="Warehouse" onChange={e => setForm({ ...form, warehouse_id: e.target.value })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}><TextField fullWidth label="Invoice Number" value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} /></Grid>
            <Grid size={4}><TextField fullWidth label="Invoice Date" type="date" value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            <Grid size={4}><TextField fullWidth label="Invoice Amount (₹)" type="number" value={form.invoice_amount} onChange={e => setForm({ ...form, invoice_amount: parseFloat(e.target.value) || 0 })} /></Grid>
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
                        <TextField size="small" type="number" value={item.received_quantity} sx={{ width: 80 }}
                          onChange={e => { const items = [...form.items]; items[i].received_quantity = parseFloat(e.target.value) || 0; setForm({ ...form, items }); }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" value={item.accepted_quantity} sx={{ width: 80 }}
                          onChange={e => { const items = [...form.items]; items[i].accepted_quantity = parseFloat(e.target.value) || 0; setForm({ ...form, items }); }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" value={item.rejected_quantity} sx={{ width: 80 }}
                          onChange={e => { const items = [...form.items]; items[i].rejected_quantity = parseFloat(e.target.value) || 0; setForm({ ...form, items }); }} />
                      </TableCell>
                      <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate}>Complete GRN</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
