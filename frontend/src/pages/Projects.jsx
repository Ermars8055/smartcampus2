import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl,
  IconButton, Chip, Accordion, AccordionSummary, AccordionDetails,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Divider, InputLabel
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, AccountTree, Apartment, Business, VpnKey, LocationOn, Layers, Work, Domain, Description } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../services/api';

export default function Projects() {
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({});

  const load = () => {
    api.get('/api/organizations').then(r => setOrgs(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/buildings').then(r => setBuildings(r.data));
    api.get('/api/floors').then(r => setFloors(r.data));
    api.get('/api/rooms').then(r => setRooms(r.data));
  };

  const loadDepartments = () => {
    api.get('/api/departments/names').then(r => setDepartments(r.data)).catch(() => setDepartments([]));
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
    if (dialog === 'floor') {
      if (!Number.isInteger(Number(form.level)) || Number(form.level) < 0) {
        return alert("Floor Level must be a positive whole number.");
      }
    }
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


  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/api/${type}s/${id}`);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error deleting'); }
  };

  const Label = ({ children }) => (
    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', mb: 0.5, display: 'block', letterSpacing: '0.05em' }}>
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
            setForm({ name: '', code: '', department_name: '', floor_id: '', _building_id: '' }); 
            loadDepartments();
            setDialog('room');
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
                                    <IconButton size="small" sx={{ ml: 1 }} onClick={() => {
                                      const floor = floors.find(f => f.id === r.floor_id);
                                      setForm({ ...r, _building_id: floor?.building_id || '', department_name: r.department_name || '' });
                                      if (floor?.building_id) loadDepartments();
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
        PaperProps={{ sx: { borderRadius: '24px', p: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' } }}
      >
        <DialogTitle sx={{ pb: 1, px: 4, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 1, 
              bgcolor: dialog === 'org' ? '#EFF6FF' : dialog === 'project' ? '#F0F9FF' : dialog === 'building' ? '#F5F3FF' : '#F8FAFC', 
              borderRadius: 2, 
              color: dialog === 'org' ? '#2563EB' : dialog === 'project' ? '#0EA5E9' : dialog === 'building' ? '#7C3AED' : '#64748B', 
              display: 'flex' 
            }}>
              {dialog === 'org' ? <AccountTree fontSize="medium" /> : 
               dialog === 'project' ? <Apartment fontSize="medium" /> : 
               dialog === 'building' ? <Business fontSize="medium" /> : 
               dialog === 'floor' ? <Layers fontSize="medium" /> : <Domain fontSize="medium" />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {form.id ? 'Edit' : 'New'} {dialog === 'org' ? 'Organization' : dialog.charAt(0).toUpperCase() + dialog.slice(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dialog === 'org' ? 'Define the top-level entity for your campus hierarchy.' :
                 dialog === 'project' ? 'Create a specific project site or campus area.' :
                 dialog === 'building' ? 'Add a physical structure to your project site.' :
                 dialog === 'floor' ? 'Specify a vertical level within the building.' :
                 'Define a functional space or office within a floor.'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 4 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={dialog === 'floor' ? 12 : 6}>
              <TextField 
                fullWidth size="small" required variant="outlined"
                label={`${dialog.charAt(0).toUpperCase() + dialog.slice(1)} Name`}
                value={form.name || ''} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                InputProps={{ 
                  startAdornment: <InputAdornment position="start">
                    {dialog === 'org' ? <Business sx={{ color: '#94A3B8', fontSize: 18 }} /> : 
                     dialog === 'project' ? <Apartment sx={{ color: '#94A3B8', fontSize: 18 }} /> : 
                     dialog === 'building' ? <Business sx={{ color: '#94A3B8', fontSize: 18 }} /> : 
                     <Description sx={{ color: '#94A3B8', fontSize: 18 }} />}
                  </InputAdornment>, 
                  sx: { borderRadius: '12px' } 
                }}
              />
            </Grid>
            {dialog !== 'floor' && (
              <Grid item xs={6}>
                <TextField 
                  fullWidth size="small" variant="outlined"
                  label={`${dialog.charAt(0).toUpperCase() + dialog.slice(1)} Code`}
                  value={form.code || ''} 
                  placeholder="Auto-generated"
                  disabled
                  InputProps={{ startAdornment: <InputAdornment position="start"><VpnKey sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                />
              </Grid>
            )}

            {dialog === 'org' && (
              <Grid item xs={12}>
                <TextField 
                  fullWidth size="small" variant="outlined"
                  label="Registered Address"
                  value={form.address || ''} 
                  onChange={e => setForm({ ...form, address: e.target.value })} 
                  multiline rows={2}
                  InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mt: 1, alignSelf: 'flex-start' }}><LocationOn sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                />
              </Grid>
            )}

            {dialog === 'project' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Parent Organization</InputLabel>
                    <Select 
                      label="Parent Organization"
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
                  <TextField 
                    fullWidth size="small" variant="outlined"
                    label="Project Location"
                    value={form.location || ''} 
                    onChange={e => setForm({ ...form, location: e.target.value })} 
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                  />
                </Grid>
              </>
            )}

            {dialog === 'building' && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Target Project</InputLabel>
                  <Select 
                    label="Target Project"
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
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Building</InputLabel>
                    <Select 
                      label="Select Building"
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
                  <TextField 
                    fullWidth type="number" size="small" variant="outlined"
                    label="Level / Floor Number"
                    value={form.level || 0} 
                    onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 0 })} 
                    InputProps={{ startAdornment: <InputAdornment position="start"><Layers sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                  />
                </Grid>
              </>
            )}

            {dialog === 'room' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Building</InputLabel>
                    <Select 
                      label="Select Building"
                      value={form._building_id || ''} 
                      onChange={e => {
                        const bid = e.target.value;
                        setForm({ ...form, _building_id: bid, floor_id: '', department_name: '' });
                        loadDepartments();
                      }}
                      startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Floor</InputLabel>
                    <Select 
                      label="Select Floor"
                      value={form.floor_id || ''} 
                      onChange={e => setForm({ ...form, floor_id: e.target.value })}
                      startAdornment={<InputAdornment position="start"><Layers sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                    >
                      {floors.filter(f => !form._building_id || f.building_id === form._building_id).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Assign Department</InputLabel>
                    <Select 
                      label="Assign Department"
                      value={form.department_name || ''} 
                      onChange={e => setForm({ ...form, department_name: e.target.value })}
                      startAdornment={<InputAdornment position="start"><Work sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} /></InputAdornment>}
                      sx={{ borderRadius: '12px' }}
                      displayEmpty
                    >
                      <MenuItem value="" disabled><em>Select department...</em></MenuItem>
                      {departments.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog('')} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={save}
            sx={{ 
              borderRadius: '12px', 
              px: 4, 
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#1E3A8A',
              '&:hover': { bgcolor: '#172554' }
            }}
          >
            {form.id ? 'Save Changes' : `Create ${dialog === 'org' ? 'Organization' : dialog.charAt(0).toUpperCase() + dialog.slice(1)}`}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
