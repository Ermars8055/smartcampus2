import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, IconButton, Tooltip, Rating
} from '@mui/material';
import { Add, Edit, Search, Store } from '@mui/icons-material';
import api from '../services/api';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', code: '', contact_person: '', phone: '', email: '',
    gst_number: '', address: '', city: '', state: '', category_ids: []
  });

  const load = () => {
    api.get('/api/vendors', { params: { search: search || undefined } }).then(r => setVendors(r.data));
  };

  useEffect(() => { load(); api.get('/api/categories').then(r => setCategories(r.data)); }, []);
  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    try {
      if (editing) { await api.put(`/api/vendors/${editing}`, form); }
      else { await api.post('/api/vendors', form); }
      setDialog(false); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const openEdit = (v) => {
    setEditing(v.id);
    api.get(`/api/vendors/${v.id}`).then(r => {
      setForm({ ...r.data, category_ids: r.data.category_ids || [] });
      setDialog(true);
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Vendor Master</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{vendors.length} vendors</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setEditing(null);
          setForm({ name: '', code: '', contact_person: '', phone: '', email: '', gst_number: '', address: '', city: '', state: '', category_ids: [] });
          setDialog(true);
        }}>Add Vendor</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search vendors..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> } }} />
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Code</TableCell>
                <TableCell>Vendor Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>GST</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Categories</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map(v => (
                <TableRow key={v.id}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{v.code}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{v.name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{v.contact_person}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{v.phone}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>{v.gst_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{v.city}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {v.categories?.map((c, i) => <Chip key={i} label={c} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />)}
                    </Box>
                  </TableCell>
                  <TableCell><Rating value={v.rating} precision={0.5} size="small" readOnly /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(v)}><Edit fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Vendor Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required disabled={!!editing} /></Grid>
            <Grid size={{ xs: 12, sm: 8 }}><TextField fullWidth label="Vendor Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Contact Person" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="GST Number" value={form.gst_number} onChange={e => setForm({ ...form, gst_number: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} multiline rows={2} /></Grid>
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
