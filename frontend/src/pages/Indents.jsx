import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Divider, InputAdornment, TableSortLabel, useTheme, useMediaQuery, Autocomplete,
  Accordion, AccordionSummary, AccordionDetails, Collapse
} from '@mui/material';
import { Add, Delete, CheckCircle, Cancel, ReceiptLong, ShoppingCart, ArrowBack, Search, Apartment, Layers, MeetingRoom, AccountTree, Notes, Visibility, ExpandMore, History, Textsms } from '@mui/icons-material';
import { Tab, Tabs } from '@mui/material';
import api from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { computeGstSplit } from '../utils/gstCalculations';

export default function Indents() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const { tenantConfig } = useConfig();
  const [indents, setIndents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [allDepartmentsList, setAllDepartmentsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState({ open: false, indent: null, items: {} });
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [historyDialog, setHistoryDialog] = useState({ open: false, materialId: null, data: null, loading: false });
  const [detailHistoryData, setDetailHistoryData] = useState(null);
  const [detailHistoryOpen, setDetailHistoryOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('Awaiting Approval');
  const [filterInstitution, setFilterInstitution] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState(null);
  const [filterBuilding, setFilterBuilding] = useState(null);
  const [allBuildings, setAllBuildings] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openIndentId && indents.length > 0) {
      const targetId = location.state.openIndentId;
      const targetIndent = indents.find(i => i.id === targetId);
      if (targetIndent) {
        if (targetIndent.status === 'Awaiting Approval') {
          setTabValue('Awaiting Approval');
          setApprovalDialog({ open: true, indent: targetIndent, items: {} });
        } else {
          setTabValue(targetIndent.status);
          setDetailDialog(targetIndent);
        }
        
        // Clear the state via React Router so it forgets the openIndentId
        navigate(location.pathname, { replace: true, state: {} });
      }
    }

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('new') === 'true' && searchParams.get('complaint_id')) {
      const cId = searchParams.get('complaint_id');
      setShowForm(true);
      // Remove query params from URL so it doesn't trigger again on refresh
      navigate(location.pathname, { replace: true });

      // Fetch complaint details and pre-fill the form
      api.get(`/api/complaints/${cId}`).then(res => {
        const c = res.data;
        const newForm = {
          institution_id: c.institution_id || '',
          department: c.department_name || '',
          building_id: c.building_id || '',
          floor_id: c.floor_id || '',
          room_id: c.room_id || '',
          remarks: `Complaint ${c.docket_no} - ${c.nature_of_complaint || ''}`.trim(),
          complaint_id: cId,
          items: [{ material_id: '', requested_quantity: '' }]
        };
        setForm(newForm);

        // Trigger cascading dropdown data if we have a department
        if (c.department_name) {
          // Filter departments for the institution
          if (c.institution_id) {
            api.get('/api/departments').then(dRes => {
              const depts = (dRes.data || []).filter(d => d.institution_id === c.institution_id).map(d => d.name);
              setDepartmentsList(Array.from(new Set(depts)));
            }).catch(() => {});
          }

          // Load buildings/floors/rooms for this department
          api.get(`/api/rooms?department_name=${encodeURIComponent(c.department_name)}`).then(r => {
            const fetchedRooms = r.data || [];
            const uniqueBuildings = new Map();
            const uniqueFloors = new Map();

            fetchedRooms.forEach(room => {
              if (room.building_id && room.building_name) {
                uniqueBuildings.set(room.building_id, { id: room.building_id, name: room.building_name });
              }
              if (room.floor_id && room.floor_name) {
                uniqueFloors.set(room.floor_id, { id: room.floor_id, name: room.floor_name, building_id: room.building_id });
              }
            });

            setBuildings(Array.from(uniqueBuildings.values()));
            setFloors(Array.from(uniqueFloors.values()));
            setRooms(fetchedRooms);
          }).catch(() => {});
        }
      }).catch(err => {
        console.error('Failed to fetch complaint for pre-fill', err);
        setForm(prev => ({ ...prev, complaint_id: cId }));
      });
    }
  }, [location.state, location.search, indents]);

  // Sorting state
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');





  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredIndentsBase = indents
    .filter(i => i.status !== 'Converted to PO')
    .filter(i => !filterInstitution || i.institution_id === filterInstitution.id || i.institution_name === filterInstitution.name)
    .filter(i => !filterDepartment || i.department === filterDepartment)
    .filter(i => !filterBuilding || i.building_id === filterBuilding.id || i.building_name === filterBuilding.name);

  const sortedIndents = [...filteredIndentsBase]
    .filter(i => tabValue === 'All' || i.status === tabValue)
    .sort((a, b) => {
      let valA = a[orderBy] || '';
      let valB = b[orderBy] || '';

      // Handle string comparison case-insensitively
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

  const availableBuildingsForFilter = useMemo(() => {
    if (!filterInstitution && !filterDepartment) return allBuildings;
    const validBldgs = new Map();
    if (filterDepartment) {
      allBuildings.filter(b => b.department_name === filterDepartment).forEach(b => validBldgs.set(b.id, b));
      allDepartments.filter(d => d.name === filterDepartment && (!filterInstitution || d.institution_id === filterInstitution.id)).forEach(d => {
        if (d.building_id) {
          const b = allBuildings.find(x => x.id === d.building_id);
          if (b) validBldgs.set(b.id, b);
        }
      });
      return Array.from(validBldgs.values());
    }
    if (filterInstitution) {
      allBuildings.filter(b => b.institution_id === filterInstitution.id).forEach(b => validBldgs.set(b.id, b));
      allDepartments.filter(d => d.institution_id === filterInstitution.id).forEach(d => {
        if (d.building_id) {
          const b = allBuildings.find(x => x.id === d.building_id);
          if (b) validBldgs.set(b.id, b);
        }
      });
      return Array.from(validBldgs.values());
    }
    return allBuildings;
  }, [filterInstitution, filterDepartment, allBuildings, allDepartments]);

  useEffect(() => {
    if (filterBuilding && !availableBuildingsForFilter.find(b => b.id === filterBuilding.id)) {
      setFilterBuilding(null);
    }
  }, [availableBuildingsForFilter, filterBuilding]);

  const [form, setForm] = useState({
    institution_id: '', building_id: '', floor_id: '', room_id: '', department: '', remarks: '', items: [{ material_id: '', requested_quantity: '' }], complaint_id: ''
  });

  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState({});



  const [vendors, setVendors] = useState([]);
  const [termsTemplates, setTermsTemplates] = useState([]);




  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => Object.keys(prev).length > 0 ? {} : prev);
    setItemErrors(prev => Object.keys(prev || {}).length > 0 ? {} : prev);
  }, [form]);

  useEffect(() => {
    setErrors(prev => Object.keys(prev).length > 0 ? {} : prev);
    setItemErrors(prev => Object.keys(prev || {}).length > 0 ? {} : prev);
  }, [form]);

  const navigate = useNavigate();

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'primary', action: null, needsReason: false });
  const [reason, setReason] = useState('');

  const showConfirm = (title, message, confirmText, confirmColor, action, needsReason = false) => {
    setReason('');
    setConfirm({ open: true, title, message, confirmText, confirmColor, action, needsReason });
  };
  const handleConfirm = () => { if (confirm.action) confirm.action(reason); setConfirm({ ...confirm, open: false }); };
  const handleCancelConfirm = (e, reason) => { if (reason === 'backdropClick' || reason === 'escapeKeyDown') return; setConfirm({ ...confirm, open: false }); };

  const load = () => { api.get('/api/indents', { params: { search: search || undefined } }).then(r => setIndents(r.data)); };
  useEffect(() => { load(); }, [search]);

  // Auto-refresh polling: silently re-fetch indents every 15 seconds when listing is visible
  const showFormRef = useRef(showForm);
  showFormRef.current = showForm;
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showFormRef.current) {
        api.get('/api/indents', { params: { search: search || undefined } }).then(r => setIndents(r.data)).catch(() => {});
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [search]);

  useEffect(() => {
    load();
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || []));
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/terms').then(r => setTermsTemplates(r.data));
    api.get('/api/departments/names').then(r => {
      setAllDepartmentsList(r.data);
      setDepartmentsList(r.data);
      if (r.data.length === 1) setFilterDepartment(r.data[0]);
    }).catch(() => {
      setAllDepartmentsList([]);
      setDepartmentsList([]);
    });
    api.get('/api/departments').then(r => setAllDepartments(r.data)).catch(() => setAllDepartments([]));
    api.get('/api/buildings').then(r => setAllBuildings(r.data)).catch(() => setAllBuildings([]));
    api.get('/api/institutions').then(r => {
      setInstitutions(r.data);
      if (r.data.length === 1) setFilterInstitution(r.data[0]);
    }).catch(() => setInstitutions([]));
  }, []);

  const handleInstitutionChange = (instId) => {
    setForm(prev => ({ ...prev, institution_id: instId, department: '', building_id: '', floor_id: '', room_id: '' }));
    setBuildings([]);
    setFloors([]);
    setRooms([]);

    if (instId) {
      // Filter available departments based on the selected institution
      const depts = allDepartments.filter(d => d.institution_id === instId).map(d => d.name);
      // Remove duplicates
      setDepartmentsList(Array.from(new Set(depts)));
    } else {
      setDepartmentsList([]); // Clear if no institution
    }
  };

  const handleDepartmentChange = (newDept, instId = form.institution_id) => {
    if (newDept) {
      api.get(`/api/rooms?department_name=${encodeURIComponent(newDept)}`).then(r => {
        const fetchedRooms = r.data || [];
        const uniqueBuildings = new Map();
        const uniqueFloors = new Map();

        fetchedRooms.forEach(room => {
          if (room.building_id && room.building_name) {
            uniqueBuildings.set(room.building_id, { id: room.building_id, name: room.building_name });
          }
          if (room.floor_id && room.floor_name) {
            uniqueFloors.set(room.floor_id, { id: room.floor_id, name: room.floor_name, building_id: room.building_id });
          }
        });

        const masterDepts = allDepartments.filter(d => d.name === newDept && (!instId || d.institution_id === instId));
        masterDepts.forEach(d => {
          if (d.building_id && d.building_name) {
            uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
          }
        });

        const masterBldgs = allBuildings.filter(b => b.department_name === newDept);
        masterBldgs.forEach(b => {
          uniqueBuildings.set(b.id, { id: b.id, name: b.name });
        });

        const bldgs = Array.from(uniqueBuildings.values());
        const flrs = Array.from(uniqueFloors.values());

        setBuildings(bldgs);
        setFloors(flrs);
        setRooms(fetchedRooms);

        let nextBuildingId = '';
        let nextFloorId = '';
        let nextRoomId = '';

        if (bldgs.length === 1) nextBuildingId = bldgs[0].id;

        const availableFloors = flrs.filter(f => !nextBuildingId || f.building_id === nextBuildingId);
        if (availableFloors.length === 1) nextFloorId = availableFloors[0].id;

        const availableRooms = fetchedRooms.filter(rm => !nextFloorId || rm.floor_id === nextFloorId);
        if (availableRooms.length === 1) nextRoomId = availableRooms[0].id;

        setForm(prev => ({ ...prev, department: newDept, building_id: nextBuildingId, floor_id: nextFloorId, room_id: nextRoomId }));
      }).catch(() => {
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
        setForm(prev => ({ ...prev, department: newDept, building_id: nextBuildingId, floor_id: '', room_id: '' }));
      });
    } else {
      setBuildings([]);
      setFloors([]);
      setRooms([]);
      setForm(prev => ({ ...prev, department: '', building_id: '', floor_id: '', room_id: '' }));
    }
  };

  const handleBuildingChange = (buildingId) => {
    let nextFloorId = '';
    let nextRoomId = '';
    const availableFloors = floors.filter(f => f.building_id === buildingId);
    if (availableFloors.length === 1) {
      nextFloorId = availableFloors[0].id;
      const availableRooms = rooms.filter(rm => rm.floor_id === nextFloorId);
      if (availableRooms.length === 1) nextRoomId = availableRooms[0].id;
    }
    setForm(prev => ({ ...prev, building_id: buildingId, floor_id: nextFloorId, room_id: nextRoomId }));
  };

  const handleFloorChange = (floorId) => {
    let nextRoomId = '';
    const availableRooms = rooms.filter(rm => rm.floor_id === floorId);
    if (availableRooms.length === 1) nextRoomId = availableRooms[0].id;
    setForm(prev => ({ ...prev, floor_id: floorId, room_id: nextRoomId }));
  };

  const addItem = () => {
    const emptyCount = form.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", "Limit Reached", "warning");
      return;
    }
    setForm({ ...form, items: [...form.items, { material_id: '', requested_quantity: '' }] });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  // Get UOM name for a selected material
  const getUomForMaterial = (materialId) => {
    const mat = materials.find(m => m.id === materialId);
    return mat?.uom_name || mat?.uom || '—';
  };

  const handleCreate = async () => {
    try {
      const newErrors = {};
      if (!form.institution_id) newErrors.institution_id = "Institution is required";
      if (!form.department) newErrors.department = "Department is required";

      const mappedItems = form.items.map(it => ({
        material_id: it.material_id,
        requested_quantity: parseFloat(it.requested_quantity) || 0
      }));

      const newItemErrors = {};
      mappedItems.forEach((it, i) => {
        if (!it.material_id) {
          newItemErrors[i] = { ...newItemErrors[i], material_id: "Material required" };
        }
        if (it.requested_quantity <= 0) {
          newItemErrors[i] = { ...newItemErrors[i], quantity: "Quantity > 0" };
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

      const selectedFloor = floors.find(f => f.id === form.floor_id);
      const selectedRoom = rooms.find(r => r.id === form.room_id);

      // Map to backend fields
      const payload = {
        institution_id: form.institution_id || null,
        room_id: form.room_id || null,
        building_id: form.building_id || null,
        floor: selectedFloor?.name || '',
        location: selectedRoom?.name || '',
        department: form.department,
        complaint_id: form.complaint_id ? parseInt(form.complaint_id) : null,
        remarks: form.remarks,
        items: mappedItems
      };

      const response = await api.post('/api/indents', payload);
      const indentNo = response.data?.indent_number || '';
      setShowForm(false); load();
      showMessage(`Indent ${indentNo} submitted successfully!`.replace('  ', ' '), "Success", "success");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Error';
      if (detail.includes('limit per month')) {
        showMessage(detail, "Limit Reached", "warning");
      } else {
        showMessage(detail, "Error", "error");
      }
    }
  };

  const fetchApprovalHistory = async (indentId, materialId) => {
    setHistoryDialog({ open: true, materialId, data: null, loading: true });
    try {
      const res = await api.get(`/api/indents/${indentId}/approval-history`);
      setHistoryDialog({ open: true, materialId, data: res.data, loading: false });
    } catch (err) {
      showMessage('Failed to load approval history', 'Error', 'error');
      setHistoryDialog({ open: false, materialId: null, data: null, loading: false });
    }
  };

  const fetchDetailHistory = async (indentId) => {
    try {
      const res = await api.get(`/api/indents/${indentId}/approval-history`);
      setDetailHistoryData(res.data);
      setDetailHistoryOpen(true);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message || 'Unknown error';
      showMessage(`Failed to load: ${detail}`, 'Error', 'error');
    }
  };

  const submitApproval = async () => {
    const { indent, items } = approvalDialog;
    if (!indent) return;

    const payloadItems = indent.items.map(it => {
      const itemData = items[it.id] || {};
      return {
        indent_item_id: it.id,
        approved_quantity: parseFloat(itemData.qty),
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
      const res = await api.post(`/api/indents/${indent.id}/approve`, {
        items: payloadItems,
        remarks: approvalRemarks || null
      });
      load();
      setApprovalDialog({ open: false, indent: null, items: {} });
      setApprovalRemarks('');
      let msg = res.data.message || "Indent approved successfully";
      if (msg === "Fully Approved") {
        msg = `${indent.indent_number} successfully approved`;
      } else if (msg.startsWith("Moved to level")) {
        msg = `${indent.indent_number} successfully approved. ${msg}`;
      }
      showMessage(msg, "Success", "success");
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error approving indent", "Error", "error");
    }
  };

  const handleApproveClick = () => {
    const { indent, items } = approvalDialog;
    if (!indent) return;

    let hasLargerQuantity = false;
    const largerItems = [];

    for (const it of indent.items) {
      const val = items[it.id]?.qty;
      const qty = parseFloat(val);
      if (qty > it.requested_quantity) {
        hasLargerQuantity = true;
        largerItems.push({ name: it.material_name, requested: it.requested_quantity, approved: qty, uom: it.uom_name, rem: items[it.id]?.rem || '' });
      }
    }

    if (hasLargerQuantity) {
      const msgJsx = (
        <>
          <span>You have entered an approved quantity larger than the requested quantity for the following items:</span>
          {largerItems.map((li, idx) => (
            <div key={idx} style={{ margin: '12px 0', paddingLeft: 8 }}>
              <strong>• {li.name}:</strong><br/>
              &nbsp;&nbsp;&nbsp;Requested: {li.requested} {li.uom}<br/>
              &nbsp;&nbsp;&nbsp;Approved: {li.approved} {li.uom}<br/>
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

  const rejectIndent = async (id, remarks) => {
    try {
      const res = await api.post(`/api/indents/${id}/reject`, { remarks });
      load();
      showMessage(res.data.message || "Indent rejected successfully", "Success", "success");
    } catch (err) {
      showMessage(err.response?.data?.detail || "Error rejecting indent", "Error", "error");
    }
  };



  // Status helpers
  const statusColor = {
    'Awaiting Approval': 'warning', 'Approved': 'success', 'Rejected': 'error',
    'Partially Issued': 'info', 'Issued': 'secondary', 'Fully Issued': 'secondary',
    'PO Created': 'primary', 'Closed': 'default',
    'Converted to PO': 'primary', 'Cancelled': 'default', 'Draft': 'default'
  };

  /* ─── INLINE CREATE FORM (reference-style card) ─── */
  if (showForm) {
    return (
      <Box>
        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Material Indents</Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>Raise and manage department material requests</Typography>
          </Box>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setShowForm(false)}>
            Back to List
          </Button>
        </Box>

        {/* Create Form Card */}
        <Card sx={{ border: '1.5px solid #e0e7ef', borderRadius: 3, p: { xs: 2, sm: 3, md: 4 }, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <ReceiptLong fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create New Indent</Typography>
              <Typography variant="body2" color="text.secondary">Raise a department material request with location details.</Typography>
            </Box>
          </Box>

          {/* ── Location Row ── */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Institution <span style={{ color: '#d32f2f' }}>*</span></Typography>
              <FormControl id="field-institution_id" fullWidth size="small" error={!!errors.institution_id}>
                <Select
                  value={form.institution_id}
                  displayEmpty
                  onChange={e => handleInstitutionChange(e.target.value)}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Institution</em></MenuItem>
                  {institutions.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>)}
                </Select>
                {errors.institution_id && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.institution_id}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Department <span style={{ color: '#d32f2f' }}>*</span></Typography>
              <Autocomplete
                id="field-department"
                options={departmentsList}
                value={form.department || null}
                onChange={(e, val) => handleDepartmentChange(val)}
                disabled={!form.institution_id}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    size="small" 
                    placeholder="Select Department" 
                    error={!!errors.department}
                    helperText={errors.department}
                    InputProps={{ ...params.InputProps, startAdornment: <><InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', ml: 1 }} /></InputAdornment>{params.InputProps.startAdornment}</> }} 
                    sx={{ 
                      bgcolor: '#fff',
                      ...(errors.department && {
                        '& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#d32f2f'
                        }
                      })
                    }} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>
                Building
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.building_id}
                  displayEmpty
                  onChange={e => handleBuildingChange(e.target.value)}
                  disabled={!form.department || buildings.length === 0}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><Apartment sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Building</em></MenuItem>
                  {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Floor</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.floor_id}
                  displayEmpty
                  onChange={e => handleFloorChange(e.target.value)}
                  disabled={!form.building_id || floors.filter(f => f.building_id === form.building_id).length === 0}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><Layers sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Floor</em></MenuItem>
                  {floors.filter(f => !form.building_id || f.building_id === form.building_id).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Room</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={form.room_id}
                  displayEmpty
                  onChange={e => setForm(prev => ({ ...prev, room_id: e.target.value }))}
                  disabled={!form.floor_id || rooms.filter(rm => rm.floor_id === form.floor_id).length === 0}
                  sx={{ bgcolor: '#fff' }}
                  startAdornment={<InputAdornment position="start"><MeetingRoom sx={{ color: '#94A3B8' }} /></InputAdornment>}
                >
                  <MenuItem value="" disabled><em>Select Room</em></MenuItem>
                  {rooms.filter(rm => !form.floor_id || rm.floor_id === form.floor_id).map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* ── Remarks ── */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b5998', mb: 0.5, display: 'block' }}>Remarks</Typography>
            <TextField inputProps={{ maxLength: 255 }}
              fullWidth size="small"
              placeholder="e.g. Electrical Lab maintenance, Hostel plumbing repair"
              value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              sx={{ bgcolor: '#fff' }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Notes sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* ── Items Section Header ── */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Items Requested</Typography>

          </Box>

          {/* ── Items Table ── */}
          <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '50%' }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '15%' }} align="center">Unit</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '20%' }} align="center">Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#3b5998', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5, width: '15%' }} align="center">Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, i) => (
                  <TableRow key={i} id={`item-row-${i}`} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1.5, verticalAlign: 'top' }}>
                      <MaterialSelect
                        materials={materials.filter(m => !form.items.some((it, idx) => idx !== i && it.material_id === m.id))}
                        value={item.material_id}
                        onChange={val => updateItem(i, 'material_id', val)}
                        label="Select Material"
                        size="small"
                        error={!!itemErrors[i]?.material_id}
                        helperText={itemErrors[i]?.material_id}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, verticalAlign: 'top', pt: 3 }}>
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                        {item.material_id ? getUomForMaterial(item.material_id) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, verticalAlign: 'top' }}>
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0"
                        onKeyDown={e => {
                          const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                          const allowDec = mat ? mat.uom_allow_decimal : false;
                          const blockList = ['-', '+', 'e', 'E'];
                          if (!allowDec) blockList.push('.');
                          if (blockList.includes(e.key)) e.preventDefault();
                        }}
                        value={item.requested_quantity}
                        onChange={e => {
                          const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                          const allowDec = mat ? mat.uom_allow_decimal : false;
                          let val = e.target.value.replace(/-/g, '');
                          if (!allowDec) val = val.replace(/\./g, '');
                          updateItem(i, 'requested_quantity', val);
                        }}
                        inputProps={{ 
                          min: 0, 
                          style: { textAlign: 'center' }, 
                          step: (item.material_id && materials.find(m => m.id === item.material_id)?.uom_allow_decimal) ? "any" : "1" 
                        }}
                        error={!!itemErrors[i]?.quantity}
                        helperText={itemErrors[i]?.quantity}
                        sx={{ width: 120, mx: 'auto', bgcolor: '#fff' }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, verticalAlign: 'top', pt: 2.5 }}>
                      {form.items.length > 1 ? (
                        <IconButton
                          size="small"
                          onClick={() => removeItem(i)}
                          sx={{
                            bgcolor: '#ef4444', color: '#fff', width: 30, height: 30,
                            '&:hover': { bgcolor: '#dc2626' }
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      ) : (
                        <IconButton size="small" disabled sx={{ width: 30, height: 30 }}>
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
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
                        color: '#2563EB', 
                        fontSize: '0.95rem',
                        borderColor: '#cbd5e1', 
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } 
                      }}
                    >
                      Add Another Item
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          {/* ── Action Buttons ── */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
            <Button
              variant="text" onClick={() => setShowForm(false)}
              sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1, color: '#64748B' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained" onClick={handleCreate}
              sx={{ textTransform: 'none', fontWeight: 700, px: 4, py: 1, borderRadius: 2, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
            >
              Submit Indent
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  /* ─── LISTING VIEW ─── */
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Material Indents</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Raise and manage department material requests</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          const defaultInst = institutions.length === 1 ? institutions[0].id : '';
          
          let defaultDept = '';
          if (defaultInst) {
            const depts = allDepartments.filter(d => d.institution_id === defaultInst).map(d => d.name);
            const uniqueDepts = Array.from(new Set(depts));
            setDepartmentsList(uniqueDepts);
            if (uniqueDepts.length === 1) defaultDept = uniqueDepts[0];
          } else {
            setDepartmentsList([]);
          }
          
          setForm({ institution_id: defaultInst, building_id: '', floor_id: '', room_id: '', department: defaultDept, remarks: '', items: [{ material_id: '', requested_quantity: '' }], complaint_id: '' });
          
          if (defaultDept) {
            handleDepartmentChange(defaultDept, defaultInst);
          }
          setShowForm(true);
        }}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5 }}
        >New Indent</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search Indent Numbers..." value={search}
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
          <Autocomplete
            size="small"
            options={availableBuildingsForFilter}
            getOptionLabel={(option) => option.name || ''}
            value={filterBuilding}
            onChange={(e, val) => setFilterBuilding(val)}
            renderInput={(params) => <TextField {...params} placeholder="Filter by Building" sx={{ minWidth: 220 }} />}
          />
        </Box>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {['Awaiting Approval', 'Approved', 'Rejected', 'Partially Issued', 'Issued', 'Closed', 'All'].map(s => {
            const count = s === 'All' ? filteredIndentsBase.length : filteredIndentsBase.filter(i => i.status === s).length;
            if (s !== 'All' && count === 0 && !['Awaiting Approval', 'Approved', 'Partially Issued'].includes(s)) return null;
            return (
              <Tab
                key={s}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s}
                    <Chip
                      label={count}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: tabValue === s ? 'primary.main' : 'action.selected', color: tabValue === s ? 'white' : 'text.primary' }}
                    />
                  </Box>
                }
                value={s}
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48, minWidth: 'auto', px: 2 }}
              />
            )
          })}
        </Tabs>
      </Card>

      <Card>
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {indents.length === 0 && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                No indents raised yet. Click "New Indent" to create one.
              </Typography>
            )}
            {sortedIndents.map(ind => (
              <Card key={ind.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => setDetailDialog(ind)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>{ind.indent_number}</Typography>
                  <Chip label={ind.status} size="small" color={statusColor[ind.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Dept:</strong> {ind.department || '-'} | <strong>Bldg:</strong> {ind.building_name || '-'}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Requester:</strong> {ind.requester_name}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>{formatDate(ind.created_at)} • {ind.items?.length || 0} items</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={`L${ind.current_approval_level}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
                  <Box sx={{ display: 'flex', gap: 0.5 }} onClick={e => e.stopPropagation()}>
                    <Tooltip title="Approve">
                      <span><IconButton size="small" color="success" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_approve') || !ind.can_user_approve}
                        onClick={() => setApprovalDialog({ open: true, indent: ind, items: {} })}>
                        <CheckCircle fontSize="small" />
                      </IconButton></span>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <span><IconButton size="small" color="error" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_reject') || !ind.can_user_approve}
                        onClick={() => showConfirm('Reject Indent?', `Are you sure you want to reject ${ind.indent_number}?`, 'Yes, Reject', 'error', (r) => rejectIndent(ind.id, r), true)}>
                        <Cancel fontSize="small" />
                      </IconButton></span>
                    </Tooltip>

                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" sx={{ minWidth: '100%', tableLayout: 'auto' }}>
              <TableHead>
                <TableRow sx={{ '& th': { px: 0.5, py: 1, fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' } }}>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'indent_number'} direction={orderBy === 'indent_number' ? order : 'asc'} onClick={() => handleRequestSort('indent_number')}>
                      Indent No.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'institution_name'} direction={orderBy === 'institution_name' ? order : 'asc'} onClick={() => handleRequestSort('institution_name')}>
                      Institution
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'department'} direction={orderBy === 'department' ? order : 'asc'} onClick={() => handleRequestSort('department')}>
                      Dept
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'building_name'} direction={orderBy === 'building_name' ? order : 'asc'} onClick={() => handleRequestSort('building_name')}>
                      Bldg.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'floor'} direction={orderBy === 'floor' ? order : 'asc'} onClick={() => handleRequestSort('floor')}>
                      Floor
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'room_name'} direction={orderBy === 'room_name' ? order : 'asc'} onClick={() => handleRequestSort('room_name')}>
                      Room
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'requester_name'} direction={orderBy === 'requester_name' ? order : 'asc'} onClick={() => handleRequestSort('requester_name')}>
                      Requester
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : 'asc'} onClick={() => handleRequestSort('created_at')}>
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Items</TableCell>
                  <TableCell>
                    <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : 'asc'} onClick={() => handleRequestSort('status')}>
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Lvl</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {indents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                      <Typography variant="body2">No indents raised yet. Click "New Indent" to create one.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {sortedIndents.map(ind => (
                  <TableRow key={ind.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, '& td': { px: 0.5, py: 0.75 } }} onClick={() => setDetailDialog(ind)}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{ind.indent_number}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.institution_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.department || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.building_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.floor || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.room_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem' }}>{ind.requester_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDate(ind.created_at)}</TableCell>
                    <TableCell align="center" sx={{ fontSize: '0.78rem' }}>{ind.items?.length || 0}</TableCell>
                    <TableCell><Chip label={ind.status} size="small" color={statusColor[ind.status] || 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 18 }} /></TableCell>
                    <TableCell align="center"><Chip label={`L${ind.current_approval_level}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Approve">
                          <span><IconButton size="small" color="success" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_approve') || !ind.can_user_approve}
                            onClick={() => setApprovalDialog({ open: true, indent: ind, items: {} })}>
                            <CheckCircle fontSize="small" />
                          </IconButton></span>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <span><IconButton size="small" color="error" disabled={ind.status !== 'Awaiting Approval' || !hasAction('indents', 'can_reject') || !ind.can_user_approve}
                            onClick={() => showConfirm('Reject Indent?', `Are you sure you want to reject ${ind.indent_number}?`, 'Yes, Reject', 'error', (r) => rejectIndent(ind.id, r), true)}>
                            <Cancel fontSize="small" />
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

      {/* Indent Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDetailDialog(null); }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.indent_number} — Indent Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.requester_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Institution</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.institution_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.department || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Building</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.building_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Floor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.floor || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Room</Typography>
              <Typography sx={{ fontWeight: 600 }}>{detailDialog?.room_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Indent Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.created_at)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} /></Box>
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
              <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                <TableCell sx={{ fontWeight: 600 }}>MATERIAL</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>UOM</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>REQUESTED QTY</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>APPROVED QTY</TableCell>
                {detailDialog?.status !== 'Awaiting Approval' && (
                  <>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>ISSUED QTY</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>PENDING QTY</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {detailDialog?.items?.map(item => (
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
                  {detailDialog?.status !== 'Awaiting Approval' && (
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
                            <TableRow sx={{ '& th': { py: 1, fontSize: '0.75rem', fontWeight: 700, color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'normal', verticalAlign: 'bottom' } }}>
                              <TableCell>MATERIAL</TableCell>
                              <TableCell>UOM</TableCell>
                              <TableCell align="right">REQ QTY</TableCell>
                              {detailHistoryData.entries.map((entry, idx) => (
                                <TableCell key={idx} align="center">L{entry.level} APPROVED QTY</TableCell>
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
                          {detailHistoryData.entries.filter(e => e.remarks).map((e, idx) => (
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
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => { setDetailDialog(null); setDetailHistoryOpen(false); setDetailHistoryData(null); }}>Close</Button></DialogActions>
      </Dialog>



      {/* Confirmation Dialog */}
      <Dialog open={confirm.open} onClose={handleCancelConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{confirm.message}</Typography>
          {confirm.needsReason && (
            <TextField fullWidth label="Reason (required)" value={reason} onChange={e => setReason(e.target.value)}
              multiline rows={2} required autoFocus />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelConfirm}>Cancel</Button>
          <Button variant="contained" color={confirm.confirmColor} disabled={confirm.needsReason && !reason.trim()} onClick={handleConfirm} sx={{ fontWeight: 600 }}>{confirm.confirmText}</Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') { setApprovalDialog({ open: false, indent: null, items: {} }); setApprovalRemarks(''); } }} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 600 }}>Approve Indent — {approvalDialog.indent?.indent_number}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 2, mt: 0.5 }}>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Requester</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.indent?.requester_name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Institution</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.indent?.institution_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Department</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.indent?.department || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Building</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.indent?.building_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Floor</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.indent?.floor || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Room</Typography>
              <Typography sx={{ fontWeight: 600 }}>{approvalDialog.indent?.room_name || '—'}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Date</Typography>
              <Typography sx={{ fontWeight: 600 }}>{formatDate(approvalDialog.indent?.created_at)}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Approval Level</Typography>
              <Typography sx={{ fontWeight: 600 }}>L{approvalDialog.indent?.current_approval_level}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={approvalDialog.indent?.status} size="small" color={statusColor[approvalDialog.indent?.status] || 'default'} /></Box>
            </Grid>
          </Grid>
          {approvalDialog.indent?.remarks && (
            <Typography variant="body2" sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <strong>Remarks:</strong> {approvalDialog.indent.remarks}
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
                  Qty Last Approved {approvalDialog.indent?.current_approval_level > 1 ? `(L${approvalDialog.indent.current_approval_level - 1})` : ''}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, bgcolor: '#e0e7ff', color: '#1e40af' }}>Qty Approved</TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>Remarks</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>History</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvalDialog.indent?.items?.map(item => {
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{item.material_code}</Typography>
                    </TableCell>
                    <TableCell align="left" sx={{ fontWeight: 500, color: '#64748B' }}>{item.uom_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>{item.requested_quantity}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: '#6366f1' }}>
                      {item.approved_quantity !== null && item.approved_quantity !== undefined && approvalDialog.indent?.current_approval_level > 1 ? item.approved_quantity : '—'}
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
                        const isHigher = !isNaN(approvedQty) && approvedQty > item.requested_quantity;
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
                        <IconButton size="small" onClick={() => fetchApprovalHistory(approvalDialog.indent.id, item.material_id)}
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
          <Button onClick={() => { setApprovalDialog({ open: false, indent: null, items: {} }); setApprovalRemarks(''); }}>Cancel</Button>
          <Button
            variant="contained" color="primary" onClick={handleApproveClick} sx={{ fontWeight: 600 }}
            disabled={!approvalDialog.indent?.items?.every(item => {
              const hasQty = approvalDialog.items[item.id]?.qty !== undefined && approvalDialog.items[item.id]?.qty !== '';
              if (!hasQty) return false;
              const approvedQty = parseFloat(approvalDialog.items[item.id]?.qty);
              if (!isNaN(approvedQty) && approvedQty > item.requested_quantity) {
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
