import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
  IconButton, Chip
} from '@mui/material';
import { Add, Edit, Delete, Warehouse as WarehouseIcon, Business, VpnKey, LocationOn, Apartment, Search, Person } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../services/api';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({});

  const load = () => {
    api.get('/api/warehouses', { params: { search: search || undefined } }).then(r => setWarehouses(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim()) {
      return alert("Name is required.");
    }
    const payload = { ...form };
    if (!form.id && !payload.code) delete payload.code;

    try {
      if (form.id) {
        await api.put(`/api/warehouses/${form.id}`, payload);
      } else {
        await api.post('/api/warehouses', payload);
      }
      setDialogOpen(false);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error saving warehouse'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this warehouse?`)) return;
    try {
      await api.delete(`/api/warehouses/${id}`);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error deleting warehouse'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Warehouse Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => { setForm({ name: '', code: '', project_id: projects[0]?.id || '', warehouse_type: 'Central', location: '', manager_name: '' }); setDialogOpen(true); }}
          sx={{ bgcolor: '#1E3A8A' }}
        >
          New Warehouse
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search warehouse name..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      <TableContainer component={Card} sx={{ borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Warehouse Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warehouses.map(w => (
              <TableRow key={w.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{w.name}</TableCell>
                <TableCell><Chip label={w.code} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={w.warehouse_type} size="small" color="primary" variant="outlined" /></TableCell>
                <TableCell>{w.location}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => { setForm({...w, project_id: w.project_id || projects[0]?.id || ''}); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(w.id)} color="error"><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {warehouses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No warehouses found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{form.id ? 'Edit' : 'New'} Warehouse</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Name" size="small" value={form.name || ''} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><WarehouseIcon sx={{ fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Code" size="small" value={form.code || ''} 
                onChange={e => setForm({ ...form, code: e.target.value })} 
                placeholder="Auto-generated"
                disabled
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><VpnKey sx={{ fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Type" size="small" value={form.warehouse_type || ''} 
                onChange={e => setForm({ ...form, warehouse_type: e.target.value })} 
                placeholder="e.g. Central, Site Store"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>Project</InputLabel>
                <Select
                  value={form.project_id || ''}
                  onChange={e => setForm({ ...form, project_id: e.target.value })}
                  label="Project"
                  displayEmpty
                  startAdornment={<InputAdornment position="start"><Business sx={{ fontSize: 18 }} /></InputAdornment>}
                >
                  {projects.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Location" size="small" value={form.location || ''} 
                onChange={e => setForm({ ...form, location: e.target.value })} 
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField 
                fullWidth label="Manager Name" size="small" value={form.manager_name || ''} 
                onChange={e => setForm({ ...form, manager_name: e.target.value })} 
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18 }} /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: '#1E3A8A' }}>Save Warehouse</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
