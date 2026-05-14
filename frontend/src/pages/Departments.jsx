import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Grid, MenuItem, 
  IconButton, Tooltip, Select, FormControl, InputLabel, TableSortLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import { 
  Add, Search, Edit, Delete, Domain, Business, AccountBalance, FilterList 
} from '@mui/icons-material';
import api from '../services/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [form, setForm] = useState({ name: '', building_id: '', accounting_code: '', code: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const formRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/api/departments').then(r => setDepartments(r.data)).finally(() => setLoading(false));
    api.get('/api/buildings').then(r => setBuildings(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedDepartments = useMemo(() => {
    let filtered = departments.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          (d.code || '').toLowerCase().includes(search.toLowerCase());
      const matchesBuilding = buildingFilter === 'all' || d.building_id === buildingFilter;
      return matchesSearch && matchesBuilding;
    });

    return filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key] || '';
      let bVal = b[key] || '';

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [departments, search, buildingFilter, sortConfig]);

  const handleSave = async () => {
    if (!form.name?.trim()) return alert('Department name is required.');
    if (!form.building_id) return alert('Building is required.');

    try {
      const payload = {
        name: form.name.trim(),
        building_id: form.building_id,
        accounting_code: form.accounting_code || null,
      };

      if (editing) {
        await api.put(`/api/departments/${editing}`, payload);
      } else {
        await api.post('/api/departments', payload);
      }
      
      setEditing(null);
      setForm({ name: '', building_id: '', accounting_code: '', code: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving department');
    }
  };

  const handleEdit = (dept) => {
    setEditing(dept.id);
    setForm({
      name: dept.name,
      building_id: dept.building_id,
      accounting_code: dept.accounting_code || '',
      code: dept.code || ''
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/api/departments/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error deleting department');
      setDeleteConfirm(null);
    }
  };

  return (
    <Box>
      {/* Integrated Header Section - Form Outside Card */}
      <Box ref={formRef} sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E3A8A', letterSpacing: '-0.02em' }}>
              Department Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              {editing ? 'Modify existing department' : 'Register a new functional unit'}
            </Typography>
          </Box>
          {editing && (
             <Button 
               variant="outlined" 
               size="small"
               onClick={() => { setEditing(null); setForm({ name: '', building_id: '', accounting_code: '', code: '' }); }}
               sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
             >
               Cancel Edit
             </Button>
          )}
        </Box>

        {/* Compact Form Layout */}
        <Grid container spacing={1.5} alignItems="flex-end">
          <Grid item xs={12} sm={3.5}>
            <TextField 
              fullWidth size="small" label="Department Name" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Domain sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>, sx: { borderRadius: '10px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={3.5}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Building</InputLabel>
              <Select 
                label="Building"
                value={form.building_id} 
                onChange={e => setForm({ ...form, building_id: e.target.value })}
                startAdornment={<InputAdornment position="start"><Business sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                sx={{ borderRadius: '10px' }}
              >
                {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField 
              fullWidth size="small" label="Accounting Code"
              value={form.accounting_code} onChange={e => setForm({ ...form, accounting_code: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalance sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>, sx: { borderRadius: '10px' } }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              fullWidth variant="contained" onClick={handleSave} 
              sx={{ borderRadius: '10px', py: 1, fontWeight: 700, textTransform: 'none', bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172554' }, height: '40px' }}
            >
              {editing ? 'Update' : 'Add New'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 4, borderColor: '#E2E8F0' }} />

      {/* List & Combined Filter Bar */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
        <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <TextField 
            size="small" 
            placeholder="Search by code or name..." 
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ width: '33%', minWidth: 200, bgcolor: 'white', borderRadius: '10px' }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} />, sx: { borderRadius: '10px' } }}
          />
          
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: '10px' }}>
            <Select 
              value={buildingFilter} 
              onChange={e => setBuildingFilter(e.target.value)}
              displayEmpty
              startAdornment={<InputAdornment position="start"><FilterList sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="all">All Buildings</MenuItem>
              {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.2, width: '15%' }}>
                  <TableSortLabel active={sortConfig.key === 'code'} direction={sortConfig.direction} onClick={() => handleSort('code')}>CODE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '30%' }}>
                  <TableSortLabel active={sortConfig.key === 'name'} direction={sortConfig.direction} onClick={() => handleSort('name')}>DEPARTMENT NAME</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '25%' }}>
                  <TableSortLabel active={sortConfig.key === 'building_name'} direction={sortConfig.direction} onClick={() => handleSort('building_name')}>BUILDING</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: '20%' }}>
                  <TableSortLabel active={sortConfig.key === 'accounting_code'} direction={sortConfig.direction} onClick={() => handleSort('accounting_code')}>ACCOUNTING CODE</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: '10%' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDepartments.map(d => (
                <TableRow key={d.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell><Chip label={d.code || '-'} size="small" sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569', borderRadius: 1.2 }} /></TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{d.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Business sx={{ fontSize: 14 }} /> {d.building_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#64748B', fontSize: '0.8rem' }}>{d.accounting_code || '—'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.2 }}>
                      <IconButton size="small" onClick={() => handleEdit(d)} sx={{ color: '#64748B' }}><Edit sx={{ fontSize: 18 }} /></IconButton>
                      <IconButton size="small" onClick={() => setDeleteConfirm(d)} color="error"><Delete sx={{ fontSize: 18 }} /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {sortedDepartments.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>No departments matching your criteria were found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the <strong>{deleteConfirm?.name}</strong> department? 
            This action cannot be undone and will fail if the department is currently in use.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}>Delete Department</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
