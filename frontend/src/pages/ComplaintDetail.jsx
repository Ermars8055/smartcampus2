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

const COMPLAINT_STEPS = ['Registered', 'Assigned', 'Under Inspection', 'In Progress', 'Pending Admin Approval', 'Closed'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasAction } = useAuth();
  const fileInputRef = useRef(null);

  const [complaint, setComplaint] = useState(null);
  const [materialIndents, setMaterialIndents] = useState([]);
  const [materialIssues, setMaterialIssues] = useState([]);
  const [rwo, setRwo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);

  // Form States
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [materialRequired, setMaterialRequired] = useState(false);
  const [inspectionDetails, setInspectionDetails] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [resolutionPreviewUrls, setResolutionPreviewUrls] = useState([]);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [previewDialog, setPreviewDialog] = useState({ open: false, url: '' });

  // Closure States
  const [closureReason, setClosureReason] = useState('');
  const [closureDocs, setClosureDocs] = useState([]);

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
      
      try {
        const rwoRes = await api.get('/api/rwos');
        const relatedRwo = rwoRes.data.find(r => r.complaint_id === parseInt(id));
        setRwo(relatedRwo || null);
      } catch(err) {
        console.warn('Failed to fetch RWO', err);
      }
      
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

      for (const file of closureDocs) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(uploadRes.data.url);
      }

      await api.post(`/api/complaints/${id}/close`, {
        resolution_entered: resolutionRemarks,
        closure_reason: closureReason,
        document_urls: uploadedUrls
      });

      setSnackbar({ open: true, message: 'Closure initiated successfully', severity: 'success' });
      setResolveDialogOpen(false);
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to initiate closure', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (approvalType) => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/approve-closure`, {
        approval_type: approvalType
      });
      setSnackbar({ open: true, message: `Approved as ${approvalType}`, severity: 'success' });
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to approve', severity: 'error' });
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
      case 'Pending Admin Approval': return 'warning';
      case 'Resolved': return 'success';
      case 'Closed': return 'success';
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
      case 'Pending Admin Approval': return 4;
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const preRepairImages = complaint.images.filter(img => !img.is_resolution_image);
  const postRepairImages = complaint.images.filter(img => img.is_resolution_image);

  const canStartRepair = materialIssues.length > 0 && materialIssues.every(issue => issue.is_acknowledged);
  const isCreator = user && complaint && String(user.id) === String(complaint.created_by_id);

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

            {(complaint.status === 'Registered' || complaint.status === 'Open' || complaint.status === 'Reopened') && hasAction('complaints', 'can_assign') && (
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

            {(complaint.status === 'In Progress' || (complaint.status === 'Open' && complaint.assigned_to_id) || complaint.status === 'Resolved') && (
              <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => setResolveDialogOpen(true)}>
                Initiate Closure Workflow
              </Button>
            )}

            {complaint.status === 'Pending Admin Approval' && !complaint.admin_approved_by_id && (
              <Button variant="contained" color="primary" startIcon={<VerifiedUser />} onClick={() => handleApprove('admin')}>
                Admin Approve
              </Button>
            )}

            {complaint.status === 'Pending Admin Approval' && complaint.admin_approved_by_id && !complaint.manager_approved_by_id && (
              <Button variant="contained" color="secondary" startIcon={<VerifiedUser />} onClick={() => handleApprove('manager')}>
                Manager Approve
              </Button>
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
              {rwo && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#1E3A8A', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Build fontSize="small" />
                      Repair Work Order Generated
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="textSecondary">RWO Number</Typography>
                        <Typography variant="body2" fontWeight={600} color="primary" sx={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/rwos/${rwo.id}`)}>{rwo.rwo_number}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="textSecondary">Status</Typography>
                        <Typography variant="body2" fontWeight={500}>{rwo.status}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="textSecondary">Vendor</Typography>
                        <Typography variant="body2" fontWeight={500}>{rwo.vendor_name}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              )}
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
                      <img src={getFileUrl(img.image_url)} alt="Pre Repair" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setPreviewDialog({ open: true, url: getFileUrl(img.image_url) })} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {(complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Pending Admin Approval' || complaint.status === 'Reopened') && complaint.resolution_entered && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Typography variant="h6" sx={{ color: '#166534', mb: 2 }}>Closure Details</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Resolution Entered</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{complaint.resolution_entered}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Closure Reason</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontWeight: 500 }}>{complaint.closure_reason}</Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1, flexGrow: 1, minWidth: 200, bgcolor: complaint.admin_approved_by_id ? '#ECFDF5' : '#FFFBEB' }}>
                  <Typography variant="caption" color="textSecondary" display="block">Admin Approval</Typography>
                  {complaint.admin_approved_by_id ? (
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      <CheckCircle sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Approved by {complaint.admin_approved_by_name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="warning.main">Pending</Typography>
                  )}
                </Box>
                <Box sx={{ p: 1.5, border: '1px solid #E2E8F0', borderRadius: 1, flexGrow: 1, minWidth: 200, bgcolor: complaint.manager_approved_by_id ? '#ECFDF5' : '#FFFBEB' }}>
                  <Typography variant="caption" color="textSecondary" display="block">Manager Approval</Typography>
                  {complaint.manager_approved_by_id ? (
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      <CheckCircle sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Approved by {complaint.manager_approved_by_name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="warning.main">Pending</Typography>
                  )}
                </Box>
              </Box>

              {complaint.documents && complaint.documents.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Service Documents</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {complaint.documents.map((doc, idx) => (
                      <Button key={idx} variant="outlined" size="small" onClick={() => window.open(getFileUrl(doc.file_url), '_blank')} startIcon={<Assignment />}>
                        Document {idx + 1}
                      </Button>
                    ))}
                  </Box>
                </Box>
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
               {materialIndents.length === 0 && complaint.status === 'Material Pending' && (
                 <Tooltip title="Create Indent">
                   <IconButton color="primary" onClick={() => navigate(`/indents?new=true&complaint_id=${id}`)}>
                      <Assignment />
                   </IconButton>
                 </Tooltip>
               )}
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
                     <TableRow key={indent.id}>
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
        <DialogTitle>Initiate Closure Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Resolution Entered (Action Taken)"
            fullWidth
            multiline
            rows={2}
            value={resolutionRemarks}
            onChange={(e) => setResolutionRemarks(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Closure Reason"
            fullWidth
            multiline
            rows={2}
            value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
            sx={{ mb: 3 }}
          />
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Service Documents & Photos</Typography>
          <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#F8FAFC', mb: 2 }}>
             <input type="file" multiple accept="*/*" style={{ display: 'none' }} ref={fileInputRef} onChange={(e) => {
               if (e.target.files) {
                 const filesArray = Array.from(e.target.files);
                 setClosureDocs(prev => [...prev, ...filesArray]);
               }
             }} />
            <Button variant="outlined" startIcon={<PhotoCamera />} onClick={() => fileInputRef.current.click()} size="small">
              Select Service Reports / Photos
            </Button>
            {closureDocs.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                {closureDocs.map((doc, idx) => (
                  <Chip key={idx} label={doc.name} onDelete={() => setClosureDocs(prev => prev.filter((_, i) => i !== idx))} sx={{ m: 0.5 }} />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setResolveDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleResolve} variant="contained" color="success" disabled={actionLoading} startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircle />}>
            Submit for Approval
          </Button>
        </DialogActions>
      </Dialog>



      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, url: '' })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Image Preview
          <IconButton onClick={() => setPreviewDialog({ open: false, url: '' })} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', bgcolor: '#000' }}>
          <img src={previewDialog.url} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
