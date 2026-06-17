import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, MenuItem,
  Select, FormControl, InputLabel, Switch, FormControlLabel, Checkbox,
  ListItemText, InputAdornment
} from '@mui/material';
import { Edit, PersonAdd, AdminPanelSettings, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role: 'Engineer',
  role_id: '',
  institution: '',
  department: '',
  tenant_id: '',
  site_ids: [],
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterInst, setFilterInst] = useState('');
  const { user: currentUser } = useAuth();

  const load = () => {
    api.get('/api/admin/users').then(r => setUsers(r.data));
    api.get('/api/sites').then(r => setSites(r.data || [])).catch(() => setSites([]));
    api.get('/api/rbac/roles').then(r => setRoles(r.data || [])).catch(() => setRoles([]));
    api.get('/api/institutions').then(r => {
      setInstitutions(r.data || []);
      if (r.data && r.data.length === 1) setFilterInst(r.data[0].name);
    }).catch(() => setInstitutions([]));
    api.get('/api/departments').then(r => {
      setDepartments(r.data || []);
      const uniqueNames = Array.from(new Set((r.data || []).map(d => d.name)));
      if (uniqueNames.length === 1) setFilterDept(uniqueNames[0]);
    }).catch(() => setDepartments([]));
  };
  
  useEffect(() => { load(); }, [currentUser?.tenant_id]);

  const selectedTenantId = currentUser?.tenant_id || form.tenant_id;
  const tenantSites = sites.filter(site => !selectedTenantId || site.tenant_id === Number(selectedTenantId));
  const tenantRoles = roles.filter(role => !selectedTenantId || !role.tenant_id || role.tenant_id === Number(selectedTenantId));
  const siteNameById = Object.fromEntries(sites.map(site => [site.id, site.name]));

  const filteredUsers = users.filter(u => {
    const matchSearch = !searchQuery || 
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role_name || u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = !filterRole || (u.role_name || u.role) === filterRole;
    const matchDept = !filterDept || (u.department || '') === filterDept;
    const matchInst = !filterInst || (u.institution || '') === filterInst;
    return matchSearch && matchRole && matchDept && matchInst;
  });

  const handleSave = async () => {
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        role_id: form.role_id || null,
        institution: form.institution || null,
        department: form.department || null,
        tenant_id: currentUser?.tenant_id || form.tenant_id || null,
        site_ids: form.site_ids || [],
        is_active: form.is_active,
      };
      if (editing) {
        if (form.password && form.password !== '********') {
          payload.password = form.password;
        }
        await api.put(`/api/admin/users/${editing}`, payload);
      } else {
        await api.post('/api/admin/users', {
          ...payload,
          username: form.username,
          password: form.password,
        });
      }
      setDialog(false); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const roleColor = { 'Admin': 'error', 'Purchase Manager': 'primary', 'Store Keeper': 'success', 'Security': 'warning', 'Engineer': 'info', 'Management': 'secondary' };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Users</Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
          <TextField 
            size="small" 
            placeholder="Search name, username, or role..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            sx={{ flex: 2, minWidth: 200, maxWidth: 350 }}
            autoComplete="off"
            inputProps={{ autoComplete: 'off', form: { autocomplete: 'off' } }}
          />
          <FormControl size="small" sx={{ flex: 1, minWidth: 160, maxWidth: 220 }}>
            <InputLabel>Filter by Institute</InputLabel>
            <Select value={filterInst} label="Filter by Institute" onChange={e => {
              setFilterInst(e.target.value);
              setFilterDept(''); // Reset department filter when institute changes
            }}>
              <MenuItem value=""><em>All Institutes</em></MenuItem>
              {institutions.map(i => <MenuItem key={i.id} value={i.name}>{i.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1, minWidth: 160, maxWidth: 220 }}>
            <InputLabel>Filter by Department</InputLabel>
            <Select value={filterDept} label="Filter by Department" onChange={e => setFilterDept(e.target.value)}>
              <MenuItem value=""><em>All Departments</em></MenuItem>
              {departments
                .filter(d => {
                  if (!filterInst) return true;
                  const selectedInstId = institutions.find(i => i.name === filterInst)?.id;
                  return d.institution_id === selectedInstId;
                })
                .map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1, minWidth: 140, maxWidth: 200 }}>
            <InputLabel>Filter by Role</InputLabel>
            <Select value={filterRole} label="Filter by Role" onChange={e => setFilterRole(e.target.value)}>
              <MenuItem value=""><em>All Roles</em></MenuItem>
              {Array.from(new Set(users.map(u => u.role_name || u.role).filter(Boolean))).map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => {
          setEditing(null); setShowPassword(false); 

          let defaultInst = institutions.length === 1 ? institutions[0].name : '';
          let defaultDept = '';
          const uniqueNames = Array.from(new Set(departments.map(d => d.name)));
          if (uniqueNames.length === 1) defaultDept = uniqueNames[0];

          setForm({ 
            ...emptyForm, 
            tenant_id: currentUser?.tenant_id || '',
            institution: defaultInst,
            department: defaultDept
          }); 
          setDialog(true);
        }}>Add User</Button>
      </Box>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Username</TableCell><TableCell>Full Name</TableCell><TableCell>Email</TableCell>
              <TableCell>Role</TableCell><TableCell>Institute</TableCell><TableCell>Department</TableCell>
              <TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.username}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{u.full_name}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</TableCell>

                  <TableCell><Chip label={u.role_name || u.role} size="small" color={roleColor[u.role_name || u.role] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{u.institution || 'All Institutions'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{u.department || 'All Departments'}</TableCell>
                  <TableCell><Chip label={u.is_active ? 'Active' : 'Inactive'} size="small" color={u.is_active ? 'success' : 'default'} variant="outlined" /></TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(u.created_at)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => {
                      setEditing(u.id);
                      setShowPassword(false);
                      setForm({
                        ...emptyForm,
                        ...u,
                        role_id: u.role_id ? Number(u.role_id) : '',
                        institution: u.institution || '',
                        department: u.department || '',
                        tenant_id: u.tenant_id || '',
                        site_ids: (u.sites || []).map(site => site.site_id),
                        password: '********', // Dummy password to show field is populated
                      });
                      setDialog(true);
                    }}><Edit fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <AdminPanelSettings fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {editing ? 'Edit User' : 'Create User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage user accounts and permissions.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Username" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} required disabled={!!editing} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Full Name" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} required /></Grid>

            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={form.role_id !== '' && form.role_id != null ? Number(form.role_id) : ''}
                  label="Role"
                  required
                  onChange={e => {
                    const selectedRole = tenantRoles.find(role => role.id === Number(e.target.value));
                    setForm({ ...form, role_id: e.target.value, role: selectedRole?.name || form.role });
                  }}
                >
                  {tenantRoles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {tenantSites.length > 1 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Site Access</InputLabel>
                  <Select
                    multiple
                    value={form.site_ids || []}
                    label="Site Access"
                    onChange={e => setForm({ ...form, site_ids: e.target.value })}
                    renderValue={(selected) => selected.map(id => siteNameById[id] || `Site ${id}`).join(', ')}
                  >
                    {tenantSites.map(site => (
                      <MenuItem key={site.id} value={site.id}>
                        <Checkbox checked={(form.site_ids || []).includes(site.id)} />
                        <ListItemText primary={site.name} secondary={site.location} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Institute</InputLabel>
                <Select
                  value={form.institution || ''}
                  label="Institute"
                  onChange={e => {
                    const newInst = e.target.value;
                    setForm({ ...form, institution: newInst, department: '' });
                  }}
                >
                  <MenuItem value=""><em>All Institutions</em></MenuItem>
                  {institutions.map(i => <MenuItem key={i.id} value={i.name}>{i.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={form.department || ''}
                  label="Department"
                  onChange={e => setForm({ ...form, department: e.target.value })}
                >
                  <MenuItem value=""><em>All Departments</em></MenuItem>
                  {departments
                    .filter(d => {
                      if (!form.institution || form.institution === 'All Institutions') return true;
                      const selectedInstId = institutions.find(i => i.name === form.institution)?.id;
                      return d.institution_id === selectedInstId;
                    })
                    .map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {!editing && <Grid item xs={6}><TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} autoComplete="new-password" InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /></Grid>}
            {editing && <Grid item xs={6}><FormControlLabel control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active" /></Grid>}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }} onClick={handleSave}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
