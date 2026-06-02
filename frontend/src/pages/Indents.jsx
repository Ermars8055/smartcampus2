import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Divider, InputAdornment, TableSortLabel, useTheme, useMediaQuery
} from '@mui/material';
import { Add, Delete, CheckCircle, Cancel, ReceiptLong, ShoppingCart, ArrowBack, Search, Apartment, Layers, MeetingRoom, AccountTree, Notes } from '@mui/icons-material';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';

export default function Indents() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const [indents, setIndents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sorting state
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedIndents = [...indents].sort((a, b) => {
    let valA = a[orderBy] || '';
    let valB = b[orderBy] || '';

    // Handle string comparison case-insensitively
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const [form, setForm] = useState({
    building_id: '', floor_id: '', room_id: '', department: '', remarks: '', items: [{ material_id: '', requested_quantity: '' }]
  });
  const [vendorDialog, setVendorDialog] = useState({ open: false, indent: null, vendor_id: '', terms: '', items: [] });
  const [vendors, setVendors] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);

  const navigate = useNavigate();

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null });

  const showConfirm = (title, message, confirmText, confirmColor, action) => {
    setConfirm({ open: true, title, message, confirmText, confirmColor, action });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(); setConfirm({ ...confirm, open: false }); };
  const handleCancelConfirm = () => { setConfirm({ ...confirm, open: false }); };

  const load = () => { api.get('/api/indents', { params: { search: search || undefined } }).then(r => setIndents(r.data)); };
  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    load();
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
    api.get('/api/buildings').then(r => setBuildings(r.data));
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/terms').then(r => setTermsTemplates(r.data));
  }, []);

  // Fetch floors when building changes
  useEffect(() => {
    if (form.building_id) {
      api.get(`/api/floors?building_id=${form.building_id}`).then(r => setFloors(r.data));
      setForm(prev => ({ ...prev, floor_id: '', room_id: '' }));
      setRooms([]);
    } else {
      setFloors([]);
      setRooms([]);
    }
  }, [form.building_id]);

  // Fetch rooms when floor changes
  useEffect(() => {
    if (form.floor_id) {
      api.get(`/api/rooms?floor_id=${form.floor_id}`).then(r => setRooms(r.data));
      setForm(prev => ({ ...prev, room_id: '' }));
    } else {
      setRooms([]);
    }
  }, [form.floor_id]);

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
      if (!form.building_id) {
        showMessage("Please select a building.", "Selection Required", "warning");
        return;
      }
      if (mappedItems.some(it => !it.material_id)) {
        showMessage("Please select a material for every line item.", "Validation Error", "warning");
        return;
      }

      const selectedFloor = floors.find(f => f.id === form.floor_id);
      const selectedRoom = rooms.find(r => r.id === form.room_id);

      // Map to backend fields
      const payload = {
        room_id: form.room_id || null,
        building_id: form.building_id || null,
        floor: selectedFloor?.name || '',
        location: selectedRoom?.name || '',
        department: form.department,
        remarks: form.remarks,
        items: mappedItems
      };

      await api.post('/api/indents', payload);
      setShowForm(false); load();
      showMessage("Indent submitted successfully!", "Success", "success");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.detail || 'Error', "Error", "error");
    }
  };

  const approveIndent = async (id) => {
    try {
      const res = await api.post(`/api/indents/${id}/approve`);
      load();
      showMessage(res.data.message || "Indent approved successfully", "Success", "success");
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error approving indent", "Error", "error");
    }
  };

  const rejectIndent = async (id) => {
    try {
      const res = await api.post(`/api/indents/${id}/reject`);
      load();
      showMessage(res.data.message || "Indent rejected successfully", "Success", "success");
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error rejecting indent", "Error", "error");
    }
  };

  const openConvertDialog = (indent) => {
    setVendorDialog({
      open: true,
      indent,
      vendor_id: '',
      terms: '',
      items: indent.items.filter(it => it.pending_quantity > 0).map(it => {
        const material = materials.find(m => m.id === it.material_id);
        const gstRate = material?.gst_rate || 0;
        return {
          ...it,
          rate: '',
          discount_percent: 0,
          cgst_percentage: gstRate / 2,
          sgst_percentage: gstRate / 2,
          igst_percentage: 0
        };
      })
    });
  };

  const updateConvertItem = (i, field, value) => {
    const items = [...vendorDialog.items];
    items[i][field] = value;
    setVendorDialog({ ...vendorDialog, items });
  };

  const handleConvertToPo = async () => {
    if (!vendorDialog.vendor_id || !vendorDialog.terms?.trim()) {
      showMessage("Please select a vendor and provide terms and conditions.", "Validation Error", "warning");
      return;
    }
    
    const mappedItems = vendorDialog.items.map(it => ({
      material_id: it.material_id,
      quantity: parseFloat(it.pending_quantity),
      rate: parseFloat(it.rate),
      discount_percent: parseFloat(it.discount_percent || 0),
      cgst_percentage: parseFloat(it.cgst_percentage || 0),
      sgst_percentage: parseFloat(it.sgst_percentage || 0),
      igst_percentage: parseFloat(it.igst_percentage || 0),
    }));

    if (mappedItems.some(it => isNaN(it.rate) || it.rate < 0 || isNaN(it.quantity) || it.quantity <= 0 || isNaN(it.discount_percent) || it.discount_percent < 0 || isNaN(it.cgst_percentage) || it.cgst_percentage < 0 || isNaN(it.sgst_percentage) || it.sgst_percentage < 0 || isNaN(it.igst_percentage) || it.igst_percentage < 0)) {
      showMessage("Rate, Quantity, Discount and Taxes must be valid non-negative numbers.", "Validation Error", "warning");
      return;
    }

    try {
      await api.post(`/api/indents/${vendorDialog.indent.id}/convert-to-po`, {
        vendor_id: vendorDialog.vendor_id,
        terms: vendorDialog.terms,
        items: mappedItems
      });
      setVendorDialog({ open: false, indent: null, vendor_id: '', terms: '', items: [] });
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ReceiptLong fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create New Indent</Typography>
              <Typography variant="body2" color="text.secondary">Raise a department material request with location details.</Typography>
            </Box>
          </Box>

          {/* ── Location Row ── */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>
                Building <span style={{ color: '#d32f2f' }}>*</span>
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.building_id}
                  displayEmpty
                  onChange={e => setForm({ ...form, building_id: e.target.value })}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Building</em></MenuItem>
                  {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Floor</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.floor_id}
                  displayEmpty
                  onChange={e => setForm({ ...form, floor_id: e.target.value })}
                  disabled={!form.building_id}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><Layers sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Floor</em></MenuItem>
                  {floors.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Room</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.room_id}
                  displayEmpty
                  onChange={e => {
                    const selectedRoomId = e.target.value;
                    const selectedRoom = rooms.find(r => r.id === selectedRoomId);
                    setForm({ ...form, room_id: selectedRoomId, department: selectedRoom?.department_name || '' });
                  }}
                  disabled={!form.floor_id}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><MeetingRoom sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Room</em></MenuItem>
                  {rooms.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Department</Typography>
              <TextField
                fullWidth size="small"
                value={form.department}
                placeholder="Select Room first"
                InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8' }} /></InputAdornment> }}
                sx={{ bgcolor: '#f8fafc' }}
              />
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
              InputProps={{ startAdornment: <InputAdornment position="start"><Notes sx={{ color: '#94A3B8' }} /></InputAdornment> }}
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
                        inputProps={{ min: 0, style: { textAlign: 'center' } }}
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
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="text" onClick={() => setShowForm(false)}
              sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1, color: '#64748B' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained" onClick={handleCreate}
              sx={{ textTransform: 'none', fontWeight: 700, px: 4, py: 1, borderRadius: 2, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
            >
              Submit Indent
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
          setForm({ building_id: '', floor_id: '', room_id: '', department: '', remarks: '', items: [{ material_id: '', requested_quantity: '' }] });
          setShowForm(true);
        }}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}
        >New Indent</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search indent number..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Card>
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {indents.length === 0 && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No indents raised yet. Click "New Indent" to create one.
              </Typography>
            )}
            {sortedIndents.map(ind => (
              <Card key={ind.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => setDetailDialog(ind)}>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>{ind.indent_number}</Typography>
                    <Chip label={ind.status} size="small" color={statusColor[ind.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                 </Box>
                 <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Bldg:</strong> {ind.building_name || '-'} | <strong>Dept:</strong> {ind.department || '-'}</Typography>
                 <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Requester:</strong> {ind.requester_name}</Typography>
                 <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(ind.created_at)} • {ind.items?.length || 0} items</Typography>
                 <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={`L${ind.current_approval_level}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                    <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                      <Tooltip title="Approve">
                        <span><IconButton size="small" color="success" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_approve')}
                          onClick={() => showConfirm('Approve Indent?', `Are you sure you want to approve ${ind.indent_number}?`, 'Yes, Approve', 'success', () => approveIndent(ind.id))}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_reject')}
                          onClick={() => showConfirm('Reject Indent?', `Are you sure you want to reject ${ind.indent_number}?`, 'Yes, Reject', 'error', () => rejectIndent(ind.id))}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                        <Tooltip title="Convert to PO">
                          <span><IconButton size="small" color="primary" disabled={(ind.status !== 'Approved' && ind.status !== 'Partially Issued') || !hasAction('indents', 'can_convert_to_po')}
                            onClick={() => openConvertDialog(ind)}>
                            <ShoppingCart fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                    </Box>
                 </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: '100%', tableLayout: 'auto' }}>
              <TableHead>
                <TableRow sx={{ '& th': { px: 0.5, py: 1, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' } }}>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'indent_number'} direction={orderBy === 'indent_number' ? order : 'asc'} onClick={() => handleRequestSort('indent_number')}>
                      Indent No.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'building_name'} direction={orderBy === 'building_name' ? order : 'asc'} onClick={() => handleRequestSort('building_name')}>
                      Bldg.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'department'} direction={orderBy === 'department' ? order : 'asc'} onClick={() => handleRequestSort('department')}>
                      Dept
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'floor'} direction={orderBy === 'floor' ? order : 'asc'} onClick={() => handleRequestSort('floor')}>
                      Floor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'room_name'} direction={orderBy === 'room_name' ? order : 'asc'} onClick={() => handleRequestSort('room_name')}>
                      Room
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'requester_name'} direction={orderBy === 'requester_name' ? order : 'asc'} onClick={() => handleRequestSort('requester_name')}>
                      Requester
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : 'asc'} onClick={() => handleRequestSort('created_at')}>
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : 'asc'} onClick={() => handleRequestSort('status')}>
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Lvl</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {indents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      <Typography variant="body2">No indents raised yet. Click "New Indent" to create one.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {sortedIndents.map(ind => (
                  <TableRow key={ind.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, '& td': { px: 0.5, py: 0.75 } }} onClick={() => setDetailDialog(ind)}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{ind.indent_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.building_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.department || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.floor || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.room_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.requester_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(ind.created_at)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.78rem' }}>{ind.items?.length || 0}</TableCell>
                    <TableCell><Chip label={ind.status} size="small" color={statusColor[ind.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 18 }} /></TableCell>
                    <TableCell align="center"><Chip label={`L${ind.current_approval_level}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Approve">
                          <span><IconButton size="small" color="success" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_approve')}
                            onClick={() => showConfirm('Approve Indent?', `Are you sure you want to approve ${ind.indent_number}?`, 'Yes, Approve', 'success', () => approveIndent(ind.id))}>
                            <CheckCircle fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span><IconButton size="small" color="error" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_reject')}
                            onClick={() => showConfirm('Reject Indent?', `Are you sure you want to reject ${ind.indent_number}?`, 'Yes, Reject', 'error', () => rejectIndent(ind.id))}>
                            <Cancel fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Convert to PO">
                          <span><IconButton size="small" color="primary" disabled={(ind.status !== 'Approved' && ind.status !== 'Partially Issued') || !hasAction('indents', 'can_convert_to_po')}
                            onClick={() => openConvertDialog(ind)}>
                            <ShoppingCart fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Indent Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.indent_number} — Indent Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.requester_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.department || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Building</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.building_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Floor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.floor || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Room</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.room_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Indent Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.created_at)}</Typography>
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
      <Dialog open={vendorDialog.open} onClose={() => setVendorDialog({ ...vendorDialog, open: false })} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>Convert {vendorDialog.indent?.indent_number} to Purchase Order</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Box sx={{ mb: 1.5, mt: 0.5, p: 1.5, bgcolor: '#f0f4ff', borderRadius: 2, border: '1px solid #dbeafe' }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af', whiteSpace: 'nowrap' }}>Select Vendor:</Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={vendorDialog.vendor_id}
                      displayEmpty
                      onChange={e => setVendorDialog({ ...vendorDialog, vendor_id: e.target.value })}
                      sx={{ bgcolor: '#fff' }}
                    >
                      <MenuItem value="" disabled><em>Select Vendor</em></MenuItem>
                      {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4} sx={{ textAlign: 'right' }}>
                <Button 
                  variant="contained" 
                  disabled={!vendorDialog.vendor_id || !vendorDialog.terms?.trim()} 
                  onClick={handleConvertToPo}
                  size="small"
                  sx={{ py: 0.75, px: 3, fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
                >
                  Confirm & Convert
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Indent Details</Typography>
          <Grid container spacing={0.5} sx={{ mb: 1.5 }}>
            {[
              { label: 'Requester', value: vendorDialog.indent?.requester_name },
              { label: 'Dept', value: vendorDialog.indent?.department },
              { label: 'Bldg', value: vendorDialog.indent?.building_name },
              { label: 'Floor', value: vendorDialog.indent?.floor },
              { label: 'Room', value: vendorDialog.indent?.room_name },
              { label: 'Date', value: formatDate(vendorDialog.indent?.created_at) },
            ].map((item, idx) => (
              <Grid item xs={1.7} key={idx}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>{item.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value || '—'}</Typography>
              </Grid>
            ))}
            <Grid item xs={1.8}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Status</Typography>
              <Chip label={vendorDialog.indent?.status} size="small" color={statusColor[vendorDialog.indent?.status] || 'default'} sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, mt: 0.2 }} />
            </Grid>
          </Grid>

          {vendorDialog.indent?.remarks && (
            <Typography variant="caption" sx={{ mb: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0', display: 'block' }}>
              <strong>Remarks:</strong> {vendorDialog.indent.remarks}
            </Typography>
          )}

          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Items to be converted</Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc', '& th': { py: 0.75, px: 1 } }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Material</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Requested</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Issued</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Pending</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 90 }}>Rate (₹)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 70 }}>Disc %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 70 }}>CGST %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 70 }}>SGST %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 70 }}>IGST %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendorDialog.items?.map((item, i) => (
                <TableRow key={item.id} sx={{ '& td': { py: 0.5, px: 1 } }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.material_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem', display: 'block' }}>{item.material_code}</Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.requested_quantity} {item.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{item.issued_quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#2563EB', fontSize: '0.8rem' }}>
                    {item.pending_quantity} {item.uom_name}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
                      <TextField size="small" type="number" value={item.rate} onChange={e => updateConvertItem(i, 'rate', e.target.value)} inputProps={{ min: 0 }} required sx={{ width: 110 }} />
                      <Typography sx={{ position: 'absolute', top: '100%', right: 0, fontSize: '0.65rem', color: '#2563EB', mt: 0.5, whiteSpace: 'nowrap' }}>
                        Base: ₹{materials.find(m => m.id === item.material_id)?.standard_cost || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number" value={item.discount_percent} onChange={e => updateConvertItem(i, 'discount_percent', e.target.value)} inputProps={{ min: 0 }} sx={{ width: 60 }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number" value={item.cgst_percentage} onChange={e => updateConvertItem(i, 'cgst_percentage', e.target.value)} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 60, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number" value={item.sgst_percentage} onChange={e => updateConvertItem(i, 'sgst_percentage', e.target.value)} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 60, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number" value={item.igst_percentage} onChange={e => updateConvertItem(i, 'igst_percentage', e.target.value)} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 60, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Terms and Conditions</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>Select Template</InputLabel>
              <Select
                label="Select Template"
                onChange={e => {
                  const t = termsTemplates.find(x => x.id === e.target.value);
                  if (t) setVendorDialog({ ...vendorDialog, terms: t.content });
                }}
                defaultValue=""
                sx={{ bgcolor: '#fff' }}
              >
                <MenuItem value=""><em>Select a Template</em></MenuItem>
                {termsTemplates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth size="small"
              multiline rows={3}
              placeholder="Enter terms and conditions to be included in the PO..."
              value={vendorDialog.terms}
              onChange={e => setVendorDialog({ ...vendorDialog, terms: e.target.value })}
              sx={{ bgcolor: '#fff' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVendorDialog({ ...vendorDialog, open: false })}>Cancel</Button>
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
