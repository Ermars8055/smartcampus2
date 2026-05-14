import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Divider, InputAdornment, Paper, TableSortLabel
} from '@mui/material';
import { Add, Delete, CheckCircle, Archive, Send, Cancel, Pause, Search, ShoppingCart, Store, Assignment, CalendarMonth, ArrowDropDown } from '@mui/icons-material';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

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
    vendor_id: '', project_id: '', delivery_date: dayjs().add(14, 'day'), terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '' }]
  });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedPOs = useMemo(() => {
    const list = [...pos];
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'vendor') aVal = a.vendor_name;
        if (sortConfig.key === 'vendor') bVal = b.vendor_name;
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [pos, sortConfig]);

  const formatCurrency = (amount) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

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
        delivery_date: dayjs().add(21, 'day'),
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
      const payload = {
        ...form,
        delivery_date: form.delivery_date ? dayjs(form.delivery_date).format('YYYY-MM-DD') : null,
        items: mappedItems
      };
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
    } catch (err) {
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
          setForm({ vendor_id: '', project_id: projects[0]?.id || '', delivery_date: dayjs().add(21, 'day'), terms: '', po_type: 'Informal', items: [{ material_id: '', quantity: '', rate: '' }] });
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
          <Table size="small" sx={{ '& .MuiTableCell-root': { px: 0.5, py: 0.5, borderBottom: '1px solid #f1f5f9' } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'po_number'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('po_number')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    PO No
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'indent_number'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('indent_number')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    INDENT
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'pr_number'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('pr_number')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    PR
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'qr_number'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('qr_number')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    QUOTATION
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'vendor'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('vendor')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    VENDOR
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ITEMS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                   <TableSortLabel
                    active={sortConfig.key === 'total_amount'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('total_amount')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    AMOUNT
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'created_at'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('created_at')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>DELIVERY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('status')}
                    IconComponent={ArrowDropDown}
                    sx={{ '& .MuiTableSortLabel-icon': { fontSize: '1rem' } }}
                  >
                    STATUS
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPOs.map(po => (
                <TableRow key={po.id} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }} onClick={() => setDetailDialog(po)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{po.po_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>{po.indent_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>{po.pr_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>{po.qr_number || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{po.vendor_name}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.7rem' }}>{po.items?.length || 0}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(po.total_amount)}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    <Chip label={po.po_type} size="small" variant="outlined" color={po.po_type === 'Formal' ? 'primary' : 'default'} sx={{ fontSize: '0.6rem', height: 18 }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.created_at)}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.delivery_date)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }} /></TableCell>
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
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>VENDOR</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>INDENT</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.indent_number || '-'}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PR</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.pr_number || '-'}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>QUOTATION</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.qr_number || '-'}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>STATUS</Typography>
                <Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
              </Grid>

              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PO TYPE</Typography>
                <Box><Chip label={detailDialog?.po_type} size="small" variant="outlined" color={detailDialog?.po_type === 'Formal' ? 'primary' : 'default'} sx={{ fontSize: '0.7rem' }} /></Box>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PO DATE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.created_at)}</Typography>
              </Grid>
              <Grid item xs={2.25}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>DELIVERY</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.delivery_date) || '-'}</Typography>
              </Grid>
              <Grid item xs={4.5}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>TOTAL AMOUNT</Typography>
                <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.2rem' }}>{formatCurrency(detailDialog?.total_amount)}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>Material Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
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
                    <TableCell align="right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</TableCell>
                    <TableCell align="right"><Chip label={item.received_quantity} size="small" color={item.received_quantity >= item.quantity ? 'success' : 'warning'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDetailDialog(null)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Purchase Order</Typography>
              <Typography variant="body2" color="text.secondary">Issue a new purchase order to the vendor.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1, mb: 2 }}>
            <FormControl fullWidth required size="small">
              <InputLabel>Vendor</InputLabel>
              <Select
                value={form.vendor_id}
                label="Vendor"
                onChange={e => setForm({ ...form, vendor_id: e.target.value })}
                startAdornment={<InputAdornment position="start"><Store sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>PO Type</InputLabel>
              <Select
                value={form.po_type || 'Informal'}
                label="PO Type"
                onChange={e => setForm({ ...form, po_type: e.target.value })}
                startAdornment={<InputAdornment position="start"><Assignment sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="Formal">Formal</MenuItem>
                <MenuItem value="Informal">Informal</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label="Delivery Date"
              value={dayjs(form.delivery_date)}
              onChange={val => setForm({ ...form, delivery_date: val })}
              format="DD-MMM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  InputProps: {
                    startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: '#94A3B8' }} /></InputAdornment>
                  }
                }
              }}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Line Items</Typography>
            {!form.indent_id && (
              <Button size="small" startIcon={<Add />} onClick={addItem} sx={{ fontWeight: 600 }}>Add Item</Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {form.items.map((item, i) => (
              <Box key={i} sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr 1fr 110px 40px' },
                gap: 1.5,
                alignItems: 'center',
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Box>
                  <MaterialSelect
                    materials={materials}
                    value={item.material_id}
                    onChange={val => updateItem(i, 'material_id', val)}
                    size="small"
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Qty"
                  type="number"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Rate (₹)"
                  type="number"
                  value={item.rate}
                  onChange={e => updateItem(i, 'rate', e.target.value)}
                  inputProps={{ min: 0 }}
                />
                <Box sx={{ textAlign: 'right', pr: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>AMOUNT</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  {form.items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <IconButton size="small" color="error" onClick={() => removeItem(i)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}>Create PO</Button>
        </DialogActions>
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
