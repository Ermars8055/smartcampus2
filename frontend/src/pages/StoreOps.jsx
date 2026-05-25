import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Tab, Tabs, Stack, Paper, Autocomplete, InputAdornment
} from '@mui/material';
import { Add, Delete, Close, CheckCircle, InfoOutlined, Undo, SwapHoriz, Inventory2, ArrowBack, History, Warehouse, AccountTree, Business, Assignment, Person, Comment, Description, LocalShipping, Print, Warning } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';

export default function StoreOperations() {
  const [activeTab, setActiveTab] = useState(0); // 0: Material Issue, 1: Returns, 2: Stock Transfer
  const [indents, setIndents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [returns, setReturns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [previewGatePass, setPreviewGatePass] = useState(null);

  // Modal states
  const [issueModal, setIssueModal] = useState({ open: false, indent: null, items: [] });
  const [returnModal, setReturnModal] = useState({ 
    open: false, 
    warehouse_id: '', 
    project_id: '', 
    returned_from_department: '',
    return_type: 'Unused',
    remarks: '',
    returned_by_name: '',
    items: [] 
  });
  const [transferModal, setTransferModal] = useState({
    open: false,
    from_warehouse_id: '',
    to_warehouse_id: '',
    project_id: '',
    remarks: '',
    items: []
  });


  const load = async () => {
    try {
      const indRes = await api.get('/api/indents');
      setIndents(indRes.data);
      const issRes = await api.get('/api/issues');
      setIssues(issRes.data);
      const retRes = await api.get('/api/returns');
      setReturns(retRes.data);
      const trfRes = await api.get('/api/transfers');
      setTransfers(trfRes.data);
      const stRes = await api.get('/api/inventory');
      setStocks(stRes.data);
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials');
      setMaterials(mRes.data.items || []);
      const dRes = await api.get('/api/departments');
      setDepartments(dRes.data);
      const gpRes = await api.get('/api/gate-passes');
      setGatePasses(gpRes.data);
    } catch (e) { console.error(e); }
  };


  useEffect(() => {
    load();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const openIssueModal = (indent) => {
    const items = indent.items.map(it => {
      const remaining = it.requested_quantity - it.issued_quantity;
      return {
        material_id: it.material_id,
        material_name: it.material_name,
        material_code: it.material_code,
        warehouse_id: it.warehouse_id,
        warehouse_name: it.warehouse_name,
        uom_name: it.uom_name,
        approved: it.requested_quantity,
        issued: it.issued_quantity,
        remaining: remaining,
        in_stock: it.current_stock || 0,
        issue_qty: remaining
      };
    });
    setIssueModal({ open: true, indent, items, remarks: '' });
  };

  const handleIssueSubmit = async () => {
    try {
      const payload = {
        warehouse_id: issueModal.items[0]?.warehouse_id, // Backward compatibility
        project_id: issueModal.indent?.project_id || 1,
        indent_id: issueModal.indent?.id,
        issued_to_room_id: issueModal.indent?.room_id,
        purpose: issueModal.remarks || `Fulfillment for ${issueModal.indent?.indent_number}`,
        items: issueModal.items.filter(it => it.issue_qty > 0).map(it => ({
          material_id: it.material_id,
          quantity: Math.round(parseFloat(it.issue_qty))
        }))
      };
      await api.post('/api/issues', payload);
      setIssueModal({ ...issueModal, open: false });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const acknowledgeIssue = async (issueId) => {
    try {
      await api.put(`/api/issues/${issueId}/acknowledge`);
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  // Return logic
  const openReturnModal = () => {
    setReturnModal({
      open: true,
      warehouse_id: warehouses[0]?.id || '',
      project_id: projects[0]?.id || '',
      returned_from_department: '',
      return_type: 'Unused',
      remarks: '',
      returned_by_name: '',
      items: [{ material_id: '', quantity: 0, condition: 'Usable', remarks: '' }]
    });
  };

  const handleReturnSubmit = async () => {
    try {
      if (!returnModal.warehouse_id || !returnModal.project_id) {
        alert('Please select warehouse and project');
        return;
      }
      const validItems = returnModal.items.filter(it => it.material_id && it.quantity > 0);
      if (validItems.length === 0) {
        alert('Please add at least one material with quantity');
        return;
      }

      const payload = {
        warehouse_id: returnModal.warehouse_id,
        project_id: returnModal.project_id,
        returned_from_department: returnModal.returned_from_department,
        return_type: returnModal.return_type,
        remarks: returnModal.remarks,
        returned_by_name: returnModal.returned_by_name,
        items: validItems.map(it => ({
          material_id: it.material_id,
          quantity: Math.round(parseFloat(it.quantity)),
          condition: it.condition,
          remarks: it.remarks
        }))
      };
      await api.post('/api/returns', payload);
      setReturnModal({ ...returnModal, open: false });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const addReturnItem = () => {
    setReturnModal({
      ...returnModal,
      items: [...returnModal.items, { material_id: '', quantity: 0, condition: 'Usable', remarks: '' }]
    });
  };

  const removeReturnItem = (index) => {
    const newItems = [...returnModal.items];
    newItems.splice(index, 1);
    setReturnModal({ ...returnModal, items: newItems });
  };

  const updateReturnItem = (index, field, value) => {
    const newItems = [...returnModal.items];
    newItems[index][field] = value;
    setReturnModal({ ...returnModal, items: newItems });
  };

  // Transfer logic
  const openTransferModal = () => {
    setTransferModal({
      open: true,
      from_warehouse_id: warehouses[0]?.id || '',
      to_warehouse_id: warehouses[1]?.id || warehouses[0]?.id || '',
      project_id: projects[0]?.id || '',
      remarks: '',
      items: [{ material_id: '', quantity: 0, remarks: '' }]
    });
  };

  const handleTransferSubmit = async () => {
    try {
      if (!transferModal.from_warehouse_id || !transferModal.to_warehouse_id) {
        alert('Please select both warehouses');
        return;
      }
      if (transferModal.from_warehouse_id === transferModal.to_warehouse_id) {
        alert('Source and destination cannot be the same');
        return;
      }
      const validItems = transferModal.items.filter(it => it.material_id && it.quantity > 0);
      if (validItems.length === 0) {
        alert('Please add at least one material');
        return;
      }

      const payload = {
        from_warehouse_id: transferModal.from_warehouse_id,
        to_warehouse_id: transferModal.to_warehouse_id,
        project_id: transferModal.project_id,
        remarks: transferModal.remarks,
        items: validItems.map(it => ({
          material_id: it.material_id,
          quantity: Math.round(parseFloat(it.quantity)),
          remarks: it.remarks
        }))
      };
      await api.post('/api/transfers', payload);
      setTransferModal({ ...transferModal, open: false });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const addTransferItem = () => {
    setTransferModal({
      ...transferModal,
      items: [...transferModal.items, { material_id: '', quantity: 0, remarks: '' }]
    });
  };

  const removeTransferItem = (index) => {
    const newItems = [...transferModal.items];
    newItems.splice(index, 1);
    setTransferModal({ ...transferModal, items: newItems });
  };

  const updateTransferItem = (index, field, value) => {
    const newItems = [...transferModal.items];
    newItems[index][field] = value;
    setTransferModal({ ...transferModal, items: newItems });
  };



  const completeGatePass = async (id) => {
    if (!window.confirm('Mark this repair as complete and move items back to usable stock?')) return;
    try {
      await api.put(`/api/gate-passes/${id}`, { status: 'Repaired & Returned' });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const scrapGatePass = async (id) => {
    if (!window.confirm('Mark this item as unrepairable and move to scrap?')) return;
    try {
      await api.put(`/api/gate-passes/${id}`, { status: 'Scrapped' });
      load();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
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
              <h2 class="doc-title">Non / Returnable Gate Pass</h2>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">No:</span> <strong>${gp.gate_pass_number}</strong></div>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">Date:</span> ${formatDate(gp.created_at)}</div>
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-column">
              <div><span class="meta-label">From Dept:</span> Central Store</div>
              <div style="margin-top: 15px;"><span class="meta-label">To:</span></div>
              <div class="address-box">
                 <strong>${gp.vendor_name || 'Vendor'}</strong><br/>
                 ${gp.vendor_address ? gp.vendor_address : 'Address not provided'}
              </div>
            </div>
            <div class="meta-column" style="text-align: right;">
              <div><span class="meta-label" style="min-width: auto; margin-right: 5px;">Ref Return No:</span> ${gp.reference_return_number || 'N/A'}</div>
              <div><span class="meta-label" style="min-width: auto; margin-right: 5px;">Purpose:</span> Sent for Repair</div>
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
              <tr>
                <td style="text-align: center;">1</td>
                <td><strong>${gp.material_name}</strong></td>
                <td style="text-align: center;">${gp.quantity}</td>
                <td></td>
              </tr>
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

  const pendingIndents = indents.filter(ind => ind.status === 'Approved' || ind.status === 'Partially Issued');

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
          {activeTab === 0 ? 'Material Issues' : 
           activeTab === 1 ? 'Material Returns' : 
           activeTab === 2 ? 'Stock Transfers' : 
           activeTab === 3 ? 'Issue Details' : 
           activeTab === 4 ? 'Acknowledged Issues' : 'Gate Passes'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {activeTab === 0 ? 'Manage central store fulfillment and material receipts' : 
           activeTab === 1 ? 'Process returns from projects to central store' : 
           activeTab === 2 ? 'Move stock between warehouses and project stores' : 
           activeTab === 3 ? 'Comprehensive history of all material issues' :
           activeTab === 4 ? 'Archive of all acknowledged and completed material receipts' :
           'Manage outward gate passes for repairable items'}
        </Typography>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            px: 2,
            background: '#fff',
            '& .MuiTab-root': { py: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' }
          }}
        >
          <Tab icon={<Inventory2 sx={{ fontSize: 18 }} />} iconPosition="start" label="Material Issue" />
          <Tab icon={<Undo sx={{ fontSize: 18 }} />} iconPosition="start" label="Returns" />
          <Tab icon={<SwapHoriz sx={{ fontSize: 18 }} />} iconPosition="start" label="Stock Transfer" />
          <Tab icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" label="Issue Details" />
          <Tab icon={<CheckCircle sx={{ fontSize: 18 }} />} iconPosition="start" label="Acknowledged" />
          <Tab icon={<LocalShipping sx={{ fontSize: 18 }} />} iconPosition="start" label="Gate Passes" />
        </Tabs>
      </Paper>


      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: '1.5rem' }}>📦</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Pending Fulfillment</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Approved indents ready to be issued from the store.</Typography>
              </Box>
            </Box>
            <Stack spacing={2.5}>
              {pendingIndents.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
                  <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No approved indents pending fulfillment.</Typography>
                </Box>
              )}
              {pendingIndents.map(ind => (
                <Card key={ind.id} sx={{ 
                  borderRadius: 3, 
                  border: '1px solid #E2E8F0', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', borderColor: '#3B82F6' }
                }}>
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>{ind.indent_number}</Typography>
                        {ind.status === 'Partially Issued' && (
                          <Chip label="PARTIAL" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#FEF3C7', color: '#92400E' }} />
                        )}
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>by {ind.requester_name}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>{formatDate(ind.created_at)}</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2.5 }}>
                      {ind.items?.filter(item => (item.requested_quantity - (item.issued_quantity || 0)) > 0).map((item, idx) => {
                        const remaining = item.requested_quantity - (item.issued_quantity || 0);
                        const isLow = (item.current_stock || 0) < remaining;
                        return (
                          <Box key={idx} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            mb: 0.75, 
                            p: 0.75, 
                            px: 1.5,
                            borderRadius: 1.5,
                            bgcolor: isLow ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                            border: `1px solid ${isLow ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: isLow ? '#B91C1C' : '#047857', flex: 1 }}>
                              {item.material_name} — <span style={{ fontWeight: 800 }}>{remaining} {item.uom_name} pending</span>
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isLow ? (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: '#B91C1C' }}>
                                  ⚠️ Low Stock
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: '#047857' }}>
                                  ✓ Stock OK
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>

                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => openIssueModal(ind)}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        fontWeight: 700,
                        py: 1.2,
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        bgcolor: '#2563EB',
                        '&:hover': { bgcolor: '#1D4ED8' }
                      }}
                    >
                      {ind.status === 'Partially Issued' ? 'Issue Remaining Materials' : 'Issue Materials'}
                    </Button>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: '1.5rem' }}>🔄</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Return Records</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>View and manage material returns from projects to store.</Typography>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={openReturnModal}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
            >
              Initiate Return
            </Button>
          </Box>

          {returns.length === 0 ? (
            <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
              <Undo sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Return Records Found</Typography>
              <Typography variant="body2" color="textSecondary">Return operations will appear here once processed.</Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {returns.map(ret => (
                <Grid item xs={12} key={ret.id}>
                  <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>{ret.return_number}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                          From: {ret.project_name} {ret.room_name ? `(${ret.room_name})` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                          To: {ret.warehouse_name}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip label={ret.return_type} size="small" sx={{ fontWeight: 700, mb: 1, bgcolor: '#EFF6FF', color: '#2563EB' }} />
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>{formatDate(ret.created_at)}</Typography>
                      </Box>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
                      <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
                }}>
                        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>ITEM</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>QTY</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>CONDITION</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>REMARKS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ret.items?.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.material_name}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>{item.quantity} {item.uom_name}</TableCell>
                              <TableCell align="center">
                                <Chip label={item.condition} size="small" color={item.condition === 'Good' ? 'success' : 'warning'} variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{item.remarks || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {ret.remarks && (
                      <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                        Note: {ret.remarks}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}


      {activeTab === 2 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: '1.5rem' }}>🚛</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Stock Transfers</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Monitor and record material movements between different locations.</Typography>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={openTransferModal}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
            >
              New Transfer
            </Button>
          </Box>

          {transfers.length === 0 ? (
            <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
              <SwapHoriz sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Stock Transfer Records Found</Typography>
              <Typography variant="body2" color="textSecondary">Stock transfers between locations will appear here.</Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {transfers.map(trf => (
                <Grid item xs={12} key={trf.id}>
                  <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>{trf.transfer_number}</Typography>
                          <Chip label={trf.status} size="small" color="success" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748B' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{trf.from_warehouse_name}</Typography>
                          <SwapHoriz sx={{ fontSize: 16 }} />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>{trf.to_warehouse_name}</Typography>
                        </Box>
                        {trf.project_name && (
                          <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                            Project: {trf.project_name}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>{formatDate(trf.created_at)}</Typography>
                      </Box>
                    </Box>

                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 1 }}>
                      <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
                }}>
                        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>ITEM</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>QTY</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>REMARKS</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {trf.items?.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.material_name}</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700 }}>{item.quantity} {item.uom_name}</TableCell>
                              <TableCell sx={{ fontSize: '0.8rem', color: '#64748B' }}>{item.remarks || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {trf.remarks && (
                      <Typography variant="caption" sx={{ color: '#64748B', fontStyle: 'italic' }}>
                        Note: {trf.remarks}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {activeTab === 3 && (

        <Box>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ fontSize: '1.5rem' }}>📋</Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Issue Details</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Complete transaction history of all material issues from the store.</Typography>
            </Box>
          </Box>
          {issues.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
              <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No issue records found.</Typography>
            </Box>
          ) : (
            <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
                }}>
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>ISSUE NO.</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>DATE</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>STORE → LOCATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>ISSUED BY</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>ITEMS (QTY)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {issues.map(iss => (
                      <TableRow key={iss.id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{iss.issue_number}</TableCell>
                        <TableCell sx={{ color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(iss.created_at)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{iss.warehouse_name} → {iss.project_name || 'General'}</Typography>
                          {iss.room_name && <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Location: {iss.room_name}</Typography>}
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>{iss.issued_by_name}</TableCell>
                        <TableCell>
                          {iss.items.map((item, idx) => (
                            <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#1E293B', fontWeight: 500 }}>
                              • {item.material_name} <span style={{ color: '#64748B' }}>({item.quantity} {item.uom_name || 'unit'})</span>
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={iss.is_acknowledged ? "Acknowledged" : "Pending Ack"} 
                            size="small" 
                            color={iss.is_acknowledged ? "success" : "warning"}
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 4 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ fontSize: '1.5rem' }}>✅</Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Acknowledged Issues</Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>Materials that have been received and verified by the requester.</Typography>
            </Box>
          </Box>
          {issues.filter(i => i.is_acknowledged).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
              <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No acknowledged records found.</Typography>
            </Box>
          ) : (
            <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small" sx={{ 
                  '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
                }}>
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>ISSUE NO.</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>ACK DATE</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>RECIPIENT</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>STORE → PROJECT</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>ITEMS (QTY)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B' }}>STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {issues.filter(i => i.is_acknowledged).map(iss => (
                      <TableRow key={iss.id} hover>
                        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{iss.issue_number}</TableCell>
                        <TableCell sx={{ color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{formatDate(iss.acknowledged_at)}</TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>{iss.received_by_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{iss.warehouse_name} → {iss.project_name || 'General'}</Typography>
                        </TableCell>
                        <TableCell>
                          {iss.items.map((item, idx) => (
                            <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#1E293B', fontWeight: 500 }}>
                              • {item.material_name} <span style={{ color: '#64748B' }}>({item.quantity} {item.uom_name || 'unit'})</span>
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell>
                          <Chip label="Verified" size="small" color="success" sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}



      {activeTab === 5 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: '1.5rem' }}>🚚</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Outward Gate Passes</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Track items sent out for repair and manage their return or scrap.</Typography>
              </Box>
            </Box>
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
                      <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>REF RETURN</TableCell>
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
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{gp.material_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>Qty: {gp.quantity}</Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{gp.reference_return_number}</TableCell>
                        <TableCell>
                          <Chip 
                            label={gp.status} 
                            size="small" 
                            color={gp.status === 'Issued' ? 'warning' : gp.status === 'Repaired & Returned' ? 'success' : 'error'} 
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => printGatePass(gp)}>
                            <Print fontSize="small" />
                          </IconButton>
                          {gp.status === 'Issued' && (
                            <>
                              <IconButton size="small" color="success" onClick={() => completeGatePass(gp.id)}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => scrapGatePass(gp.id)}>
                                <Warning fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      {/* ISSUE MATERIALS MODAL */}
      <Dialog open={issueModal.open} onClose={() => setIssueModal({ ...issueModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <Inventory2 fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Issue Materials</Typography>
                <Typography variant="body2" color="text.secondary">{issueModal.indent?.indent_number} • {issueModal.indent?.requester_name}</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIssueModal({ ...issueModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SOURCE STORE</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>APPROVED</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>REMAINING</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>IN STOCK</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>ISSUE QTY</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issueModal.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>{it.material_code}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={it.warehouse_name || 'Mapped Store'} 
                        size="small" 
                        sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1.5 }} 
                      />
                    </TableCell>
                    <TableCell align="center">{it.approved}</TableCell>
                    <TableCell align="center" sx={{ color: '#1E40AF', fontWeight: 600 }}>{it.remaining}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: (stocks.find(s => s.warehouse_id === it.warehouse_id && s.material_id === it.material_id)?.quantity || 0) > 0 ? '#059669' : '#DC2626' }}>
                      {Math.round(stocks.find(s => s.warehouse_id === it.warehouse_id && s.material_id === it.material_id)?.quantity || 0)}
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        size="small" 
                        type="number" 
                        inputProps={{ step: "1", min: "0" }}
                        value={it.issue_qty} 
                        onChange={e => {
                          const newItems = [...issueModal.items];
                          newItems[i].issue_qty = Math.round(parseFloat(e.target.value) || 0);
                          setIssueModal({ ...issueModal, items: newItems });
                        }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2, border: '1px solid #FEF3C7' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="small" /> Confirmation required
            </Typography>
            <Typography variant="caption" color="#92400E">Review the issue quantities carefully before proceeding.</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setIssueModal({ ...issueModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleIssueSubmit} variant="contained" color="error" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)', textTransform: 'none' }}>Confirm Issue</Button>
        </DialogActions>
      </Dialog>

      {/* INITIATE RETURN MODAL */}
      <Dialog open={returnModal.open} onClose={() => setReturnModal({ ...returnModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#FEF2F2', borderRadius: 2, color: '#DC2626', display: 'flex' }}>
                <Undo fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Initiate Return</Typography>
                <Typography variant="body2" color="text.secondary">Process materials returning to the central store</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setReturnModal({ ...returnModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Store</InputLabel>
                <Select 
                  label="Target Store"
                  value={returnModal.warehouse_id} 
                  onChange={e => setReturnModal({ ...returnModal, warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                  disabled
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Department / Unit</InputLabel>
                <Select 
                  label="Department / Unit"
                  value={returnModal.returned_from_department} 
                  onChange={e => setReturnModal({ ...returnModal, returned_from_department: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Business sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {departments.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField 
                fullWidth size="small" label="Returned By" 
                value={returnModal.returned_by_name}
                onChange={e => setReturnModal({ ...returnModal, returned_by_name: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth size="small" label="General Remarks" 
                value={returnModal.remarks}
                onChange={e => setReturnModal({ ...returnModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>


          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>Return Items</Typography>
            <Button size="small" startIcon={<Add />} onClick={addReturnItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '50%' }}>MATERIAL</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '25%' }}>REMARKS</TableCell>
                  <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returnModal.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <MaterialSelect 
                        materials={materials} 
                        value={item.material_id} 
                        onChange={(val) => updateReturnItem(idx, 'material_id', val)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField 
                        size="small" 
                        type="number" 
                        inputProps={{ step: "1" }}
                        fullWidth 
                        value={item.quantity} 
                        onChange={e => updateReturnItem(idx, 'quantity', Math.round(parseFloat(e.target.value) || 0))} 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        size="small" fullWidth value={item.remarks} 
                        onChange={e => updateReturnItem(idx, 'remarks', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 16 }} /></InputAdornment>,
                        }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeReturnItem(idx)} disabled={returnModal.items.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="inherit" /> Stock will be automatically increased in the target warehouse upon submission.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setReturnModal({ ...returnModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleReturnSubmit} 
            variant="contained" 
            sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none' }}
          >
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* STOCK TRANSFER MODAL */}
      <Dialog open={transferModal.open} onClose={() => setTransferModal({ ...transferModal, open: false })} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <SwapHoriz fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Stock Transfer</Typography>
                <Typography variant="body2" color="text.secondary">Move materials between different warehouses or locations</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setTransferModal({ ...transferModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>From Store</InputLabel>
                <Select 
                  label="From Store"
                  value={transferModal.from_warehouse_id} 
                  onChange={e => setTransferModal({ ...transferModal, from_warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>To Store</InputLabel>
                <Select 
                  label="To Store"
                  value={transferModal.to_warehouse_id} 
                  onChange={e => setTransferModal({ ...transferModal, to_warehouse_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#2563EB', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Associated Project</InputLabel>
                <Select 
                  label="Associated Project"
                  value={transferModal.project_id} 
                  onChange={e => setTransferModal({ ...transferModal, project_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth size="small" label="Transfer Remarks" 
                value={transferModal.remarks}
                onChange={e => setTransferModal({ ...transferModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>Transfer Items</Typography>
            <Button size="small" startIcon={<Add />} onClick={addTransferItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '45%' }}>MATERIAL</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: '20%' }}>QTY</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '30%' }}>REMARKS</TableCell>
                  <TableCell align="center" sx={{ width: '5%' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferModal.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <MaterialSelect 
                        materials={materials} 
                        value={item.material_id} 
                        onChange={(val) => updateTransferItem(idx, 'material_id', val)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField 
                        size="small" 
                        type="number" 
                        inputProps={{ step: "1" }}
                        fullWidth 
                        value={item.quantity} 
                        onChange={e => updateTransferItem(idx, 'quantity', Math.round(parseFloat(e.target.value) || 0))} 
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        size="small" fullWidth value={item.remarks} 
                        onChange={e => updateTransferItem(idx, 'remarks', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 16 }} /></InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeTransferItem(idx)} disabled={transferModal.items.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ bgcolor: '#EFF6FF', p: 2, borderRadius: 2, border: '1px solid #BFDBFE' }}>
            <Typography variant="caption" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
              <InfoOutlined fontSize="inherit" /> Stock will be deducted from the source and added to the destination warehouse immediately.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setTransferModal({ ...transferModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleTransferSubmit} 
            variant="contained" 
            sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none' }}
          >
            Complete Transfer
          </Button>
        </DialogActions>
      </Dialog>

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

    </Box>

  );
}
