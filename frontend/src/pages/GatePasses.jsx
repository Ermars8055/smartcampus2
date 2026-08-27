import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, Dialog, DialogTitle, TableSortLabel,
  DialogContent, DialogActions, Grid, Select, FormControl, TextField,
  InputLabel, IconButton, InputAdornment, MenuItem, Paper,
  Autocomplete, ListSubheader, createFilterOptions,
  RadioGroup, FormControlLabel, Radio, Tabs, Tab, Tooltip
} from '@mui/material';
import { Close, TaskAlt, Print, LocalShipping, Add, Comment, Person, Numbers, AccountTree, Delete, Search } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function GatePasses() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const [gatePasses, setGatePasses] = useState([]);
  const [previewGatePass, setPreviewGatePass] = useState(null);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [gateEntries, setGateEntries] = useState([]);
  const [grns, setGrns] = useState([]);

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('created_at');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Modal State
  const [viewModal, setViewModal] = useState({ open: false, data: null });
  const [gpModal, setGpModal] = useState({
    open: false,
    gate_pass_type: 'Returnable',
    reason_code: '',
    reason_other: '',
    project_id: '',
    source_type: 'department',
    from_department: '',
    from_store: '',
    vendor_id: '',
    vendor_custom_name: '',
    vendor_custom_address: '',
    driver_name: '',
    vehicle_number: '',
    remarks: '',
    items: [{ material_id: '', quantity: '', remarks: '' }]
  });

  const [receiveModal, setReceiveModal] = useState({ open: false, id: null, driver_name: '', gate_entry_number: '', grn_number: '' });
  const [errors, setErrors] = useState({});




  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear all errors when form changes
    });
  }, [gpModal]);

  const returnableReasons = [
    { code: 'TRANSFER', label: 'Transfer to Another Store/Site' },
    { code: 'REPAIR', label: 'Sent for Repair' },
    { code: 'CALIBRATION', label: 'Sent for Calibration' },
    { code: 'TEMP_ISSUE', label: 'Temporary Issue to Employee/Contractor' },
    { code: 'DEMO', label: 'Demonstration / Trial' },
    { code: 'RENTAL', label: 'Rental / Loan' },
    { code: 'OTHER', label: 'Other (Specify)' }
  ];

  const nonReturnableReasons = [
    { code: 'SALES', label: 'Customer Dispatch' },
    { code: 'RTV', label: 'Return to Vendor' },
    { code: 'SCRAP', label: 'Scrap Disposal' },
    { code: 'SAMPLE', label: 'Sample Dispatch' },
    { code: 'REPLACEMENT', label: 'Replacement to Customer' },
    { code: 'CONSUMPTION', label: 'Site Consumption' },
    { code: 'ASSET_DISPOSAL', label: 'Asset Disposal' },
    { code: 'OTHER', label: 'Other (Specify)' }
  ];

  const load = async () => {
    try {
      const gpRes = await api.get('/api/gate-passes');
      setGatePasses(gpRes.data);
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
      const vRes = await api.get('/api/vendors', { params: { limit: 10000 } });
      setVendors(Array.isArray(vRes.data) ? vRes.data : (vRes.data.items || []));
      const dRes = await api.get('/api/departments');
      setDepartments(dRes.data);
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
      const geRes = await api.get('/api/gate-entries', { params: { limit: 1000 } });
      setGateEntries(Array.isArray(geRes.data) ? geRes.data : (geRes.data.items || []));
      const grnRes = await api.get('/api/grn', { params: { limit: 1000 } });
      setGrns(Array.isArray(grnRes.data) ? grnRes.data : (grnRes.data.items || []));
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const openGpModal = () => {
    setGpModal({
      open: true,
      gate_pass_type: 'Returnable',
      reason_code: '',
      reason_other: '',
      project_id: projects[0]?.id || '',
      source_type: 'department',
      from_department: '',
      from_store: '',
      vendor_id: '',
      vendor_custom_name: '',
      vendor_custom_address: '',
      driver_name: '',
      vehicle_number: '',
      remarks: '',
      items: [{ material_id: '', quantity: '', remarks: '' }]
    });
    setErrors({});
  };





  const handleVendorChange = (selectedVendor) => {
    if (selectedVendor) {
      let parts = [];
      if (selectedVendor.address_line_1) {
        let l1 = selectedVendor.address_line_1.trim();
        if (l1.endsWith(',')) l1 = l1.slice(0, -1).trim();
        if (l1) parts.push(l1);
      }
      if (selectedVendor.address_line_2) {
        let l2 = selectedVendor.address_line_2.trim();
        if (l2.endsWith(',')) l2 = l2.slice(0, -1).trim();
        if (l2) parts.push(l2);
      }
      if (selectedVendor.city) {
        let city = selectedVendor.city.trim();
        if (city.endsWith(',')) city = city.slice(0, -1).trim();
        if (city) parts.push(city);
      }
      if (selectedVendor.state) {
        let stateName = selectedVendor.state.replace(/^\d{2}\s*-\s*/, '').trim();
        if (stateName) parts.push(stateName);
      }

      let addr = parts.join(', ');
      if (selectedVendor.pincode) addr += ` - ${selectedVendor.pincode.trim()}`;

      setGpModal(prev => ({
        ...prev,
        vendor_id: selectedVendor.id,
        vendor_custom_name: selectedVendor.name,
        vendor_custom_address: addr
      }));
    } else {
      setGpModal(prev => ({
        ...prev,
        vendor_id: '',
        vendor_custom_name: '',
        vendor_custom_address: ''
      }));
    }
  };

  const addGpItem = () => {
    const emptyCount = gpModal.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", 'Validation Error', 'warning');
      return;
    }
    setGpModal({
      ...gpModal,
      items: [...gpModal.items, { material_id: '', quantity: '', remarks: '' }]
    });
  };

  const removeGpItem = (index) => {
    const newItems = [...gpModal.items];
    newItems.splice(index, 1);
    setGpModal({ ...gpModal, items: newItems });
  };

  const updateGpItem = (index, field, value) => {
    const newItems = [...gpModal.items];
    newItems[index][field] = value;
    setGpModal({ ...gpModal, items: newItems });
  };

  const handleGpSubmit = async () => {
    try {
      const newErrors = {};
      const projectId = gpModal.project_id || projects[0]?.id;
      
      if (!projectId) newErrors.project_id = "Project is required";
      
      const validItems = gpModal.items.filter(item => item.material_id && parseFloat(item.quantity) > 0);
      if (validItems.length === 0) newErrors.items = "Please add at least one material item with a valid quantity.";
      
      if (!gpModal.vendor_id && !gpModal.vendor_custom_name) {
        newErrors.vendor = "Please select a vendor or type a vendor name.";
      }
      
      if (!gpModal.reason_code) {
        newErrors.reason_code = "Please select a Reason.";
      } else if (gpModal.reason_code === 'OTHER' && !gpModal.reason_other.trim()) {
        newErrors.reason_other = "Please specify the custom reason.";
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        const el = document.getElementById(`field-${firstErrorField}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const payload = {
        gate_pass_type: gpModal.gate_pass_type,
        reason_code: gpModal.reason_code === 'OTHER' ? gpModal.reason_other.trim() : gpModal.reason_code,
        project_id: projectId,
        from_department: gpModal.from_department || null,
        from_store: gpModal.from_store || null,
        vendor_id: gpModal.vendor_id || null,
        vendor_custom_name: gpModal.vendor_custom_name || null,
        vendor_custom_address: gpModal.vendor_custom_address || null,
        driver_name: null,
        vehicle_number: null,
        remarks: gpModal.remarks || null,
        items: validItems.map(item => ({
          material_id: item.material_id,
          quantity: parseFloat(item.quantity),
          remarks: item.remarks || null
        }))
      };
      await api.post('/api/gate-passes', payload);
      setGpModal({ ...gpModal, open: false });
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error creating Gate Pass', 'Error', 'error');
    }
  };

  const completeGatePass = async (id, type) => {
    try {
      if (type === 'Non-Returnable') {
        await api.put(`/api/gate-passes/${id}`, { status: 'Sent Out' });
        load();
      } else {
        setReceiveModal({ open: true, id, driver_name: '', gate_entry_number: '', grn_number: '' });
      }
    } catch (e) { console.error(e); }
  };

  const submitReceive = async () => {
    try {
      const newErrors = {};
      if (!receiveModal.driver_name.trim()) newErrors.driver_name = "Please enter the name of the person who brought the items.";
      
      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        const el = document.getElementById(`field-${firstErrorField}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      await api.put(`/api/gate-passes/${receiveModal.id}`, {
        status: 'Received',
        completed_by_name: receiveModal.driver_name,
        gate_entry_number: receiveModal.gate_entry_number || null,
        grn_number: receiveModal.grn_number || null,
        completed_at: new Date().toISOString()
      });
      setReceiveModal({ open: false, id: null, driver_name: '', gate_entry_number: '', grn_number: '' });
      setErrors({});
      load();
    } catch (e) { console.error(e); }
  };

  // Removed manual markAsSentOut function since backend handles it automatically.

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredGatePasses = gatePasses.filter(gp => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const gpNo = gp.gate_pass_number?.toLowerCase() || '';
      const vendor = (gp.vendor_name || gp.vendor_custom_name || '').toLowerCase();
      if (!gpNo.includes(q) && !vendor.includes(q)) {
        match = false;
      }
    }
    if (filterStatus !== 'All') {
      const displayStatus = ['Issued', 'Pending Repair', 'Yet to Receive'].includes(gp.status) ? 'Yet to Receive' : ['Received', 'Repaired & Received', 'Repaired & Returned'].includes(gp.status) ? 'Received' : gp.status;
      if (displayStatus !== filterStatus) match = false;
    }
    if (filterType !== 'All') {
      if (gp.gate_pass_type !== filterType) match = false;
    }
    return match;
  });

  const sortedGatePasses = [...filteredGatePasses].sort((a, b) => {
    let aVal = a[orderBy];
    let bVal = b[orderBy];

    if (orderBy === 'gate_pass_number') {
      aVal = a.gate_pass_number || '';
      bVal = b.gate_pass_number || '';
    } else if (orderBy === 'vendor_name') {
      aVal = a.vendor_name || a.vendor_custom_name || '';
      bVal = b.vendor_name || b.vendor_custom_name || '';
    } else if (orderBy === 'items_count') {
      aVal = a.items?.length || 0;
      bVal = b.items?.length || 0;
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const generateGatePassHTML = (gp) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${gp.gate_pass_number}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; font-size: 14px; margin: 0; padding: 40px; color: #000; line-height: 1.4; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .hospital-name { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin: 0; }
            .title-section { text-align: right; }
            .doc-title { font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; line-height: 1.8; }
            .meta-column { width: 48%; }
            .meta-label { font-weight: bold; margin-right: 10px; min-width: 90px; display: inline-block; }
            .address-box { border: 1px solid #ccc; padding: 12px; min-height: 80px; margin-top: 5px; border-radius: 4px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 50px; }
            th, td { border: 1px solid #000; padding: 12px 10px; text-align: left; }
            th { background-color: #f8f8f8; font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 100px; }
            .sig-block { text-align: center; font-weight: bold; width: 30%; border-top: 1px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="hospital-name">SMART CAMPUS</h1>
              <div style="font-size: 13px; margin-top: 4px; color: #555; margin-bottom: 20px;">Store Operations Division</div>
              <div style="font-size: 15px;">
                ${gp.from_department ? `<div><span class="meta-label">From Dept:</span> ${gp.from_department}</div>` : ''}
                ${gp.from_store ? `<div><span class="meta-label">From Store:</span> ${gp.from_store}</div>` : ''}
                ${!gp.from_department && !gp.from_store ? `<div><span class="meta-label">From:</span> Central Store</div>` : ''}
                <div><span class="meta-label">Purpose:</span> ${gp.remarks || 'Sent Out'}</div>
              </div>
            </div>
            <div class="title-section">
              <h2 class="doc-title">${gp.gate_pass_type === 'Returnable' ? 'Returnable Gate Pass' : 'Non-Returnable Gate Pass'}</h2>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">Gate Pass No:</span> <strong>${gp.gate_pass_number}</strong></div>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">Date:</span> ${formatDate(gp.created_at)}</div>
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-column" style="width: 100%;">
              <div><span class="meta-label">To:</span></div>
              <div class="address-box" style="width: 48%;">
                 <strong>${gp.vendor_custom_name || gp.vendor_name || 'Vendor / Recipient'}</strong><br/>
                 ${gp.vendor_custom_address || gp.vendor_address || 'Address not provided'}
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">Sl. No.</th>
                <th style="width: 45%;">Item / Description</th>
                <th style="width: 17%; text-align: center;">Qty.</th>
                <th style="width: 30%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${gp.items && gp.items.length > 0 ? gp.items.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${item.material_name}</strong></td>
                  <td style="text-align: center;">${item.quantity} ${item.uom_name || ''}</td>
                  <td>${item.remarks || ''}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td style="text-align: center;">1</td>
                  <td><strong>${gp.material_name}</strong></td>
                  <td style="text-align: center;">${gp.quantity} ${gp.uom_name || ''}</td>
                  <td></td>
                </tr>
              `}
            </tbody>
          </table>
          
          <div class="signatures">
            <div class="sig-block">Receiver's Sign.</div>
            <div class="sig-block">Issue Sign. Stores</div>
            <div class="sig-block">Authorised Sign. MD / MS</div>
          </div>
        </body>
      </html>
    `;
  };

  const printGatePass = (gp) => {
    setPreviewGatePass(gp);
  };



  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Outward Gate Passes</Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
            Track items sent out for repair and manage their return or scrap.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openGpModal}
          disabled={!hasAction('gate_passes', 'can_create') && !hasAction('issues', 'can_issue')} // Fallback
        >
          Create Gate Pass
        </Button>
      </Box>
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search GP No. or Vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
            }}
            sx={{ width: 250, bgcolor: '#fff', borderRadius: 1 }}
          />
          <TextField
            select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ width: 160, bgcolor: '#fff', borderRadius: 1 }}
          >
            {['All', 'Returnable', 'Non-Returnable'].map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Tabs
          value={['Yet to Receive', 'Received', 'Sent Out', 'All'].indexOf(filterStatus) !== -1 ? ['Yet to Receive', 'Received', 'Sent Out', 'All'].indexOf(filterStatus) : 0}
          onChange={(_, v) => setFilterStatus(['Yet to Receive', 'Received', 'Sent Out', 'All'][v])}
          variant="scrollable"
          scrollButtons={false}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {['Yet to Receive', 'Received', 'Sent Out', 'All'].map((s, i) => (
            <Tab
              key={i}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s}
                  <Chip
                    label={s === 'All' ? gatePasses.length : gatePasses.filter(gp => {
                        const displayStatus = ['Issued', 'Pending Repair', 'Yet to Receive'].includes(gp.status) ? 'Yet to Receive' : ['Received', 'Repaired & Received', 'Repaired & Returned'].includes(gp.status) ? 'Received' : gp.status;
                        return displayStatus === s;
                    }).length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: filterStatus === s ? 'primary.main' : 'action.selected',
                      color: filterStatus === s ? 'white' : 'text.primary',
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

      {gatePasses.length === 0 && !searchTerm && filterStatus === 'All' && filterType === 'All' ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
          <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No gate passes found.</Typography>
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5, fontSize: '0.8rem', borderColor: '#F1F5F9' } }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                    <TableSortLabel active={orderBy === 'gate_pass_number'} direction={orderBy === 'gate_pass_number' ? order : 'asc'} onClick={() => handleSortRequest('gate_pass_number')}>
                      GATE PASS NO.
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                    <TableSortLabel active={orderBy === 'gate_pass_type'} direction={orderBy === 'gate_pass_type' ? order : 'asc'} onClick={() => handleSortRequest('gate_pass_type')}>
                      TYPE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                    <TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : 'asc'} onClick={() => handleSortRequest('created_at')}>
                      DATE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                    <TableSortLabel active={orderBy === 'vendor_name'} direction={orderBy === 'vendor_name' ? order : 'asc'} onClick={() => handleSortRequest('vendor_name')}>
                      VENDOR
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#64748B' }}>
                    <TableSortLabel active={orderBy === 'items_count'} direction={orderBy === 'items_count' ? order : 'asc'} onClick={() => handleSortRequest('items_count')}>
                      NO. OF ITEMS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                    <TableSortLabel active={orderBy === 'status'} direction={orderBy === 'status' ? order : 'asc'} onClick={() => handleSortRequest('status')}>
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedGatePasses.map(gp => (
                  <TableRow key={gp.id} hover onClick={() => setViewModal({ open: true, data: gp })} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{gp.gate_pass_number}</TableCell>
                    <TableCell>
                      <Chip label={gp.gate_pass_type} size="small" variant="outlined" sx={{ fontWeight: 600, color: '#475569', borderColor: '#CBD5E1' }} />
                    </TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{formatDate(gp.created_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{gp.vendor_name || gp.vendor_custom_name || '-'}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${gp.items ? gp.items.length : 1}`} size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={gp.status === 'Pending Repair' ? 'Yet to Receive' : gp.status === 'Repaired & Received' ? 'Received' : gp.status}
                        size="small"
                        color={['Issued', 'Pending Repair', 'Yet to Receive'].includes(gp.status) ? 'warning' : ['Received', 'Repaired & Received', 'Repaired & Returned'].includes(gp.status) ? 'success' : 'error'}
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                      />
                      {(gp.status === 'Received' || gp.status === 'Repaired & Received') && (gp.completed_by_name || gp.completed_at) && (
                        <Box sx={{ mt: 0.5 }}>
                          {gp.completed_by_name && <Typography variant="caption" display="block" sx={{ color: '#64748B', lineHeight: 1.1 }}>By: {gp.completed_by_name}</Typography>}
                          {gp.completed_at && <Typography variant="caption" display="block" sx={{ color: '#64748B', lineHeight: 1.1 }}>On: {formatDate(gp.completed_at)}</Typography>}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={e => e.stopPropagation()}>
                      <Tooltip title="Print Gate Pass" arrow placement="top">
                        <IconButton size="small" color="primary" onClick={() => printGatePass(gp)}>
                          <Print fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark As Received" arrow placement="top">
                        <span>
                          <IconButton
                            size="small"
                            color={['Issued', 'Pending Repair', 'Yet to Receive'].includes(gp.status) ? "success" : "default"}
                            onClick={() => completeGatePass(gp.id, gp.gate_pass_type)}
                            disabled={!['Issued', 'Pending Repair', 'Yet to Receive'].includes(gp.status)}
                          >
                            <TaskAlt fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* CREATE GATE PASS MODAL */}
      <Dialog open={gpModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setGpModal({ ...gpModal, open: false }); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <LocalShipping fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Gate Pass</Typography>
                <Typography variant="body2" color="text.secondary">Issue a gate pass to send material out</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setGpModal({ ...gpModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Gate Pass Type"
                value={gpModal.gate_pass_type}
                onChange={e => setGpModal({ ...gpModal, gate_pass_type: e.target.value, reason_code: '' })}
              >
                <MenuItem value="Returnable">Returnable</MenuItem>
                <MenuItem value="Non-Returnable">Non-Returnable</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                id="field-reason_code"
                select
                fullWidth
                size="small"
                label="Reason *"
                error={!!errors.reason_code}
                helperText={errors.reason_code}
                value={gpModal.reason_code || ''}
                onChange={e => setGpModal({ ...gpModal, reason_code: e.target.value })}
              >
                {(gpModal.gate_pass_type === 'Returnable' ? returnableReasons : nonReturnableReasons).map(r => (
                  <MenuItem key={r.code} value={r.code}>{r.label}</MenuItem>
                ))}
              </TextField>
              {gpModal.reason_code === 'OTHER' && (
                <TextField
                  id="field-reason_other"
                  fullWidth
                  size="small"
                  label="Please specify reason *"
                  error={!!errors.reason_other}
                  helperText={errors.reason_other}
                  value={gpModal.reason_other}
                  onChange={e => setGpModal({ ...gpModal, reason_other: e.target.value })}
                  sx={{ mt: 2 }}
                />
              )}
            </Grid>

            {/* SOURCE TYPE RADIO & DROPDOWN */}
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>From Source</Typography>
                <RadioGroup
                  row
                  value={gpModal.source_type}
                  onChange={e => setGpModal({ ...gpModal, source_type: e.target.value, from_department: '', from_store: '' })}
                >
                  <FormControlLabel value="department" control={<Radio size="small" />} label={<Typography variant="body2">Department</Typography>} />
                  <FormControlLabel value="store" control={<Radio size="small" />} label={<Typography variant="body2">Store</Typography>} />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              {gpModal.source_type === 'department' ? (
                <Autocomplete
                  fullWidth
                  size="small"
                  options={departments}
                  getOptionLabel={(option) => option.name}
                  value={departments.find(d => d.name === gpModal.from_department) || null}
                  onChange={(event, newValue) => {
                    setGpModal({ ...gpModal, from_department: newValue ? newValue.name : '' });
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  renderInput={(params) => (
                    <TextField {...params} label="From Department" placeholder="Search department..." />
                  )}
                />
              ) : (
                <Autocomplete
                  fullWidth
                  size="small"
                  options={warehouses}
                  getOptionLabel={(option) => option.name}
                  value={warehouses.find(w => w.name === gpModal.from_store) || null}
                  onChange={(event, newValue) => {
                    setGpModal({ ...gpModal, from_store: newValue ? newValue.name : '' });
                  }}
                  isOptionEqualToValue={(option, val) => option.id === val.id}
                  renderInput={(params) => (
                    <TextField {...params} label="From Store" placeholder="Search store..." />
                  )}
                />
              )}
            </Grid>

            {/* VENDOR FIELDS (Searchable Autocomplete) */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="field-vendor"
                size="small"
                options={vendors}
                getOptionLabel={(option) => `${option.code || ''} - ${option.name || ''}`}
                value={vendors.find(v => v.id === gpModal.vendor_id) || null}
                onChange={(event, newValue) => handleVendorChange(newValue)}
                disabled={!!gpModal.vendor_custom_name && !gpModal.vendor_id}
                filterOptions={createFilterOptions({
                  matchFrom: 'any',
                  stringify: (option) => `${option.code || ''} ${option.name || ''}`
                })}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="To Vendor"
                    placeholder="Search vendor by code or name..."
                    error={!!errors.vendor}
                    helperText={errors.vendor}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Vendor Name"
                error={!!errors.vendor}
                helperText={errors.vendor}
                value={gpModal.vendor_custom_name}
                onChange={e => setGpModal({ ...gpModal, vendor_custom_name: e.target.value })}
                InputProps={{ readOnly: !!gpModal.vendor_id }}
                sx={!!gpModal.vendor_id ? { '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } } : {}}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Vendor Address"
                value={gpModal.vendor_custom_address}
                onChange={e => setGpModal({ ...gpModal, vendor_custom_address: e.target.value })}
                InputProps={{ readOnly: !!gpModal.vendor_id }}
                sx={!!gpModal.vendor_id ? { '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } } : {}}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField inputProps={{ maxLength: 255 }}
                fullWidth size="small" label="Remarks / Purpose"
                value={gpModal.remarks}
                onChange={e => setGpModal({ ...gpModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* ITEMS SECTION */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>MATERIAL DETAILS</Typography>
                {errors.items && <Typography color="error" variant="body2">{errors.items}</Typography>}

              </Box>

              <TableContainer id="field-items" component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: '50%', fontSize: '0.72rem' }}>MATERIAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: '20%', fontSize: '0.72rem' }}>QTY</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '25%', fontSize: '0.72rem' }}>REMARKS</TableCell>
                      <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gpModal.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <MaterialSelect
                            materials={materials.filter(m => !gpModal.items.some((it, i) => i !== idx && it.material_id === m.id))}
                            value={item.material_id}
                            onChange={(val) => updateGpItem(idx, 'material_id', val)}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ 
                              step: (item.material_id && materials.find(m => m.id === item.material_id)?.uom_allow_decimal) ? "any" : "1", 
                              min: "0" 
                            }}
                            onKeyDown={e => {
                              const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                              const allowDec = mat ? mat.uom_allow_decimal : false;
                              const blockList = ['-', '+', 'e', 'E'];
                              if (!allowDec) blockList.push('.');
                              if (blockList.includes(e.key)) e.preventDefault();
                            }}
                            fullWidth
                            value={item.quantity}
                            onChange={e => {
                              const mat = item.material_id ? materials.find(m => m.id === item.material_id) : null;
                              const allowDec = mat ? mat.uom_allow_decimal : false;
                              let val = e.target.value.replace(/-/g, '');
                              if (!allowDec) val = val.replace(/\./g, '');
                              if (val.startsWith('0') && val.length > 1 && !val.startsWith('0.')) {
                                val = val.replace(/^0+/, '');
                              }
                              updateGpItem(idx, 'quantity', val);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField inputProps={{ maxLength: 255 }}
                            size="small" fullWidth value={item.remarks}
                            onChange={e => updateGpItem(idx, 'remarks', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 16 }} /></InputAdornment>,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => removeGpItem(idx)} disabled={gpModal.items.length === 1}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={addGpItem}
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
              </TableContainer>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => setGpModal({ ...gpModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleGpSubmit} variant="contained" sx={{ px: 3, fontWeight: 700, borderRadius: 2 }}>Create Pass</Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewGatePass} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setPreviewGatePass(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Gate Pass Preview
          <IconButton onClick={() => setPreviewGatePass(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '70vh' }}>
          {previewGatePass && (
            <iframe
              srcDoc={generateGatePassHTML(previewGatePass)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Gate Pass Preview"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewGatePass(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={() => {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              document.body.appendChild(iframe);
              iframe.contentDocument.write(generateGatePassHTML(previewGatePass));
              iframe.contentDocument.close();
              setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                  document.body.removeChild(iframe);
                }, 1000);
              }, 200);
            }}
            sx={{ fontWeight: 700, px: 4, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
          >
            Print Gate Pass
          </Button>
        </DialogActions>
      </Dialog>

      {/* RECEIVE MODAL */}
      <Dialog open={receiveModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setReceiveModal({ ...receiveModal, open: false }); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#ECFDF5', borderRadius: 2, color: '#10B981', display: 'flex' }}>
                <TaskAlt fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Receive Items</Typography>
                <Typography variant="body2" color="text.secondary">Record details of the returned material</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setReceiveModal({ ...receiveModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={gateEntries.map((ge) => ge.entry_number || ge.gate_entry_number || '')}
                value={receiveModal.gate_entry_number}
                onInputChange={(event, newInputValue) => {
                  const matchedGE = gateEntries.find(ge => (ge.entry_number || ge.gate_entry_number) === newInputValue);
                  setReceiveModal(prev => ({
                    ...prev,
                    gate_entry_number: newInputValue,
                    driver_name: matchedGE?.delivery_person_name ? matchedGE.delivery_person_name : prev.driver_name
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Gate Entry Number" variant="outlined" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={grns.map((grn) => grn.grn_number || '')}
                value={receiveModal.grn_number}
                onInputChange={(event, newInputValue) => {
                  const matchedGRN = grns.find(grn => grn.grn_number === newInputValue);
                  setReceiveModal(prev => ({
                    ...prev,
                    grn_number: newInputValue,
                    driver_name: matchedGRN?.received_by_name ? matchedGRN.received_by_name : prev.driver_name
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label="GRN Number" variant="outlined" />
                )}
              />
            </Grid>
          </Grid>
          <TextField
            id="field-driver_name"
            fullWidth
            label="Received By / Driver Name *"
            variant="outlined"
            value={receiveModal.driver_name}
            onChange={(e) => setReceiveModal({ ...receiveModal, driver_name: e.target.value })}
            placeholder="Who brought these items?"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
          <Button onClick={() => setReceiveModal({ ...receiveModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={submitReceive} variant="contained" color="success" sx={{ px: 3, fontWeight: 700, borderRadius: 2 }}>Confirm Receipt</Button>
        </DialogActions>
      </Dialog>


      {/* VIEW MODAL */}
      <Dialog open={viewModal.open} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setViewModal({ open: false, data: null }); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Gate Pass Details</Typography>
              <Typography variant="body2" color="text.secondary">{viewModal.data?.gate_pass_number}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setViewModal({ open: false, data: null })}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          {viewModal.data && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Date</Typography>
                  <Typography variant="body1" fontWeight={600}>{formatDate(viewModal.data.created_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
                  <Chip
                    label={viewModal.data.status === 'Pending Repair' ? 'Yet to Receive' : viewModal.data.status === 'Repaired & Received' ? 'Received' : viewModal.data.status}
                    size="small"
                    color={['Issued', 'Pending Repair', 'Yet to Receive'].includes(viewModal.data.status) ? 'warning' : ['Received', 'Repaired & Received', 'Repaired & Returned'].includes(viewModal.data.status) ? 'success' : 'error'}
                    sx={{ mt: 0.5, fontWeight: 700 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Type</Typography>
                  <Typography variant="body1" fontWeight={600}>{viewModal.data.gate_pass_type}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Reason</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {(() => {
                      const code = viewModal.data.reason_code;
                      const matched = returnableReasons.find(r => r.code === code) || nonReturnableReasons.find(r => r.code === code);
                      return matched ? matched.label : (code || '-');
                    })()}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">Vendor</Typography>
                  <Typography variant="body1" fontWeight={600}>{viewModal.data.vendor_name || viewModal.data.vendor_custom_name || '-'}</Typography>
                  {viewModal.data.vendor_custom_address && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{viewModal.data.vendor_custom_address}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">From Source</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {viewModal.data.from_department ? `Dept: ${viewModal.data.from_department}` : (viewModal.data.from_store ? `Store: ${viewModal.data.from_store}` : '-')}
                  </Typography>
                </Grid>

                {viewModal.data.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="block">Remarks / Purpose</Typography>
                    <Typography variant="body2">{viewModal.data.remarks}</Typography>
                  </Grid>
                )}

                {(viewModal.data.status === 'Received' || viewModal.data.status === 'Repaired & Received') && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block">Gate Entry Number</Typography>
                      <Typography variant="body1" fontWeight={600}>{viewModal.data.gate_entry_number || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block">GRN Number</Typography>
                      <Typography variant="body1" fontWeight={600}>{viewModal.data.grn_number || '-'}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#64748B' }}>MATERIAL ITEMS</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>QTY</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>REMARKS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewModal.data.items && viewModal.data.items.length > 0 ? (
                      viewModal.data.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{item.material_name}</Typography>
                            {item.material_code && <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>{item.material_code}</Typography>}
                          </TableCell>
                          <TableCell align="center">{item.quantity} {item.uom_name || ''}</TableCell>
                          <TableCell>{item.remarks || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{viewModal.data.material_name}</Typography>
                          {viewModal.data.material_code && <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>{viewModal.data.material_code}</Typography>}
                        </TableCell>
                        <TableCell align="center">{viewModal.data.quantity} {viewModal.data.uom_name || ''}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
