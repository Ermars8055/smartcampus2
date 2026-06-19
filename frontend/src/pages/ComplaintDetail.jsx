import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Snackbar, Alert, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Switch, FormControlLabel, Stepper, Step, StepLabel, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { ArrowBack, CheckCircle, Assignment, PhotoCamera, Close, AddShoppingCart, Build, Search, VerifiedUser, Cancel } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const COMPLAINT_STEPS = ['Registered', 'Assigned', 'Under Inspection', 'In Progress', 'Resolved', 'Closed'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [materialIndents, setMaterialIndents] = useState([]);
  const [materialIssues, setMaterialIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);

  // Form States
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [materialRequired, setMaterialRequired] = useState(false);
  const [inspectionDetails, setInspectionDetails] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [resolutionPreviewUrls, setResolutionPreviewUrls] = useState([]);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchComplaintData();
    fetchTechnicians();

    // Auto-refresh data every 10 seconds silently
    const interval = setInterval(() => {
      fetchComplaintData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchComplaintData = async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);
      const res = await api.get(`/api/complaints/${id}`);
      setComplaint(res.data);
      
      let fetchedIndents = [];
      let indentIds = [];
      try {
        const indentsRes = await api.get('/api/indents', { params: { complaint_id: id } });
        fetchedIndents = indentsRes.data || [];
        setMaterialIndents(fetchedIndents);
        indentIds = fetchedIndents.map(i => i.id);
      } catch (err) {
        console.warn('Failed to fetch indents or no permission', err);
      }
      
      try {
        const issuesRes = await api.get('/api/issues');
        // If MaterialIssue has complaint_id we use it, otherwise match via indent_id
        setMaterialIssues(issuesRes.data.filter(i => i.complaint_id === parseInt(id) || indentIds.includes(i.indent_id)));
      } catch (err) {
        console.warn('Failed to fetch issues or no permission', err);
      }
    } catch (error) {
      console.error('Failed to fetch details', error);
      if (!isPolling) setSnackbar({ open: true, message: 'Failed to fetch complaint details', severity: 'error' });
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setTechnicians(res.data.filter(t => t.role_name && t.role_name.toLowerCase().includes('technician')));
    } catch (error) {
      console.error('Failed to fetch technicians', error);
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

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleAssign = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/assign`, { assigned_to_id: selectedTech });
      setSnackbar({ open: true, message: 'Technician assigned successfully', severity: 'success' });
      setAssignDialogOpen(false);
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to assign technician', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspect = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/inspect`, { 
        material_required: materialRequired,
        inspection_details: inspectionDetails 
      });
      setSnackbar({ open: true, message: 'Inspection completed', severity: 'success' });
      setInspectDialogOpen(false);
      
      if (materialRequired) {
        navigate(`/indents?new=true&complaint_id=${id}`);
      } else {
        fetchComplaintData();
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to complete inspection', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRepair = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/start-repair`);
      setSnackbar({ open: true, message: 'Repair started', severity: 'success' });
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to start repair', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
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
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to resolve complaint', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (isAccepted) => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/verify`, {
        is_accepted: isAccepted,
        rejection_remarks: isAccepted ? null : rejectionRemarks,
        feedback: isAccepted ? feedback : null
      });
      setSnackbar({ open: true, message: isAccepted ? 'Complaint Closed' : 'Complaint Reopened', severity: 'success' });
      setVerifyDialogOpen(false);
      setRejectDialogOpen(false);
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Verification failed', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!complaint) return <Typography>Complaint not found.</Typography>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Registered': case 'Open': return 'primary';
      case 'Assigned': return 'secondary';
      case 'Under Inspection': return 'info';
      case 'Material Pending': return 'warning';
      case 'In Progress': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'default';
      case 'Reopened': return 'error';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  const getActiveStep = () => {
    switch(complaint.status) {
      case 'Registered': case 'Open': return 0;
      case 'Assigned': case 'Reopened': return 1;
      case 'Under Inspection': return 2;
      case 'Material Pending': case 'In Progress': return 3;
      case 'Resolved': return 4;
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const preRepairImages = complaint.images.filter(img => !img.is_resolution_image);
  const postRepairImages = complaint.images.filter(img => img.is_resolution_image);

  const canStartRepair = materialIndents.length === 0 || (materialIssues.length > 0 && materialIssues.every(issue => issue.is_acknowledged));
  const isCreator = user && complaint && String(user.id) === String(complaint.created_by_id);
  const canVerify = isCreator || user?.is_platform_admin;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', pb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/complaints')}><ArrowBack /></IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Complaint Details</Typography>
        </Box>
        <Chip label={complaint.status} color={getStatusColor(complaint.status)} sx={{ fontWeight: 'bold' }} />
      </Box>

      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#F8FAFC' }}>
        <Stepper activeStep={getActiveStep()} alternativeLabel>
          {COMPLAINT_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Main Action Bar */}
          <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <Typography variant="subtitle2" sx={{ color: '#1E3A8A', flexGrow: 1 }}>
              Next Action:
            </Typography>

            {(complaint.status === 'Registered' || complaint.status === 'Open' || complaint.status === 'Reopened') && (
              <Button variant="contained" color="primary" startIcon={<Assignment />} onClick={() => setAssignDialogOpen(true)}>
                Assign Technician
              </Button>
            )}

            {complaint.status === 'Assigned' && (
              <Button variant="contained" color="info" startIcon={<Search />} onClick={() => setInspectDialogOpen(true)}>
                Start Inspection
              </Button>
            )}

            {complaint.status === 'Material Pending' && (
              <Tooltip title={!canStartRepair ? "Please wait for material to be issued and acknowledge receipt before starting repair." : ""}>
                <span>
                  <Button variant="contained" color="warning" startIcon={<Build />} onClick={handleStartRepair} disabled={!canStartRepair}>
                    Material Procured - Start Repair
                  </Button>
                </span>
              </Tooltip>
            )}

            {(complaint.status === 'In Progress' || (complaint.status === 'Open' && complaint.assigned_to_id)) && (
              <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => setResolveDialogOpen(true)}>
                Resolve Complaint
              </Button>
            )}

            {complaint.status === 'Resolved' && (
              <>
                <Tooltip title={!canVerify ? "Only the person who raised the complaint or a Platform Admin can verify or reject its resolution." : ""}>
                  <span>
                    <Button variant="contained" color="success" startIcon={<VerifiedUser />} onClick={() => setVerifyDialogOpen(true)} disabled={!canVerify}>
                      Verify & Close
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title={!canVerify ? "Only the person who raised the complaint or a Platform Admin can verify or reject its resolution." : ""}>
                  <span>
                    <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => setRejectDialogOpen(true)} disabled={!canVerify} sx={{ ml: 1 }}>
                      Reject Resolution
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
            
            {complaint.status === 'Closed' && (
              <Typography variant="body2" color="textSecondary">Complaint is closed.</Typography>
            )}
          </Paper>

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
              
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Nature of Complaint</Typography>
                <Typography variant="body1">{complaint.nature_of_complaint || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Assigned Technician</Typography>
                <Typography variant="body1" fontWeight={500}>{complaint.assigned_to_name || 'Unassigned'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Raised By</Typography>
                <Typography variant="body1" fontWeight={500}>{complaint.created_by_name || '-'}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">Individual Detailed</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{complaint.individual_detailed || '-'}</Typography>
              </Grid>
              {complaint.inspection_details && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Inspection Details</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{complaint.inspection_details}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          {preRepairImages.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>Pre-Repair Photos</Typography>
              <Grid container spacing={2}>
                {preRepairImages.map((img) => (
                  <Grid item xs={6} sm={4} key={img.id}>
                    <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={getFileUrl(img.image_url)} alt="Pre Repair" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {(complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Reopened') && complaint.resolution_remarks && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Typography variant="h6" sx={{ color: '#166534', mb: 2 }}>Resolution Details</Typography>
              <Typography variant="caption" color="textSecondary">Resolved By: {complaint.resolved_by_name} on {complaint.resolved_at ? dayjs(complaint.resolved_at).format('DD MMM YYYY HH:mm') : '-'}</Typography>
              <Typography variant="body1" sx={{ mt: 1, mb: 2, whiteSpace: 'pre-wrap' }}>{complaint.resolution_remarks || 'No remarks provided.'}</Typography>

              {complaint.feedback && (
                <Box sx={{ mt: 2, mb: 2, p: 1.5, bgcolor: '#FFFFFF', borderRadius: 1, border: '1px solid #BBF7D0' }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5 }}>Verification Feedback:</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#166534' }}>"{complaint.feedback}"</Typography>
                </Box>
              )}
              
              {postRepairImages.length > 0 && (
                <Grid container spacing={2}>
                  {postRepairImages.map((img) => (
                    <Grid item xs={6} sm={4} key={img.id}>
                      <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #BBF7D0' }}>
                        <img src={getFileUrl(img.image_url)} alt="Post Repair" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          )}

          {complaint.rejection_remarks && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="h6" sx={{ color: '#991B1B', mb: 1 }}>Rejection Remarks</Typography>
              <Typography variant="body2">{complaint.rejection_remarks}</Typography>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {(complaint.status === 'Registered' || complaint.status === 'Open' || complaint.status === 'Assigned') ? (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#F8FAFC', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" color="textSecondary">
                Material requirement will be determined during inspection.
              </Typography>
            </Paper>
          ) : !complaint.material_required ? (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#F8FAFC', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" color="textSecondary">
                Material is not required for this complaint.
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Material Indents */}
              <Paper sx={{ p: 3, mb: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6" sx={{ color: '#1E3A8A' }}>Material Indents</Typography>
               <Tooltip title="Create Indent">
                 <IconButton color="primary" onClick={() => navigate(`/indents?new=true&complaint_id=${id}`)}>
                    <Assignment />
                 </IconButton>
               </Tooltip>
             </Box>
             {materialIndents.length === 0 ? (
               <Typography variant="body2" color="textSecondary">No indents created for this complaint.</Typography>
             ) : (
               <Table size="small">
                 <TableHead>
                   <TableRow>
                     <TableCell>Indent No</TableCell>
                     <TableCell>Status</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {materialIndents.map((indent) => (
                     <TableRow key={indent.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/indents')}>
                       <TableCell>{indent.indent_number}</TableCell>
                       <TableCell><Chip size="small" label={indent.status} color={indent.status === 'Approved' ? 'success' : indent.status.includes('Issued') ? 'primary' : 'warning'} /></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
          </Paper>

          {/* Materials Issued */}
          <Paper sx={{ p: 3, mb: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="h6" sx={{ color: '#1E3A8A' }}>Materials Issued</Typography>
             </Box>
             {materialIssues.length === 0 ? (
               <Typography variant="body2" color="textSecondary">No materials issued for this complaint.</Typography>
             ) : (
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                 {materialIssues.map((issue) => (
                   <Paper key={issue.id} variant="outlined" sx={{ p: 2 }}>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                       <Typography variant="subtitle2" fontWeight="bold">{issue.issue_number}</Typography>
                       <Chip size="small" label={issue.status} color={issue.status === 'Completed' ? 'success' : 'default'} />
                     </Box>
                     <Divider sx={{ my: 1 }} />
                     <Table size="small">
                       <TableHead>
                         <TableRow>
                           <TableCell>Code</TableCell>
                           <TableCell>Name</TableCell>
                           <TableCell align="right">Qty</TableCell>
                         </TableRow>
                       </TableHead>
                       <TableBody>
                         {(issue.items || []).map((item, idx) => (
                           <TableRow key={idx}>
                             <TableCell sx={{ fontSize: '0.8rem' }}>{item.material_code}</TableCell>
                             <TableCell sx={{ fontSize: '0.8rem' }}>{item.material_name}</TableCell>
                             <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.quantity} {item.uom_name}</TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </Paper>
                 ))}
               </Box>
             )}
          </Paper>

          {/* Material Issue Acknowledgement Status */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>Material Issue Acknowledgement Status</Typography>
            {materialIssues.length === 0 ? (
              <Typography variant="body2" color="textSecondary">No issues to acknowledge.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {materialIssues.map((issue) => (
                  <Box key={issue.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: issue.is_acknowledged ? '#F0FDF4' : '#FFFBEB' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{issue.issue_number}</Typography>
                      {issue.is_acknowledged ? (
                        <Typography variant="caption" color="textSecondary">Acknowledged by {issue.acknowledged_by_name || 'Technician'} on {issue.acknowledged_at ? dayjs(issue.acknowledged_at).format('DD MMM YYYY') : ''}</Typography>
                      ) : (
                        <Typography variant="caption" color="textSecondary">Awaiting Acknowledgement</Typography>
                      )}
                    </Box>
                    <Chip size="small" label={issue.is_acknowledged ? 'Acknowledged' : 'Pending'} color={issue.is_acknowledged ? 'success' : 'warning'} />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
          </>
          )}
        </Grid>
      </Grid>

      {/* Dialogs */}
      
      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => !actionLoading && setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Technician</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" sx={{ mt: 1 }}>
            <InputLabel>Technician</InputLabel>
            <Select value={selectedTech} label="Technician" onChange={(e) => setSelectedTech(e.target.value)}>
              {technicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.full_name} ({t.username})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setAssignDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained" disabled={!selectedTech || actionLoading}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Inspect Dialog */}
      <Dialog open={inspectDialogOpen} onClose={() => !actionLoading && setInspectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start Inspection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Have you inspected the issue? Is additional material required to fix this?</Typography>
          <TextField
            fullWidth
            label="Inspection Details"
            placeholder="Type what was inspected and what was found..."
            multiline
            rows={3}
            value={inspectionDetails}
            onChange={(e) => setInspectionDetails(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={<Switch checked={materialRequired} onChange={(e) => setMaterialRequired(e.target.checked)} />}
            label="Material Required"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setInspectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleInspect} variant="contained" color="primary" disabled={actionLoading}>Confirm Inspection</Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => !actionLoading && setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
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
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Post-Repair Photos</Typography>
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
          <Button onClick={() => setResolveDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleResolve} variant="contained" color="success" disabled={actionLoading} startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircle />}>
            Mark Resolved
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => !actionLoading && setVerifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Resolution</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Are you sure you want to verify and close this complaint?</Typography>
          <TextField
            fullWidth
            label="Feedback / Remarks"
            multiline
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVerifyDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={() => handleVerify(true)} variant="contained" color="success" disabled={actionLoading}>Verify & Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => !actionLoading && setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Resolution</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Please provide a reason for rejecting the resolution. This will reopen the complaint.</Typography>
          <TextField
            autoFocus
            label="Rejection Remarks"
            fullWidth
            multiline
            rows={3}
            value={rejectionRemarks}
            onChange={(e) => setRejectionRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={() => handleVerify(false)} variant="contained" color="error" disabled={!rejectionRemarks || actionLoading}>Reject & Reopen</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
