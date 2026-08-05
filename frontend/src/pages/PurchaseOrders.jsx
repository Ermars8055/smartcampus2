import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  InputLabel, IconButton, Tooltip, Divider, InputAdornment, Paper, TableSortLabel, useTheme, useMediaQuery,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, Link,
  Accordion, AccordionSummary, AccordionDetails, Tab, Tabs, Autocomplete, FormControlLabel, Checkbox
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

export default function PurchaseOrders() {
  const { showMessage } = useMessage();
  const { hasAction, hasPermission } = useAuth();
  const { tenantConfig } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [linkedIndent, setLinkedIndent] = useState(null);
  const [linkedPR, setLinkedPR] = useState(null);
  const [linkedQR, setLinkedQR] = useState(null);
  const [detailHistoryOpen, setDetailHistoryOpen] = useState(false);
  const [detailHistoryData, setDetailHistoryData] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, po: null, items: {} });
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [historyDialog, setHistoryDialog] = useState({ open: false, materialId: null, data: null, loading: false });
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});
  const [vendorRates, setVendorRates] = useState({});
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload?folder=pos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
      const res = await api.get(`/api/procurement/po/${poId}/approval-history`);
      setHistoryDialog({ open: true, materialId, data: res.data, loading: false });
    } catch (err) {
      showMessage('Failed to load approval history', 'Error', 'error');
      setHistoryDialog({ open: false, materialId: null, data: null, loading: false });
    }
  };

  const submitApproval = async () => {
    const { po, items } = approvalDialog;
    if (!po) return;

    const payloadItems = po.items.map(it => {
      const itemData = items[it.id] || {};
      return {
        po_item_id: it.id,
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
      await api.post(`/api/procurement/po/${po.id}/approve`, {
        items: payloadItems,
        remarks: approvalRemarks || null
      });
      setApprovalDialog({ open: false, po: null, items: {} });
      setApprovalRemarks('');
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error approving PO', 'Approval Failed', 'error');
    }
  };

  const handleApproveClick = () => {
    const { po, items } = approvalDialog;
    if (!po) return;

    let hasLargerQuantity = false;
    const largerItems = [];

    for (const it of po.items) {
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
        type === 'po' ? `/api/procurement/po/${id}/approval-history` :
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
  const [editingPOId, setEditingPOId] = useState(null);
  const [form, setForm] = useState({
    po_number: '', vendor_id: '', project_id: '', institution_id: '', delivery_date: null, terms: '', annexure: '', purchase_mode: '', marketplace_name: '', advance_percentage: 0,
    procurement_type: '', rental_type: '', rental_agreement_number: '', rental_agreement_document: '', rental_start_date: null, rental_end_date: null, billing_frequency: '', security_deposit: 0, cost_per_test: '', linked_reagent_agreement: '', vendor_maintenance_responsibility: false, return_conditions: '', renewal_terms: '',
    items: [{ material_id: '', quantity: '', rate: '', discount_percent: '', cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }]
  });

  useEffect(() => {
    if (form.vendor_id) {
      api.get(`/api/contracts/active-rates/${form.vendor_id}`)
        .then(res => {
          setVendorRates(res.data);
          setForm(prevForm => {
            const newItems = prevForm.items.map(it => {
              if (it.material_id) {
                const contractRate = res.data[it.material_id];
                const mat = materials.find(m => m.id === it.material_id);
                const baseRate = contractRate !== undefined ? contractRate : (mat?.standard_cost || 0);
                const newRate = contractRate !== undefined ? contractRate : (mat?.standard_cost || 0);
                return { 
                  ...it, 
                  base_rate: baseRate, 
                  rate: newRate 
                };
              }
              return it;
            });
            return { ...prevForm, items: newItems };
          });
        })
        .catch(err => {
          console.error("Error fetching vendor active rates", err);
          setVendorRates({});
        });
    } else {
      setVendorRates({});
    }
  }, [form.vendor_id, materials]);



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

  const filteredPOsBase = useMemo(() => {
    let list = pos;
    const projId = searchParams.get('proj');
    if (projId) {
      list = list.filter(po => po.project_id === parseInt(projId, 10));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(po =>
        (po.po_number && po.po_number.toLowerCase().includes(s)) ||
        (po.indent_number && po.indent_number.toLowerCase().includes(s)) ||
        (po.pr_number && po.pr_number.toLowerCase().includes(s)) ||
        (po.qr_number && po.qr_number.toLowerCase().includes(s))
      );
    }
    if (filterVendor) {
      list = list.filter(po => po.vendor_id === filterVendor.id);
    }
    if (filterProcurementType) {
      list = list.filter(po => po.procurement_type === filterProcurementType);
    }
    return list;
  }, [pos, search, filterVendor, filterProcurementType, searchParams]);

  const calculatePOTotalNet = (po) => {
    if (!po || !po.items) return 0;
    let totalNetAmountSum = 0;
    po.items.forEach(item => {
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

  const sortedPOs = useMemo(() => {
    let list = filteredPOsBase.filter(po => {
      if (tabValue === 'All') return true;
      if (tabValue === 'Pending') return ['Draft', 'Submitted', 'Approved', 'Sent to Vendor'].includes(po.status);
      return po.status === tabValue;
    });

    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'vendor') aVal = a.vendor_name;
        if (sortConfig.key === 'vendor') bVal = b.vendor_name;
        if (sortConfig.key === 'total_amount') {
          aVal = calculatePOTotalNet(a);
          bVal = calculatePOTotalNet(b);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [filteredPOsBase, sortConfig, tabValue]);



  const formatCurrency = (amount) => {
    return '₹' + new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false, po: null });
  const [reason, setReason] = useState('');

  // Email preview dialog state
  const [emailPreview, setEmailPreview] = useState({ open: false, loading: false, data: null, po: null, cc: '', bcc: '', sending: false });

  const handleRowClick = (po) => {
    if (po.status === 'Draft') {
      setForm({
        po_number: po.po_number || '',
        vendor_id: po.vendor_id || '',
        project_id: po.project_id || (projects.length > 0 ? projects[0].id : ''),
        institution_id: po.institution_id || '',
        delivery_date: po.delivery_date ? dayjs(po.delivery_date) : null,
        terms: po.terms || '',
        annexure: po.annexure || '',
        purchase_mode: po.purchase_mode || '',
        marketplace_name: po.marketplace_name || '',
        advance_percentage: po.advance_percentage || 0,
        procurement_type: po.procurement_type || '',
        rental_type: po.rental_type || '',
        rental_agreement_number: po.rental_agreement_number || '',
        rental_agreement_document: po.rental_agreement_document || '',
        rental_start_date: po.rental_start_date ? dayjs(po.rental_start_date) : null,
        rental_end_date: po.rental_end_date ? dayjs(po.rental_end_date) : null,
        billing_frequency: po.billing_frequency || '',
        security_deposit: po.security_deposit || 0,
        cost_per_test: po.cost_per_test || '',
        linked_reagent_agreement: po.linked_reagent_agreement || '',
        vendor_maintenance_responsibility: po.vendor_maintenance_responsibility || false,
        return_conditions: po.return_conditions || '',
        renewal_terms: po.renewal_terms || '',
        items: po.items && po.items.length > 0 ? po.items.map(it => ({
          material_id: it.material_id,
          quantity: it.quantity,
          rate: it.rate,
          discount_percent: it.discount_percent || 0,
          cgst_percentage: it.cgst_percentage || 0,
          sgst_percentage: it.sgst_percentage || 0,
          igst_percentage: it.igst_percentage || 0,
          is_gst_inclusive: it.is_gst_inclusive || false,
          uom_name: it.uom_name || '',
          base_rate: materials.find(m => m.id === it.material_id)?.standard_cost || 0
        })) : [{ material_id: '', quantity: '', rate: '', discount_percent: '', cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }]
      });
      setEditingPOId(po.id);
      setItemErrors({});
      setDialog(true);
    } else {
      setDetailDialog(po);
    }
  };

  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false, po = null) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason, po });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); setReason(''); };
  const handleCancelConfirm = (e, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setConfirm({ ...confirm, open: false }); setReason(''); };

  const load = () => { api.get('/api/procurement/po').then(r => setPos(r.data)); };
  useEffect(() => {
    load();
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/institutions').then(r => setInstitutions(r.data));
    api.get('/api/terms').then(r => setTermsTemplates(r.data));
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
        procurement_type: '', rental_type: '', rental_agreement_number: '', rental_start_date: null, rental_end_date: null, billing_frequency: '', security_deposit: 0, cost_per_test: '', linked_reagent_agreement: '', vendor_maintenance_responsibility: false, return_conditions: '', renewal_terms: '',
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
    if (location.state?.openPOId && pos.length > 0) {
      const poToOpen = pos.find(p => p.id === location.state.openPOId);
      if (poToOpen) {
        if (poToOpen.can_user_approve && hasAction('purchase_orders', 'can_approve')) {
          setApprovalDialog({ open: true, po: poToOpen, items: {} });
        } else {
          setDetailDialog(poToOpen);
        }
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, pos, location.pathname, navigate, hasAction]);

  const addItem = () => {
    const emptyCount = form.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", "Limit Reached", "warning");
      return;
    }
    setForm({ ...form, items: [...form.items, { material_id: '', quantity: '', rate: '', discount_percent: '', cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }] });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    let finalVal = val;
    if (field === 'rate' && finalVal !== '') {
      const parts = String(finalVal).split('.');
      if (parts[1] && parts[1].length > 2) {
        finalVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
      }
    }
    if (['discount_percent', 'cgst_percentage', 'sgst_percentage', 'igst_percentage'].includes(field)) {
      if (finalVal !== '' && parseFloat(finalVal) > 100) {
        finalVal = '100';
      }
    }
    const items = [...form.items];
    items[i] = { ...items[i], [field]: finalVal };
    if (field === 'cgst_percentage') {
      items[i].sgst_percentage = finalVal;
      items[i].igst_percentage = 0;
    } else if (field === 'sgst_percentage') {
      items[i].cgst_percentage = finalVal;
      items[i].igst_percentage = 0;
    } else if (field === 'igst_percentage') {
      if (finalVal !== '' && finalVal !== '0' && parseFloat(finalVal) !== 0) {
        items[i].cgst_percentage = 0;
        items[i].sgst_percentage = 0;
      }
    }
    if (field === 'material_id') {
      const mat = materials.find(m => m.id === finalVal);
      if (mat) {
        items[i].uom_name = mat.uom_name || '';
        const contractRate = vendorRates[finalVal];
        items[i].base_rate = contractRate !== undefined ? contractRate : (mat.standard_cost || 0);
        if (contractRate !== undefined) {
          items[i].rate = contractRate;
        }
      }
    }
    setForm({ ...form, items });
  };

  const handleSave = async (isDraft = false) => {
    const newErrors = {};
    if (!form.vendor_id) newErrors.vendor_id = "Please select a Vendor.";
    if (!form.purchase_mode) newErrors.purchase_mode = "Purchase Mode is required.";
    if (!form.procurement_type) newErrors.procurement_type = "Procurement Type is required.";
    if (!form.project_id) newErrors.project_id = "Project is required.";
    if (!form.institution_id) newErrors.institution_id = "Institution is required.";
    if (!form.delivery_date) {
      newErrors.delivery_date = "Delivery Date is required.";
    } else if (dayjs(form.delivery_date).isBefore(dayjs(), 'day')) {
      newErrors.delivery_date = "Delivery Date cannot be in the past.";
    }
    if (!form.terms || !form.terms.trim()) newErrors.terms = "Terms and Conditions are mandatory.";

    if (form.advance_percentage !== '' && (parseFloat(form.advance_percentage) < 0 || parseFloat(form.advance_percentage) > 100)) {
      newErrors.advance_percentage = "Advance percentage must be between 0 and 100.";
    }

    if (form.items.length === 0) {
      newErrors.items = "Please add at least one line item.";
    }

    const newItemErrors = {};
    form.items.forEach((it, i) => {
      const qty = parseFloat(it.quantity) || 0;
      const rate = parseFloat(it.rate) || 0;
      let rowErrors = {};
      
      if (!it.material_id) rowErrors.material_id = 'Material is required';
      if (qty <= 0) rowErrors.quantity = 'Quantity must be > 0';
      if (rate <= 0) rowErrors.rate = 'Rate must be > 0';
      
      if (Object.keys(rowErrors).length > 0) {
        newItemErrors[i] = rowErrors;
      }
    });

    setErrors(newErrors);
    setItemErrors(newItemErrors);

    if (Object.keys(newErrors).length > 0 || Object.keys(newItemErrors).length > 0) {
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        const el = document.getElementById(`field-${firstErrorField}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (Object.keys(newItemErrors).length > 0) {
        const firstErrorIdx = Object.keys(newItemErrors)[0];
        const el = document.getElementById(`item-row-${firstErrorIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      const mappedItems = form.items.map(it => {
        const inputRate = parseFloat(it.rate) || 0;
        const totalGstPercent = (parseFloat(it.cgst_percentage) || 0) + (parseFloat(it.sgst_percentage) || 0) + (parseFloat(it.igst_percentage) || 0);
        return {
          material_id: parseInt(it.material_id, 10),
          quantity: parseFloat(it.quantity) || 0,
          rate: inputRate,
          discount_percent: parseFloat(it.discount_percent) || 0,
          cgst_percentage: parseFloat(it.cgst_percentage) || 0,
          sgst_percentage: parseFloat(it.sgst_percentage) || 0,
          igst_percentage: parseFloat(it.igst_percentage) || 0,
          is_gst_inclusive: it.is_gst_inclusive || false
        };
      });
      const payload = {
        ...form,
        vendor_id: parseInt(form.vendor_id, 10),
        project_id: parseInt(form.project_id, 10),
        institution_id: parseInt(form.institution_id, 10),
        advance_percentage: parseFloat(form.advance_percentage) || 0,
        delivery_date: form.delivery_date ? dayjs(form.delivery_date).format('YYYY-MM-DD') : null,
        procurement_type: form.procurement_type || '',
        rental_type: form.procurement_type === 'Rental' ? form.rental_type || null : null,
        rental_start_date: (form.procurement_type === 'Rental' && form.rental_start_date) ? dayjs(form.rental_start_date).format('YYYY-MM-DD') : null,
        rental_end_date: (form.procurement_type === 'Rental' && form.rental_end_date) ? dayjs(form.rental_end_date).format('YYYY-MM-DD') : null,
        rental_agreement_number: form.procurement_type === 'Rental' ? form.rental_agreement_number || null : null,
        rental_agreement_document: form.procurement_type === 'Rental' ? form.rental_agreement_document || null : null,
        billing_frequency: form.procurement_type === 'Rental' ? form.billing_frequency || null : null,
        security_deposit: form.procurement_type === 'Rental' ? parseFloat(form.security_deposit) || 0 : 0,
        cost_per_test: (form.procurement_type === 'Rental' && form.rental_type === 'Cost Per Test') ? (form.cost_per_test ? parseFloat(form.cost_per_test) : null) : null,
        linked_reagent_agreement: form.procurement_type === 'Rental' ? form.linked_reagent_agreement || null : null,
        vendor_maintenance_responsibility: form.procurement_type === 'Rental' ? form.vendor_maintenance_responsibility : false,
        return_conditions: form.procurement_type === 'Rental' ? form.return_conditions || null : null,
        renewal_terms: form.procurement_type === 'Rental' ? form.renewal_terms || null : null,
        status: isDraft ? 'Draft' : 'Submitted',
        items: mappedItems
      };

      let res;
      if (editingPOId) {
        res = await api.put(`/api/procurement/po/${editingPOId}`, payload);
        const poNumber = res?.data?.po_number || form.po_number || '';
        showMessage(`Purchase Order ${poNumber} ${isDraft ? 'draft updated' : 'updated and submitted'}`.trim(), "Success", "success");
      } else {
        res = await api.post('/api/procurement/po', payload);
        const poNumber = res?.data?.po_number || '';
        showMessage(`Purchase Order ${poNumber} ${isDraft ? 'draft saved' : 'created'}`.trim(), "Success", "success");
      }

      setDialog(false);
      setEditingPOId(null);
      load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error', "Error", "error"); }
  };

  const approvePO = async (id) => { await api.post(`/api/procurement/po/${id}/approve`); load(); };
  const rejectPO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/reject`, { remarks }); load(); };
  const openEmailPreview = async (po) => {
    setEmailPreview({ open: true, loading: true, data: null, po, cc: '', bcc: '', sending: false });
    try {
      const res = await api.get(`/api/procurement/po/${po.id}/email-preview`);
      setEmailPreview(prev => ({ ...prev, loading: false, data: res.data }));
    } catch (err) {
      showMessage('Failed to load email preview', 'Error', 'error');
      setEmailPreview(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  const handleSendWithEmail = async () => {
    const po = emailPreview.po;
    setEmailPreview(prev => ({ ...prev, sending: true }));
    try {
      const res = await api.post(`/api/procurement/po/${po.id}/send`, {
        cc: emailPreview.cc,
        bcc: emailPreview.bcc,
      });
      const emailInfo = res.data.email_status ? `\n${res.data.email_status}` : '';
      showMessage(res.data.message + emailInfo, "PO EMAIL SEND", "success");
      setEmailPreview({ open: false, loading: false, data: null, po: null, cc: '', bcc: '', sending: false });
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error sending PO", "Error", "error");
      setEmailPreview(prev => ({ ...prev, sending: false }));
    }
  };
  const shortClosePO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/short-close`, { remarks }); load(); };
  const cancelPO = async (id, remarks) => { await api.post(`/api/procurement/po/${id}/cancel`, { remarks }); load(); };

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
  const canCancel = (s) => s === 'Draft' || s === 'Submitted';

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

  const handlePrintPO = (poToPrint = null) => {
    const po = poToPrint || detailDialog;
    if (!po) return;
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    let grandTotal = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTaxable = 0;
    let totalNetAmountSum = 0;

    po.items.forEach((item, idx) => {
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
          <td>${item.material_name}</td>
          <td>-</td>
          <td>${item.uom_allow_decimal ? qty.toFixed(2) : Math.round(qty)}</td>
          <td>${item.uom_name || 'NOS'}</td>
          <td style="text-align:right">${rate.toFixed(2)}</td>
          <td style="text-align:right">${(item.discount_percent || 0).toFixed(2)}</td>
          <td style="text-align:right">${(item.cgst_percentage || 0).toFixed(2)}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align:right">${(item.sgst_percentage || 0).toFixed(2)}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align:right">${(item.igst_percentage || 0).toFixed(2)}<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align:right">${itemBaseAmount.toFixed(2)}</td>
        </tr>
      `;
    });

    const grandTotalWithTax = totalNetAmountSum;
    const roundOff = (Math.round(grandTotalWithTax) - grandTotalWithTax).toFixed(2);
    const totalNetAmount = Math.round(grandTotalWithTax).toFixed(2);
    const activeTerms = po.terms || termsTemplates.find(t => t.is_default)?.content || (termsTemplates.length > 0 ? termsTemplates[0].content : '');
    const termsHtml = (activeTerms || '').split('\n').filter(t => t.trim()).map(t => `<li>${t}</li>`).join('');
    const annexureHtml = po.annexure ? (po.annexure.includes('<') ? po.annexure : po.annexure.replace(/\n/g, '<br/>')) : '';

    const html = `
      <html>
        <head>
          <title>PO - ${po.po_number}</title>
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
            <h2 class="org-title">${po.institution_name || 'EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER'}</h2>
            <p class="org-address">113, JNANA PRABHA CAMPUS, BIDARAHALLI, VIRGO NAGAR POST, BANGALORE - 560049</p>
            <div class="doc-title">PURCHASE ORDER</div>
          </div>
          
          <table class="info-table">
            <tr>
              <td style="width: 50%;">
                <b>To,</b><br/>
                <b>M/S. ${po.vendor_name ? (po.vendor_name.includes(' - ') ? po.vendor_name.split(' - ').slice(1).join(' - ') : po.vendor_name) : 'VENDOR'}</b><br/>
                ${po.vendor_address ? `<span style="font-size: 10px; color: #333;">${po.vendor_address}</span><br/>` : ''}
                ${(po.vendor_city || po.vendor_state || po.vendor_pincode) ? `<span style="font-size: 10px; color: #333;">${[po.vendor_city, po.vendor_state ? po.vendor_state.replace(/^\\d{2}\\s*-\\s*/, '').trim() : '', po.vendor_pincode ? '- ' + po.vendor_pincode : ''].filter(Boolean).join(' ')}</span><br/>` : ''}
                ${po.vendor_gst_number ? `<span style="font-size: 10px; color: #333;">GSTIN: ${po.vendor_gst_number}</span><br/>` : ''}
              </td>
              <td style="width: 50%;">
                <table style="width: 100%">
                  <tr><td style="width: 45%">PO Number</td><td>: <b>${po.po_number}</b></td></tr>
                  <tr><td>PO Date</td><td>: ${formatDate(po.created_at)}</td></tr>
                  <tr><td>Procurement Type</td><td>: <b>${po.procurement_type === 'Purchase' ? 'Standard Purchase' : (po.procurement_type === 'Rental' ? 'Rental' + (po.rental_type ? ' (' + po.rental_type + ')' : '') : (po.procurement_type || '—'))}</b></td></tr>
                  ${po.purchase_mode ? `<tr><td>Purchase Mode</td><td>: <b>${po.purchase_mode}</b></td></tr>` : ''}
                  ${po.advance_percentage > 0 ? `<tr><td>Advance</td><td>: <b>${po.advance_percentage}%</b></td></tr>` : ''}
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
                <tr><td style="text-align:right">Total Amount</td><td style="text-align:right; width: 100px;">: ${(totalTaxable + totalDiscount).toFixed(2)}</td></tr>
                <tr><td style="text-align:right; color: #d97706;">Less: Discount</td><td style="text-align:right; color: #d97706;">: ${totalDiscount.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Taxable Amount</td><td style="text-align:right">: ${totalTaxable.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Add: CGST</td><td style="text-align:right">: ${totalCgst.toFixed(2)}</td></tr>
                <tr><td style="text-align:right">Add: SGST</td><td style="text-align:right">: ${totalSgst.toFixed(2)}</td></tr>
                ${totalIgst > 0 ? `<tr><td style="text-align:right">Add: IGST</td><td style="text-align:right">: ${totalIgst.toFixed(2)}</td></tr>` : ''}
                <tr><td style="text-align:right">Round Off</td><td style="text-align:right">: ${roundOff}</td></tr>
                <tr><td style="text-align:right"><b>Total Net Amount</b></td><td style="text-align:right"><b>: ${totalNetAmount}</b></td></tr>
                ${po.advance_percentage > 0 ? `
                  <tr><td style="text-align:right; color: #d97706;">Less: Advance (${po.advance_percentage}%)</td><td style="text-align:right; color: #d97706;">: ${Math.round((Math.round(grandTotalWithTax) * po.advance_percentage) / 100).toFixed(2)}</td></tr>
                  <tr><td style="text-align:right; font-size: 13px;"><b>Balance Amount</b></td><td style="text-align:right; font-size: 13px;"><b>: ${(Math.round(grandTotalWithTax) - Math.round((Math.round(grandTotalWithTax) * po.advance_percentage) / 100)).toFixed(2)}</b></td></tr>
                ` : ''}
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
          </div>

          ${annexureHtml ? `
          <div class="print-wrapper" style="margin-top: 20px; page-break-before: always; break-before: page;">
            <h3 style="text-decoration: underline; text-align: center; margin-bottom: 20px;">ANNEXURE FOR ${po.po_number}</h3>
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
    const roundOff = (Math.round(grandTotalWithTax) - grandTotalWithTax).toFixed(2);
    const totalNetAmount = Math.round(grandTotalWithTax).toFixed(2);
    const activeTerms = detailDialog.terms || termsTemplates.find(t => t.is_default)?.content || (termsTemplates.length > 0 ? termsTemplates[0].content : '');

    const advancePercentage = detailDialog.advance_percentage || 0;
    const advanceAmount = Math.round((Math.round(grandTotalWithTax) * advancePercentage) / 100).toFixed(2);
    const balanceAmount = (Math.round(grandTotalWithTax) - parseFloat(advanceAmount)).toFixed(2);

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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Purchase Orders</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{pos.length} orders</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {location.state?.fromDashboard && (
            <Button size="small" variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          )}
          {hasPermission('purchase_orders', 'can_create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              setForm({ po_number: '', vendor_id: '', project_id: projects[0]?.id || '', institution_id: '', delivery_date: null, terms: '', annexure: '', rental_agreement_document: null, items: [{ material_id: '', quantity: '', rate: '', discount_percent: '', cgst_percentage: 0, sgst_percentage: 0, igst_percentage: 0, is_gst_inclusive: false, uom_name: '', base_rate: 0 }] });
              setItemErrors({});
              setDialog(true);
            }}>Create PO</Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search PO/PR/Quotation Numbers..." value={search}
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
          {['Draft', 'Submitted', 'Approved', 'Sent to Vendor', 'Partially Received', 'Closed', 'Short Closed', 'Cancelled', 'Rejected', 'Pending', 'All'].map(s => (
            <Tab
              key={s}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s}
                  <Chip
                    label={
                      s === 'All' ? filteredPOsBase.length :
                        s === 'Pending' ? filteredPOsBase.filter(po => ['Draft', 'Submitted', 'Approved', 'Sent to Vendor'].includes(po.status)).length :
                          filteredPOsBase.filter(po => po.status === s).length
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
            {sortedPOs.length === 0 && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No purchase orders found.
              </Typography>
            )}
            {sortedPOs.map(po => (
              <Card key={po.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => handleRowClick(po)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>
                    {po.po_number}
                    {po.procurement_type === 'Rental' && po.rental_type !== 'Cost Per Test' && (
                      <Assignment sx={{ fontSize: 14, color: '#0EA5E9', ml: 0.5, verticalAlign: 'middle' }} />
                    )}
                    {po.procurement_type === 'Rental' && po.rental_type === 'Cost Per Test' && (
                      <Science sx={{ fontSize: 14, color: '#8B5CF6', ml: 0.5, verticalAlign: 'middle' }} />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Chip label={`L${po.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                    <Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Vendor:</strong> {po.vendor_name}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Amount:</strong> <span style={{ color: '#059669', fontWeight: 600 }}>{formatCurrency(calculatePOTotalNet(po))}</span></Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(po.created_at)} • {po.items?.length || 0} items</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Approve">
                      <span><IconButton size="small" color="success" disabled={!po.can_user_approve || !hasAction('purchase_orders', 'can_approve')}
                        onClick={() => setApprovalDialog({ open: true, po, items: {} })}>
                        <CheckCircle fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <span><IconButton size="small" color="error" disabled={!canReject(po.status) || !hasAction('purchase_orders', 'can_reject')}
                        onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                        <Cancel fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Send to Vendor">
                      <span><IconButton size="small" disabled={!canSend(po.status) || !hasAction('purchase_orders', 'can_send_to_vendor')}
                        sx={{ color: '#8b5cf6', '&.Mui-disabled': { color: 'text.disabled' } }}
                        onClick={() => openEmailPreview(po)}>
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
                      active={sortConfig.key === 'po_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('po_number')}
                    >
                      PO No
                    </TableSortLabel>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'pr_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('pr_number')}
                    >
                      PR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'qr_number'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('qr_number')}
                    >
                      QUOTATION
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
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>
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
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>DELIVERY</TableCell>
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
                {sortedPOs.map(po => (
                  <TableRow key={po.id} sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f1f5f9' } }} onClick={() => handleRowClick(po)}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                      {po.po_number}
                      {po.procurement_type === 'Rental' && po.rental_type !== 'Cost Per Test' && (
                        <Tooltip title="Rental Agreement">
                          <Assignment sx={{ fontSize: 14, color: '#0EA5E9', ml: 0.5, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                      {po.procurement_type === 'Rental' && po.rental_type === 'Cost Per Test' && (
                        <Tooltip title={`Cost Per Test: ₹${po.cost_per_test || 0}`}>
                          <Science sx={{ fontSize: 14, color: '#8B5CF6', ml: 0.5, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {po.pr_number ? (
                        <Link component="button" variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#7c3aed', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} onClick={(e) => { e.stopPropagation(); fetchAndShowPR(po.pr_id); }}>
                          {po.pr_number}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {po.qr_number ? (
                        <Link component="button" variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#d97706', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} onClick={(e) => { e.stopPropagation(); fetchAndShowQR(po.qr_id); }}>
                          {po.qr_number}
                        </Link>
                      ) : '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>{po.vendor_name}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.7rem' }}>{po.items?.length || 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{formatCurrency(calculatePOTotalNet(po))}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDate(po.delivery_date)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><Chip label={po.status} size="small" color={statusColor[po.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.6rem', height: 18 }} /></TableCell>
                    <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                      <Chip label={`L${po.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Approve">
                          <span><IconButton size="small" color="success" disabled={!po.can_user_approve || !hasAction('purchase_orders', 'can_approve')}
                            onClick={() => setApprovalDialog({ open: true, po, items: {} })}>
                            <CheckCircle fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span><IconButton size="small" color="error" disabled={!canReject(po.status) || !hasAction('purchase_orders', 'can_reject')}
                            onClick={() => showConfirm('Reject PO?', `Are you sure you want to reject ${po.po_number}? This action cannot be undone.`, 'Yes, Reject', 'error', (r) => rejectPO(po.id, r), true)}>
                            <Cancel fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Send to Vendor">
                          <span><IconButton size="small" disabled={!canSend(po.status) || !hasAction('purchase_orders', 'can_send_to_vendor')}
                            sx={{ color: '#8b5cf6', '&.Mui-disabled': { color: 'text.disabled' } }}
                            onClick={() => openEmailPreview(po)}>
                            <Send fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Short Close">
                          <span><IconButton size="small" color="warning" disabled={!canShortClose(po.status) || !hasAction('purchase_orders', 'can_short_close')}
                            onClick={() => showConfirm('Short Close PO?', `Short close ${po.po_number}? This cannot be undone.`, 'Yes, Short Close', 'warning', (r) => shortClosePO(po.id, r), true)}>
                            <Archive fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <span><IconButton size="small" color="error" disabled={!canCancel(po.status) || !hasPermission('purchase_orders', 'can_update')}
                            onClick={() => showConfirm('Cancel PO?', `Cancel ${po.po_number}? This cannot be undone.`, 'Yes, Cancel PO', 'error', (r) => cancelPO(po.id, r), true)}>
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

      {/* PO Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDetailDialog(null); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.po_number} — Order Details</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>VENDOR</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.vendor_name}</Typography>
                {detailDialog?.vendor_gst_number && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>GSTIN: {detailDialog.vendor_gst_number}</Typography>
                )}
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PR</Typography>
                {detailDialog?.pr_number ? (
                  <Link component="button" variant="body2" sx={{ fontWeight: 600, color: '#7c3aed', fontSize: '0.9rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} onClick={(e) => { e.stopPropagation(); fetchAndShowPR(detailDialog.pr_id); }}>
                    {detailDialog.pr_number}
                  </Link>
                ) : (
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>-</Typography>
                )}
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>QUOTATION</Typography>
                {detailDialog?.qr_number ? (
                  <Link component="button" variant="body2" sx={{ fontWeight: 600, color: '#d97706', fontSize: '0.9rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }} onClick={(e) => { e.stopPropagation(); fetchAndShowQR(detailDialog.qr_id); }}>
                    {detailDialog.qr_number}
                  </Link>
                ) : (
                  <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>-</Typography>
                )}
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>STATUS</Typography>
                <Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
              </Grid>

              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>INSTITUTION</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.institution_name || '—'}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PROCUREMENT TYPE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                   {detailDialog?.procurement_type === 'Purchase' ? 'Standard Purchase' : (detailDialog?.procurement_type || '—')}
                   {detailDialog?.procurement_type === 'Rental' && detailDialog?.rental_type ? ` (${detailDialog.rental_type})` : ''}
                </Typography>
                {detailDialog?.billing_frequency && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Billing: {detailDialog.billing_frequency}</Typography>
                )}
                {detailDialog?.cost_per_test > 0 && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Cost/Test: ₹{detailDialog.cost_per_test}</Typography>
                )}
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PURCHASE MODE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{detailDialog?.purchase_mode || '—'}</Typography>
                {detailDialog?.marketplace_name && <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Marketplace: {detailDialog.marketplace_name}</Typography>}
                {detailDialog?.advance_percentage > 0 && <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Advance: {detailDialog.advance_percentage}%</Typography>}
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>PO DATE</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.created_at)}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>DELIVERY</Typography>
                <Typography sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{formatDate(detailDialog?.delivery_date) || '-'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>TOTAL NET AMOUNT</Typography>
                <Typography sx={{ fontWeight: 700, color: '#059669', fontSize: '1.2rem' }}>{formatCurrency(calculatePOTotalNet(detailDialog))}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>Material Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Sr. No.</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Item Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>HSN Code</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>REQ QTY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>APPROVED QTY</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>UOM</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>RATE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Disc. %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>CGST %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>SGST %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>IGST %</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Item Amt.</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Received</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detailDialog?.items?.map((item, idx) => {
                    const effQty = item.approved_quantity !== null && item.approved_quantity !== undefined ? item.approved_quantity : item.quantity;
                    const qty = parseFloat(effQty) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const amount = qty * rate;
                    return (
                      <TableRow key={item.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {item.material_name}<br />
                          <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>-</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{parseFloat(item.quantity || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8' }}>
                          {item.approved_quantity !== null && item.approved_quantity !== undefined ? parseFloat(item.approved_quantity).toFixed(2) : '-'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{item.uom_name || 'NOS'}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{rate.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>{(item.discount_percent || 0).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {(item.cgst_percentage || 0).toFixed(2)}<br /><Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>{item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {(item.sgst_percentage || 0).toFixed(2)}<br /><Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>{item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
                          {(item.igst_percentage || 0).toFixed(2)}<br /><Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>{item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                          {(() => {
                            const totalGst = (item.cgst_percentage || 0) + (item.sgst_percentage || 0) + (item.igst_percentage || 0);
                            let itemBaseAmount = amount;
                            if (item.is_gst_inclusive && totalGst > 0) {
                              itemBaseAmount = amount / (1 + (totalGst / 100));
                            }
                            return itemBaseAmount.toFixed(2);
                          })()}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={item.received_quantity} size="small" color={item.received_quantity >= item.quantity ? 'success' : 'warning'} sx={{ fontSize: '0.65rem', height: 20 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {detailData && (
              <Box sx={{ mt: 3, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'flex-end', alignItems: 'flex-start', borderBottom: '1px dashed #cbd5e1', pb: 2, gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '40%' } }}>
                  <Table size="small" sx={{ '& td': { borderBottom: 'none', py: 0.5, px: 1 } }}>
                    <TableBody>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Total Amount</TableCell>
                        <TableCell align="right" sx={{ width: '120px' }}>: {(detailData.totalTaxable + detailData.totalDiscount).toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#d97706', fontWeight: 600 }}>Less: Discount</TableCell>
                        <TableCell align="right" sx={{ color: '#d97706' }}>: {detailData.totalDiscount.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Taxable Amount</TableCell>
                        <TableCell align="right">: {detailData.totalTaxable.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Add: CGST</TableCell>
                        <TableCell align="right">: {detailData.totalCgst.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Add: SGST</TableCell>
                        <TableCell align="right">: {detailData.totalSgst.toFixed(2)}</TableCell>
                      </TableRow>
                      {detailData.totalIgst > 0 && (
                        <TableRow>
                          <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Add: IGST</TableCell>
                          <TableCell align="right">: {detailData.totalIgst.toFixed(2)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>Round Off</TableCell>
                        <TableCell align="right">: {detailData.roundOff}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Total Net Amount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>: {detailData.totalNetAmount}</TableCell>
                      </TableRow>
                      {detailData.advancePercentage > 0 && (
                        <>
                          <TableRow>
                            <TableCell align="right" sx={{ color: '#d97706', fontWeight: 600 }}>Less: Advance ({detailData.advancePercentage}%)</TableCell>
                            <TableCell align="right" sx={{ color: '#d97706', fontWeight: 600 }}>: {detailData.advanceAmount}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>Balance Amount</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>: {detailData.balanceAmount}</TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}

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



            {/* Collapsible Approval History Section for PO */}
            {detailDialog?.status !== 'Draft' && (
              <Box sx={{ mt: 3 }}>
                <Accordion
                  expanded={detailHistoryOpen}
                  onChange={() => {
                    if (!detailHistoryOpen && detailDialog?.id) {
                      fetchDetailHistory(detailDialog.id, 'po');
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
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', display: 'block', mb: 1 }}>ANNEXURE FOR {detailDialog?.po_number}:</Typography>
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
            <Button onClick={() => handlePrintPO()} variant="contained" sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', mr: 2, bgcolor: '#2563EB' }}>Print PO</Button>
          )}
          <Button onClick={() => { setDetailDialog(null); setDetailHistoryOpen(false); setDetailHistoryData(null); }} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={dialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(false); }} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{editingPOId ? `Edit Draft Purchase Order — ${form.po_number || 'Unknown'}` : 'Create Purchase Order'}</Typography>
              <Typography variant="body2" color="text.secondary">Issue a new purchase order to the vendor.</Typography>
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
                startAdornment={<InputAdornment position="start"><Store sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {institutions.map(inst => (
                  <MenuItem key={inst.id} value={inst.id}>{inst.code} - {inst.name}</MenuItem>
                ))}
              </Select>
              {errors.institution_id && <Typography variant="caption" color="error" sx={{mt: 0.5, ml: 1}}>{errors.institution_id}</Typography>}
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

                  const updatedItems = form.items.map(it => {
                    const material = materials.find(m => m.id === it.material_id);
                    if (!material) return it;
                    const gstRate = material.gst_rate || 0;
                    const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
                      gstRate, vendorState, tenantConfig?.base_state,
                      tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent
                    );
                    return { ...it, cgst_percentage, sgst_percentage, igst_percentage };
                  });

                  setForm({ ...form, vendor_id: vId, items: updatedItems });
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

            <FormControl fullWidth size="small" error={!!errors.procurement_type}>
              <InputLabel>Procurement Type *</InputLabel>
              <Select
                value={form.procurement_type || ''}
                label="Procurement Type *"
                onChange={e => {
                  const val = e.target.value;
                  setForm(prev => {
                    let newMode = prev.purchase_mode;
                    if (val === 'Rental' && newMode !== 'Credit Purchase' && newMode !== 'Advance Payment') {
                      newMode = '';
                    }
                    return { 
                      ...prev, 
                      procurement_type: val, 
                      rental_type: val === 'Rental' ? 'Equipment Rental' : '',
                      purchase_mode: newMode
                    };
                  });
                }}
              >
                <MenuItem value="" disabled><em>Select Type</em></MenuItem>
                <MenuItem value="Purchase">Standard Purchase</MenuItem>
                <MenuItem value="Rental">Rental</MenuItem>
              </Select>
              {errors.procurement_type && <FormHelperText>{errors.procurement_type}</FormHelperText>}
            </FormControl>

            {form.procurement_type === 'Rental' && (
              <FormControl fullWidth size="small">
                <InputLabel>Rental Model</InputLabel>
                <Select
                  value={form.rental_type || 'Equipment Rental'}
                  label="Rental Model"
                  onChange={e => setForm({ ...form, rental_type: e.target.value })}
                >
                  <MenuItem value="Equipment Rental">Equipment Rental</MenuItem>
                  <MenuItem value="Cost Per Test">Cost Per Test</MenuItem>
                  <MenuItem value="Reagent Rental">Reagent Rental</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth size="small" error={!!errors.purchase_mode}>
              <InputLabel>Purchase Mode *</InputLabel>
              <Select
                value={form.purchase_mode || ''}
                label="Purchase Mode *"
                onChange={e => {
                  const val = e.target.value;
                  setForm({ 
                    ...form, 
                    purchase_mode: val, 
                    advance_percentage: val === 'Advance Payment' ? form.advance_percentage : 0,
                    marketplace_name: val === 'Online Marketplace' ? form.marketplace_name : '' 
                  });
                }}
              >
                <MenuItem value="" disabled><em>Select Mode</em></MenuItem>
                <MenuItem value="Credit Purchase">Credit Purchase</MenuItem>
                {form.procurement_type !== 'Rental' && <MenuItem value="Cash Purchase">Cash Purchase</MenuItem>}
                {form.procurement_type !== 'Rental' && <MenuItem value="Petty Cash">Petty Cash</MenuItem>}
                {form.procurement_type !== 'Rental' && <MenuItem value="Online Marketplace">Online Marketplace</MenuItem>}
                {form.procurement_type !== 'Rental' && <MenuItem value="Emergency Purchase">Emergency Purchase</MenuItem>}
                <MenuItem value="Advance Payment">Advance Payment</MenuItem>
              </Select>
              {errors.purchase_mode && <FormHelperText>{errors.purchase_mode}</FormHelperText>}
            </FormControl>

            {form.purchase_mode === 'Online Marketplace' && (
              <TextField
                size="small"
                fullWidth
                label="Marketplace Name (e.g. Amazon, Flipkart)"
                value={form.marketplace_name || ''}
                onChange={(e) => setForm({ ...form, marketplace_name: e.target.value })}
              />
            )}

            {form.purchase_mode === 'Advance Payment' && (
              <TextField
                size="small"
                fullWidth
                label="Advance Payment (%)"
                type="number"
                value={form.advance_percentage}
                onChange={(e) => setForm({ ...form, advance_percentage: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 'any' }}
                error={!!errors.advance_percentage}
                helperText={errors.advance_percentage}
              />
            )}

            <Box id="field-delivery_date">
              <DatePicker
                label="Delivery Date *"
              value={form.delivery_date ? dayjs(form.delivery_date) : null}
              onChange={val => setForm({ ...form, delivery_date: val })}
              format="DD-MMM-YYYY"
              localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              disablePast
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  error: !!errors.delivery_date,
                  helperText: errors.delivery_date,
                  InputProps: {
                    startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: '#94A3B8' }} /></InputAdornment>
                  }
                }
              }}
            />
          </Box>
          </Box>



          {form.procurement_type === 'Rental' && (
            <Box sx={{ p: 2, mb: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>Rental Agreement Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" label="Rental Agreement No."
                    value={form.rental_agreement_number || ''}
                    onChange={e => setForm({ ...form, rental_agreement_number: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Billing Frequency</InputLabel>
                    <Select
                      value={form.billing_frequency || ''}
                      label="Billing Frequency"
                      onChange={e => setForm({ ...form, billing_frequency: e.target.value })}
                    >
                      <MenuItem value="Monthly">Monthly</MenuItem>
                      <MenuItem value="Quarterly">Quarterly</MenuItem>
                      <MenuItem value="Half Yearly">Half Yearly</MenuItem>
                      <MenuItem value="Annually">Annually</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth size="small" label="Rental Document URL"
                      value={form.rental_agreement_document || ''}
                      InputProps={{ readOnly: true }}
                    />
                    <Button variant="outlined" component="label" disabled={uploading} sx={{ whiteSpace: 'nowrap', height: '40px' }}>
                      {uploading ? '...' : 'Upload'}
                      <input type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0])} />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Rental Start Date"
                    value={form.rental_start_date ? dayjs(form.rental_start_date) : null}
                    onChange={val => setForm({ ...form, rental_start_date: val })}
                    format="DD-MMM-YYYY"
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Rental End Date"
                    value={form.rental_end_date ? dayjs(form.rental_end_date) : null}
                    onChange={val => setForm({ ...form, rental_end_date: val })}
                    format="DD-MMM-YYYY"
                    slotProps={{ textField: { fullWidth: true, size: "small" } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" label="Security Deposit" type="number"
                    value={form.security_deposit || ''}
                    onChange={e => setForm({ ...form, security_deposit: e.target.value })}
                  />
                </Grid>
                {form.rental_type === 'Reagent Rental' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth size="small" label="Linked Reagent Agreement"
                      value={form.linked_reagent_agreement || ''}
                      onChange={e => setForm({ ...form, linked_reagent_agreement: e.target.value })}
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={form.rental_type === 'Reagent Rental' ? 6 : 12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.vendor_maintenance_responsibility || false}
                        onChange={(e) => setForm({ ...form, vendor_maintenance_responsibility: e.target.checked })}
                      />
                    }
                    label="Vendor Maintenance Responsibility"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Return Conditions" multiline rows={2}
                    value={form.return_conditions || ''}
                    onChange={e => setForm({ ...form, return_conditions: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Renewal Terms" multiline rows={2}
                    value={form.renewal_terms || ''}
                    onChange={e => setForm({ ...form, renewal_terms: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {form.procurement_type === 'Rental' && form.rental_type === 'Cost Per Test' && (
            <Box sx={{ p: 2, mb: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: '#334155', fontWeight: 600 }}>Cost Per Test Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Cost Per Test" type="number"
                    value={form.cost_per_test || ''}
                    onChange={e => setForm({ ...form, cost_per_test: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Line Items</Typography>
              {errors.items && <Typography variant="caption" color="error">{errors.items}</Typography>}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {form.items.map((item, i) => {
              const qty = parseFloat(item.quantity) || 0;
              const inputRate = parseFloat(item.rate) || 0;
              const discPercent = parseFloat(item.discount_percent) || 0;
              const cgstPercent = parseFloat(item.cgst_percentage) || 0;
              const sgstPercent = parseFloat(item.sgst_percentage) || 0;
              const igstPercent = parseFloat(item.igst_percentage) || 0;
              const totalGstPercent = cgstPercent + sgstPercent + igstPercent;

              const grossAmt = qty * inputRate;
              const discAmt = grossAmt * (discPercent / 100);
              const netAmtAfterDisc = grossAmt - discAmt;

              let taxableAmt = netAmtAfterDisc;
              if (item.is_gst_inclusive && totalGstPercent > 0) {
                taxableAmt = netAmtAfterDisc / (1 + (totalGstPercent / 100));
              }
              const cgstAmt = taxableAmt * (cgstPercent / 100);
              const sgstAmt = taxableAmt * (sgstPercent / 100);
              const igstAmt = taxableAmt * (igstPercent / 100);
              const netAmt = item.is_gst_inclusive ? netAmtAfterDisc : (taxableAmt + cgstAmt + sgstAmt + igstAmt);

              return (
                <Box key={i} id={`item-row-${i}`} sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1.5fr 0.5fr 0.8fr 1fr 0.8fr' },
                  gap: 1.5,
                  p: 1.5,
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }}>
                  <Box>
                    <MaterialSelect
                      disabled={!form.vendor_id}
                      materials={materials.filter(m => !form.items.some((it, idx) => idx !== i && it.material_id === m.id))}
                      value={item.material_id}
                      onChange={val => {
                        const material = materials.find(m => m.id === val);
                        if (material) {
                          const vendor = vendors.find(v => v.id === form.vendor_id);
                          const vendorState = vendor?.state || '';
                          const gstRate = material.gst_rate || 0;
                          const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
                            gstRate, vendorState, tenantConfig?.base_state,
                            tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent
                          );
                          const contractRate = vendorRates[val];
                          const baseRate = contractRate !== undefined ? contractRate : (material.standard_cost || 0);
                          const newRate = contractRate !== undefined ? contractRate : (material.standard_cost || 0);

                          const newItems = [...form.items];
                          newItems[i] = {
                            ...newItems[i],
                            material_id: val,
                            uom_name: material.uom_name || '',
                            uom_allow_decimal: material.uom_allow_decimal || false,
                            rate: newRate,
                            base_rate: baseRate,
                            cgst_percentage,
                            sgst_percentage,
                            igst_percentage
                          };
                          setForm({ ...form, items: newItems });
                        } else {
                          const newItems = [...form.items];
                          newItems[i] = {
                            ...newItems[i],
                            material_id: '',
                            uom_name: '',
                            uom_allow_decimal: false,
                            rate: 0,
                            base_rate: 0,
                            cgst_percentage: 0,
                            sgst_percentage: 0,
                            igst_percentage: 0,
                            discount_percent: 0,
                            is_gst_inclusive: false
                          };
                          setForm({ ...form, items: newItems });
                        }
                      }}
                      size="small"
                      error={!!itemErrors[i]?.material_id}
                      helperText={itemErrors[i]?.material_id}
                    />
                  </Box>
                  <TextField size="small" label="Unit" value={item.uom_name || '-'} InputProps={{ readOnly: true }} />
                  <TextField disabled={!item.material_id} size="small" label="Qty" type="number" value={item.quantity}
                    error={!!itemErrors[i]?.quantity} helperText={itemErrors[i]?.quantity}
                    onKeyDown={e => {
                      const blockList = ['-', '+', 'e', 'E'];
                      if (!item.uom_allow_decimal) blockList.push('.');
                      if (blockList.includes(e.key)) e.preventDefault();
                    }} onChange={e => {
                      let val = e.target.value.replace(/-/g, '');
                      if (!item.uom_allow_decimal) val = val.replace(/\./g, '');
                      updateItem(i, 'quantity', val);
                    }} inputProps={{ min: 0, step: item.uom_allow_decimal ? "any" : "1" }} />
                  <Box>
                    <TextField disabled={!item.material_id} sx={noSpinSx} fullWidth size="small" label="Rate (₹)" type="number" value={item.rate}
                      error={!!itemErrors[i]?.rate} helperText={itemErrors[i]?.rate}
                      onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'rate', e.target.value.replace(/-/g, ''))}
                      onBlur={() => handleRateBlur(i, item.rate, item.base_rate)}
                      inputProps={{ min: 0, step: "0.01" }} />
                    {item.base_rate > 0 && <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>Base Rate: ₹{item.base_rate}</Typography>}
                  </Box>
                  <FormControl size="small">
                    <InputLabel>GST</InputLabel>
                    <Select disabled={!item.material_id} label="GST" value={item.is_gst_inclusive ? 'inclusive' : 'exclusive'} onChange={e => updateItem(i, 'is_gst_inclusive', e.target.value === 'inclusive')}>
                      <MenuItem value="exclusive">Exclusive</MenuItem>
                      <MenuItem value="inclusive">Inclusive</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                    <Box display="flex" gap={1}>
                      <TextField disabled={!item.material_id} sx={{ ...noSpinSx, flex: 1 }} size="small" label="Disc %" type="number" value={item.discount_percent} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onFocus={(e) => { if (item.discount_percent === 0 || item.discount_percent === '0') updateItem(i, 'discount_percent', ''); }} onBlur={(e) => { if (item.discount_percent === '') updateItem(i, 'discount_percent', 0); }} onChange={e => updateItem(i, 'discount_percent', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100, step: "any" }} />
                      <TextField size="small" label="Disc (₹)" value={discAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                    </Box>
                    <Box display="flex" gap={1}>
                      <TextField sx={{ ...noSpinSx, flex: 1 }} size="small" label="CGST %" type="number" value={item.cgst_percentage} disabled={parseFloat(item.igst_percentage) > 0} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'cgst_percentage', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100, step: "any" }} InputProps={{ readOnly: true }} />
                      <TextField size="small" label="CGST (₹)" value={cgstAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                    </Box>
                    <Box display="flex" gap={1}>
                      <TextField sx={{ ...noSpinSx, flex: 1 }} size="small" label="SGST %" type="number" value={item.sgst_percentage} disabled={parseFloat(item.igst_percentage) > 0} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'sgst_percentage', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100, step: "any" }} InputProps={{ readOnly: true }} />
                      <TextField size="small" label="SGST (₹)" value={sgstAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                    </Box>
                    <Box display="flex" gap={1}>
                      <TextField sx={{ ...noSpinSx, flex: 1 }} size="small" label="IGST %" type="number" value={item.igst_percentage} disabled={parseFloat(item.cgst_percentage) > 0 || parseFloat(item.sgst_percentage) > 0} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(i, 'igst_percentage', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0, max: 100, step: "any" }} InputProps={{ readOnly: true }} />
                      <TextField size="small" label="IGST (₹)" value={igstAmt.toFixed(2)} InputProps={{ readOnly: true, sx: { bgcolor: '#f1f5f9', color: '#64748b' } }} sx={{ flex: 1 }} />
                    </Box>
                  </Box>

                  <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                    {form.items.length > 1 ? (
                      <Button size="small" color="error" startIcon={<Delete />} onClick={() => removeItem(i)}>Remove</Button>
                    ) : <Box />}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>NET AMOUNT</Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                        ₹{netAmt.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
            {!form.indent_id && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={addItem}
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  borderStyle: 'dashed', 
                  width: '100%', 
                  py: 1.5,
                  color: '#2563EB', 
                  fontSize: '0.95rem',
                  borderColor: '#cbd5e1', 
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } 
                }}
              >
                Add Another Item
              </Button>
            )}
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
          <Button onClick={() => { setDialog(false); setEditingPOId(null); setErrors({}); setItemErrors({}); }} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          {!(form.pr_id || form.indent_id || form.qr_id) && (
            <Button onClick={() => handleSave(true)} color="secondary" variant="outlined" sx={{ fontWeight: 600 }}>Save Draft</Button>
          )}
          <Button variant="contained" onClick={() => handleSave(false)} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)', textTransform: 'none' }}>{editingPOId ? 'Submit PO' : 'Create PO'}</Button>
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
      <Dialog open={emailPreview.open} onClose={() => !emailPreview.sending && setEmailPreview({ open: false, loading: false, data: null, po: null, cc: '', bcc: '', sending: false })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          <Email sx={{ color: '#2563EB' }} /> Send PO to Vendor — {emailPreview.po?.po_number}
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
          <Button onClick={() => setEmailPreview({ open: false, loading: false, data: null, po: null, cc: '', bcc: '', sending: false })}
            disabled={emailPreview.sending} sx={{ textTransform: 'none', color: '#64748B' }}>Cancel</Button>
          <Button onClick={() => handlePrintPO(emailPreview.po)} variant="outlined" sx={{ fontWeight: 600, textTransform: 'none' }}>
            Print PO
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
                    'Partially Issued': 'warning', 'Fully Issued': 'primary', 'PO Created': 'secondary', 'Closed': 'default'
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
                    'Rejected': 'error', 'Converted to PO': 'secondary',
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
      <Dialog open={approvalDialog.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setApprovalDialog({ open: false, po: null, items: {} }); setApprovalRemarks(''); } }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Approve PO? — {approvalDialog.po?.po_number}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Vendor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.po?.vendor_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Institution</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.po?.project_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Total Amount</Typography>
              <Typography sx={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(calculatePOTotalNet(approvalDialog.po || {}))}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(approvalDialog.po?.created_at)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Approval Level</Typography>
              <Typography sx={{ fontWeight: 600 }}>L{approvalDialog.po?.current_approval_level}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={approvalDialog.po?.status} size="small" color={statusColor[approvalDialog.po?.status] || 'default'} /></Box>
            </Grid>
          </Grid>
          {approvalDialog.po?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {approvalDialog.po.remarks}
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
                  Qty Last Approved {approvalDialog.po?.current_approval_level > 1 ? `(L${approvalDialog.po.current_approval_level - 1})` : ''}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#e0e7ff', color: '#1e40af' }}>Qty Approved</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>Remarks</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>History</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvalDialog.po?.items?.map(item => {
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ fontWeight: 500, color: '#64748B' }}>{item.uom_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: '#6366f1' }}>
                      {item.approved_quantity !== null && item.approved_quantity !== undefined && approvalDialog.po?.current_approval_level > 1 ? item.approved_quantity : '—'}
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
                        <IconButton size="small" onClick={() => fetchApprovalHistory(approvalDialog.po.id, item.material_id)}
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
          <Button onClick={() => { setApprovalDialog({ open: false, po: null, items: {} }); setApprovalRemarks(''); }}>Cancel</Button>
          <Button
            variant="contained" color="primary" onClick={handleApproveClick} sx={{ fontWeight: 600 }}
            disabled={!approvalDialog.po?.items?.every(item => {
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
