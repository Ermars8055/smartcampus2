import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Collapse, Tooltip
} from '@mui/material';
import { Add, Delete, Close, Undo, Warehouse, AccountTree, Business, Person, Comment, InfoOutlined, KeyboardArrowDown, KeyboardArrowUp, CheckCircle, Lock } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';


export default function Returns() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const [returns, setReturns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Modal states
  const [returnModal, setReturnModal] = useState({
    open: false,
    warehouse_id: '',
    project_id: '',
    returned_from_department: '',
    return_type: 'Unused',
    remarks: '',
    returned_by_name: '',
    items: []
  });

  const [viewModal, setViewModal] = useState({ open: false, ret: null, items: [] });
  const [errors, setErrors] = useState({});






  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear all errors when form changes
    });
  }, [returnModal]);

  const load = async () => {
    try {
      const retRes = await api.get('/api/returns');
      setReturns(retRes.data.map(r => ({ ...r, status: ['Received', 'Closed', 'Completed'].includes(r.status) ? 'Completed' : r.status })));
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
      const dRes = await api.get('/api/departments');
      setDepartments(dRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const openReturnModal = () => {
    setReturnModal({
      open: true,
      warehouse_id: warehouses[0]?.id || '',
      project_id: projects[0]?.id || '',
      returned_from_department: '',
      return_type: 'Unused',
      remarks: '',
      returned_by_name: '',
      items: [{ material_id: '', quantity: 0, remarks: '' }]
    });
    setErrors({});
  };

  const openViewModal = (ret) => {
    setViewModal({
      open: true,
      ret,
      items: ret.items ? ret.items.map(it => ({
        return_item_id: it.id,
        material_code: it.material_code,
        material_name: it.material_name,
        uom_name: it.uom_name,
        returned_qty: it.returned_qty,
        received_qty: it.received_qty !== null ? it.received_qty : '',
        receipt_remarks: it.receipt_remarks || ''
      })) : []
    });
  };





  const handleReturnSubmit = async () => {
    try {
      const newErrors = {};
      if (!returnModal.warehouse_id) newErrors.warehouse_id = "Target store is required";
      if (!returnModal.project_id) newErrors.project_id = "Project is required";

      const validItems = returnModal.items.filter(it => it.material_id && it.quantity > 0);
      if (validItems.length === 0) newErrors.items = "Please add at least one material with quantity";

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        const el = document.getElementById(`field-${firstErrorField}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const payload = {
        warehouse_id: returnModal.warehouse_id,
        project_id: returnModal.project_id,
        returned_from_department: returnModal.returned_from_department,
        return_type: returnModal.return_type,
        remarks: returnModal.remarks,
        returned_by_name: returnModal.returned_by_name,
        items: validItems.map(it => ({
          material_id: it.material_id,
          returned_qty: parseFloat(it.quantity),
          remarks: it.remarks
        }))
      };
      await api.post('/api/returns', payload);
      setReturnModal({ ...returnModal, open: false });
      load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error', 'Error', 'error'); }
  };

  const handleReceiveSubmit = async () => {
    try {
      const payload = {
        items: viewModal.items.map(it => ({
          return_item_id: it.return_item_id,
          received_qty: parseFloat(it.received_qty) || 0,
          receipt_remarks: it.receipt_remarks
        }))
      };
      await api.post(`/api/returns/${viewModal.ret.id}/receive`, payload);
      setViewModal({ open: false, ret: null, items: [] });
      load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error receiving return', 'Error', 'error'); }
  };

  const addReturnItem = () => {
    const emptyCount = returnModal.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", 'Validation Error', 'warning');
      return;
    }
    setReturnModal({
      ...returnModal,
      items: [...returnModal.items, { material_id: '', quantity: 0, remarks: '' }]
    });
  };

  const removeReturnItem = (index) => {
    const newItems = [...returnModal.items];
    newItems.splice(index, 1);
    setReturnModal({ ...returnModal, items: newItems });
  };

  const updateReturnItem = (index, field, value) => {
    const newItems = [...returnModal.items];
    newItems[index][field] = value;
    setReturnModal({ ...returnModal, items: newItems });
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Return Records</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>View and manage material returns from projects to store.</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openReturnModal}
          disabled={!hasAction('returns', 'can_return') && !hasAction('issues', 'can_issue')} // Fallback to issues permission if returns not defined yet
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          Initiate Return
        </Button>
      </Box>

      {returns.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <Undo sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Return Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Return operations will appear here once processed.</Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <TableContainer>
            <Table size="small" aria-label="returns table">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, py: 1.5 }}>RETURN #</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>FROM</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>TO STORE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>RETURNED BY</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ITEMS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returns.map(ret => (
                  <TableRow
                    key={ret.id}
                    hover
                    onClick={() => openViewModal(ret)}
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', px: 2 }}>{ret.return_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{formatDate(ret.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{ret.returned_from_department || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{ret.warehouse_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{ret.returned_by_name || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem', px: 2 }}>
                      <Chip label={ret.items?.length || 0} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem', bgcolor: '#F1F5F9', color: '#475569' }} />
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip label={ret.status} size="small" color={ret.status === 'Completed' ? 'error' : (ret.status === 'Partially Received' ? 'info' : (ret.status === 'Initiated' ? 'success' : 'default'))} variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      <IconButton
                        size="small"
                        disabled={ret.status === 'Completed'}
                        onClick={(e) => { e.stopPropagation(); openViewModal(ret); }}
                        sx={{ color: ret.status === 'Completed' ? 'action.disabled' : '#10B981', mr: 1 }}
                      >
                        <CheckCircle fontSize="small" />
                      </IconButton>
                      <Tooltip title="Complete Return">
                        <IconButton
                          size="small"
                          disabled={ret.status === 'Completed'}
                          onClick={(e) => { e.stopPropagation(); openViewModal(ret); }}
                          sx={{ color: ret.status === 'Completed' ? 'action.disabled' : '#EF4444' }}
                        >
                          <Lock fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* INITIATE RETURN MODAL */}
      <Dialog open={returnModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setReturnModal({ ...returnModal, open: false }); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#FEF2F2', borderRadius: 2, color: '#DC2626', display: 'flex' }}>
                <Undo fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Initiate Return</Typography>
                <Typography variant="body2" color="text.secondary">Process materials returning to the central store</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setReturnModal({ ...returnModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <FormControl id="field-warehouse_id" fullWidth size="small" error={!!errors.warehouse_id}>
                <InputLabel>Target Store</InputLabel>
                <Select
                  label="Target Store"
                  value={returnModal.warehouse_id}
                  onChange={e => setReturnModal({ ...returnModal, warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                  disabled
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
                {errors.warehouse_id && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.warehouse_id}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Department / Unit</InputLabel>
                <Select
                  label="Department / Unit"
                  value={returnModal.returned_from_department}
                  onChange={e => setReturnModal({ ...returnModal, returned_from_department: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Business sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {departments.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Returned By"
                value={returnModal.returned_by_name}
                onChange={e => setReturnModal({ ...returnModal, returned_by_name: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField inputProps={{ maxLength: 255 }}
                fullWidth size="small" label="General Remarks"
                value={returnModal.remarks}
                onChange={e => setReturnModal({ ...returnModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>Return Items</Typography>
            {errors.items && <Typography color="error" variant="body2">{errors.items}</Typography>}

          </Box>

          <TableContainer id="field-items" component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '50%' }}>MATERIAL</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '25%' }}>REMARKS</TableCell>
                  <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returnModal.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <MaterialSelect
                        materials={materials.filter(m => !returnModal.items.some((it, i) => i !== idx && it.material_id === m.id))}
                        value={item.material_id}
                        onChange={(val) => updateReturnItem(idx, 'material_id', val)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ 
                          step: (item.material_id && materials.find(m => m.id === item.material_id)?.uom_allow_decimal) ? "any" : "1", 
                          min: "0" 
                        }}
                        onKeyDown={e => {
                          const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                          const allowDec = mat ? mat.uom_allow_decimal : false;
                          const blockList = ['-', '+', 'e', 'E'];
                          if (!allowDec) blockList.push('.');
                          if (blockList.includes(e.key)) e.preventDefault();
                        }}
                        fullWidth
                        value={item.quantity}
                        onChange={e => {
                          const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                          const allowDec = mat ? mat.uom_allow_decimal : false;
                          let val = e.target.value.replace(/-/g, '');
                          if (!allowDec) val = val.replace(/\./g, '');
                          updateReturnItem(idx, 'quantity', val);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField inputProps={{ maxLength: 255 }}
                        size="small" fullWidth value={item.remarks}
                        onChange={e => updateReturnItem(idx, 'remarks', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 16 }} /></InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeReturnItem(idx)} disabled={returnModal.items.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={addReturnItem}
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

          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="inherit" /> Stock will be updated only after physical receipt and verification by the store.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setReturnModal({ ...returnModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button
            onClick={handleReturnSubmit}
            variant="contained"
            sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none' }}
          >
            Initiate Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={viewModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setViewModal({ open: false, ret: null, items: [] }); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewModal.ret && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Return Details - {viewModal.ret.return_number}</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(viewModal.ret.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">From</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewModal.ret.returned_from_department || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">To Store</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewModal.ret.warehouse_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Returned By</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewModal.ret.returned_by_name || '-'}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label={viewModal.ret.status} size="small" color={viewModal.ret.status === 'Completed' ? 'error' : (viewModal.ret.status === 'Partially Received' ? 'info' : (viewModal.ret.status === 'Initiated' ? 'success' : 'default'))} sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>Returned Items</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>UOM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>RETURNED QTY</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>RECEIVED QTY</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>REMARKS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewModal.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{item.material_name}</Typography>
                          {item.material_code && <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B' }}>{item.uom_name}</TableCell>
                        <TableCell align="center">{item.returned_qty}</TableCell>
                        {['Initiated', 'Partially Received'].includes(viewModal.ret.status) ? (
                          <>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ step: "1", min: "0", max: item.returned_qty }}
                                onKeyDown={e => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                sx={{ width: 100 }}
                                value={item.received_qty}
                                onChange={e => {
                                  const newItems = [...viewModal.items];
                                  newItems[idx].received_qty = e.target.value ? Math.round(parseFloat(e.target.value.replace(/-/g, ''))) : '';
                                  setViewModal({ ...viewModal, items: newItems });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField inputProps={{ maxLength: 255 }}
                                size="small" fullWidth value={item.receipt_remarks}
                                placeholder="Variance notes"
                                onChange={e => {
                                  const newItems = [...viewModal.items];
                                  newItems[idx].receipt_remarks = e.target.value;
                                  setViewModal({ ...viewModal, items: newItems });
                                }}
                              />
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell align="center">{item.received_qty !== null && item.received_qty !== '' ? item.received_qty : '-'}</TableCell>
                            <TableCell sx={{ color: '#64748B' }}>{item.receipt_remarks || '-'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {viewModal.ret.remarks && (
                <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', mt: 2, display: 'block' }}>
                  Note: {viewModal.ret.remarks}
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 4, pb: 4 }}>
              <Button onClick={() => setViewModal({ open: false, ret: null, items: [] })} sx={{ color: '#64748B' }}>Close</Button>
              {['Initiated', 'Partially Received'].includes(viewModal.ret.status) && (
                <Button onClick={handleReceiveSubmit} variant="contained" sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
                  Confirm Receipt
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
