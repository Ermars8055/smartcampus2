import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl,
  IconButton, Chip, Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Divider
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, AccountTree, Apartment, Business, VpnKey, LocationOn, Layers, Work, Domain } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../services/api';

export default function Projects() {
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [deptDialog, setDeptDialog] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');
  const [deptForm, setDeptForm] = useState({ name: '', code: '', accounting_code: '', building_id: '' });
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({});

  const load = () => {
    api.get('/api/organizations').then(r => setOrgs(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/buildings').then(r => setBuildings(r.data));
    api.get('/api/floors').then(r => setFloors(r.data));
    api.get('/api/rooms').then(r => setRooms(r.data));
  };

  const loadDepartments = (buildingId) => {
    if (buildingId) {
      api.get(`/api/buildings/${buildingId}/departments`).then(r => setDepartments(r.data)).catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
  };

  const loadAllDepartments = () => {
    const params = deptFilter ? { building_id: deptFilter } : {};
    api.get('/api/departments', { params }).then(r => setAllDepartments(r.data)).catch(() => setAllDepartments([]));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim()) {
      return alert("Name is required.");
    }
    const payload = { ...form };
    if (dialog === 'room') {
      delete payload._building_id;
    }
    if (!form.id && !payload.code) delete payload.code;
    try {
      if (form.id) {
        if (dialog === 'org') await api.put(`/api/organizations/${form.id}`, payload);
        else if (dialog === 'project') await api.put(`/api/projects/${form.id}`, payload);
        else if (dialog === 'building') await api.put(`/api/buildings/${form.id}`, payload);
        else if (dialog === 'floor') await api.put(`/api/floors/${form.id}`, payload);
        else if (dialog === 'room') await api.put(`/api/rooms/${form.id}`, payload);
        else if (dialog === 'department') await api.put(`/api/departments/${form.id}`, payload);
      } else {
        if (dialog === 'org') await api.post('/api/organizations', payload);
        else if (dialog === 'project') await api.post('/api/projects', payload);
        else if (dialog === 'building') await api.post('/api/buildings', payload);
        else if (dialog === 'floor') await api.post('/api/floors', payload);
        else if (dialog === 'room') await api.post('/api/rooms', payload);
        else if (dialog === 'department') await api.post('/api/departments', payload);
      }
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error saving data'); }
  };

  const saveDept = async () => {
    if (!deptForm.name?.trim()) return alert('Department name is required.');
    if (!deptForm.building_id) return alert('Building is required.');
    const payload = {
      name: deptForm.name,
      building_id: deptForm.building_id,
      accounting_code: deptForm.accounting_code || null,
      code: deptForm.code || null,
    };
    try {
      if (deptForm.id) {
        await api.put(`/api/departments/${deptForm.id}`, payload);
      } else {
        delete payload.code; // auto-generated on create
        await api.post('/api/departments', payload);
      }
      setDeptForm({ name: '', code: '', accounting_code: '', building_id: deptFilter || '' });
      loadAllDepartments();
    } catch (err) { alert(err.response?.data?.detail || 'Error saving department'); }
  };

  const deleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/api/departments/${id}`);
      loadAllDepartments();
    } catch (err) { alert(err.response?.data?.detail || 'Error deleting'); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/api/${type}s/${id}`);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error deleting'); }
  };

  const Label = ({ children }) => (
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 0.8, display: 'block', letterSpacing: '0.025em' }}>
      {children}
    </Typography>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A' }}>Organization & Projects</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', address: '', phone: '', email: '' }); setDialog('org');
          }}>Organization</Button>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', organization_id: orgs[0]?.id || '', location: '', budget: 0 }); setDialog('project');
          }}>Project</Button>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', project_id: '' }); setDialog('building');
          }}>Building</Button>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', level: 0, building_id: '' }); setDialog('floor');
          }}>Floor</Button>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', department_name: '', floor_id: '', _building_id: '' }); setDialog('room');
          }}>Room</Button>
          <Button size="small" variant="contained" startIcon={<Domain />} onClick={() => {
            setDeptFilter(''); setDeptForm({ name: '', code: '', accounting_code: '', building_id: '' });
            setDeptDialog(true);
            api.get('/api/departments').then(r => setAllDepartments(r.data)).catch(() => setAllDepartments([]));
          }} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>Departments</Button>
        </Box>
      </Box>

      {orgs.map(org => (
        <Accordion key={org.id} defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ background: '#F8FAFC' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <AccountTree sx={{ color: '#1E3A8A' }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>{org.name}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>{org.code} • {org.address}</Typography>
              </Box>
              <Box>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setForm(org); setDialog('org'); }}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('organization', org.id); }} color="error"><Delete fontSize="small" /></IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            {projects.filter(p => p.organization_id === org.id).map(proj => (
              <Card key={proj.id} sx={{ mb: 2, p: 2, border: '1px solid #F1F5F9', boxShadow: 'none', borderRadius: '10px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Apartment sx={{ color: '#2563EB' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{proj.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{proj.code} • {proj.location}</Typography>
                  </Box>
                  <Chip label={proj.status} size="small" color="success" variant="outlined" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                  <IconButton size="small" onClick={() => { setForm(proj); setDialog('project'); }}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete('project', proj.id)} color="error"><Delete fontSize="small" /></IconButton>
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
                    Building Hierarchy
                  </Typography>
                  <Box>
                    {buildings.filter(b => b.project_id === proj.id).map(b => (
                      <Accordion key={b.id} sx={{ mb: 1, border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '8px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{b.name} ({b.code})</Typography>
                            <Box sx={{ ml: 'auto' }}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setForm(b); setDialog('building'); }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete('building', b.id); }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ py: 1 }}>
                          {floors.filter(f => f.building_id === b.id).map(f => (
                            <Box key={f.id} sx={{ ml: 2, mb: 1, p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                                <Box sx={{ ml: 'auto' }}>
                                  <IconButton size="small" onClick={() => { setForm(f); setDialog('floor'); }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                  <IconButton size="small" color="error" onClick={() => handleDelete('floor', f.id)}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                </Box>
                              </Box>
                              <Box sx={{ ml: 2, mt: 0.5 }}>
                                {rooms.filter(r => r.floor_id === f.id).map(r => (
                                  <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, py: 0.5, borderBottom: '1px dashed #E2E8F0' }}>
                                    <Typography variant="caption" sx={{ flex: 1 }}>{r.name} ({r.code || 'N/A'})</Typography>
                                    <Chip label={r.department_name || 'No Dept'} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500 }} />
                                    <IconButton size="small" sx={{ ml: 1 }} onClick={() => {
                                      const floor = floors.find(f => f.id === r.floor_id);
                                      setForm({ ...r, _building_id: floor?.building_id || '', department_name: r.department_name || '' });
                                      if (floor?.building_id) loadDepartments(floor.building_id);
                                      setDialog('room');
                                    }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete('room', r.id)}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Box>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Dialogs - COMPACT & CENTRIC */}
      <Dialog 
        open={!!dialog} 
        onClose={() => setDialog('')} 
        maxWidth="sm" 
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: '24px', p: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' } } }}
      >
        <DialogTitle sx={{ pb: 1, px: 3, pt: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E3A8A', fontSize: '1.4rem' }}>
            {form.id ? 'Edit' : 'New'} {dialog === 'org' ? 'Organization' : dialog.charAt(0).toUpperCase() + dialog.slice(1)}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 500, fontSize: '0.85rem' }}>
            Enter the details to manage your campus hierarchy.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, px: 3 }}>
          <Grid container spacing={3}>
            <Grid size={6}>
              <Label>NAME *</Label>
              <TextField 
                fullWidth size="small" required variant="outlined"
                value={form.name || ''} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Business sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
              />
            </Grid>
            {dialog !== 'floor' && (
              <Grid size={6}>
                <Label>CODE</Label>
                <TextField 
                  fullWidth size="small" variant="outlined"
                  value={form.code || ''} 
                  placeholder="Auto-generated"
                  disabled
                  onChange={e => setForm({ ...form, code: e.target.value })} 
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><VpnKey sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
                />
              </Grid>
            )}

            {dialog === 'org' && (
              <Grid size={12}>
                <Label>ADDRESS</Label>
                <TextField 
                  fullWidth size="small" variant="outlined"
                  value={form.address || ''} 
                  onChange={e => setForm({ ...form, address: e.target.value })} 
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
                />
              </Grid>
            )}

            {dialog === 'project' && (
              <>
                <Grid size={12}>
                  <Label>ORGANIZATION</Label>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={form.organization_id || ''} 
                      onChange={e => setForm({ ...form, organization_id: e.target.value })}
                      startAdornment={<InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <Label>LOCATION</Label>
                  <TextField 
                    fullWidth size="small" variant="outlined"
                    value={form.location || ''} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
                  />
                </Grid>
              </>
            )}

            {dialog === 'building' && (
              <Grid size={12}>
                <Label>PROJECT</Label>
                <FormControl fullWidth size="small">
                  <Select 
                    value={form.project_id || ''} 
                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                    startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                    sx={{ borderRadius: '12px' }}
                  >
                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {dialog === 'floor' && (
              <>
                <Grid size={12}>
                  <Label>BUILDING</Label>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={form.building_id || ''} 
                      onChange={e => setForm({ ...form, building_id: e.target.value })}
                      startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <Label>LEVEL / FLOOR NUMBER</Label>
                  <TextField 
                    fullWidth type="number" size="small" variant="outlined"
                    value={form.level || 0} 
                    onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 0 })} 
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Layers sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
                  />
                </Grid>
              </>
            )}

            {dialog === 'room' && (
              <>
                <Grid size={12}>
                  <Label>BUILDING</Label>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={form._building_id || ''} 
                      onChange={e => {
                        const bid = e.target.value;
                        setForm({ ...form, _building_id: bid, floor_id: '', department_name: '' });
                        loadDepartments(bid);
                      }}
                      startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <Label>FLOOR</Label>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={form.floor_id || ''} 
                      onChange={e => setForm({ ...form, floor_id: e.target.value })}
                      startAdornment={<InputAdornment position="start"><Layers sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {floors.filter(f => !form._building_id || f.building_id === form._building_id).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <Label>DEPARTMENT</Label>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={form.department_name || ''} 
                      onChange={e => setForm({ ...form, department_name: e.target.value })}
                      startAdornment={<InputAdornment position="start"><Work sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                      displayEmpty
                    >
                      <MenuItem value="" disabled><em>Select department...</em></MenuItem>
                      {departments.map(d => <MenuItem key={d.id} value={d.name}>{d.name} ({d.code})</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 1.5 }}>
          <Button onClick={() => setDialog('')} sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.9rem' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save}
            sx={{ 
              borderRadius: '12px', 
              px: 4, 
              py: 1.2,
              bgcolor: '#1E3A8A',
              fontWeight: 800,
              fontSize: '0.9rem',
              boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)',
              '&:hover': { bgcolor: '#1E40AF' } 
            }}
          >
            {form.id ? 'Save Changes' : `Create ${dialog === 'org' ? 'Organization' : dialog === 'department' ? 'Department' : dialog.charAt(0).toUpperCase() + dialog.slice(1)}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Management Dialog */}
      <Dialog open={deptDialog} onClose={() => setDeptDialog(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: '20px', minHeight: 500 } } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#7C3AED' }}>Department Master</Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>Manage departments across buildings. Same department name can exist in different buildings.</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Filter */}
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <Select value={deptFilter} displayEmpty onChange={e => {
                setDeptFilter(e.target.value);
                const params = e.target.value ? { building_id: e.target.value } : {};
                api.get('/api/departments', { params }).then(r => setAllDepartments(r.data));
              }} sx={{ borderRadius: '10px' }}>
                <MenuItem value="">All Buildings</MenuItem>
                {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* List */}
          <TableContainer sx={{ maxHeight: 280, mb: 2, border: '1px solid #E2E8F0', borderRadius: '10px' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>Accounting Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>Building</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, bgcolor: '#F8FAFC' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allDepartments.map(d => (
                  <TableRow key={d.id} hover>
                    <TableCell><Chip label={d.code || '-'} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{d.name}</TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{d.accounting_code || '-'}</TableCell>
                    <TableCell><Chip label={d.building_name || '-'} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setDeptForm({ ...d })}><Edit sx={{ fontSize: 16 }} /></IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteDept(d.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {allDepartments.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94A3B8' }}>No departments found. Add one below.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add / Edit Form */}
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>
            {deptForm.id ? '✏️ Edit Department' : '➕ Add New Department'}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth size="small" label="Name *" value={deptForm.name}
                onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth size="small">
                <Select value={deptForm.building_id || ''} displayEmpty
                  onChange={e => setDeptForm({ ...deptForm, building_id: e.target.value })}
                  sx={{ borderRadius: '8px' }}>
                  <MenuItem value="" disabled><em>Select Building *</em></MenuItem>
                  {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth size="small" label="Accounting Code" value={deptForm.accounting_code || ''}
                onChange={e => setDeptForm({ ...deptForm, accounting_code: e.target.value })} 
                placeholder="e.g. AC-ADMIN-01" />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={saveDept}
                  sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, borderRadius: '10px', fontWeight: 700, flex: 1 }}>
                  {deptForm.id ? 'Update' : 'Add'}
                </Button>
                {deptForm.id && (
                  <Button variant="outlined" onClick={() => setDeptForm({ name: '', code: '', accounting_code: '', building_id: deptFilter || '' })}
                    sx={{ borderRadius: '10px', fontWeight: 700 }}>Cancel</Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeptDialog(false)} sx={{ fontWeight: 700, color: '#64748B' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
