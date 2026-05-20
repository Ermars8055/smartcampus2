import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, Paper, Stack, Chip
} from '@mui/material';
import { CheckCircle, AssignmentTurnedIn } from '@mui/icons-material';
import api from '../services/api';

export default function PendingAcknowledgments() {
  const [issues, setIssues] = useState([]);

  const load = async () => {
    try {
      const issRes = await api.get('/api/issues');
      setIssues(issRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const acknowledgeIssue = async (issueId) => {
    try {
      await api.put(`/api/issues/${issueId}/acknowledge`);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const pendingAcks = issues.filter(iss => !iss.is_acknowledged && iss.indent_id);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: 2, color: '#D97706', display: 'flex' }}>
          <AssignmentTurnedIn fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>My Pending Acknowledgments</Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>Materials issued to you by the store. Please verify and acknowledge receipt.</Typography>
        </Box>
      </Box>

      {pendingAcks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
          <CheckCircle sx={{ fontSize: 64, color: '#94A3B8', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>All caught up!</Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>No pending materials to acknowledge.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pendingAcks.map(iss => (
            <Grid item xs={12} md={6} xl={4} key={iss.id}>
              <Card sx={{
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                borderTop: '4px solid #F59E0B',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{iss.issue_number}</Typography>
                      <Chip label={`Against: ${iss.indent_number}`} size="small" sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569', alignSelf: 'flex-start' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, bgcolor: '#F8FAFC', px: 1, py: 0.5, borderRadius: 1 }}>
                      {formatDate(iss.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2, mb: 3, border: '1px solid #FEF3C7' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block', mb: 0.25 }}>Issued by:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#451A03' }}>{iss.issued_by_name || 'Store Admin'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block', mb: 0.25 }}>Issued from:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#451A03' }}>{iss.warehouse_name || 'Central Store'}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block', mb: 0.25 }}>Remarks:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#451A03' }}>{iss.purpose || 'Issued from store'}</Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 3, flexGrow: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Items Issued ({iss.items?.length || 0})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                      <Table size="small" sx={{ '& .MuiTableCell-root': { px: 1.5, py: 1, fontSize: '0.8rem' } }}>
                        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>ITEM</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#64748B' }}>UNIT</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#64748B' }}>QTY</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {iss.items?.map((item, idx) => (
                            <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                              <TableCell sx={{ fontWeight: 700, color: '#1E293B' }}>{item.material_name}</TableCell>
                              <TableCell align="center" sx={{ color: '#64748B' }}>{item.uom_name || 'Unit'}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 800, color: '#1E293B' }}>{item.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => acknowledgeIssue(iss.id)}
                    size="large"
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      fontWeight: 700,
                      bgcolor: '#F59E0B',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                      '&:hover': { bgcolor: '#D97706', boxShadow: '0 6px 16px rgba(245, 158, 11, 0.3)' }
                    }}
                  >
                    Acknowledge Receipt
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
