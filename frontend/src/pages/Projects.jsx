import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl,
  IconButton, Chip, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab, InputLabel
} from '@mui/material';
import { Add, Edit, Delete, ExpandMore, AccountTree, Apartment, Business, VpnKey, LocationOn, Layers, Work, Domain, Description, School, AccountBalance } from '@mui/icons-material';
import { InputAdornment } from '@mui/material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function Projects() {
  const { showMessage } = useMessage();
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [dialog, setDialog] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', id: null });
  const [form, setForm] = useState({});
  const [tab, setTab] = useState(0);

  const load = () => {
    api.get('/api/organizations').then(r => setOrgs(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/institutions').then(r => setInstitutions(r.data));
    api.get('/api/departments').then(r => setDepartments(r.data));
    
    api.get('/api/buildings').then(r => setBuildings(r.data));
    api.get('/api/floors').then(r => setFloors(r.data));
    api.get('/api/rooms').then(r => setRooms(r.data));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name?.trim()) {
      return showMessage("Name is required.", 'Validation Error', 'warning');
    }
    const payload = { ...form };
    if (dialog === 'room') {
      delete payload._institution_id;
      delete payload._building_id;
    }
    if (dialog === 'building') {
      delete payload._institution_id;
    }
    if (dialog === 'floor') {
      delete payload._institution_id;
    }
    if (dialog === 'department') {
      if (payload.building_id === '') payload.building_id = null;
      if (payload.accounting_code === '') payload.accounting_code = null;
    }
    if (!form.id && !payload.code) delete payload.code;
    if (dialog === 'floor') {
      if (!Number.isInteger(Number(form.level)) || Number(form.level) < 0) {
        return showMessage("Floor Level must be a positive whole number.", 'Validation Error', 'warning');
      }
    }
    try {
      if (form.id) {
        if (dialog === 'org') await api.put(`/api/organizations/${form.id}`, payload);
        else if (dialog === 'project') await api.put(`/api/projects/${form.id}`, payload);
        else if (dialog === 'institution') await api.put(`/api/institutions/${form.id}`, payload);
        else if (dialog === 'department') await api.put(`/api/departments/${form.id}`, payload);
        else if (dialog === 'building') await api.put(`/api/buildings/${form.id}`, payload);
        else if (dialog === 'floor') await api.put(`/api/floors/${form.id}`, payload);
        else if (dialog === 'room') await api.put(`/api/rooms/${form.id}`, payload);
      } else {
        if (dialog === 'org') await api.post('/api/organizations', payload);
        else if (dialog === 'project') await api.post('/api/projects', payload);
        else if (dialog === 'institution') await api.post('/api/institutions', payload);
        else if (dialog === 'department') await api.post('/api/departments', payload);
        else if (dialog === 'building') await api.post('/api/buildings', payload);
        else if (dialog === 'floor') await api.post('/api/floors', payload);
        else if (dialog === 'room') await api.post('/api/rooms', payload);
      }
      setDialog(''); load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error saving data', 'Error', 'error'); }
  };

  const handleDelete = (type, id) => {
    setDeleteConfirm({ open: true, type, id });
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/api/${deleteConfirm.type}s/${deleteConfirm.id}`);
      load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error deleting', 'Error', 'error'); }
    setDeleteConfirm({ open: false, type: '', id: null });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A' }}>Organization & Projects</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {tab === 0 ? (
            <>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', code: '', address: '', phone: '', email: '' }); setDialog('org');
              }}>Organization</Button>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', code: '', organization_id: orgs[0]?.id || '', location: '', budget: 0 }); setDialog('project');
              }}>Project</Button>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', code: '', project_id: projects[0]?.id || '' }); setDialog('institution');
              }}>Institution</Button>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', code: '', institution_id: institutions[0]?.id || '', building_id: '', accounting_code: '' }); setDialog('department');
              }}>Department</Button>
            </>
          ) : (
            <>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', code: '', project_id: null, institution_id: institutions[0]?.id || '', department_name: '' }); setDialog('building');
              }}>Building</Button>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', level: 0, building_id: '', department_name: '', _institution_id: '' }); setDialog('floor');
              }}>Floor</Button>
              <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
                setForm({ name: '', code: '', department_name: '', floor_id: '', _building_id: '', _institution_id: '' }); 
                setDialog('room');
              }}>Room</Button>
            </>
          )}
        </Box>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Organization & Entities" sx={{ fontWeight: 600, textTransform: 'none' }} />
        <Tab label="Physical Infrastructure" sx={{ fontWeight: 600, textTransform: 'none' }} />
      </Tabs>

      {/* TAB 1: Organization, Projects, Institution, Department */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#64748B', textTransform: 'uppercase' }}>Logical Hierarchy</Typography>
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
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setForm(org); setDialog('org'); }}><Edit color="primary" fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete('organization', org.id); }} color="error"><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    {projects.filter(p => p.organization_id === org.id).map(proj => (
                      <Card key={proj.id} sx={{ mb: 2, p: 2, border: '1px solid #F1F5F9', boxShadow: 'none', borderRadius: '10px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Apartment sx={{ color: '#2563EB' }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>{proj.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>{proj.code} • {proj.location}</Typography>
                          </Box>
                          <Chip label={proj.status} size="small" color="success" variant="outlined" sx={{ borderRadius: '6px', fontWeight: 600 }} />
                          <IconButton size="small" onClick={() => { setForm(proj); setDialog('project'); }}><Edit color="primary" fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete('project', proj.id)} color="error"><Delete fontSize="small" /></IconButton>
                        </Box>
                        <Box sx={{ ml: 4, mt: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>INSTITUTIONS & DEPARTMENTS</Typography>
                          {institutions.filter(i => i.project_id === proj.id).map(inst => (
                            <Box key={inst.id} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                                <School sx={{ fontSize: 18, color: '#0EA5E9', mr: 1 }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{inst.name}</Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>{inst.code}</Typography>
                                </Box>
                                <IconButton size="small" onClick={() => { setForm(inst); setDialog('institution'); }}><Edit color="primary" sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete('institution', inst.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                              </Box>
                              <Box sx={{ ml: 4, mt: 0.5 }}>
                                {departments.filter(d => d.institution_id === inst.id).map(dept => (
                                  <Box key={dept.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5, borderBottom: '1px dashed #E2E8F0' }}>
                                    <Work sx={{ color: '#7C3AED', fontSize: 14, mr: 1 }} />
                                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{dept.name}</Typography>
                                      {dept.building_id && (
                                        <Chip label={buildings.find(b => b.id === dept.building_id)?.name || 'Building'} size="small" variant="outlined" color="secondary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500 }} />
                                      )}
                                      {dept.accounting_code && (
                                        <Chip label={dept.accounting_code} size="small" variant="outlined" color="default" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500 }} />
                                      )}
                                    </Box>
                                    <IconButton size="small" onClick={() => { setForm({ ...dept, building_id: dept.building_id || '', accounting_code: dept.accounting_code || '' }); setDialog('department'); }}><Edit color="primary" sx={{ fontSize: 14 }} /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete('department', dept.id)}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    ))}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </Box>
      )}

      {/* TAB 2: Institution -> Building -> Floor -> Room */}
      {tab === 1 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#64748B', textTransform: 'uppercase' }}>Physical Infrastructure</Typography>
          {institutions.map(inst => (
            <Accordion key={inst.id} defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMore />} sx={{ background: '#F0F9FF' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <School sx={{ color: '#0EA5E9' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>{inst.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{inst.code} • Institution</Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 2 }}>
                <Box sx={{ pl: 1 }}>
                  {buildings.filter(b => b.institution_id === inst.id).map(b => (
                    <Accordion key={b.id} sx={{ mb: 1, border: '1px solid #E2E8F0', boxShadow: 'none', borderRadius: '8px !important' }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <Business sx={{ color: '#7C3AED', fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{b.name} ({b.code})</Typography>
                          {b.department_name && (
                            <Chip label={b.department_name} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, ml: 1 }} />
                          )}
                          <Box sx={{ ml: 'auto' }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setForm(b); setDialog('building'); }}><Edit color="primary" sx={{ fontSize: 16 }} /></IconButton>
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete('building', b.id); }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ py: 1 }}>
                        {floors.filter(f => f.building_id === b.id).map(f => (
                          <Box key={f.id} sx={{ ml: 2, mb: 1, p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Layers sx={{ color: '#64748B', fontSize: 16, mr: 1 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                              {f.department_name && (
                                <Chip label={f.department_name} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500, ml: 1 }} />
                              )}
                              <Box sx={{ ml: 'auto' }}>
                                <IconButton size="small" onClick={() => { setForm({...f, _institution_id: b.institution_id}); setDialog('floor'); }}><Edit color="primary" sx={{ fontSize: 14 }} /></IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete('floor', f.id)}><Delete sx={{ fontSize: 14 }} /></IconButton>
                              </Box>
                            </Box>
                            <Box sx={{ ml: 3, mt: 0.5 }}>
                              {rooms.filter(r => r.floor_id === f.id).map(r => (
                                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', mb: 0.5, py: 0.5, borderBottom: '1px dashed #E2E8F0' }}>
                                  <Typography variant="caption" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                    <Domain sx={{ fontSize: 14, color: '#94A3B8', mr: 0.5 }} />
                                    {r.name} ({r.code || 'N/A'})
                                  </Typography>
                                  {r.department_name && (
                                    <Chip label={r.department_name} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 500 }} />
                                  )}
                                  <IconButton size="small" sx={{ ml: 1 }} onClick={() => {
                                    const floor = floors.find(fl => fl.id === r.floor_id);
                                    const bldg = buildings.find(bl => bl.id === floor?.building_id);
                                    setForm({ ...r, _building_id: bldg?.id || '', _institution_id: bldg?.institution_id || '', department_name: r.department_name || '' });
                                    setDialog('room');
                                  }}><Edit color="primary" sx={{ fontSize: 14 }} /></IconButton>
                                  <IconButton size="small" color="error" onClick={() => handleDelete('room', r.id)}><Delete sx={{ fontSize: 14 }} /></IconButton>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  {buildings.filter(b => b.institution_id === inst.id).length === 0 && (
                    <Typography variant="body2" sx={{ color: '#94A3B8', p: 1 }}>No buildings assigned to this institution.</Typography>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          {institutions.length === 0 && (
            <Typography variant="body2" sx={{ p: 2, color: '#94A3B8', textAlign: 'center' }}>Please create an Institution in Tab 1 first.</Typography>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <Dialog open={!!dialog} onClose={() => setDialog('')} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' } }}>
        <DialogTitle sx={{ pb: 1, px: 4, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              p: 1, 
              bgcolor: dialog === 'org' ? '#EFF6FF' : dialog === 'project' ? '#F0F9FF' : dialog === 'institution' ? '#ECFEFF' : dialog === 'building' ? '#F5F3FF' : '#F8FAFC', 
              borderRadius: 2, 
              color: dialog === 'org' ? '#2563EB' : dialog === 'project' ? '#0EA5E9' : dialog === 'institution' ? '#06B6D4' : dialog === 'building' ? '#7C3AED' : '#64748B', 
              display: 'flex' 
            }}>
              {dialog === 'org' ? <AccountTree fontSize="medium" /> : 
               dialog === 'project' ? <Apartment fontSize="medium" /> : 
               dialog === 'institution' ? <School fontSize="medium" /> : 
               dialog === 'building' ? <Business fontSize="medium" /> : 
               dialog === 'floor' ? <Layers fontSize="medium" /> : 
               dialog === 'department' ? <Work fontSize="medium" /> : <Domain fontSize="medium" />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {form.id ? 'Edit' : 'New'} {dialog === 'org' ? 'Organization' : dialog.charAt(0).toUpperCase() + dialog.slice(1)}
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
                    <Description sx={{ color: '#94A3B8', fontSize: 18 }} />
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
                  fullWidth size="small" variant="outlined" label="Registered Address"
                  value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} 
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
                      label="Parent Organization" value={form.organization_id || ''} onChange={e => setForm({ ...form, organization_id: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth size="small" variant="outlined" label="Project Location"
                    value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} 
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                  />
                </Grid>
              </>
            )}

            {dialog === 'institution' && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Target Project</InputLabel>
                  <Select 
                    label="Target Project" value={form.project_id || ''} onChange={e => setForm({ ...form, project_id: e.target.value })}
                    sx={{ borderRadius: '12px' }}
                  >
                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {dialog === 'department' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Target Institution</InputLabel>
                    <Select 
                      label="Target Institution" value={form.institution_id || ''} onChange={e => setForm({ ...form, institution_id: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Building (Optional)</InputLabel>
                    <Select 
                      label="Building (Optional)" value={form.building_id || ''} onChange={e => setForm({ ...form, building_id: e.target.value })}
                      sx={{ borderRadius: '12px' }} displayEmpty
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {buildings.filter(b => !form.institution_id || b.institution_id === form.institution_id).map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth size="small" variant="outlined" label="Accounting Code (Optional)"
                    value={form.accounting_code || ''} onChange={e => setForm({ ...form, accounting_code: e.target.value })} 
                    InputProps={{ startAdornment: <InputAdornment position="start"><AccountBalance sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                  />
                </Grid>
              </>
            )}

            {dialog === 'building' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Target Institution</InputLabel>
                    <Select 
                      label="Target Institution" value={form.institution_id || ''} onChange={e => setForm({ ...form, institution_id: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Assign Department (Optional)</InputLabel>
                    <Select 
                      label="Assign Department (Optional)" value={form.department_name || ''} onChange={e => setForm({ ...form, department_name: e.target.value })}
                      sx={{ borderRadius: '12px' }} displayEmpty
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departments.filter(d => !form.institution_id || d.institution_id === form.institution_id).map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {dialog === 'floor' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Building</InputLabel>
                    <Select 
                      label="Select Building" value={form.building_id || ''} 
                      onChange={e => {
                        const bldg = buildings.find(b => b.id === e.target.value);
                        setForm({ ...form, building_id: e.target.value, _institution_id: bldg?.institution_id || '' });
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    fullWidth type="number" size="small" variant="outlined" label="Level / Floor Number"
                    value={form.level || 0} onChange={e => setForm({ ...form, level: parseInt(e.target.value) || 0 })} 
                    InputProps={{ startAdornment: <InputAdornment position="start"><Layers sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: '12px' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Assign Department (Optional)</InputLabel>
                    <Select 
                      label="Assign Department (Optional)" value={form.department_name || ''} onChange={e => setForm({ ...form, department_name: e.target.value })}
                      sx={{ borderRadius: '12px' }} displayEmpty
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departments.filter(d => !form._institution_id || d.institution_id === form._institution_id).map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {dialog === 'room' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Institution</InputLabel>
                    <Select 
                      label="Select Institution" value={form._institution_id || ''} 
                      onChange={e => {
                        setForm({ ...form, _institution_id: e.target.value, _building_id: '', floor_id: '' });
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Building</InputLabel>
                    <Select 
                      label="Select Building" value={form._building_id || ''} 
                      onChange={e => {
                        setForm({ ...form, _building_id: e.target.value, floor_id: '' });
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      {buildings.filter(b => !form._institution_id || b.institution_id === form._institution_id).map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Floor</InputLabel>
                    <Select 
                      label="Select Floor" value={form.floor_id || ''} onChange={e => setForm({ ...form, floor_id: e.target.value })}
                      sx={{ borderRadius: '12px' }}
                    >
                      {floors.filter(f => !form._building_id || f.building_id === form._building_id).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Assign Department (Optional)</InputLabel>
                    <Select 
                      label="Assign Department (Optional)" value={form.department_name || ''} onChange={e => setForm({ ...form, department_name: e.target.value })}
                      sx={{ borderRadius: '12px' }} displayEmpty
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      {departments.filter(d => !form._institution_id || d.institution_id === form._institution_id).map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog('')} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={save} sx={{ borderRadius: '12px', px: 4, fontWeight: 700, textTransform: 'none', bgcolor: '#1E3A8A', '&:hover': { bgcolor: '#172554' } }}>
            {form.id ? 'Save Changes' : `Create`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, type: '', id: null })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, type: '', id: null })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={executeDelete} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 600, px: 3 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
