import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Tab, Tabs, Stack, Paper, InputAdornment, MenuItem
} from '@mui/material';
import { Close, CheckCircle, InfoOutlined, Inventory2, Description, AssignmentTurnedIn } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MaterialIssue() {
  const { hasAction } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: Pending, 1: Details, 2: Acknowledged
  const [indents, setIndents] = useState([]);
  const [issues, setIssues] = useState([]);
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
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const openIssueModal = (indent) => {
    const items = indent.items
      .map(it => {
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
          issue_qty: 0
        };
      })
      .filter(it => it.remaining > 0);
    setIssueModal({ open: true, indent, items, remarks: '' });
  };

  const handleIssueSubmit = async () => {
    try {
      const payload = {
        warehouse_id: issueModal.items[0]?.warehouse_id,
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

  const pendingIndents = indents.filter(ind => ind.status === 'Approved' || ind.status === 'Partially Issued');

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A' }}>
          {activeTab === 0 ? 'Material Issues' : 
           activeTab === 1 ? 'Issue Details' : 'Acknowledged Issues'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {activeTab === 0 ? 'Manage central store fulfillment and material receipts' : 
           activeTab === 1 ? 'Comprehensive history of all material issues' :
           'Archive of all acknowledged and completed material receipts'}
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
          <Tab icon={<Inventory2 sx={{ fontSize: 18 }} />} iconPosition="start" label="Pending Issues" />
          <Tab icon={<Description sx={{ fontSize: 18 }} />} iconPosition="start" label="Issue Details" />
          <Tab icon={<CheckCircle sx={{ fontSize: 18 }} />} iconPosition="start" label="Acknowledged" />
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
                      disabled={!hasAction('issues', 'can_issue')}
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

      {activeTab === 2 && (
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
                <Typography variant="body2" color="text.secondary">
                  {issueModal.indent?.indent_number} • {issueModal.indent?.requester_name}
                  {(() => {
                    const ind = issueModal.indent;
                    if (!ind) return '';
                    const dept = ind.department || 'Store / User';
                    const loc = [ind.building_name, ind.floor, ind.room_name].filter(Boolean).join('-');
                    return loc ? ` • Issue to: ${dept} (${loc})` : ` • Issue to: ${dept}`;
                  })()}
                </Typography>
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
                      {(() => {
                        const inStock = Math.round(stocks.find(s => s.warehouse_id === it.warehouse_id && s.material_id === it.material_id)?.quantity || 0);
                        const maxQty = Math.min(it.remaining, inStock);
                        return (
                          <TextField 
                            size="small" 
                            type="number" 
                            inputProps={{ step: "1", min: "0", max: String(maxQty) }}
                            onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                            value={it.issue_qty} 
                            disabled={inStock <= 0}
                            onChange={e => {
                              const newItems = [...issueModal.items];
                              const val = Math.round(parseFloat(e.target.value.replace(/-/g, '')) || 0);
                              newItems[i].issue_qty = Math.max(0, Math.min(val, maxQty));
                              setIssueModal({ ...issueModal, items: newItems });
                            }}
                            sx={{ width: 100 }}
                          />
                        );
                      })()}
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
          <Button onClick={handleIssueSubmit} variant="contained" color="error" disabled={issueModal.items.every(it => it.issue_qty <= 0)} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)', textTransform: 'none' }}>Confirm Issue</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
