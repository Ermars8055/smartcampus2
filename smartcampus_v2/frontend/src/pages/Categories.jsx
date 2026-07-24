import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip, InputAdornment, Snackbar, Alert, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, Category, Description, Abc } from '@mui/icons-material';
import { TableSortLabel } from '@mui/material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function Categories() {
  const { showMessage } = useMessage();
  const [categories, setCategories] = useState([]);
  const [dialog, setDialog] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });
  const [form, setForm] = useState({ name: '', description: '', material_code_prefix: '', code: '', has_materials: false, is_active: true });
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = () => {
    api.get('/api/categories?include_inactive=true').then(r => setCategories(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const saveCategory = async () => {
    const newErrors = {};
    if (!form.name || form.name.trim().length === 0) {
      newErrors.name = 'Category Name is required';
    }
    if (!form.material_code_prefix || form.material_code_prefix.trim().length === 0) {
      newErrors.material_code_prefix = 'Material Code Prefix is required';
    } else {
      const prefix = form.material_code_prefix.trim();
      if (!/^[A-Za-z]{3}$/.test(prefix)) {
        newErrors.material_code_prefix = 'Prefix must be exactly 3 alphabetical characters (A-Z)';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const payload = { ...form };

    try {
      if (editing) await api.put(`/api/categories/${editing}`, payload);
      else await api.post('/api/categories', payload);
      setDialog(''); setEditing(null); setErrors({}); load();
      setSnackbar({ open: true, message: 'Category saved successfully!', severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') showMessage(detail, 'Validation Error', 'warning');
      else if (Array.isArray(detail)) showMessage(detail.map(d => d.msg).join('\n'), 'Validation Error', 'warning');
      else showMessage('Error saving category', 'Error', 'error');
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: '#1E293B', letterSpacing: '-0.025em' }}>
        Material Categories
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
            Material Categories
          </Typography>
          <Button 
            variant="text" 
            startIcon={<Add />} 
            onClick={() => { setEditing(null); setForm({ name: '', description: '', material_code_prefix: '', code: '', has_materials: false, is_active: true }); setErrors({}); setDialog('category'); }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#2563EB' }}
          >
            Add Category
          </Button>
        </Box>
        <TableContainer sx={{ px: 2, pb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'code'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('code')}
                  >
                    CODE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'name'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('name')}
                  >
                    CATEGORY NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>MATERIAL CODE PREFIX</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCategories.map((c, idx) => (
                <TableRow key={c.id} sx={{ '&:hover': { bgcolor: '#FBFDFF' } }}>
                  <TableCell sx={{ color: '#2563EB', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.code || '—'}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>{c.name}</TableCell>
                  <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>{c.material_code_prefix || '—'}</TableCell>
                  <TableCell sx={{ color: '#64748B', fontSize: '0.85rem', maxWidth: 200 }}>
                    {c.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={c.is_active ? 'Active' : 'Inactive'} 
                      size="small" 
                      sx={{ 
                        bgcolor: c.is_active ? '#ECFDF5' : '#F1F5F9', 
                        color: c.is_active ? '#10B981' : '#64748B', 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        border: `1px solid ${c.is_active ? '#10B981' : '#CBD5E1'}`,
                        borderRadius: '6px',
                        height: 24
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => {
                      setEditing(c.id); setForm({ name: c.name, description: c.description || '', material_code_prefix: c.material_code_prefix || '', code: c.code || '', has_materials: c.has_materials || false, is_active: c.is_active !== false }); setErrors({}); setDialog('category');
                    }} sx={{ color: '#64748B' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog === 'category'} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(''); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <Category fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {editing ? 'Edit Category' : 'New Category'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Define a new grouping for your materials.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ mt: 2 }}>
            {editing && form.code && (
              <>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Category Code</Typography>
                <TextField 
                  fullWidth 
                  size="small"
                  value={form.code} 
                  sx={{ mb: 3, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#64748B', color: '#64748B' } }} 
                  disabled
                  InputProps={{
                    sx: { borderRadius: '12px', bgcolor: '#F8FAFC' }
                  }}
                />
              </>
            )}

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Category Name *</Typography>
            <TextField 
              fullWidth 
              size="small"
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              sx={{ mb: 3 }} 
              required 
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Category sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px' }
              }}
            />
            
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Material Code Prefix (3 Chars) *</Typography>
            <TextField 
              fullWidth 
              size="small"
              value={form.material_code_prefix} 
              onChange={e => setForm({ ...form, material_code_prefix: e.target.value.toUpperCase() })} 
              sx={{ mb: 3, ...(form.has_materials && {'& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#64748B', color: '#64748B' }}) }} 
              disabled={form.has_materials}
              required
              error={!!errors.material_code_prefix}
              helperText={errors.material_code_prefix}
              inputProps={{ maxLength: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Abc sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px', ...(form.has_materials && { bgcolor: '#F8FAFC' }) }
              }}
            />

            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Description</Typography>
            <TextField 
              fullWidth 
              size="small"
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              multiline 
              rows={3} 
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><Description sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px' }
              }}
            />

            <FormControlLabel 
              control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} color="success" />} 
              label="Active Status" 
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, gap: 2 }}>
          <Button onClick={() => setDialog('')} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveCategory}
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
