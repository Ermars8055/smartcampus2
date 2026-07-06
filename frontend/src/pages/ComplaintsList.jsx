import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Chip, TextField, MenuItem, Select, FormControl, InputLabel, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
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
      case 'Registered': case 'Open': return 'primary';
      case 'Assigned': return 'secondary';
      case 'Under Inspection': return 'info';
      case 'Material Pending': return 'warning';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'success';
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1E293B' }}>
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
            sx={{ background: '#2563EB', '&:hover': { background: '#1D4ED8' } }}
          >
            Raise Complaint
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search by Docket No or Nature"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="Registered">Registered</MenuItem>
            <MenuItem value="Open">Open (Legacy)</MenuItem>
            <MenuItem value="Assigned">Assigned</MenuItem>
            <MenuItem value="Under Inspection">Under Inspection</MenuItem>
            <MenuItem value="Material Pending">Material Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>

            <MenuItem value="Closed">Closed</MenuItem>
            <MenuItem value="Reopened">Reopened</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ background: '#F8FAFC' }}>
            <TableRow>
              <TableCell>Docket No</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Institution</TableCell>
              <TableCell>Location / Dept</TableCell>
              <TableCell>Raised By</TableCell>
              <TableCell>Nature of Complaint</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
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
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{row.docket_no}</TableCell>
                  <TableCell>
                    {dayjs(row.complaint_date).format('DD MMM YYYY')} {row.complaint_time}
                  </TableCell>
                  <TableCell>
                    {row.institution_name || '-'}
                  </TableCell>
                  <TableCell>
                    {row.building_name ? `${row.building_name} - ${row.room_name || ''}` : row.location || row.department_name}
                  </TableCell>
                  <TableCell>
                    {row.created_by_name || '-'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.nature_of_complaint}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <span>
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/complaints/edit/${row.id}`)} 
                          sx={{ color: '#2563EB' }}
                          disabled={!['Registered', 'Open', 'Reopened'].includes(row.status)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Cancel Complaint">
                      <IconButton size="small" onClick={() => setShortCloseDialog({ open: true, complaintId: row.id })} color="error">
                        <Cancel fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
