import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Tooltip
} from '@mui/material';
import { Add, Delete, Close, RemoveCircleOutline, Warehouse, Comment, AssignmentTurnedIn, CheckCircle, Cancel, Edit } from '@mui/icons-material';
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

  // Modal state
  const [createModal, setCreateModal] = useState({
    open: false,
    editId: null,
    date: new Date().toISOString().split('T')[0],
    warehouse_id: '',
    reason: '',
    write_off_type: '',
    attachment_url: '',
    items: [{ material_id: '', quantity: 0 }]
  });
  const [viewModal, setViewModal] = useState({ open: false, writeOff: null });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload?folder=write_offs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCreateModal(prev => ({ ...prev, attachment_url: res.data.url }));
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
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreateModal = () => {
    setCreateModal({
      open: true,
      editId: null,
      date: new Date().toISOString().split('T')[0],
      warehouse_id: '',
      reason: '',
      write_off_type: '',
      attachment_url: '',
      items: [{ material_id: '', quantity: 0 }]
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
        attachment_url: createModal.attachment_url,
        items: validItems.map(it => ({
          material_id: it.material_id,
          warehouse_id: createModal.warehouse_id,
          quantity: parseFloat(it.quantity)
        }))
      };
      let res;
      if (createModal.editId) {
        res = await api.put(`/api/write-offs/${createModal.editId}`, payload);
      } else {
        res = await api.post('/api/write-offs', payload);
      }
      setCreateModal({ ...createModal, open: false, editId: null });
      const woNumber = res?.data?.write_off_number || (createModal.editId ? 'Write Off' : '');
      showMessage(`Write Off ${createModal.editId ? 'updated' : 'created'} successfully`.trim(), 'Success', 'success');
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
      items: [...createModal.items, { material_id: '', quantity: 0 }]
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
      
      let msg = '';
      let title = 'Success';
      let severity = 'success';

      if (action === 'reject') {
        msg = 'Write Off rejected successfully';
        title = 'Rejected';
        severity = 'info';
      } else if (action === 'approve') {
        msg = 'Write Off approved successfully';
      } else if (action === 'submit') {
        msg = 'Write Off submitted successfully';
      } else {
        msg = `Write Off ${action}d successfully`;
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
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          New Write Off
        </Button>
      </Box>

      {writeOffs.length === 0 ? (
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
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, py: 1.5 }}>WRITE OFF #</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>REASON</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ITEMS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {writeOffs.map(wo => (
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
                      <Chip label={wo.status} size="small" color={getStatusColor(wo.status)} variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      {wo.status === 'Draft' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={(e) => { 
                              e.stopPropagation(); 
                              setCreateModal({
                                open: true,
                                editId: wo.id,
                                date: wo.date,
                                warehouse_id: wo.items[0]?.warehouse_id || '',
                                reason: wo.reason,
                                write_off_type: wo.write_off_type,
                                attachment_url: wo.attachment_url,
                                items: wo.items.map(it => ({ material_id: it.material_id, quantity: it.quantity }))
                              });
                              setErrors({});
                            }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Submit">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, writeOff: wo }); }}>
                              <AssignmentTurnedIn fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {wo.status === 'Submitted' && wo.can_user_approve && hasAction('write_offs', 'can_approve') && (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, writeOff: wo }); }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setViewModal({ open: true, writeOff: wo }); }}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
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
                  {createModal.editId ? 'Edit Write Off' : 'New Write Off'}
                </Typography>
                <Typography variant="body2" color="text.secondary">Reduce inventory without a gate pass</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setCreateModal({ ...createModal, open: false })}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Date *"
                value={createModal.date ? dayjs(createModal.date) : null}
                onChange={val => setCreateModal({ ...createModal, date: val ? val.format('YYYY-MM-DD') : '' })}
                format="DD-MMM-YYYY"
                disablePast
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={6}>
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
                  fullWidth size="small" label="Attachment URL (Optional)"
                  value={createModal.attachment_url || ''}
                  onChange={e => setCreateModal({ ...createModal, attachment_url: e.target.value })}
                />
                <Button variant="outlined" component="label" disabled={uploading} sx={{ whiteSpace: 'nowrap' }}>
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0])} />
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
                  <TableCell sx={{ fontWeight: 700, width: '55%' }}>MATERIAL</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '40%' }}>QTY</TableCell>
                  <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {createModal.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                      <MaterialSelect
                        materials={materials.filter(m => !createModal.items.some((it, i) => i !== idx && it.material_id === m.id))}
                        value={item.material_id}
                        onChange={(val) => updateItem(idx, 'material_id', val)}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 2 }}>
                      <TextField
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
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'top', pt: 2 }}>
                      <IconButton size="small" color="error" onClick={() => removeItem(idx)} disabled={createModal.items.length === 1} sx={{ mt: 0.5 }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Write Off Details - {viewModal.writeOff.write_off_number}</Typography>
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
                    <Chip label={viewModal.writeOff.status} size="small" color={getStatusColor(viewModal.writeOff.status)} variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Approval Level</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Level {viewModal.writeOff.current_approval_level}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">{viewModal.writeOff.reason}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Attachment</Typography>
                  <Typography variant="body2">
                    {viewModal.writeOff.attachment_url ? (
                      <a href={getFileUrl(viewModal.writeOff.attachment_url)} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'none' }}>
                        View Attachment
                      </a>
                    ) : '-'}
                  </Typography>
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
                        <TableCell align="right">₹{item.rate?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right">₹{item.amount?.toFixed(2) || '0.00'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} align="right" sx={{ fontWeight: 800 }}>Grand Total:</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#10B981' }}>
                        ₹{viewModal.writeOff.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
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
