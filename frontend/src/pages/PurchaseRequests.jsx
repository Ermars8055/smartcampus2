import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Tab, Tabs, Divider, Paper, InputAdornment,
  TableSortLabel, Accordion, AccordionSummary, AccordionDetails, Autocomplete
} from '@mui/material';
import { Add, CheckCircle, Cancel, ShoppingCart, Archive, Delete, Search, Apartment, AccountTree, CalendarMonth, Notes, Store, Numbers, Inventory, ArrowDropDown, Visibility, History, Textsms, ExpandMore, ArrowBack, Block } from '@mui/icons-material';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useMessage } from '../context/MessageContext';
import { computeGstSplit } from '../utils/gstCalculations';

function StatusChip({ status }) {
  const colorMap = {
    'Draft': 'default', 'Submitted': 'info', 'Approved': 'success',
    'Rejected': 'error', 'Converted to PO': 'primary',
    'Short Closed': 'warning', 'Cancelled': 'default'
  };
  return <Chip label={status} size="small" color={colorMap[status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
}

export default function PurchaseRequests() {
  const { hasAction, hasPermission } = useAuth();
  const { tenantConfig } = useConfig();
  const { showMessage } = useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [prs, setPrs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [dialog, setDialog] = useState(false);
  const [editingPRId, setEditingPRId] = useState(null);
  const [convertDialog, setConvertDialog] = useState({ open: false, pr: null, vendor_id: '', delivery_date: '', rate: '', terms: '' });
  const [detailDialog, setDetailDialog] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, pr: null, items: {} });
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [historyDialog, setHistoryDialog] = useState({ open: false, materialId: null, data: null, loading: false });
  const [detailHistoryData, setDetailHistoryData] = useState(null);
  const [detailHistoryOpen, setDetailHistoryOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});

  const statusFilters = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Converted to PO', 'Short Closed', 'Cancelled', 'All'];
  const [tab, setTab] = useState(() => {
    const initialTabName = searchParams.get('tab');
    if (initialTabName) {
      const idx = statusFilters.indexOf(initialTabName);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterInstitution, setFilterInstitution] = useState(null);
  const [allDepartmentsList, setAllDepartmentsList] = useState([]);
  const [formDepartmentsList, setFormDepartmentsList] = useState([]);










  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Multi-item PR form
  const [form, setForm] = useState({
    institution_id: '', project_id: '', building_id: '', department_name: '',
    procurement_type: 'Purchase', rental_type: '', rental_duration: '', rental_duration_unit: 'Months',
    estimated_rental_cost: '', cost_per_test: '', reagent_rental_required: false, justification: '',
    required_date: null, remarks: '',
    items: [{ material_id: '', quantity: '' }]
  });

  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear all errors when form changes
    });
    setItemErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear item errors
    });
  }, [form]);



  // Confirmation dialog with optional reason
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false });
  const [reason, setReason] = useState('');
  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); setReason(''); };
  const handleCancelConfirm = (e, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setConfirm({ ...confirm, open: false }); setReason(''); };

  const load = () => { api.get('/api/procurement/pr', { params: { search: search || undefined } }).then(r => setPrs(r.data)); };
  useEffect(() => { load(); }, [search]);
  useEffect(() => {
    load();
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/institutions').then(r => {
      setInstitutions(r.data);
      if (r.data.length === 1) setFilterInstitution(r.data[0]);
    }).catch(() => setInstitutions([]));
    api.get('/api/buildings').then(r => setAllBuildings(r.data)).catch(() => setAllBuildings([]));
    api.get('/api/departments').then(r => setAllDepartments(r.data)).catch(() => setAllDepartments([]));
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/terms').then(r => setTermsTemplates(r.data));
    api.get('/api/departments/names').then(r => {
      setAllDepartmentsList(r.data);
      if (r.data.length === 1) setFilterDepartment(r.data[0]);
    }).catch(() => setAllDepartmentsList([]));
  }, []);

  useEffect(() => {
    if (location.state?.openPRId && prs.length > 0) {
      const prToOpen = prs.find(p => p.id === location.state.openPRId);
      if (prToOpen) {
        setApprovalDialog({ open: true, pr: prToOpen, items: {} });
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, prs, location.pathname, navigate]);

  const handleInstitutionChange = (instId) => {
    const inst = institutions.find(i => i.id === instId);
    setForm(prev => ({ ...prev, institution_id: instId, project_id: inst ? inst.project_id : '', department_name: '', building_id: '' }));
    setBuildings([]);
    if (instId) {
      const depts = allDepartments.filter(d => d.institution_id === instId).map(d => d.name);
      setFormDepartmentsList(Array.from(new Set(depts)));
    } else {
      setFormDepartmentsList([]);
    }
  };

  const handleDepartmentChange = (newDept, instId = form.institution_id) => {
    if (newDept) {
      const masterDepts = allDepartments.filter(d => d.name === newDept && (!instId || d.institution_id === instId));
      const masterBldgs = allBuildings.filter(b => b.department_name === newDept);
      const uniqueBuildings = new Map();
      masterDepts.forEach(d => {
        if (d.building_id && d.building_name) uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
      });
      masterBldgs.forEach(b => {
        uniqueBuildings.set(b.id, { id: b.id, name: b.name });
      });
      const bldgs = Array.from(uniqueBuildings.values());
      setBuildings(bldgs);

      let nextBuildingId = bldgs.length === 1 ? bldgs[0].id : '';
      setForm(prev => ({ ...prev, department_name: newDept, building_id: nextBuildingId }));
    } else {
      setBuildings([]);
      setForm(prev => ({ ...prev, department_name: '', building_id: '' }));
    }
  };

  // Multi-item form helpers
  const addItem = () => {
    const emptyCount = form.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", "Limit Reached", "warning");
      return;
    }
    setForm({ ...form, items: [...form.items, { material_id: '', quantity: '' }] });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const executeSave = async (payload) => {
    try {
      let res;
      if (editingPRId) {
        res = await api.put(`/api/procurement/pr/${editingPRId}/full`, payload);
      } else {
        res = await api.post('/api/procurement/pr', payload);
      }
      setDialog(false);
      setEditingPRId(null);
      const prNumber = res?.data?.pr_number || '';
      showMessage(`Purchase Request ${prNumber} saved successfully.`.trim(), "Success", "success");
      load();
    } catch (err) { showMessage(err.response?.data?.detail || 'Error saving PR', 'Error', 'error'); }
  };

  const handleSave = async (status) => {
    try {
      const newErrors = {};
      if (!form.project_id) newErrors.project_id = "Institution is required";
      if (!form.department_name) newErrors.department_name = "Department is required";
      if (!form.required_date) {
        newErrors.required_date = "Required Date is required";
      } else if (dayjs(form.required_date).isBefore(dayjs(), 'day')) {
        newErrors.required_date = "Required Date cannot be in the past";
      }

      if (form.items.length === 0) {
        newErrors.items = "Please add at least one material item.";
      }

      const newItemErrors = {};
      form.items.forEach((it, i) => {
        if (!it.material_id) {
          newItemErrors[i] = { ...newItemErrors[i], material_id: "Material is required" };
        }
        if (!it.quantity || parseFloat(it.quantity) <= 0) {
          newItemErrors[i] = { ...newItemErrors[i], quantity: "Quantity is required" };
        }
      });

      setErrors(newErrors);
      setItemErrors(newItemErrors);
      if (Object.keys(newErrors).length > 0 || Object.keys(newItemErrors).length > 0) {
        if (Object.keys(newErrors).length > 0) {
          const firstErrorField = Object.keys(newErrors)[0];
          const el = document.getElementById(`field-${firstErrorField}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (Object.keys(newItemErrors).length > 0) {
          const firstErrorIdx = Object.keys(newItemErrors)[0];
          const el = document.getElementById(`item-row-${firstErrorIdx}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      const payload = {
        project_id: form.project_id,
        building_id: form.building_id || null,
        department_name: form.department_name,
        procurement_type: form.procurement_type || 'Purchase',
        rental_type: form.procurement_type === 'Rental' ? form.rental_type || null : null,
        rental_duration: form.procurement_type === 'Rental' ? (form.rental_duration ? parseInt(form.rental_duration) : null) : null,
        rental_duration_unit: form.procurement_type === 'Rental' ? form.rental_duration_unit || null : null,
        estimated_rental_cost: form.procurement_type === 'Rental' ? (form.estimated_rental_cost ? parseFloat(form.estimated_rental_cost) : null) : null,
        cost_per_test: form.procurement_type === 'Cost Per Test' ? (form.cost_per_test ? parseFloat(form.cost_per_test) : null) : null,
        reagent_rental_required: form.reagent_rental_required,
        justification: form.justification || null,
        required_date: form.required_date ? dayjs(form.required_date).format('YYYY-MM-DD') : null,
        remarks: form.remarks,
        status: status,
        items: form.items.filter(it => it.material_id && it.quantity).map(it => ({
          material_id: it.material_id, quantity: parseFloat(it.quantity)
        }))
      };

      if (status === 'Submitted') {
        showConfirm(
          'Confirm Submission',
          'Make sure you completed all the details once submitted you cannot edit the purchase request. It will be submitted for approval.',
          'Submit PR',
          'primary',
          async () => {
            await executeSave(payload);
          }
        );
      } else {
        await executeSave(payload);
      }
    } catch (err) { showMessage(err.response?.data?.detail || 'Error preparing PR payload', 'Error', 'error'); }
  };

  // Draft → Submitted (first click)
  const handleApprove = async (id) => { await api.post(`/api/procurement/pr/${id}/approve`); load(); };

  const fetchApprovalHistory = async (prId, materialId) => {
    setHistoryDialog({ open: true, materialId, data: null, loading: true });
    try {
      const res = await api.get(`/api/procurement/pr/${prId}/approval-history`);
      setHistoryDialog({ open: true, materialId, data: res.data, loading: false });
    } catch (err) {
      showMessage('Failed to load approval history', 'Error', 'error');
      setHistoryDialog({ open: false, materialId: null, data: null, loading: false });
    }
  };

  const fetchDetailHistory = async (prId) => {
    try {
      const res = await api.get(`/api/procurement/pr/${prId}/approval-history`);
      setDetailHistoryData(res.data);
      setDetailHistoryOpen(true);
    } catch (err) {
      console.error(err);
      showMessage('Failed to load detail history', 'Error', 'error');
    }
  };

  const submitApproval = async () => {
    const { pr, items } = approvalDialog;
    if (!pr) return;

    const payloadItems = pr.items.map(it => {
      const itemData = items[it.id] || {};
      return {
        pr_item_id: it.id,
        approved_quantity: parseFloat(itemData.qty),
        remarks: itemData.rem || null
      };
    });

    if (payloadItems.some(it => isNaN(it.approved_quantity) || it.approved_quantity < 0)) {
      showMessage("Please enter a valid approved quantity for all items.", 'Validation Error', 'warning');
      return;
    }
    if (payloadItems.length === 1 && payloadItems[0].approved_quantity === 0) {
      showMessage("Approved quantity must be greater than 0 for a single-item document. Please use the Reject button.", 'Validation Error', 'warning');
      return;
    }
    if (payloadItems.length > 1 && payloadItems.every(it => it.approved_quantity === 0)) {
      showMessage("You cannot approve 0 quantity for all items. Please use the Reject button.", 'Validation Error', 'warning');
      return;
    }

    try {
      const res = await api.post(`/api/procurement/pr/${pr.id}/approve`, {
        items: payloadItems,
        remarks: approvalRemarks || null
      });
      load();
      setApprovalDialog({ open: false, pr: null, items: {} });
      setApprovalRemarks('');
      let msg = res.data.message || "PR approved successfully";
      if (msg === "Fully Approved") {
        msg = `${pr.pr_number} successfully approved`;
      } else if (msg.startsWith("Moved to level")) {
        msg = `${pr.pr_number} successfully approved. ${msg}`;
      }
      // You can use a better notification system if implemented, falling back to alert
      showMessage(msg, 'Success', 'success');
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error approving PR", 'Error', 'error');
    }
  };

  const handleApproveClick = () => {
    const { pr, items } = approvalDialog;
    if (!pr) return;

    let hasLargerQuantity = false;
    const largerItems = [];

    for (const it of pr.items) {
      const val = items[it.id]?.qty;
      const qty = parseFloat(val);
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
  const handleReject = async (id, remarks) => { await api.post(`/api/procurement/pr/${id}/reject`, { remarks }); load(); };
  const handleShortClose = async (id, remarks) => { await api.post(`/api/procurement/pr/${id}/short-close`, { remarks }); load(); };
  const handleCancelPr = async (id, remarks) => { await api.post(`/api/procurement/pr/${id}/cancel`, { remarks }); load(); };

  // Convert ONLY this specific PR to PO (no batch — prevents bypassing approval)
  const openConvertDialog = (pr) => {
    setConvertDialog({
      open: true,
      pr,
      vendor_id: '',
      delivery_date: dayjs().add(14, 'day'),
      terms: '',
      items: pr.items.map(it => {
        return {
          ...it,
          rate: '',
          discount_percent: 0,
          cgst_percentage: 0,
          sgst_percentage: 0,
          igst_percentage: 0
        };
      })
    });
  };

  const updateConvertItem = (i, field, value) => {
    let finalVal = value;
    if (['discount_percent', 'cgst_percentage', 'sgst_percentage', 'igst_percentage'].includes(field)) {
      if (finalVal !== '' && parseFloat(finalVal) > 100) {
        finalVal = '100';
      }
    }
    const items = [...convertDialog.items];
    items[i][field] = finalVal;

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
    setConvertDialog({ ...convertDialog, items });
  };

  const handleConvert = async () => {
    const mappedItems = convertDialog.items.map(it => ({
      material_id: it.material_id,
      quantity: parseFloat(it.quantity),
      rate: parseFloat(it.rate),
      discount_percent: parseFloat(it.discount_percent || 0),
      cgst_percentage: parseFloat(it.cgst_percentage || 0),
      sgst_percentage: parseFloat(it.sgst_percentage || 0),
      igst_percentage: parseFloat(it.igst_percentage || 0),
    }));

    if (mappedItems.some(it => isNaN(it.rate) || it.rate < 0 || isNaN(it.quantity) || it.quantity <= 0 || isNaN(it.discount_percent) || it.discount_percent < 0 || isNaN(it.cgst_percentage) || it.cgst_percentage < 0 || isNaN(it.sgst_percentage) || it.sgst_percentage < 0 || isNaN(it.igst_percentage) || it.igst_percentage < 0)) {
      showMessage("Rate, Quantity, Discount and Taxes must be valid non-negative numbers.", 'Validation Error', 'warning');
      return;
    }

    if (!convertDialog.vendor_id || !convertDialog.terms?.trim()) {
      showMessage("Please select a vendor and provide terms and conditions.", 'Validation Error', 'warning');
      return;
    }

    try {
      const payload = {
        vendor_id: convertDialog.vendor_id,
        project_id: convertDialog.pr.project_id,
        pr_id: convertDialog.pr.id,
        delivery_date: convertDialog.delivery_date ? dayjs(convertDialog.delivery_date).format('YYYY-MM-DD') : null,
        terms: convertDialog.terms,
        items: mappedItems
      };
      await api.post('/api/procurement/po', payload);
      setConvertDialog({ open: false, pr: null, vendor_id: '', delivery_date: '', items: [], terms: '' });
      load();
    } catch (err) {
      const msg = err.response?.data?.detail;
      showMessage(typeof msg === 'string' ? msg : (JSON.stringify(msg) || 'Error converting PR'), 'Error', 'error');
    }
  };

  // Status helpers — approve button label changes based on status
  const canApprove = (pr) => pr.status === 'Submitted' && pr.can_user_approve;
  const canReject = (s) => s === 'Submitted';
  const canConvert = (s) => s === 'Approved';
  const canShortClose = (s) => s === 'Approved';
  const canCancel = (s) => s === 'Draft' || s === 'Submitted';
  const approveLabel = (s) => s === 'Draft' ? 'Submit for Approval' : 'Approve';

  const filteredPRsBase = useMemo(() => {
    let list = prs;
    const projId = searchParams.get('proj');
    if (projId) {
      list = list.filter(p => p.project_id === parseInt(projId, 10));
    }
    list = list.filter(p => !filterDepartment || p.department_name === filterDepartment);
    list = list.filter(p => !filterInstitution || p.project_id === filterInstitution.project_id);
    return list;
  }, [prs, filterDepartment, filterInstitution, searchParams]);

  const sortedPRs = useMemo(() => {
    let list = statusFilters[tab] === 'All' ? filteredPRsBase : filteredPRsBase.filter(p => p.status === statusFilters[tab]);

    return [...list].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'items') {
        aVal = a.items?.length || 0;
        bVal = b.items?.length || 0;
      }

      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [prs, tab, sortConfig, statusFilters]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Purchase Requests</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{prs.length} total requests</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {location.state?.fromDashboard && (
            <Button size="small" variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          )}
          {hasPermission('purchase_requests', 'can_create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => {
              const defaultInst = institutions.length === 1 ? institutions[0].id : '';
              const defaultDept = allDepartmentsList.length === 1 ? allDepartmentsList[0] : '';
              const defaultProj = institutions.length === 1 ? institutions[0].project_id : '';

              setForm({
                institution_id: defaultInst, project_id: defaultProj, building_id: '', department_name: defaultDept,
                procurement_type: 'Purchase', rental_type: '', rental_duration: '', rental_duration_unit: 'Months',
                estimated_rental_cost: '', cost_per_test: '', reagent_rental_required: false, justification: '',
                required_date: null, remarks: '',
                items: [{ material_id: '', quantity: '' }]
              });

              if (defaultInst) {
                const depts = allDepartments.filter(d => d.institution_id === defaultInst).map(d => d.name);
                setFormDepartmentsList(Array.from(new Set(depts)));
              } else {
                setFormDepartmentsList([]);
              }

              if (defaultDept) {
                handleDepartmentChange(defaultDept, defaultInst);
              } else {
                setBuildings([]);
              }

              setDialog(true);
            }}>Create PR</Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search PR Numbers..." value={search}
            onChange={e => setSearch(e.target.value)} sx={{ minWidth: 300 }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }} />
          <Autocomplete
            size="small"
            options={institutions}
            getOptionLabel={(option) => option.name || ''}
            value={filterInstitution}
            onChange={(e, val) => {
              setFilterInstitution(val);
              setFilterDepartment(null);
            }}
            renderInput={(params) => <TextField {...params} placeholder="Filter by Institution" sx={{ minWidth: 220 }} />}
          />
          <Autocomplete
            size="small"
            options={filterInstitution ? Array.from(new Set(allDepartments.filter(d => d.institution_id === filterInstitution.id).map(d => d.name))) : allDepartmentsList}
            value={filterDepartment}
            onChange={(e, val) => setFilterDepartment(val)}
            renderInput={(params) => <TextField {...params} placeholder="Filter by Department" sx={{ minWidth: 220 }} />}
          />
        </Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {statusFilters.map((s, i) => (
            <Tab
              key={i}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s}
                  <Chip
                    label={s === 'All' ? filteredPRsBase.length : filteredPRsBase.filter(p => p.status === s).length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: tab === i ? 'primary.light' : '#f0f0f0',
                      color: tab === i ? 'primary.contrastText' : 'text.secondary',
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

      <Card>
        <TableContainer>
          <Table size="small" sx={{ '& .MuiTableCell-root': { px: 1, py: 0.75 } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'pr_number'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('pr_number')}
                    IconComponent={ArrowDropDown}
                  >
                    PR NUMBER
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'project_name'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('project_name')}
                    IconComponent={ArrowDropDown}
                  >
                    INSTITUTION
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'department_name'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('department_name')}
                    IconComponent={ArrowDropDown}
                  >
                    DEPARTMENT
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'created_at'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('created_at')}
                    IconComponent={ArrowDropDown}
                  >
                    PR DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'required_date'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('required_date')}
                    IconComponent={ArrowDropDown}
                  >
                    REQ. DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'items'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('items')}
                    IconComponent={ArrowDropDown}
                  >
                    ITEMS
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  <TableSortLabel
                    active={sortConfig.key === 'status'}
                    direction={sortConfig.direction}
                    onClick={() => handleSort('status')}
                    IconComponent={ArrowDropDown}
                  >
                    STATUS
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'center' }}>LVL</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPRs.map(pr => (
                <TableRow key={pr.id} sx={{ cursor: 'pointer' }} onClick={() => {
                  if (pr.status === 'Draft') {
                    const inst = institutions.find(i => i.project_id === pr.project_id);
                    setForm({
                      institution_id: inst ? inst.id : '',
                      project_id: pr.project_id || '',
                      building_id: pr.building_id || '',
                      department_name: pr.department_name || '',
                      procurement_type: pr.procurement_type || 'Purchase',
                      rental_type: pr.rental_type || '',
                      rental_duration: pr.rental_duration || '',
                      rental_duration_unit: pr.rental_duration_unit || 'Months',
                      estimated_rental_cost: pr.estimated_rental_cost || '',
                      cost_per_test: pr.cost_per_test || '',
                      reagent_rental_required: pr.reagent_rental_required || false,
                      justification: pr.justification || '',
                      required_date: pr.required_date ? dayjs(pr.required_date) : null,
                      remarks: pr.remarks || '',
                      items: pr.items && pr.items.length > 0 ? pr.items.map(it => ({ material_id: it.material_id, quantity: it.quantity })) : [{ material_id: '', quantity: '' }]
                    });
                    setEditingPRId(pr.id);
                    if (inst) {
                      const depts = allDepartments.filter(d => d.institution_id === inst.id).map(d => d.name);
                      setFormDepartmentsList(Array.from(new Set(depts)));
                    } else {
                      setFormDepartmentsList([]);
                    }
                    if (pr.department_name) {
                      const masterDepts = allDepartments.filter(d => d.name === pr.department_name);
                      const masterBldgs = allBuildings.filter(b => b.department_name === pr.department_name);
                      const uniqueBuildings = new Map();
                      masterDepts.forEach(d => {
                        if (d.building_id && d.building_name) uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
                      });
                      masterBldgs.forEach(b => {
                        uniqueBuildings.set(b.id, { id: b.id, name: b.name });
                      });
                      setBuildings(Array.from(uniqueBuildings.values()));
                    } else {
                      setBuildings([]);
                    }
                    setDialog(true);
                  } else {
                    setDetailDialog(pr);
                  }
                }}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{pr.pr_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{pr.project_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{pr.department_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(pr.created_at)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(pr.required_date)}</TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{pr.items?.length || 0}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}><StatusChip status={pr.status} /></TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Chip label={`L${pr.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={approveLabel(pr.status)}>
                        <span><IconButton size="small" color="success"
                          disabled={
                            (pr.status === 'Draft' && !hasAction('purchase_requests', 'can_submit')) ||
                            (pr.status === 'Submitted' && !hasAction('purchase_requests', 'can_approve')) ||
                            !canApprove(pr)
                          }
                          onClick={() => {
                            if (pr.status === 'Draft') {
                              showConfirm(
                                'Submit PR?',
                                `Submit ${pr.pr_number} for approval? (${pr.items?.length} ${pr.items?.length === 1 ? 'item' : 'items'})`,
                                'Yes, Submit',
                                'success',
                                () => handleApprove(pr.id)
                              );
                            } else {
                              setApprovalDialog({ open: true, pr: pr, items: {} });
                            }
                          }}>
                          <CheckCircle fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <span><IconButton size="small" color="error" disabled={!canReject(pr.status) || !hasAction('purchase_requests', 'can_reject')}
                          onClick={() => showConfirm('Reject PR?', `Reject ${pr.pr_number}? This cannot be undone.`, 'Yes, Reject', 'error', (r) => handleReject(pr.id, r), true)}>
                          <Cancel fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Convert to PO">
                        <span><IconButton size="small" color="primary" disabled={!canConvert(pr.status) || !hasAction('purchase_requests', 'can_convert_to_po')}
                          onClick={() => showConfirm('Convert to PO?', `Are you sure you want to convert ${pr.pr_number} to a Purchase Order?`, 'Okay', 'primary', () => openConvertDialog(pr))}>
                          <ShoppingCart fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Short Close">
                        <span><IconButton size="small" color="warning" disabled={!canShortClose(pr.status) || !hasAction('purchase_requests', 'can_short_close')}
                          onClick={() => showConfirm('Short Close PR?', `Short close ${pr.pr_number}? This cannot be undone.`, 'Yes, Short Close', 'warning', (r) => handleShortClose(pr.id, r), true)}>
                          <Archive fontSize="small" />
                        </IconButton></span>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <span><IconButton size="small" color="error" disabled={!canCancel(pr.status) || !hasPermission('purchase_requests', 'can_update')}
                          onClick={() => showConfirm('Cancel PR?', `Cancel ${pr.pr_number}? This cannot be undone.`, 'Yes, Cancel PR', 'error', (r) => handleCancelPr(pr.id, r), true)}>
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
      </Card>

      {/* PR Detail Dialog — shows material details for approval review */}
      <Dialog open={!!detailDialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDetailDialog(null); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.pr_number} — PR Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.requester_name}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Institution</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.project_name || '—'}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.department_name || '—'}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">PR Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.created_at)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Required Date</Typography>
              <Typography sx={{ fontWeight: 600, color: '#2563EB' }}>{formatDate(detailDialog?.required_date)}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><StatusChip status={detailDialog?.status || ''} /></Box>
            </Grid>
          </Grid>

          {detailDialog?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {detailDialog.remarks}
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
              {detailDialog?.items?.map((it, idx) => (
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
          {detailDialog?.status !== 'Draft' && (
            <Box sx={{ mt: 3 }}>
              <Accordion
                expanded={detailHistoryOpen}
                onChange={() => {
                  if (!detailHistoryOpen && detailDialog?.id) {
                    fetchDetailHistory(detailDialog.id);
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
                                    L{entry.level} APPROVED QTY
                                  </Box>
                                </TableCell>
                              ))}

                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detailDialog?.items?.map(item => {
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
                          {detailHistoryData.entries.filter(e => e.remarks).slice().reverse().map((e, idx) => (
                            <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1d4ed8', display: 'block', mb: 0.5 }}>L{e.level} Approval - {e.approver_name}</Typography>
                              <Typography variant="body2" sx={{ color: '#334155' }}>{e.remarks}</Typography>
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
          <Button onClick={() => { setDetailDialog(null); setDetailHistoryOpen(false); setDetailHistoryData(null); }} variant="outlined" sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create PR Dialog - Multi-Item */}
      <Dialog
        open={dialog}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setDialog(false); setEditingPRId(null); setErrors({}); } }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Purchase Request</Typography>
              <Typography variant="body2" color="text.secondary">Raise a new material purchase request for approval.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1, mb: 2 }}>
            <FormControl id="field-project_id" fullWidth required error={!!errors.project_id}>
              <InputLabel>Institution</InputLabel>
              <Select
                value={form.institution_id}
                label="Institution"
                onChange={e => handleInstitutionChange(e.target.value)}
                startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="" disabled>Select Institution</MenuItem>
                {institutions.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>)}
              </Select>
              {errors.project_id && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.project_id}</Typography>}
            </FormControl>

            <FormControl id="field-department_name" fullWidth required disabled={!form.institution_id} error={!!errors.department_name}>
              <Autocomplete
                options={formDepartmentsList}
                value={form.department_name || null}
                onChange={(e, val) => handleDepartmentChange(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Department"
                    required
                    error={!!errors.department_name}
                    helperText={errors.department_name}
                    InputProps={{ ...params.InputProps, startAdornment: <><InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', ml: 1 }} /></InputAdornment>{params.InputProps.startAdornment}</> }}
                    sx={{
                      ...(errors.department_name && {
                        '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d32f2f'
                        }
                      })
                    }}
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth disabled={!form.department_name || buildings.length === 0}>
              <InputLabel>Building</InputLabel>
              <Select
                value={form.building_id}
                label="Building"
                onChange={e => setForm({ ...form, building_id: e.target.value })}
                startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="">Select Building (Optional)</MenuItem>
                {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Procurement Type</InputLabel>
              <Select
                value={form.procurement_type || 'Purchase'}
                label="Procurement Type"
                onChange={e => setForm({ ...form, procurement_type: e.target.value })}
                size="small"
              >
                <MenuItem value="Purchase">Purchase</MenuItem>
                <MenuItem value="Rental">Rental</MenuItem>
                <MenuItem value="Cost Per Test">Cost Per Test</MenuItem>
              </Select>
            </FormControl>

            <Box id="field-required_date">
              <DatePicker
                label="Required Date"
                value={form.required_date ? dayjs(form.required_date) : null}
                onChange={val => setForm({ ...form, required_date: val })}
                format="DD-MMM-YYYY"
                disablePast
                localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!errors.required_date,
                    helperText: errors.required_date,
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
                  <FormControl fullWidth size="small">
                    <InputLabel>Rental Type</InputLabel>
                    <Select
                      value={form.rental_type || ''}
                      label="Rental Type"
                      onChange={e => setForm({ ...form, rental_type: e.target.value })}
                    >
                      <MenuItem value="Standard Rental">Standard Rental</MenuItem>
                      <MenuItem value="Reagent Rental">Reagent Rental</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth size="small" label="Rental Duration" type="number"
                    value={form.rental_duration || ''}
                    onChange={e => setForm({ ...form, rental_duration: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Duration Unit</InputLabel>
                    <Select
                      value={form.rental_duration_unit || 'Months'}
                      label="Duration Unit"
                      onChange={e => setForm({ ...form, rental_duration_unit: e.target.value })}
                    >
                      <MenuItem value="Days">Days</MenuItem>
                      <MenuItem value="Weeks">Weeks</MenuItem>
                      <MenuItem value="Months">Months</MenuItem>
                      <MenuItem value="Years">Years</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Estimated Rental Cost" type="number"
                    value={form.estimated_rental_cost || ''}
                    onChange={e => setForm({ ...form, estimated_rental_cost: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Justification"
                    value={form.justification || ''}
                    onChange={e => setForm({ ...form, justification: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {form.procurement_type === 'Cost Per Test' && (
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth size="small" label="Justification"
                    value={form.justification || ''}
                    onChange={e => setForm({ ...form, justification: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#475569' }}>Material Items</Typography>
            {errors.items && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{errors.items}</Typography>}

          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {form.items.map((item, i) => (
              <Box key={i} id={`item-row-${i}`} sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 40px' },
                gap: 1.5,
                alignItems: 'start',
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Box>
                  <MaterialSelect
                    materials={materials.filter(m => !form.items.some((it, idx) => idx !== i && it.material_id === m.id))}
                    value={item.material_id}
                    onChange={val => {
                      const mat = materials.find(m => m.id === val);
                      const items = [...form.items];
                      items[i] = { ...items[i], material_id: val, uom_allow_decimal: mat?.uom_allow_decimal || false };
                      setForm({ ...form, items });
                    }}
                    size="small"
                    error={!!itemErrors[i]?.material_id}
                    helperText={itemErrors[i]?.material_id}
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Quantity"
                  type="number"
                  value={item.quantity}
                  error={!!itemErrors[i]?.quantity}
                  helperText={itemErrors[i]?.quantity}
                  onKeyDown={e => {
                    const blockList = ['-', '+', 'e', 'E'];
                    if (!item.uom_allow_decimal) blockList.push('.');
                    if (blockList.includes(e.key)) e.preventDefault();
                  }}
                  onChange={e => {
                    let val = e.target.value.replace(/-/g, '');
                    if (!item.uom_allow_decimal) val = val.replace(/\./g, '');
                    updateItem(i, 'quantity', val);
                  }}
                  inputProps={{ min: 1, step: item.uom_allow_decimal ? "any" : "1" }}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Numbers sx={{ color: '#94A3B8' }} /></InputAdornment>,
                    endAdornment: item.material_id && (
                      <InputAdornment position="end">
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                          {materials.find(m => m.id === item.material_id)?.uom_name || ''}
                        </Typography>
                      </InputAdornment>
                    )
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
                  {form.items.length > 1 && (
                    <Tooltip title="Remove Item">
                      <IconButton size="small" color="error" onClick={() => removeItem(i)} sx={{ bgcolor: '#fff', border: '1px solid #fee2e2' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
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
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', mb: 0.5, display: 'block' }}>REMARKS & NOTES</Typography>
            <TextField inputProps={{ maxLength: 255 }}
              fullWidth
              placeholder="Enter any additional instructions or remarks..."
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              multiline
              rows={3}
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><Notes sx={{ color: '#94A3B8' }} /></InputAdornment>,
                sx: { borderRadius: 2 }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => { setDialog(false); setEditingPRId(null); }} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="outlined"
            onClick={() => handleSave('Draft')}
            sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700 }}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSave('Submitted')}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              textTransform: 'none'
            }}
          >
            Submit PR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert PR to PO Dialog — ONLY the specific approved PR */}
      <Dialog
        open={convertDialog.open}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setConvertDialog({ ...convertDialog, open: false }); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ShoppingCart fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Convert {convertDialog.pr?.pr_number} to Purchase Order</Typography>
              <Typography variant="body2" color="text.secondary">Create a purchase order from this approved request.</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1d4ed8', whiteSpace: 'nowrap', mt: 1 }}>Select Vendor:</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <Autocomplete
                          options={vendors}
                          getOptionLabel={(option) => `${option.code} - ${option.name}`}
                          value={vendors.find(v => v.id === convertDialog.vendor_id) || null}
                          onChange={(e, newValue) => {
                            const vId = newValue ? newValue.id : '';
                            const vendor = newValue;
                            const vendorState = vendor?.state || '';
                            const updatedItems = convertDialog.items.map(it => {
                              const material = materials.find(m => m.id === it.material_id);
                              const gstRate = material?.gst_rate || 0;
                              const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
                                gstRate, vendorState, tenantConfig?.base_state,
                                tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent
                              );
                              return { ...it, cgst_percentage, sgst_percentage, igst_percentage };
                            });
                            setConvertDialog({ ...convertDialog, vendor_id: vId, items: updatedItems });
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Vendor *" size="small" />
                          )}
                          fullWidth
                          size="small"
                          disableClearable
                        />
                        {convertDialog.vendor_id && (() => {
                          const vendor = vendors.find(v => v.id === convertDialog.vendor_id);
                          if (!vendor) return null;
                          return (
                            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5, lineHeight: 1.3 }}>
                              {[vendor.address_line_1, vendor.address_line_2, vendor.city_name, vendor.state ? vendor.state + (vendor.pincode ? ' - ' + vendor.pincode : '') : vendor.pincode].filter(Boolean).join(', ')}
                            </Typography>
                          );
                        })()}
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <DatePicker
                      label="Delivery Date"
                      value={dayjs(convertDialog.delivery_date)}
                      onChange={val => setConvertDialog({ ...convertDialog, delivery_date: val })}
                      format="DD-MMM-YYYY"
                      localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          InputProps: {
                            startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ color: '#94A3B8' }} /></InputAdornment>
                          },
                          sx: { bgcolor: '#fff', borderRadius: 1 }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  disabled={!convertDialog.vendor_id || !convertDialog.terms?.trim()}
                  onClick={handleConvert}
                  sx={{ py: 1, px: 3, fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
                >
                  Confirm & Convert
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>PR Details</Typography>
          <Grid container spacing={0.5} sx={{ mb: 2 }}>
            {[
              { label: 'Requester', value: convertDialog.pr?.requester_name },
              { label: 'Dept', value: convertDialog.pr?.department_name },
              { label: 'Bldg', value: convertDialog.pr?.building_name },
              { label: 'PR Date', value: formatDate(convertDialog.pr?.created_at) },
              { label: 'Items', value: `${convertDialog.pr?.items?.length || 0} materials` },
            ].map((item, idx) => (
              <Grid item xs={2} key={idx}>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>{item.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value || '—'}</Typography>
              </Grid>
            ))}
            <Grid item xs={2}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', lineHeight: 1, fontSize: '0.65rem' }}>Status</Typography>
              <Box sx={{ mt: 0.2 }}><StatusChip status={convertDialog.pr?.status || ''} /></Box>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>Specify Rates for Items</Typography>

          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc', '& th': { py: 0.75, px: 1 } }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>MATERIAL</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>APPROVED QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 100 }}>Rate (₹)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>Disc %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>CGST %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>SGST %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>IGST %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {convertDialog.items?.map((it, i) => (
                <TableRow key={i} sx={{ '& td': { py: 0.5, px: 1 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>{it.material_code}</Typography>
                    {it.last_purchase_price != null ? (
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'block' }}>
                        LPP: ₹{it.last_purchase_price}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                        No prior purchases
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>{it.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{it.approved_quantity !== null && it.approved_quantity !== undefined ? it.approved_quantity : it.quantity}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
                      <TextField size="small" type="number" value={it.rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertItem(i, 'rate', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0 }} required sx={{ width: 110 }} />
                      <Typography sx={{ position: 'absolute', top: '100%', right: 0, fontSize: '0.65rem', color: '#2563EB', mt: 0.5, whiteSpace: 'nowrap' }}>
                        Base: ₹{materials.find(m => m.id === it.material_id)?.standard_cost || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" type="number" value={it.discount_percent} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertItem(i, 'discount_percent', e.target.value.replace(/-/g, ''))} inputProps={{ min: 0 }} sx={{ width: 70 }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number" value={it.cgst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertItem(i, 'cgst_percentage', e.target.value.replace(/-/g, ''))} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 70, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number" value={it.sgst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertItem(i, 'sgst_percentage', e.target.value.replace(/-/g, ''))} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 70, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                  </TableCell>
                  <TableCell align="right">
                    <TextField size="small" variant="standard" type="number" value={it.igst_percentage} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateConvertItem(i, 'igst_percentage', e.target.value.replace(/-/g, ''))} InputProps={{ disableUnderline: true, readOnly: true }} inputProps={{ min: 0, style: { textAlign: 'right' } }} sx={{ width: 70, '& .MuiInputBase-input.Mui-readOnly': { color: '#64748b' } }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', mb: 0.5, display: 'block', textTransform: 'uppercase' }}>
              Terms and Conditions
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
              <InputLabel>Select Template</InputLabel>
              <Select
                label="Select Template"
                onChange={e => {
                  const t = termsTemplates.find(x => x.id === e.target.value);
                  if (t) setConvertDialog({ ...convertDialog, terms: t.content });
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
              rows={3}
              placeholder="Enter terms and conditions to be included in the PO..."
              value={convertDialog.terms}
              onChange={e => setConvertDialog({ ...convertDialog, terms: e.target.value })}
              sx={{ bgcolor: '#fff' }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => setConvertDialog({ ...convertDialog, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
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
          <Button onClick={handleCancelConfirm}>Close</Button>
          <Button variant="contained" color={confirm.confirmColor}
            disabled={confirm.needsReason && !reason.trim()}
            onClick={handleConfirm} sx={{ fontWeight: 600 }}>
            {confirm.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setApprovalDialog({ open: false, pr: null, items: {} }); setApprovalRemarks(''); } }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Approve PR? — {approvalDialog.pr?.pr_number}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.pr?.requester_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Institution</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.pr?.project_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.pr?.department_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(approvalDialog.pr?.created_at)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Approval Level</Typography>
              <Typography sx={{ fontWeight: 600 }}>L{approvalDialog.pr?.current_approval_level}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><StatusChip status={approvalDialog.pr?.status || ''} /></Box>
            </Grid>
          </Grid>
          {approvalDialog.pr?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {approvalDialog.pr.remarks}
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
                  Qty Last Approved {approvalDialog.pr?.current_approval_level > 1 ? `(L${approvalDialog.pr.current_approval_level - 1})` : ''}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#e0e7ff', color: '#1e40af' }}>Qty Approved</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>Remarks</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>History</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvalDialog.pr?.items?.map(item => {
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ fontWeight: 500, color: '#64748B' }}>{item.uom_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: '#6366f1' }}>
                      {item.approved_quantity !== null && item.approved_quantity !== undefined && approvalDialog.pr?.current_approval_level > 1 ? item.approved_quantity : '—'}
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
                        <IconButton size="small" onClick={() => fetchApprovalHistory(approvalDialog.pr.id, item.material_id)}
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

          {/* Approval Remarks */}
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
          <Button onClick={() => { setApprovalDialog({ open: false, pr: null, items: {} }); setApprovalRemarks(''); }}>Cancel</Button>
          <Button
            variant="contained" color="primary" onClick={handleApproveClick} sx={{ fontWeight: 600 }}
            disabled={!approvalDialog.pr?.items?.every(item => {
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
