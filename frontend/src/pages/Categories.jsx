import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import api from '../services/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [uomForm, setUomForm] = useState({ name: '', abbreviation: '' });
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get('/api/categories').then(r => setCategories(r.data));
    api.get('/api/uom').then(r => setUoms(r.data));
  };
  useEffect(() => { load(); }, []);

  const saveCategory = async () => {
    try {
      if (editing) await api.put(`/api/categories/${editing}`, form);
      else await api.post('/api/categories', form);
      setDialog(''); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const saveUom = async () => {
    if (!uomForm.name || uomForm.name.length > 50) return alert('UOM Name must be between 1 and 50 characters');
    if (!uomForm.abbreviation || uomForm.abbreviation.length > 10) return alert('Abbreviation must be between 1 and 10 characters');
    
    try {
      await api.post('/api/uom', uomForm);
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Master Data Configuration</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Material Categories</Typography>
              <Button size="small" startIcon={<Add />} onClick={() => {
                setEditing(null); setForm({ name: '', description: '' }); setDialog('category');
              }}>Add Category</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Category Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{c.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{c.description}</TableCell>
                      <TableCell><Chip label="Active" size="small" color="success" variant="outlined" /></TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => {
                          setEditing(c.id); setForm({ name: c.name, description: c.description || '' }); setDialog('category');
                        }}><Edit fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Units of Measure</Typography>
              <Button size="small" startIcon={<Add />} onClick={() => {
                setUomForm({ name: '', abbreviation: '' }); setDialog('uom');
              }}>Add UOM</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Abbreviation</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uoms.map(u => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{u.name}</TableCell>
                      <TableCell><Chip label={u.abbreviation} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell><Chip label="Active" size="small" color="success" variant="outlined" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Category Dialog */}
      <Dialog open={dialog === 'category'} onClose={() => setDialog('')} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Category Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} sx={{ mt: 1, mb: 2 }} required />
          <TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog('')}>Cancel</Button><Button variant="contained" onClick={saveCategory}>Save</Button></DialogActions>
      </Dialog>

      {/* UOM Dialog */}
      <Dialog open={dialog === 'uom'} onClose={() => setDialog('')} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>New Unit of Measure</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="UOM Name" value={uomForm.name} onChange={e => setUomForm({ ...uomForm, name: e.target.value })} sx={{ mt: 1, mb: 2 }} required inputProps={{ maxLength: 50 }} />
          <TextField fullWidth label="Abbreviation" value={uomForm.abbreviation} onChange={e => setUomForm({ ...uomForm, abbreviation: e.target.value })} required inputProps={{ maxLength: 10 }} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog('')}>Cancel</Button><Button variant="contained" onClick={saveUom}>Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
