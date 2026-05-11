import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl,
  IconButton, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, AccountTree, Apartment, Business, VpnKey, LocationOn, Layers, Work } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../services/api';

export default function Projects() {
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({});

  const load = () => {
    api.get('/api/organizations').then(r => setOrgs(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/buildings').then(r => setBuildings(r.data));
    api.get('/api/floors').then(r => setFloors(r.data));
    api.get('/api/rooms').then(r => setRooms(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim() || !form.code?.trim()) {
      return alert("Name and Code are required.");
    }
    try {
      if (form.id) {
        if (dialog === 'org') await api.put(`/api/organizations/${form.id}`, form);
        else if (dialog === 'project') await api.put(`/api/projects/${form.id}`, form);
        else if (dialog === 'building') await api.put(`/api/buildings/${form.id}`, form);
        else if (dialog === 'floor') await api.put(`/api/floors/${form.id}`, form);
        else if (dialog === 'room') await api.put(`/api/rooms/${form.id}`, form);
      } else {
        if (dialog === 'org') await api.post('/api/organizations', form);
        else if (dialog === 'project') await api.post('/api/projects', form);
        else if (dialog === 'building') await api.post('/api/buildings', form);
        else if (dialog === 'floor') await api.post('/api/floors', form);
        else if (dialog === 'room') await api.post('/api/rooms', form);
      }
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error saving data'); }
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
            setForm({ name: '', code: '', department_name: '', floor_id: '' }); setDialog('room');
          }}>Room</Button>
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
                                    <IconButton size="small" sx={{ ml: 1 }} onClick={() => { setForm(r); setDialog('room'); }}><Edit sx={{ fontSize: 14 }} /></IconButton>
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
        PaperProps={{ sx: { borderRadius: '24px', p: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' } }}
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
            <Grid item xs={6}>
              <Label>NAME *</Label>
              <TextField 
                fullWidth size="small" required variant="outlined"
                value={form.name || ''} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Business sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
              />
            </Grid>
            <Grid item xs={6}>
              <Label>CODE *</Label>
              <TextField 
                fullWidth size="small" required variant="outlined"
                value={form.code || ''} 
                onChange={e => setForm({ ...form, code: e.target.value })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><VpnKey sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
              />
            </Grid>

            {dialog === 'org' && (
              <Grid item xs={12}>
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
                <Grid item xs={12}>
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
                <Grid item xs={12}>
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
              <Grid item xs={12}>
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
                <Grid item xs={12}>
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
                <Grid item xs={12}>
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
                <Grid item xs={12}>
                  <Label>FLOOR</Label>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={form.floor_id || ''} 
                      onChange={e => setForm({ ...form, floor_id: e.target.value })}
                      startAdornment={<InputAdornment position="start"><Layers sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {floors.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Label>DEPARTMENT NAME</Label>
                  <TextField 
                    fullWidth size="small" variant="outlined"
                    value={form.department_name || ''} 
                    onChange={e => setForm({ ...form, department_name: e.target.value })} 
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Work sx={{ color: '#64748B', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } } }}
                  />
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
            {form.id ? 'Save Changes' : `Create ${dialog === 'org' ? 'Organization' : dialog.charAt(0).toUpperCase() + dialog.slice(1)}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
