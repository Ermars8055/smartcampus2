import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, Typography, CircularProgress, Chip, Grid, Divider } from '@mui/material';
import { Inventory, QrCodeScanner, ErrorOutline, Category, Straighten, Warehouse } from '@mui/icons-material';
import api from '../services/api';
import theme from '../theme';

export default function QRMaterialView() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await api.get(`/api/materials/by-code/${code}`);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Material not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [code]);

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

  const isActive = data.is_active;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F1F5F9', p: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <Card sx={{ 
        maxWidth: 500, 
        width: '100%',
        borderRadius: 4, 
        overflow: 'hidden', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header Section */}
        <Box sx={{ 
          background: isActive ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
          p: 4,
          color: 'white',
          position: 'relative'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Chip 
                icon={<Inventory sx={{ color: 'white !important', fontSize: '16px !important' }}/>} 
                label={isActive ? 'Active Material' : 'Inactive Material'} 
                size="small" 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, mb: 2, backdropFilter: 'blur(4px)' }} 
              />
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
                {data.name}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                Code: {data.code}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
              <QrCodeScanner fontSize="large" sx={{ color: 'white' }} />
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box sx={{ p: 3, pt: 4 }}>
          <Grid container spacing={3}>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Category sx={{ color: '#64748B', mt: 0.5 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Category / Subcategory</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {data.category_name} <span style={{ color: '#94A3B8' }}>/</span> {data.subcategory_name}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Straighten sx={{ color: '#64748B', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>UOM</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {data.uom_name}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Category sx={{ color: '#64748B', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {data.material_type}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Warehouse sx={{ color: '#64748B', fontSize: 20 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Storage Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {data.storage_type}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Footer */}
        <Box sx={{ bgcolor: '#F8FAFC', p: 2, textAlign: 'center', borderTop: '1px solid #E2E8F0' }}>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            SmartCampus Material Master
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
