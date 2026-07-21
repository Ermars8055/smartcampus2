import React, { useState, useEffect, useMemo } from 'react';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import { computeGstSplit } from '../utils/gstCalculations';
import {
  Box, Typography, Paper, Tabs, Tab, Button, IconButton, TextField, Stack, Divider,
  Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TableFooter,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, FormHelperText,
  InputLabel, Select, MenuItem, Chip, OutlinedInput, Checkbox, ListItemText, Autocomplete,
  Alert, CircularProgress, Accordion, AccordionSummary, AccordionDetails, Card,
  Grid, InputAdornment, Tooltip, createFilterOptions
} from '@mui/material';
import {
  Add as AddIcon, Send as SendIcon, CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon, Edit as EditIcon, CheckCircle as CheckCircleIcon,
  Download as DownloadIcon, ExpandMore as ExpandMoreIcon, ArrowBack as ArrowBackIcon,
  AccountTree as ProjectIcon, Event as DateIcon, Group as VendorIcon, Description as RemarkIcon, Link as LinkIcon, Inventory as InventoryIcon,
  EditNote as ProcessIcon, Balance as CompareIcon, FactCheck as ApproveIcon, ShoppingCart as OrderIcon, Send as BlastIcon,
  ArrowDropUp, ArrowDropDown, Search
} from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';


import { useAuth } from '../context/AuthContext';

const OPTIONS_LIMIT = 50;
const filterOptions = createFilterOptions({
  limit: OPTIONS_LIMIT,
});

