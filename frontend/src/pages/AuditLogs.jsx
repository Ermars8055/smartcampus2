import { useState, useEffect } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip
} from '@mui/material';
import api from '../services/api';

const getActionStyle = (action) => {
  const base = { borderRadius: '6px', fontWeight: 600, fontSize: '0.7rem', height: 24, px: 1 };
  switch (action?.toUpperCase()) {
    case 'CREATE': return { ...base, bgcolor: '#10B981', color: '#fff' };
    case 'UPDATE': return { ...base, bgcolor: '#F59E0B', color: '#fff' };
    case 'DELETE': return { ...base, bgcolor: '#EF4444', color: '#fff' };
    case 'APPROVE': return { ...base, bgcolor: '#0FA47F', color: '#fff' };
    case 'REJECT': return { ...base, bgcolor: '#991B1B', color: '#fff' };
    case 'LOGIN': return { ...base, bgcolor: '#3B82F6', color: '#fff' };
    case 'LOGOUT': return { ...base, bgcolor: '#8B5CF6', color: '#fff' };
    case 'REGISTER': return { ...base, bgcolor: '#06B6D4', color: '#fff' };
    case 'CONVERT': return { ...base, bgcolor: '#1E40AF', color: '#fff' };
    case 'CANCEL': return { ...base, bgcolor: '#6B7280', color: '#fff' };
    default: return { ...base, bgcolor: '#475569', color: '#fff' };
  }
};

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    api.get('/api/admin/audit-logs').then(r => setAuditLogs(r.data.items || []));
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Audit Logs</Typography>

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
                  <TableCell><Chip label={log.action} size="small" sx={getActionStyle(log.action)} /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{log.entity_type}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{log.entity_id}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.new_values || log.old_values || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
