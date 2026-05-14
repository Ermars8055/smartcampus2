import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, IconButton, Divider, Tab, Tabs, Stack, Paper
} from '@mui/material';
import { Add, Delete, Close, CheckCircle, InfoOutlined, Undo, SwapHoriz, Inventory2 } from '@mui/icons-material';
import api from '../services/api';

export default function StoreOperations() {
  const [activeTab, setActiveTab] = useState(0); // 0: Material Issue, 1: Returns, 2: Stock Transfer
  const [indents, setIndents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stocks, setStocks] = useState([]);

  // Modal states
  const [issueModal, setIssueModal] = useState({ open: false, indent: null, items: [] });

  const load = async () => {
    try {
      const indRes = await api.get('/api/indents');
      setIndents(indRes.data);
      const issRes = await api.get('/api/issues');
      setIssues(issRes.data);
      const stRes = await api.get('/api/inventory');
      setStocks(stRes.data);
      const wRes = await api.get('/api/warehouses');
      setWarehouses(wRes.data);
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
        issue_qty: Math.min(remaining, available)
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
        issued_to_room_id: issueModal.indent.room_id,
        purpose: issueModal.remarks || `Fulfillment for ${issueModal.indent.indent_number}`,
        items: issueModal.items.filter(it => it.issue_qty > 0).map(it => ({
          material_id: it.material_id,
          quantity: parseFloat(it.issue_qty)
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

  const pendingIndents = indents.filter(ind => ind.status === 'Approved' || ind.status === 'Partially Issued');
  const pendingAcks = issues.filter(iss => !iss.is_acknowledged && iss.indent_id);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
          {activeTab === 0 ? 'Material Issues' : activeTab === 1 ? 'Material Returns' : 'Stock Transfers'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {activeTab === 0 ? 'Manage central store fulfillment and material receipts' : 
           activeTab === 1 ? 'Process returns from projects to central store' : 
           'Move stock between warehouses and project stores'}
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
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} lg={6}>
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

          <Grid item xs={12} lg={6}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ fontSize: '1.5rem' }}>✅</Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>My Pending Acknowledgments</Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>Materials issued to you by the store. Please acknowledge receipt.</Typography>
              </Box>
            </Box>
            <Stack spacing={2.5}>
              {pendingAcks.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
                  <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No pending materials to acknowledge.</Typography>
                </Box>
              )}
              {pendingAcks.map(iss => (
                <Card key={iss.id} sx={{ 
                  borderRadius: 3, 
                  border: '1px solid #E2E8F0', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  borderLeft: '4px solid #F59E0B'
                }}>
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>{iss.issue_number}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Against: {iss.indent_number}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>{formatDate(iss.created_at)}</Typography>
                    </Box>
                    
                    <Box sx={{ bgcolor: '#FFFBEB', p: 1.5, borderRadius: 2, mb: 2, border: '1px solid #FEF3C7' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block' }}>Issued by:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#451A03' }}>{iss.issued_by_name || 'Store Admin'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600, display: 'block' }}>Remarks:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#451A03' }}>{iss.purpose || 'Issued from store'}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Issued</Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, py: 1, fontSize: '0.7rem', color: '#64748B' }}>ITEM</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, py: 1, fontSize: '0.7rem', color: '#64748B' }}>UNIT</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 700, py: 1, fontSize: '0.7rem', color: '#64748B' }}>QTY ISSUED</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {iss.items?.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell sx={{ fontWeight: 700, py: 1, color: '#1E293B' }}>{item.material_name}</TableCell>
                                <TableCell align="center" sx={{ py: 1, color: '#64748B' }}>{item.uom_name || 'Unit'}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, py: 1, color: '#1E293B' }}>{item.quantity}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    <Button 
                      fullWidth 
                      variant="contained" 
                      startIcon={<CheckCircle />}
                      onClick={() => acknowledgeIssue(iss.id)}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2, 
                        fontWeight: 700,
                        py: 1.2,
                        bgcolor: '#F59E0B',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                        '&:hover': { bgcolor: '#D97706' }
                      }}
                    >
                      Acknowledge Receipt
                    </Button>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 4, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <Undo sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Return Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Return operations will appear here once processed.</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 3, textTransform: 'none', borderRadius: 2 }}>Initiate Return</Button>
        </Card>
      )}

      {activeTab === 2 && (
        <Card sx={{ p: 4, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <SwapHoriz sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Stock Transfer Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Stock transfers between locations will appear here.</Typography>
          <Button variant="contained" startIcon={<Add />} sx={{ mt: 3, textTransform: 'none', borderRadius: 2 }}>New Transfer</Button>
        </Card>
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

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM</TableCell>
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
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{it.material_code}</Typography>
                    </TableCell>
                    <TableCell align="center">{it.approved}</TableCell>
                    <TableCell align="center" sx={{ color: '#1E40AF', fontWeight: 600 }}>{it.remaining}</TableCell>
                    <TableCell align="center">
                      {stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0}
                    </TableCell>
                    <TableCell align="center">
                      <TextField 
                        size="small" type="number" value={it.issue_qty} 
                        onChange={e => {
                          const newItems = [...issueModal.items];
                          newItems[i].issue_qty = e.target.value;
                          setIssueModal({ ...issueModal, items: newItems });
                        }}
                        inputProps={{ style: { textAlign: 'center', fontWeight: 600 } }}
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
    </Box>
  );
}
