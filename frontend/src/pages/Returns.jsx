import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Collapse
} from '@mui/material';
import { Add, Delete, Close, Undo, Warehouse, AccountTree, Business, Person, Comment, InfoOutlined, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';

function ReturnRow({ ret }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{ret.return_number}</TableCell>
        <TableCell>{formatDate(ret.created_at)}</TableCell>
        <TableCell>{ret.project_name} {ret.room_name ? `(${ret.room_name})` : ''}</TableCell>
        <TableCell>{ret.warehouse_name}</TableCell>
        <TableCell><Chip label={ret.return_type} size="small" sx={{ fontWeight: 600, bgcolor: '#EFF6FF', color: '#2563EB' }} /></TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, borderLeft: '2px solid #2563EB', pl: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Returned Items
              </Typography>
              <Table size="small" aria-label="items">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>MATERIAL</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>QTY</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>CONDITION</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>REMARKS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ret.items?.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{item.material_name}</TableCell>
                      <TableCell>{item.quantity} {item.uom_name}</TableCell>
                      <TableCell>
                        <Chip label={item.condition} size="small" color={item.condition === 'Good' || item.condition === 'Usable' ? 'success' : 'warning'} variant="outlined" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{item.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {ret.remarks && (
                  <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic', mt: 1, display: 'block' }}>
                    Note: {ret.remarks}
                  </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function Returns() {
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

  const load = async () => {
    try {
      const retRes = await api.get('/api/returns');
      setReturns(retRes.data);
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
      items: [{ material_id: '', quantity: 0, condition: 'Usable', remarks: '' }]
    });
  };

  const handleReturnSubmit = async () => {
    try {
      if (!returnModal.warehouse_id || !returnModal.project_id) {
        alert('Please select warehouse and project');
        return;
      }
      const validItems = returnModal.items.filter(it => it.material_id && it.quantity > 0);
      if (validItems.length === 0) {
        alert('Please add at least one material with quantity');
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
          quantity: Math.round(parseFloat(it.quantity)),
          condition: it.condition,
          remarks: it.remarks
        }))
      };
      await api.post('/api/returns', payload);
      setReturnModal({ ...returnModal, open: false });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const addReturnItem = () => {
    setReturnModal({
      ...returnModal,
      items: [...returnModal.items, { material_id: '', quantity: 0, condition: 'Usable', remarks: '' }]
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
          <Box sx={{ fontSize: '1.5rem' }}>🔄</Box>
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
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
          <Table aria-label="returns table">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ width: 50 }} />
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>RETURN #</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>FROM</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>TO WAREHOUSE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>TYPE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returns.map(ret => (
                <ReturnRow key={ret.id} ret={ret} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* INITIATE RETURN MODAL */}
      <Dialog open={returnModal.open} onClose={() => setReturnModal({ ...returnModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
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
              <FormControl fullWidth size="small">
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
              <TextField 
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
            <Button size="small" startIcon={<Add />} onClick={addReturnItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
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
                        materials={materials} 
                        value={item.material_id} 
                        onChange={(val) => updateReturnItem(idx, 'material_id', val)}
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
                        onChange={e => updateReturnItem(idx, 'quantity', Math.round(parseFloat(e.target.value.replace(/-/g, '')) || 0))} 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
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
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="inherit" /> Stock will be automatically increased in the target warehouse upon submission.
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
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
