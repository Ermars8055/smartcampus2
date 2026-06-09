import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
  IconButton, Chip, TableSortLabel, useTheme, useMediaQuery
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
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = () => {
    api.get('/api/warehouses', { params: { search: search || undefined } }).then(r => setWarehouses(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
  };

  useEffect(() => { load(); }, [search]);
  useEffect(() => { load(); }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedWarehouses = useMemo(() => {
    return [...warehouses].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key] || '';
      let bVal = b[key] || '';
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [warehouses, sortConfig]);

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
    } catch (err) { alert(err.response?.data?.detail || 'Error saving store'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this store?`)) return;
    try {
      await api.delete(`/api/warehouses/${id}`);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error deleting warehouse'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Store Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setForm({ name: '', code: '', project_id: projects[0]?.id || '', warehouse_type: 'Central', location: '', manager_name: '' }); setDialogOpen(true); }}
          sx={{ bgcolor: '#1E3A8A' }}
        >
          New Store
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <TextField size="small" placeholder="Search by store name or code..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: 350 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
      </Card>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {sortedWarehouses.length === 0 && (
            <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
              No stores found.
            </Typography>
          )}
          {sortedWarehouses.map(w => (
            <Card key={w.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => { setForm({ ...w, project_id: w.project_id || projects[0]?.id || '' }); setDialogOpen(true); }}>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1, alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>{w.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#2563EB' }}>{w.code}</Typography>
                  </Box>
                  <Chip label={w.warehouse_type} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
               </Box>
               <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Location:</strong> {w.location || '-'}</Typography>
               <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}><strong>Manager:</strong> {w.manager_name || '-'}</Typography>
               <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Box onClick={e => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => { setForm({ ...w, project_id: w.project_id || projects[0]?.id || '' }); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(w.id)} color="error"><Delete fontSize="small" /></IconButton>
                  </Box>
               </Box>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer component={Card} sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel active={sortConfig.key === 'code'} direction={sortConfig.direction} onClick={() => handleSort('code')}>CODE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel active={sortConfig.key === 'name'} direction={sortConfig.direction} onClick={() => handleSort('name')}>STORE NAME</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel active={sortConfig.key === 'warehouse_type'} direction={sortConfig.direction} onClick={() => handleSort('warehouse_type')}>TYPE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel active={sortConfig.key === 'location'} direction={sortConfig.direction} onClick={() => handleSort('location')}>LOCATION</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedWarehouses.map(w => (
                <TableRow key={w.id} hover onClick={() => { setForm({ ...w, project_id: w.project_id || projects[0]?.id || '' }); setDialogOpen(true); }} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>{w.code}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{w.name}</TableCell>
                  <TableCell><Chip label={w.warehouse_type} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>{w.location}</TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => { setForm({ ...w, project_id: w.project_id || projects[0]?.id || '' }); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(w.id)} color="error"><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {warehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No stores found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialogOpen(false); }} maxWidth="sm" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <WarehouseIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{form.id ? 'Edit' : 'New'} Store</Typography>
              <Typography variant="body2" color="text.secondary">{form.id ? 'Update store details.' : 'Register a new store location.'}</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth label="Code" value={form.code || ''}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="Auto-generated"
                disabled
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><VpnKey sx={{ color: '#94A3B8' }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth label="Store Name" value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><WarehouseIcon sx={{ color: '#94A3B8' }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth label="Type" value={form.warehouse_type || ''}
                onChange={e => setForm({ ...form, warehouse_type: e.target.value })}
                placeholder="e.g. Central, Site Store"
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth label="Location" value={form.location || ''}
                onChange={e => setForm({ ...form, location: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#94A3B8' }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Manager Name" value={form.manager_name || ''}
                onChange={e => setForm({ ...form, manager_name: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8' }} /></InputAdornment> }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}>Save Store</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
