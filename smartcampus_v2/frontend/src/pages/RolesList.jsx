import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, IconButton, Tooltip
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RolesList() {
  const [roles, setRoles] = useState([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/rbac/roles').then(r => setRoles(r.data || [])).catch(() => setRoles([]));
  }, [currentUser?.tenant_id]);

  const selectedTenantId = currentUser?.tenant_id;
  const tenantRoles = roles.filter(role => !selectedTenantId || role.tenant_id === Number(selectedTenantId));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Roles</Typography>

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
    </Box>
  );
}
