import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel, Divider,
  Radio, RadioGroup, FormControlLabel, FormLabel, ToggleButton, ToggleButtonGroup,
  TableSortLabel
} from '@mui/material';
import { Add, Search, AttachFile, OpenInNew, LocalShipping } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function GateEntry() {
  const { hasAction } = useAuth();
  const [entries, setEntries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pos, setPos] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'entry_number', direction: 'desc' });

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

    if (!form.invoice_scan_url) return alert("Please upload the scanned invoice.");

    if (!isDirect) {
      if (form.entry_type === 'Vehicle' && (!form.vehicle_number || !form.vehicle_number.trim())) {
        return alert("Vehicle Number is required.");
      }
      if (form.entry_type === 'Carry on hand' && (!form.delivery_person_name || !form.delivery_person_name.trim())) {
        return alert("Delivery Person Name is required.");
      }
    } else {
      if (!form.vendor_id) return alert("Vendor is required for Direct Invoice.");
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
    } catch (err) { 
      const detail = err.response?.data?.detail;
      alert(typeof detail === 'object' ? JSON.stringify(detail) : (detail || 'Error')); 
    }
  };

  const statusColor = { 'Gate Entry Created': 'info', 'Awaiting GRN': 'warning', 'Awaiting Direct GRN': 'secondary', 'Completed': 'success' };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    
    if (sortConfig.key === 'vehicle_person') {
      valA = a.entry_type === 'Vehicle' ? a.vehicle_number : a.delivery_person_name;
      valB = b.entry_type === 'Vehicle' ? b.vehicle_number : b.delivery_person_name;
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Security Gate Entry</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Record incoming materials at site gate</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} disabled={!hasAction('gate_entry', 'can_record_entry')} onClick={() => {
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
              <TableCell><TableSortLabel active={sortConfig.key === 'entry_number'} direction={sortConfig.key === 'entry_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('entry_number')}>Entry No.</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'entry_type'} direction={sortConfig.key === 'entry_type' ? sortConfig.direction : 'asc'} onClick={() => handleSort('entry_type')}>Type</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'vehicle_person'} direction={sortConfig.key === 'vehicle_person' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vehicle_person')}>Vehicle/Person</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'po_number'} direction={sortConfig.key === 'po_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('po_number')}>PO Ref</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'material_names'} direction={sortConfig.key === 'material_names' ? sortConfig.direction : 'asc'} onClick={() => handleSort('material_names')}>Material (Qty)</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'arrival_time'} direction={sortConfig.key === 'arrival_time' ? sortConfig.direction : 'asc'} onClick={() => handleSort('arrival_time')}>Arrival</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
            </TableRow></TableHead>
            <TableBody>
              {sortedEntries.map(e => (
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
                  <TableCell sx={{ fontSize: '0.8rem' }}>{e.material_names || (e.entry_type === 'Direct Invoice' ? '—' : '')}</TableCell>
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
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Entry Type</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.entry_type}</Typography></Grid>
            {detailDialog?.entry_type === 'Vehicle' ? (
              <>
                <Grid item xs={6}><Typography variant="caption" color="textSecondary">Vehicle</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vehicle_number}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="textSecondary">Driver</Typography><Typography>{detailDialog?.driver_name}</Typography></Grid>
              </>
            ) : (
              <Grid item xs={6}><Typography variant="caption" color="textSecondary">Delivery Person</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.delivery_person_name}</Typography></Grid>
            )}
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">PO Ref</Typography><Typography>{detailDialog?.po_number || '-'}</Typography></Grid>
            <Grid item xs={12}><Typography variant="caption" color="textSecondary">Material (Qty)</Typography><Typography>{detailDialog?.material_names || '—'}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Arrival</Typography><Typography>{formatDateTime(detailDialog?.arrival_time)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Status</Typography><Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} /></Grid>
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
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create Gate Entry Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <LocalShipping fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Record Gate Entry</Typography>
              <Typography variant="body2" color="text.secondary">Log incoming materials at the security gate.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
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
              <ToggleButton value="Direct Invoice" sx={{ px: 4 }}>Direct Invoice</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={8}>
              {form.entry_type === 'Direct Invoice' ? (
                /* ─── Direct Invoice Form ─── */
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth required><InputLabel>Vendor</InputLabel>
                      <Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                        {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Vehicle Number" value={form.vehicle_number}
                      onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Driver / Delivery Person" value={form.delivery_person_name}
                      onChange={e => setForm({ ...form, delivery_person_name: e.target.value })} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Remarks" value={form.remarks}
                      onChange={e => setForm({ ...form, remarks: e.target.value })}
                      placeholder="e.g. Phone order" />
                  </Grid>
                </Grid>
              ) : (
                /* ─── Regular Entry Form ─── */
                <Grid container spacing={2}>
                {form.entry_type === 'Vehicle' ? (
                  <>
                    <Grid item xs={6}><TextField fullWidth label="Vehicle Number" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} required /></Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth><InputLabel>PO Reference (Pending Orders)</InputLabel>
                        <Select value={form.po_id} label="PO Reference (Pending Orders)" onChange={e => selectPO(e.target.value)}>
                          <MenuItem value="">None (ad-hoc delivery)</MenuItem>
                          {pos.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.po_number} — {p.vendor_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}><TextField fullWidth label="Driver Name" value={form.driver_name} onChange={e => setForm({ ...form, driver_name: e.target.value })} /></Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={6}><TextField fullWidth label="Delivery Person Name" value={form.delivery_person_name} onChange={e => setForm({ ...form, delivery_person_name: e.target.value })} required /></Grid>
                    <Grid item xs={6}>
                      <FormControl fullWidth><InputLabel>PO Reference (Pending Orders)</InputLabel>
                        <Select value={form.po_id} label="PO Reference (Pending Orders)" onChange={e => selectPO(e.target.value)}>
                          <MenuItem value="">None (ad-hoc delivery)</MenuItem>
                          {pos.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.po_number} — {p.vendor_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
                  <Grid item xs={6}><TextField fullWidth label="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></Grid>
                </Grid>
              )}
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ 
                p: 2, 
                border: '2px dashed #1E3A8A', 
                borderRadius: 2, 
                bgcolor: '#F0F4F8', 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {form.invoice_scan_url ? (
                  <Box>
                    <AttachFile sx={{ color: '#1E3A8A', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E3A8A', mb: 1 }}>Invoice uploaded ✓</Typography>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.invoice_scan_url), '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, invoice_scan_url: '' })}>Remove</Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ mb: 0.5, fontWeight: 600, color: '#1E3A8A', fontSize: '0.9rem' }}>
                      📎 Upload Invoice *
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                      PDF, JPG, or PNG
                    </Typography>
                    <Button variant="contained" component="label" disabled={uploading} size="small"
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
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, textTransform: 'none' }}>Record Entry</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
