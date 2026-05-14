import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Tab, Tabs, Divider, Paper, InputAdornment,
  TableSortLabel
} from '@mui/material';
import { Add, CheckCircle, Cancel, ShoppingCart, Archive, Delete, Search, Apartment, AccountTree, CalendarMonth, Notes, Store, Numbers, Inventory, ArrowDropDown } from '@mui/icons-material';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

function StatusChip({ status }) {
  const colorMap = {
    'Draft': 'default', 'Submitted': 'info', 'Approved': 'success',
    'Rejected': 'error', 'Converted to PO': 'secondary',
    'Short Closed': 'warning'
  };
  return <Chip label={status} size="small" color={colorMap[status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
}

export default function PurchaseRequests() {
  const [prs, setPrs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [convertDialog, setConvertDialog] = useState({ open: false, pr: null, vendor_id: '', delivery_date: '', rate: '' });
  const [detailDialog, setDetailDialog] = useState(null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Multi-item PR form
  const [form, setForm] = useState({
    project_id: '', building_id: '', department_name: '',
    required_date: dayjs().add(14, 'day'), remarks: '',
    items: [{ material_id: '', quantity: '' }]
  });

  // Confirmation dialog with optional reason
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false });
  const [reason, setReason] = useState('');
  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); setReason(''); };
  const handleCancelConfirm = () => { setConfirm({ ...confirm, open: false }); setReason(''); };

  const load = () => { api.get('/api/procurement/pr', { params: { search: search || undefined } }).then(r => setPrs(r.data)); };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    load();
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/buildings').then(r => setBuildings(r.data));
    api.get('/api/vendors').then(r => setVendors(r.data));
  }, []);

  // Multi-item form helpers
  const addItem = () => setForm({ ...form, items: [...form.items, { material_id: '', quantity: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const handleCreate = async () => {
    try {
      const payload = {
        project_id: form.project_id || projects[0]?.id,
        building_id: form.building_id || null,
        department_name: form.department_name || null,
        required_date: form.required_date ? dayjs(form.required_date).format('YYYY-MM-DD') : null,
        remarks: form.remarks,
        items: form.items.filter(it => it.material_id && it.quantity).map(it => ({
          material_id: it.material_id, quantity: parseFloat(it.quantity)
        }))
      };
      if (payload.items.length === 0) {
        alert("Add at least one item");
        return;
      }
      await api.post('/api/procurement/pr', payload);
      setDialog(false); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  // Draft → Submitted (first click), Submitted → Approved (second click)
  const handleApprove = async (id) => { await api.post(`/api/procurement/pr/${id}/approve`); load(); };
  const handleReject = async (id, remarks) => { await api.post(`/api/procurement/pr/${id}/reject`, { remarks }); load(); };
  const handleShortClose = async (id, remarks) => { await api.post(`/api/procurement/pr/${id}/short-close`, { remarks }); load(); };

  // Convert ONLY this specific PR to PO (no batch — prevents bypassing approval)
  const openConvertDialog = (pr) => {
    setConvertDialog({
      open: true,
      pr,
      vendor_id: '',
      delivery_date: dayjs().add(14, 'day'),
      items: pr.items.map(it => ({ ...it, rate: '' })) // initialize rate for each item
    });
  };

  const updateConvertItem = (i, rate) => {
    const items = [...convertDialog.items];
    items[i].rate = rate;
    setConvertDialog({ ...convertDialog, items });
  };

  const handleConvert = async () => {
    const mappedItems = convertDialog.items.map(it => ({
      material_id: it.material_id,
      quantity: parseFloat(it.quantity),
      rate: parseFloat(it.rate)
    }));
    
    if (mappedItems.some(it => isNaN(it.rate) || it.rate < 0 || isNaN(it.quantity) || it.quantity <= 0)) {
      alert("Rate and Quantity must be positive numbers for all items.");
      return;
    }

    if (!convertDialog.vendor_id) {
      alert("Please select a vendor.");
      return;
    }
    
    try {
      const payload = {
        vendor_id: convertDialog.vendor_id,
        project_id: convertDialog.pr.project_id,
        pr_id: convertDialog.pr.id,
        delivery_date: convertDialog.delivery_date ? dayjs(convertDialog.delivery_date).format('YYYY-MM-DD') : null,
        terms: '',
        items: mappedItems
      };
      await api.post('/api/procurement/po', payload);
      setConvertDialog({ open: false, pr: null, vendor_id: '', delivery_date: '', items: [] });
      load();
    } catch (err) { 
      const msg = err.response?.data?.detail;
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Error converting PR'); 
    }
  };

  // Status helpers — approve button label changes based on status
  const canApprove = (s) => s === 'Submitted' || s === 'Draft';
  const canReject = (s) => s === 'Submitted' || s === 'Draft';
  const canConvert = (s) => s === 'Approved';
  const canShortClose = (s) => s !== 'Converted to PO' && s !== 'Short Closed' && s !== 'Rejected';
  const approveLabel = (s) => s === 'Draft' ? 'Submit for Approval' : 'Approve';

  const statusFilters = ['All', 'Draft', 'Submitted', 'Approved', 'Rejected', 'Converted to PO', 'Short Closed'];
  
  const sortedPRs = useMemo(() => {
    let list = tab === 0 ? prs : prs.filter(p => p.status === statusFilters[tab]);
    
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
  }, [prs, tab, sortConfig, statusFilters]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Purchase Requests</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{prs.length} total requests</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ project_id: projects[0]?.id || '', building_id: '', department_name: '',
            required_date: dayjs().add(14, 'day'), remarks: '',
            items: [{ material_id: '', quantity: '' }] });
          setDepartments([]);
          setDialog(true);
        }}>Create PR</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search PR numbers..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <Paper 
        elevation={0} 
        sx={{ 
          mb: 2, 
          borderBottom: '1px solid #e0e0e0', 
          borderRadius: '8px 8px 0 0',
          backgroundColor: '#fff' 
        }}
      >
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              minWidth: 100,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              py: 1.5,
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          {statusFilters.map((s, i) => (
            <Tab 
              key={i} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s}
                  <Chip 
                    label={i === 0 ? prs.length : prs.filter(p => p.status === s).length} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      backgroundColor: tab === i ? 'primary.light' : '#f0f0f0',
                      color: tab === i ? 'primary.contrastText' : 'text.secondary',
                      cursor: 'pointer'
                    }} 
                  />
                </Box>
              } 
            />
          ))}
        </Tabs>
      </Paper>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'pr_number'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('pr_number')}
                    IconComponent={ArrowDropDown}
                  >
                    PR NUMBER
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'items'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('items')}
                    IconComponent={ArrowDropDown}
                  >
                    ITEMS
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'building_name'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('building_name')}
                    IconComponent={ArrowDropDown}
                  >
                    BUILDING
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'department_name'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('department_name')}
                    IconComponent={ArrowDropDown}
                  >
                    DEPARTMENT
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'created_at'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('created_at')}
                    IconComponent={ArrowDropDown}
                  >
                    PR DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'required_date'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('required_date')}
                    IconComponent={ArrowDropDown}
                  >
                    REQ. DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('status')}
                    IconComponent={ArrowDropDown}
                  >
                    STATUS
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPRs.map(pr => (
                <TableRow key={pr.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(pr)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{pr.pr_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{pr.items?.length || 0} {pr.items?.length === 1 ? 'item' : 'items'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{pr.building_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{pr.department_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(pr.created_at)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(pr.required_date)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusChip status={pr.status} /></TableCell>
                  <TableCell onClick={e => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={approveLabel(pr.status)}>
                        <span><IconButton size="small" color="success" disabled={!canApprove(pr.status)}
                          onClick={() => showConfirm(
                            pr.status === 'Draft' ? 'Submit PR?' : 'Approve PR?',
                            pr.status === 'Draft'
                              ? `Submit ${pr.pr_number} for approval? (${pr.items?.length} ${pr.items?.length === 1 ? 'item' : 'items'})`
                              : `Approve ${pr.pr_number}? (${pr.items?.length} ${pr.items?.length === 1 ? 'item' : 'items'})`,
                            pr.status === 'Draft' ? 'Yes, Submit' : 'Yes, Approve',
                            'success',
                            () => handleApprove(pr.id)
                          )}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={!canReject(pr.status)}
                          onClick={() => showConfirm('Reject PR?', `Reject ${pr.pr_number}? This cannot be undone.`, 'Yes, Reject', 'error', (r) => handleReject(pr.id, r), true)}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Convert to PO">
                        <span><IconButton size="small" color="primary" disabled={!canConvert(pr.status)}
                          onClick={() => openConvertDialog(pr)}>
                          <ShoppingCart fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Short Close">
                        <span><IconButton size="small" color="warning" disabled={!canShortClose(pr.status)}
                          onClick={() => showConfirm('Short Close PR?', `Short close ${pr.pr_number}?`, 'Yes, Short Close', 'warning', (r) => handleShortClose(pr.id, r), true)}>
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

      {/* PR Detail Dialog — shows material details for approval review */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{detailDialog?.pr_number} — PR Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Inventory fontSize="small" sx={{ color: '#64748B' }} />
              Material Details
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Code</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UOM</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailDialog?.items?.map((it, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{it.material_name}</TableCell>
                      <TableCell sx={{ color: '#64748B', fontSize: '0.75rem' }}>{it.material_code}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{it.quantity}</TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{it.uom_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>Request Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>BUILDING</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{detailDialog?.building_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>DEPARTMENT</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{detailDialog?.department_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>REQUESTER</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{detailDialog?.requester_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>STATUS</Typography>
                <Box><StatusChip status={detailDialog?.status || ''} /></Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PR DATE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>{formatDate(detailDialog?.created_at)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>REQUIRED DATE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#2563EB' }}>{formatDate(detailDialog?.required_date)}</Typography>
              </Grid>
              {detailDialog?.remarks && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>REMARKS</Typography>
                  <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#334155' }}>{detailDialog?.remarks}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDetailDialog(null)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create PR Dialog - Multi-Item */}
      <Dialog 
        open={dialog} 
        onClose={() => setDialog(false)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Purchase Request</Typography>
              <Typography variant="body2" color="text.secondary">Raise a new material purchase request for approval.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1, mb: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Building</InputLabel>
              <Select 
                value={form.building_id} 
                label="Building" 
                onChange={e => {
                  const buildingId = e.target.value;
                  setForm({ ...form, building_id: buildingId, department_name: '' });
                  if (buildingId) {
                    api.get(`/api/buildings/${buildingId}/departments`).then(r => setDepartments(r.data)).catch(() => setDepartments([]));
                  } else {
                    setDepartments([]);
                  }
                }}
                startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="">Select Building</MenuItem>
                {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!form.building_id}>
              <InputLabel>Department</InputLabel>
              <Select 
                value={form.department_name} 
                label="Department" 
                onChange={e => setForm({ ...form, department_name: e.target.value })}
                startAdornment={<InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="">Select Department</MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.name}>{d.name} ({d.code})</MenuItem>)}
              </Select>
            </FormControl>

            <DatePicker 
              label="Required Date" 
              value={dayjs(form.required_date)}
              onChange={val => setForm({ ...form, required_date: val })}
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Material Items</Typography>
            <Button size="small" startIcon={<Add />} onClick={addItem} sx={{ fontWeight: 600 }}>Add Item</Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {form.items.map((item, i) => (
              <Box key={i} sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 40px' }, 
                gap: 1.5, 
                alignItems: 'start',
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
                  label="Quantity" 
                  type="number" 
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)} 
                  inputProps={{ min: 1 }} 
                  required
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start"><Numbers sx={{ color: '#94A3B8' }} /></InputAdornment> 
                  }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                  {form.items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <IconButton size="small" color="error" onClick={() => removeItem(i)} sx={{ bgcolor: '#fff', border: '1px solid #fee2e2' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', mb: 0.5, display: 'block' }}>REMARKS & NOTES</Typography>
            <TextField 
              fullWidth 
              placeholder="Enter any additional instructions or remarks..."
              value={form.remarks} 
              onChange={e => setForm({ ...form, remarks: e.target.value })} 
              multiline 
              rows={3}
              InputProps={{ 
                startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><Notes sx={{ color: '#94A3B8' }} /></InputAdornment>,
                sx: { borderRadius: 2 }
              }} 
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreate} 
            sx={{ 
              borderRadius: 2, 
              px: 4, 
              py: 1, 
              fontWeight: 700, 
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', 
              textTransform: 'none' 
            }}
          >
            Submit PR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert PR to PO Dialog — ONLY the specific approved PR */}
      <Dialog 
        open={convertDialog.open} 
        onClose={() => setConvertDialog({ ...convertDialog, open: false })} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Convert PR to PO</Typography>
              <Typography variant="body2" color="text.secondary">Create a purchase order from this approved request.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ mb: 3, mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>PR NUMBER</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{convertDialog.pr?.pr_number}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>ITEMS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{convertDialog.pr?.items?.length} {convertDialog.pr?.items?.length === 1 ? 'material' : 'materials'}</Typography>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth required size="small">
                <InputLabel>Vendor</InputLabel>
                <Select 
                  value={convertDialog.vendor_id} 
                  label="Vendor" 
                  displayEmpty
                  onChange={e => setConvertDialog({ ...convertDialog, vendor_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Store sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled>Select Vendor</MenuItem>
                  {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <DatePicker 
                label="Delivery Date" 
                value={dayjs(convertDialog.delivery_date)}
                onChange={val => setConvertDialog({ ...convertDialog, delivery_date: val })}
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
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>Specify Rates for Items</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {convertDialog.items?.map((it, i) => (
              <Box key={i} sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1.2fr 1fr', 
                gap: 2, 
                alignItems: 'center',
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Qty: {it.quantity} {it.uom_name}
                  </Typography>
                  {it.last_purchase_price != null ? (
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, mt: 0.5, display: 'block' }}>
                      LPP: ₹{it.last_purchase_price}
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5, display: 'block' }}>
                      No prior purchases
                    </Typography>
                  )}
                </Box>
                <TextField 
                  fullWidth 
                  size="small" 
                  label="Rate (₹) / unit" 
                  type="number" 
                  value={it.rate}
                  onChange={e => updateConvertItem(i, e.target.value)} 
                  inputProps={{ min: 0 }} 
                  required 
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setConvertDialog({ ...convertDialog, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleConvert} 
            sx={{ 
              borderRadius: 2, 
              px: 4, 
              py: 1, 
              fontWeight: 700, 
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', 
              textTransform: 'none' 
            }}
          >
            Create PO
          </Button>
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
