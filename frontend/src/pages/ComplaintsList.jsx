import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Chip, TextField, MenuItem, Select, FormControl, InputLabel, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Card, Tabs, Tab
} from '@mui/material';
import { Add, Edit, Cancel, ArrowBack } from '@mui/icons-material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const [shortCloseDialog, setShortCloseDialog] = useState({ open: false, complaintId: null });
  const [shortCloseRemarks, setShortCloseRemarks] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/api/complaints', { params: { status: statusFilter || undefined } });
      setComplaints(res.data);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const instId = searchParams.get('inst');
    if (instId && instId !== 'all') {
      if (c.institution_id !== parseInt(instId, 10)) {
        return false;
      }
    }
    return c.docket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.nature_of_complaint && c.nature_of_complaint.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Registered': case 'Open': return 'info';
      case 'Assigned': return 'primary';
      case 'Under Inspection': return 'info';
      case 'Material Pending': return 'error';
      case 'In Progress': return 'warning';
      case 'Pending Approval': case 'Pending Admin Approval': return 'info';
      case 'Resolved': return 'success';
      case 'Closed': return 'default';
      case 'Reopened': return 'error';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const handleShortClose = async () => {
    try {
      await api.put(`/api/complaints/${shortCloseDialog.complaintId}`, {
        status: 'Closed',
        resolution_remarks: shortCloseRemarks
      });
      setShortCloseDialog({ open: false, complaintId: null });
      setShortCloseRemarks('');
      fetchComplaints();
    } catch (error) {
      console.error('Failed to short close complaint', error);
    }
  };

  const getStatusCount = (statusName) => {
    if (statusName === 'All') return complaints.length;
    return complaints.filter(c => c.status === statusName).length;
  };

  const STATUS_TABS = [
    'Registered', 'Assigned', 'Under Inspection', 'Material Pending', 
    'In Progress', 'Pending Approval', 'Closed', 'Reopened', 'All'
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Complaint Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {location.state?.fromDashboard && (
            <Button size="small" variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/complaints/new')}
          >
            Raise Complaint
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="Search by Docket No or Nature"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Box>
          <Tabs
            value={statusFilter}
            onChange={(e, newVal) => setStatusFilter(newVal)}
            variant="scrollable"
            scrollButtons={false}
            sx={{ 
              minHeight: 40, 
              borderBottom: 1, 
              borderColor: 'divider', 
              '& .MuiTab-root': { 
                textTransform: 'none', 
                fontWeight: 600,
                minWidth: 'auto',
                px: 1.5,
                minHeight: 40,
                fontSize: '0.85rem'
              } 
            }}
          >
            {STATUS_TABS.map(tab => {
              const val = tab === 'All' ? '' : tab;
              return (
                <Tab 
                  key={tab}
                  value={val}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab}
                      <Chip
                        label={getStatusCount(tab)}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: statusFilter === val ? 'primary.main' : 'action.selected',
                          color: statusFilter === val ? 'white' : 'text.primary',
                        }}
                      />
                    </Box>
                  } 
                />
              );
            })}
          </Tabs>
        </Box>
      </Card>

      <Card>
      <TableContainer>
        <Table size="small" sx={{ '& .MuiTableCell-root': { px: 0.5, py: 0.5, borderBottom: '1px solid #f1f5f9' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>DOCKET NO</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>DATE & TIME</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>INSTITUTION</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>LOCATION / DEPT</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>RAISED BY</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>NATURE OF COMPLAINT</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComplaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">No complaints found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredComplaints.map((row) => (
                <TableRow 
                  key={row.id} 
                  hover 
                  onClick={() => navigate(`/complaints/${row.id}`)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.7rem', whiteSpace: 'nowrap', px: 2 }}>{row.docket_no}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {dayjs(row.complaint_date).format('DD MMM YYYY')} {row.complaint_time}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {row.institution_name || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {row.building_name ? `${row.building_name} - ${row.room_name || ''}` : row.location || row.department_name}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {row.created_by_name || '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.7rem' }}>
                    {row.nature_of_complaint}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Chip label={row.status} size="small" color={getStatusColor(row.status)} sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }} />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()} sx={{ px: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/complaints/edit/${row.id}`)} 
                            disabled={!['Registered', 'Open', 'Reopened'].includes(row.status)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Cancel Complaint">
                        <span>
                          <IconButton 
                            size="small" 
                            onClick={() => setShortCloseDialog({ open: true, complaintId: row.id })} 
                            color="error"
                            disabled={!['Registered', 'Open'].includes(row.status)}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Card>

      {/* Short Close Dialog */}
      <Dialog open={shortCloseDialog.open} onClose={() => setShortCloseDialog({ open: false, complaintId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Complaint</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Please provide a reason for cancelling this complaint.</Typography>
          <TextField inputProps={{ maxLength: 255 }}
            autoFocus
            label="Resolution Remarks"
            fullWidth
            multiline
            rows={3}
            value={shortCloseRemarks}
            onChange={(e) => setShortCloseRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShortCloseDialog({ open: false, complaintId: null })}>Close</Button>
          <Button onClick={handleShortClose} variant="contained" color="error" disabled={!shortCloseRemarks}>Cancel Complaint</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
