import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Tooltip, TableSortLabel, Autocomplete, Tab, Tabs
} from '@mui/material';
import { Add, Delete, Close, RemoveCircleOutline, Warehouse, Comment, AssignmentTurnedIn, CheckCircle, Cancel, Edit, Download, InfoOutlined, Search, ArrowDropDown } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import api, { getFileUrl } from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function WriteOffs() {
  const { showMessage } = useMessage();
  const { hasAction, hasPermission } = useAuth();
  const [writeOffs, setWriteOffs] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState(null);
  const statusFilters = useMemo(() => ['Draft', 'Submitted', 'Approved', 'Rejected', 'All'], []);
  const [tab, setTab] = useState(4);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredBase = useMemo(() => {
    let filtered = writeOffs;

    if (filterDate) {
      filtered = filtered.filter(wo => dayjs(wo.date).isSame(filterDate, 'day'));
    }

    if (filterType !== 'All') {
      filtered = filtered.filter(wo => {
        const isEquipment = wo.items?.some(it => !!it.equipment_id);
        if (filterType === 'Equipment') return isEquipment;
        if (filterType === 'Material') return !isEquipment;
        return true;
      });
    }

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(wo => {
        const matchesWoNumber = wo.write_off_number?.toLowerCase().includes(lowerSearch);
        const matchesItems = wo.items?.some(it =>
          it.material_name?.toLowerCase().includes(lowerSearch) ||
          it.equipment_name?.toLowerCase().includes(lowerSearch) ||
          it.equipment_serial_number?.toLowerCase().includes(lowerSearch)
        );
        return matchesWoNumber || matchesItems;
      });
    }

    return filtered;
  }, [writeOffs, search, filterType, filterDate]);

  const filteredAndSortedWriteOffs = useMemo(() => {
    let list = statusFilters[tab] === 'All' ? filteredBase : filteredBase.filter(wo => wo.status === statusFilters[tab]);

    return [...list].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'items') {
        aVal = a.items?.length || 0;
        bVal = b.items?.length || 0;
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBase, tab, sortConfig, statusFilters]);

  // Modal state
  const [createModal, setCreateModal] = useState({
    open: false,
    editId: null,
    isEquipmentMode: false,
    date: new Date().toISOString().split('T')[0],
    warehouse_id: '',
    reason: '',
    write_off_type: '',
    department_name: '',
    attachment_url: '',
    certification_url: '',
    items: [{ material_id: '', quantity: 1, equipment_id: '', location_id: '', has_buyback: false, buyback_amount: 0 }]
  });
  const [viewModal, setViewModal] = useState({ open: false, writeOff: null });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file, type = 'attachment') => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload?folder=write_offs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (type === 'attachment') {
        setCreateModal(prev => ({ ...prev, attachment_url: res.data.url }));
      } else {
        setCreateModal(prev => ({ ...prev, certification_url: res.data.url }));
      }
    } catch (err) {
      showMessage('Upload failed: ' + (err.response?.data?.detail || err.message), 'Error', 'error');
    }
    setUploading(false);
  };

  const load = async () => {
    try {
      const res = await api.get('/api/write-offs');
      setWriteOffs(res.data);
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
      const dRes = await api.get('/api/departments');
      setDepartments(dRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
      try {
        const locRes = await api.get('/api/configurations/locations');
        setLocations(locRes.data);
      } catch (e) { }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
    if (location.state?.isEquipmentMode) {
      setCreateModal({
        open: true,
        editId: null,
        isEquipmentMode: true,
        date: new Date().toISOString().split('T')[0],
        warehouse_id: location.state.prefillData?.warehouse_id || '',
        reason: 'Equipment Write Off',
        write_off_type: 'Scrap',
        department_name: '',
        attachment_url: '',
        certification_url: '',
        items: [{
          material_id: location.state.prefillData?.material_id || '',
          quantity: 1,
          equipment_id: location.state.prefillData?.equipment_id || '',
          location_id: location.state.prefillData?.location_id || '',
          has_buyback: false,
          buyback_amount: 0
        }]
      });
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const openCreateModal = () => {
    setCreateModal({
      open: true,
      editId: null,
      isEquipmentMode: false,
      date: new Date().toISOString().split('T')[0],
      warehouse_id: '',
      reason: '',
      write_off_type: '',
      department_name: '',
      attachment_url: '',
      certification_url: '',
      items: [{ material_id: '', quantity: 1, equipment_id: '', location_id: '', has_buyback: false, buyback_amount: 0 }]
    });
    setErrors({});
  };

  const handleCreateSubmit = async () => {
    try {
      const newErrors = {};
      if (!createModal.warehouse_id) newErrors.warehouse_id = "Store is required";
      if (!createModal.write_off_type) newErrors.write_off_type = "Type is required";
      if (!createModal.reason) newErrors.reason = "Reason is required";

      const validItems = createModal.items.filter(it => it.material_id && it.quantity > 0);
      if (validItems.length === 0) newErrors.items = "Please add at least one material with quantity > 0";

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        const el = document.getElementById(`field-${firstErrorField}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const payload = {
        date: createModal.date,
        reason: createModal.reason,
        write_off_type: createModal.write_off_type,
        department_name: createModal.department_name,
        attachment_url: createModal.attachment_url,
        certification_url: createModal.certification_url,
        items: validItems.map(it => ({
          material_id: it.material_id,
          warehouse_id: createModal.warehouse_id,
          equipment_id: it.equipment_id || null,
          location_id: it.location_id || null,
          quantity: parseFloat(it.quantity),
          has_buyback: it.has_buyback,
          buyback_amount: parseFloat(it.buyback_amount || 0)
        }))
      };
      let res;
      if (createModal.editId) {
        res = await api.put(`/api/write-offs/${createModal.editId}`, payload);
      } else {
        res = await api.post('/api/write-offs', payload);
      }
      setCreateModal({ ...createModal, open: false, editId: null });
      const woNumber = res?.data?.write_off_number || 'Write Off';
      showMessage(`${woNumber} ${createModal.editId ? 'updated' : 'created'} successfully`.trim(), 'Success', 'success');
      load();
    } catch (err) {
      let errMsg = 'Error processing request';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') errMsg = err.response.data.detail;
        else if (Array.isArray(err.response.data.detail)) errMsg = err.response.data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        else errMsg = JSON.stringify(err.response.data.detail);
      }
      showMessage(errMsg, 'Error', 'error');
    }
  };

  const addItem = () => {
    setCreateModal({
      ...createModal,
      items: [...createModal.items, { material_id: '', quantity: 1, has_buyback: false, buyback_amount: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = [...createModal.items];
    newItems.splice(index, 1);
    setCreateModal({ ...createModal, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...createModal.items];
    newItems[index][field] = value;
    setCreateModal({ ...createModal, items: newItems });
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/api/write-offs/${id}/${action}`);

      const woNumber = viewModal.writeOff?.write_off_number || 'Write Off';
      let msg = '';
      let title = 'Success';
      let severity = 'success';

      if (action === 'reject') {
        msg = `${woNumber} rejected successfully`;
        title = 'Rejected';
        severity = 'info';
      } else if (action === 'approve') {
        msg = `${woNumber} approved successfully`;
      } else if (action === 'submit') {
        msg = `${woNumber} submitted successfully`;
      } else {
        msg = `${woNumber} ${action}d successfully`;
      }

      showMessage(msg, title, severity);
      setViewModal({ open: false, writeOff: null });
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || `Error performing ${action}`, 'Error', 'error');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Approved') return 'success';
    if (status === 'Rejected') return 'error';
    if (status === 'Submitted') return 'info';
    if (status === 'Draft') return 'default';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Write Offs</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Manage inventory reduction without physical gate passes.</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateModal}
          disabled={!hasPermission('write_offs', 'can_create')}
        >
          New Write Off
        </Button>
      </Box>

      {(writeOffs.length > 0 || search || filterType !== 'All' || filterDate) && (
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Search Write Off or Material/Equipment..." value={search}
              onChange={e => setSearch(e.target.value)} sx={{ width: 380 }}
              InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />

            <Autocomplete
              size="small"
              options={['All', 'Material', 'Equipment']}
              value={filterType}
              onChange={(e, val) => setFilterType(val || 'All')}
              disableClearable
              renderInput={(params) => <TextField {...params} placeholder="Type" sx={{ minWidth: 200 }} />}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DatePicker
                label="Filter by Date"
                value={filterDate}
                onChange={(newValue) => setFilterDate(newValue)}
                format="DD/MMM/YYYY"
                localeText={{ fieldMonthPlaceholder: () => 'MMM' }}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
              />
              {filterDate && (
                <IconButton size="small" onClick={() => setFilterDate(null)}>
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons={false}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {statusFilters.map((s, i) => (
              <Tab
                key={i}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s}
                    <Chip
                      label={s === 'All' ? filteredBase.length : filteredBase.filter(p => p.status === s).length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: tab === i ? 'primary.main' : 'action.selected',
                        color: tab === i ? 'white' : 'text.primary',
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                }
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
              />
            ))}
          </Tabs>
        </Card>
      )}

      {filteredAndSortedWriteOffs.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <RemoveCircleOutline sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Write Off Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Created write offs will appear here.</Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, py: 1.5, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'write_off_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('write_off_number')}
                    >
                      WRITE OFF
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'date'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('date')}
                    >
                      DATE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'reason'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('reason')}
                    >
                      REASON
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'items'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('items')}
                    >
                      ITEMS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'status'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('status')}
                    >
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, whiteSpace: 'nowrap' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedWriteOffs.map(wo => (
                  <TableRow
                    key={wo.id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => setViewModal({ open: true, writeOff: wo })}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', px: 2 }}>{wo.write_off_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{formatDate(wo.date)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{wo.reason}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem', px: 2 }}>
                      <Chip label={wo.items?.length || 0} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip label={wo.status} size="small" color={getStatusColor(wo.status)} sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell sx={{ px: 2, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton size="small" color="primary" disabled={wo.status !== 'Draft'} onClick={(e) => {
                              e.stopPropagation();
                              const isEquipment = wo.items.length > 0 && !!wo.items[0].equipment_id;
                              setCreateModal({
                                open: true,
                                editId: wo.id,
                                isEquipmentMode: isEquipment,
                                date: wo.date,
                                warehouse_id: wo.items[0]?.warehouse_id || '',
                                reason: wo.reason,
                                write_off_type: wo.write_off_type,
                                department_name: wo.department_name || '',
                                attachment_url: wo.attachment_url,
                                certification_url: wo.certification_url,
                                items: wo.items.map(it => ({
                                  material_id: it.material_id,
                                  quantity: it.quantity,
                                  equipment_id: it.equipment_id || '',
                                  location_id: it.location_id || '',
                                  has_buyback: it.has_buyback || false,
                                  buyback_amount: it.buyback_amount || 0
                                }))
                              });
                              setErrors({});
                            }}>
                              <Edit color="primary" fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Submit">
                          <span>
                            <IconButton size="small" color="primary" disabled={wo.status !== 'Draft'} onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, writeOff: wo }); }}>
                              <AssignmentTurnedIn fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Approve">
                          <span>
                            <IconButton size="small" color="success" disabled={!(wo.status === 'Submitted' && wo.can_user_approve && hasAction('write_offs', 'can_approve'))} onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, writeOff: wo }); }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span>
                            <IconButton size="small" color="error" disabled={!(wo.status === 'Submitted' && wo.can_user_approve && hasAction('write_offs', 'can_approve'))} onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, writeOff: wo }); }}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* CREATE MODAL */}
      <Dialog open={createModal.open} onClose={() => setCreateModal({ ...createModal, open: false })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <RemoveCircleOutline fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {createModal.editId ? 'Edit Write Off' : (createModal.isEquipmentMode ? 'Equipment Write Off' : 'New Write Off')}
                </Typography>
                <Typography variant="body2" color="text.secondary">Reduce inventory without a gate pass</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setCreateModal({ ...createModal, open: false })}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="Date *"
                value={createModal.date ? dayjs(createModal.date) : null}
                onChange={val => setCreateModal({ ...createModal, date: val ? val.format('YYYY-MM-DD') : '' })}
                format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                disablePast
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl id="field-warehouse_id" fullWidth size="small" required error={!!errors.warehouse_id}>
                <InputLabel>Store</InputLabel>
                <Select
                  label="Store"
                  value={createModal.warehouse_id}
                  onChange={e => setCreateModal({ ...createModal, warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
                {errors.warehouse_id && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.warehouse_id}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl id="field-write_off_type" fullWidth size="small" required error={!!errors.write_off_type}>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={createModal.write_off_type}
                  onChange={e => setCreateModal({ ...createModal, write_off_type: e.target.value })}
                >
                  <MenuItem value="Damaged in Handling">Damaged in Handling</MenuItem>
                  <MenuItem value="Expired / Shelf-life">Expired / Shelf-life</MenuItem>
                  <MenuItem value="Lost / Stolen">Lost / Stolen</MenuItem>
                  <MenuItem value="Obsolescence">Obsolescence</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
                {errors.write_off_type && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.write_off_type}</Typography>}
              </FormControl>
            </Grid>
            {createModal.isEquipmentMode ? (
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location</InputLabel>
                  <Select
                    label="Location"
                    value={createModal.items[0]?.location_id || ''}
                    onChange={e => updateItem(0, 'location_id', e.target.value)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            ) : (
              <Grid item xs={12} sm={3}>
                <FormControl id="field-department_name" fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={createModal.department_name}
                    onChange={e => setCreateModal({ ...createModal, department_name: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {departments.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={12}>
              <TextField
                id="field-reason" fullWidth size="small" label="Reason" required
                value={createModal.reason}
                onChange={e => setCreateModal({ ...createModal, reason: e.target.value })}
                error={!!errors.reason}
                helperText={errors.reason}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth size="small" label="Writeoff Document"
                  value={createModal.attachment_url || ''}
                  onChange={e => setCreateModal({ ...createModal, attachment_url: e.target.value })}
                />
                <Button variant="outlined" component="label" disabled={uploading} sx={{ whiteSpace: 'nowrap' }}>
                  {uploading ? '...' : 'Upload'}
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0], 'attachment')} />
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth size="small" label="Writeoff Certification"
                  value={createModal.certification_url || ''}
                  onChange={e => setCreateModal({ ...createModal, certification_url: e.target.value })}
                />
                <Button variant="outlined" component="label" disabled={uploading} sx={{ whiteSpace: 'nowrap' }}>
                  {uploading ? '...' : 'Upload'}
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0], 'certification')} />
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Materials</Typography>
            {errors.items && <Typography color="error" variant="body2">{errors.items}</Typography>}

          </Box>

          <TableContainer id="field-items" component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '45%' }}>MATERIAL</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '15%' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '35%' }}>BUY-BACK</TableCell>
                  <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {createModal.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                      <MaterialSelect
                        disabled={createModal.isEquipmentMode}
                        materials={materials.filter(m => !createModal.items.some((it, i) => i !== idx && it.material_id === m.id))}
                        value={item.material_id}
                        onChange={(val) => updateItem(idx, 'material_id', val)}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                      <TextField
                        disabled={createModal.isEquipmentMode}
                        size="small" type="number"
                        fullWidth
                        value={item.quantity}
                        onKeyDown={e => {
                          const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                          const allowDec = mat ? mat.uom_allow_decimal : false;
                          const blockList = ['-', '+', 'e', 'E'];
                          if (!allowDec) blockList.push('.');
                          if (blockList.includes(e.key)) e.preventDefault();
                        }}
                        onChange={e => {
                          const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                          const allowDec = mat ? mat.uom_allow_decimal : false;
                          let val = e.target.value.replace(/-/g, '');
                          if (!allowDec) val = val.replace(/\./g, '');
                          updateItem(idx, 'quantity', val);
                        }}
                        inputProps={{
                          min: "0",
                          step: (item.material_id && materials.find(m => m.id === item.material_id)?.uom_allow_decimal) ? "any" : "1"
                        }}
                        InputProps={{
                          endAdornment: item.material_id ? (
                            <InputAdornment position="end">
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>
                                {materials.find(m => m.id === item.material_id)?.uom_name || 'unit'}
                              </Typography>
                            </InputAdornment>
                          ) : null
                        }}
                        sx={{
                          '& input[type=number]': { '-moz-appearance': 'textfield' },
                          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                            '-webkit-appearance': 'none',
                            margin: 0
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 2, bgcolor: '#EFF6FF', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" checked={item.has_buyback} onChange={e => updateItem(idx, 'has_buyback', e.target.checked)} />
                          Yes
                        </label>
                        <Tooltip title="Check this if the item is being returned for a buy-back value">
                          <InfoOutlined sx={{ fontSize: 16, color: '#94A3B8' }} />
                        </Tooltip>
                        {item.has_buyback && (
                          <TextField
                            size="small"
                            label="Amount (₹)"
                            type="number"
                            value={item.buyback_amount}
                            onKeyDown={e => {
                              if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/-/g, '');
                              updateItem(idx, 'buyback_amount', val);
                            }}
                            sx={{
                              width: '120px',
                              '& input[type=number]': { '-moz-appearance': 'textfield' },
                              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                                '-webkit-appearance': 'none',
                                margin: 0
                              }
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'top', pt: 2 }}>
                      {!createModal.isEquipmentMode && (
                        <IconButton size="small" color="error" onClick={() => removeItem(idx)} disabled={createModal.items.length === 1} sx={{ mt: 0.5 }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!createModal.isEquipmentMode && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Add />}
                        onClick={addItem}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderStyle: 'dashed',
                          width: '100%',
                          color: '#2563EB',
                          fontSize: '0.95rem',
                          borderColor: '#cbd5e1',
                          '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                        }}
                      >
                        Add Another Item
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => setCreateModal({ ...createModal, open: false, editId: null })} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button onClick={handleCreateSubmit} variant="contained" sx={{ bgcolor: '#2563EB', textTransform: 'none' }}>
            {createModal.editId ? 'Update Write Off' : 'Create Write Off'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={viewModal.open} onClose={() => setViewModal({ open: false, writeOff: null })} maxWidth="md" fullWidth>
        {viewModal.writeOff && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {viewModal.writeOff.items.some(it => it.equipment_id) ? 'Equipment Write Off Details' : 'Write Off Details'} - {viewModal.writeOff.write_off_number}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(viewModal.writeOff.date)}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewModal.writeOff.write_off_type || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={viewModal.writeOff.status} size="small" color={getStatusColor(viewModal.writeOff.status)} sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Approval Level</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Level {viewModal.writeOff.current_approval_level}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  {viewModal.writeOff.items.some(it => it.equipment_id) ? (
                    <>
                      <Typography variant="caption" color="text.secondary">Location</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewModal.writeOff.items[0]?.location_name || '-'}</Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary">Department</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewModal.writeOff.department_name || '-'}</Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">{viewModal.writeOff.reason}</Typography>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Typography variant="caption" color="text.secondary">Writeoff Document</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {viewModal.writeOff.attachment_url ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        href={getFileUrl(viewModal.writeOff.attachment_url)}
                        target="_blank"
                        sx={{ textTransform: 'none', py: 0.25 }}
                      >
                        Download
                      </Button>
                    ) : <Typography variant="body2">-</Typography>}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Writeoff Certification</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {viewModal.writeOff.certification_url ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        href={getFileUrl(viewModal.writeOff.certification_url)}
                        target="_blank"
                        sx={{ textTransform: 'none', py: 0.25 }}
                      >
                        Download
                      </Button>
                    ) : <Typography variant="body2">-</Typography>}
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Materials</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>STORE</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>UOM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>QTY</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>RATE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>BUY-BACK (₹)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>AMOUNT</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewModal.writeOff.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.material_name}</Typography>
                          {item.material_code && <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>}
                        </TableCell>
                        <TableCell align="center">{item.warehouse_name || '-'}</TableCell>
                        <TableCell align="center">{item.uom_name || 'unit'}</TableCell>
                        <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity}</Typography></TableCell>
                        <TableCell align="right">₹{Number(item.rate?.toFixed(2)) || '0.00'}</TableCell>
                        <TableCell align="right" sx={{ bgcolor: '#EFF6FF' }}>
                          {item.has_buyback ? (
                            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>₹{Number(item.buyback_amount?.toFixed(2)) || '0.00'}</Typography>
                          ) : '-'}
                        </TableCell>
                        <TableCell align="right">₹{Number(item.amount?.toFixed(2)) || '0.00'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={6} align="right" sx={{ fontWeight: 800 }}>Grand Total:</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#10B981' }}>
                        ₹{Number(viewModal.writeOff.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 4, pb: 4, gap: 1 }}>
              <Button onClick={() => setViewModal({ open: false, writeOff: null })} sx={{ color: '#64748B' }}>Close</Button>
              {viewModal.writeOff.status === 'Draft' && hasAction('write_offs', 'can_submit') && (
                <Button onClick={() => handleAction(viewModal.writeOff.id, 'submit')} variant="contained" sx={{ bgcolor: '#3B82F6' }}>
                  Submit
                </Button>
              )}
              {viewModal.writeOff.status === 'Submitted' && viewModal.writeOff.can_user_approve && hasAction('write_offs', 'can_approve') && (
                <>
                  <Button onClick={() => handleAction(viewModal.writeOff.id, 'approve')} variant="contained" color="success" startIcon={<CheckCircle />}>
                    Approve
                  </Button>
                  <Button onClick={() => handleAction(viewModal.writeOff.id, 'reject')} variant="contained" color="error" startIcon={<Cancel />}>
                    Reject
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
