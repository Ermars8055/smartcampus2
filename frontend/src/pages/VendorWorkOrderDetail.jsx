import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  TextField,
  MenuItem,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import vendorWorkOrderService from '../services/vendorWorkOrderService';
import api from '../services/api';

const VendorWorkOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [vendors, setVendors] = useState([]);
  const [equipments, setEquipments] = useState([]);

  // Determine if it was opened from a complaint
  const complaintContext = location.state?.complaint || null;

  const [formData, setFormData] = useState({
    vendor_id: '',
    equipment_id: complaintContext ? complaintContext.equipment_id : '',
    complaint_id: complaintContext ? complaintContext.id : '',
    priority: 'Normal',
    target_date: '',
    service_type: '',
    scope_of_work: '',
    vendor_instructions: '',
    quotation_no: '',
    vendor_quote_amount: 0,
    labour_charges: 0,
    service_charges: 0,
    tax: 0,
    total_approved_amount: 0,
    status: 'Draft',
    items: [],
  });

  const [complaintDetails, setComplaintDetails] = useState(complaintContext);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [venRes, eqRes] = await Promise.all([
        api.get('/api/vendors'),
        api.get('/api/equipment')
      ]);
      setVendors(venRes.data);
      setEquipments(eqRes.data);

      if (!isNew) {
        const data = await vendorWorkOrderService.getVendorWorkOrder(id);
        setFormData(data);
        if (data.complaint_id) {
          const compRes = await api.get(`/api/complaints/${data.complaint_id}`);
          setComplaintDetails(compRes.data);
        }
      } else if (complaintContext) {
        // We already have context
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintDetails = async (compId) => {
    try {
      const compRes = await api.get(`/api/complaints/${compId}`);
      setComplaintDetails(compRes.data);
    } catch (err) {
      console.error("Failed to fetch complaint", err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto calc total
      if (['vendor_quote_amount', 'labour_charges', 'service_charges', 'tax'].includes(field)) {
        const quote = parseFloat(updated.vendor_quote_amount) || 0;
        const labour = parseFloat(updated.labour_charges) || 0;
        const service = parseFloat(updated.service_charges) || 0;
        const tax = parseFloat(updated.tax) || 0;
        updated.total_approved_amount = quote + labour + service + tax;
      }
      return updated;
    });

    if (field === 'complaint_id' && value) {
      fetchComplaintDetails(value);
    }
  };

  const handleSave = async (status = null) => {
    try {
      setSaving(true);
      const payload = { ...formData };
      if (status) payload.status = status;

      if (isNew) {
        const res = await vendorWorkOrderService.createVendorWorkOrder(payload);
        navigate(`/procurement/vendor-work-orders/${res.id}`);
      } else {
        await vendorWorkOrderService.updateVendorWorkOrder(id, payload);
        fetchInitialData(); // reload
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  const isReadOnly = !isNew && formData.status !== 'Draft';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {isNew ? 'Create Vendor Work Order' : `Vendor Work Order ${formData.vwo_number}`}
        </Typography>
        {!isNew && (
          <Chip label={formData.status} color="primary" sx={{ ml: 2 }} />
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          
          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Work Order Header</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Vendor *"
                  value={formData.vendor_id}
                  onChange={(e) => handleInputChange('vendor_id', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                >
                  {vendors.map(v => (
                    <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Linked Complaint Docket"
                  value={formData.complaint_id}
                  onChange={(e) => handleInputChange('complaint_id', e.target.value)}
                  disabled={isReadOnly || !!complaintContext}
                  size="small"
                  helperText="Enter Complaint ID (if applicable)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Equipment *"
                  value={formData.equipment_id}
                  onChange={(e) => handleInputChange('equipment_id', e.target.value)}
                  disabled={isReadOnly || !!complaintContext}
                  size="small"
                >
                  {equipments.map(e => (
                    <MenuItem key={e.id} value={e.id}>{e.equipment_code} - {e.material_name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  select
                  label="Priority *"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                >
                  <MenuItem value="Normal">Normal</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Target Date *"
                  InputLabelProps={{ shrink: true }}
                  value={formData.target_date}
                  onChange={(e) => handleInputChange('target_date', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Service Request</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Service Type *"
                  value={formData.service_type}
                  onChange={(e) => handleInputChange('service_type', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                >
                  <MenuItem value="Repair">Repair</MenuItem>
                  <MenuItem value="Installation">Installation</MenuItem>
                  <MenuItem value="Calibration">Calibration</MenuItem>
                  <MenuItem value="PM Visit">PM Visit</MenuItem>
                  <MenuItem value="Vendor Inspection">Vendor Inspection</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Scope of Work *"
                  value={formData.scope_of_work}
                  onChange={(e) => handleInputChange('scope_of_work', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Vendor Instructions"
                  value={formData.vendor_instructions}
                  onChange={(e) => handleInputChange('vendor_instructions', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Vendor Commercials</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quotation Ref No"
                  value={formData.quotation_no}
                  onChange={(e) => handleInputChange('quotation_no', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Vendor Quote Amount"
                  value={formData.vendor_quote_amount}
                  onChange={(e) => handleInputChange('vendor_quote_amount', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Labour Charges"
                  value={formData.labour_charges}
                  onChange={(e) => handleInputChange('labour_charges', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Service Charges"
                  value={formData.service_charges}
                  onChange={(e) => handleInputChange('service_charges', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tax Amount"
                  value={formData.tax}
                  onChange={(e) => handleInputChange('tax', e.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Approved Amount"
                  value={formData.total_approved_amount}
                  disabled
                  size="small"
                  InputProps={{ sx: { fontWeight: 'bold' } }}
                />
              </Grid>
            </Grid>
          </Card>

        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Complaint Information</Typography>
            {complaintDetails ? (
              <Box>
                <Typography variant="body2" color="text.secondary">Docket No</Typography>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>{complaintDetails.docket_no}</Typography>
                
                <Typography variant="body2" color="text.secondary">Type</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{complaintDetails.complaint_type || '-'}</Typography>
                
                <Typography variant="body2" color="text.secondary">Nature of Complaint</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{complaintDetails.nature_of_complaint}</Typography>
                
                <Typography variant="body2" color="text.secondary">Assigned Tech</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{complaintDetails.assigned_to_name || 'Unassigned'}</Typography>
                
                <Typography variant="body2" color="text.secondary">Inspection Findings</Typography>
                <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px dashed #ccc' }}>
                  <Typography variant="body2">{complaintDetails.inspection_details || 'No findings recorded'}</Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">No complaint linked</Typography>
            )}
          </Card>

          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {isNew || formData.status === 'Draft' ? (
                <>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={() => handleSave()}
                    disabled={saving}
                  >
                    Save Draft
                  </Button>
                  {!isNew && (
                    <Button 
                      variant="contained" 
                      color="success" 
                      fullWidth 
                      onClick={() => handleSave('Approved')}
                      disabled={saving}
                    >
                      Approve Work Order
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {formData.status === 'Approved' && (
                    <Button variant="contained" color="primary" fullWidth onClick={() => handleSave('Sent to Vendor')}>
                      Send to Vendor
                    </Button>
                  )}
                  {formData.status === 'Sent to Vendor' && (
                    <Button variant="contained" color="secondary" fullWidth onClick={() => handleSave('Accepted')}>
                      Mark Vendor Accepted
                    </Button>
                  )}
                  {formData.status === 'Accepted' && (
                    <Button variant="contained" color="warning" fullWidth onClick={() => handleSave('Work In Progress')}>
                      Start Work
                    </Button>
                  )}
                  {formData.status === 'Work In Progress' && (
                    <Button variant="contained" color="success" fullWidth onClick={() => handleSave('Completed')}>
                      Mark Completed
                    </Button>
                  )}
                  {formData.status === 'Completed' && (
                    <Button variant="contained" color="info" fullWidth onClick={() => handleSave('Verified')}>
                      Verify Repair
                    </Button>
                  )}
                  {formData.status === 'Verified' && (
                    <Button variant="outlined" color="primary" fullWidth onClick={() => handleSave('Closed')}>
                      Close Work Order
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendorWorkOrderDetail;
