import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, Typography, CircularProgress, Chip, Grid, Divider, Alert, Button } from '@mui/material';
import { Build, QrCodeScanner, VerifiedUser, ErrorOutline, MedicalServices, ReportProblem } from '@mui/icons-material';
import api from '../services/api';
import theme from '../theme'; // assuming we can import the theme
import dayjs from 'dayjs';

export default function QREquipmentView() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = window.location.href ? null : null; // We'll just use an anchor tag or window.location.href directly

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await api.get(`/api/equipment/by-code/${id}`);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Equipment not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#F8FAFC' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#F8FAFC', p: 3 }}>
        <ErrorOutline color="error" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" color="error" sx={{ fontWeight: 700, mb: 1 }}>Not Found</Typography>
        <Typography color="text.secondary" align="center">{error}</Typography>
      </Box>
    );
  }

  const isOperational = data.status === 'Operational';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', p: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Card sx={{ 
        maxWidth: 500, 
        w: '100%', 
        width: '100%',
        borderRadius: 4, 
        overflow: 'hidden', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header Section */}
        <Box sx={{ 
          background: isOperational ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
          p: 4,
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Chip 
                icon={isOperational ? <VerifiedUser sx={{ color: 'white !important' }}/> : <Build sx={{ color: 'white !important' }}/>} 
                label={data.status} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, mb: 2, backdropFilter: 'blur(4px)' }} 
              />
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
                {data.equipment_name}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                {data.asset_id}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
              <QrCodeScanner fontSize="large" sx={{ color: 'white' }} />
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box sx={{ p: 3, pt: 4 }}>
          {data.department === "Biomedical Engineering Department" && (
            <Alert severity="info" icon={<MedicalServices />} sx={{ mb: 3, borderRadius: 2 }}>
              This is a registered Biomedical Asset.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Location</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.department_used || 'Unassigned'}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Serial Number</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.serial_number || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Make / Model</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.make_model || 'N/A'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Machine Type</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.machine_type || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Procurement</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.procurement_type || 'N/A'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Installation</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.installation_status}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Next PM Due</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.pm_due_date ? dayjs(data.pm_due_date).format('DD MMM YYYY') : 'Not Scheduled'}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Warranty</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.warranty_available ? `Active until ${dayjs(data.warranty_expiry_date).format('DD MMM YYYY')}` : 'Not Available'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>AMC / CMC</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B', mt: 0.5 }}>
                {data.amc_cmc_status && data.amc_cmc_status !== 'None' ? `${data.amc_cmc_status} until ${dayjs(data.amc_cmc_end_date).format('DD MMM YYYY')}` : 'None'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>GRN Reference</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', mt: 0.5 }}>
                {data.grn_number || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<ReportProblem />}
              onClick={() => {
                // Navigate to complaints page with the equipment pre-selected via query params
                // This will prompt for login if they aren't authenticated
                window.location.href = `/complaints/new?equipment_code=${encodeURIComponent(data.asset_id)}&department=${encodeURIComponent(data.department_used || '')}`;
              }}
              sx={{ 
                borderRadius: 8, 
                px: 4, 
                py: 1.5, 
                fontWeight: 700,
                boxShadow: '0 8px 16px rgba(225, 29, 72, 0.25)'
              }}
              fullWidth
            >
              Raise Complaint
            </Button>
          </Box>
        </Box>
        
        {/* Footer */}
        <Box sx={{ bgcolor: '#F8FAFC', p: 2, textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            SmartCampus Asset Management System
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
