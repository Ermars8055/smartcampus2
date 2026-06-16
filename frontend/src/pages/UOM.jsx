import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, InputAdornment, TableSortLabel, IconButton
} from '@mui/material';
import { Add, Straighten, Abc, Edit } from '@mui/icons-material';
import api from '../services/api';

export default function UOM() {
  const [uoms, setUoms] = useState([]);
  const [dialog, setDialog] = useState('');
  const [uomSortConfig, setUomSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [uomForm, setUomForm] = useState({ id: null, name: '', abbreviation: '' });

  const load = () => {
    api.get('/api/uom').then(r => setUoms(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleUomSort = (key) => {
    let direction = 'asc';
    if (uomSortConfig.key === key && uomSortConfig.direction === 'asc') direction = 'desc';
    setUomSortConfig({ key, direction });
  };

  const sortedUoms = [...uoms].sort((a, b) => {
    const aVal = a[uomSortConfig.key] || '';
    const bVal = b[uomSortConfig.key] || '';
    if (aVal < bVal) return uomSortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return uomSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const saveUom = async () => {
    if (!uomForm.name || uomForm.name.trim().length < 2 || uomForm.name.length > 50) {
      return alert('UOM Name must be between 2 and 50 characters');
    }
    if (!uomForm.abbreviation || uomForm.abbreviation.trim().length < 1 || uomForm.abbreviation.length > 10) {
      return alert('Abbreviation must be between 1 and 10 characters');
    }
    
    try {
      if (uomForm.id) {
        await api.put(`/api/uom/${uomForm.id}`, uomForm);
      } else {
        await api.post('/api/uom', uomForm);
      }
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error saving UOM'); }
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
            onClick={() => { setUomForm({ id: null, name: '', abbreviation: '' }); setDialog('uom'); }}
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
                  <TableSortLabel 
                    active={uomSortConfig.key === 'name'} 
                    direction={uomSortConfig.direction} 
                    onClick={() => handleUomSort('name')}
                  >
                    NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel 
                    active={uomSortConfig.key === 'abbreviation'} 
                    direction={uomSortConfig.direction} 
                    onClick={() => handleUomSort('abbreviation')}
                  >
                    ABBREVIATION
                  </TableSortLabel>
                </TableCell>
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
                      label="Active" 
                      size="small" 
                      sx={{ 
                        bgcolor: '#ECFDF5', 
                        color: '#10B981', 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        border: '1px solid #10B981',
                        borderRadius: '6px',
                        height: 24
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setUomForm({ id: u.id, name: u.name, abbreviation: u.abbreviation }); setDialog('uom'); }}>
                      <Edit fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog === 'uom'} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(''); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#F5F3FF', borderRadius: 2, color: '#7C3AED', display: 'flex' }}>
              <Straighten fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {uomForm.id ? 'Edit Unit of Measure' : 'New Unit of Measure'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {uomForm.id ? 'Update standard measurement unit details.' : 'Create a standard measurement unit for tracking stock.'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>UOM Name *</Typography>
            <TextField 
              fullWidth 
              size="small"
              value={uomForm.name} 
              onChange={e => setUomForm({ ...uomForm, name: e.target.value })} 
              sx={{ mb: 3 }} 
              required 
              inputProps={{ maxLength: 50 }} 
              InputProps={{
                startAdornment: <InputAdornment position="start"><Straighten sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px' }
              }}
            />
            
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Abbreviation *</Typography>
            <TextField 
              fullWidth 
              size="small"
              value={uomForm.abbreviation} 
              onChange={e => setUomForm({ ...uomForm, abbreviation: e.target.value })} 
              required 
              inputProps={{ maxLength: 10 }} 
              InputProps={{
                startAdornment: <InputAdornment position="start"><Abc sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, gap: 2 }}>
          <Button onClick={() => setDialog('')} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveUom}
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
    </Box>
  );
}
