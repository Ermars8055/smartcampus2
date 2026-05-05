import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Tab, Tabs, Stack
} from '@mui/material';
import { Add, Delete, Close, CheckCircle, InfoOutlined } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';

export default function StoreOperations() {
  const [viewTab, setViewTab] = useState(0); // 0: Issues & Ack, 1: History/Returns/Transfers
  const [indents, setIndents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [returns, setReturns] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [stocks, setStocks] = useState([]);

  // Modal states
  const [issueModal, setIssueModal] = useState({ open: false, indent: null, items: [] });
  const [directIssueModal, setDirectIssueModal] = useState(false);
  const [genericDialog, setGenericDialog] = useState(''); // for returns/transfers
  const [form, setForm] = useState({});

  const load = async () => {
    try {
      const indRes = await api.get('/api/indents');
      setIndents(indRes.data);
    } catch (e) { console.error(e); }
    
    try {
      const issRes = await api.get('/api/issues');
      setIssues(issRes.data);
    } catch (e) { console.error(e); }

    try {
      const stRes = await api.get('/api/inventory');
      setStocks(stRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
    api.get('/api/warehouses').then(r => setWarehouses(r.data));
    api.get('/api/materials').then(r => setMaterials(r.data.items || []));
    api.get('/api/projects').then(r => setProjects(r.data));
    api.get('/api/blocks').then(r => setBlocks(r.data));
  }, []);

  const openIssueModal = (indent) => {
    // Initialize issue items based on indent items
    const items = indent.items.map(it => {
      const available = it.current_stock || 0;
      const remaining = it.requested_quantity - it.issued_quantity;
      return {
        material_id: it.material_id,
        material_name: it.material_name,
        material_code: it.material_code,
        uom_name: it.uom_name,
        approved: it.requested_quantity,
        issued: it.issued_quantity,
        remaining: remaining,
        in_stock: available,
        issue_qty: Math.min(remaining, available),
        status: (available >= remaining) ? 'OK' : (available > 0 ? 'PARTIAL' : 'NO STOCK')
      };
    });
    setIssueModal({ open: true, indent, items, warehouse_id: warehouses[0]?.id || '', remarks: '' });
  };

  const handleIssueSubmit = async () => {
    try {
      const payload = {
        warehouse_id: issueModal.warehouse_id,
        project_id: issueModal.indent.block?.project_id || 1,
        indent_id: issueModal.indent.id,
        issued_to_block_id: issueModal.indent.block_id,
        purpose: issueModal.remarks || `Fulfillment for ${issueModal.indent.indent_number}`,
        items: issueModal.items.filter(it => it.issue_qty > 0).map(it => ({
          material_id: it.material_id,
          quantity: parseFloat(it.issue_qty)
        }))
      };
      if (payload.items.length === 0) {
        alert("Please specify issue quantity for at least one item.");
        return;
      }
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

  // Filter indents pending fulfillment
  const pendingIndents = indents.filter(ind => ind.status === 'Approved' || ind.status === 'Partially Issued');
  
  // Filter issues pending acknowledgement
  // For demo, we show issues that are NOT acknowledged
  const pendingAcks = issues.filter(iss => !iss.is_acknowledged && iss.indent_id);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Material Issues & Acknowledgments</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Manage central store fulfillment and material receipts</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
          {/* LEFT: PENDING FULFILLMENT */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ bgcolor: '#FEF2F2', p: 0.5, borderRadius: 1 }}>📦</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Pending Fulfillment</Typography>
              </Box>
              <Box sx={{ p: 2, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                  Approved indents ready to be issued from the store.
                </Typography>
                <Stack spacing={2}>
                  {pendingIndents.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                      <Typography variant="body2" color="textSecondary">No approved indents pending fulfillment.</Typography>
                    </Box>
                  )}
                  {pendingIndents.map(ind => (
                    <Card key={ind.id} variant="outlined" sx={{ borderRadius: 2, p: 2, '&:hover': { borderColor: '#2563EB' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{ind.indent_number} <span style={{ fontWeight: 400, color: '#64748B' }}>by {ind.requester_name}</span></Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>{formatDate(ind.created_at)}</Typography>
                      </Box>
                      <Stack spacing={0.5} sx={{ mb: 2 }}>
                        {ind.items.map(it => {
                          const available = it.current_stock || 0;
                          const pending = it.requested_quantity - it.issued_quantity;
                          return (
                            <Box key={it.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: available > 0 ? '#F0FDF4' : '#FFF1F2', p: 0.5, px: 1, borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>{it.material_name} — <span style={{ color: '#64748B' }}>{pending} {it.uom_name} pending</span></Typography>
                              <Chip 
                                label={available >= pending ? '✓ Stock OK' : (available > 0 ? '⚠ Low Stock' : 'X No Stock')} 
                                size="small" 
                                color={available >= pending ? 'success' : 'error'} 
                                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700 }} 
                              />
                            </Box>
                          );
                        })}
                      </Stack>
                      <Button fullWidth variant="contained" size="small" onClick={() => openIssueModal(ind)} sx={{ textTransform: 'none', borderRadius: 1.5 }}>
                        Issue {ind.status === 'Partially Issued' ? 'Remaining ' : ''}Materials
                      </Button>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Card>
          </Grid>

          {/* RIGHT: PENDING ACKNOWLEDGMENTS */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid #E2E8F0', borderRadius: 3, p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #F1F5F9', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ bgcolor: '#F0FDF4', p: 0.5, borderRadius: 1 }}>✅</Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>My Pending Acknowledgments</Typography>
              </Box>
              <Box sx={{ p: 2, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                  Materials issued to you by the store. Please acknowledge receipt.
                </Typography>
                <Stack spacing={2}>
                  {pendingAcks.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
                      <Typography variant="body2" color="textSecondary">No pending materials to acknowledge.</Typography>
                    </Box>
                  )}
                  {pendingAcks.map(iss => (
                    <Card key={iss.id} variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{iss.issue_number} <span style={{ fontWeight: 400, color: '#64748B' }}>from {iss.warehouse_name}</span></Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>{formatDate(iss.created_at)}</Typography>
                      </Box>
                      <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1, border: '1px solid #E2E8F0', mb: 2 }}>
                        {iss.items.map(it => (
                          <Typography key={it.id} variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                            • {it.material_name} — {it.quantity} {it.uom_name}
                          </Typography>
                        ))}
                      </Box>
                      <Button fullWidth variant="outlined" color="success" startIcon={<CheckCircle />} onClick={() => acknowledgeIssue(iss.id)} sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}>
                        Acknowledge Receipt
                      </Button>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Card>
          </Grid>
        </Grid>

      {/* ISSUE MATERIALS MODAL */}
      <Dialog open={issueModal.open} onClose={() => setIssueModal({ ...issueModal, open: false })} maxWidth="md" fullWidth>
        <Box sx={{ bgcolor: '#1E3A8A', color: '#fff', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              📦 Issue Materials
            </Typography>
            <Typography variant="caption">{issueModal.indent?.indent_number} • {issueModal.indent?.requester_name} • {issueModal.indent?.block_name}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setIssueModal({ ...issueModal, open: false })} sx={{ color: '#fff' }}><Close /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>Review quantities below. Adjust the <strong>Issue Qty</strong> if needed, then confirm.</Typography>
          
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Source Warehouse:</Typography>
            <Select 
              size="small" 
              value={issueModal.warehouse_id} 
              onChange={e => setIssueModal({ ...issueModal, warehouse_id: e.target.value })}
              sx={{ width: 300, bgcolor: '#fff' }}
            >
              {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </Select>
          </Box>

          <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>ITEM</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>UNIT</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>APPROVED</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>ISSUED</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>REMAINING</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>IN STOCK</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem', width: 100 }}>ISSUE QTY</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issueModal.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{it.material_code}</Typography>
                    </TableCell>
                    <TableCell>{it.uom_name}</TableCell>
                    <TableCell align="center">{it.approved}</TableCell>
                    <TableCell align="center">{it.issued || '-'}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#1E40AF' }}>{it.remaining}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: (stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0) < it.remaining ? '#ef4444' : '#10b981' }}>
                      {stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0}
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        size="small" 
                        type="number" 
                        value={it.issue_qty} 
                        onChange={e => {
                          const newItems = [...issueModal.items];
                          newItems[i].issue_qty = e.target.value;
                          setIssueModal({ ...issueModal, items: newItems });
                        }}
                        slotProps={{ htmlInput: { style: { textAlign: 'center', fontWeight: 600 } } }}
                        sx={{ bgcolor: '#F8FAFC', width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={(() => {
                          const avail = stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0;
                          return avail >= it.remaining ? '✓ OK' : (avail > 0 ? '⚠ PARTIAL' : 'X STOCK');
                        })()} 
                        size="small" 
                        color={(() => {
                          const avail = stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0;
                          return avail >= it.remaining ? 'success' : 'warning';
                        })()} 
                        sx={{ fontWeight: 700, height: 20 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Remarks (optional)</Typography>
            <TextField 
              fullWidth 
              placeholder="e.g. Partial issue - balance to follow" 
              multiline 
              rows={2} 
              value={issueModal.remarks}
              onChange={e => setIssueModal({ ...issueModal, remarks: e.target.value })}
              sx={{ bgcolor: '#F8FAFC' }}
            />
          </Box>

          <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2, border: '1px solid #FEF3C7', mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="small" /> Please confirm the following issue:
            </Typography>
            <Stack spacing={0.5}>
              {issueModal.items.filter(it => it.issue_qty > 0).map(it => (
                <Typography key={it.material_id} variant="caption" sx={{ color: '#92400E', fontWeight: 600 }}>
                  • {it.material_name} — {it.issue_qty} {it.uom_name}
                </Typography>
              ))}
            </Stack>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#92400E', fontStyle: 'italic' }}>
              This will permanently deduct stock from inventory.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={() => setIssueModal({ ...issueModal, open: false })} variant="contained" color="primary" sx={{ textTransform: 'none', px: 4, bgcolor: '#3B82F6' }}>← Go Back</Button>
          <Button onClick={handleIssueSubmit} variant="contained" color="error" sx={{ textTransform: 'none', px: 4, bgcolor: '#EF4444' }}>Yes, Issue Now</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
