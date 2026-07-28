import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, CircularProgress, Alert, Grid, Paper
} from '@mui/material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function EquipmentCountReport() {
  const { showMessage } = useMessage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/equipment/reports/count');
      setData(res.data || []);
    } catch (err) {
      showMessage('Failed to load equipment counts', 'Error', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalEquipment = data.reduce((sum, item) => sum + item.count, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 3 }}>
        Equipment Count Report
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <Typography variant="subtitle2" sx={{ color: '#1D4ED8', fontWeight: 700, mb: 1 }}>
              TOTAL EQUIPMENT
            </Typography>
            <Typography variant="h3" sx={{ color: '#1E3A8A', fontWeight: 900 }}>
              {totalEquipment}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <Typography variant="subtitle2" sx={{ color: '#15803D', fontWeight: 700, mb: 1 }}>
              UNIQUE CATEGORIES
            </Typography>
            <Typography variant="h3" sx={{ color: '#166534', fontWeight: 900 }}>
              {data.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Equipment Name (Material)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#334155' }}>Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                    {row.equipment_name}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {row.count}
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 3, color: '#94A3B8' }}>
                    No equipment data found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
