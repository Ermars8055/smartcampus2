import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Collapse, Tooltip
} from '@mui/material';
import { Add, Delete, Close, SwapHoriz, Warehouse, AccountTree, Comment, InfoOutlined, CheckCircle, Lock } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';

export default function StockTransfers() {
  const { hasAction } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Modal state
  const [transferModal, setTransferModal] = useState({
    open: false,
    from_warehouse_id: '',
    to_warehouse_id: '',
    project_id: '',
    remarks: '',
    items: [{ material_id: '', quantity: 0, remarks: '' }]
  });
  const [viewTransferModal, setViewTransferModal] = useState({ open: false, transfer: null, items: [] });

  const openViewTransferModal = (transfer) => {
    setViewTransferModal({ 
      open: true, 
      transfer,
      items: transfer.items ? transfer.items.map(it => ({
        transfer_item_id: it.id,
        material_code: it.material_code,
        material_name: it.material_name,
        uom_name: it.uom_name,
        quantity: it.quantity,
        received_qty: it.received_qty !== null ? it.received_qty : '',
        receipt_remarks: it.receipt_remarks || ''
      })) : []
    });
  };

  const handleReceiveSubmit = async () => {
    try {
      const payload = {
        items: viewTransferModal.items.map(it => ({
          transfer_item_id: it.transfer_item_id,
          received_qty: parseFloat(it.received_qty) || 0,
          receipt_remarks: it.receipt_remarks
        }))
      };
      await api.post(`/api/transfers/${viewTransferModal.transfer.id}/receive`, payload);
      setViewTransferModal({ open: false, transfer: null, items: [] });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error receiving transfer'); }
  };

  const load = async () => {
    try {
      const trfRes = await api.get('/api/transfers');
      setTransfers(trfRes.data);
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const openTransferModal = () => {
    setTransferModal({
      open: true,
      from_warehouse_id: '',
      to_warehouse_id: '',
      project_id: null,
      remarks: '',
      items: [{ material_id: '', quantity: 0, remarks: '' }]
    });
  };

  const handleTransferSubmit = async () => {
    try {
      if (!transferModal.from_warehouse_id || !transferModal.to_warehouse_id) {
        alert('Please select both warehouses');
        return;
      }
      if (transferModal.from_warehouse_id === transferModal.to_warehouse_id) {
        alert('Source and destination cannot be the same');
        return;
      }
      const validItems = transferModal.items.filter(it => it.material_id && it.quantity > 0);
      if (validItems.length === 0) {
        alert('Please add at least one material');
        return;
      }

      const payload = {
        from_warehouse_id: transferModal.from_warehouse_id,
        to_warehouse_id: transferModal.to_warehouse_id,
        project_id: transferModal.project_id || (projects.length > 0 ? projects[0].id : 1),
        remarks: transferModal.remarks,
        items: validItems.map(it => ({
          material_id: it.material_id,
          quantity: Math.round(parseFloat(it.quantity)),
          remarks: it.remarks
        }))
      };
      await api.post('/api/transfers', payload);
      setTransferModal({ ...transferModal, open: false });
      load();
    } catch (err) { 
      let errMsg = 'Error processing request';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') errMsg = err.response.data.detail;
        else if (Array.isArray(err.response.data.detail)) errMsg = err.response.data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        else errMsg = JSON.stringify(err.response.data.detail);
      }
      alert(errMsg); 
    }
  };

  const addTransferItem = () => {
    setTransferModal({
      ...transferModal,
      items: [...transferModal.items, { material_id: '', quantity: 0, remarks: '' }]
    });
  };

  const removeTransferItem = (index) => {
    const newItems = [...transferModal.items];
    newItems.splice(index, 1);
    setTransferModal({ ...transferModal, items: newItems });
  };

  const updateTransferItem = (index, field, value) => {
    const newItems = [...transferModal.items];
    newItems[index][field] = value;
    setTransferModal({ ...transferModal, items: newItems });
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Stock Transfers</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Monitor and record material movements between different locations.</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openTransferModal}
          disabled={!hasAction('transfers', 'can_transfer') && !hasAction('issues', 'can_issue')} // Fallback
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          New Transfer
        </Button>
      </Box>

      {transfers.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <SwapHoriz sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Stock Transfer Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Stock transfers between locations will appear here.</Typography>
        </Card>
      ) : (
        <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <TableContainer>
            <Table size="small" aria-label="transfers table">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2, py: 1.5 }}>TRANSFER #</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>FROM WAREHOUSE</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>TO WAREHOUSE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ITEMS</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map(trf => (
                  <TableRow
                    key={trf.id}
                    hover
                    onClick={() => openViewTransferModal(trf)}
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', px: 2 }}>{trf.transfer_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 2 }}>{formatDate(trf.created_at)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 2 }}>{trf.from_warehouse_name}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.8rem', px: 2 }}>{trf.to_warehouse_name}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.8rem', px: 2 }}>
                      <Chip label={trf.items?.length || 0} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem', bgcolor: '#F1F5F9', color: '#475569' }} />
                    </TableCell>
                    <TableCell sx={{ px: 2 }}>
                      <Chip label={trf.status} size="small" color={trf.status === 'Completed' ? 'error' : (trf.status === 'Partially Received' ? 'info' : (trf.status === 'Initiated' ? 'success' : 'default'))} variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 2, whiteSpace: 'nowrap' }}>
                      <IconButton
                        size="small"
                        disabled={trf.status === 'Completed'}
                        onClick={(e) => { e.stopPropagation(); openViewTransferModal(trf); }}
                        sx={{ color: trf.status === 'Completed' ? 'action.disabled' : '#10B981', mr: 1 }}
                      >
                        <CheckCircle fontSize="small" />
                      </IconButton>
                      <Tooltip title="Complete Transfer">
                        <IconButton
                          size="small"
                          disabled={trf.status === 'Completed'}
                          onClick={(e) => { e.stopPropagation(); openViewTransferModal(trf); }}
                          sx={{ color: trf.status === 'Completed' ? 'action.disabled' : '#EF4444' }}
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

      {/* STOCK TRANSFER MODAL */}
      <Dialog open={transferModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setTransferModal({ ...transferModal, open: false }); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <SwapHoriz fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Stock Transfer</Typography>
                <Typography variant="body2" color="text.secondary">Move materials between different stores or locations</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setTransferModal({ ...transferModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>From Store</InputLabel>
                <Select
                  label="From Store"
                  value={transferModal.from_warehouse_id}
                  onChange={e => setTransferModal({ ...transferModal, from_warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>To Store</InputLabel>
                <Select
                  label="To Store"
                  value={transferModal.to_warehouse_id}
                  onChange={e => setTransferModal({ ...transferModal, to_warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#2563EB', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Transfer Remarks"
                value={transferModal.remarks}
                onChange={e => setTransferModal({ ...transferModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>Transfer Items</Typography>
            <Button size="small" startIcon={<Add />} onClick={addTransferItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '45%' }}>MATERIAL</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '30%' }}>REMARKS</TableCell>
                  <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferModal.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <MaterialSelect
                        materials={materials}
                        value={item.material_id}
                        onChange={(val) => updateTransferItem(idx, 'material_id', val)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ step: "1", min: "0" }}
                        onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                        fullWidth
                        value={item.quantity}
                        onChange={e => updateTransferItem(idx, 'quantity', Math.round(parseFloat(e.target.value.replace(/-/g, '')) || 0))}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small" fullWidth value={item.remarks}
                        onChange={e => updateTransferItem(idx, 'remarks', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 16 }} /></InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeTransferItem(idx)} disabled={transferModal.items.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ bgcolor: '#EFF6FF', p: 2, borderRadius: 2, border: '1px solid #BFDBFE' }}>
            <Typography variant="caption" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
              <InfoOutlined fontSize="inherit" /> Stock will be transferred and updated only after physical receipt and verification at the destination store.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setTransferModal({ ...transferModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button
            onClick={handleTransferSubmit}
            variant="contained"
            sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none' }}
          >
            Initiate Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW TRANSFER MODAL */}
      <Dialog open={viewTransferModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setViewTransferModal({ open: false, transfer: null }); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {viewTransferModal.transfer && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Transfer Details - {viewTransferModal.transfer.transfer_number}</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(viewTransferModal.transfer.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">From Store</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewTransferModal.transfer.from_warehouse_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">To Store</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewTransferModal.transfer.to_warehouse_name}</Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={viewTransferModal.transfer.status}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                </Grid>
                {viewTransferModal.transfer.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Remarks</Typography>
                    <Typography variant="body2">{viewTransferModal.transfer.remarks}</Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#1E293B' }}>Transferred Items</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>UOM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>SENT QTY</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>RECEIVED QTY</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>REMARKS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewTransferModal.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{item.material_name}</Typography>
                          {item.material_code && <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>}
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748B' }}>{item.uom_name || 'unit'}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.quantity}</Typography>
                        </TableCell>
                        {['Initiated', 'Partially Received'].includes(viewTransferModal.transfer.status) ? (
                          <>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ step: "1", min: "0", max: item.quantity }}
                                onKeyDown={e => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                sx={{ width: 100 }}
                                value={item.received_qty}
                                onChange={e => {
                                  const newItems = [...viewTransferModal.items];
                                  newItems[idx].received_qty = e.target.value ? Math.round(parseFloat(e.target.value.replace(/-/g, ''))) : '';
                                  setViewTransferModal({ ...viewTransferModal, items: newItems });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small" fullWidth value={item.receipt_remarks}
                                placeholder="Variance notes"
                                onChange={e => {
                                  const newItems = [...viewTransferModal.items];
                                  newItems[idx].receipt_remarks = e.target.value;
                                  setViewTransferModal({ ...viewTransferModal, items: newItems });
                                }}
                              />
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: item.received_qty !== item.quantity ? '#EF4444' : 'inherit' }}>
                                {item.received_qty !== null && item.received_qty !== '' ? item.received_qty : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: '#64748B' }}>{item.receipt_remarks || '-'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 4, pb: 4 }}>
              <Button onClick={() => setViewTransferModal({ open: false, transfer: null, items: [] })} sx={{ color: '#64748B' }}>Close</Button>
              {['Initiated', 'Partially Received'].includes(viewTransferModal.transfer.status) && (
                <Button
                  onClick={handleReceiveSubmit}
                  variant="contained"
                  sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
                >
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
