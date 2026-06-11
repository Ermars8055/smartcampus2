import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Snackbar, Alert, Table, TableBody, TableCell, TableHead, TableRow, Tooltip
} from '@mui/material';
import { ArrowBack, CheckCircle, Assignment, PhotoCamera, Close, AddShoppingCart } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [materialIssues, setMaterialIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [resolutionPreviewUrls, setResolutionPreviewUrls] = useState([]);
  const [resolving, setResolving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchComplaintData();
  }, [id]);

  const fetchComplaintData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/complaints/${id}`);
      setComplaint(res.data);
      
      // Fetch material issues linked to this complaint
      const issuesRes = await api.get('/api/issues', { params: { complaint_id: id } });
      // In case the API doesn't support complaint_id filter directly yet, we can filter locally or assume it works
      // We will filter locally if needed, but assuming backend can handle it if we modify issues list endpoint or we just show a placeholder
      setMaterialIssues(issuesRes.data.filter(i => i.complaint_id === parseInt(id)));
    } catch (error) {
      console.error('Failed to fetch details', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/api/complaints/${id}`, { status: newStatus });
      fetchComplaintData();
      setSnackbar({ open: true, message: `Status updated to ${newStatus}`, severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleResolutionImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setResolutionImages(prev => [...prev, ...filesArray]);

      const urls = filesArray.map(f => URL.createObjectURL(f));
      setResolutionPreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const removeResolutionImage = (index) => {
    setResolutionImages(prev => prev.filter((_, i) => i !== index));
    setResolutionPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      const uploadedUrls = [];
      for (const file of resolutionImages) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(uploadRes.data.url);
      }

      await api.post(`/api/complaints/${id}/resolve`, {
        resolution_remarks: resolutionRemarks,
        resolution_image_urls: uploadedUrls
      });

      setSnackbar({ open: true, message: 'Complaint resolved successfully', severity: 'success' });
      setResolveDialogOpen(false);
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to resolve complaint', severity: 'error' });
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!complaint) return <Typography>Complaint not found.</Typography>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'error';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      default: return 'default';
    }
  };

  const preRepairImages = complaint.images.filter(img => !img.is_resolution_image);
  const postRepairImages = complaint.images.filter(img => img.is_resolution_image);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/complaints')}><ArrowBack /></IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Complaint Details</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip label={complaint.status} color={getStatusColor(complaint.status)} sx={{ fontWeight: 'bold' }} />
          {complaint.status === 'Open' && (
            <Button variant="outlined" onClick={() => handleStatusChange('In Progress')}>Mark In Progress</Button>
          )}
          {complaint.status !== 'Resolved' && (
            <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => setResolveDialogOpen(true)}>
              Resolve Complaint
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="textSecondary">Docket No</Typography>
                <Typography variant="body1" fontWeight={500}>{complaint.docket_no}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="textSecondary">Date & Time</Typography>
                <Typography variant="body1">{dayjs(complaint.complaint_date).format('DD MMM YYYY')} {complaint.complaint_time}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="textSecondary">Location / Dept</Typography>
                <Typography variant="body1">{complaint.building_name || complaint.location || complaint.department_name || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Nature of Complaint</Typography>
                <Typography variant="body1">{complaint.nature_of_complaint || '-'}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Individual Detailed</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{complaint.individual_detailed || '-'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {preRepairImages.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>Pre-Repair Photos</Typography>
              <Grid container spacing={2}>
                {preRepairImages.map((img) => (
                  <Grid item xs={6} sm={4} key={img.id}>
                    <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={api.defaults.baseURL + img.image_url} alt="Pre Repair" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {complaint.status === 'Resolved' && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Typography variant="h6" sx={{ color: '#166534', mb: 2 }}>Resolution Details</Typography>
              <Typography variant="caption" color="textSecondary">Resolved By: {complaint.resolved_by_name} on {complaint.resolved_at ? dayjs(complaint.resolved_at).format('DD MMM YYYY HH:mm') : '-'}</Typography>
              <Typography variant="body1" sx={{ mt: 1, mb: 2, whiteSpace: 'pre-wrap' }}>{complaint.resolution_remarks || 'No remarks provided.'}</Typography>
              
              {postRepairImages.length > 0 && (
                <Grid container spacing={2}>
                  {postRepairImages.map((img) => (
                    <Grid item xs={6} sm={4} key={img.id}>
                      <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #BBF7D0' }}>
                        <img src={api.defaults.baseURL + img.image_url} alt="Post Repair" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6" sx={{ color: '#1E3A8A' }}>Materials Issued</Typography>
               <Tooltip title="Issue Material">
                 <IconButton color="primary" onClick={() => navigate(`/issues/new?complaint_id=${id}`)}>
                    <AddShoppingCart />
                 </IconButton>
               </Tooltip>
             </Box>
             {materialIssues.length === 0 ? (
               <Typography variant="body2" color="textSecondary">No materials issued for this complaint.</Typography>
             ) : (
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell>Issue No</TableCell>
                     <TableCell>Status</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {materialIssues.map((issue) => (
                     <TableRow key={issue.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/issues/${issue.id}`)}>
                       <TableCell>{issue.issue_number}</TableCell>
                       <TableCell><Chip size="small" label={issue.status} color={issue.status === 'Issued' ? 'success' : 'default'} /></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
          </Paper>
        </Grid>
      </Grid>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => !resolving && setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Resolve Complaint</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Remarks"
            fullWidth
            multiline
            rows={3}
            value={resolutionRemarks}
            onChange={(e) => setResolutionRemarks(e.target.value)}
            sx={{ mb: 3, mt: 1 }}
          />
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Post-Repair Photos (Optional)</Typography>
          <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#F8FAFC', mb: 2 }}>
             <input type="file" multiple accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handleResolutionImageChange} />
            <Button variant="outlined" startIcon={<PhotoCamera />} onClick={() => fileInputRef.current.click()} size="small">
              Capture / Select Photos
            </Button>
          </Box>

          {resolutionPreviewUrls.length > 0 && (
            <Grid container spacing={2}>
              {resolutionPreviewUrls.map((url, idx) => (
                <Grid item xs={4} key={idx}>
                  <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <img src={url} alt={`Preview ${idx}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" onClick={() => removeResolutionImage(idx)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)' }}>
                      <Close fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setResolveDialogOpen(false)} disabled={resolving}>Cancel</Button>
          <Button onClick={handleResolve} variant="contained" color="success" disabled={resolving} startIcon={resolving ? <CircularProgress size={20} /> : <CheckCircle />}>
            Mark Resolved
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
