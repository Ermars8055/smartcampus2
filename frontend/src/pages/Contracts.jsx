import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip,
  Tabs, Tab, Alert, useTheme, useMediaQuery
} from '@mui/material';
import {
  Add, Edit, Search, Description, CheckCircle, Cancel, RemoveRedEye
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function Contracts() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('All');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectingContract, setRejectingContract] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = () => {
    api.get('/api/contracts').then(r => {
      let data = [...r.data];
      if (search) {
        data = data.filter(c => 
          c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
          c.vendor_name?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setContracts(data);
    }).catch(err => {
      showMessage(err.response?.data?.detail || 'Error loading contracts', 'Error', 'error');
    });
  };

  useEffect(() => {
    load();
  }, [search]);

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/api/contracts/${id}/approve`);
      showMessage('Contract approved successfully', 'Success', 'success');
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error approving contract', 'Error', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) return;
    try {
      await api.post(`/api/contracts/${rejectingContract}/reject`, { remarks: rejectRemarks });
      showMessage('Contract rejected', 'Warning', 'warning');
      setRejectDialog(false);
      setRejectRemarks('');
      setRejectingContract(null);
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error rejecting contract', 'Error', 'error');
    }
  };

  const pendingApprovals = contracts.filter(c => c.status === 'Pending Approval'); // Assuming users see all pending approvals if they can view it. Access control is handled backend

  const filteredContracts = contracts.filter(c => tabValue === 'All' || c.status === tabValue);

  return (
    <Box>
      {pendingApprovals.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Action Required: There are {pendingApprovals.length} contract{pendingApprovals.length > 1 ? 's' : ''} awaiting approval.
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Contracts Management</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{contracts.length} total contracts</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => navigate('/contracts/new')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Create Contract
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, pb: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TextField
          size="small"
          placeholder="Search contracts by Number or Vendor"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 350, mb: 2 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} />,
            sx: { borderRadius: 2 }
          }}
        />
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          {['Pending Approval', 'Active', 'Expired', 'Closed', 'Rejected', 'All'].map(s => {
            const count = s === 'All' ? contracts.length : contracts.filter(c => c.status === s).length;
            if (s !== 'All' && count === 0 && !['Pending Approval', 'Active'].includes(s)) return null;
            return (
              <Tab
                key={s}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s}
                    <Chip
                      label={count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: tabValue === s ? 'primary.main' : 'action.selected', color: tabValue === s ? 'white' : 'text.primary' }}
                    />
                  </Box>
                }
                value={s}
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
              />
            )
          })}
        </Tabs>
      </Card>

      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>CONTRACT NO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>TYPE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>VENDOR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>VALIDITY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>VALUE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <Typography variant="body2">No contracts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredContracts.map(c => (
                <TableRow
                  key={c.id}
                  hover
                  onClick={() => navigate(`/contracts/edit/${c.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{c.contract_number}</TableCell>
                  <TableCell>
                    <Chip label={c.contract_type} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.vendor_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {c.start_date} to {c.end_date}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    ₹{c.contract_value?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={c.status}
                      size="small"
                      sx={{
                        bgcolor: c.status === 'Active' ? '#ECFDF5' : (c.status === 'Rejected' ? '#FEF2F2' : (c.status === 'Pending Approval' ? '#FEF9C3' : '#F1F5F9')),
                        color: c.status === 'Active' ? '#10B981' : (c.status === 'Rejected' ? '#EF4444' : (c.status === 'Pending Approval' ? '#CA8A04' : '#64748B')),
                        fontWeight: 600, fontSize: '0.7rem'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      {c.status === 'Pending Approval' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={(e) => handleApprove(c.id, e)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setRejectingContract(c.id); setRejectDialog(true); }} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title={c.status === 'Active' || c.status === 'Closed' ? "View Details" : "Edit Contract"}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/contracts/edit/${c.id}`); }} sx={{ color: '#64748B' }}>
                          {c.status === 'Active' || c.status === 'Closed' ? <RemoveRedEye fontSize="small" /> : <Edit fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Contract</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#475569' }}>
            Please provide a reason for rejecting this contract. This will be recorded.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Remarks"
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRejectDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error" 
            disabled={!rejectRemarks.trim()}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
