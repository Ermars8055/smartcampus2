import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Grid, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, MenuItem,
  Select, FormControl, InputLabel, Switch, FormControlLabel, Checkbox,
  ListItemText, InputAdornment
} from '@mui/material';
import { Add, Edit, PersonAdd, AdminPanelSettings, AccountTree as FlowIcon, Security, Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role: 'Engineer',
  role_id: '',
  tenant_id: '',
  site_ids: [],
};

export default function Admin() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [approvalFlows, setApprovalFlows] = useState([]);
  const [sites, setSites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const load = () => {
    api.get('/api/admin/users').then(r => setUsers(r.data));
    api.get('/api/admin/audit-logs').then(r => setAuditLogs(r.data.items || []));
    api.get('/api/approval-flows').then(r => setApprovalFlows(r.data || [])).catch(() => setApprovalFlows([]));
    api.get('/api/sites').then(r => setSites(r.data || [])).catch(() => setSites([]));
    api.get('/api/rbac/roles').then(r => setRoles(r.data || [])).catch(() => setRoles([]));
    if (currentUser?.tenant_id == null) {
      api.get('/api/admin/saas/tenants').then(r => setTenants(r.data || [])).catch(() => setTenants([]));
    }
  };
  useEffect(() => { load(); }, [currentUser?.tenant_id]);

  const selectedTenantId = currentUser?.tenant_id || form.tenant_id;
  const tenantSites = sites.filter(site => !selectedTenantId || site.tenant_id === Number(selectedTenantId));
  const tenantRoles = roles.filter(role => !selectedTenantId || role.tenant_id === Number(selectedTenantId));
  const siteNameById = Object.fromEntries(sites.map(site => [site.id, site.name]));

  const handleSave = async () => {
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        role_id: form.role_id || null,
        tenant_id: currentUser?.tenant_id || form.tenant_id || null,
        site_ids: form.site_ids || [],
        is_active: form.is_active,
      };
      if (editing) {
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
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Administration</Typography>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Users (${users.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label="Audit Logs" sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label="Approval Flows" sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label="Roles" sx={{ textTransform: 'none', fontWeight: 500 }} />
        </Tabs>
      </Card>

      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => {
              setEditing(null); setForm({ ...emptyForm, tenant_id: currentUser?.tenant_id || '' }); setDialog(true);
            }}>Add User</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Username</TableCell><TableCell>Full Name</TableCell><TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.username}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{u.full_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</TableCell>

                      <TableCell><Chip label={u.role_name || u.role} size="small" color={roleColor[u.role_name || u.role] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                      <TableCell><Chip label={u.is_active ? 'Active' : 'Inactive'} size="small" color={u.is_active ? 'success' : 'default'} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(u.created_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => {
                          setEditing(u.id);
                          setForm({
                            ...emptyForm,
                            ...u,
                            role_id: u.role_id || '',
                            tenant_id: u.tenant_id || '',
                            site_ids: (u.sites || []).map(site => site.site_id),
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
        </>
      )}

      {tab === 1 && (
        <Card>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow>
                <TableCell>Timestamp</TableCell><TableCell>User</TableCell><TableCell>Action</TableCell>
                <TableCell>Entity</TableCell><TableCell>ID</TableCell><TableCell>Details</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {auditLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{formatDateTime(log.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{log.username || 'System'}</TableCell>
                    <TableCell><Chip label={log.action} size="small" color={log.action === 'CREATE' ? 'success' : log.action === 'DELETE' ? 'error' : 'info'} variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{log.entity_type}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{log.entity_id}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.new_values || log.old_values || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tab === 2 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setEditing(null); 
              setForm({ document_type: 'INDENT', level: 1, role_name: '', user_id: '', min_amount: 0, max_amount: null, is_active: true }); 
              setDialog(true);
            }}>Add Flow</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Document Type</TableCell><TableCell>Level</TableCell><TableCell>Role Required</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Min Amount</TableCell>
                  <TableCell>Max Amount</TableCell>
                  <TableCell>Status</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {approvalFlows.map(f => (
                    <TableRow key={f.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{f.document_type}</TableCell>
                      <TableCell>{f.level}</TableCell>
                      <TableCell><Chip label={f.role_name} size="small" color="primary" variant="outlined" /></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{f.user_full_name || '-'}</TableCell>
                      <TableCell>₹{f.min_amount}</TableCell>
                      <TableCell>{f.max_amount ? `₹${f.max_amount}` : 'No Limit'}</TableCell>
                      <TableCell><Chip label={f.is_active ? 'Active' : 'Inactive'} size="small" color={f.is_active ? 'success' : 'default'} /></TableCell>
                      <TableCell>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => {
                          setEditing(f.id);
                          setForm({ ...f });
                          setDialog(true);
                        }}><Edit fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {tab === 3 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/roles/new')}>Add Role</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Role Name</TableCell><TableCell>Code</TableCell><TableCell>Description</TableCell><TableCell>Permissions</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {tenantRoles.map(r => (
                    <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell><Chip label={r.code} size="small" variant="outlined" /></TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{r.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${(r.permissions || []).filter(p => p.can_read || p.can_create || p.can_update || p.can_delete).length} modules`}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: (r.permissions || []).length > 0 ? '#DCFCE7' : '#F1F5F9', color: (r.permissions || []).length > 0 ? '#166534' : '#94A3B8' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Configure"><IconButton size="small" onClick={() => navigate(`/admin/roles/${r.id}`)}><Edit fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              {tab === 2 ? <FlowIcon fontSize="medium" /> : <AdminPanelSettings fontSize="medium" />}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {tab === 2 ? (editing ? 'Edit Flow' : 'Create Flow') : (editing ? 'Edit User' : 'Create User')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tab === 2 ? 'Configure approval workflow rules.' : 'Manage user accounts and permissions.'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          {tab === 2 ? (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <FormControl fullWidth required>
                  <InputLabel>Document Type</InputLabel>
                  <Select value={form.document_type || 'INDENT'} label="Document Type" onChange={e => setForm({ ...form, document_type: e.target.value })}>
                    <MenuItem value="INDENT">Indent</MenuItem>
                    <MenuItem value="PURCHASE_REQUEST">Purchase Request</MenuItem>
                    <MenuItem value="PURCHASE_ORDER">Purchase Order</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  fullWidth 
                  label="Level (e.g. 1, 2)" 
                  type="number" 
                  value={form.level} 
                  onChange={e => setForm({ ...form, level: e.target.value })} 
                  required 
                  inputProps={{ min: 1, step: 1 }}
                  onKeyDown={(e) => { if (e.key === '.') e.preventDefault(); }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth required><InputLabel>Role Required</InputLabel>
                  <Select value={form.role_name || ''} label="Role Required" onChange={e => setForm({ ...form, role_name: e.target.value })}>
                    {roles.map(r => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth><InputLabel>Specific User (Optional)</InputLabel>
                  <Select value={form.user_id || ''} label="Specific User (Optional)" onChange={e => setForm({ ...form, user_id: e.target.value })}>
                    <MenuItem value=""><em>Any User</em></MenuItem>
                    {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}><TextField fullWidth label="Min Amount" type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: Number(e.target.value) })} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Max Amount (Leave empty for No Limit)" type="number" value={form.max_amount || ''} onChange={e => setForm({ ...form, max_amount: e.target.value ? Number(e.target.value) : null })} /></Grid>
              <Grid item xs={12}><FormControlLabel control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active" /></Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {!editing && <Grid item xs={6}><TextField fullWidth label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></Grid>}
            <Grid item xs={editing ? 12 : 6}><TextField fullWidth label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Grid>

            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Role</InputLabel>
                <Select
                  value={form.role_id || ''}
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
            {!editing && <Grid item xs={12}><TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} /></Grid>}
            {editing && <Grid item xs={12}><FormControlLabel control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active" /></Grid>}
          </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }} onClick={async () => {
            try {
              if (tab === 2) {
                if (!form.document_type) return alert('Document Type is required');
                if (!form.role_name) return alert('Role Required is mandatory');
                if (!Number.isInteger(Number(form.level)) || Number(form.level) < 1) {
                  return alert('Level must be a positive integer (e.g., 1, 2, 3)');
                }
                const payload = { 
                  ...form, 
                  level: Number(form.level), 
                  min_amount: Number(form.min_amount),
                  max_amount: form.max_amount === null || form.max_amount === '' ? null : Number(form.max_amount),
                  user_id: form.user_id || null
                };
                if (editing) await api.put(`/api/approval-flows/${editing}`, payload);
                else await api.post('/api/approval-flows', payload);
                setDialog(false); setEditing(null); load();
              } else {
                handleSave();
              }
            } catch (err) {
              alert(err.response?.data?.detail || 'An error occurred while saving.');
            }
          }}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
