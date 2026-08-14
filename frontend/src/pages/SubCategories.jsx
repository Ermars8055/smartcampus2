import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip, Select, MenuItem, FormControl, InputLabel, InputAdornment, TableSortLabel, Snackbar, Alert, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, Category, ShortText, Subtitles } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function SubCategories() {
  const { showMessage } = useMessage();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [dialog, setDialog] = useState('');
  const [subCatSortConfig, setSubCatSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [form, setForm] = useState({ name: '', category_id: '', is_active: true });
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = () => {
    api.get('/api/categories').then(r => setCategories(r.data));
    api.get('/api/subcategories?include_inactive=true').then(r => setSubcategories(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleSubCatSort = (key) => {
    let direction = 'asc';
    if (subCatSortConfig.key === key && subCatSortConfig.direction === 'asc') direction = 'desc';
    setSubCatSortConfig({ key, direction });
  };

  const sortedSubcategories = [...subcategories].sort((a, b) => {
    const aVal = a[subCatSortConfig.key] || '';
    const bVal = b[subCatSortConfig.key] || '';
    if (aVal < bVal) return subCatSortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return subCatSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const saveSubCategory = async () => {
    const newErrors = {};
    if (!form.category_id) newErrors.category_id = 'Parent Category is required';
    if (!form.name || form.name.trim().length === 0) newErrors.name = 'Sub Category Name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      if (editing) await api.put(`/api/subcategories/${editing}`, form);
      else await api.post('/api/subcategories', form);
      setDialog(''); setEditing(null); setErrors({}); load();
      setSnackbar({ open: true, message: 'Sub Category saved successfully!', severity: 'success' });
    } catch (err) { showMessage(err.response?.data?.detail || 'Error saving Sub Category', 'Error', 'error'); }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: '#1E293B', letterSpacing: '-0.025em' }}>
        Sub Categories
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
            Sub Categories
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => { setEditing(null); setForm({ name: '', category_id: '', is_active: true }); setErrors({}); setDialog('subcat'); }}
          >
            Add Sub Category
          </Button>
        </Box>
        <TableContainer sx={{ px: 2, pb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel 
                    active={subCatSortConfig.key === 'name'} 
                    direction={subCatSortConfig.direction} 
                    onClick={() => handleSubCatSort('name')}
                  >
                    SUB CATEGORY NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>
                  <TableSortLabel 
                    active={subCatSortConfig.key === 'category_name'} 
                    direction={subCatSortConfig.direction} 
                    onClick={() => handleSubCatSort('category_name')}
                  >
                    PARENT CATEGORY
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.75rem', py: 2, bgcolor: '#F8FAFC' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSubcategories.map(s => (
                <TableRow key={s.id} sx={{ '&:hover': { bgcolor: '#FBFDFF' } }}>
                  <TableCell sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>{s.name}</TableCell>
                  <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>{s.category_name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={s.is_active ? "Active" : "Inactive"} 
                      size="small" 
                      sx={{ 
                        bgcolor: s.is_active ? '#ECFDF5' : '#F1F5F9', 
                        color: s.is_active ? '#10B981' : '#64748B', 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        border: `1px solid ${s.is_active ? '#10B981' : '#CBD5E1'}`,
                        borderRadius: '6px',
                        height: 24
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => {
                      setEditing(s.id); setForm({ name: s.name, category_id: s.category_id, is_active: s.is_active !== false }); setErrors({}); setDialog('subcat');
                    }} sx={{ color: '#64748B' }}>
                      <Edit color="primary" fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {sortedSubcategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#94A3B8' }}>No sub categories found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog === 'subcat'} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(''); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#FFFBEB', borderRadius: 2, color: '#D97706', display: 'flex' }}>
              <Category fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {editing ? 'Edit Sub Category' : 'New Sub Category'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Define a more specific classification for your materials.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <FormControl fullWidth size="small" required error={!!errors.category_id}>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                label="Parent Category"
                startAdornment={<InputAdornment position="start"><Category sx={{ color: '#94A3B8', fontSize: 20, ml: 1 }} /></InputAdornment>}
                sx={{ borderRadius: '12px' }}
              >
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
              {errors.category_id && <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>{errors.category_id}</Typography>}
            </FormControl>

            <TextField 
              fullWidth 
              size="small"
              label="Sub Category Name" 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              required 
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Subtitles sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px' }
              }}
            />
            
            <FormControlLabel 
              control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} color="success" />} 
              label="Active Status" 
              sx={{ ml: 0.5 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, gap: 2 }}>
          <Button onClick={() => setDialog('')} sx={{ fontWeight: 700, color: '#64748B', textTransform: 'none' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={saveSubCategory}
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
