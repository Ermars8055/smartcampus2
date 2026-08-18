import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  InputLabel, IconButton, Tooltip, Divider, InputAdornment, Paper, TableSortLabel, useTheme, useMediaQuery,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, Link,
  Accordion, AccordionSummary, AccordionDetails, Tab, Tabs, Autocomplete, FormControlLabel, Checkbox, TablePagination
} from '@mui/material';
import { Add, Delete, CheckCircle, Archive, Send, Cancel, Search, ShoppingCart, Store, Assignment, CalendarMonth, ArrowDropDown, Inventory, History, ExpandMore, Textsms, AttachFile, Email, Visibility, ArrowBack, Block, Science } from '@mui/icons-material';
import api from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { computeGstSplit } from '../utils/gstCalculations';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function WorkOrders() {
  const { showMessage } = useMessage();
  const { hasAction, hasPermission } = useAuth();
  const { tenantConfig } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [wos, setWos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [detailPage, setDetailPage] = useState(0);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(10);
  const [linkedIndent, setLinkedIndent] = useState(null);
  const [linkedPR, setLinkedPR] = useState(null);
  const [linkedQR, setLinkedQR] = useState(null);
  const [detailHistoryOpen, setDetailHistoryOpen] = useState(false);
  const [detailHistoryData, setDetailHistoryData] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, wo: null, items: {} });
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [historyDialog, setHistoryDialog] = useState({ open: false, materialId: null, data: null, loading: false });
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [vendorRates, setVendorRates] = useState({});
  const [vendorContracts, setVendorContracts] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload?folder=wos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, rental_agreement_document: res.data.url }));
    } catch (err) {
      showMessage('Upload failed: ' + (err.response?.data?.detail || err.message), 'Error', 'error');
    }
    setUploading(false);
  };


  const handleRateBlur = (i, rate, baseRate) => {
    const r = parseFloat(rate);
    const br = parseFloat(baseRate);
    if (!isNaN(r) && !isNaN(br) && br > 0) {
      const deviation = Math.abs(r - br) / br;
      if (deviation >= 0.5) {
        showMessage("The entered rate has a deviation of 50% or more from the base rate.", "Rate Deviation Warning", "warning");
      }
    }
  };

  const fetchApprovalHistory = async (poId, materialId) => {
    setHistoryDialog({ open: true, materialId, data: null, loading: true });
    try {
      const res = await api.get(`/api/procurement/work-orders/${poId}/approval-history`);
      setHistoryDialog({ open: true, materialId, data: res.data, loading: false });
    } catch (err) {
      showMessage('Failed to load approval history', 'Error', 'error');
      setHistoryDialog({ open: false, materialId: null, data: null, loading: false });
    }
  };

  const submitApproval = async () => {
    const { wo, items } = approvalDialog;
    if (!wo) return;

    const payloadItems = wo.items.map(it => {
      const itemData = items[it.id] || {};
      return {
        wo_item_id: it.id,
        approved_quantity: parseFloat(itemData.qty !== undefined ? itemData.qty : it.quantity),
        remarks: itemData.rem || null
      };
    });

    if (payloadItems.some(it => isNaN(it.approved_quantity) || it.approved_quantity < 0)) {
      showMessage("Please enter a valid approved quantity for all items.", "Validation Error", "warning");
      return;
    }
    if (payloadItems.length === 1 && payloadItems[0].approved_quantity === 0) {
      showMessage("Approved quantity must be greater than 0 for a single-item document. Please use the Reject button.", "Validation Error", "warning");
      return;
    }
    if (payloadItems.length > 1 && payloadItems.every(it => it.approved_quantity === 0)) {
      showMessage("You cannot approve 0 quantity for all items. Please use the Reject button.", "Validation Error", "warning");
      return;
    }


    try {
      await api.post(`/api/procurement/work-orders/${wo.id}/approve`, {
        items: payloadItems,
        remarks: approvalRemarks || null
      });
      setApprovalDialog({ open: false, wo: null, items: {} });
      setApprovalRemarks('');
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error approving WO', 'Approval Failed', 'error');
    }
  };

  const handleApproveClick = () => {
    const { wo, items } = approvalDialog;
    if (!wo) return;

    let hasLargerQuantity = false;
    const largerItems = [];

    for (const it of wo.items) {
      const val = items[it.id]?.qty;
      const qty = parseFloat(val !== undefined ? val : it.quantity);
      if (qty > it.quantity) {
        hasLargerQuantity = true;
        largerItems.push({ name: it.material_name, requested: it.quantity, approved: qty, uom: it.uom_name, rem: items[it.id]?.rem || '' });
      }
    }

    if (hasLargerQuantity) {
      const msgJsx = (
        <>
          <span>You have entered an approved quantity larger than the requested quantity for the following items:</span>
          {largerItems.map((li, idx) => (
            <div key={idx} style={{ margin: '12px 0', paddingLeft: 8 }}>
              <strong>• {li.name}:</strong><br />
              &nbsp;&nbsp;&nbsp;Requested: {li.requested} {li.uom}<br />
              &nbsp;&nbsp;&nbsp;Approved: {li.approved} {li.uom}<br />
              &nbsp;&nbsp;&nbsp;<span style={{ color: '#dc2626', fontWeight: 600 }}>Remarks: {li.rem}</span>
            </div>
          ))}
          <span>Do you want to proceed?</span>
        </>
      );
      showConfirm(
        'Confirm Higher Quantity',
        msgJsx,
        'Proceed',
        'warning',
        submitApproval
      );
    } else {
      submitApproval();
    }
  };


  const fetchDetailHistory = async (id, type) => {
    try {
      const endpoint = type === 'indent' ? `/api/indents/${id}/approval-history` :
        type === 'wo' ? `/api/procurement/work-orders/${id}/approval-history` :
          `/api/procurement/pr/${id}/approval-history`;
      const res = await api.get(endpoint);
      setDetailHistoryData(res.data);
      setDetailHistoryOpen(true);
    } catch (err) {
      console.error(err);
      showMessage(`Failed to load history`, 'Error', 'error');
    }
  };

  const fetchAndShowIndent = async (id) => {
    try {
      setDetailHistoryOpen(false);
      setDetailHistoryData(null);
      const res = await api.get(`/api/indents/${id}`);
      setLinkedIndent(res.data);
    } catch (err) {
      showMessage('Failed to load Indent details', 'Error', 'error');
    }
  };

  const fetchAndShowPR = async (id) => {
    try {
      setDetailHistoryOpen(false);
      setDetailHistoryData(null);
      const res = await api.get(`/api/procurement/pr/${id}`);
      setLinkedPR(res.data);
    } catch (err) {
      showMessage('Failed to load PR details', 'Error', 'error');
    }
  };

  const fetchAndShowQR = async (id) => {
    try {
      const res = await api.get(`/api/quotations/requests/${id}`);
      setLinkedQR(res.data);
    } catch (err) {
      showMessage('Failed to load Quotation details', 'Error', 'error');
    }
  };

  const [search, setSearch] = useState('');
  const [filterVendor, setFilterVendor] = useState(null);
  const [filterProcurementType, setFilterProcurementType] = useState('');
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(searchParams.get('tab') || 'Draft');
  const [editingWOId, setEditingWOId] = useState(null);
  const [form, setForm] = useState({
    wo_number: '', vendor_id: '', contract_id: '', equipment_id: '', project_id: '', institution_id: '', target_completion_date: null, terms: '', annexure: '', advance_percentage: 0,
    wo_type: 'AMC', remarks: ''
  });

  useEffect(() => {
    if (form.vendor_id) {
      api.get(`/api/contracts/vendor/${form.vendor_id}/active-details`)
        .then(res => setVendorContracts(res.data))
        .catch(err => {
          console.error("Error fetching vendor active contract details", err);
          setVendorContracts([]);
        });
    } else {
      setVendorContracts([]);
    }
  }, [form.vendor_id, materials]);

  const availableEquipment = useMemo(() => {
    if (!form.vendor_id || !form.wo_type || vendorContracts.length === 0) return [];
    const matchingContracts = vendorContracts.filter(c => c.contract_type === form.wo_type);
    const eqs = [];
    matchingContracts.forEach(c => {
      if(c.items) {
        c.items.forEach(item => {
          if (item.equipment_id) {
            eqs.push({
              contract_id: c.id,
              contract_number: c.contract_number,
              contract_item_id: item.id,
              equipment_id: item.equipment_id,
              equipment_serial: item.equipment_serial,
              material_name: item.material_name,
              rate: item.rate,
              payment_terms: c.payment_terms,
              sla_details: c.sla_details,
              exclusions: c.exclusions
            });
          }
        });
      }
    });
    return eqs;
  }, [form.vendor_id, form.wo_type, vendorContracts]);



  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => Object.keys(prev).length > 0 ? {} : prev);
    setItemErrors(prev => Object.keys(prev || {}).length > 0 ? {} : prev);
  }, [form]);

  useEffect(() => {
    setErrors(prev => Object.keys(prev).length > 0 ? {} : prev);
    setItemErrors(prev => Object.keys(prev || {}).length > 0 ? {} : prev);
  }, [form]);

  useEffect(() => {
    setErrors(prev => Object.keys(prev).length > 0 ? {} : prev);
    setItemErrors(prev => Object.keys(prev || {}).length > 0 ? {} : prev);
  }, [form]);

  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredWOsBase = useMemo(() => {
    let list = wos;
    const projId = searchParams.get('proj');
    if (projId) {
      list = list.filter(wo => wo.project_id === parseInt(projId, 10));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(wo =>
        (wo.wo_number && wo.wo_number.toLowerCase().includes(s)) ||
        (wo.indent_number && wo.indent_number.toLowerCase().includes(s)) ||
        (wo.pr_number && wo.pr_number.toLowerCase().includes(s)) ||
        (wo.qr_number && wo.qr_number.toLowerCase().includes(s))
      );
    }
    if (filterVendor) {
      list = list.filter(wo => wo.vendor_id === filterVendor.id);
    }
    if (filterProcurementType) {
      list = list.filter(wo => wo.procurement_type === filterProcurementType);
    }
    return list;
  }, [wos, search, filterVendor, filterProcurementType, searchParams]);

  const calculateWOTotalNet = (wo) => {
    if (!wo) return 0;
    if (!wo.items || wo.items.length === 0) {
      return Math.round(wo.total_amount || 0);
    }
    let totalNetAmountSum = 0;
    wo.items.forEach(item => {
      const effQty = item.approved_quantity !== null && item.approved_quantity !== undefined ? item.approved_quantity : item.quantity;
      const qty = parseFloat(effQty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const discAmt = amount * ((item.discount_percent || 0) / 100);
      const netAmtAfterDisc = amount - discAmt;

      let taxable = netAmtAfterDisc;
      const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
      if (item.is_gst_inclusive && totalGst > 0) {
        taxable = netAmtAfterDisc / (1 + (totalGst / 100));
      }

      const cgstVal = taxable * ((item.cgst_percentage || 0) / 100);
      const sgstVal = taxable * ((item.sgst_percentage || 0) / 100);
      const igstVal = taxable * ((item.igst_percentage || 0) / 100);

      if (item.is_gst_inclusive) {
        totalNetAmountSum += netAmtAfterDisc;
      } else {
        totalNetAmountSum += (netAmtAfterDisc + cgstVal + sgstVal + igstVal);
      }
    });
    return Math.round(totalNetAmountSum);
  };

  const sortedWOs = useMemo(() => {
    let list = filteredWOsBase.filter(wo => {
      if (tabValue === 'All') return true;
      if (tabValue === 'Pending') return ['Draft', 'Submitted', 'Approved', 'Sent to Vendor'].includes(wo.status);
      return wo.status === tabValue;
    });

    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'vendor') aVal = a.vendor_name;
        if (sortConfig.key === 'vendor') bVal = b.vendor_name;
        if (sortConfig.key === 'total_amount') {
          aVal = calculateWOTotalNet(a);
          bVal = calculateWOTotalNet(b);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredWOsBase, sortConfig, tabValue]);



  const formatCurrency = (amount) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false, wo: null });
  const [reason, setReason] = useState('');

  // Email preview dialog state
  const [emailPreview, setEmailPreview] = useState({ open: false, loading: false, data: null, wo: null, cc: '', bcc: '', sending: false });

  const handleRowClick = (wo) => {
    if (wo.status === 'Draft') {
      setForm({
        wo_number: wo.wo_number || '',
        vendor_id: wo.vendor_id || '',
        project_id: wo.project_id || (projects.length > 0 ? projects[0].id : ''),
        institution_id: wo.institution_id || '',
        contract_id: wo.contract_id || '',
        equipment_id: wo.equipment_id || '',
        wo_type: wo.wo_type || 'AMC',
        target_completion_date: wo.target_completion_date ? dayjs(wo.target_completion_date) : null,
        terms: wo.terms || '',
        annexure: wo.annexure || '',
        advance_percentage: wo.advance_percentage || 0,
        remarks: wo.remarks || ''
      });
      setEditingWOId(wo.id);
      setDialog(true);
    } else {
      setDetailPage(0);
      setDetailDialog(wo);
    }
  };

  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false, wo = null) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason, wo });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); setReason(''); };
  const handleCancelConfirm = (e, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setConfirm({ ...confirm, open: false }); setReason(''); };

  const load = () => { api.get('/api/procurement/work-orders').then(r => setWos(r.data)); };
  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/institutions').then(r => setInstitutions(r.data));
    api.get('/api/terms').then(r => setTermsTemplates(r.data));
    api.get('/api/equipment').then(r => setEquipments(r.data || []));
  }, []);

  useEffect(() => {
    if (location.state?.indentData && projects.length > 0) {
      const ind = location.state.indentData;
      setForm({
        vendor_id: '',
        project_id: projects[0]?.id || '',
        institution_id: '',
        delivery_date: null,
        terms: '', annexure: '',
        purchase_mode: '',
        marketplace_name: '',
        advance_percentage: 0,
        procurement_type: '', rental_type: '', rental_agreement_number: '', rental_start_date: null, rental_end_date: null, billing_frequency: '', security_dewosit: 0, cost_per_test: '', linked_reagent_agreement: '', vendor_maintenance_responsibility: false, return_conditions: '', renewal_terms: '',
        indent_id: ind.id,
        items: ind.items.filter(it => it.requested_quantity > it.issued_quantity).map(it => {
          const mat = materials.find(m => m.id === it.material_id);
          return {
            material_id: it.material_id,
            quantity: it.requested_quantity - it.issued_quantity,
            rate: '',
            discount_percent: '',
            cgst_percentage: 0,
            sgst_percentage: 0,
            igst_percentage: 0,
            is_gst_inclusive: false,
            uom_name: mat ? mat.uom_name : '',
            uom_allow_decimal: mat ? mat.uom_allow_decimal : false,
            base_rate: 0
          };
        })
      });
      setItemErrors({});
      setDialog(true);
      // Clean up state so refresh doesn't trigger it again
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, projects, location.pathname, navigate]);

  useEffect(() => {
    if (location.state?.reagentRentalData && projects.length > 0) {
      const data = location.state.reagentRentalData;
      setForm({
        wo_number: '',
        vendor_id: data.vendor_id || '',
        project_id: data.project_id || projects[0]?.id || '',
        institution_id: data.institution_id || '',
        contract_id: '',
        equipment_id: '',
        target_completion_date: null,
        terms: '', annexure: '',
        advance_percentage: 0,
        wo_type: 'AMC',
        remarks: `Auto-generated for Equipment: ${data.equipment_code}`
      });
      setDialog(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, projects, location.pathname, navigate]);

  useEffect(() => {
    if (location.state?.openWOId && wos.length > 0) {
      const poToOpen = wos.find(p => p.id === location.state.openWOId);
      if (poToOpen) {
        if (poToOpen.can_user_approve && hasAction('work_orders', 'can_approve')) {
          setApprovalDialog({ open: true, wo: poToOpen, items: {} });
        } else {
          setDetailDialog(poToOpen);
        }
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, wos, location.pathname, navigate, hasAction]);



  const handleSave = async (isDraft = false) => {
    const newErrors = {};
    if (!form.vendor_id) newErrors.vendor_id = "Please select a Vendor.";
    if (!form.project_id) newErrors.project_id = "Project is required.";
    if (!form.institution_id) newErrors.institution_id = "Institution is required.";
    if (!form.terms || !form.terms.trim()) newErrors.terms = "Terms and Conditions are mandatory.";

    if (form.advance_percentage !== '' && (parseFloat(form.advance_percentage) < 0 || parseFloat(form.advance_percentage) > 100)) {
      newErrors.advance_percentage = "Advance percentage must be between 0 and 100.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      const payload = {
        ...form,
        vendor_id: parseInt(form.vendor_id, 10),
        project_id: parseInt(form.project_id, 10),
        institution_id: parseInt(form.institution_id, 10),
        equipment_id: form.equipment_id ? parseInt(form.equipment_id, 10) : null,
        contract_id: form.contract_id ? parseInt(form.contract_id, 10) : null,
        advance_percentage: parseFloat(form.advance_percentage) || 0,
        target_completion_date: form.target_completion_date ? dayjs(form.target_completion_date).format('YYYY-MM-DD') : null,
        status: isDraft ? 'Draft' : 'Submitted',
        items: []
      };

      let res;
      if (editingWOId) {
        res = await api.put(`/api/procurement/work-orders/${editingWOId}`, payload);
        const poNumber = res?.data?.wo_number || form.wo_number || '';
        showMessage(`Work Order ${poNumber} ${isDraft ? 'draft updated' : 'updated and submitted'}`.trim(), "Success", "success");
      } else {
        res = await api.post('/api/procurement/work-orders', payload);
        const poNumber = res?.data?.wo_number || '';
        showMessage(`Work Order ${poNumber} ${isDraft ? 'draft saved' : 'created'}`.trim(), "Success", "success");
      }

      setDialog(false);
      setEditingWOId(null);
      load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error', "Error", "error"); }
  };

  const approveWO = async (id) => { await api.post(`/api/procurement/work-orders/${id}/approve`); load(); };
  const rejectWO = async (id, remarks) => { await api.post(`/api/procurement/work-orders/${id}/reject`, { remarks }); load(); };
  const openEmailPreview = async (wo) => {
    setEmailPreview({ open: true, loading: true, data: null, wo, cc: '', bcc: '', sending: false });
    try {
      const res = await api.get(`/api/procurement/work-orders/${wo.id}/email-preview`);
      setEmailPreview(prev => ({ ...prev, loading: false, data: res.data }));
    } catch (err) {
      showMessage('Failed to load email preview', 'Error', 'error');
      setEmailPreview(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  const handleSendWithEmail = async () => {
    const wo = emailPreview.wo;
    setEmailPreview(prev => ({ ...prev, sending: true }));
    try {
      const res = await api.post(`/api/procurement/work-orders/${wo.id}/send`, {
        cc: emailPreview.cc,
        bcc: emailPreview.bcc,
      });
      const emailInfo = res.data.email_status ? `\n${res.data.email_status}` : '';
      showMessage(res.data.message + emailInfo, "WO EMAIL SEND", "success");
      setEmailPreview({ open: false, loading: false, data: null, wo: null, cc: '', bcc: '', sending: false });
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error sending WO", "Error", "error");
      setEmailPreview(prev => ({ ...prev, sending: false }));
    }
  };
  const shortCloseWO = async (id, remarks) => { await api.post(`/api/procurement/work-orders/${id}/short-close`, { remarks }); load(); };
  const cancelWO = async (id, remarks) => { await api.post(`/api/procurement/work-orders/${id}/cancel`, { remarks }); load(); };

  // Status helpers
  const statusColor = {
    'Draft': 'default', 'Submitted': 'info', 'Approved': 'success', 'Sent to Vendor': 'primary',
    'Partially Received': 'warning', 'Closed': 'success', 'Short Closed': 'warning',
    'Rejected': 'error', 'Cancelled': 'default'
  };

  const canApprove = (s) => s === 'Submitted';
  const canReject = (s) => s === 'Submitted';
  const canSend = (s) => s === 'Approved';
  const canShortClose = (s) => s === 'Approved' || s === 'Sent to Vendor' || s === 'Partially Received';
  const canCancel = (s) => ['Draft', 'Submitted', 'Approved', 'Sent to Vendor'].includes(s);

  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() || 'Zero';
  };

  const handlePrintWO = (poToPrint = null) => {
    const wo = poToPrint || detailDialog;
    if (!wo) return;
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTaxable = 0;
    let totalNetAmountSum = 0;

    if (wo.items && wo.items.length > 0) {
      wo.items.forEach((item, idx) => {
        const effQty = item.approved_quantity !== null && item.approved_quantity !== undefined ? item.approved_quantity : item.quantity;
        const qty = parseFloat(effQty) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = qty * rate;
        const discAmt = amount * ((item.discount_percent || 0) / 100);
        const netAmtAfterDisc = amount - discAmt;

        let taxable = netAmtAfterDisc;
        const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
        if (item.is_gst_inclusive && totalGst > 0) {
          taxable = netAmtAfterDisc / (1 + (totalGst / 100));
        }

        const cgstVal = taxable * ((item.cgst_percentage || 0) / 100);
        const sgstVal = taxable * ((item.sgst_percentage || 0) / 100);
        const igstVal = taxable * ((item.igst_percentage || 0) / 100);

        let itemBaseAmount = amount;
        if (item.is_gst_inclusive && totalGst > 0) {
          itemBaseAmount = amount / (1 + (totalGst / 100));
        }

        totalCgst += cgstVal;
        totalSgst += sgstVal;
        totalIgst += igstVal;
        totalDiscount += discAmt;
        totalTaxable += taxable;
        grandTotal += amount;

        if (item.is_gst_inclusive) {
          totalNetAmountSum += netAmtAfterDisc;
        } else {
          totalNetAmountSum += (netAmtAfterDisc + cgstVal + sgstVal + igstVal);
        }

        rowsHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td>
              ${item.material_name}
            </td>
            <td>-</td>
            <td>${item.uom_allow_decimal ? Number(qty.toFixed(2)) : Math.round(qty)}</td>
            <td>${item.uom_name || 'NOS'}</td>
            <td style="text-align:right">${Number(rate.toFixed(2))}</td>
            <td style="text-align:right">${Number((item.discount_percent || 0).toFixed(2))}</td>
            <td style="text-align:right">${Number((item.cgst_percentage || 0).toFixed(2))}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
            <td style="text-align:right">${Number((item.sgst_percentage || 0).toFixed(2))}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
            <td style="text-align:right">${Number((item.igst_percentage || 0).toFixed(2))}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
            <td style="text-align:right">${Number(itemBaseAmount.toFixed(2))}</td>
          </tr>
        `;
      });
    } else if (wo.equipment_name) {
      const rate = parseFloat(wo.total_amount) || 0;
      rowsHtml = `
        <tr>
          <td>1</td>
          <td style="text-align:left;">
            <b>${wo.equipment_name}</b><br/>
            <span style="font-size: 10px; color: #555;">Code: ${wo.equipment_code || 'N/A'}</span>
          </td>
          <td>-</td>
          <td>1</td>
          <td>NOS</td>
          <td style="text-align:right">${Number(rate).toFixed(2)}</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">${Number(rate).toFixed(2)}</td>
        </tr>
      `;
      totalTaxable = rate;
      totalNetAmountSum = rate;
      grandTotal = rate;
    }

    const grandTotalWithTax = totalNetAmountSum;
    const roundOff = Number((Math.round(grandTotalWithTax) - grandTotalWithTax).toFixed(2));
    const totalNetAmount = Number(Math.round(grandTotalWithTax).toFixed(2));
    const activeTerms = wo.terms || termsTemplates.find(t => t.is_default)?.content || (termsTemplates.length > 0 ? termsTemplates[0].content : '');
    const termsHtml = (activeTerms || '').split('\n').filter(t => t.trim()).map(t => `<li>${t}</li>`).join('');
    const annexureHtml = wo.annexure ? (wo.annexure.includes('<') ? wo.annexure : wo.annexure.replace(/\n/g, '<br/>')) : '';

    const html = `
      <html>
        <head>
          <title>WO - ${wo.wo_number}</title>
          <style>
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; color: #000; background-color: #f8fafc; }
            .print-wrapper { max-width: 800px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px; }
            @media print {
              body { background-color: white; padding: 0; }
              .print-wrapper { max-width: 100%; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
            }
            .action-bar { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 20px; }
            .btn { padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; font-family: Arial, sans-serif; }
            .btn-print { background: #2563EB; color: white; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3); }
            .btn-print:hover { background: #1D4ED8; }
            .btn-close { background: #e2e8f0; color: #334155; }
            .btn-close:hover { background: #cbd5e1; }
            .header-container { text-align: center; margin-bottom: 20px; }
            .org-title { font-size: 16px; font-weight: bold; margin: 0; }
            .org-address { font-size: 11px; margin: 5px 0; }
            .doc-title { font-size: 14px; font-weight: bold; text-decoration: underline; margin-top: 15px; }
            .info-table { width: 100%; border: none; margin-bottom: 15px; }
            .info-table td { vertical-align: top; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 4px; text-align: center; }
            .items-table th { font-weight: bold; }
            .items-table td:nth-child(2) { text-align: left; }
            .terms-list { margin: 5px 0 20px 0; padding-left: 20px; list-style-type: none; font-size: 10px; }
            .terms-list li { margin-bottom: 3px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .sig-box { text-align: center; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="action-bar no-print">
              <button class="btn btn-close" onclick="window.close()">Close</button>
              <button class="btn btn-print" onclick="window.print()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print
              </button>
            </div>
            <div class="header-container">
            <h2 class="org-title">${wo.institution_name ? (wo.institution_name.match(/\((.*?)\)/) ? wo.institution_name.match(/\((.*?)\)/)[1].trim() : wo.institution_name) : 'EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER'}</h2>
            <p class="org-address">113, JNANA PRABHA CAMPUS, BIDARAHALLI, VIRGO NAGAR POST, BANGALORE - 560049</p>
            <div class="doc-title">WORK ORDER for ${wo.wo_type || 'AMC'}</div>
            ${wo.equipment_name ? `<div style="text-align: center; font-size: 13px; font-weight: bold; margin-top: 8px;">Target Equipment: ${wo.equipment_name} (${wo.equipment_code})</div>` : ''}
          </div>
          
          <table class="info-table">
            <tr>
              <td style="width: 50%;">
                <b>To,</b><br/>
                <b>M/S. ${wo.vendor_name ? (wo.vendor_name.includes(' - ') ? wo.vendor_name.split(' - ').slice(1).join(' - ') : wo.vendor_name) : 'VENDOR'}</b><br/>
                ${wo.vendor_address ? `<span style="font-size: 10px; color: #333;">${wo.vendor_address}</span><br/>` : ''}
                ${(wo.vendor_city || wo.vendor_state || wo.vendor_pincode) ? `<span style="font-size: 10px; color: #333;">${[wo.vendor_city, wo.vendor_state ? wo.vendor_state.replace(/^\\d{2}\\s*-\\s*/, '').trim() : '', wo.vendor_pincode ? 'PINCODE ' + wo.vendor_pincode : ''].filter(Boolean).join(', ')}</span><br/>` : ''}
                ${wo.vendor_gst_number ? `<span style="font-size: 10px; color: #333;">GSTIN: ${wo.vendor_gst_number}</span><br/>` : ''}
                ${wo.vendor_phone ? `<span style="font-size: 10px; color: #333;">PH NO: ${wo.vendor_phone}</span><br/>` : ''}
                ${wo.vendor_email ? `<span style="font-size: 10px; color: #333;">E-MAIL: ${wo.vendor_email}</span><br/>` : ''}
              </td>
              <td style="width: 50%;">
                <table style="width: 100%">
                  <tr><td style="width: 45%">WO Number</td><td>: <b>${wo.wo_number}</b></td></tr>
                  <tr><td>WO Date</td><td>: ${formatDate(wo.created_at)}</td></tr>
                </table>
              </td>
            </tr>
          </table>
          
          <div style="margin-bottom: 15px;">
            Dear Sir/Madam,<br/>
            We are pleased to place an order for the following items, terms & conditions mentioned below.
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Sr.<br/>No.</th>
                <th style="width:30%">Item Description</th>
                <th>HSN<br/>Code</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>RATE</th>
                <th>Disc.<br/>%</th>
                <th>CGST<br/>%</th>
                <th>SGST/<br/>UTGST %</th>
                <th>IGST<br/>%</th>
                <th>Item<br/>Amt.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          
          <div style="display:flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
            <div style="width: 60%">
              Total Net Amount in Word : <b>Rupees ${numberToWords(Math.round(grandTotalWithTax))} Only -/</b>
            </div>
            <div style="width: 40%">
              <table style="width:100%; border-collapse: collapse;">
                <tr><td style="text-align:right">Total Amount</td><td style="text-align:right; width: 100px;">: ${Number((totalTaxable + totalDiscount + totalCgst + totalSgst + totalIgst).toFixed(2))}</td></tr>
                <tr><td style="text-align:right">Round Off</td><td style="text-align:right">: ${roundOff}</td></tr>
                <tr><td style="text-align:right"><b>Total Net Amount</b></td><td style="text-align:right"><b>: ${totalNetAmount}</b></td></tr>
              </table>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            Please expedite supplies accordingly, and arrange to send the bill of cost in duplicate for arranging payment of the same on receipt and inspection of materials at our end.
          </div>
          
          <b style="font-size:10px;">TERMS AND CONDITIONS:</b>
          <ul class="terms-list">
            ${termsHtml}
          </ul>
          
          <div style="margin-top: 10px;">Thanking You</div>
          <div style="margin-top: 20px; margin-bottom: 30px;"><b>For EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER</b></div>
          
            <div class="signatures">
              <div class="sig-box" style="text-align: left;">
                Managing Trustee
              </div>
              <div class="sig-box" style="text-align: right;">
                ${formatDate(new Date())}<br/>
                Prepared By ADMIN
              </div>
            </div>

            <div style="margin-top: 30px; font-size: 10px;">
              <b>CC:</b> Manager Accounts<br/>
              ${wo.remarks ? `<b>Remarks:</b> ${wo.remarks}` : ''}
            </div>
          </div>

          ${annexureHtml ? `
          <div class="print-wrapper" style="margin-top: 20px; page-break-before: always; break-before: page;">
            <h3 style="text-decoration: underline; text-align: center; margin-bottom: 20px;">ANNEXURE FOR ${wo.wo_number}</h3>
            <div style="font-size: 11px;">${annexureHtml}</div>
          </div>
          ` : ''}
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const detailData = useMemo(() => {
    if (!detailDialog) return null;
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTaxable = 0;
    let totalNetAmountSum = 0;

    (detailDialog.items || []).forEach(item => {
      const effQty = item.approved_quantity !== null && item.approved_quantity !== undefined ? item.approved_quantity : item.quantity;
      const qty = parseFloat(effQty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      const discAmt = amount * ((item.discount_percent || 0) / 100);
      const netAmtAfterDisc = amount - discAmt;

      let taxable = netAmtAfterDisc;
      const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
      if (item.is_gst_inclusive && totalGst > 0) {
        taxable = netAmtAfterDisc / (1 + (totalGst / 100));
      }

      const cgstVal = taxable * ((item.cgst_percentage || 0) / 100);
      const sgstVal = taxable * ((item.sgst_percentage || 0) / 100);
      const igstVal = taxable * ((item.igst_percentage || 0) / 100);

      totalDiscount += discAmt;
      totalCgst += cgstVal;
      totalSgst += sgstVal;
      totalIgst += igstVal;
      totalTaxable += taxable;
      grandTotal += amount;

      if (item.is_gst_inclusive) {
        totalNetAmountSum += netAmtAfterDisc;
      } else {
        totalNetAmountSum += (netAmtAfterDisc + cgstVal + sgstVal + igstVal);
      }
    });

    const grandTotalWithTax = totalNetAmountSum;
    const roundOff = Number((Math.round(grandTotalWithTax) - grandTotalWithTax).toFixed(2));
    const totalNetAmount = Number(Math.round(grandTotalWithTax).toFixed(2));
    const activeTerms = detailDialog.terms || termsTemplates.find(t => t.is_default)?.content || (termsTemplates.length > 0 ? termsTemplates[0].content : '');

    const advancePercentage = detailDialog.advance_percentage || 0;
    const advanceAmount = Number(Math.round((Math.round(grandTotalWithTax) * advancePercentage) / 100).toFixed(2));
    const balanceAmount = Number((Math.round(grandTotalWithTax) - parseFloat(advanceAmount)).toFixed(2));

    return {
      grandTotal,
      totalDiscount,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTaxable,
      grandTotalWithTax,
      roundOff,
      totalNetAmount,
      advancePercentage,
      advanceAmount,
      balanceAmount,
      activeTerms
    };
  }, [detailDialog, termsTemplates]);

  const noSpinSx = {
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    },
    '& input[type=number]': {
      MozAppearance: 'textfield'
    }
  };

  return (
    <Box sx={{
      '& .no-spin input[type=number]::-webkit-outer-spin-button, & .no-spin input[type=number]::-webkit-inner-spin-button': {
        WebkitAppearance: 'none', margin: 0
      },
      '& .no-spin input[type=number]': {
        MozAppearance: 'textfield'
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Work Orders</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{wos.length} orders</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {location.state?.fromDashboard && (
            <Button size="small" variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          )}
          {hasPermission('work_orders', 'can_create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setEditingWOId(null);
              setForm({
                wo_number: '', vendor_id: '', contract_id: '', equipment_id: '', project_id: projects.length > 0 ? projects[0].id : '', institution_id: '', target_completion_date: null, terms: '', annexure: '', advance_percentage: 0,
                wo_type: 'AMC', remarks: ''
              });
              setDialog(true);
            }}>Create WO</Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search WO Numbers" value={search}
            onChange={e => setSearch(e.target.value)} sx={{ minWidth: 400 }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
          <Autocomplete
            size="small"
            options={vendors}
            getOptionLabel={(option) => `${option.code} - ${option.name}`}
            value={filterVendor}
            onChange={(e, val) => setFilterVendor(val)}
            renderInput={(params) => <TextField {...params} placeholder="Filter by Vendor" sx={{ minWidth: 250 }} />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              displayEmpty
              value={filterProcurementType}
              onChange={e => setFilterProcurementType(e.target.value)}
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: '#9ca3af' }}>All Procurement Types</span>;
                }
                return selected === 'Purchase' ? 'Standard Purchase' : 'Rental';
              }}
            >
              <MenuItem value="">All Procurement Types</MenuItem>
              <MenuItem value="Purchase">Standard Purchase</MenuItem>
              <MenuItem value="Rental">Rental</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5 } }}
        >
          {['Draft', 'Submitted', 'Approved', 'Sent to Vendor', 'Rejected', 'Cancelled', 'All'].map(s => (
            <Tab
              key={s}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s}
                  <Chip
                    label={
                      s === 'All' ? filteredWOsBase.length :
                        s === 'Pending' ? filteredWOsBase.filter(wo => ['Draft', 'Submitted', 'Approved', 'Sent to Vendor'].includes(wo.status)).length :
                          filteredWOsBase.filter(wo => wo.status === s).length
                    }
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: tabValue === s ? 'primary.main' : 'action.selected', color: tabValue === s ? 'white' : 'text.primary' }}
                  />
                </Box>
              }
              value={s}
              sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
            />
          ))}
        </Tabs>
      </Card>

      <Card>
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {sortedWOs.length === 0 && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No work orders found.
              </Typography>
            )}
            {sortedWOs.map(wo => (
              <Card key={wo.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => handleRowClick(wo)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                    {wo.wo_number}
                    {wo.procurement_type === 'Rental' && wo.rental_type !== 'Cost Per Test' && (
                      <Assignment sx={{ fontSize: 14, color: '#0EA5E9', ml: 0.5, verticalAlign: 'middle' }} />
                    )}
                    {wo.procurement_type === 'Rental' && wo.rental_type === 'Cost Per Test' && (
                      <Science sx={{ fontSize: 14, color: '#8B5CF6', ml: 0.5, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Chip label={`L${wo.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                    <Chip label={wo.status} size="small" color={statusColor[wo.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Vendor:</strong> {wo.vendor_name}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Amount:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(calculateWOTotalNet(wo))}</span></Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(wo.created_at)} • {wo.equipment_id ? 1 : (wo.items?.length || 0)} items</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Approve">
                      <span><IconButton size="small" color="success" disabled={!wo.can_user_approve || !hasAction('work_orders', 'can_approve')}
                        onClick={() => setApprovalDialog({ open: true, wo, items: {} })}>
                        <CheckCircle fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <span><IconButton size="small" color="error" disabled={!canReject(wo.status) || !hasAction('work_orders', 'can_reject')}
                        onClick={() => showConfirm('Reject WO?', `Are you sure you want to reject ${wo.wo_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectWO(wo.id, r), true)}>
                        <Cancel fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Send to Vendor">
                      <span><IconButton size="small" disabled={!canSend(wo.status) || !hasAction('work_orders', 'can_send_to_vendor')}
                        sx={{ color: '#8b5cf6', '&.Mui-disabled': { color: 'text.disabled' } }}
                        onClick={() => openEmailPreview(wo)}>
                        <Send fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 0.5, py: 0.5, borderBottom: '1px solid #f1f5f9' } }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'wo_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('wo_number')}
                    >
                      WO No
                    </TableSortLabel>
                  </TableCell>


                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'vendor'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('vendor')}
                    >
                      VENDOR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ITEMS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', pr: 4 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'total_amount'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('total_amount')}
                    >
                      AMOUNT
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'created_at'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('created_at')}
                    >
                      DATE
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'status'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('status')}
                    >
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', textAlign: 'center' }}>LVL</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedWOs.map(wo => (
                  <TableRow key={wo.id} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }} onClick={() => handleRowClick(wo)}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {wo.wo_number}
                      {wo.procurement_type === 'Rental' && wo.rental_type !== 'Cost Per Test' && (
                        <Tooltip title="Rental Agreement">
                          <Assignment sx={{ fontSize: 14, color: '#0EA5E9', ml: 0.5, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                      {wo.procurement_type === 'Rental' && wo.rental_type === 'Cost Per Test' && (
                        <Tooltip title={`Cost Per Test: ₹${wo.cost_per_test || 0}`}>
                          <Science sx={{ fontSize: 14, color: '#8B5CF6', ml: 0.5, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                    </TableCell>


                    <TableCell sx={{ fontSize: '0.7rem' }}>{wo.vendor_name}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem' }}>{wo.equipment_id ? 1 : (wo.items?.length || 0)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem', pr: 4 }}>{formatCurrency(calculateWOTotalNet(wo))}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(wo.created_at)}</TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={wo.status} size="small" color={statusColor[wo.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }} /></TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={`L${wo.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Approve">
                          <span><IconButton size="small" color="success" disabled={!wo.can_user_approve || !hasAction('work_orders', 'can_approve')}
                            onClick={() => setApprovalDialog({ open: true, wo, items: {} })}>
                            <CheckCircle fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span><IconButton size="small" color="error" disabled={!canReject(wo.status) || !hasAction('work_orders', 'can_reject')}
                            onClick={() => showConfirm('Reject WO?', `Are you sure you want to reject ${wo.wo_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectWO(wo.id, r), true)}>
                            <Cancel fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Send to Vendor">
                          <span><IconButton size="small" disabled={!canSend(wo.status) || !hasAction('work_orders', 'can_send_to_vendor')}
                            sx={{ color: '#8b5cf6', '&.Mui-disabled': { color: 'text.disabled' } }}
                            onClick={() => openEmailPreview(wo)}>
                            <Send fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Short Close">
                          <span><IconButton size="small" color="warning" disabled={!canShortClose(wo.status) || !hasAction('work_orders', 'can_short_close')}
                            onClick={() => showConfirm('Short Close WO?', `Short close ${wo.wo_number}? This cannot be undone.`, 'Yes, Short Close', 'warning', (r) => shortCloseWO(wo.id, r), true)}>
                            <Archive fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <span><IconButton size="small" color="error" disabled={!canCancel(wo.status) || !hasPermission('work_orders', 'can_update')}
                            onClick={() => showConfirm('Cancel WO?', `Cancel ${wo.wo_number}? This cannot be undone.`, 'Yes, Cancel WO', 'error', (r) => cancelWO(wo.id, r), true)}>
                            <Block fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* WO Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDetailDialog(null); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.wo_number} — Order Details</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>VENDOR</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography>
                {detailDialog?.vendor_gst_number && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>GSTIN: {detailDialog.vendor_gst_number}</Typography>
                )}
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>WO TYPE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.wo_type || '—'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>STATUS</Typography>
                <Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
              </Grid>

              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>INSTITUTION / PROJECT</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                  {detailDialog?.institution_name || detailDialog?.project_name || '—'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>EQUIPMENT</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.equipment_name || '—'}</Typography>
                {detailDialog?.equipment_code && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Code: {detailDialog.equipment_code}</Typography>
                )}
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>CONTRACT</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.contract_number || '—'}</Typography>
              </Grid>
              
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>WO DATE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.created_at)}</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 3 }} />



            {detailData && detailData.activeTerms && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', display: 'block', mb: 1 }}>TERMS AND CONDITIONS:</Typography>
                <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 0.5, fontSize: '0.75rem', color: '#334155' } }}>
                  {detailData.activeTerms.split('\n').filter(t => t.trim()).map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </Box>
              </Box>
            )}



            {/* Collapsible Approval History Section for WO */}
            {detailDialog?.status !== 'Draft' && (
              <Box sx={{ mt: 3 }}>
                <Accordion
                  expanded={detailHistoryOpen}
                  onChange={() => {
                    if (!detailHistoryOpen && detailDialog?.id) {
                      fetchDetailHistory(detailDialog.id, 'wo');
                    } else {
                      setDetailHistoryOpen(!detailHistoryOpen);
                    }
                  }}
                  sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '8px !important', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: '#f8fafc', borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <History sx={{ color: '#6366f1', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>Approval History</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    {detailHistoryData && detailHistoryData.entries?.length > 0 ? (
                      <Box>
                        <TableContainer component={Box} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'auto' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ '& th': { py: 1, fontSize: '0.75rem', fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap', verticalAlign: 'bottom' } }}>
                                <TableCell>MATERIAL</TableCell>
                                <TableCell>UOM</TableCell>
                                <TableCell align="right">REQ QTY</TableCell>
                                {detailHistoryData.entries.map((entry, idx) => (
                                  <TableCell key={idx} align="center">
                                    <Box sx={{ whiteSpace: 'normal', maxWidth: 80, lineHeight: 1.2, margin: '0 auto', textTransform: 'uppercase', color: entry.status === 'Rejected' ? '#dc2626' : 'inherit' }}>
                                      {entry.status === 'Rejected' ? `L${entry.level} REJECTED` : `L${idx + 1} APPROVED QTY`}
                                    </Box>
                                  </TableCell>
                                ))}

                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {detailHistoryData.entries[0]?.items?.map(item => {
                                return (
                                  <TableRow key={item.material_id} sx={{ '& td': { py: 1, fontSize: '0.8rem' } }}>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.material_name}</Typography>
                                      <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: '#64748B', whiteSpace: 'nowrap' }}>{item.uom_name}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>{item.requested_quantity}</TableCell>

                                    {detailHistoryData.entries.map((entry, idx) => {
                                      const histItem = entry.items?.find(hi => hi.material_id === item.material_id);
                                      return (
                                        <TableCell key={idx} align="center">
                                          {histItem ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: entry.status === 'Rejected' ? '#dc2626' : '#1d4ed8' }}>
                                                  {entry.status === 'Rejected' ? 'X' : histItem.approved_quantity}
                                                </Typography>
                                                {histItem.remarks && (
                                                  <Tooltip title={histItem.remarks} arrow placement="top">
                                                    <Textsms sx={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
                                                  </Tooltip>
                                                )}
                                              </Box>
                                              <Typography variant="caption" sx={{ fontWeight: 600, mt: 0.5, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{entry.approver_name}</Typography>
                                              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', mt: 0.25, whiteSpace: 'nowrap' }}>{formatDateTime(entry.approved_at)}</Typography>
                                            </Box>
                                          ) : (
                                            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography>
                                          )}
                                        </TableCell>
                                      );
                                    })}


                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {detailHistoryData.entries.some(e => e.remarks) && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase' }}>General Approval Remarks</Typography>
                            {detailHistoryData.entries.map((e, i) => ({ e, i })).filter(x => x.e.remarks).map((x, idx) => (
                              <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: x.e.status === 'Rejected' ? '#fef2f2' : '#f8fafc', borderRadius: 1, border: x.e.status === 'Rejected' ? '1px solid #fecaca' : '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: x.e.status === 'Rejected' ? '#dc2626' : '#1d4ed8', display: 'block', mb: 0.5 }}>
                                  {x.e.status === 'Rejected' ? `L${x.e.level} Rejection - ${x.e.approver_name}` : `L${x.i + 1} Approval - ${x.e.approver_name}`}
                                </Typography>
                                <Typography variant="body2" sx={{ color: x.e.status === 'Rejected' ? '#991b1b' : '#334155' }}>
                                  {x.e.remarks.replace(/\[Rejected: (.*)\]/g, '$1').replace(/\[Short Closed: (.*)\]/g, '$1').trim()}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748B', fontStyle: 'italic', p: 2, textAlign: 'center' }}>
                        No approval history available yet.
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', display: 'block', mb: 1 }}>ANNEXURE FOR {detailDialog?.wo_number}:</Typography>
              {detailDialog?.annexure ? (
                <Box sx={{ color: '#334155', fontSize: '0.8rem', '& p': { margin: 0, padding: 0 } }} dangerouslySetInnerHTML={{ __html: detailDialog.annexure.includes('<') ? detailDialog.annexure : detailDialog.annexure.replace(/\n/g, '<br/>') }} />
              ) : (
                <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                  No annexure provided.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          {!['Draft', 'Submitted', 'Rejected'].includes(detailDialog?.status) && (
            <Button onClick={() => handlePrintWO()} variant="contained" sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', mr: 2, bgcolor: '#2563EB' }}>Print WO</Button>
          )}
          <Button onClick={() => { setDetailDialog(null); setDetailHistoryOpen(false); setDetailHistoryData(null); }} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create WO Dialog */}
      <Dialog open={dialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(false); }} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{editingWOId ? `Edit Draft Work Order — ${form.wo_number || 'Unknown'}` : 'Create Work Order'}</Typography>
              <Typography variant="body2" color="text.secondary">Issue a new work order to the vendor.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1, mb: 2 }}>
            <FormControl fullWidth size="small" error={!!errors.institution_id}>
              <InputLabel>Institution *</InputLabel>
              <Select
                value={form.institution_id || ''}
                label="Institution *"
                onChange={e => setForm({ ...form, institution_id: e.target.value })}
                startAdornment={<InputAdornment wosition="start"><Store sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {institutions.map(inst => (
                  <MenuItem key={inst.id} value={inst.id}>{inst.code} - {inst.name}</MenuItem>
                ))}
              </Select>
              {errors.institution_id && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>{errors.institution_id}</Typography>}
            </FormControl>
            <Box id="field-vendor_id">
              <Autocomplete
                options={vendors}
                getOptionLabel={(option) => `${option.code} - ${option.name}`}
                value={vendors.find(v => v.id === form.vendor_id) || null}
                onChange={(e, newValue) => {
                  const vId = newValue ? newValue.id : '';
                  const vendor = newValue;
                  const vendorState = vendor?.state || '';

                  setForm({ ...form, vendor_id: vId });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vendor *"
                    size="small"
                    error={!!errors.vendor_id}
                    helperText={errors.vendor_id}
                  />
                )}
                fullWidth
                size="small"
                disableClearable
              />
              {form.vendor_id && vendors.find(v => v.id === form.vendor_id)?.state ? (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                  State: {vendors.find(v => v.id === form.vendor_id)?.state}
                </Typography>
              ) : null}
            </Box>

            <Box id="field-wo_type">
              <FormControl fullWidth size="small">
                <InputLabel>WO Type</InputLabel>
                <Select
                  value={form.wo_type || 'AMC'}
                  label="WO Type"
                  onChange={(e) => {
                    setForm({ ...form, wo_type: e.target.value, contract_id: '' });
                  }}
                >
                  <MenuItem value="AMC">AMC</MenuItem>
                  <MenuItem value="CMC">CMC</MenuItem>
                  <MenuItem value="Repair">Repair</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box id="field-equipment_id">
              <Autocomplete
                options={availableEquipment}
                getOptionLabel={(option) => `${option.equipment_serial || option.equipment_id} - ${option.material_name || 'Equipment'}`}
                value={availableEquipment.find(e => e.equipment_id === form.equipment_id) || null}
                onChange={(e, newValue) => {
                  if (newValue) {
                    const newTerms = [newValue.payment_terms, newValue.sla_details].filter(Boolean).join('\n\n');
                    setForm(prevForm => ({
                      ...prevForm,
                      equipment_id: newValue.equipment_id,
                      contract_id: newValue.contract_id,
                      terms: newTerms || prevForm.terms,
                      annexure: newValue.exclusions || prevForm.annexure
                    }));
                  } else {
                    setForm({ ...form, equipment_id: '', contract_id: '' });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Equipment *"
                    size="small"
                  />
                )}
                fullWidth
                size="small"
                disabled={!form.vendor_id || !form.wo_type}
              />
            </Box>


          </Box>




          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>Terms & Conditions *</Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Template</InputLabel>
            <Select
              label="Select Template"
              value={termsTemplates.find(t => (t.content || '').replace(/\r\n/g, '\n').trim() === (form.terms || '').replace(/\r\n/g, '\n').trim())?.id || ""}
              onChange={e => {
                const t = termsTemplates.find(x => x.id === e.target.value);
                if (t) setForm({ ...form, terms: t.content });
                else if (e.target.value === "") setForm({ ...form, terms: "" });
              }}
            >
              <MenuItem value=""><em>Select a Template</em></MenuItem>
              {termsTemplates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            id="field-terms"
            fullWidth
            multiline
            required
            rows={4}
            label="Terms and Conditions"
            value={form.terms}
            onChange={e => setForm({ ...form, terms: e.target.value })}
            placeholder="Enter terms and conditions..."
            error={!!errors.terms}
            helperText={errors.terms}
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 1.5 }}>Annexure</Typography>
          <Box sx={{ '.ql-container': { minHeight: '150px', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderColor: '#c4c4c4' }, '.ql-toolbar': { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderColor: '#c4c4c4' }, '&:hover .ql-container, &:hover .ql-toolbar': { borderColor: '#000' }, '&:focus-within .ql-container, &:focus-within .ql-toolbar': { borderColor: '#2563EB', borderWidth: 2 } }}>
            <ReactQuill
              theme="snow"
              value={form.annexure || ''}
              onChange={val => setForm({ ...form, annexure: val })}
              placeholder="Enter annexure details..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => { setDialog(false); setEditingWOId(null); setErrors({}); setItemErrors({}); }} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          {!(form.pr_id || form.indent_id || form.qr_id) && (
            <Button onClick={() => handleSave(true)} color="secondary" variant="outlined" sx={{ fontWeight: 600 }}>Save Draft</Button>
          )}
          <Button variant="contained" onClick={() => handleSave(false)} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}>{editingWOId ? 'Submit WO' : 'Create WO'}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog with optional Reason */}
      <Dialog open={confirm.open} onClose={handleCancelConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{confirm.message}</Typography>
          {confirm.needsReason && (
            <TextField fullWidth label="Reason (required)" value={reason} onChange={e => setReason(e.target.value)}
              multiline rows={2} required autoFocus />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConfirm} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color={confirm.confirmColor}
            disabled={confirm.needsReason && !reason.trim()}
            onClick={handleConfirm} sx={{ fontWeight: 600, textTransform: 'none' }}>
            {confirm.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Preview Dialog for Send to Vendor */}
      <Dialog open={emailPreview.open} onClose={() => !emailPreview.sending && setEmailPreview({ open: false, loading: false, data: null, wo: null, cc: '', bcc: '', sending: false })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          <Email sx={{ color: '#2563EB' }} /> Send WO to Vendor — {emailPreview.wo?.wo_number}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {emailPreview.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Typography color="textSecondary">Loading email preview...</Typography>
            </Box>
          ) : emailPreview.data && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Test Mode Banner */}
              {emailPreview.data.test_mode && (
                <Box sx={{ bgcolor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 2, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                    ⚠️ TEST MODE — Email will be sent to {emailPreview.data.to_email} instead of vendor ({emailPreview.data.vendor_email || 'no email'})
                  </Typography>
                </Box>
              )}

              {/* From */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>FROM</Typography>
                <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 2, py: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{emailPreview.data.from_name}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>{emailPreview.data.from_email}</Typography>
                </Box>
              </Box>

              {/* To */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>TO</Typography>
                <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 2, py: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{emailPreview.data.to_email}</Typography>
                  {emailPreview.data.vendor_name && (
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{emailPreview.data.vendor_name}</Typography>
                  )}
                </Box>
              </Box>

              {/* CC & BCC */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="CC" placeholder="email1@example.com, email2@example.com"
                    value={emailPreview.cc} onChange={e => setEmailPreview(prev => ({ ...prev, cc: e.target.value }))}
                    helperText="Comma-separated email addresses" />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="BCC" placeholder="email@example.com"
                    value={emailPreview.bcc} onChange={e => setEmailPreview(prev => ({ ...prev, bcc: e.target.value }))}
                    helperText="Comma-separated email addresses" />
                </Grid>
              </Grid>

              {/* Subject */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>SUBJECT</Typography>
                <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5, px: 2, py: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{emailPreview.data.subject}</Typography>
                </Box>
              </Box>

              {/* Attachment */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>ATTACHMENT</Typography>
                <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1.5, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachFile sx={{ fontSize: 18, color: '#16a34a' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#15803d' }}>{emailPreview.data.attachment_filename}</Typography>
                  <Chip label="PDF" size="small" sx={{ ml: 'auto', bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                </Box>
              </Box>

              {/* Email Body Preview */}
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>EMAIL BODY PREVIEW</Typography>
                <Box sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1.5, p: 2.5, maxHeight: 280, overflow: 'auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}>
                  <div dangerouslySetInnerHTML={{ __html: emailPreview.data.html_body }} />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, borderTop: '1px solid #e2e8f0', gap: 1 }}>
          <Button onClick={() => setEmailPreview({ open: false, loading: false, data: null, wo: null, cc: '', bcc: '', sending: false })}
            disabled={emailPreview.sending} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
          <Button onClick={() => handlePrintWO(emailPreview.wo)} variant="outlined" sx={{ fontWeight: 600, textTransform: 'none' }}>
            Print WO
          </Button>
          <Button variant="contained" onClick={handleSendWithEmail} disabled={emailPreview.loading || emailPreview.sending}
            startIcon={<Send />}
            sx={{ fontWeight: 700, textTransform: 'none', px: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}>
            {emailPreview.sending ? 'Sending...' : 'Send Email & Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Linked Indent Detail Dialog */}
      <Dialog open={!!linkedIndent} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setLinkedIndent(null); setDetailHistoryOpen(false); setDetailHistoryData(null); } }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{linkedIndent?.indent_number} — Indent Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedIndent?.requester_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedIndent?.department || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Building</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedIndent?.building_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Floor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedIndent?.floor || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Room</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedIndent?.room_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Indent Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(linkedIndent?.created_at)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={linkedIndent?.status}
                  size="small"
                  color={{
                    'Awaiting Approval': 'warning', 'Approved': 'success', 'Rejected': 'error',
                    'Partially Issued': 'warning', 'Fully Issued': 'primary', 'WO Created': 'secondary', 'Closed': 'default'
                  }[linkedIndent?.status] || 'default'}
                />
              </Box>
            </Grid>
          </Grid>
          {linkedIndent?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {linkedIndent.remarks}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                <TableCell sx={{ fontWeight: 600 }}>MATERIAL</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>REQUESTED QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>APPROVED QTY</TableCell>
                {linkedIndent?.status !== 'Awaiting Approval' && (
                  <>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>ISSUED QTY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>PENDING QTY</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedIndent?.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.material_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 500, color: '#64748B' }}>{item.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>{item.requested_quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {item.approved_quantity !== null && item.approved_quantity !== undefined ? item.approved_quantity : '—'}
                  </TableCell>
                  {linkedIndent?.status !== 'Awaiting Approval' && (
                    <>
                      <TableCell align="right">{item.issued_quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: item.pending_quantity > 0 ? '#ef4444' : '#10b981' }}>
                        {item.pending_quantity}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Collapsible Approval History Section */}
          {linkedIndent?.status !== 'Draft' && (
            <Box sx={{ mt: 3 }}>
              <Accordion
                expanded={detailHistoryOpen}
                onChange={() => {
                  if (!detailHistoryOpen && linkedIndent?.id) {
                    fetchDetailHistory(linkedIndent.id, 'indent');
                  } else {
                    setDetailHistoryOpen(!detailHistoryOpen);
                  }
                }}
                sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '8px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: '#f8fafc', borderRadius: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>Approval History</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  {detailHistoryData && detailHistoryData.entries?.length > 0 ? (
                    <Box>
                      <TableContainer component={Box} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { py: 1, fontSize: '0.75rem', fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'normal', verticalAlign: 'bottom' } }}>
                              <TableCell>MATERIAL</TableCell>
                              <TableCell>UOM</TableCell>
                              <TableCell align="right">REQ QTY</TableCell>
                              {detailHistoryData.entries.map((entry, idx) => (
                                <TableCell key={idx} align="center">L{idx + 1} APPROVED QTY</TableCell>
                              ))}

                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {linkedIndent?.items?.map(item => {
                              const hasHistory = detailHistoryData.entries.some(entry => entry.items?.some(hi => hi.material_id === item.material_id));
                              if (!hasHistory) return null;

                              return (
                                <TableRow key={item.id} sx={{ '& td': { py: 1, fontSize: '0.8rem' } }}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.material_name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                                  </TableCell>
                                  <TableCell sx={{ color: '#64748B', whiteSpace: 'nowrap' }}>{item.uom_name}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>{item.requested_quantity}</TableCell>

                                  {detailHistoryData.entries.map((entry, idx) => {
                                    const histItem = entry.items?.find(hi => hi.material_id === item.material_id);
                                    return (
                                      <TableCell key={idx} align="center">
                                        {histItem ? (
                                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d4ed8' }}>{histItem.approved_quantity}</Typography>
                                              {histItem.remarks && (
                                                <Tooltip title={histItem.remarks} arrow placement="top">
                                                  <Textsms sx={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
                                                </Tooltip>
                                              )}
                                            </Box>
                                            <Typography variant="caption" sx={{ fontWeight: 600, mt: 0.5, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{entry.approver_name}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', mt: 0.25, whiteSpace: 'nowrap' }}>{formatDateTime(entry.approved_at)}</Typography>
                                          </Box>
                                        ) : (
                                          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography>
                                        )}
                                      </TableCell>
                                    );
                                  })}


                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {detailHistoryData.entries.some(e => e.remarks) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase' }}>General Approval Remarks</Typography>
                          {detailHistoryData.entries.map((e, i) => ({ e, i })).filter(x => x.e.remarks).map((x, idx) => (
                            <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', display: 'block', mb: 0.5 }}>L{x.i + 1} Approval - {x.e.approver_name}</Typography>
                              <Typography variant="body2" sx={{ color: '#334155' }}>{x.e.remarks}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
                      {detailHistoryData ? 'No approval history yet.' : 'Loading...'}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => { setLinkedIndent(null); setDetailHistoryOpen(false); setDetailHistoryData(null); }}>Close</Button></DialogActions>
      </Dialog>

      {/* Linked PR Detail Dialog */}
      <Dialog open={!!linkedPR} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setLinkedPR(null); setDetailHistoryOpen(false); setDetailHistoryData(null); } }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>{linkedPR?.pr_number} — PR Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedPR?.requester_name}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedPR?.department_name || '—'}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Building</Typography>
              <Typography sx={{ fontWeight: 600 }}>{linkedPR?.building_name || '—'}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">PR Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(linkedPR?.created_at)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Required Date</Typography>
              <Typography sx={{ fontWeight: 600, color: '#2563EB' }}>{formatDate(linkedPR?.required_date)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={linkedPR?.status}
                  size="small"
                  color={{
                    'Draft': 'default', 'Submitted': 'info', 'Approved': 'success',
                    'Rejected': 'error', 'Converted to WO': 'secondary',
                    'Short Closed': 'warning'
                  }[linkedPR?.status] || 'default'}
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
            </Grid>
          </Grid>

          {linkedPR?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {linkedPR.remarks}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />

          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 600 }}>MATERIAL</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>REQ QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>APPROVED QTY</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {linkedPR?.items?.map((it, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{it.material_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>{it.material_code}</Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 500, color: '#64748B' }}>{it.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>{it.quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                    {it.approved_quantity !== null && it.approved_quantity !== undefined ? it.approved_quantity : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Collapsible Approval History Section */}
          {linkedPR?.status !== 'Draft' && (
            <Box sx={{ mt: 3 }}>
              <Accordion
                expanded={detailHistoryOpen}
                onChange={() => {
                  if (!detailHistoryOpen && linkedPR?.id) {
                    fetchDetailHistory(linkedPR.id, 'pr');
                  } else {
                    setDetailHistoryOpen(!detailHistoryOpen);
                  }
                }}
                sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '8px !important', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: '#f8fafc', borderRadius: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <History sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>Approval History</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  {detailHistoryData && detailHistoryData.entries?.length > 0 ? (
                    <Box>
                      <TableContainer component={Box} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { py: 1, fontSize: '0.75rem', fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap', verticalAlign: 'bottom' } }}>
                              <TableCell>MATERIAL</TableCell>
                              <TableCell>UOM</TableCell>
                              <TableCell align="right">REQ QTY</TableCell>
                              {detailHistoryData.entries.map((entry, idx) => (
                                <TableCell key={idx} align="center">
                                  <Box sx={{ whiteSpace: 'normal', maxWidth: 80, lineHeight: 1.2, margin: '0 auto', textTransform: 'uppercase' }}>
                                    L{idx + 1} APPROVED QTY
                                  </Box>
                                </TableCell>
                              ))}

                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {linkedPR?.items?.map(item => {
                              const hasHistory = detailHistoryData.entries.some(entry => entry.items?.some(hi => hi.material_id === item.material_id));
                              if (!hasHistory) return null;

                              return (
                                <TableRow key={item.id} sx={{ '& td': { py: 1, fontSize: '0.8rem' } }}>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.material_name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                                  </TableCell>
                                  <TableCell sx={{ color: '#64748B', whiteSpace: 'nowrap' }}>{item.uom_name}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>

                                  {detailHistoryData.entries.map((entry, idx) => {
                                    const histItem = entry.items?.find(hi => hi.material_id === item.material_id);
                                    return (
                                      <TableCell key={idx} align="center">
                                        {histItem ? (
                                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d4ed8' }}>{histItem.approved_quantity}</Typography>
                                              {histItem.remarks && (
                                                <Tooltip title={histItem.remarks} arrow placement="top">
                                                  <Textsms sx={{ fontSize: 14, color: '#94a3b8', cursor: 'help' }} />
                                                </Tooltip>
                                              )}
                                            </Box>
                                            <Typography variant="caption" sx={{ fontWeight: 600, mt: 0.5, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{entry.approver_name}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', mt: 0.25, whiteSpace: 'nowrap' }}>{formatDateTime(entry.approved_at)}</Typography>
                                          </Box>
                                        ) : (
                                          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography>
                                        )}
                                      </TableCell>
                                    );
                                  })}


                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {detailHistoryData.entries.some(e => e.remarks) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase' }}>General Approval Remarks</Typography>
                          {detailHistoryData.entries.map((e, i) => ({ e, i })).filter(x => x.e.remarks).slice().reverse().map((x, idx) => (
                            <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', display: 'block', mb: 0.5 }}>L{x.i + 1} Approval - {x.e.approver_name}</Typography>
                              <Typography variant="body2" sx={{ color: '#334155' }}>{x.e.remarks}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
                      {detailHistoryData ? 'No approval history yet.' : 'Loading...'}
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => { setLinkedPR(null); setDetailHistoryOpen(false); setDetailHistoryData(null); }} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Linked QR Detail Dialog */}
      <Dialog open={!!linkedQR} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setLinkedQR(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Quotation Request Details - {linkedQR?.qr_number}</DialogTitle>
        <DialogContent>
          <Box>
            <Typography><strong>Status:</strong> {linkedQR?.status === 'Sent to Vendors' ? 'Request to Vendors' : linkedQR?.status}</Typography>

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
                  {linkedQR?.items?.map(it => (
                    <TableRow key={it.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.material_code}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{it.material_name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{it.quantity}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{it.uom_name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {it.sources && it.sources.length > 0 ? (() => {
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
                  {linkedQR?.invited_vendors && linkedQR.invited_vendors.length > 0 ? (
                    linkedQR.invited_vendors.map(v => (
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkedQR(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setApprovalDialog({ open: false, wo: null, items: {} }); setApprovalRemarks(''); } }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Approve WO? — {approvalDialog.wo?.wo_number}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Vendor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.wo?.vendor_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Institution</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.wo?.project_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Total Amount</Typography>
              <Typography sx={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(calculateWOTotalNet(approvalDialog.wo || {}))}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(approvalDialog.wo?.created_at)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Approval Level</Typography>
              <Typography sx={{ fontWeight: 600 }}>L{approvalDialog.wo?.current_approval_level}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={approvalDialog.wo?.status} size="small" color={statusColor[approvalDialog.wo?.status] || 'default'} /></Box>
            </Grid>
          </Grid>
          {approvalDialog.wo?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {approvalDialog.wo.remarks}
            </Typography>
          )}
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase' }}>Items to Approve</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Qty Requested</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#6366f1' }}>
                  Qty Last Approved {approvalDialog.wo?.current_approval_level > 1 ? `(L${approvalDialog.wo.current_approval_level - 1})` : ''}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#e0e7ff', color: '#1e40af' }}>Qty Approved</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>Remarks</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>History</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvalDialog.wo?.items?.map(item => {
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ fontWeight: 500, color: '#64748B' }}>{item.uom_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: '#6366f1' }}>
                      {item.approved_quantity !== null && item.approved_quantity !== undefined && approvalDialog.wo?.current_approval_level > 1 ? item.approved_quantity : '—'}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: '#eff6ff' }}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder=""
                        value={approvalDialog.items[item.id]?.qty !== undefined ? approvalDialog.items[item.id].qty : ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (item.uom_allow_decimal === false && val.includes('.')) return;
                          setApprovalDialog(prev => ({ ...prev, items: { ...prev.items, [item.id]: { ...(prev.items[item.id] || {}), qty: val } } }));
                        }}
                        onKeyDown={e => {
                          if (item.uom_allow_decimal === false && e.key === '.') e.preventDefault();
                        }}
                        inputProps={{ min: 0, step: item.uom_allow_decimal === false ? "1" : "any", style: { textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' } }}
                        sx={{ width: 90, bgcolor: '#fff' }}
                      />
                    </TableCell>
                    <TableCell align="left" sx={{ bgcolor: '#eff6ff' }}>
                      {(() => {
                        const approvedQty = parseFloat(approvalDialog.items[item.id]?.qty);
                        const isHigher = !isNaN(approvedQty) && approvedQty > item.quantity;
                        return (
                          <TextField
                            size="small"
                            placeholder={isHigher ? 'Required' : ''}
                            value={approvalDialog.items[item.id]?.rem || ''}
                            onChange={e => setApprovalDialog(prev => ({ ...prev, items: { ...prev.items, [item.id]: { ...(prev.items[item.id] || {}), rem: e.target.value } } }))}
                            error={isHigher && !(approvalDialog.items[item.id]?.rem || '').trim()}
                            sx={{ width: 130, bgcolor: '#fff', '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Approval History">
                        <IconButton size="small" onClick={() => fetchApprovalHistory(approvalDialog.wo.id, item.material_id)}
                          sx={{ color: '#6366f1', '&:hover': { bgcolor: '#ede9fe' } }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block', textTransform: 'uppercase' }}>
              General Approval Remarks
            </Typography>
            <TextField inputProps={{ maxLength: 255 }}
              fullWidth size="small" multiline rows={2}
              placeholder="Enter remarks for this approval action..."
              value={approvalRemarks}
              onChange={e => setApprovalRemarks(e.target.value)}
              sx={{ bgcolor: '#fff' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setApprovalDialog({ open: false, wo: null, items: {} }); setApprovalRemarks(''); }}>Cancel</Button>
          <Button
            variant="contained" color="primary" onClick={handleApproveClick} sx={{ fontWeight: 600 }}
            disabled={!approvalDialog.wo?.items?.every(item => {
              const hasQty = approvalDialog.items[item.id]?.qty !== undefined && approvalDialog.items[item.id]?.qty !== '';
              if (!hasQty) return false;
              const approvedQty = parseFloat(approvalDialog.items[item.id]?.qty);
              if (!isNaN(approvedQty) && approvedQty > item.quantity) {
                return !!(approvalDialog.items[item.id]?.rem || '').trim();
              }
              return true;
            })}
          >
            Confirm & Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval History Dialog */}
      <Dialog
        open={historyDialog.open}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setHistoryDialog({ open: false, materialId: null, data: null, loading: false }); }}
        maxWidth="sm" fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <History sx={{ color: '#6366f1' }} />
          Approval History
        </DialogTitle>
        <DialogContent>
          {historyDialog.loading ? (
            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 4 }}>Loading...</Typography>
          ) : historyDialog.data ? (
            <Box>
              {(() => {
                const materialEntries = historyDialog.data.entries?.map(entry => {
                  const matItem = entry.items?.find(i => i.material_id === historyDialog.materialId);
                  return matItem ? { ...entry, material_name: matItem.material_name, material_code: matItem.material_code, uom_name: matItem.uom_name, requested_quantity: matItem.requested_quantity, approved_qty: matItem.approved_quantity, item_remarks: matItem.remarks } : null;
                }).filter(Boolean) || [];

                const firstEntry = materialEntries[0];
                return (
                  <Box>
                    {firstEntry && (
                      <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{firstEntry.material_name}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>{firstEntry.material_code}</Typography>
                        <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                          <Box>
                            <Typography variant="caption" color="textSecondary">Requested Quantity</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{firstEntry.requested_quantity} {firstEntry.uom_name}</Typography>
                          </Box>
                          {materialEntries.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="textSecondary">Last Approved Quantity</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1d4ed8' }}>
                                {materialEntries[materialEntries.length - 1].approved_qty} {firstEntry.uom_name}
                              </Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="caption" color="textSecondary">Current Level</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>L{historyDialog.data.current_approval_level}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {materialEntries.length > 0 ? (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase' }}>Approval Trail</Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f4ff', '& th': { py: 0.75, fontSize: '0.75rem', fontWeight: 700 } }}>
                              <TableCell>Level</TableCell>
                              <TableCell>Approver</TableCell>
                              <TableCell align="right">Qty</TableCell>
                              <TableCell>Date & Time</TableCell>
                              <TableCell>Remarks</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {materialEntries.map((entry, idx) => (
                              <TableRow key={idx} sx={{ '& td': { py: 0.75, fontSize: '0.8rem' } }}>
                                <TableCell>
                                  <Chip label={`L${entry.level}`} size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#ede9fe', color: '#6d28d9' }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{entry.approver_name}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, color: '#1d4ed8' }}>{entry.approved_qty}</TableCell>
                                <TableCell sx={{ color: '#64748B', whiteSpace: 'nowrap' }}>{formatDateTime(entry.approved_at)}</TableCell>
                                <TableCell sx={{ color: '#64748B', fontStyle: entry.item_remarks ? 'normal' : 'italic', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {entry.item_remarks || '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {materialEntries.some(e => e.remarks) && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 1, display: 'block', textTransform: 'uppercase' }}>General Approval Remarks</Typography>
                            {materialEntries.filter(e => e.remarks).map((e, idx) => (
                              <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', display: 'block', mb: 0.5 }}>L{e.level} Approval - {e.approver_name}</Typography>
                                <Typography variant="body2" sx={{ color: '#334155' }}>{e.remarks}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 3 }}>
                        No approval history available for this material yet.
                      </Typography>
                    )}
                  </Box>
                );
              })()}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHistoryDialog({ open: false, materialId: null, data: null, loading: false })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
