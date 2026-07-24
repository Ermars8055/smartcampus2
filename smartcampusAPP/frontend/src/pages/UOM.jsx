import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, InputAdornment, TableSortLabel, IconButton, Switch, FormControlLabel, Snackbar, Alert, Checkbox
} from '@mui/material';
import { Add, Straighten, Abc, Edit, Scale } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function UOM() {
  const { showMessage } = useMessage();
  const [uoms, setUoms] = useState([]);
  const [dialog, setDialog] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [form, setForm] = useState({ name: '', abbreviation: '', allow_decimal: false, is_active: true });
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = () => {
    api.get('/api/uom?include_inactive=true').then(r => setUoms(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedUoms = [...uoms].sort((a, b) => {
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const saveUOM = async () => {
    const newErrors = {};
    if (!form.name || form.name.trim().length === 0) newErrors.name = 'UOM Name is required';
    if (!form.abbreviation || form.abbreviation.trim().length === 0) newErrors.abbreviation = 'Abbreviation is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      if (editing) await api.put(`/api/uom/${editing}`, form);
      else await api.post('/api/uom', form);
      setDialog(''); setEditing(null); setErrors({}); load();
      setSnackbar({ open: true, message: 'UOM saved successfully!', severity: 'success' });
    } catch (err) { showMessage(err.response?.data?.detail || 'Error saving UOM', 'Error', 'error'); }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: '#1E293B', letterSpacing: '-0.025em' }}>
        Units of Measure
      </Typography>

      <Card sx={{ 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.1rem' }}>
            Units of Measure
          </Typography>
          <Button 
            variant="text" 
            startIcon={<Add />} 
            onClick={() => { setEditing(null); setForm({ name: '', abbreviation: '', allow_decimal: false, is_active: true }); setErrors({}); setDialog('uom'); }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#2563EB' }}
          >
            Add UOM
          </Button>
        </Box>
        <TableContainer sx={{ px: 2, pb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel active={sortConfig.key === 'name'} direction={sortConfig.direction} onClick={() => handleSort('name')}>NAME</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel active={sortConfig.key === 'abbreviation'} direction={sortConfig.direction} onClick={() => handleSort('abbreviation')}>ABBREVIATION</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>DECIMALS ALLOWED</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUoms.map(u => (
                <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#FBFDFF' } }}>
                  <TableCell sx={{ fontWeight: 500, color: '#1E293B', fontSize: '0.9rem' }}>{u.name}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.85rem' }}>{u.abbreviation}</TableCell>
                  <TableCell>
                    <Chip 
                      label={u.allow_decimal ? "Yes" : "No"} 
                      size="small" 
                      sx={{ 
                        bgcolor: u.allow_decimal ? '#EFF6FF' : '#F1F5F9', 
                        color: u.allow_decimal ? '#3B82F6' : '#64748B', 
                        fontWeight: 600, fontSize: '0.75rem', border: `1px solid ${u.allow_decimal ? '#3B82F6' : '#CBD5E1'}`, borderRadius: '6px', height: 24
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={u.is_active ? 'Active' : 'Inactive'} 
                      size="small" 
                      sx={{ 
                        bgcolor: u.is_active ? '#ECFDF5' : '#F1F5F9', 
                        color: u.is_active ? '#10B981' : '#64748B', 
                        fontWeight: 600, fontSize: '0.75rem', border: `1px solid ${u.is_active ? '#10B981' : '#CBD5E1'}`, borderRadius: '6px', height: 24
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditing(u.id); setForm({ name: u.name, abbreviation: u.abbreviation, allow_decimal: u.allow_decimal, is_active: u.is_active !== false }); setErrors({}); setDialog('uom'); }}>
                      <Edit fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog === 'uom'} onClose={() => setDialog('')} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{editing ? 'Edit UOM' : 'New UOM'}</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>UOM Name *</Typography>
            <TextField 
              fullWidth size="small" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} 
              required error={!!errors.name} helperText={errors.name}
              InputProps={{ startAdornment: <InputAdornment position="start"><Scale sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
            />
            
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, mt: 2, display: 'block' }}>Abbreviation *</Typography>
            <TextField 
              fullWidth size="small" value={form.abbreviation} onChange={e => setForm({ ...form, abbreviation: e.target.value })} 
              required error={!!errors.abbreviation} helperText={errors.abbreviation}
              InputProps={{ startAdornment: <InputAdornment position="start"><Straighten sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
            />
            
            <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <FormControlLabel 
                control={<Checkbox checked={form.allow_decimal} onChange={e => setForm({ ...form, allow_decimal: e.target.checked })} />} 
                label="Allow Decimal Quantities" 
              />
              <FormControlLabel 
                control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} 
                label="Active Status" 
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, gap: 2 }}>
          <Button onClick={() => setDialog('')} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveUOM}
            sx={{ 
              borderRadius: '12px', 
              px: 4, 
              fontWeight: 700, 
              textTransform: 'none',
              bgcolor: '#1E3A8A',
              '&:hover': { bgcolor: '#172554' }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
