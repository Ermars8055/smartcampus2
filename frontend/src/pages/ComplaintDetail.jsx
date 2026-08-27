import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Snackbar, Alert, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Switch, FormControlLabel, Stepper, Step, StepLabel, Select, MenuItem, FormControl, InputLabel, Checkbox
} from '@mui/material';
import { ArrowBack, CheckCircle, Assignment, PhotoCamera, Close, AddShoppingCart, Build, Search, VerifiedUser, Cancel, Replay, Add, Print, Save, CameraAlt, PhotoLibrary } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import dayjs from 'dayjs';
import EngineerEvaluationReport from '../components/EngineerEvaluationReport';
import PreventiveMaintenanceReport from '../components/PreventiveMaintenanceReport';
import PMChecklistForm from '../components/PMChecklistForm';
import { useAuth } from '../context/AuthContext';

const COMPLAINT_STEPS = ['Registered', 'Assigned', 'Under Inspection', 'In Progress', 'Pending Approval', 'Closed'];

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasAction, hasPermission } = useAuth();
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
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);

  // Form States
  const [reopenReason, setReopenReason] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [repairMethod, setRepairMethod] = useState('');
  const [inspectionDetails, setInspectionDetails] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [resolutionPreviewUrls, setResolutionPreviewUrls] = useState([]);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [previewDialog, setPreviewDialog] = useState({ open: false, url: '' });

  // Closure States
  const [closureReason, setClosureReason] = useState('');
  const [statusOnWorkCompletion, setStatusOnWorkCompletion] = useState('');
  const [jobCompletedSatisfactorily, setJobCompletedSatisfactorily] = useState(true);
  const [completionDate, setCompletionDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [completionTime, setCompletionTime] = useState(dayjs().format('HH:mm'));
  const [closureDocs, setClosureDocs] = useState([]);
  const [pmChecklistData, setPmChecklistData] = useState({});
  const isPM = complaint?.complaint_type?.includes('PM') || complaint?.complaint_type?.includes('Preventive Maintenance') || complaint?.is_pm_calibration_call;
  
  // Installation Specific States
  const [equipmentPhoto, setEquipmentPhoto] = useState(null);
  const [serialNumber, setSerialNumber] = useState('');
  const [noSerialNumber, setNoSerialNumber] = useState(false);
  const [serialNumberPhoto, setSerialNumberPhoto] = useState(null);
  const [installationReport, setInstallationReport] = useState(null);
  const [signedReport, setSignedReport] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printableReportRef = useRef(null);

  useEffect(() => {
    fetchComplaintData();
    fetchTechnicians();

    // Auto-refresh data every 10 seconds silently
    const interval = setInterval(() => {
      fetchComplaintData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (isPrinting) {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
    }
  }, [isPrinting]);

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

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/reopen`, { reason: reopenReason });
      setSnackbar({ open: true, message: 'Complaint reopened successfully', severity: 'success' });
      setReopenDialogOpen(false);
      setReopenReason('');
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to reopen complaint', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };


  const handleCompleteInspection = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/complete-inspection`, { 
        repair_method: repairMethod,
        inspection_details: inspectionDetails 
      });
      setSnackbar({ open: true, message: 'Inspection completed', severity: 'success' });
      setInspectDialogOpen(false);
      
      if (repairMethod === 'Material Required') {
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

  const handleStartInspection = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/complaints/${id}/inspect`);
      setSnackbar({ open: true, message: 'Inspection started', severity: 'success' });
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to start inspection', severity: 'error' });
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

  const handleSaveDetails = async () => {
    setActionLoading(true);
    try {
      await api.put(`/api/complaints/${id}`, {
        resolution_entered: resolutionRemarks,
        closure_reason: closureReason,
        status_on_work_completion: statusOnWorkCompletion,
        job_completed_satisfactorily: jobCompletedSatisfactorily,
        completion_date: completionDate,
        completion_time: completionTime,
        pm_checklist_data: pmChecklistData
      });
      setSnackbar({ open: true, message: 'Details saved successfully', severity: 'success' });
      fetchComplaintData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save details', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const resolutionImageUrls = [];
      for (const file of resolutionImages) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        resolutionImageUrls.push(uploadRes.data.url);
      }

      const documentUrls = [];
      for (const file of closureDocs) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        documentUrls.push(uploadRes.data.url);
      }
      
      if (signedReport) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', signedReport);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        documentUrls.push(uploadRes.data.url);
      }

      let equipmentPhotoUrl = null;
      let serialNumberPhotoUrl = null;
      let installationReportUrl = null;

      if (complaint?.complaint_type === 'Installation') {
        if (equipmentPhoto) {
          const fd = new FormData();
          fd.append('file', equipmentPhoto);
          const uploadRes = await api.post('/api/upload?folder=complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          equipmentPhotoUrl = uploadRes.data.url;
        }
        if (serialNumberPhoto) {
          const fd = new FormData();
          fd.append('file', serialNumberPhoto);
          const uploadRes = await api.post('/api/upload?folder=complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          serialNumberPhotoUrl = uploadRes.data.url;
        }
        if (installationReport) {
          const fd = new FormData();
          fd.append('file', installationReport);
          const uploadRes = await api.post('/api/upload?folder=complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          installationReportUrl = uploadRes.data.url;
        }
      }

      const payload = {
        resolution_entered: resolutionRemarks,
        closure_reason: closureReason,
        status_on_work_completion: statusOnWorkCompletion,
        job_completed_satisfactorily: jobCompletedSatisfactorily,
        completion_date: completionDate,
        completion_time: completionTime,
        document_urls: documentUrls,
        resolution_image_urls: resolutionImageUrls,
        pm_checklist_data: pmChecklistData
      };

      if (complaint?.complaint_type === 'Installation') {
        payload.equipment_photo_url = equipmentPhotoUrl;
        payload.serial_number_photo_url = serialNumberPhotoUrl;
        payload.installation_report_url = installationReportUrl;
        payload.serial_number = noSerialNumber ? 'NA' : serialNumber;
      }

      await api.post(`/api/complaints/${id}/close`, payload);

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
      setSnackbar({ open: true, message: `${approvalType === 'admin' ? 'Level 1' : 'Level 2'} Approved Successfully`, severity: 'success' });
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
      case 'Registered': case 'Open': return 'info';
      case 'Assigned': return 'primary';
      case 'Under Inspection': return 'info';
      case 'Material Pending': return 'error';
      case 'In Progress': return 'warning';
      case 'Pending Approval': case 'Pending Admin Approval': return 'info';
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
      case 'Pending Approval': case 'Pending Admin Approval': return 4;
      case 'Closed': return 5;
      default: return 0;
    }
  };

  const preRepairImages = complaint.images.filter(img => !img.is_resolution_image);
  const postRepairImages = complaint.images.filter(img => img.is_resolution_image);

  const canStartRepair = materialIssues.length > 0 && materialIssues.every(issue => issue.is_acknowledged);
  const isCreator = user && complaint && String(user.id) === String(complaint.created_by_id);
  
  const canClose = materialIssues.every(issue => issue.is_acknowledged) && 
                   materialIndents.every(indent => ['Issued', 'Rejected', 'Partially Issued', 'Completed'].includes(indent.status));

  return (
    <>
    <Box sx={{ display: isPrinting ? 'none' : 'block', maxWidth: 1000, mx: 'auto', pb: 5 }}>
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
              <>
                <Button variant="contained" color="info" startIcon={<Search />} onClick={handleStartInspection} disabled={actionLoading}>
                  Start Inspection
                </Button>
                {hasAction('complaints', 'can_assign') && (
                  <Button variant="outlined" color="primary" startIcon={<Assignment />} onClick={() => setAssignDialogOpen(true)}>
                    Reassign
                  </Button>
                )}
              </>
            )}

            {complaint.status === 'Under Inspection' && (
              <Button variant="contained" color="primary" startIcon={<Search />} onClick={() => setInspectDialogOpen(true)}>
                Complete Inspection
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
              <Tooltip title={!canClose ? "Cannot close: There are pending material requests or unacknowledged materials." : ""}>
                <span>
                  <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => {
                    setResolutionRemarks(complaint.resolution_entered || '');
                    setClosureReason(complaint.closure_reason || '');
                    setStatusOnWorkCompletion(complaint.status_on_work_completion || '');
                    setJobCompletedSatisfactorily(complaint.job_completed_satisfactorily !== false);
                    setCompletionDate(complaint.completion_date || dayjs().format('YYYY-MM-DD'));
                    setCompletionTime(complaint.completion_time || dayjs().format('HH:mm'));
                    setPmChecklistData(complaint.pm_checklist_data || {});
                    setResolveDialogOpen(true);
                  }} disabled={!canClose}>
                    Initiate Closure Workflow
                  </Button>
                </span>
              </Tooltip>
            )}

            {(complaint.status === 'Pending Approval' || complaint.status === 'Pending Admin Approval') && !complaint.admin_approved_by_id && hasAction('complaints', 'can_approve_level1') && (
              <Button variant="contained" color="primary" startIcon={<VerifiedUser />} onClick={() => handleApprove('admin')}>
                Level 1 Approve
              </Button>
            )}

            {(complaint.status === 'Pending Approval' || complaint.status === 'Pending Admin Approval') && complaint.admin_approved_by_id && !complaint.manager_approved_by_id && hasAction('complaints', 'can_approve_level2') && (
              <Button variant="contained" color="secondary" startIcon={<VerifiedUser />} onClick={() => handleApprove('manager')}>
                Level 2 Approve
              </Button>
            )}
            
            {complaint.status === 'Closed' && (
              <>
                <Typography variant="body2" color="textSecondary">Complaint is closed.</Typography>
                {hasPermission('complaints', 'can_update') && (
                  <Button variant="outlined" color="error" startIcon={<Replay />} onClick={() => setReopenDialogOpen(true)}>
                    Reopen Complaint
                  </Button>
                )}
              </>
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
              
              {complaint.equipment_warranty_status && (
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">Warranty Status</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={complaint.equipment_warranty_status} 
                      size="small" 
                      sx={{ 
                        bgcolor: complaint.equipment_warranty_status === 'Warranty' ? '#DCFCE7' : 
                                 complaint.equipment_warranty_status === 'Out of Warranty' ? '#FEE2E2' : '#DBEAFE',
                        color: complaint.equipment_warranty_status === 'Warranty' ? '#166534' : 
                               complaint.equipment_warranty_status === 'Out of Warranty' ? '#991B1B' : '#1E40AF',
                        fontWeight: 600
                      }} 
                    />
                  </Box>
                </Grid>
              )}

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

          {postRepairImages.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#1E3A8A', mb: 2 }}>Post-Repair Photos</Typography>
              <Grid container spacing={2}>
                {postRepairImages.map((img) => (
                  <Grid item xs={6} sm={4} key={img.id}>
                    <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={getFileUrl(img.image_url)} alt="Post Repair" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setPreviewDialog({ open: true, url: getFileUrl(img.image_url) })} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {(complaint.status === 'Resolved' || complaint.status === 'Closed' || complaint.status === 'Pending Approval' || complaint.status === 'Pending Admin Approval' || complaint.status === 'Reopened') && complaint.resolution_entered && (
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
                  <Typography variant="caption" color="textSecondary" display="block">Level 1 Approval</Typography>
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
                  <Typography variant="caption" color="textSecondary" display="block">Level 2 Approval</Typography>
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
              
              {(complaint.equipment_photo_url || complaint.serial_number_photo_url || complaint.installation_report_url) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>Installation Documents</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {complaint.equipment_photo_url && (
                      <Button variant="outlined" size="small" onClick={() => window.open(getFileUrl(complaint.equipment_photo_url), '_blank')} startIcon={<PhotoCamera />}>
                        Equipment Photo
                      </Button>
                    )}
                    {complaint.serial_number_photo_url && (
                      <Button variant="outlined" size="small" onClick={() => window.open(getFileUrl(complaint.serial_number_photo_url), '_blank')} startIcon={<PhotoCamera />}>
                        Serial No. Photo
                      </Button>
                    )}
                    {complaint.installation_report_url && (
                      <Button variant="outlined" size="small" onClick={() => window.open(getFileUrl(complaint.installation_report_url), '_blank')} startIcon={<Assignment />}>
                        Installation Report
                      </Button>
                    )}
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
          ) : complaint.repair_method === 'Material Not Required' ? (
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#F8FAFC', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" color="textSecondary">
                Material is not required for this complaint.
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Material Indents */}
              <Paper sx={{ p: 3, mb: 3 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
               <Typography variant="h6" sx={{ color: '#1E3A8A' }}>Material Indents</Typography>
               {['Material Pending', 'In Progress'].includes(complaint.status) && (
                 <Button 
                   variant="outlined" 
                   color="primary" 
                   size="small"
                   startIcon={<Add />} 
                   onClick={() => navigate(`/indents?new=true&complaint_id=${id}`)}
                   sx={{ whiteSpace: 'nowrap' }}
                 >
                   Create Indent
                 </Button>
               )}
             </Box>
             {materialIndents.length === 0 ? (
               <Box>
                 <Typography variant="body2" color="textSecondary">No indents created for this complaint.</Typography>
                 {complaint.status === 'In Progress' && (
                   <Alert severity="info" sx={{ mt: 2 }}>
                     If you require materials but didn't select 'Material Required' during the inspection, you can still raise a Material Indent by clicking the '+ Create Indent' button above.
                   </Alert>
                 )}
               </Box>
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

          {/* Materials Issued and Acknowledgement Status - conditionally rendered */}
          {(materialIndents.length > 0 || materialIssues.length > 0) && (
            <>
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
          </>
          )}
        </Grid>
      </Grid>

      {/* Dialogs */}
      
      {/* Reopen Dialog */}
      <Dialog open={reopenDialogOpen} onClose={() => !actionLoading && setReopenDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reopen Complaint</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Are you sure you want to reopen this closed complaint? You must provide a reason.</Typography>
          <TextField
            autoFocus
            fullWidth
            label="Reason for Reopening"
            placeholder="e.g. Issue not fully resolved, problem recurred"
            multiline
            rows={3}
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setReopenDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleReopen} variant="contained" color="error" disabled={!reopenReason || actionLoading}>
            Confirm Reopen
          </Button>
        </DialogActions>
      </Dialog>
      
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
        <DialogTitle>Complete Inspection</DialogTitle>
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
          <FormControl fullWidth margin="dense">
            <InputLabel>Action Required</InputLabel>
            <Select 
              value={repairMethod} 
              label="Action Required" 
              onChange={(e) => setRepairMethod(e.target.value)}
            >
              <MenuItem value="Material Required">Material Required</MenuItem>
              <MenuItem value="Material Not Required">Material Not Required</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setInspectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleCompleteInspection} variant="contained" disabled={!repairMethod || actionLoading}>
            Submit Inspection
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onClose={() => !actionLoading && setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Initiate Closure Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            required
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
            required
            margin="dense"
            label="Closure Reason"
            fullWidth
            multiline
            rows={2}
            value={closureReason}
            onChange={(e) => setClosureReason(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Status on Work Completion"
            fullWidth
            value={statusOnWorkCompletion}
            onChange={(e) => setStatusOnWorkCompletion(e.target.value)}
            sx={{ mb: 2 }}
          />

          {!isPM && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  label="Completion Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  label="Completion Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={completionTime}
                  onChange={(e) => setCompletionTime(e.target.value)}
                />
              </Grid>
            </Grid>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="outlined" color="primary" startIcon={<Save />} onClick={handleSaveDetails} disabled={actionLoading}>
              Save Details
            </Button>
            {isPM ? (
              <Button 
                variant="contained" 
                color="info" 
                startIcon={<Print />} 
                onClick={() => setIsPrinting(true)}
              >
                Generate Preventive Maintenance Report
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="info" 
                startIcon={<Print />} 
                onClick={() => setIsPrinting(true)}
              >
                Generate Engineer Evaluation Report
              </Button>
            )}
          </Box>
          
          {isPM && (
             <PMChecklistForm data={pmChecklistData} onChange={setPmChecklistData} />
          )}
          
          {complaint?.complaint_type === 'Installation' ? (
            <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, bgcolor: '#F8FAFC', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, textAlign: 'center' }}>Mandatory Installation Documentation</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>1. Equipment Photo *</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button component="label" variant="outlined" size="small" startIcon={<PhotoCamera />}>
                      Upload from Camera / Gallery
                      <input type="file" accept="image/*" hidden onChange={(e) => setEquipmentPhoto(e.target.files[0])} />
                    </Button>
                    {equipmentPhoto && <Typography variant="caption" sx={{ ml: 1, color: 'success.main', fontWeight: 'bold' }}>{equipmentPhoto.name}</Typography>}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>2. Serial Number *</Typography>
                  <TextField 
                    size="small" 
                    fullWidth 
                    placeholder="Enter Serial Number" 
                    value={noSerialNumber ? 'NA' : serialNumber} 
                    onChange={(e) => setSerialNumber(e.target.value)} 
                    disabled={noSerialNumber} 
                    sx={{ mb: 1, bgcolor: '#fff' }}
                  />
                  <FormControlLabel
                    control={<Checkbox checked={noSerialNumber} onChange={(e) => setNoSerialNumber(e.target.checked)} size="small" />}
                    label={<Typography variant="body2">No Serial Number Available (NA)</Typography>}
                  />
                </Box>
                {!noSerialNumber && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>3. Serial Number Photo *</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button component="label" variant="outlined" size="small" startIcon={<PhotoCamera />}>
                        Upload from Camera / Gallery
                        <input type="file" accept="image/*" hidden onChange={(e) => setSerialNumberPhoto(e.target.files[0])} />
                      </Button>
                      {serialNumberPhoto && <Typography variant="caption" sx={{ ml: 1, color: 'success.main', fontWeight: 'bold' }}>{serialNumberPhoto.name}</Typography>}
                    </Box>
                  </Box>
                )}
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{noSerialNumber ? '3' : '4'}. Installation Report *</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button component="label" variant="outlined" size="small" startIcon={<PhotoCamera />}>
                      Upload from Camera / File
                      <input type="file" accept="*/*" hidden onChange={(e) => setInstallationReport(e.target.files[0])} />
                    </Button>
                    {installationReport && <Typography variant="caption" sx={{ ml: 1, color: 'success.main', fontWeight: 'bold' }}>{installationReport.name}</Typography>}
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Post Repair Photos</Typography>
              <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#F8FAFC', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button component="label" variant="outlined" size="small" startIcon={<PhotoCamera />}>
                    Upload from Camera / Gallery
                    <input type="file" multiple accept="image/*" hidden onChange={handleResolutionImageChange} />
                  </Button>
                </Box>
                {resolutionImages.length > 0 && (
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    {resolutionImages.map((doc, idx) => (
                      <Chip key={idx} label={doc.name} onDelete={() => removeResolutionImage(idx)} sx={{ m: 0.5 }} />
                    ))}
                  </Box>
                )}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>{isPM ? 'Upload Signed PM Report *' : 'Upload Signed Engineer Evaluation Report *'}</Typography>
              <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#F8FAFC', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button component="label" variant="outlined" size="small" startIcon={<PhotoCamera />}>
                    Upload from Camera / File
                    <input type="file" accept="*/*" hidden onChange={(e) => setSignedReport(e.target.files[0])} />
                  </Button>
                </Box>
                {signedReport && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Chip label={signedReport.name} onDelete={() => setSignedReport(null)} color="success" variant="outlined" sx={{ m: 0.5 }} />
                  </Box>
                )}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Upload Other Service Documents</Typography>
              <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#F8FAFC', mb: 2 }}>
                 <input type="file" multiple accept="*/*" style={{ display: 'none' }} ref={fileInputRef} onChange={(e) => {
                   if (e.target.files) {
                     const filesArray = Array.from(e.target.files);
                     setClosureDocs(prev => [...prev, ...filesArray]);
                   }
                 }} />
                <Button variant="outlined" startIcon={<Assignment />} onClick={() => fileInputRef.current.click()} size="small">
                  Select Service Reports / Documents
                </Button>
                {closureDocs.length > 0 && (
                  <Box sx={{ mt: 2, textAlign: 'left' }}>
                    {closureDocs.map((doc, idx) => (
                      <Chip key={idx} label={doc.name} onDelete={() => setClosureDocs(prev => prev.filter((_, i) => i !== idx))} sx={{ m: 0.5 }} />
                    ))}
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setResolveDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button 
            onClick={handleResolve} 
            variant="contained" 
            color="success" 
            disabled={actionLoading || !resolutionRemarks || !closureReason || (complaint?.complaint_type === 'Installation' ? (!equipmentPhoto || (!noSerialNumber && !serialNumberPhoto) || (!noSerialNumber && !serialNumber) || !installationReport) : !signedReport) || (isPM && (!pmChecklistData?.pm_start_date_time || !pmChecklistData?.pm_completed_date || !pmChecklistData?.next_pm_due_on || !pmChecklistData?.status || !pmChecklistData?.accepted_for_use))}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
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

    {isPrinting && (
      <Box sx={{ '@media print': { m: 0, p: 0 } }}>
        {isPM ? (
           <PreventiveMaintenanceReport complaint={{
             ...complaint, 
             resolution_entered: resolutionRemarks,
             status_on_work_completion: statusOnWorkCompletion,
             job_completed_satisfactorily: jobCompletedSatisfactorily,
             completion_date: completionDate,
             completion_time: completionTime
           }} pmChecklistData={pmChecklistData} materialIssues={materialIssues} />
        ) : (
           <EngineerEvaluationReport complaint={{
             ...complaint, 
             resolution_entered: resolutionRemarks,
             status_on_work_completion: statusOnWorkCompletion,
             job_completed_satisfactorily: jobCompletedSatisfactorily,
             completion_date: completionDate,
             completion_time: completionTime
           }} materialIssues={materialIssues} />
        )}
      </Box>
    )}
    </>
  );
}
