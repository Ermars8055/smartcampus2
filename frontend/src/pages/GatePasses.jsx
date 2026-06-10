import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl, TextField,
  InputLabel, IconButton, InputAdornment, MenuItem, Paper,
  Autocomplete, ListSubheader, createFilterOptions
} from '@mui/material';
import { Close, TaskAlt, Print, LocalShipping, Add, Comment, Person, Numbers, AccountTree, Delete } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';

export default function GatePasses() {
  const { hasAction } = useAuth();
  const [gatePasses, setGatePasses] = useState([]);
  const [previewGatePass, setPreviewGatePass] = useState(null);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Modal State
  const [gpModal, setGpModal] = useState({
    open: false,
    gate_pass_type: 'Returnable',
    project_id: '',
    from_source: '',
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

  const [receiveModal, setReceiveModal] = useState({ open: false, id: null, driver_name: '' });

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
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const openGpModal = () => {
    setGpModal({
      open: true,
      gate_pass_type: 'Returnable',
      project_id: projects[0]?.id || '',
      from_source: '',
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
      const projectId = gpModal.project_id || projects[0]?.id;
      if (!projectId) {
        alert("Please select a project.");
        return;
      }
      const validItems = gpModal.items.filter(item => item.material_id && parseFloat(item.quantity) > 0);
      if (validItems.length === 0) {
        alert("Please add at least one material item with a valid quantity.");
        return;
      }
      if (!gpModal.vendor_id && !gpModal.vendor_custom_name) {
        alert("Please select a vendor or type a vendor name.");
        return;
      }

      let fromDept = null;
      let fromStore = null;
      if (gpModal.from_source) {
        const parts = gpModal.from_source.split(':');
        const type = parts[0];
        const val = parts.slice(1).join(':'); // handle names with colons just in case
        if (type === 'dept') {
          fromDept = val;
        } else if (type === 'store') {
          fromStore = val;
        }
      }

      const payload = {
        gate_pass_type: gpModal.gate_pass_type,
        project_id: projectId,
        from_department: fromDept,
        from_store: fromStore,
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
      alert(err.response?.data?.detail || 'Error creating Gate Pass');
    }
  };

  const completeGatePass = async (id, type) => {
    try {
      if (type === 'Non-Returnable') {
        await api.put(`/api/gate-passes/${id}`, { status: 'Sent Out' });
        load();
      } else {
        setReceiveModal({ open: true, id, driver_name: '' });
      }
    } catch (e) { console.error(e); }
  };

  const submitReceive = async () => {
    try {
      if (!receiveModal.driver_name.trim()) {
        alert("Please enter the name of the person who brought the items.");
        return;
      }
      await api.put(`/api/gate-passes/${receiveModal.id}`, { 
        status: 'Repaired & Received',
        completed_by_name: receiveModal.driver_name,
        completed_at: new Date().toISOString()
      });
      setReceiveModal({ open: false, id: null, driver_name: '' });
      load();
    } catch (e) { console.error(e); }
  };

  const markAsSentOut = async (id) => {
    try {
      await api.put(`/api/gate-passes/${id}`, { status: 'Sent Out' });
      load();
    } catch (e) { console.error(e); }
  };

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
              <div style="font-size: 13px; margin-top: 4px; color: #555;">Store Operations Division</div>
            </div>
            <div class="title-section">
              <h2 class="doc-title">${gp.gate_pass_type === 'Returnable' ? 'Returnable Gate Pass' : 'Non-Returnable Gate Pass'}</h2>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">No:</span> <strong>${gp.gate_pass_number}</strong></div>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">Date:</span> ${formatDate(gp.created_at)}</div>
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-column">
              <div><span class="meta-label">From Dept:</span> ${gp.from_department || 'Central Store'}</div>
              <div><span class="meta-label">From Store:</span> ${gp.from_store || 'N/A'}</div>
              <div style="margin-top: 15px;"><span class="meta-label">To:</span></div>
              <div class="address-box">
                 <strong>${gp.vendor_custom_name || gp.vendor_name || 'Vendor / Recipient'}</strong><br/>
                 ${gp.vendor_custom_address || gp.vendor_address || 'Address not provided'}
              </div>
            </div>
            <div class="meta-column" style="text-align: right;">
              <div><span class="meta-label" style="min-width: auto; margin-right: 5px;">Ref Return No:</span> ${gp.reference_return_number || 'N/A'}</div>
              <div><span class="meta-label" style="min-width: auto; margin-right: 5px;">Purpose:</span> ${gp.remarks || 'Sent Out'}</div>
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

  const sourceOptions = [
    ...departments.map(d => ({ label: d.name, value: `dept:${d.name}`, group: 'Departments' })),
    ...warehouses.map(w => ({ label: w.name, value: `store:${w.name}`, group: 'Stores' }))
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Outward Gate Passes</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Track items sent out for repair and manage their return or scrap.</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openGpModal}
          disabled={!hasAction('gate_passes', 'can_create') && !hasAction('issues', 'can_issue')} // Fallback
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          Create Gate Pass
        </Button>
      </Box>

      {gatePasses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
          <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No gate passes found.</Typography>
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5, fontSize: '0.8rem', borderColor: '#F1F5F9' } }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>GATE PASS NO.</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>MATERIAL (QTY)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>GRN</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gatePasses.map(gp => (
                  <TableRow key={gp.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{gp.gate_pass_number}</TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{formatDate(gp.created_at)}</TableCell>
                    <TableCell>
                      {gp.items && gp.items.length > 0 ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                            {gp.items[0].material_name}
                            {gp.items.length > 1 && ` (+${gp.items.length - 1} more)`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            Total Qty: {gp.items.reduce((acc, item) => acc + item.quantity, 0)} items
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{gp.material_name || '-'}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>Qty: {gp.quantity} {gp.uom_name || ''}</Typography>
                        </>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{gp.grn_number || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={gp.status}
                        size="small"
                        color={['Issued', 'Pending Repair'].includes(gp.status) ? 'warning' : ['Repaired & Received', 'Repaired & Returned'].includes(gp.status) ? 'success' : 'error'}
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                      />
                      {gp.status === 'Repaired & Received' && (gp.completed_by_name || gp.completed_at) && (
                        <Box sx={{ mt: 0.5 }}>
                          {gp.completed_by_name && <Typography variant="caption" display="block" sx={{ color: '#64748B', lineHeight: 1.1 }}>By: {gp.completed_by_name}</Typography>}
                          {gp.completed_at && <Typography variant="caption" display="block" sx={{ color: '#64748B', lineHeight: 1.1 }}>On: {formatDate(gp.completed_at)}</Typography>}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => printGatePass(gp)}>
                        <Print fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={['Issued', 'Pending Repair'].includes(gp.status) ? "success" : "default"} 
                        onClick={() => completeGatePass(gp.id, gp.gate_pass_type)}
                        disabled={!['Issued', 'Pending Repair'].includes(gp.status)}
                        title="Mark as Repaired & Received"
                      >
                        <TaskAlt fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color={['Issued', 'Pending Repair'].includes(gp.status) ? "info" : "default"}
                        onClick={() => markAsSentOut(gp.id)}
                        disabled={!['Issued', 'Pending Repair'].includes(gp.status)}
                        title="Mark as Sent Out"
                      >
                        <LocalShipping fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* CREATE GATE PASS MODAL */}
      <Dialog open={gpModal.open} onClose={() => setGpModal({ ...gpModal, open: false })} maxWidth="md" fullWidth>
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
                onChange={e => setGpModal({ ...gpModal, gate_pass_type: e.target.value })}
              >
                <MenuItem value="Returnable">Returnable</MenuItem>
                <MenuItem value="Non-Returnable">Non-Returnable</MenuItem>
              </TextField>
            </Grid>

            {/* FROM DEPT / STORE COMBINED FIELD */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                size="small"
                options={sourceOptions}
                groupBy={(option) => option.group}
                getOptionLabel={(option) => option.label}
                value={sourceOptions.find(opt => opt.value === gpModal.from_source) || null}
                onChange={(event, newValue) => {
                  setGpModal({ ...gpModal, from_source: newValue ? newValue.value : '' });
                }}
                isOptionEqualToValue={(option, val) => option.value === val.value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="From Department/Store"
                    placeholder="Search department or store..."
                  />
                )}
              />
            </Grid>

            {/* VENDOR FIELDS (Searchable Autocomplete) */}
            <Grid item xs={12}>
              <Autocomplete
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
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Vendor Name"
                value={gpModal.vendor_custom_name}
                onChange={e => setGpModal({ ...gpModal, vendor_custom_name: e.target.value })}
                InputProps={{ readOnly: !!gpModal.vendor_id }}
                sx={!!gpModal.vendor_id ? { '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } } : {}}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Vendor Address"
                value={gpModal.vendor_custom_address}
                onChange={e => setGpModal({ ...gpModal, vendor_custom_address: e.target.value })}
                InputProps={{ readOnly: !!gpModal.vendor_id }}
                sx={!!gpModal.vendor_id ? { '& .MuiOutlinedInput-root': { bgcolor: '#F8FAFC' } } : {}}
              />
            </Grid>

            {/* ITEMS SECTION */}
            <Grid item xs={12}>
              <Box sx={{ mb: 1, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B' }}>MATERIAL DETAILS</Typography>
                <Button size="small" startIcon={<Add />} onClick={addGpItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
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
                            materials={materials}
                            value={item.material_id}
                            onChange={(val) => updateGpItem(idx, 'material_id', val)}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ width: 120 }}>
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ step: "1", min: "1" }}
                            onKeyDown={e => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                            fullWidth
                            value={item.quantity}
                            onChange={e => {
                              let val = e.target.value;
                              if (val.startsWith('0')) {
                                val = val.replace(/^0+/, '');
                              }
                              updateGpItem(idx, 'quantity', val);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
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
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth size="small" label="Remarks / Purpose"
                value={gpModal.remarks}
                onChange={e => setGpModal({ ...gpModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => setGpModal({ ...gpModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleGpSubmit} variant="contained" sx={{ px: 3, fontWeight: 700, borderRadius: 2 }}>Create Pass</Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewGatePass} onClose={() => setPreviewGatePass(null)} maxWidth="md" fullWidth>
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
      <Dialog open={receiveModal.open} onClose={() => setReceiveModal({ ...receiveModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#ECFDF5', borderRadius: 2, color: '#10B981', display: 'flex' }}>
                <TaskAlt fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Receive Repaired Items</Typography>
                <Typography variant="body2" color="text.secondary">Record details of the returned material</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setReceiveModal({ ...receiveModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          <TextField
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

    </Box>
  );
}
