import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel, Divider,
  Radio, RadioGroup, FormControlLabel, FormLabel, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Add, Search, AttachFile, OpenInNew } from '@mui/icons-material';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';

export default function GateEntry() {
  const [entries, setEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pos, setPos] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    entry_type: 'Vehicle',
    vehicle_number: '', vendor_id: '', po_id: '', project_id: '',
    material_id: '', quantity: '', driver_name: '', delivery_person_name: '', remarks: '',
    invoice_scan_url: '',
    // When PO is selected, items will be populated
    items: []
  });
  const [uploading, setUploading] = useState(false);

  const load = () => { api.get('/api/gate-entries', { params: { search: search || undefined } }).then(r => setEntries(r.data)); };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    // Only show POs that are Sent to Vendor or Partially Received (pending receipt)
    api.get('/api/procurement/po').then(r => setPos(r.data.filter(p =>
      p.status === 'Sent to Vendor' || p.status === 'Approved' || p.status === 'Partially Received'
    )));
  }, []);

  // When a PO is selected, auto-populate vendor, project, and pending items
  const selectPO = (poId) => {
    const po = pos.find(p => p.id === poId);
    if (po) {
      const pendingItems = po.items
        ?.filter(it => it.quantity - (it.received_quantity || 0) > 0)
        .map(it => ({
          material_id: it.material_id,
          material_name: it.material_name,
          material_code: it.material_code,
          ordered_quantity: it.quantity,
          already_received: it.received_quantity || 0,
          pending_quantity: it.quantity - (it.received_quantity || 0),
          received_now: it.quantity - (it.received_quantity || 0), // default to pending
          uom_name: it.uom_name
        })) || [];

      setForm({
        ...form,
        po_id: poId,
        vendor_id: po.vendor_id,
        project_id: po.project_id,
        material_id: pendingItems[0]?.material_id || '',
        quantity: pendingItems.reduce((sum, it) => sum + it.received_now, 0),
        items: pendingItems
      });
    }
  };

  const updateReceivedNow = (idx, val) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], received_now: parseFloat(val) || 0 };
    setForm({
      ...form,
      items,
      quantity: items.reduce((sum, it) => sum + (it.received_now || 0), 0)
    });
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, invoice_scan_url: res.data.url }));
    } catch (err) { alert('Upload failed: ' + (err.response?.data?.detail || err.message)); }
    setUploading(false);
  };

  const handleCreate = async () => {
    const isDirect = form.entry_type === 'Direct Invoice';

    if (!isDirect) {
      if (form.entry_type === 'Vehicle' && (!form.vehicle_number || !form.vehicle_number.trim())) {
        return alert("Vehicle Number is required.");
      }
      if (form.entry_type === 'Carry on hand' && (!form.delivery_person_name || !form.delivery_person_name.trim())) {
        return alert("Delivery Person Name is required.");
      }
    } else {
      if (!form.vendor_id) return alert("Vendor is required for Direct Invoice.");
      if (!form.invoice_scan_url) return alert("Please upload the scanned invoice.");
    }
    
    try {
      const payload = {
        entry_type: form.entry_type,
        vehicle_number: form.vehicle_number || '',
        vendor_id: form.vendor_id || null,
        remarks: form.remarks,
        invoice_scan_url: form.invoice_scan_url || null,
        driver_name: form.driver_name || '',
        delivery_person_name: form.delivery_person_name || '',
      };

      if (isDirect) {
        // Direct Invoice: no material/qty/project/PO needed
        payload.project_id = null;
        payload.material_id = null;
        payload.quantity = null;
        payload.po_id = null;
      } else {
        const primaryItem = form.items[0] || {};
        payload.po_id = form.po_id || null;
        payload.project_id = form.project_id;
        payload.material_id = primaryItem.material_id || form.material_id;
        payload.quantity = form.items.length > 0
          ? form.items.reduce((sum, it) => sum + (it.received_now || 0), 0)
          : parseFloat(form.quantity);
      }

      await api.post('/api/gate-entries', payload);
      setDialog(false); load();
      api.get('/api/procurement/po').then(r => setPos(r.data.filter(p =>
        p.status === 'Sent to Vendor' || p.status === 'Approved' || p.status === 'Partially Received'
      )));
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const statusColor = { 'Gate Entry Created': 'info', 'Awaiting GRN': 'warning', 'Awaiting Direct GRN': 'secondary', 'Completed': 'success' };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Security Gate Entry</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Record incoming materials at site gate</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ entry_type: 'Vehicle', vehicle_number: '', vendor_id: '', po_id: '', project_id: projects[0]?.id || '', material_id: '', quantity: '', driver_name: '', delivery_person_name: '', remarks: '', invoice_scan_url: '', items: [] });
          setDialog(true);
        }}>New Gate Entry</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search entry number..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Entry No.</TableCell><TableCell>Type</TableCell><TableCell>Vehicle/Person</TableCell><TableCell>Vendor</TableCell>
              <TableCell>PO Ref</TableCell><TableCell>Material</TableCell><TableCell align="right">Qty</TableCell>
              <TableCell>Arrival</TableCell><TableCell>Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(e)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{e.entry_number}</TableCell>
                  <TableCell><Chip label={e.entry_type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {e.entry_type === 'Vehicle' ? (
                      <Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{e.vehicle_number}</Typography>
                        <Typography variant="caption" color="textSecondary">{e.driver_name}</Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{e.delivery_person_name}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{e.vendor_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{e.po_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{e.material_name || (e.entry_type === 'Direct Invoice' ? '—' : '')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{e.quantity || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDateTime(e.arrival_time)}</TableCell>
                  <TableCell><Chip label={e.status} size="small" color={statusColor[e.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Gate Entry Detail */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.entry_number} — Gate Entry Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={6}><Typography variant="caption" color="textSecondary">Entry Type</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.entry_type}</Typography></Grid>
            {detailDialog?.entry_type === 'Vehicle' ? (
              <>
                <Grid size={6}><Typography variant="caption" color="textSecondary">Vehicle</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vehicle_number}</Typography></Grid>
                <Grid size={6}><Typography variant="caption" color="textSecondary">Driver</Typography><Typography>{detailDialog?.driver_name}</Typography></Grid>
              </>
            ) : (
              <Grid size={6}><Typography variant="caption" color="textSecondary">Delivery Person</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.delivery_person_name}</Typography></Grid>
            )}
            <Grid size={6}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid size={6}><Typography variant="caption" color="textSecondary">PO Ref</Typography><Typography>{detailDialog?.po_number || '-'}</Typography></Grid>
            <Grid size={6}><Typography variant="caption" color="textSecondary">Material</Typography><Typography>{detailDialog?.material_name || '—'}</Typography></Grid>
            <Grid size={6}><Typography variant="caption" color="textSecondary">Quantity</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.quantity || '—'}</Typography></Grid>
            <Grid size={6}><Typography variant="caption" color="textSecondary">Arrival</Typography><Typography>{formatDateTime(detailDialog?.arrival_time)}</Typography></Grid>
            <Grid size={6}><Typography variant="caption" color="textSecondary">Status</Typography><Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} /></Grid>
            {detailDialog?.invoice_scan_url && (
              <Grid size={12}>
                <Typography variant="caption" color="textSecondary">Invoice Scan</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => window.open(detailDialog.invoice_scan_url, '_blank')}>View Invoice Scan</Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create Gate Entry Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Record Gate Entry</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              color="primary"
              value={form.entry_type}
              exclusive
              onChange={(e, val) => val && setForm({ ...form, entry_type: val })}
              size="small"
            >
              <ToggleButton value="Vehicle" sx={{ px: 4 }}>Vehicle Entry</ToggleButton>
              <ToggleButton value="Carry on hand" sx={{ px: 4 }}>Carry on hand</ToggleButton>
              <ToggleButton value="Direct Invoice" sx={{ px: 4, color: '#7C3AED', '&.Mui-selected': { bgcolor: '#7C3AED', color: '#fff' } }}>📄 Direct Invoice</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {form.entry_type === 'Direct Invoice' ? (
            /* ─── Direct Invoice Form ─── */
            <Grid container spacing={2}>
              <Grid size={6}>
                <FormControl fullWidth required><InputLabel>Vendor</InputLabel>
                  <Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Vehicle Number" value={form.vehicle_number}
                  onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Driver / Delivery Person" value={form.delivery_person_name}
                  onChange={e => setForm({ ...form, delivery_person_name: e.target.value })} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Remarks" value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="e.g. Phone order from 3-May" />
              </Grid>
              <Grid size={12}>
                <Box sx={{ p: 3, border: '2px dashed #7C3AED', borderRadius: 2, bgcolor: '#F5F3FF', textAlign: 'center' }}>
                  {form.invoice_scan_url ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <AttachFile sx={{ color: '#7C3AED' }} />
                      <Typography sx={{ fontWeight: 600, color: '#7C3AED' }}>Invoice uploaded ✓</Typography>
                      <Button size="small" variant="outlined" onClick={() => window.open(form.invoice_scan_url, '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, invoice_scan_url: '' })}>Remove</Button>
                    </Box>
                  ) : (
                    <>
                      <Typography sx={{ mb: 1, fontWeight: 600, color: '#7C3AED' }}>
                        📎 Upload Scanned Invoice *
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                        PDF, JPG, or PNG (max 10MB)
                      </Typography>
                      <Button variant="contained" component="label" disabled={uploading}
                        sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                        {uploading ? 'Uploading...' : 'Choose File'}
                        <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={e => handleUpload(e.target.files[0])} />
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          ) : (
            /* ─── Regular Entry Form ─── */
            <Grid container spacing={2}>
            {form.entry_type === 'Vehicle' ? (
              <>
                <Grid size={6}><TextField fullWidth label="Vehicle Number" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} required /></Grid>
                <Grid size={6}>
                  <FormControl fullWidth><InputLabel>PO Reference (Pending Orders)</InputLabel>
                    <Select value={form.po_id} label="PO Reference (Pending Orders)" onChange={e => selectPO(e.target.value)}>
                      <MenuItem value="">None (ad-hoc delivery)</MenuItem>
                      {pos.map(p => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.po_number} — {p.vendor_name} ({p.items?.filter(it => it.quantity - (it.received_quantity || 0) > 0).length} pending items)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}><TextField fullWidth label="Driver Name" value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Grid>
              </>
            ) : (
              <>
                <Grid size={6}><TextField fullWidth label="Delivery Person Name" value={form.delivery_person_name} onChange={e => setForm({ ...form, delivery_person_name: e.target.value })} required /></Grid>
                <Grid size={6}>
                  <FormControl fullWidth><InputLabel>PO Reference (Pending Orders)</InputLabel>
                    <Select value={form.po_id} label="PO Reference (Pending Orders)" onChange={e => selectPO(e.target.value)}>
                      <MenuItem value="">None (ad-hoc delivery)</MenuItem>
                      {pos.map(p => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.po_number} — {p.vendor_name} ({p.items?.filter(it => it.quantity - (it.received_quantity || 0) > 0).length} pending items)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
              <Grid size={6}><TextField fullWidth label="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></Grid>
            </Grid>
          )}

          {/* Pending PO Items — only for regular entries */}
          {form.entry_type !== 'Direct Invoice' && form.items.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 1.5, bgcolor: '#fffbeb', borderRadius: 1, border: '1px solid #fde68a', mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
                  Pending items from PO — Enter the received quantity for each item
                </Typography>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>UOM</TableCell>
                  <TableCell align="right">PO Qty</TableCell>
                  <TableCell align="right">Already Recd</TableCell>
                  <TableCell align="right">Pending</TableCell>
                  <TableCell align="right">Received Now</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {form.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{item.material_name}</TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.8rem' }}>{item.material_code}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{item.uom_name}</TableCell>
                      <TableCell align="right">{item.ordered_quantity}</TableCell>
                      <TableCell align="right" sx={{ color: '#059669' }}>{item.already_received}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: '#dc2626' }}>{item.pending_quantity}</TableCell>
                      <TableCell align="right">
                        <TextField size="small" type="number" value={item.received_now} sx={{ width: 100 }}
                          onChange={e => updateReceivedNow(idx, e.target.value)}
                          inputProps={{ min: 0, max: item.pending_quantity }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate}>Record Entry</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
