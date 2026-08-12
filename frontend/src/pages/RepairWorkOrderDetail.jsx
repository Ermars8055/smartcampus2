import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, Button, IconButton, Chip,
  Divider, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
} from '@mui/material';
import { ArrowBack, Assignment, Handyman, CheckCircle, VerifiedUser, Print, Construction, AddShoppingCart } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { printRwo } from '../utils/rwoPrint';

export default function RepairWorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [rwo, setRwo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [technician, setTechnician] = useState('');
  const [serviceRemarks, setServiceRemarks] = useState('');
  
  const [materialIndents, setMaterialIndents] = useState([]);
  const [materialIssues, setMaterialIssues] = useState([]);

  const load = async () => {
    try {
      const res = await api.get(`/api/rwos/${id}`);
      setRwo(res.data);
      setTechnician(res.data.technician_name || '');
      setServiceRemarks(res.data.problem_description || '');

      let indentIds = [];
      try {
        const indentsRes = await api.get('/api/indents', { params: { rwo_id: id } });
        setMaterialIndents(indentsRes.data || []);
        indentIds = (indentsRes.data || []).map(i => i.id);
      } catch (err) {
        console.warn('Failed to fetch indents', err);
      }
      
      try {
        const issuesRes = await api.get('/api/store-ops/issues');
        setMaterialIssues((issuesRes.data || []).filter(i => indentIds.includes(i.indent_id)));
      } catch (err) {
        console.warn('Failed to fetch issues', err);
      }
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error loading RWO', 'Error', 'error');
    }
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

  const handleMarkMaterialRequired = async () => {
    updateStatus('Awaiting Spare Parts', { material_required: true });
  };

  if (!rwo) return null;

  const canStartRepair = rwo.material_required 
    ? (materialIndents.length > 0 && materialIndents.every(ind => materialIssues.some(mi => mi.indent_id === ind.id && mi.is_acknowledged)))
    : true;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

        <Button
          variant="contained"
          color="primary"
          startIcon={<Print />}
          onClick={() => printRwo(rwo)}
          sx={{ fontWeight: 600, borderRadius: 2 }}
        >
          Print Work Order
        </Button>
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
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{rwo.equipment_name ? `${rwo.equipment_name}${rwo.equipment_serial ? ` (SN: ${rwo.equipment_serial})` : (rwo.equipment_code ? ` (${rwo.equipment_code})` : '')}` : (rwo.equipment_serial || rwo.equipment_code || '-')}</Typography>
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
              <Tooltip title={rwo.material_required && !canStartRepair ? "Waiting for materials to be issued and accepted" : ""}>
                <span>
                  <Button
                    fullWidth
                    variant={rwo.status === 'Assigned' || rwo.status === 'Awaiting Spare Parts' ? 'contained' : 'outlined'}
                    color="primary"
                    startIcon={<Handyman />}
                    onClick={() => updateStatus('In Progress', { technician_name: technician })}
                    disabled={updating || !canStartRepair || (rwo.status !== 'Assigned' && rwo.status !== 'Awaiting Spare Parts')}
                    sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 600 }}
                  >
                    Start Repair (In Progress)
                  </Button>
                </span>
              </Tooltip>

              {rwo.status === 'Assigned' && !rwo.material_required && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Construction />}
                  onClick={handleMarkMaterialRequired}
                  disabled={updating}
                  sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 600 }}
                >
                  Mark Material Required
                </Button>
              )}
              
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

      {(rwo.material_required || rwo.status === 'Awaiting Spare Parts') && (
        <Card sx={{ p: 3, borderRadius: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Material Requests (Indents)</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddShoppingCart />}
              onClick={() => navigate(`/indents?new=true&rwo_id=${id}`)}
              disabled={rwo.status === 'Completed' || rwo.status === 'Closed'}
            >
              Request Material
            </Button>
          </Box>
          
          {materialIndents.length === 0 ? (
            <Typography color="text.secondary">No materials requested yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Indent #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materialIndents.map(ind => (
                    <TableRow key={ind.id}>
                      <TableCell>{ind.indent_number}</TableCell>
                      <TableCell>{dayjs(ind.created_at).format('DD-MMM-YYYY')}</TableCell>
                      <TableCell><Chip size="small" label={ind.status} color="default" /></TableCell>
                      <TableCell>${Number(ind.total_amount?.toFixed(2))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

    </Box>
  );
}