const Quotations = () => {
  const { showMessage } = useMessage();
  const { tenantConfig } = useConfig();
  const { hasAction, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrs, setQrs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [approvedPrs, setApprovedPrs] = useState([]);
  const [search, setSearch] = useState('');

  // Create QR state
  const [createQRDialogOpen, setCreateQRDialogOpen] = useState(false);
  const [newQR, setNewQR] = useState({
    required_date: '',
    remarks: '',
    pr_ids: [],
    items: [],
    vendor_ids: []
  });
  const [errors, setErrors] = useState({});



  // Selected QR details
  const [listFilter, setListFilter] = useState('Draft');
  const [selectedQR, setSelectedQR] = useState(null);
  const [detailSection, setDetailSection] = useState(null); // 'quotations', 'comparison', 'approval'
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
    existing_file: null,
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
  const [convertToPoDialog, setConvertToPoDialog] = useState({ open: false, terms: '', items: [] });
  const [termsTemplates, setTermsTemplates] = useState([]);

  const [sendToVendorsDialog, setSendToVendorsDialog] = useState({ open: false, qrId: null, qrNumber: '', vendorNames: [], message: '', isSending: false });

  // Management Approve dialog
  const [managementApproveDialogOpen, setManagementApproveDialogOpen] = useState(false);
  const [managementApproveComment, setManagementApproveComment] = useState('');

  // Generated POs
  const [generatedPOs, setGeneratedPOs] = useState([]);

  // Negotiation Modal
  const [negotiateDialog, setNegotiateDialog] = useState({ open: false, vendorId: null, vendorName: '', discountPercent: '', remarks: '', history: [] });




  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear all errors when form changes
    });
  }, [newQR]);

  useEffect(() => {
    api.get('/api/terms').then(r => setTermsTemplates(r.data)).catch(console.error);
    api.get('/api/projects').then(res => setProjects(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    api.get('/api/vendors').then(res => setVendors(Array.isArray(res.data) ? res.data : [])).catch(console.error);
    api.get('/api/materials', { params: { limit: 10000 } }).then(res => setMaterials(res.data?.items || (Array.isArray(res.data) ? res.data : []))).catch(console.error);
    api.get('/api/procurement/pr?status=Approved').then(res => setApprovedPrs(Array.isArray(res.data) ? res.data : [])).catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedQR?.id, selectedQR?.status]);

  useEffect(() => {
    if (selectedQR && detailSection) {
      setTimeout(() => {
        const element = document.getElementById(`${detailSection}-section`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500); // Wait for data to load and render
    }
  }, [selectedQR?.id, detailSection]);

  useEffect(() => {
    if (selectedQR && selectedQR.status === 'Ordered') {
      api.get(`/api/procurement/po?qr_id=${selectedQR.id}`)
        .then(r => setGeneratedPOs(r.data))
        .catch(e => console.error("Failed to load POs:", e));
    } else {
      setGeneratedPOs([]);
    }
  }, [selectedQR]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!selectedQR) {
        // Master List Mode
        const qrsRes = await api.get('/api/quotations/requests');
        setQrs(Array.isArray(qrsRes.data) ? qrsRes.data : []);
      } else {
        // Detail / Workflow Mode
        const [qrRes] = await Promise.all([
          api.get(`/api/quotations/requests/${selectedQR.id}`),
          fetchVendorQuotes(selectedQR.id),
          fetchComparison(selectedQR.id)
        ]);
        setSelectedQR(qrRes.data);
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





  const handleAutoProcess = (qr, section = null) => {
    setSelectedQR(qr);
    setDetailSection(section);
  };

  const handleCreateQR = async () => {
    const newErrors = {};

    if (!newQR.items || newQR.items.length === 0) {
      newErrors.items = "Please link at least one PR or add manual materials.";
    }
    if (!newQR.vendor_ids || newQR.vendor_ids.length < 2) {
      newErrors.vendor_ids = "Please invite at least 2 vendors to ensure competitive pricing.";
    }

    if (!newQR.required_date) {
      newErrors.required_date = "Required Date is required.";
    } else if (dayjs(newQR.required_date).isBefore(dayjs(), 'day')) {
      newErrors.required_date = "Required Date cannot be in the past.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      const payload = {
        ...newQR,
        project_id: projects.length > 0 ? projects[0].id : 1,
        items: (newQR.items || []).filter(it => !it.pr_id),
        required_date: newQR.required_date || null,
        remarks: newQR.remarks || null
      };
      const res = await api.post('/api/quotations/requests', payload);
      const qrNumber = res?.data?.qr_number || '';
      showMessage(`Quotation Request ${qrNumber} created successfully!`.trim(), 'Success', 'success');
      setCreateQRDialogOpen(false);
      setNewQR({ required_date: '', remarks: '', pr_ids: [], items: [], vendor_ids: [] });
      setErrors({});
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

  const openSendToVendorsDialog = (qr) => {
    const vendorNames = qr.invited_vendors?.map(v => v.vendor_name) || [];
    
    // Generate a formatted list of materials to include in the email
    const materialsList = qr.items?.map((item, index) => 
      `${index + 1}. ${item.material_name} (${item.material_code}) - Qty: ${item.quantity} ${item.uom_name}`
    ).join('\n') || 'No materials listed.';

    const defaultMessage = `Dear Vendor,\n\nWe are requesting quotations for the following materials for Quotation Request ${qr.qr_number}:\n\n${materialsList}\n\nPlease submit your best rates along with delivery timelines at your earliest convenience.\n\nRegards,\nProcurement Team`;
    
    setSendToVendorsDialog({
      open: true,
      qrId: qr.id,
      qrNumber: qr.qr_number,
      vendorNames,
      message: defaultMessage,
      isSending: false
    });
  };

  const handleSendToVendors = async () => {
    setSendToVendorsDialog(prev => ({ ...prev, isSending: true }));
    try {
      await api.post(`/api/quotations/requests/${sendToVendorsDialog.qrId}/send`, {
        message: sendToVendorsDialog.message
      });
      showMessage('Request sent to vendors successfully!', 'Success', 'success');
      setSendToVendorsDialog({ open: false, qrId: null, qrNumber: '', vendorNames: [], message: '', isSending: false });
      fetchData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to send to vendors', 'Error', 'error');
      setSendToVendorsDialog(prev => ({ ...prev, isSending: false }));
    }
  };

  const handleEnterQuote = async (isDraft = false) => {
    try {
      const formData = new FormData();
      formData.append('vendor_id', selectedVendorForQuote.vendor_id);
      formData.append('quotation_number', newQuote.quotation_number);
      formData.append('quotation_date', newQuote.quotation_date);
      formData.append('remarks', newQuote.remarks);
      formData.append('items_json', JSON.stringify(newQuote.items));
      formData.append('is_draft', isDraft);
      if (newQuote.file instanceof File) {
        formData.append('file', newQuote.file);
      }

      await api.post(`/api/quotations/${selectedQR.id}/vendor-quotation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage(`Quotation ${isDraft ? 'saved as draft' : 'entered'} successfully!`, 'Success', 'success');
      setEnterQuoteDialogOpen(false);
      fetchVendorQuotes(selectedQR.id);

      // Update selected QR status in memory if all quotes received (simplification)
      const res = await api.get(`/api/quotations/requests/${selectedQR.id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to enter quote', 'Error', 'error');
    }
  };

  const handleAutoExtract = async () => {
    const file = newQuote.file;
    if (!file) {
      showMessage('Please upload a quotation file first.', 'No File Selected', 'warning');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/quotations/${selectedQR.id}/vendor-quotation/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const extractedItems = res.data;
      const updatedItems = newQuote.items.map(item => {
        const found = extractedItems.find(ex => ex.material_id === item.material_id);
        if (found) {
          return {
            ...item,
            quoted_rate: (found.quoted_rate !== null && found.quoted_rate !== undefined) ? found.quoted_rate : item.quoted_rate,
            brand: (found.brand !== null && found.brand !== undefined) ? found.brand : item.brand,
            vendor_uom_name: (found.vendor_uom_name !== null && found.vendor_uom_name !== undefined) ? found.vendor_uom_name : item.vendor_uom_name,
            delivery_days: (found.delivery_days !== null && found.delivery_days !== undefined) ? found.delivery_days : item.delivery_days,
            confidence: found.confidence_score,
            raw_text: found.raw_text
          };
        }
        return item;
      });
      setNewQuote({ ...newQuote, items: updatedItems });
      showMessage('Data extracted successfully. Please review highlighted items.', 'Success', 'success');
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to extract data', 'Error', 'error');
    } finally {
      setLoading(false);
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
      await api.post(`/api/quotations/${selectedQR.id}/approve`, { remarks: managementApproveComment });
      showMessage('Comparative statement approved!', 'Success', 'success');
      setManagementApproveDialogOpen(false);
      fetchComparison(selectedQR.id);
      const res = await api.get(`/api/quotations/requests/${selectedQR.id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to approve', 'Error', 'error');
    }
  };

  const updateConvertToPoItem = (idx, field, value) => {
    let finalVal = value;
    if (['discount_percent', 'cgst_percentage', 'sgst_percentage', 'igst_percentage'].includes(field)) {
      if (finalVal !== '' && parseFloat(finalVal) > 100) {
        finalVal = '100';
      }
    }
    const newItems = [...convertToPoDialog.items];
    newItems[idx][field] = finalVal;
    if (field === 'cgst_percentage') {
      newItems[idx].sgst_percentage = finalVal;
      newItems[idx].igst_percentage = 0;
    } else if (field === 'sgst_percentage') {
      newItems[idx].cgst_percentage = finalVal;
      newItems[idx].igst_percentage = 0;
    } else if (field === 'igst_percentage') {
      if (finalVal !== '' && finalVal !== '0' && parseFloat(finalVal) !== 0) {
        newItems[idx].cgst_percentage = 0;
        newItems[idx].sgst_percentage = 0;
      }
    }
    setConvertToPoDialog({ ...convertToPoDialog, items: newItems });
  };

  const handleConvertToPO = async () => {
    try {
      const mappedItems = convertToPoDialog.items.map(it => ({
        qr_item_id: it.qr_item_id,
        rate: parseFloat(it.rate),
        discount_percent: parseFloat(it.discount_percent || 0),
        cgst_percentage: parseFloat(it.cgst_percentage || 0),
        sgst_percentage: parseFloat(it.sgst_percentage || 0),
        igst_percentage: parseFloat(it.igst_percentage || 0),
      }));

      if (mappedItems.some(it => isNaN(it.rate) || it.rate < 0 || isNaN(it.discount_percent) || it.discount_percent < 0 || isNaN(it.cgst_percentage) || it.cgst_percentage < 0 || isNaN(it.sgst_percentage) || it.sgst_percentage < 0 || isNaN(it.igst_percentage) || it.igst_percentage < 0)) {
        showMessage("Rate, Discount and Taxes must be valid non-negative numbers.", 'Error', 'error');
        return;
      }

      if (!convertToPoDialog.terms?.trim()) {
        showMessage("Please provide terms and conditions.", 'Error', 'error');
        return;
      }

      const res = await api.post(`/api/quotations/${selectedQR.id}/convert-to-po`, {
        terms: convertToPoDialog.terms,
        items: mappedItems
      });
      showMessage(res.data.message, 'Success', 'success');
      setConvertToPoDialog({ open: false, terms: '', items: [] });
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

  const handleDownloadExcel = async () => {
    try {
      const res = await api.get(`/api/quotations/${selectedQR.id}/comparative-statement/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comparative_statement_${selectedQR.qr_number}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showMessage('Failed to download Excel', 'Error', 'error');
    }
  };

  const handleUpdateVendorReceipt = async (qrId, vendorId, newStatus, silent = false) => {
    try {
      await api.put(`/api/quotations/requests/${qrId}/vendors/${vendorId}/receipt-status`, { receipt_status: newStatus });
      if (!silent) {
        showMessage('Vendor receipt status updated!', 'Success', 'success');
      }
      const res = await api.get(`/api/quotations/requests/${qrId}`);
      setSelectedQR(res.data);
    } catch (err) {
      if (!silent) {
        showMessage(err.response?.data?.detail || 'Failed to update status', 'Error', 'error');
      }
    }
  };

  const handleOpenNegotiate = async (vendorId, vendorName) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/quotations/${selectedQR.id}/vendor-quotations/${vendorId}/negotiation-history`);
      setNegotiateDialog({
        open: true,
        vendorId,
        vendorName,
        discountPercent: '',
        remarks: '',
        history: res.data
      });
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to fetch history', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiateSubmit = async () => {
    try {
      await api.put(`/api/quotations/${selectedQR.id}/vendor-quotations/${negotiateDialog.vendorId}/discounts`, {
        discount_percent: parseFloat(negotiateDialog.discountPercent || 0),
        remarks: negotiateDialog.remarks
      });
      showMessage('Vendor discounts updated!', 'Success', 'success');
      setNegotiateDialog(prev => ({ ...prev, open: false }));
      fetchComparison(selectedQR.id);
      
      const res = await api.get(`/api/quotations/requests/${selectedQR.id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to update discount', 'Error', 'error');
    }
  };

  const handleStartReceiving = async (id) => {
    try {
      await api.post(`/api/quotations/requests/${id}/receive`);
      showMessage('Transitioned to Receiving stage!', 'Success', 'success');
      const res = await api.get(`/api/quotations/requests/${id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to transition', 'Error', 'error');
    }
  };


  const handleMoveToEntry = async (id) => {
    try {
      await api.post(`/api/quotations/requests/${id}/entered`);
      showMessage('Transitioned to Entry stage!', 'Success', 'success');
      const res = await api.get(`/api/quotations/requests/${id}`);
      setSelectedQR(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Validation Error', 'Error', 'error');
    }
  };

  // --- Filtering Logic ---
  const [sortConfig, setSortConfig] = useState({ key: 'qr_number', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredQRsBase = useMemo(() => {
    let list = qrs;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(qr => {
        const matchQR = qr.qr_number?.toLowerCase().includes(s);
        const matchPR = qr.linked_prs?.some(pr => pr.pr_number?.toLowerCase().includes(s));
        return matchQR || matchPR;
      });
    }
    return list;
  }, [qrs, search]);

  const sortedQRs = useMemo(() => {
    let filtered = listFilter === 'All' ? filteredQRsBase : filteredQRsBase.filter(qr => {
      const filterMap = {
        'Draft': 'Draft',
        'Requested': 'Requested',
        'Received': 'Received',
        'Entered': 'Entered',
        'Compared': 'Compared',
        'Approved': 'Approved',
        'Ordered': 'Ordered'
      };
      return qr.status === filterMap[listFilter];
    });

    return [...filtered].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      if (key === 'date') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (key === 'vendors') {
        aVal = a.invited_vendors?.length || 0;
        bVal = b.invited_vendors?.length || 0;
      } else if (key === 'prs') {
        aVal = a.linked_prs?.length || 0;
        bVal = b.linked_prs?.length || 0;
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredQRsBase, listFilter, sortConfig]);

  const getStatusCount = (filter) => {
    if (filter === 'All') return filteredQRsBase.length;
    const filterMap = {
      'Draft': 'Draft',
      'Requested': 'Requested',
      'Received': 'Received',
      'Entered': 'Entered',
      'Compared': 'Compared',
      'Approved': 'Approved',
      'Ordered': 'Ordered'
    };
    return filteredQRsBase.filter(qr => qr.status === filterMap[filter]).length;
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

  const updateItemQuantity = (index, val) => {
    setNewQR(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], quantity: parseFloat(val) || 0 };
      return { ...prev, items: newItems };
    });
  };

  // --- UI Renderers ---

  const steps = ['Draft', 'Requested', 'Received', 'Entered', 'Compared', 'Approved', 'Ordered'];
  const getStepIndex = (status) => {
    switch (status) {
      case 'Draft': return 0;
      case 'Requested': return 1;
      case 'Received': return 2;
      case 'Entered': return 3;
      case 'Compared': return 4;
      case 'Approved': return 5;
      case 'Ordered': return 6;
      default: return 0;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Requested': return 'info';
      case 'Received': return 'secondary';
      case 'Entered': return 'secondary';
      case 'Compared': return 'warning';
      case 'Approved': return 'primary';
      case 'Ordered': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="600">Quotation Management</Typography>
        {!selectedQR && hasPermission('quotations', 'can_create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateQRDialogOpen(true)}>
            Create Quotation Request
          </Button>
        )}
      </Box>


      {selectedQR ? (
        <Paper sx={{ mb: 4, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedQR(null)}>
              Back to All Requests
            </Button>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
              {selectedQR.qr_number} - {selectedQR.status === 'Sent to Vendors' ? 'Request to Vendors' : selectedQR.status}
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
            <Card sx={{ mb: 3 }}>
              <Box sx={{ p: 2 }}>
                <TextField size="small" placeholder="Search QR Numbers..." value={search}
                  onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
                  InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
              </Box>
              <Tabs
                value={listFilter}
                onChange={(e, newVal) => setListFilter(newVal)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {['Draft', 'Requested', 'Received', 'Entered', 'Compared', 'Approved', 'Ordered', 'All'].map(filter => (
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
                    sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
                  />
                ))}
              </Tabs>
            </Card>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflowX: 'auto', backgroundColor: '#fff' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ py: 2, px: 3, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'qr_number'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('qr_number')}
                        IconComponent={ArrowDropDown}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            fontSize: '1.2rem !important',
                            opacity: sortConfig.key === 'qr_number' ? 1 : 0
                          }
                        }}
                      >
                        QUOTATION NUMBER
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 2, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'prs'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('prs')}
                        IconComponent={ArrowDropDown}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            fontSize: '1.2rem !important',
                            opacity: sortConfig.key === 'prs' ? 1 : 0
                          }
                        }}
                      >
                        PURCHASE REQUESTS
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 2, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'vendors'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('vendors')}
                        IconComponent={ArrowDropDown}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            fontSize: '1.2rem !important',
                            opacity: sortConfig.key === 'vendors' ? 1 : 0
                          }
                        }}
                      >
                        VENDORS
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 2, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'status'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('status')}
                        IconComponent={ArrowDropDown}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            fontSize: '1.2rem !important',
                            opacity: sortConfig.key === 'status' ? 1 : 0
                          }
                        }}
                      >
                        STATUS
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 2, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'date'}
                        direction={sortConfig.direction}
                        onClick={() => handleSort('date')}
                        IconComponent={ArrowDropDown}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            fontSize: '1.2rem !important',
                            opacity: sortConfig.key === 'date' ? 1 : 0
                          }
                        }}
                      >
                        QUOTATION DATE
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1, px: 2, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 4 }} /></TableCell></TableRow>
                  ) : sortedQRs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <Typography color="text.secondary">No quotations found in this stage.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedQRs.map(qr => (
                      <TableRow
                        key={qr.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => { setViewingQR(qr); setViewQRDialogOpen(true); }}
                      >
                        <TableCell sx={{ py: 1, px: 2, fontSize: '0.75rem', fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>{qr.qr_number}</TableCell>
                        <TableCell sx={{ py: 1, px: 2 }}>
                          {qr.linked_prs?.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: '180px' }}>
                              {qr.linked_prs.map(p => (
                                <Typography key={p.id} variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 500, color: 'text.primary' }}>
                                  {p.pr_number}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">Direct</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 2 }}>
                          <Typography variant="caption" fontWeight="500">{qr.invited_vendors?.length || 0} {qr.invited_vendors?.length === 1 ? 'Vendor' : 'Vendors'}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 2 }}>
                          <Chip
                            label={qr.status === 'Sent to Vendors' ? 'Request to Vendors' : (qr.status === 'Invited' ? 'Requested' : qr.status)}
                            color={getStatusColor(qr.status)}
                            size="small"
                            sx={{ height: 18, fontWeight: 500, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 2, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(qr.created_at)}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                            <Tooltip title="Request to Vendors">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => openSendToVendorsDialog(qr)}
                                  disabled={qr.status !== 'Draft' || !hasAction('quotations', 'can_send_to_vendors')}
                                  sx={{ color: qr.status === 'Draft' ? '#8b5cf6' : 'text.disabled' }}
                                >
                                  <BlastIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Receive Tracking">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAutoProcess(qr)}
                                  disabled={qr.status !== 'Requested' || !hasAction('quotations', 'can_receive')}
                                  sx={{ color: qr.status === 'Requested' ? 'info.main' : 'text.disabled' }}
                                >
                                  <InventoryIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Enter Quotes">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAutoProcess(qr)}
                                  disabled={qr.status !== 'Received' || !hasAction('quotations', 'can_enter_quotes')}
                                  sx={{ color: qr.status === 'Received' ? 'secondary.main' : 'text.disabled' }}
                                >
                                  <ProcessIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="View Comparison">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAutoProcess(qr, 'comparison')}
                                  disabled={qr.status !== 'Entered' || !hasAction('quotations', 'can_compare')}
                                  sx={{ color: qr.status === 'Entered' ? 'info.main' : 'text.disabled' }}
                                >
                                  <CompareIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Manage Approval">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAutoProcess(qr, 'approval')}
                                  disabled={qr.status !== 'Compared' || !hasAction('quotations', 'can_approve')}
                                  sx={{ color: qr.status === 'Compared' ? 'warning.main' : 'text.disabled' }}
                                >
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="Convert to PO">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAutoProcess(qr, 'approval')}
                                  disabled={qr.status !== 'Approved' || !hasAction('quotations', 'can_convert_to_po')}
                                  sx={{ color: qr.status === 'Approved' ? 'primary.main' : 'text.disabled' }}
                                >
                                  <OrderIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title="View Details">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAutoProcess(qr, 'comparison')}
                                  disabled={qr.status !== 'Ordered'}
                                  sx={{ color: qr.status === 'Ordered' ? 'success.main' : 'text.disabled' }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
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

            {/* Materials Summary — Consolidated list of all items */}
            <Box mb={4}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Materials Summary</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                      <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Material Code</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Material Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>UOM</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQR.items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.material_code}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{item.material_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{item.uom_name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {item.sources && item.sources.length > 0 ? (() => {
                              // Force Filter: If any PR source exists, ignore Manual entirely
                              const hasPR = item.sources.some(s => s.source === 'PR' && s.source_pr_number);
                              const displaySources = item.sources.filter(s => {
                                if (s.source === 'Manual' && hasPR) return false;
                                return (s.source === 'PR' && s.source_pr_number) || s.source === 'Manual';
                              });

                              return Array.from(new Set(displaySources.map(s =>
                                s.source === 'PR' ? `PR:${s.source_pr_number}` : 'Manual'
                              ))).map((srcKey, sIdx) => {
                                const isPR = srcKey.startsWith('PR:');
                                const label = isPR ? srcKey.replace('PR:', '') : 'Manual';
                                return (
                                  <Chip
                                    key={sIdx}
                                    size="small"
                                    label={label}
                                    color={isPR ? "primary" : "default"}
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                );
                              });
                            })() : (
                              <Chip
                                size="small"
                                label={item.source === 'PR' && item.source_pr_number ? item.source_pr_number : "Manual"}
                                color={item.source === 'PR' ? "primary" : "default"}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* 1. Vendor Management & Quotations */}
            {['Requested', 'Received', 'Entered', 'Compared', 'Approved', 'Ordered'].includes(selectedQR.status) && (
              <Box mb={4}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>1. Vendor Management & Quotations</Typography>
                  {/* Action buttons based on status */}
                  {selectedQR.status === 'Requested' && (
                    <Typography variant="body2" color="text.secondary">Waiting for quotations...</Typography>
                  )}
                  {selectedQR.status === 'Received' && (() => {
                    const hasAtLeastOneQuote = selectedQR.invited_vendors.some(v => vendorQuotes.some(q => q.vendor_id === v.vendor_id));
                    const allQuotesEntered = selectedQR.invited_vendors.every(v => {
                      if (v.receipt_status === 'Not Required') return true;
                      return vendorQuotes.some(q => q.vendor_id === v.vendor_id);
                    });
                    const canLock = hasAtLeastOneQuote && allQuotesEntered;

                    return (
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={!canLock}
                        onClick={async () => {
                          try {
                             await api.post(`/api/quotations/requests/${selectedQR.id}/entered`);
                             showMessage('Entries locked and quotation compared successfully!', 'Success', 'success');
                             fetchData();
                          } catch (error) {
                             showMessage(error.response?.data?.detail || 'Failed to lock entries', 'Error', 'error');
                          }
                        }}
                      >
                        Proceed to Comparison
                      </Button>
                    );
                  })()}
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Vendor Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Invitation</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Receipt Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Quote Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedQR.invited_vendors.map(v => {
                        const submittedQuote = vendorQuotes.find(q => q.vendor_id === v.vendor_id);
                        const isNotRequired = v.receipt_status === 'Not Required';
                        const isPending = !v.receipt_status || v.receipt_status === 'Pending';
                        
                        return (
                          <TableRow key={v.vendor_id} sx={{ opacity: isNotRequired ? 0.6 : 1 }}>
                            <TableCell>{v.vendor_name}</TableCell>
                            <TableCell><Chip size="small" label={v.is_sent ? "Sent" : "Pending"} color={v.is_sent ? "info" : "default"} /></TableCell>
                            <TableCell>
                              {['Entered', 'Compared', 'Approved', 'Ordered'].includes(selectedQR.status) || submittedQuote || v.receipt_status === 'Received' ? (
                                <Chip size="small" label={v.receipt_status || 'Pending'} color={isNotRequired ? 'default' : (isPending ? 'warning' : 'success')} />
                              ) : (
                                <FormControl size="small" variant="standard">
                                  <Select
                                    value={v.receipt_status || 'Pending'}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      await handleUpdateVendorReceipt(selectedQR.id, v.vendor_id, newStatus, true);
                                      
                                      // Auto transition from Requested to Received if the first vendor is marked Received/Not Required
                                      if (selectedQR.status === 'Requested' && (newStatus === 'Received' || newStatus === 'Not Required')) {
                                        try {
                                          await api.post(`/api/quotations/requests/${selectedQR.id}/receive`);
                                          fetchData(); // Refresh the whole QR
                                        } catch (err) {
                                          console.error('Failed to auto-transition to receive', err);
                                        }
                                      }
                                    }}
                                    disableUnderline
                                    sx={{
                                      fontSize: '0.8rem',
                                      color: isNotRequired ? 'text.secondary' : (isPending ? '#d97706' : '#16a34a'),
                                      fontWeight: 500
                                    }}
                                  >
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Received">Received</MenuItem>
                                    <MenuItem value="Not Required">Not Required</MenuItem>
                                  </Select>
                                </FormControl>
                              )}
                            </TableCell>
                            <TableCell>
                              {submittedQuote ? (
                                <Chip size="small" label={submittedQuote.status === 'Draft' ? "Draft" : "Entered"} color={submittedQuote.status === 'Draft' ? "warning" : "success"} />
                              ) : (
                                <Chip size="small" label={isNotRequired ? "Skipped" : "Pending"} color="default" />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {!isNotRequired && !['Compared', 'Approved', 'Ordered'].includes(selectedQR.status) && (
                                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={async () => {
                                  // Auto set receipt to Received if they click Enter Quote
                                  if (v.receipt_status !== 'Received') {
                                     await handleUpdateVendorReceipt(selectedQR.id, v.vendor_id, 'Received', true);
                                     if (selectedQR.status === 'Requested') {
                                        try {
                                          await api.post(`/api/quotations/requests/${selectedQR.id}/receive`);
                                          fetchData();
                                        } catch (err) {}
                                     }
                                  }
                                  setSelectedVendorForQuote(v);
                                  if (submittedQuote) {
                                    setNewQuote({
                                      quotation_number: submittedQuote.quotation_number || '',
                                      quotation_date: submittedQuote.quotation_date || '',
                                      remarks: submittedQuote.remarks || '',
                                      file: null,
                                      existing_file: submittedQuote.attachment_path || null,
                                      items: submittedQuote.items.map(i => ({
                                        qr_item_id: i.qr_item_id, material_id: i.material_id, material_name: i.material_name,
                                        material_code: i.material_code,
                                        uom_name: i.uom_name, quoted_rate: i.quoted_rate || '',
                                        delivery_days: i.delivery_days || '', remarks: i.remarks || '',
                                        brand: i.brand || '',
                                        vendor_uom_name: i.vendor_uom_name || i.uom_name || '',
                                        uom_conversion_factor: i.uom_conversion_factor || 1.0,
                                        discount_percent: i.discount_percent || 0,
                                        is_excluded: i.is_excluded || false
                                      }))
                                    });
                                  } else {
                                    setNewQuote({
                                      quotation_number: '',
                                      quotation_date: '',
                                      remarks: '', file: null, existing_file: null,
                                      items: selectedQR.items.map(i => ({
                                        qr_item_id: i.id, material_id: i.material_id, material_name: i.material_name,
                                        material_code: i.material_code,
                                        uom_name: i.uom_name, quoted_rate: '', delivery_days: '', remarks: '',
                                        brand: '', vendor_uom_name: i.uom_name || '', uom_conversion_factor: 1.0, discount_percent: 0,
                                        is_excluded: false
                                      }))
                                    });
                                  }
                                  setEnterQuoteDialogOpen(true);
                                }}>{submittedQuote ? "Edit Quote" : "Enter Quote"}</Button>
                              )}
                              {submittedQuote && (
                                <Button size="small" sx={{ ml: 1 }} startIcon={<VisibilityIcon />} onClick={() => {
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

            {/* Phase 4: Material-Wise Comparison (Visible when Entered or Compared) */}
            {['Received', 'Entered', 'Compared', 'Approved', 'Ordered'].includes(selectedQR.status) && comparisonData && (
              <Box mb={4} id="comparison-section">
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>2. Technical Comparison (Item-Wise)</Typography>
                {comparisonData.materials.map(mat => (
                  <Accordion key={mat.qr_item_id} variant="outlined" sx={{ mb: 1 }} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography fontWeight="bold">[{mat.material_code}] {mat.material_name}</Typography>
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
                                <TableCell>₹{Number(q.quoted_rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell>{q.delivery_days || '-'} days</TableCell>
                                <TableCell><Chip size="small" label={isSelected ? `${q.rank_label} Selected` : q.rank_label} color={isSelected ? "success" : "default"} /></TableCell>
                                <TableCell align="right">
                                  {!isSelected && !['Approved', 'Ordered'].includes(selectedQR.status) && (
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

                {selectedQR.status === 'Entered' && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={async () => {
                        try {
                          await api.post(`/api/quotations/requests/${selectedQR.id}/finalize`);
                          showMessage('Comparison finalized successfully!', 'Success', 'success');
                          fetchData();
                        } catch (error) {
                          showMessage(error.response?.data?.detail || 'Failed to finalize comparison', 'Error', 'error');
                        }
                      }}
                    >
                      Finalize Comparison
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Phase 5: Final Comparative Statement (Visible when Received or beyond) */}
            {['Received', 'Entered', 'Compared', 'Approved', 'Ordered'].includes(selectedQR.status) && comparisonData && (
              <Box id="approval-section">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>3. Comparative Statement & Approval</Typography>
                  <Box>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadExcel} sx={{ mr: 1, borderColor: '#107c41', color: '#107c41' }}>Excel Comparison</Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPDF} sx={{ mr: 1 }}>Download PDF</Button>
                    {selectedQR.status === 'Compared' && (
                      <Button variant="contained" color="primary" onClick={() => {
                        setManagementApproveComment('');
                        setManagementApproveDialogOpen(true);
                      }}>Management Approve</Button>
                    )}
                    {selectedQR.status === 'Approved' && (
                      <Button variant="contained" color="success" onClick={() => {
                        const itemsToConvert = comparisonData.materials
                          .filter(mat => mat.selected_vendor_id)
                          .map(mat => {
                            const quote = mat.vendor_quotes.find(q => q.vendor_id === mat.selected_vendor_id);
                            const material = materials.find(m => m.id === mat.material_id);
                            const gstRate = material?.gst_rate || 0;
                            const vendor = vendors.find(v => v.id === mat.selected_vendor_id);
                            const vendorState = vendor?.state || '';
                            const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
                              gstRate,
                              vendorState,
                              tenantConfig?.base_state,
                              tenantConfig?.cgst_share_percent,
                              tenantConfig?.sgst_share_percent
                            );

                            return {
                              qr_item_id: mat.qr_item_id,
                              material_name: mat.material_name,
                              material_code: mat.material_code,
                              quantity: mat.quantity,
                              uom_name: mat.uom_name,
                              vendor_name: mat.selected_vendor_name,
                              rate: quote ? quote.quoted_rate : 0,
                              discount_percent: 0,
                              cgst_percentage,
                              sgst_percentage,
                              igst_percentage
                            };
                          });
                        setConvertToPoDialog({ open: true, terms: '', items: itemsToConvert });
                      }}>Convert to POs</Button>
                    )}
                  </Box>
                </Box>

                <Paper sx={{ p: 4, backgroundColor: '#fcfcfc', border: '1px solid #e0e0e0' }}>
                  <Typography variant="h5" align="center" sx={{ fontWeight: 700, mb: 1, letterSpacing: 1 }}>COMPARATIVE STATEMENT</Typography>
                  <Typography variant="subtitle2" align="center" color="text.secondary" sx={{ mb: 4 }}>QR NO: {comparisonData.qr_number}</Typography>
                  <Divider sx={{ mb: 4 }} />

                  <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell sx={{ fontWeight: 700 }}>Material Details</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                          {comparisonData.vendor_totals.sort((a, b) => a.total_value - b.total_value).map(vt => (
                            <TableCell key={vt.vendor_id} align="right" sx={{ fontWeight: 700, minWidth: 140 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{vt.vendor_name}</Typography>
                                {selectedQR.status !== 'Ordered' && (
                                  <Button size="small" variant="text" sx={{ mt: 0.5, p: 0, fontSize: '0.7rem' }} onClick={() => handleOpenNegotiate(vt.vendor_id, vt.vendor_name)}>
                                    Negotiate
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comparisonData.materials.map((mat, mIdx) => (
                          <TableRow key={mat.material_id} hover>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{mat.material_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{mat.material_code}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {mat.quantity} {mat.uom_name}
                            </TableCell>
                            {comparisonData.vendor_totals.sort((a, b) => a.total_value - b.total_value).map(vt => {
                              const quote = mat.vendor_quotes.find(q => q.vendor_id === vt.vendor_id);
                              const isL1 = quote?.rank === 1;
                              const isSelected = mat.selected_vendor_id === vt.vendor_id;

                              return (
                                <TableCell
                                  key={vt.vendor_id}
                                  align="right"
                                  sx={{
                                    backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.05)' : 'inherit',
                                    fontWeight: isSelected ? 600 : 400
                                  }}
                                >
                                  {quote ? (
                                    <>
                                      <Typography variant="body2">
                                        ₹{Number(quote.quoted_rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </Typography>
                                      <Chip
                                        label={isSelected ? `${quote.rank_label} Selected` : quote.rank_label}
                                        size="small"
                                        color={isSelected ? "success" : "default"}
                                        sx={{ height: 16, fontSize: '0.6rem', mt: 0.5, px: 0.5 }}
                                      />
                                    </>
                                  ) : '-'}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {selectedQR.status === 'Ordered' && generatedPOs && generatedPOs.length > 0 && (
                    <Box mt={4} p={3} sx={{ backgroundColor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#166534', mb: 2 }}>
                        <OrderIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
                        Generated Purchase Orders
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {generatedPOs.map(po => (
                          <Chip
                            key={po.id}
                            label={`${po.po_number} (${po.status})`}
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 600, backgroundColor: 'white' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}
          </Box>
        )}

        {/* --- DIALOGS --- */}

        <Dialog
          open={createQRDialogOpen}
          onClose={(e, reason) => { 
            if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
              setCreateQRDialogOpen(false);
              setErrors({});
            }
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}
        >
          <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <SendIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Quotation Request</Typography>
                <Typography variant="body2" color="text.secondary">Initiate a new procurement cycle by linking PRs and inviting vendors.</Typography>
              </Box>
            </Box>
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
              {/* Row 1: Required Date */}
              <Box id="field-required_date">
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Required Date *
                </Typography>
                <DatePicker
                  sx={{ width: '100%' }}
                  value={newQR.required_date ? dayjs(newQR.required_date) : null}
                  onChange={(val) => setNewQR({ ...newQR, required_date: val ? val.format('YYYY-MM-DD') : '' })}
                  format="DD-MMM-YYYY"
                  disablePast
                  localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: "DD-MMM-YYYY",
                      error: !!errors.required_date,
                      helperText: errors.required_date
                    }
                  }}
                />
              </Box>

              {/* Row 2: Link PRs & Manual Materials */}
              <Box id="field-items">
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Link Approved PRs *
                </Typography>
                <Autocomplete
                  multiple
                  options={approvedPrs || []}
                  getOptionLabel={(option) => option.pr_number || ''}
                  value={(approvedPrs || []).filter(pr => (newQR.pr_ids || []).includes(pr.id))}
                  onChange={(e, newValue) => {
                    handlePRSelection({ target: { value: newValue.map(pr => pr.id) } });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search PRs..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start" sx={{ ml: 1 }}><LinkIcon color="action" /></InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox checked={selected} />
                      <ListItemText primary={`${option.pr_number}`} secondary={`${option.items?.length || 0} ${option.items?.length === 1 ? 'item' : 'items'}`} />
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        label={option.pr_number}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  }
                />
                {errors.items && <FormHelperText error>{errors.items}</FormHelperText>}
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Manual Material Selection *
                </Typography>
                <Autocomplete
                  multiple
                  options={materials || []}
                  getOptionLabel={(option) => `${option.code} - ${option.name}`}
                  value={(materials || []).filter(m => (newQR.manual_material_ids || []).includes(m.id))}
                  onChange={(e, newValue) => {
                    handleManualMaterialSelection({ target: { value: newValue.map(m => m.id) } });
                  }}
                  filterOptions={filterOptions}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search Materials..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start" sx={{ ml: 1 }}><InventoryIcon color="action" /></InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  disableCloseOnSelect
                  renderOption={(props, option, { selected }) => (
                    <li {...props}>
                      <Checkbox checked={selected} />
                      <ListItemText primary={option.name} secondary={option.code} />
                    </li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        label={option.name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))
                  }
                />
              </Box>

              {/* Row 3: Invite Vendors */}
              <Box id="field-vendor_ids" sx={{ gridColumn: 'span 2' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: (newQR.vendor_ids?.length || 0) === 1 ? 'error.main' : 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                  Invite Vendors * {(newQR.vendor_ids?.length || 0) === 1 && "(Minimum 2 Required)"}
                </Typography>
                <FormControl fullWidth error={(newQR.vendor_ids?.length || 0) === 1}>
                  <Autocomplete
                    multiple
                    options={vendors || []}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    value={(vendors || []).filter(v => (newQR.vendor_ids || []).includes(v.id))}
                    onChange={(e, newValue) => {
                      setNewQR(prev => ({ ...prev, vendor_ids: newValue.map(v => v.id) }));
                    }}
                    filterOptions={filterOptions}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search Vendors..."
                        error={!!errors.vendor_ids}
                        helperText={errors.vendor_ids}
                      />
                    )}
                    disableCloseOnSelect
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox checked={selected} />
                        <ListItemText primary={`${option.code} - ${option.name}`} />
                      </li>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          label={`${option.code} - ${option.name}`}
                          size="small"
                          sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}
                        />
                      ))
                    }
                  />
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
                          const pr = approvedPrs.find(p => p.id === it.pr_id);
                          return (
                            <TableRow key={idx}>
                              <TableCell sx={{ py: 0.5 }}>{m ? `${m.code} - ${m.name}` : 'Loading...'}</TableCell>
                              <TableCell align="right" sx={{ py: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={it.quantity}
                                    onChange={(e) => updateItemQuantity(idx, e.target.value)}
                                    sx={{ width: 100, '& .MuiInputBase-input': { py: 0.5, textAlign: 'right', fontWeight: 600 } }}
                                    inputProps={{ min: 1 }}
                                  />
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: '60px' }}>
                                    {m?.uom_name || ''}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ py: 0.5 }}>
                                <Chip
                                  size="small"
                                  label={it.pr_id ? (pr?.pr_number || 'PR') : 'Manual'}
                                  color={it.pr_id ? "primary" : "default"}
                                  variant="outlined"
                                />
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
                <TextField inputProps={{ maxLength: 255 }}
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
          <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setCreateQRDialogOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
            <Button
              onClick={handleCreateQR}
              variant="contained"
              size="large"
              disabled={(newQR.items?.length || 0) === 0 || (newQR.vendor_ids?.length || 0) < 2}
              sx={{ px: 4, borderRadius: 2, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}
            >
              Create Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enter Quote Dialog */}
        <Dialog open={enterQuoteDialogOpen} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setEnterQuoteDialogOpen(false); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
          <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <EditIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {selectedQR?.qr_number} : {vendorQuotes.some(q => q.vendor_id === selectedVendorForQuote?.vendor_id) ? 'Edit Quotation' : 'Enter Quotation'}
                </Typography>
                <Typography variant="body2" color="text.secondary">{selectedVendorForQuote?.vendor_name}</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack direction="row" spacing={3} mb={6} mt={2} alignItems="flex-start">
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>Vendor Quotation Number</Typography>
                <TextField
                  variant="outlined"
                  sx={{ width: 280 }}
                  placeholder="Enter Quotation Number"
                  value={newQuote.quotation_number}
                  onChange={(e) => setNewQuote({ ...newQuote, quotation_number: e.target.value })}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
                  Vendor Quotation Date <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                <DatePicker
                  value={newQuote.quotation_date ? dayjs(newQuote.quotation_date) : null}
                  onChange={(val) => setNewQuote({ ...newQuote, quotation_date: val ? val.format('YYYY-MM-DD') : '' })}
                  format="DD-MMM-YYYY"
                  localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                  disableFuture
                  slotProps={{
                    textField: {
                      sx: { width: 220 },
                      placeholder: "DD-MMM-YYYY"
                    }
                  }}
                />
              </Box>
              <Box sx={{ pt: 3.5 }}>
                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} color={newQuote.file || newQuote.existing_file ? 'success' : 'primary'} sx={{ height: 56, px: 3, whiteSpace: 'nowrap' }}>
                  Upload copy of quotation file <span style={{ color: '#d32f2f', marginLeft: 4 }}>*</span>
                  <input type="file" hidden accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,image/*" onChange={(e) => setNewQuote({ ...newQuote, file: e.target.files[0] })} />
                </Button>
                {newQuote.file ? (
                  <Box sx={{ mt: 1 }}><Typography variant="caption" sx={{ fontWeight: 500 }}>{newQuote.file.name}</Typography></Box>
                ) : newQuote.existing_file ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      Existing File: {newQuote.existing_file.split('/').pop()}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </Stack>
 
            <Divider sx={{ mb: 4 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Quotation Items</Typography>
              <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />} disabled={loading} onClick={handleAutoExtract}>
                {loading ? 'Extracting...' : 'Auto-Extract from File'}
              </Button>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Brand</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Vendor UOM</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Conv. Factor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Quoted Rate (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Delivery Days</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Exclude</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {newQuote.items.map((it, idx) => (
                  <TableRow key={idx} sx={{ opacity: it.is_excluded ? 0.5 : 1, bgcolor: it.confidence ? 'warning.light' : 'inherit' }}>
                    <TableCell>{it.material_code} - {it.material_name}</TableCell>
                    <TableCell>
                      <TextField size="small" disabled={it.is_excluded} value={it.brand || ''} onChange={(e) => {
                        const newItems = [...newQuote.items]; newItems[idx].brand = e.target.value; setNewQuote({ ...newQuote, items: newItems });
                      }} sx={{ width: 100 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" disabled={it.is_excluded} value={it.vendor_uom_name || ''} onChange={(e) => {
                        const newItems = [...newQuote.items]; newItems[idx].vendor_uom_name = e.target.value; setNewQuote({ ...newQuote, items: newItems });
                      }} sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="e.g. If Requested UOM is L but Vendor quotes per 500ml, Conversion factor is 0.5">
                        <TextField size="small" type="number" className="no-spin" disabled={it.is_excluded} value={it.uom_conversion_factor} onChange={(e) => {
                          const newItems = [...newQuote.items]; newItems[idx].uom_conversion_factor = parseFloat(e.target.value) || 1.0; setNewQuote({ ...newQuote, items: newItems });
                        }} sx={{ width: 80 }} />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        className="no-spin"
                        disabled={it.is_excluded}
                        onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                        value={it.quoted_rate}
                        onChange={(e) => {
                          const val = e.target.value.replace(/-/g, '');
                          if (val === '' || (/^\d*\.?\d{0,2}$/.test(val))) {
                            const newItems = [...newQuote.items];
                            newItems[idx].quoted_rate = val;
                            setNewQuote({ ...newQuote, items: newItems });
                          }
                        }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        disabled={it.is_excluded}
                        onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                        value={it.delivery_days}
                        onChange={(e) => {
                          const val = e.target.value.replace(/-/g, '');
                          if (val === '' || /^\d+$/.test(val)) {
                            const newItems = [...newQuote.items];
                            newItems[idx].delivery_days = val;
                            setNewQuote({ ...newQuote, items: newItems });
                          }
                        }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField inputProps={{ maxLength: 255 }}
                        size="small"
                        disabled={it.is_excluded}
                        value={it.remarks}
                        onChange={(e) => {
                          const newItems = [...newQuote.items];
                          newItems[idx].remarks = e.target.value;
                          setNewQuote({ ...newQuote, items: newItems });
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={selectedQR?.invited_vendors?.length <= 2 ? 'Exclude is only available when more than 2 vendors are invited' : ''}>
                        <span>
                          <Checkbox
                            size="small"
                            checked={it.is_excluded}
                            disabled={selectedQR?.invited_vendors?.length <= 2}
                            onChange={(e) => {
                              const newItems = [...newQuote.items];
                              newItems[idx].is_excluded = e.target.checked;
                              if (e.target.checked) {
                                newItems[idx].quoted_rate = '';
                                newItems[idx].delivery_days = '';
                              }
                              setNewQuote({ ...newQuote, items: newItems });
                            }}
                          />
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setEnterQuoteDialogOpen(false)}>Cancel</Button>
            {(!vendorQuotes.find(q => q.vendor_id === selectedVendorForQuote?.vendor_id) || vendorQuotes.find(q => q.vendor_id === selectedVendorForQuote?.vendor_id)?.status === 'Draft') && (
              <Button
                onClick={() => handleEnterQuote(true)}
                variant="outlined"
                color="primary"
                disabled={!newQuote.quotation_number && !newQuote.quotation_date && !(newQuote.file || newQuote.existing_file) && newQuote.items.every(i => !i.quoted_rate && !i.delivery_days)}
              >
                Save as Draft
              </Button>
            )}
            <Button
              onClick={() => handleEnterQuote(false)}
              variant="contained"
              disabled={
                !newQuote.quotation_number ||
                !newQuote.quotation_date ||
                !(newQuote.file || newQuote.existing_file) ||
                newQuote.items.some(i => !i.is_excluded && (!i.quoted_rate || !i.delivery_days)) ||
                newQuote.items.every(i => i.is_excluded)
              }
            >
              Save Quotation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Override Dialog */}
        <Dialog open={overrideDialogOpen} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setOverrideDialogOpen(false); }}>
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
        <Dialog open={viewQRDialogOpen} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setViewQRDialogOpen(false); setViewingQR(null); } }} maxWidth="md" fullWidth>
          <DialogTitle>Quotation Request Details - {viewingQR?.qr_number}</DialogTitle>
          <DialogContent>
            {viewingQR && (
              <Box>
                <Typography><strong>Status:</strong> {viewingQR.status === 'Sent to Vendors' ? 'Request to Vendors' : viewingQR.status}</Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1.5 }}>Materials Summary</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Material Code</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Material Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>UOM</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Source</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewingQR.items.map(it => (
                        <TableRow key={it.id}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.material_code}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{it.material_name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{it.quantity}</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{it.uom_name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {it.sources && it.sources.length > 0 ? (() => {
                                // Force Filter: If any PR source exists, ignore Manual entirely
                                const hasPR = it.sources.some(s => s.source === 'PR' && s.source_pr_number);
                                const displaySources = it.sources.filter(s => {
                                  if (s.source === 'Manual' && hasPR) return false;
                                  return (s.source === 'PR' && s.source_pr_number) || s.source === 'Manual';
                                });

                                return Array.from(new Set(displaySources.map(s =>
                                  s.source === 'PR' ? `PR:${s.source_pr_number}` : 'Manual'
                                ))).map((srcKey, sIdx) => {
                                  const isPR = srcKey.startsWith('PR:');
                                  const label = isPR ? srcKey.replace('PR:', '') : 'Manual';
                                  return (
                                    <Chip
                                      key={sIdx}
                                      size="small"
                                      label={label}
                                      color={isPR ? "primary" : "default"}
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', height: 18 }}
                                    />
                                  );
                                });
                              })() : (
                                <Chip
                                  size="small"
                                  label={it.source === 'PR' && it.source_pr_number ? it.source_pr_number : "Manual"}
                                  color={it.source === 'PR' ? "primary" : "default"}
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 18 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1.5 }}>Vendors Requested</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Vendor Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewingQR.invited_vendors && viewingQR.invited_vendors.length > 0 ? (
                        viewingQR.invited_vendors.map(v => (
                          <TableRow key={v.vendor_id}>
                            <TableCell sx={{ fontWeight: 500 }}>{v.vendor_name}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell align="center">No vendors invited yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setViewQRDialogOpen(false); setViewingQR(null); }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* View Submitted Vendor Quotation Dialog */}
        <Dialog open={viewVendorQuoteDialogOpen} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setViewVendorQuoteDialogOpen(false); }} maxWidth="md" fullWidth>
          <DialogTitle>{selectedQR?.qr_number} : View Quotation - {selectedSubmittedQuote?.vendor_name}</DialogTitle>
          <DialogContent>
            {selectedSubmittedQuote && (
              <Box>
                <Stack direction="row" spacing={5} mb={4} mt={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Vendor Quotation Number</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedSubmittedQuote?.quotation_number}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Vendor Quotation Date</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedSubmittedQuote?.quotation_date ? dayjs(selectedSubmittedQuote.quotation_date).format('DD-MMM-YYYY') : '-'}</Typography>
                  </Box>
                  {selectedSubmittedQuote.attachment_path && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Attachment</Typography>
                      <Box>
                        <Button size="small" startIcon={<DownloadIcon />} onClick={() => window.open(getFileUrl(selectedSubmittedQuote.attachment_path), '_blank')}>
                          View Quotation Copy
                        </Button>
                      </Box>
                    </Box>
                  )}
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
                        <TableRow key={idx} sx={{ opacity: it.is_excluded ? 0.6 : 1, bgcolor: it.is_excluded ? 'action.hover' : 'inherit' }}>
                          <TableCell>{it.material_code} - {it.material_name}</TableCell>
                          <TableCell align="right">
                            {it.is_excluded ? (
                              <Chip label="Excluded" size="small" variant="outlined" color="error" />
                            ) : (
                              `₹${it.quoted_rate}`
                            )}
                          </TableCell>
                          <TableCell align="center">{it.is_excluded ? '-' : `${it.delivery_days} days`}</TableCell>
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

        {/* Convert to PO Dialog */}
        <Dialog open={convertToPoDialog.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setConvertToPoDialog({ open: false, terms: '', items: [] }); }} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, color: '#1E293B', pb: 1 }}>Convert to Purchase Orders</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 3, color: '#64748B' }}>
              This will generate Purchase Orders for all approved vendor selections. Please verify the quoted rates and specify any applicable discounts and taxes.
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>Item Details</Typography>
            <Table size="small" sx={{ mb: 4 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc', '& th': { py: 0.75, px: 1 } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Assigned Vendor</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 100 }}>Rate (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>Disc %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>CGST %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>SGST %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>IGST %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {convertToPoDialog.items?.map((it, i) => (
                  <TableRow key={i} sx={{ '& td': { py: 0.5, px: 1 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>{it.material_code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={it.vendor_name} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{it.quantity} {it.uom_name}</TableCell>
                    <TableCell align="right">
                      <TextField size="small" type="number" className="no-spin" value={it.rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertToPoItem(i, 'rate', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0 }} required sx={{ width: 110 }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" type="number" className="no-spin" value={it.discount_percent} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertToPoItem(i, 'discount_percent', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0 }} sx={{ width: 70 }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" variant="standard" type="number" className="no-spin" value={it.cgst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertToPoItem(i, 'cgst_percentage', e.target.value.replace(/-/g, ''))} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 70, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" variant="standard" type="number" className="no-spin" value={it.sgst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertToPoItem(i, 'sgst_percentage', e.target.value.replace(/-/g, ''))} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 70, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" variant="standard" type="number" className="no-spin" value={it.igst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertToPoItem(i, 'igst_percentage', e.target.value.replace(/-/g, ''))} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 70, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', mb: 0.5, display: 'block', textTransform: 'uppercase' }}>
              Terms and Conditions
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>Select Template</InputLabel>
              <Select
                label="Select Template"
                onChange={e => {
                  const t = termsTemplates.find(x => x.id === e.target.value);
                  if (t) setConvertToPoDialog({ ...convertToPoDialog, terms: t.content });
                }}
                defaultValue=""
                sx={{ bgcolor: '#fff' }}
              >
                <MenuItem value=""><em>Select a Template</em></MenuItem>
                {termsTemplates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={4}
              placeholder="Enter general terms and conditions to be included in all generated POs..."
              value={convertToPoDialog.terms}
              onChange={e => setConvertToPoDialog({ ...convertToPoDialog, terms: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConvertToPoDialog({ open: false, terms: '' })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
            <Button variant="contained" color="success" disabled={!convertToPoDialog.terms?.trim()} onClick={handleConvertToPO} sx={{ fontWeight: 600 }}>Create POs</Button>
          </DialogActions>
        </Dialog>

        {/* Send to Vendors Confirmation Dialog */}
        <Dialog
          open={sendToVendorsDialog.open}
          onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setSendToVendorsDialog({ open: false, qrId: null, qrNumber: '', vendorNames: [], message: '', isSending: false }); }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}
        >
          <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EDE9FE', borderRadius: 2, color: '#7C3AED', display: 'flex' }}>
                <SendIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Send Request to Vendors</Typography>
                <Typography variant="body2" color="text.secondary">{sendToVendorsDialog.qrNumber}</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 4, py: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', textTransform: 'uppercase' }}>
              Recipients ({sendToVendorsDialog.vendorNames.length} Vendors)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
              {sendToVendorsDialog.vendorNames.map((name, i) => (
                <Chip key={i} label={name} size="small" sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText', fontSize: '0.75rem' }} />
              ))}
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', textTransform: 'uppercase' }}>
              Email Message to Vendors <span style={{ color: '#d32f2f' }}>*</span>
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={sendToVendorsDialog.message}
              onChange={(e) => setSendToVendorsDialog({ ...sendToVendorsDialog, message: e.target.value })}
              placeholder="Enter the message to be sent to the vendors..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
            <Button disabled={sendToVendorsDialog.isSending} onClick={() => setSendToVendorsDialog({ open: false, qrId: null, qrNumber: '', vendorNames: [], message: '', isSending: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
            <Button
              onClick={handleSendToVendors}
              variant="contained"
              size="large"
              disabled={!sendToVendorsDialog.message?.trim() || sendToVendorsDialog.isSending}
              startIcon={sendToVendorsDialog.isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{ px: 4, borderRadius: 2, fontWeight: 700, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none' }}
            >
              {sendToVendorsDialog.isSending ? 'Sending...' : 'Send to Vendors'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
      <Dialog open={managementApproveDialogOpen} onClose={() => setManagementApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Management Approval Confirmation</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
            You are about to approve this Technical Comparison. Once approved, it can be converted to a Purchase Order. Please provide any approval remarks below.
          </Typography>
          <TextField inputProps={{ maxLength: 255 }}
            autoFocus
            margin="dense"
            label="Approval Remarks / Comments"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={managementApproveComment}
            onChange={(e) => setManagementApproveComment(e.target.value)}
            placeholder="Optional comments for approval..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setManagementApproveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success" disableElevation>
            Confirm Approval
          </Button>
        </DialogActions>
      </Dialog>

      {/* Negotiation Dialog */}
      <Dialog open={negotiateDialog.open} onClose={() => setNegotiateDialog(prev => ({ ...prev, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>Negotiate - {negotiateDialog.vendorName}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Apply Common Discount (%)</Typography>
            <TextField
              size="small"
              fullWidth
              type="number"
              className="no-spin"
              value={negotiateDialog.discountPercent}
              onChange={(e) => setNegotiateDialog(prev => ({ ...prev, discountPercent: e.target.value }))}
              placeholder="e.g. 5"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              size="small"
              sx={{ mt: 2 }}
              multiline
              rows={2}
              label="Remarks / Negotiation Notes"
              value={negotiateDialog.remarks}
              onChange={(e) => setNegotiateDialog(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Negotiation History</Typography>
          {negotiateDialog.history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No previous negotiation history.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Discount %</TableCell>
                  <TableCell>Remarks</TableCell>
                  <TableCell>By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {negotiateDialog.history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{dayjs(h.created_at).format('DD MMM YYYY HH:mm')}</TableCell>
                    <TableCell>{h.discount_percent}%</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{h.remarks}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{h.created_by_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setNegotiateDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleNegotiateSubmit} disabled={!negotiateDialog.discountPercent}>
            Apply Discount
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Quotations;
