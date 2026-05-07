import React, { useState, useEffect, useMemo } from 'react';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Paper, Tabs, Tab, Button, IconButton, TextField, Stack, Divider,
  Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Chip, OutlinedInput, Checkbox, ListItemText,
  Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  Grid, InputAdornment
} from '@mui/material';
import {
  Add as AddIcon, Send as SendIcon, CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon,
  Download as DownloadIcon, ExpandMore as ExpandMoreIcon, ArrowBack as ArrowBackIcon,
  AccountTree as ProjectIcon, Event as DateIcon, Group as VendorIcon, Description as RemarkIcon, Link as LinkIcon, Inventory as InventoryIcon,
  EditNote as ProcessIcon, QueryStats as CompareIcon, FactCheck as ApproveIcon, ShoppingCart as OrderIcon, Send as BlastIcon
} from '@mui/icons-material';
import api from '../services/api';

const Quotations = () => {
  const { showMessage } = useMessage();
  const [loading, setLoading] = useState(false);
  const [qrs, setQrs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvedPrs, setApprovedPrs] = useState([]);

  // Create QR state
  const [createQRDialogOpen, setCreateQRDialogOpen] = useState(false);
  const [newQR, setNewQR] = useState({
    project_id: '',
    required_date: '',
    remarks: '',
    pr_ids: [],
    items: [],
    vendor_ids: []
  });

  // Selected QR details
  const [listFilter, setListFilter] = useState('All');
  const [selectedQR, setSelectedQR] = useState(null);
  const [viewingQR, setViewingQR] = useState(null);
  const [viewQRDialogOpen, setViewQRDialogOpen] = useState(false);

  // Tab 2: Vendor Quotation Entry
  const [vendorQuotes, setVendorQuotes] = useState([]);
  const [enterQuoteDialogOpen, setEnterQuoteDialogOpen] = useState(false);
  const [selectedVendorForQuote, setSelectedVendorForQuote] = useState(null);
  const [viewVendorQuoteDialogOpen, setViewVendorQuoteDialogOpen] = useState(false);
  const [selectedSubmittedQuote, setSelectedSubmittedQuote] = useState(null);
  const [newQuote, setNewQuote] = useState({
    quotation_number: '',
    quotation_date: '',
    remarks: '',
    file: null,
    items: []
  });

  // Tab 3: Comparison
  const [comparisonData, setComparisonData] = useState(null);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedMaterialForOverride, setSelectedMaterialForOverride] = useState(null);
  const [overrideData, setOverrideData] = useState({
    selected_vendor_id: '',
    override_reason: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedQR?.id, selectedQR?.status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!selectedQR) {
        // Master List Mode
        const [qrsRes, projRes, vendRes, matRes, prRes] = await Promise.all([
          api.get('/api/quotations/requests'),
          api.get('/api/projects'),
          api.get('/api/vendors'),
          api.get('/api/materials'),
          api.get('/api/procurement/pr') // Relaxed filter
        ]);
        setQrs(Array.isArray(qrsRes.data) ? qrsRes.data : []);
        setProjects(Array.isArray(projRes.data) ? projRes.data : []);
        setVendors(Array.isArray(vendRes.data) ? vendRes.data : []);
        setMaterials(matRes.data?.items || (Array.isArray(matRes.data) ? matRes.data : []));
        setApprovedPrs(Array.isArray(prRes.data) ? prRes.data : []);
      } else {
        // Detail / Workflow Mode
        await Promise.all([
          fetchVendorQuotes(selectedQR.id),
          fetchComparison(selectedQR.id)
        ]);
      }
    } catch (err) {
      showMessage('Failed to sync data.', 'Error', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorQuotes = async (qrId) => {
    try {
      const res = await api.get(`/api/quotations/${qrId}/vendor-quotations`);
      setVendorQuotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComparison = async (qrId) => {
    if (qrId) {
      api.get(`/api/quotations/${qrId}/comparison`)
        .then(res => setComparisonData(res.data))
        .catch(err => {
          console.error(err);
          showMessage('Failed to fetch comparison data', 'Error', 'error');
        });
    }
  };


  // --- Actions ---

  const handleAutoProcess = (qr) => {
    setSelectedQR(qr);
  };

  const handleCreateQR = async () => {
    try {
      const payload = {
        ...newQR,
        required_date: newQR.required_date || null,
        remarks: newQR.remarks || null
      };
      await api.post('/api/quotations/requests', payload);
      showMessage('Quotation Request created successfully!', 'Success', 'success');
      setCreateQRDialogOpen(false);
      setNewQR({ project_id: '', required_date: '', remarks: '', pr_ids: [], items: [], vendor_ids: [] });
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Failed to create Quotation Request. Please check your inputs.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
      }
      showMessage(msg, 'Validation Error', 'error');
    }
  };

  const handleSendToVendors = async (id) => {
    try {
      await api.post(`/api/quotations/requests/${id}/send`);
      showMessage('Sent to vendors successfully!', 'Success', 'success');
      fetchData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to send to vendors', 'Error', 'error');
    }
  };

  const handleEnterQuote = async () => {
    try {
      const formData = new FormData();
      formData.append('vendor_id', selectedVendorForQuote.vendor_id);
      formData.append('quotation_number', newQuote.quotation_number);
      formData.append('quotation_date', newQuote.quotation_date);
      formData.append('remarks', newQuote.remarks);
      formData.append('items_json', JSON.stringify(newQuote.items));
      if (newQuote.file) {
        formData.append('file', newQuote.file);
      }

      await api.post(`/api/quotations/${selectedQR.id}/vendor-quotation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('Quotation entered successfully!', 'Success', 'success');
      setEnterQuoteDialogOpen(false);
      fetchVendorQuotes(selectedQR.id);

      // Update selected QR status in memory if all quotes received (simplification)
      const res = await api.get(`/api/quotations/requests/${selectedQR.id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to enter quote', 'Error', 'error');
    }
  };

  const handleOverride = async () => {
    try {
      await api.post(`/api/quotations/${selectedQR.id}/override`, {
        qr_item_id: selectedMaterialForOverride.qr_item_id,
        material_id: selectedMaterialForOverride.material_id,
        selected_vendor_id: overrideData.selected_vendor_id,
        override_reason: overrideData.override_reason
      });
      showMessage('Vendor overridden successfully!', 'Success', 'success');
      setOverrideDialogOpen(false);
      fetchComparison(selectedQR.id);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to override vendor', 'Error', 'error');
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/api/quotations/${selectedQR.id}/approve`);
      showMessage('Comparative statement approved!', 'Success', 'success');
      fetchComparison(selectedQR.id);
      const res = await api.get(`/api/quotations/requests/${selectedQR.id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to approve', 'Error', 'error');
    }
  };

  const handleConvertToPO = async () => {
    try {
      const res = await api.post(`/api/quotations/${selectedQR.id}/convert-to-po`);
      showMessage(res.data.message, 'Success', 'success');
      fetchComparison(selectedQR.id);
      const qrRes = await api.get(`/api/quotations/requests/${selectedQR.id}`);
      setSelectedQR(qrRes.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to convert to PO', 'Error', 'error');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/api/quotations/${selectedQR.id}/comparative-statement/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comparative_statement_${selectedQR.qr_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  // --- Filtering Logic ---
  const filteredQRs = useMemo(() => {
    if (listFilter === 'All') return qrs;
    const filterMap = {
      'Draft': 'Draft',
      'Invited': 'Sent to Vendors',
      'Quoted': 'Quotations Received',
      'Compared': 'Comparison Done',
      'Approved': 'Approved',
      'Ordered': 'Converted to PO'
    };
    return qrs.filter(qr => qr.status === filterMap[listFilter]);
  }, [qrs, listFilter]);

  const getStatusCount = (filter) => {
    if (filter === 'All') return qrs.length;
    const filterMap = {
      'Draft': 'Draft',
      'Invited': 'Sent to Vendors',
      'Quoted': 'Quotations Received',
      'Compared': 'Comparison Done',
      'Approved': 'Approved',
      'Ordered': 'Converted to PO'
    };
    return qrs.filter(qr => qr.status === filterMap[filter]).length;
  };

  // --- Selection Logic ---
  const handlePRSelection = (e) => {
    const selectedPrIds = e.target.value;
    const prItems = [];
    selectedPrIds.forEach(id => {
      const pr = approvedPrs.find(p => p.id === id);
      if (pr && pr.items) {
        pr.items.forEach(it => {
          prItems.push({ material_id: it.material_id, quantity: it.quantity, pr_id: pr.id });
        });
      }
    });

    setNewQR(prev => {
      const manualItems = (prev.items || []).filter(it => !it.pr_id);
      return { ...prev, pr_ids: selectedPrIds, items: [...prItems, ...manualItems] };
    });
  };

  const handleManualMaterialSelection = (e) => {
    const selectedMatIds = e.target.value;
    setNewQR(prev => {
      const prItems = (prev.items || []).filter(it => it.pr_id);
      const manualItems = selectedMatIds.map(id => {
        const existing = (prev.items || []).find(it => !it.pr_id && it.material_id === id);
        return existing || { material_id: id, quantity: 1, pr_id: null };
      });
      return {
        ...prev,
        manual_material_ids: selectedMatIds,
        items: [...prItems, ...manualItems]
      };
    });
  };

  // --- UI Renderers ---

  const steps = ['Draft', 'Invited', 'Quoted', 'Compared', 'Approved', 'Ordered'];
  const getStepIndex = (status) => {
    switch (status) {
      case 'Draft': return 0;
      case 'Sent to Vendors': return 1;
      case 'Quotations Received': return 2;
      case 'Comparison Done': return 3;
      case 'Approved': return 4;
      case 'Converted to PO': return 5;
      default: return 0;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Sent to Vendors': return 'info';
      case 'Quotations Received': return 'secondary';
      case 'Comparison Done': return 'warning';
      case 'Approved': return 'primary';
      case 'Converted to PO': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="600">Quotation Management</Typography>
        {!selectedQR && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateQRDialogOpen(true)}>
            Create Quotation Request
          </Button>
        )}
      </Box>


      {selectedQR ? (
        <Paper sx={{ mb: 4, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedQR(null)}>
              Back to All Requests
            </Button>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {selectedQR.qr_number} - {selectedQR.status}
            </Typography>
          </Box>

          <Box sx={{ px: 4, pb: 2 }}>
            <Stepper activeStep={getStepIndex(selectedQR.status)} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Paper>
      ) : (
        <Box sx={{ mb: 3 }}>
          {/* Main List view continues below */}
        </Box>
      )}
      {/* MAIN CONTENT AREA */}
      <Box sx={{ p: 0 }}>
        {/* CASE 1: Main List View (No QR Selected) */}
        {!selectedQR && (
          <Box>
            {/* Status Filter Tabs */}
            <Paper 
              elevation={0} 
              sx={{ 
                mb: 2, 
                borderBottom: '1px solid #e0e0e0', 
                borderRadius: '8px 8px 0 0',
                backgroundColor: '#fff' 
              }}
            >
              <Tabs 
                value={listFilter} 
                onChange={(e, newVal) => setListFilter(newVal)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minWidth: 100,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textTransform: 'none',
                    py: 1.5,
                  },
                  '& .Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                {['All', 'Draft', 'Invited', 'Quoted', 'Compared', 'Approved', 'Ordered'].map(filter => (
                  <Tab 
                    key={filter} 
                    value={filter} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {filter}
                        <Chip 
                          label={getStatusCount(filter)} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            backgroundColor: listFilter === filter ? 'primary.light' : '#f0f0f0',
                            color: listFilter === filter ? 'primary.contrastText' : 'text.secondary',
                            cursor: 'pointer'
                          }} 
                        />
                      </Box>
                    } 
                  />
                ))}
              </Tabs>
            </Paper>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>QR Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Linked PRs</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Invited Vendors</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} sx={{ my: 4 }} /></TableCell></TableRow>
                  ) : filteredQRs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">No quotations found in this stage.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQRs.map(qr => (
                      <TableRow key={qr.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{qr.qr_number}</TableCell>
                        <TableCell>{qr.project_name || 'N/A'}</TableCell>
                        <TableCell>
                          {qr.linked_prs?.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {qr.linked_prs.map(p => (
                                <Chip key={p.id} label={p.pr_number} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.disabled">Direct</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">{qr.invited_vendors?.length || 0} Vendors</Typography>
                        </TableCell>
                        <TableCell><Chip label={qr.status} color={getStatusColor(qr.status)} size="small" sx={{ fontWeight: 500, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell>{qr.created_at ? new Date(qr.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <IconButton 
                              size="small" 
                              title="View Details" 
                              onClick={() => { setViewingQR(qr); setViewQRDialogOpen(true); }}
                              sx={{ color: 'text.secondary' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>

                            {qr.status === 'Draft' && (
                              <IconButton 
                                size="small" 
                                title="Send to Vendors" 
                                onClick={() => handleSendToVendors(qr.id)}
                                sx={{ color: 'primary.main' }}
                              >
                                <BlastIcon fontSize="small" />
                              </IconButton>
                            )}

                            {['Sent to Vendors', 'Quotations Received'].includes(qr.status) && (
                              <IconButton 
                                size="small" 
                                title="Process Quotes" 
                                onClick={() => handleAutoProcess(qr)}
                                sx={{ color: 'secondary.main' }}
                              >
                                <ProcessIcon fontSize="small" />
                              </IconButton>
                            )}

                            {qr.status === 'Comparison Done' && (
                              <IconButton 
                                size="small" 
                                title="Manage Approval" 
                                onClick={() => handleAutoProcess(qr)}
                                sx={{ color: 'warning.main' }}
                              >
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            )}

                            {qr.status === 'Approved' && (
                              <IconButton 
                                size="small" 
                                title="Convert to PO" 
                                onClick={() => handleAutoProcess(qr)}
                                sx={{ color: 'success.main' }}
                              >
                                <OrderIcon fontSize="small" />
                              </IconButton>
                            )}
                            
                            {qr.status === 'Converted to PO' && (
                              <IconButton 
                                size="small" 
                                title="View Comparison" 
                                onClick={() => handleAutoProcess(qr)}
                                sx={{ color: 'info.main' }}
                              >
                                <CompareIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* CASE 2: Adaptive Detail View (QR Selected) */}
        {selectedQR && (
          <Box>
            {/* Phase 1: Quote Collection (Visible when Sent or Received) */}
            {['Sent to Vendors', 'Quotations Received'].includes(selectedQR.status) && (
              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>1. Quote Collection Stage</Typography>
                  {selectedQR.status === 'Quotations Received' && (
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={async () => {
                        await api.post(`/api/quotations/requests/${selectedQR.id}/finalize`);
                        fetchData();
                      }}
                    >
                      Finalize & Generate Statement
                    </Button>
                  )}
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Vendor Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Sent Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Quote Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedQR.invited_vendors.map(v => {
                        const submittedQuote = vendorQuotes.find(q => q.vendor_id === v.vendor_id);
                        return (
                          <TableRow key={v.vendor_id}>
                            <TableCell>{v.vendor_name}</TableCell>
                            <TableCell><Chip size="small" label={v.is_sent ? "Sent" : "Pending"} color={v.is_sent ? "info" : "default"} /></TableCell>
                            <TableCell><Chip size="small" label={submittedQuote ? "Received" : "Pending"} color={submittedQuote ? "success" : "warning"} /></TableCell>
                            <TableCell align="right">
                              {!submittedQuote ? (
                                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => {
                                  setSelectedVendorForQuote(v);
                                  setNewQuote({
                                    quotation_number: '', quotation_date: '', remarks: '', file: null,
                                    items: selectedQR.items.map(i => ({
                                      qr_item_id: i.id, material_id: i.material_id, material_name: i.material_name,
                                      uom_name: i.uom_name, quoted_rate: '', delivery_days: '', remarks: ''
                                    }))
                                  });
                                  setEnterQuoteDialogOpen(true);
                                }}>Enter Quote</Button>
                              ) : (
                                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => {
                                  setSelectedSubmittedQuote(submittedQuote);
                                  setViewVendorQuoteDialogOpen(true);
                                }}>View</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Phase 2: Material-Wise Comparison (Visible when Received or Compared) */}
            {['Quotations Received', 'Comparison Done'].includes(selectedQR.status) && comparisonData && (
              <Box mb={4}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>2. Technical Comparison (Item-Wise)</Typography>
                {comparisonData.materials.map(mat => (
                  <Accordion key={mat.qr_item_id} variant="outlined" sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight="bold">{mat.material_name}</Typography>
                      <Typography sx={{ ml: 2, color: 'text.secondary' }}>Qty: {mat.quantity} {mat.uom_name}</Typography>
                      {mat.is_overridden && <Chip size="small" label="Overridden" color="warning" sx={{ ml: 2 }} />}
                    </AccordionSummary>
                    <AccordionDetails>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#fdfdfd' }}>
                            <TableCell>Vendor</TableCell>
                            <TableCell>Rate (₹)</TableCell>
                            <TableCell>Delivery</TableCell>
                            <TableCell>Rank</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mat.vendor_quotes.map(q => {
                            const isSelected = mat.selected_vendor_id === q.vendor_id;
                            return (
                              <TableRow key={q.vendor_id} sx={{ backgroundColor: isSelected ? '#f1f8e9' : 'inherit' }}>
                                <TableCell>{q.vendor_name}</TableCell>
                                <TableCell>{q.quoted_rate}</TableCell>
                                <TableCell>{q.delivery_days || '-'} days</TableCell>
                                <TableCell><Chip size="small" label={q.rank_label} color={q.rank === 1 ? "success" : "default"} /></TableCell>
                                <TableCell align="right">
                                  {!isSelected && !['Approved', 'Converted to PO'].includes(selectedQR.status) && (
                                    <Button size="small" onClick={() => {
                                      setSelectedMaterialForOverride(mat);
                                      setOverrideData({ selected_vendor_id: q.vendor_id, override_reason: '' });
                                      setOverrideDialogOpen(true);
                                    }}>Select & Override</Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {/* Phase 3: Final Comparative Statement (Visible when Compared or beyond) */}
            {['Comparison Done', 'Approved', 'Converted to PO'].includes(selectedQR.status) && comparisonData && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>3. Comparative Statement & Approval</Typography>
                  <Box>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPDF} sx={{ mr: 1 }}>Download PDF</Button>
                    {selectedQR.status === 'Comparison Done' && (
                      <Button variant="contained" color="primary" onClick={handleApprove}>Management Approve</Button>
                    )}
                    {selectedQR.status === 'Approved' && (
                      <Button variant="contained" color="success" onClick={handleConvertToPO}>Convert to POs</Button>
                    )}
                  </Box>
                </Box>

                <Paper sx={{ p: 4, backgroundColor: '#fcfcfc', border: '1px solid #e0e0e0' }}>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 1, letterSpacing: 1 }}>COMPARATIVE STATEMENT</Typography>
                  <Typography variant="subtitle2" align="center" color="text.secondary" sx={{ mb: 4 }}>QR NO: {comparisonData.qr_number} | PROJECT: {comparisonData.project_name}</Typography>
                  <Divider sx={{ mb: 4 }} />

                  {comparisonData.vendor_totals.sort((a, b) => a.total_value - b.total_value).map((vt, vIdx) => (
                    <Box
                      key={vt.vendor_id}
                      sx={{
                        mb: 6, p: 3,
                        border: vt.is_selected_any ? '2px solid #2e7d32' : '1px solid #e0e0e0',
                        borderRadius: 2,
                        backgroundColor: vt.is_selected_any ? '#f9fff9' : 'white',
                        boxShadow: vt.is_selected_any ? '0 4px 8px rgba(46,125,50,0.1)' : 'none'
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: vt.is_selected_any ? 'success.main' : 'primary.main' }}>{vIdx + 1}. {vt.vendor_name}</Typography>
                          {vt.is_selected_any && <Chip label="Selected Vendor" color="success" size="small" sx={{ fontWeight: 'bold' }} icon={<CheckCircleIcon />} />}
                          {vIdx === 0 && <Chip label="Lowest Overall (L1)" variant="outlined" color="success" size="small" sx={{ fontWeight: 'bold' }} />}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Total: ₹{vt.total_value.toLocaleString()}</Typography>
                      </Box>

                      <Table size="small" sx={{ backgroundColor: '#fff' }}>
                        <TableHead><TableRow sx={{ backgroundColor: '#f8f9fa' }}><TableCell>Material</TableCell><TableCell align="right">Rate</TableCell><TableCell align="right">Amount</TableCell><TableCell align="center">Rank</TableCell></TableRow></TableHead>
                        <TableBody>
                          {comparisonData.materials.map(mat => {
                            const q = mat.vendor_quotes.find(x => x.vendor_id === vt.vendor_id);
                            return (
                              <TableRow key={mat.qr_item_id} sx={{ backgroundColor: mat.selected_vendor_id === vt.vendor_id ? '#f1f8e9' : 'inherit' }}>
                                <TableCell>{mat.material_name}</TableCell>
                                <TableCell align="right">{q ? q.quoted_rate : '-'}</TableCell>
                                <TableCell align="right">{q ? (q.quoted_rate * mat.quantity).toLocaleString() : '-'}</TableCell>
                                <TableCell align="center"><Chip label={q?.rank_label || '-'} size="small" variant="outlined" /></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {/* --- DIALOGS --- */}

        <Dialog
          open={createQRDialogOpen}
          onClose={() => setCreateQRDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}
        >
          <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Create Quotation Request</Typography>
            <Typography variant="body2" color="text.secondary">Initiate a new procurement cycle by linking PRs and inviting vendors.</Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 3,
                mt: 2
              }}
            >
              {/* Row 1: Project & Date */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Select Project
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={newQR.project_id}
                    onChange={(e) => setNewQR(prev => ({ ...prev, project_id: e.target.value }))}
                    startAdornment={<InputAdornment position="start"><ProjectIcon color="action" sx={{ mr: 1 }} /></InputAdornment>}
                  >
                    {Array.isArray(projects) && projects.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Required Date
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={newQR.required_date}
                  onChange={(e) => setNewQR({ ...newQR, required_date: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DateIcon color="action" sx={{ mr: 1 }} /></InputAdornment>,
                  }}
                />
              </Box>

              {/* Row 2: Link PRs & Manual Materials */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Link Approved PRs
                </Typography>
                <FormControl fullWidth>
                  <Select
                    multiple
                    value={newQR.pr_ids || []}
                    onChange={handlePRSelection}
                    input={<OutlinedInput />}
                    startAdornment={<InputAdornment position="start"><LinkIcon color="action" sx={{ mr: 1 }} /></InputAdornment>}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip
                            key={id}
                            label={(approvedPrs || []).find(pr => pr.id === id)?.pr_number}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {Array.isArray(approvedPrs) && approvedPrs.map(pr => (
                      <MenuItem key={pr.id} value={pr.id}>
                        <Checkbox checked={(newQR.pr_ids || []).indexOf(pr.id) > -1} />
                        <ListItemText primary={`${pr.pr_number}`} secondary={`${pr.items?.length || 0} items`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Manual Material Selection
                </Typography>
                <FormControl fullWidth>
                  <Select
                    multiple
                    value={newQR.manual_material_ids || []}
                    onChange={handleManualMaterialSelection}
                    input={<OutlinedInput />}
                    startAdornment={<InputAdornment position="start"><InventoryIcon color="action" sx={{ mr: 1 }} /></InputAdornment>}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip
                            key={id}
                            label={materials.find(m => m.id === id)?.name}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {Array.isArray(materials) && materials.map(m => (
                      <MenuItem key={m.id} value={m.id}>
                        <Checkbox checked={(newQR.manual_material_ids || []).indexOf(m.id) > -1} />
                        <ListItemText primary={m.name} secondary={m.code} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Row 3: Invite Vendors */}
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Invite Vendors
                </Typography>
                <FormControl fullWidth>
                  <Select
                    multiple
                    value={newQR.vendor_ids || []}
                    onChange={(e) => setNewQR(prev => ({ ...prev, vendor_ids: e.target.value }))}
                    input={<OutlinedInput />}
                    startAdornment={<InputAdornment position="start"><VendorIcon color="action" sx={{ mr: 1 }} /></InputAdornment>}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip
                            key={id}
                            label={(vendors || []).find(v => v.id === id)?.name}
                            size="small"
                            sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {Array.isArray(vendors) && vendors.map(v => (
                      <MenuItem key={v.id} value={v.id}>
                        <Checkbox checked={(newQR.vendor_ids || []).indexOf(v.id) > -1} />
                        <ListItemText primary={v.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Row 4: Items Preview (Full Width) */}
              {(newQR.items?.length > 0) && (
                <Box sx={{ gridColumn: 'span 2' }}>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fcfcfc', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                      <Box component="span" sx={{ width: 4, height: 16, bgcolor: 'secondary.main', mr: 1, borderRadius: 1 }} />
                      Selected Materials ({newQR.items.length})
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 600 }}>Source</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {newQR.items.map((it, idx) => {
                          const m = Array.isArray(materials) ? materials.find(x => x.id === it.material_id) : null;
                          return (
                            <TableRow key={idx}>
                              <TableCell sx={{ py: 0.5 }}>{m?.name || 'Loading...'}</TableCell>
                              <TableCell align="right" sx={{ py: 0.5, fontWeight: 500 }}>{it.quantity}</TableCell>
                              <TableCell align="center" sx={{ py: 0.5 }}>
                                <Chip size="small" label={it.pr_id ? 'PR' : 'Manual'} variant="outlined" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>
              )}

              {/* Row 5: Remarks (Full Width) */}
              <Box sx={{ gridColumn: 'span 2' }}>
                <TextField
                  fullWidth
                  label="General Remarks"
                  multiline
                  rows={2}
                  value={newQR.remarks}
                  onChange={(e) => setNewQR({ ...newQR, remarks: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><RemarkIcon color="action" sx={{ mr: 1 }} /></InputAdornment>,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 1 }}>
            <Button onClick={() => setCreateQRDialogOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button
              onClick={handleCreateQR}
              variant="contained"
              size="large"
              disabled={!newQR.project_id || (newQR.items?.length || 0) === 0 || (newQR.vendor_ids?.length || 0) === 0}
              sx={{ px: 4, borderRadius: 2, fontWeight: 700, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)' }}
            >
              Create Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enter Quote Dialog */}
        <Dialog open={enterQuoteDialogOpen} onClose={() => setEnterQuoteDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Enter Quotation - {selectedVendorForQuote?.vendor_name}</DialogTitle>
          <DialogContent>
            <Stack direction="row" spacing={3} mb={6} mt={2} alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>Quotation Number</Typography>
                <TextField
                  variant="outlined"
                  sx={{ width: 300 }}
                  placeholder="Enter Quotation Number"
                  value={newQuote.quotation_number}
                  onChange={(e) => setNewQuote({ ...newQuote, quotation_number: e.target.value })}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>Quotation Date</Typography>
                <TextField
                  type="date"
                  variant="outlined"
                  sx={{ width: 250 }}
                  value={newQuote.quotation_date}
                  onChange={(e) => setNewQuote({ ...newQuote, quotation_date: e.target.value })}
                />
              </Box>
              <Box sx={{ pt: 4 }}>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} sx={{ height: 56, px: 3 }}>
                  Upload File
                  <input type="file" hidden onChange={(e) => setNewQuote({ ...newQuote, file: e.target.files[0] })} />
                </Button>
              </Box>
              {newQuote.file && <Box sx={{ pt: 6 }}><Typography variant="caption" sx={{ fontWeight: 500 }}>{newQuote.file.name}</Typography></Box>}
            </Stack>

            <Divider sx={{ mb: 4 }} />

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>Quoted Rate (₹)</TableCell>
                  <TableCell>Delivery Days</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newQuote.items.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{it.material_name}</TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={it.quoted_rate} onChange={(e) => {
                        const newItems = [...newQuote.items];
                        newItems[idx].quoted_rate = e.target.value;
                        setNewQuote({ ...newQuote, items: newItems });
                      }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={it.delivery_days} onChange={(e) => {
                        const newItems = [...newQuote.items];
                        newItems[idx].delivery_days = e.target.value;
                        setNewQuote({ ...newQuote, items: newItems });
                      }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" value={it.remarks} onChange={(e) => {
                        const newItems = [...newQuote.items];
                        newItems[idx].remarks = e.target.value;
                        setNewQuote({ ...newQuote, items: newItems });
                      }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEnterQuoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEnterQuote} variant="contained" disabled={newQuote.items.some(i => !i.quoted_rate)}>Save Quotation</Button>
          </DialogActions>
        </Dialog>

        {/* Override Dialog */}
        <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)}>
          <DialogTitle>Override Vendor Selection</DialogTitle>
          <DialogContent>
            <Typography mb={2}>Material: <strong>{selectedMaterialForOverride?.material_name}</strong></Typography>
            <FormControl fullWidth margin="dense">
              <InputLabel>Select Vendor</InputLabel>
              <Select value={overrideData.selected_vendor_id} onChange={(e) => setOverrideData({ ...overrideData, selected_vendor_id: e.target.value })} label="Select Vendor">
                {selectedMaterialForOverride?.vendor_quotes.map(q => (
                  <MenuItem key={q.vendor_id} value={q.vendor_id}>
                    {q.vendor_name} - ₹{q.quoted_rate} ({q.rank_label})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth margin="dense" label="Override Reason (Quality issue, lead time, etc.)"
              multiline rows={3} required
              value={overrideData.override_reason}
              onChange={(e) => setOverrideData({ ...overrideData, override_reason: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOverrideDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleOverride} variant="contained" color="warning" disabled={!overrideData.selected_vendor_id || !overrideData.override_reason}>Confirm Override</Button>
          </DialogActions>
        </Dialog>

      {/* View QR Dialog */}
      <Dialog open={viewQRDialogOpen} onClose={() => { setViewQRDialogOpen(false); setViewingQR(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Quotation Request Details - {viewingQR?.qr_number}</DialogTitle>
        <DialogContent>
          {viewingQR && (
            <Box>
              <Typography><strong>Project:</strong> {viewingQR.project_name}</Typography>
              <Typography><strong>Status:</strong> {viewingQR.status}</Typography>
              <Typography><strong>Linked PRs:</strong> {viewingQR.linked_prs.map(p => p.pr_number).join(', ') || 'None'}</Typography>

              <Typography variant="h6" mt={2} mb={1}>Items</Typography>
              <Table size="small">
                <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Qty</TableCell><TableCell>UOM</TableCell></TableRow></TableHead>
                <TableBody>
                  {viewingQR.items.map(it => (
                    <TableRow key={it.id}>
                      <TableCell>{it.material_name} ({it.material_code})</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{it.uom_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewQRDialogOpen(false); setViewingQR(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

        {/* View Submitted Vendor Quotation Dialog */}
        <Dialog open={viewVendorQuoteDialogOpen} onClose={() => setViewVendorQuoteDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Quotation Details - {selectedSubmittedQuote?.quotation_number}</DialogTitle>
          <DialogContent>
            {selectedSubmittedQuote && (
              <Box>
                <Stack direction="row" spacing={4} mb={3}>
                  <Typography><strong>Vendor:</strong> {selectedSubmittedQuote.vendor_name}</Typography>
                  <Typography><strong>Date:</strong> {selectedSubmittedQuote.quotation_date ? new Date(selectedSubmittedQuote.quotation_date).toLocaleDateString() : 'N/A'}</Typography>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'background.default' }}>
                        <TableCell>Material</TableCell>
                        <TableCell align="right">Quoted Rate (₹)</TableCell>
                        <TableCell align="center">Delivery Days</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedSubmittedQuote.items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{it.material_name}</TableCell>
                          <TableCell align="right">₹{it.quoted_rate}</TableCell>
                          <TableCell align="center">{it.delivery_days} days</TableCell>
                          <TableCell>{it.remarks || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {selectedSubmittedQuote.remarks && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" color="textSecondary">General Remarks:</Typography>
                    <Typography variant="body2">{selectedSubmittedQuote.remarks}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewVendorQuoteDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
};

export default Quotations;
