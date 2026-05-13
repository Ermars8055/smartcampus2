import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Divider
} from '@mui/material';
import { Add, Delete, CheckCircle, Archive, Send, Cancel, Pause, Search } from '@mui/icons-material';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';

export default function PurchaseOrders() {
  const { showMessage } = useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    vendor_id: '', project_id: '', delivery_date: '', terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '' }]
  });

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false });
  const [reason, setReason] = useState('');

  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); setReason(''); };
  const handleCancelConfirm = () => { setConfirm({ ...confirm, open: false }); setReason(''); };

  const load = () => { api.get('/api/procurement/po', { params: { search: search || undefined } }).then(r => setPos(r.data)); };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
  }, []);

  useEffect(() => {
    if (location.state?.indentData && projects.length > 0) {
      const ind = location.state.indentData;
      setForm({
        vendor_id: '', 
        project_id: projects[0]?.id || '', 
        delivery_date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0], 
        terms: '', 
        po_type: 'Formal',
        indent_id: ind.id,
        items: ind.items.filter(it => it.requested_quantity > it.issued_quantity).map(it => ({ 
          material_id: it.material_id, 
          quantity: it.requested_quantity - it.issued_quantity, 
          rate: '' 
        }))
      });
      setDialog(true);
      // Clean up state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, projects, location.pathname, navigate]);

  const addItem = () => setForm({ ...form, items: [...form.items, { material_id: '', quantity: '', rate: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    try {
      const mappedItems = form.items.map(it => ({
        material_id: it.material_id,
        quantity: parseFloat(it.quantity) || 0,
        rate: parseFloat(it.rate) || 0
      }));
      const hasInvalidNumbers = mappedItems.some(it => it.quantity <= 0 || it.rate < 0);
      if (hasInvalidNumbers) {
        showMessage("Quantity must be greater than 0, and rate cannot be negative.", "Validation Error", "warning");
        return;
      }
      const payload = { ...form, items: mappedItems };
      if (payload.indent_id) {
         // Pass indent_id optionally
         await api.post('/api/procurement/po', payload);
         // Also could call convert-po endpoint but PO endpoint works if indent_id is set
      } else {
         await api.post('/api/procurement/po', payload);
      }
      setDialog(false); load();
      showMessage("Purchase Order created successfully!", "Success", "success");
    } catch (err) { showMessage(err.response?.data?.detail || 'Error', "Error", "error"); }
  };

  const approvePO = async (id) => { await api.post(`/api/procurement/po/${id}/approve`); load(); };
  const rejectPO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/reject`, { remarks }); load(); };
  const holdPO = async (id) => { await api.post(`/api/procurement/po/${id}/hold`); load(); };
  const sendPO = async (id) => { 
    try {
      const res = await api.post(`/api/procurement/po/${id}/send`); 
      showMessage(res.data.message, "PO Sent", "success");
      load();
    } catch(err) {
      showMessage(err.response?.data?.detail || "Error sending PO", "Error", "error");
    }
  };
  const shortClosePO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/short-close`, { remarks }); load(); };

  // Status helpers
  const statusColor = { 
    'Draft': 'default', 'Approved': 'success', 'Sent to Vendor': 'info', 
    'Partially Received': 'warning', 'Closed': 'default', 'Short Closed': 'warning',
    'Rejected': 'error', 'On Hold': 'secondary'
  };

  const canApprove = (s) => s === 'Draft' || s === 'On Hold';
  const canReject = (s) => s === 'Draft';
  const canHold = (s) => s === 'Draft' || s === 'Approved';
  const canSend = (s) => s === 'Approved';
  const canShortClose = (s) => s !== 'Short Closed' && s !== 'Closed' && s !== 'Rejected' && s !== 'Draft';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Purchase Orders</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{pos.length} orders</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ vendor_id: '', project_id: projects[0]?.id || '', delivery_date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0], terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '' }] });
          setDialog(true);
        }}>Create PO</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search PO numbers..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>PR Ref</TableCell>
                <TableCell>Indent Ref</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>PO Date</TableCell>
                <TableCell>Delivery</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pos.map(po => (
                <TableRow key={po.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(po)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{po.po_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{po.pr_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{po.indent_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{po.vendor_name}</TableCell>
                  <TableCell align="right">{po.items?.length || 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{po.total_amount?.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    <Chip label={po.po_type} size="small" variant="outlined" color={po.po_type === 'Formal' ? 'primary' : 'default'} sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(po.created_at)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(po.delivery_date)}</TableCell>
                  <TableCell><Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Approve">
                        <span><IconButton size="small" color="success" disabled={!canApprove(po.status)}
                          onClick={() => showConfirm('Approve PO?', `Are you sure you want to approve ${po.po_number}?`, 'Yes, Approve', 'success', () => approvePO(po.id))}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={!canReject(po.status)}
                          onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Put on Hold">
                        <span><IconButton size="small" color="secondary" disabled={!canHold(po.status)}
                          onClick={() => showConfirm('Hold PO?', `Place ${po.po_number} on hold?`, 'Yes, Hold', 'warning', () => holdPO(po.id))}>
                          <Pause fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Send to Vendor">
                        <span><IconButton size="small" color="primary" disabled={!canSend(po.status)}
                          onClick={() => showConfirm('Send to Vendor?', `Send ${po.po_number} to vendor?`, 'Yes, Send', 'primary', () => sendPO(po.id))}>
                          <Send fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Short Close">
                        <span><IconButton size="small" color="warning" disabled={!canShortClose(po.status)}
                          onClick={() => showConfirm('Short Close PO?', `Short close ${po.po_number}?`, 'Yes, Short Close', 'warning', (r) => shortClosePO(po.id, r), true)}>
                          <Archive fontSize="small" />
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

      {/* PO Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.po_number} — Order Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={3}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vendor_name}</Typography></Grid>
            <Grid size={3}><Typography variant="caption" color="textSecondary">PR Ref</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.pr_number || 'None'}</Typography></Grid>
            <Grid size={3}><Typography variant="caption" color="textSecondary">PO Type</Typography><Box><Chip label={detailDialog?.po_type} size="small" variant="outlined" color={detailDialog?.po_type === 'Formal' ? 'primary' : 'default'} /></Box></Grid>
            <Grid size={3}><Typography variant="caption" color="textSecondary">Total</Typography><Typography sx={{ fontWeight: 700, color: '#059669' }}>₹{detailDialog?.total_amount?.toLocaleString()}</Typography></Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Material</TableCell><TableCell>Code</TableCell><TableCell align="right">Qty</TableCell>
              <TableCell align="right">Rate</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Received</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {detailDialog?.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.material_name}</TableCell>
                  <TableCell sx={{ color: '#64748B' }}>{item.material_code}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.amount?.toLocaleString()}</TableCell>
                  <TableCell align="right"><Chip label={item.received_quantity} size="small" color={item.received_quantity >= item.quantity ? 'success' : 'warning'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid size={3}>
              <FormControl fullWidth required><InputLabel>Vendor</InputLabel>
                <Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                  {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth><InputLabel>PO Type</InputLabel>
                <Select value={form.po_type || 'Informal'} label="PO Type" onChange={e => setForm({ ...form, po_type: e.target.value })}>
                  <MenuItem value="Formal">Formal</MenuItem>
                  <MenuItem value="Informal">Informal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={3}>
              <TextField fullWidth label="Delivery Date" type="date" value={form.delivery_date}
                onChange={e => setForm({ ...form, delivery_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Line Items</Typography>
          {form.items.map((item, i) => (
            <Grid container spacing={1} key={i} sx={{ mb: 1 }}>
              <Grid size={5}>
                <MaterialSelect 
                  materials={materials} 
                  value={item.material_id} 
                  onChange={val => updateItem(i, 'material_id', val)} 
                />
              </Grid>
              <Grid size={2.5}><TextField fullWidth size="small" label="Qty" type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} inputProps={{ min: 0 }} /></Grid>
              <Grid size={2.5}><TextField fullWidth size="small" label="Rate (₹)" type="number" value={item.rate} onChange={e => updateItem(i, 'rate', e.target.value)} inputProps={{ min: 0 }} /></Grid>
              <Grid size={2} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}</Typography>
                {form.items.length > 1 && <IconButton size="small" color="error" onClick={() => removeItem(i)}><Delete fontSize="small" /></IconButton>}
              </Grid>
            </Grid>
          ))}
          {!form.indent_id && (
            <Button size="small" startIcon={<Add />} onClick={addItem} sx={{ mt: 1 }}>Add Item</Button>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate}>Create PO</Button></DialogActions>
      </Dialog>

      {/* Confirmation Dialog with optional Reason */}
      <Dialog open={confirm.open} onClose={handleCancelConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{confirm.message}</Typography>
          {confirm.needsReason && (
            <TextField fullWidth label="Reason (required)" value={reason} onChange={e => setReason(e.target.value)}
              multiline rows={2} required autoFocus />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConfirm}>Cancel</Button>
          <Button variant="contained" color={confirm.confirmColor}
            disabled={confirm.needsReason && !reason.trim()}
            onClick={handleConfirm} sx={{ fontWeight: 600 }}>
            {confirm.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
