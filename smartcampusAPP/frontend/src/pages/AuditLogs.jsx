import { useState, useEffect } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip
} from '@mui/material';
import api from '../services/api';

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
    </Box>
  );
}
