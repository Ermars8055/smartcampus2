import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip, Select, MenuItem, FormControl, InputAdornment, TableSortLabel
} from '@mui/material';
import { Add, Edit, Category, ShortText } from '@mui/icons-material';
import api from '../services/api';

export default function SubCategories() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [dialog, setDialog] = useState('');
  const [subCatSortConfig, setSubCatSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [subCategoryForm, setSubCategoryForm] = useState({ name: '', category_id: '' });
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get('/api/categories').then(r => setCategories(r.data));
    api.get('/api/subcategories').then(r => setSubcategories(r.data));
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
    if (!subCategoryForm.name || subCategoryForm.name.trim().length < 2) {
      return alert('Sub Category Name must be at least 2 characters');
    }
    if (!subCategoryForm.category_id) {
      return alert('Please select a Parent Category');
    }
    try {
      if (editing) await api.put(`/api/subcategories/${editing}`, subCategoryForm);
      else await api.post('/api/subcategories', subCategoryForm);
      setDialog(''); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error saving Sub Category'); }
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
            variant="text" 
            startIcon={<Add />} 
            onClick={() => { setEditing(null); setSubCategoryForm({ name: '', category_id: '' }); setDialog('subcategory'); }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#2563EB' }}
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
                      setEditing(s.id); setSubCategoryForm({ name: s.name, category_id: s.category_id }); setDialog('subcategory');
                    }} sx={{ color: '#64748B' }}>
                      <Edit fontSize="small" />
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

      <Dialog open={dialog === 'subcategory'} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(''); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
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
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Parent Category *</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <Select
                value={subCategoryForm.category_id}
                onChange={e => setSubCategoryForm({ ...subCategoryForm, category_id: e.target.value })}
                displayEmpty
                sx={{ borderRadius: '12px' }}
              >
                <MenuItem value="" disabled>Select Parent Category</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1, display: 'block' }}>Sub Category Name *</Typography>
            <TextField 
              fullWidth 
              size="small"
              value={subCategoryForm.name} 
              onChange={e => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })} 
              required 
              InputProps={{
                startAdornment: <InputAdornment position="start"><ShortText sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                sx: { borderRadius: '12px' }
              }}
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
    </Box>
  );
}
