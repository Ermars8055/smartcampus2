import { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Grid, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, MenuItem,
  Select, FormControl, InputLabel, Switch, FormControlLabel, Checkbox,
  ListItemText
} from '@mui/material';
import { Add, Edit, PersonAdd } from '@mui/icons-material';
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
  const { user: currentUser } = useAuth();

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
                  <TableCell>Tenant</TableCell><TableCell>Role</TableCell><TableCell>Sites</TableCell>
                  <TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.username}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{u.full_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{u.tenant_name || 'Platform'}</TableCell>
                      <TableCell><Chip label={u.role_name || u.role} size="small" color={roleColor[u.role_name || u.role] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        {(u.sites || []).length === 0 ? (
                          <Typography variant="caption" color="text.secondary">No site access</Typography>
                        ) : (
                          (u.sites || []).map(site => (
                            <Chip key={site.site_id} label={site.site_name || `Site ${site.site_id}`} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))
                        )}
                      </TableCell>
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

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {tab === 2 ? (editing ? 'Edit Flow' : 'Create Flow') : (editing ? 'Edit User' : 'Create User')}
        </DialogTitle>
        <DialogContent>
          {tab === 2 ? (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={6}>
                <FormControl fullWidth>
                  <InputLabel>Document Type</InputLabel>
                  <Select value={form.document_type || 'INDENT'} label="Document Type" onChange={e => setForm({ ...form, document_type: e.target.value })}>
                    <MenuItem value="INDENT">Indent</MenuItem>
                    <MenuItem value="PURCHASE_REQUEST">Purchase Request</MenuItem>
                    <MenuItem value="PURCHASE_ORDER">Purchase Order</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}><TextField fullWidth label="Level (e.g. 1, 2)" type="number" value={form.level} onChange={e => setForm({ ...form, level: Number(e.target.value) })} required /></Grid>
              <Grid size={6}>
                <FormControl fullWidth><InputLabel>Role Required</InputLabel>
                  <Select value={form.role_name || ''} label="Role Required" onChange={e => setForm({ ...form, role_name: e.target.value })}>
                    {roles.map(r => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}>
                <FormControl fullWidth><InputLabel>Specific User (Optional)</InputLabel>
                  <Select value={form.user_id || ''} label="Specific User (Optional)" onChange={e => setForm({ ...form, user_id: e.target.value })}>
                    <MenuItem value=""><em>Any User</em></MenuItem>
                    {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={6}><TextField fullWidth label="Min Amount" type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: Number(e.target.value) })} /></Grid>
              <Grid size={6}><TextField fullWidth label="Max Amount (Leave empty for No Limit)" type="number" value={form.max_amount || ''} onChange={e => setForm({ ...form, max_amount: e.target.value ? Number(e.target.value) : null })} /></Grid>
              <Grid size={12}><FormControlLabel control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active" /></Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {!editing && <Grid size={6}><TextField fullWidth label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></Grid>}
            <Grid size={editing ? 12 : 6}><TextField fullWidth label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></Grid>
            <Grid size={6}><TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Grid>
            {currentUser?.tenant_id == null && (
              <Grid size={6}>
                <FormControl fullWidth required={!editing}>
                  <InputLabel>Tenant</InputLabel>
                  <Select
                    value={form.tenant_id || ''}
                    label="Tenant"
                    disabled={editing}
                    onChange={e => setForm({ ...form, tenant_id: e.target.value, role_id: '', site_ids: [] })}
                  >
                    {tenants.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={6}>
              <FormControl fullWidth><InputLabel>Role</InputLabel>
                <Select
                  value={form.role_id || ''}
                  label="Role"
                  onChange={e => {
                    const selectedRole = tenantRoles.find(role => role.id === Number(e.target.value));
                    setForm({ ...form, role_id: e.target.value, role: selectedRole?.name || form.role });
                  }}
                >
                  {tenantRoles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
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
            {!editing && <Grid size={12}><TextField fullWidth label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></Grid>}
            {editing && <Grid size={12}><FormControlLabel control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active" /></Grid>}
          </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            if (tab === 2) {
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
          }}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
