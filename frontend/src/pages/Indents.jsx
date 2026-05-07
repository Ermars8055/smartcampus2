import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Divider
} from '@mui/material';
import { Add, Delete, CheckCircle, Cancel, ReceiptLong, ArrowBack } from '@mui/icons-material';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';

export default function Indents() {
  const { showMessage } = useMessage();
  const [indents, setIndents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  
  const [form, setForm] = useState({
    block_id: '', floor: '', location: '', remarks: '', items: [{ material_id: '', requested_quantity: '' }]
  });
  const [vendorDialog, setVendorDialog] = useState({ open: false, indent: null, vendor_id: '' });
  const [vendors, setVendors] = useState([]);
  
  const selectedBlock = blocks.find(b => b.id === form.block_id);
  const floorOptions = selectedBlock ? Array.from({ length: selectedBlock.floors }, (_, i) => i + 1) : [];
  const roomOptions = selectedBlock ? Array.from({ length: selectedBlock.rooms }, (_, i) => i + 1) : [];

  const navigate = useNavigate();

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null });

  const showConfirm = (title, message, confirmText, confirmColor, action) => {
    setConfirm({ open: true, title, message, confirmText, confirmColor, action });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(); setConfirm({ ...confirm, open: false }); };
  const handleCancelConfirm = () => { setConfirm({ ...confirm, open: false }); };

  const load = () => { api.get('/api/indents').then(r => setIndents(r.data)); };
  useEffect(() => {
    load();
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
    api.get('/api/blocks').then(r => setBlocks(r.data));
    api.get('/api/vendors').then(r => setVendors(r.data));
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { material_id: '', requested_quantity: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  // Get UOM name for a selected material
  const getUomForMaterial = (materialId) => {
    const mat = materials.find(m => m.id === materialId);
    return mat?.uom_name || mat?.uom || '—';
  };

  const handleCreate = async () => {
    try {
      const mappedItems = form.items.map(it => ({
        material_id: it.material_id,
        requested_quantity: parseFloat(it.requested_quantity) || 0
      }));
      if (mappedItems.some(it => it.requested_quantity <= 0)) {
        showMessage("Quantity must be greater than 0.", "Validation Error", "warning");
        return;
      }
      if (!form.block_id) {
        showMessage("Please select a building / block.", "Selection Required", "warning");
        return;
      }
      if (mappedItems.some(it => !it.material_id)) {
        showMessage("Please select a material for every line item.", "Validation Error", "warning");
        return;
      }
      const payload = { ...form, items: mappedItems };
      await api.post('/api/indents', payload);
      setShowForm(false); load();
      showMessage("Indent submitted successfully!", "Success", "success");
    } catch (err) { showMessage(err.response?.data?.detail || 'Error', "Error", "error"); }
  };

  const approveIndent = async (id) => { await api.post(`/api/indents/${id}/approve`); load(); };
  const rejectIndent = async (id) => { await api.post(`/api/indents/${id}/reject`); load(); };

  const handleConvertToPo = async () => {
    if (!vendorDialog.vendor_id) return;
    try {
      await api.post(`/api/indents/${vendorDialog.indent.id}/convert-to-po?vendor_id=${vendorDialog.vendor_id}`);
      setVendorDialog({ open: false, indent: null, vendor_id: '' });
      load();
      showMessage("PO created successfully!", "Success", "success");
    } catch (err) { showMessage(err.response?.data?.detail || 'Error converting to PO', "Error", "error"); }
  };

  // Status helpers
  const statusColor = { 
    'Awaiting Approval': 'warning', 'Approved': 'success', 'Rejected': 'error', 
    'Partially Issued': 'info', 'Fully Issued': 'primary', 'PO Created': 'secondary', 'Closed': 'default'
  };

  /* ─── INLINE CREATE FORM (reference-style card) ─── */
  if (showForm) {
    return (
      <Box>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Material Indents</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>Raise and manage department material requests</Typography>
          </Box>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setShowForm(false)}>
            Back to List
          </Button>
        </Box>

        {/* Create Form Card */}
        <Card sx={{ border: '1.5px solid #e0e7ef', borderRadius: 3, p: { xs: 2, sm: 3, md: 4 }, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Create New Indent</Typography>

          {/* ── Location Row ── */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>
                Building <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.block_id}
                  displayEmpty
                  onChange={e => setForm({ ...form, block_id: e.target.value, floor: '', location: '' })}
                  sx={{ bgcolor: '#fff' }}
                >
                  <MenuItem value="" disabled><em>Select Building</em></MenuItem>
                  {blocks.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Floor</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.floor}
                  displayEmpty
                  onChange={e => setForm({ ...form, floor: e.target.value })}
                  disabled={!form.block_id}
                  sx={{ bgcolor: '#fff' }}
                >
                  <MenuItem value="" disabled><em>Select Floor</em></MenuItem>
                  {floorOptions.map(f => <MenuItem key={f} value={f.toString()}>{f === 0 ? 'Ground' : `Floor ${f}`}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Room</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.location}
                  displayEmpty
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  disabled={!form.block_id}
                  sx={{ bgcolor: '#fff' }}
                >
                  <MenuItem value="" disabled><em>Select Room</em></MenuItem>
                  {roomOptions.map(r => <MenuItem key={r} value={r.toString()}>Room {r}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* ── Remarks ── */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Remarks</Typography>
            <TextField
              fullWidth size="small"
              placeholder="e.g. Electrical Lab maintenance, Hostel plumbing repair"
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              sx={{ bgcolor: '#fff' }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* ── Items Section Header ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Items Requested</Typography>
            <Button
              variant="contained" size="small"
              startIcon={<Add />}
              onClick={addItem}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2 }}
            >
              Add Item
            </Button>
          </Box>

          {/* ── Items Table ── */}
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '50%' }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '15%' }} align="center">Unit</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '20%' }} align="center">Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '15%' }} align="center">Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1.5 }}>
                      <MaterialSelect 
                        materials={materials} 
                        value={item.material_id} 
                        onChange={val => updateItem(i, 'material_id', val)}
                        label="Select Material"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                        {item.material_id ? getUomForMaterial(item.material_id) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0"
                        value={item.requested_quantity}
                        onChange={e => updateItem(i, 'requested_quantity', e.target.value)}
                        slotProps={{ htmlInput: { min: 0, style: { textAlign: 'center' } } }}
                        sx={{ width: 120, mx: 'auto', bgcolor: '#fff' }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      {form.items.length > 1 ? (
                        <IconButton
                          size="small"
                          onClick={() => removeItem(i)}
                          sx={{
                            bgcolor: '#ef4444', color: '#fff', width: 30, height: 30,
                            '&:hover': { bgcolor: '#dc2626' }
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      ) : (
                        <IconButton size="small" disabled sx={{ width: 30, height: 30 }}>
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* ── Action Buttons ── */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
            <Button
              variant="contained" onClick={handleCreate}
              sx={{ textTransform: 'none', fontWeight: 600, px: 4, py: 1, borderRadius: 2 }}
            >
              Submit Indent
            </Button>
            <Button
              variant="contained" color="error" onClick={() => setShowForm(false)}
              sx={{ textTransform: 'none', fontWeight: 600, px: 4, py: 1, borderRadius: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  /* ─── LISTING VIEW ─── */
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Material Indents</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Raise and manage department material requests</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ block_id: '', floor: '', location: '', remarks: '', items: [{ material_id: '', requested_quantity: '' }] });
          setShowForm(true);
        }}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}
        >New Indent</Button>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Indent Number</TableCell>
                <TableCell>Block</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Level</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <Typography variant="body2">No indents raised yet. Click "New Indent" to create one.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {indents.map(ind => (
                <TableRow key={ind.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => setDetailDialog(ind)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{ind.indent_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{ind.block_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{ind.location || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{ind.requester_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(ind.created_at)}</TableCell>
                  <TableCell align="center">{ind.items?.length || 0}</TableCell>
                  <TableCell><Chip label={ind.status} size="small" color={statusColor[ind.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell align="center"><Chip label={`L${ind.current_approval_level}`} size="small" variant="outlined" /></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Approve">
                        <span><IconButton size="small" color="success" disabled={ind.status !== 'Awaiting Approval'}
                          onClick={() => showConfirm('Approve Indent?', `Are you sure you want to approve ${ind.indent_number}?`, 'Yes, Approve', 'success', () => approveIndent(ind.id))}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={ind.status !== 'Awaiting Approval'}
                          onClick={() => showConfirm('Reject Indent?', `Are you sure you want to reject ${ind.indent_number}?`, 'Yes, Reject', 'error', () => rejectIndent(ind.id))}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Convert to PO">
                        <span><IconButton size="small" color="primary" disabled={ind.status !== 'Approved' && ind.status !== 'Partially Issued'}
                          onClick={() => setVendorDialog({ open: true, indent: ind, vendor_id: '' })}>
                          <ReceiptLong fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Indent Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.indent_number} — Indent Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.requester_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Block</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.block_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Floor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.floor ? `Floor ${detailDialog.floor}` : '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Room</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.location || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} /></Box>
            </Grid>
          </Grid>
          {detailDialog?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {detailDialog.remarks}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Qty Requested</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Current Stock</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Availability</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Issued</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Pending</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailDialog?.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.material_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>{item.requested_quantity} {item.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{item.current_stock} {item.uom_name}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={item.availability_status === 'Available' ? '✓ AVAILABLE' : (item.availability_status === 'Low Stock' ? 'X LOW' : 'X NO STOCK')} 
                      size="small" 
                      color={item.availability_status === 'Available' ? 'success' : (item.availability_status === 'Low Stock' ? 'warning' : 'error')}
                      variant={item.availability_status === 'Available' ? 'light' : 'outlined'}
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">{item.issued_quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: item.pending_quantity > 0 ? '#ef4444' : '#10b981' }}>
                    {item.pending_quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Vendor Selection Dialog for PO Conversion */}
      <Dialog open={vendorDialog.open} onClose={() => setVendorDialog({ ...vendorDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Select Vendor for PO</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Choose a vendor to create a Purchase Order for the pending items of {vendorDialog.indent?.indent_number}.</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Vendor</InputLabel>
            <Select
              value={vendorDialog.vendor_id}
              label="Vendor"
              onChange={e => setVendorDialog({ ...vendorDialog, vendor_id: e.target.value })}
            >
              {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name} ({v.code})</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVendorDialog({ ...vendorDialog, open: false })}>Cancel</Button>
          <Button variant="contained" disabled={!vendorDialog.vendor_id} onClick={handleConvertToPo}>Convert to PO</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirm.open} onClose={handleCancelConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{confirm.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConfirm}>Cancel</Button>
          <Button variant="contained" color={confirm.confirmColor} onClick={handleConfirm} sx={{ fontWeight: 600 }}>{confirm.confirmText}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
