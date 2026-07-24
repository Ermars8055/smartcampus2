import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, MenuItem,
  Select, FormControl, InputLabel, Checkbox, ListItemText, Autocomplete
} from '@mui/material';
import { Add, Edit, Delete, Inventory } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function MaterialAllowances() {
  const { showMessage } = useMessage();
  const [materialLimits, setMaterialLimits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ departments: [], material_id: null, material_name: '', monthly_limit: '' });

  const load = () => {
    api.get('/api/material-limits').then(r => setMaterialLimits(r.data || [])).catch(() => setMaterialLimits([]));
    api.get('/api/departments').then(r => setDepartments(r.data || [])).catch(() => setDepartments([]));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || r.data || [])).catch(() => setMaterials([]));
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Material Allowances</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setEditing(null);
          setForm({ departments: [], material_id: null, material_name: '', monthly_limit: '' });
          setDialog(true);
        }}>Set Allowance</Button>
      </Box>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Department</TableCell><TableCell>Material Code</TableCell><TableCell>Material Name</TableCell><TableCell>Monthly Limit</TableCell><TableCell>UOM</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {materialLimits.map(m => (
                <TableRow key={m.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{m.department}</TableCell>
                  <TableCell><Chip label={m.material_code} size="small" variant="outlined" /></TableCell>
                  <TableCell>{m.material_name}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{m.monthly_limit}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{m.uom_name || '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => {
                        setEditing(m.id);
                        setForm({ departments: [m.department], material_id: m.material_id, material_name: m.material_name, monthly_limit: m.monthly_limit });
                        setDialog(true);
                      }}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={async () => {
                        if(window.confirm('Delete this limit?')) {
                          try { await api.delete(`/api/material-limits/${m.id}`); load(); }
                          catch (err) { showMessage('Error deleting limit', 'Error', 'error'); }
                        }
                      }}><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {materialLimits.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No material allowances set.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <Inventory fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {editing ? 'Edit Allowance' : 'Set Allowance'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Restrict maximum monthly consumption.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!!editing}>
                <InputLabel>Departments</InputLabel>
                <Select 
                  multiple
                  value={form.departments || []} 
                  label="Departments" 
                  onChange={e => {
                    const val = e.target.value;
                    if (val.includes('ALL')) {
                      setForm({ ...form, departments: departments.map(d => d.name) });
                    } else {
                      setForm({ ...form, departments: typeof val === 'string' ? val.split(',') : val });
                    }
                  }}
                  renderValue={(selected) => selected.length === departments.length ? 'All Departments' : selected.join(', ')}
                >
                  <MenuItem value="ALL" sx={{ fontWeight: 600 }}>
                    <Checkbox checked={(form.departments || []).length === departments.length && departments.length > 0} indeterminate={(form.departments || []).length > 0 && (form.departments || []).length < departments.length} />
                    <ListItemText primary="All Departments" />
                  </MenuItem>
                  {departments.map(d => (
                    <MenuItem key={d.id} value={d.name}>
                      <Checkbox checked={(form.departments || []).includes(d.name)} />
                      <ListItemText primary={d.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                disabled={!!editing}
                options={materials}
                getOptionLabel={(option) => option.name ? `${option.code} - ${option.name}` : ''}
                value={materials.find(m => m.id === form.material_id) || null}
                onChange={(_, newValue) => setForm({ ...form, material_id: newValue?.id || null, material_name: newValue?.name || '' })}
                renderInput={(params) => <TextField {...params} label="Material" required />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                required 
                label="Monthly Limit" 
                type="number" 
                value={form.monthly_limit || ''} 
                onChange={e => setForm({ ...form, monthly_limit: e.target.value })} 
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }} onClick={async () => {
            try {
              if (!form.departments || form.departments.length === 0 || !form.material_id || !form.monthly_limit) return showMessage('Please fill all required fields', 'Validation Error', 'warning');
              
              if (editing) {
                const payload = { monthly_limit: Number(form.monthly_limit) };
                await api.put(`/api/material-limits/${editing}`, payload);
              } else {
                const payload = {
                  departments: form.departments,
                  material_id: form.material_id,
                  monthly_limit: Number(form.monthly_limit)
                };
                await api.post('/api/material-limits', payload);
              }
              setDialog(false); setEditing(null); load();
            } catch (err) {
              showMessage(err.response?.data?.detail || 'An error occurred while saving.', 'Error', 'error');
            }
          }}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
