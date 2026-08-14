import { useState, useEffect, useCallback } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, TextField, MenuItem, Select, InputAdornment, TablePagination, Stack, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton
} from '@mui/material';
import { Search as SearchIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
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
    case 'SHORT_CLOSE': return { ...base, bgcolor: '#4B5563', color: '#fff' };
    default: return { ...base, bgcolor: '#475569', color: '#fff' };
  }
};

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState('');

  const handleOpenDetails = (details) => {
    let formatted = details;
    try {
      if (typeof details === 'string' && (details.startsWith('{') || details.startsWith('['))) {
        formatted = JSON.stringify(JSON.parse(details), null, 2);
      }
    } catch(e) {}
    setSelectedDetails(formatted);
    setDetailsDialogOpen(true);
  };

  const renderDetails = (log) => {
    const raw = log.new_values || log.old_values || '';
    if (!raw) return '-';
    const isLong = raw.length > 50;
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {raw}
        </Box>
        {isLong && (
          <IconButton size="small" onClick={() => handleOpenDetails(raw)} title="View Details">
            <VisibilityIcon fontSize="small" sx={{ color: '#3B82F6' }} />
          </IconButton>
        )}
      </Stack>
    );
  };

  const fetchLogs = useCallback(() => {
    api.get('/api/admin/audit-logs', {
      params: {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      }
    }).then(r => {
      setAuditLogs(r.data.items || []);
      setTotal(r.data.total || 0);
    });
  }, [page, rowsPerPage, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Audit Logs</Typography>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
            sx={{ width: 300 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="created_at">Timestamp</MenuItem>
              <MenuItem value="action">Action</MenuItem>
              <MenuItem value="entity_type">Entity</MenuItem>
              <MenuItem value="username">User</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Order</InputLabel>
            <Select
              value={sortOrder}
              label="Order"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

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
                  <TableCell>{renderDetails(log)}</TableCell>
                </TableRow>
              ))}
              {auditLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </Card>

      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Log Details</DialogTitle>
        <DialogContent dividers>
          <Box
            component="pre"
            sx={{
              p: 2,
              bgcolor: '#F8FAFC',
              borderRadius: 1,
              fontSize: '0.8rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0
            }}
          >
            {selectedDetails}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
