import { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Grid, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, MenuItem,
  Select, FormControl, InputLabel, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, PersonAdd } from '@mui/icons-material';
import api from '../services/api';

export default function Admin() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', full_name: '', password: '', role: 'Engineer'
  });
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get('/api/admin/users').then(r => setUsers(r.data));
    api.get('/api/admin/audit-logs').then(r => setAuditLogs(r.data.items || []));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/api/admin/users/${editing}`, { full_name: form.full_name, role: form.role, email: form.email, is_active: form.is_active });
      } else {
        await api.post('/api/admin/users', form);
      }
      setDialog(false); setEditing(null); load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const roles = ['Admin', 'Purchase Manager', 'Store Keeper', 'Security', 'Engineer', 'Management'];
  const roleColor = { 'Admin': 'error', 'Purchase Manager': 'primary', 'Store Keeper': 'success', 'Security': 'warning', 'Engineer': 'info', 'Management': 'secondary' };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Administration</Typography>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Users (${users.length})`} sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label="Audit Logs" sx={{ textTransform: 'none', fontWeight: 500 }} />
        </Tabs>
      </Card>

      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={() => {
              setEditing(null); setForm({ username: '', email: '', full_name: '', password: '', role: 'Engineer' }); setDialog(true);
            }}>Add User</Button>
          </Box>
          <Card>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Username</TableCell><TableCell>Full Name</TableCell><TableCell>Email</TableCell>
                  <TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.username}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{u.full_name}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{u.email}</TableCell>
                      <TableCell><Chip label={u.role} size="small" color={roleColor[u.role] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} /></TableCell>
                      <TableCell><Chip label={u.is_active ? 'Active' : 'Inactive'} size="small" color={u.is_active ? 'success' : 'default'} variant="outlined" /></TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(u.created_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => {
                          setEditing(u.id); setForm({ ...u }); setDialog(true);
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

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {!editing && <Grid size={6}><TextField fullWidth label="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required /></Grid>}
            <Grid size={editing ? 12 : 6}><TextField fullWidth label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></Grid>
            <Grid size={6}><TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Grid>
            <Grid size={6}>
              <FormControl fullWidth><InputLabel>Role</InputLabel>
                <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value })}>
                  {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {!editing && <Grid size={12}><TextField fullWidth label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></Grid>}
            {editing && <Grid size={12}><FormControlLabel control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} />} label="Active" /></Grid>}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
