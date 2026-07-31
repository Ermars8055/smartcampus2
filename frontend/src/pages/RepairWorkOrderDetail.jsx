import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Button, IconButton, Chip,
  Divider, TextField
} from '@mui/material';
import { ArrowBack, Assignment, Handyman, CheckCircle, VerifiedUser } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function RepairWorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [rwo, setRwo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [technician, setTechnician] = useState('');
  const [serviceRemarks, setServiceRemarks] = useState('');

  const load = () => {
    api.get(`/api/rwos/${id}`).then(res => {
      setRwo(res.data);
      setTechnician(res.data.technician_name || '');
      setServiceRemarks(res.data.service_report_details || '');
    }).catch(err => {
      showMessage(err.response?.data?.detail || 'Error loading RWO', 'Error', 'error');
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async (newStatus, extraData = {}) => {
    setUpdating(true);
    try {
      await api.put(`/api/rwos/${id}`, { status: newStatus, ...extraData });
      showMessage(`Status updated to ${newStatus}`, 'Success', 'success');
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error updating status', 'Error', 'error');
    }
    setUpdating(false);
  };

  if (!rwo) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/rwos')} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
            Repair Work Order: {rwo.rwo_number}
            <Chip 
              label={rwo.status}
              size="small"
              sx={{
                bgcolor: rwo.status === 'Closed' ? '#ECFDF5' : (rwo.status === 'Completed' ? '#DBEAFE' : (rwo.status === 'Assigned' ? '#FEF9C3' : '#F1F5F9')),
                color: rwo.status === 'Closed' ? '#10B981' : (rwo.status === 'Completed' ? '#2563EB' : (rwo.status === 'Assigned' ? '#CA8A04' : '#64748B')),
                fontWeight: 600, ml: 2
              }}
            />
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Work Order Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Complaint Docket</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{rwo.docket_no || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Contract ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{rwo.contract_number || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Equipment Details</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{rwo.equipment_serial || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Problem Description</Typography>
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 1, mt: 0.5 }}>
                  <Typography variant="body2">{rwo.problem_description || 'No description provided.'}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Service Updates</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Technician Name"
                  value={technician}
                  onChange={e => setTechnician(e.target.value)}
                  disabled={rwo.status === 'Completed' || rwo.status === 'Closed'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Service/Repair Remarks"
                  value={serviceRemarks}
                  onChange={e => setServiceRemarks(e.target.value)}
                  disabled={rwo.status === 'Completed' || rwo.status === 'Closed'}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Lifecycle Actions</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant={rwo.status === 'Assigned' ? 'contained' : 'outlined'}
                color="primary"
                startIcon={<Handyman />}
                onClick={() => updateStatus('In Progress', { technician_name: technician })}
                disabled={rwo.status !== 'Assigned' || updating}
                sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 600 }}
              >
                Start Repair (In Progress)
              </Button>
              
              <Button
                variant={rwo.status === 'In Progress' ? 'contained' : 'outlined'}
                color="info"
                startIcon={<CheckCircle />}
                onClick={() => updateStatus('Completed', { technician_name: technician, problem_description: serviceRemarks || rwo.problem_description })}
                disabled={rwo.status !== 'In Progress' || updating}
                sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 600 }}
              >
                Complete Repair
              </Button>

              <Divider />

              <Button
                variant={rwo.status === 'Completed' ? 'contained' : 'outlined'}
                color="success"
                startIcon={<VerifiedUser />}
                onClick={() => updateStatus('Closed', { technician_name: technician, problem_description: serviceRemarks || rwo.problem_description })}
                disabled={rwo.status !== 'Completed' || updating}
                sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 600 }}
              >
                Verify & Close
              </Button>
            </Box>
          </Card>
          
          <Card sx={{ p: 3, borderRadius: 2 }}>
             <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Vendor Info</Typography>
             <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155', mb: 1 }}>{rwo.vendor_name}</Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
