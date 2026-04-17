import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
  IconButton, Chip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Add, Edit, ExpandMore, AccountTree, Apartment, Warehouse as WarehouseIcon } from '@mui/icons-material';
import api from '../services/api';

export default function Projects() {
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [dialog, setDialog] = useState('');
  const [form, setForm] = useState({});

  const load = () => {
    api.get('/api/organizations').then(r => setOrgs(r.data));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/blocks').then(r => setBlocks(r.data));
    api.get('/api/warehouses').then(r => setWarehouses(r.data));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (dialog === 'org') await api.post('/api/organizations', form);
      else if (dialog === 'project') await api.post('/api/projects', form);
      else if (dialog === 'block') await api.post('/api/blocks', form);
      else if (dialog === 'warehouse') await api.post('/api/warehouses', form);
      setDialog(''); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Organization & Projects</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', address: '', phone: '', email: '' }); setDialog('org');
          }}>Organization</Button>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', organization_id: orgs[0]?.id || '', location: '', budget: 0 }); setDialog('project');
          }}>Project</Button>
          <Button size="small" variant="outlined" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', project_id: '', block_type: 'Building', floors: 1 }); setDialog('block');
          }}>Block</Button>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={() => {
            setForm({ name: '', code: '', project_id: '', warehouse_type: 'Main', location: '' }); setDialog('warehouse');
          }}>Warehouse</Button>
        </Box>
      </Box>

      {orgs.map(org => (
        <Accordion key={org.id} defaultExpanded sx={{ mb: 2, borderRadius: '12px !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={{ background: '#F8FAFC' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountTree sx={{ color: '#1E3A8A' }} />
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{org.name}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>{org.code} • {org.address}</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {projects.filter(p => p.organization_id === org.id).map(proj => (
              <Card key={proj.id} sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Apartment sx={{ color: '#2563EB' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{proj.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{proj.code} • {proj.location}</Typography>
                  </Box>
                  <Chip label={proj.status} size="small" color="success" />
                  {proj.budget > 0 && <Chip label={`₹${(proj.budget / 10000000).toFixed(0)} Cr`} size="small" variant="outlined" />}
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Blocks / Buildings
                    </Typography>
                    <Table size="small" sx={{ mt: 1 }}>
                      <TableHead><TableRow>
                        <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Floors</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {blocks.filter(b => b.project_id === proj.id).map(b => (
                          <TableRow key={b.id}>
                            <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{b.name}</TableCell>
                            <TableCell><Chip label={b.block_type || 'N/A'} size="small" variant="outlined" /></TableCell>
                            <TableCell>{b.floors}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Warehouses / Stores
                    </Typography>
                    <Table size="small" sx={{ mt: 1 }}>
                      <TableHead><TableRow>
                        <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Manager</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {warehouses.filter(w => w.project_id === proj.id).map(w => (
                          <TableRow key={w.id}>
                            <TableCell sx={{ fontWeight: 500, fontSize: '0.85rem' }}>{w.name}</TableCell>
                            <TableCell><Chip label={w.warehouse_type || 'N/A'} size="small" variant="outlined" /></TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{w.manager_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Dialogs */}
      <Dialog open={!!dialog} onClose={() => setDialog('')} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {dialog === 'org' ? 'New Organization' : dialog === 'project' ? 'New Project' : dialog === 'block' ? 'New Block' : 'New Warehouse'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={6}><TextField fullWidth label="Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid size={6}><TextField fullWidth label="Code" value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value })} required /></Grid>
            {(dialog === 'project') && (
              <Grid size={12}>
                <FormControl fullWidth><InputLabel>Organization</InputLabel>
                  <Select value={form.organization_id || ''} label="Organization" onChange={e => setForm({ ...form, organization_id: e.target.value })}>
                    {orgs.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {(dialog === 'block' || dialog === 'warehouse') && (
              <Grid size={12}>
                <FormControl fullWidth><InputLabel>Project</InputLabel>
                  <Select value={form.project_id || ''} label="Project" onChange={e => setForm({ ...form, project_id: e.target.value })}>
                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {dialog === 'org' && <Grid size={12}><TextField fullWidth label="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>}
            {dialog === 'project' && <Grid size={12}><TextField fullWidth label="Location" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></Grid>}
            {dialog === 'block' && <Grid size={6}><TextField fullWidth label="Block Type" value={form.block_type || ''} onChange={e => setForm({ ...form, block_type: e.target.value })} /></Grid>}
            {dialog === 'block' && <Grid size={6}><TextField fullWidth label="Floors" type="number" value={form.floors || 1} onChange={e => setForm({ ...form, floors: parseInt(e.target.value) || 1 })} /></Grid>}
            {dialog === 'warehouse' && <Grid size={6}><TextField fullWidth label="Type" value={form.warehouse_type || ''} onChange={e => setForm({ ...form, warehouse_type: e.target.value })} /></Grid>}
            {dialog === 'warehouse' && <Grid size={6}><TextField fullWidth label="Location" value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} /></Grid>}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog('')}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
