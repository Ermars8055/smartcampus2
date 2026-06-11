import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Chip, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Visibility, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

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

  const filteredComplaints = complaints.filter(c =>
    c.docket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.nature_of_complaint && c.nature_of_complaint.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'error';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#1E293B' }}>
          Complaint Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/complaints/new')}
          sx={{ background: '#2563EB', '&:hover': { background: '#1D4ED8' } }}
        >
          Raise Complaint
        </Button>
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
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
        <Table>
          <TableHead sx={{ background: '#F8FAFC' }}>
            <TableRow>
              <TableCell>Docket No</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Location / Dept</TableCell>
              <TableCell>Nature of Complaint</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComplaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="textSecondary">No complaints found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredComplaints.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{row.docket_no}</TableCell>
                  <TableCell>
                    {dayjs(row.complaint_date).format('DD MMM YYYY')} {row.complaint_time}
                  </TableCell>
                  <TableCell>
                    {row.building_name ? `${row.building_name} - ${row.room_name || ''}` : row.location || row.department_name}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.nature_of_complaint}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => navigate(`/complaints/${row.id}`)} sx={{ color: '#2563EB' }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
