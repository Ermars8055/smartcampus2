import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, IconButton, Tooltip, MenuItem,
  Select, FormControl, InputLabel, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, AccountTree as FlowIcon } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function ApprovalFlows() {
  const { showMessage } = useMessage();
  const [approvalFlows, setApprovalFlows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ document_type: 'INDENT', level: 1, role_name: '', user_id: '', min_amount: 0, max_amount: null, is_active: true });

  const load = () => {
    api.get('/api/approval-flows').then(r => setApprovalFlows(r.data || [])).catch(() => setApprovalFlows([]));
    api.get('/api/rbac/roles').then(r => setRoles(r.data || [])).catch(() => setRoles([]));
    api.get('/api/admin/users').then(r => setUsers(r.data || [])).catch(() => setUsers([]));
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Approval Flows</Typography>

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

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <FlowIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {editing ? 'Edit Flow' : 'Create Flow'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure approval workflow rules.
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
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
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }} onClick={async () => {
            try {
              if (!form.document_type) return showMessage('Document Type is required', 'Validation Error', 'warning');
              if (!form.role_name) return showMessage('Role Required is mandatory', 'Validation Error', 'warning');
              if (!Number.isInteger(Number(form.level)) || Number(form.level) < 1) {
                return showMessage('Level must be a positive integer (e.g., 1, 2, 3)', 'Validation Error', 'warning');
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
            } catch (err) {
              showMessage(err.response?.data?.detail || 'An error occurred while saving.', 'Error', 'error');
            }
          }}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
