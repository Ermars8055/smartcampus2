import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem
} from '@mui/material';
import { Add, Delete, Close, SwapHoriz, Warehouse, AccountTree, Comment, InfoOutlined } from '@mui/icons-material';
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
      from_warehouse_id: warehouses[0]?.id || '',
      to_warehouse_id: warehouses[1]?.id || warehouses[0]?.id || '',
      project_id: projects[0]?.id || '',
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
        project_id: transferModal.project_id,
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
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
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
          <Box sx={{ fontSize: '1.5rem' }}>🚛</Box>
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
        <Grid container spacing={3}>
          {transfers.map(trf => (
            <Grid item xs={12} key={trf.id}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>{trf.transfer_number}</Typography>
                      <Chip label={trf.status} size="small" color="success" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748B' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{trf.from_warehouse_name}</Typography>
                      <SwapHoriz sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{trf.to_warehouse_name}</Typography>
                    </Box>
                    {trf.project_name && (
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                        Project: {trf.project_name}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>{formatDate(trf.created_at)}</Typography>
                  </Box>
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
                  <Table size="small" sx={{ 
                    '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
                  }}>
                    <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>ITEM</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>QTY</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>REMARKS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trf.items?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.material_name}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>{item.quantity} {item.uom_name}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{item.remarks || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {trf.remarks && (
                  <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                    Note: {trf.remarks}
                  </Typography>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* STOCK TRANSFER MODAL */}
      <Dialog open={transferModal.open} onClose={() => setTransferModal({ ...transferModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <SwapHoriz fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Stock Transfer</Typography>
                <Typography variant="body2" color="text.secondary">Move materials between different warehouses or locations</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setTransferModal({ ...transferModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Associated Project</InputLabel>
                <Select 
                  label="Associated Project"
                  value={transferModal.project_id} 
                  onChange={e => setTransferModal({ ...transferModal, project_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>)}
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
              <InfoOutlined fontSize="inherit" /> Stock will be deducted from the source and added to the destination warehouse immediately.
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
            Complete Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
