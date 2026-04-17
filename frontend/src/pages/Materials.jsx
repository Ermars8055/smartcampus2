import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, IconButton,
  Tooltip, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Search, Edit, Inventory2 } from '@mui/icons-material';
import api from '../services/api';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: '', name: '', category_id: '', uom_id: '', reorder_level: 0,
    maximum_level: 0, standard_cost: 0, storage_type: 'General', description: ''
  });

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (catFilter) params.category_id = catFilter;
    api.get('/api/materials', { params }).then(r => setMaterials(r.data.items || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/categories'),
      api.get('/api/uom'),
      api.get('/api/vendors'),
    ]).then(([c, u, v]) => {
      setCategories(c.data);
      setUoms(u.data);
      setVendors(v.data);
    });
  }, []);

  useEffect(() => { load(); }, [search, catFilter]);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/api/materials/${editing}`, form);
      } else {
        await api.post('/api/materials', form);
      }
      setDialog(false);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving material');
    }
  };

  const openEdit = (m) => {
    setEditing(m.id);
    setForm({
      code: m.code, name: m.name, category_id: m.category_id, uom_id: m.uom_id,
      reorder_level: m.reorder_level, maximum_level: m.maximum_level,
      standard_cost: m.standard_cost, storage_type: m.storage_type || 'General',
      description: m.description || '', subcategory_id: m.subcategory_id || '',
      preferred_vendor_id: m.preferred_vendor_id || ''
    });
    setDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', name: '', category_id: '', uom_id: '', reorder_level: 0,
      maximum_level: 0, standard_cost: 0, storage_type: 'General', description: '' });
    setDialog(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Material Master</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{materials.length} materials</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>Add Material</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search materials..." value={search}
            onChange={e => setSearch(e.target.value)} sx={{ minWidth: 260 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={catFilter} label="Category" onChange={e => setCatFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Material Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>UOM</TableCell>
                <TableCell align="right">Cost (₹)</TableCell>
                <TableCell align="right">Reorder</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map(m => (
                <TableRow key={m.id}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#2563EB' }}>{m.code}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{m.name}</TableCell>
                  <TableCell><Chip label={m.category_name} size="small" variant="outlined" /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{m.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{m.standard_cost?.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{m.reorder_level}</TableCell>
                  <TableCell align="right">
                    <Chip label={m.current_stock || 0} size="small"
                      color={(m.current_stock || 0) < m.reorder_level ? 'error' : 'success'}
                      sx={{ fontWeight: 600, minWidth: 50 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={m.is_active ? 'Active' : 'Inactive'} size="small"
                      color={m.is_active ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {materials.length === 0 && (
                <TableRow><TableCell colSpan={9} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>No materials found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? 'Edit Material' : 'New Material'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Material Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required disabled={!!editing} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField fullWidth label="Material Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={form.category_id} label="Category" onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth><InputLabel>UOM</InputLabel>
                <Select value={form.uom_id} label="UOM" onChange={e => setForm({ ...form, uom_id: e.target.value })}>
                  {uoms.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Storage Type" value={form.storage_type} onChange={e => setForm({ ...form, storage_type: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Standard Cost (₹)" type="number" value={form.standard_cost} onChange={e => setForm({ ...form, standard_cost: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Reorder Level" type="number" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Maximum Level" type="number" value={form.maximum_level} onChange={e => setForm({ ...form, maximum_level: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
