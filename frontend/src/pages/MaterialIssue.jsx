import { useState, useEffect, useMemo } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl,
  InputLabel, IconButton, Paper, InputAdornment, MenuItem, Collapse
} from '@mui/material';
import { Close, Inventory2, KeyboardArrowDown, KeyboardArrowUp, Add, Delete, AccountTree, Warehouse, Comment, InfoOutlined } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

function IssueRow({ row, openIssueModal, stocks }) {
  const [open, setOpen] = useState(false);

  const isIndent = row.type === 'indent';
  const idStr = isIndent ? row.indent_number : row.issue_number;
  const personStr = isIndent ? row.requester_name : row.issued_by_name;
  
  let statusColor = 'default';
  let statusLabel = row.status;
  if (isIndent) {
    if (row.status === 'Approved') { statusColor = 'primary'; statusLabel = 'Pending'; }
    if (row.status === 'Partially Issued') { statusColor = 'warning'; statusLabel = 'Partial'; }
  } else {
    if (row.is_acknowledged) { statusColor = 'success'; statusLabel = 'Acknowledged'; }
    else { statusColor = 'success'; statusLabel = 'Completed'; }
  }

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }} hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{idStr}</TableCell>
        <TableCell sx={{ color: '#64748B' }}>{formatDate(row.created_at)}</TableCell>
        <TableCell sx={{ fontWeight: 600, color: '#475569' }}>{personStr}</TableCell>
        <TableCell>
          <Chip label={statusLabel} size="small" color={statusColor} sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
        </TableCell>
        <TableCell align="right">
          {isIndent && (
             <Button size="small" variant="contained" onClick={() => openIssueModal(row)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
               Issue Materials
             </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, borderLeft: `2px solid ${isIndent ? '#3B82F6' : '#10B981'}`, pl: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, color: '#1E293B' }}>
                {isIndent ? 'Pending Items to Issue' : 'Issued Items'}
              </Typography>
              {row.project_name && (
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                  Project: {row.project_name}
                </Typography>
              )}
              
              <Table size="small" aria-label="items">
                <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>MATERIAL</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>{isIndent ? 'PENDING QTY' : 'ISSUED QTY'}</TableCell>
                    {isIndent && <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>STOCK STATUS</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isIndent ? (
                    row.items?.filter(item => (item.requested_quantity - (item.issued_quantity || 0)) > 0).map((item, idx) => {
                      const remaining = item.requested_quantity - (item.issued_quantity || 0);
                      const isLow = (item.current_stock || 0) < remaining;
                      return (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600 }}>{item.material_name}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{remaining} {item.uom_name}</TableCell>
                          <TableCell>
                            {isLow ? (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: '#DC2626' }}>
                                  ⚠️ Low Stock
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, color: '#059669' }}>
                                  ✓ Stock OK
                                </Typography>
                              )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    row.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 600 }}>{item.material_name}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{item.quantity} {item.uom_name || 'unit'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default function MaterialIssue() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const [indents, setIndents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Modal states: if indent is null, it's a direct issue
  const [issueModal, setIssueModal] = useState({ open: false, isDirect: false, indent: null, items: [], project_id: '', warehouse_id: '', remarks: '' });

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
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingIndents = indents.filter(ind => ind.status === 'Approved' || ind.status === 'Partially Issued');

  const combinedList = useMemo(() => {
    return [
      ...pendingIndents.map(ind => ({ type: 'indent', ...ind, sortDate: new Date(ind.created_at) })),
      ...issues.map(iss => ({ type: 'issue', ...iss, sortDate: new Date(iss.created_at) }))
    ].sort((a, b) => b.sortDate - a.sortDate);
  }, [pendingIndents, issues]);

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
    setIssueModal({ open: true, isDirect: false, indent, items, project_id: indent.project_id || '', warehouse_id: items[0]?.warehouse_id || '', remarks: '' });
  };

  const openDirectIssueModal = () => {
    setIssueModal({
      open: true,
      isDirect: true,
      indent: null,
      project_id: projects[0]?.id || '',
      warehouse_id: warehouses[0]?.id || '',
      remarks: '',
      items: [{ material_id: '', issue_qty: 0 }]
    });
  };

  const handleIssueSubmit = async () => {
    try {
      if (issueModal.isDirect && (!issueModal.warehouse_id || !issueModal.project_id)) {
        showMessage('Please select a warehouse and project for direct issue.', 'Validation Error', 'warning');
        return;
      }
      const validItems = issueModal.items.filter(it => it.material_id && it.issue_qty > 0);
      if (validItems.length === 0) {
        showMessage('Please provide quantity for at least one item.', 'Validation Error', 'warning');
        return;
      }

      const payload = {
        warehouse_id: issueModal.isDirect ? issueModal.warehouse_id : issueModal.items[0]?.warehouse_id,
        project_id: issueModal.isDirect ? issueModal.project_id : (issueModal.indent?.project_id || 1),
        indent_id: issueModal.indent?.id,
        issued_to_room_id: issueModal.indent?.room_id,
        purpose: issueModal.remarks || (issueModal.isDirect ? 'Direct Issue' : `Fulfillment for ${issueModal.indent?.indent_number}`),
        items: validItems.map(it => ({
          material_id: it.material_id,
          quantity: Math.round(parseFloat(it.issue_qty))
        }))
      };
      await api.post('/api/issues', payload);
      setIssueModal({ ...issueModal, open: false });
      load();
      showMessage('Material issued successfully!', 'Success', 'success');
    } catch (err) { 
      const detail = err.response?.data?.detail || 'Error';
      if (detail.includes('limit per month')) {
        showMessage(detail, "Limit Reached", "warning");
      } else {
        showMessage(detail, "Error", "error");
      }
    }
  };

  const addDirectItem = () => {
    setIssueModal({
      ...issueModal,
      items: [...issueModal.items, { material_id: '', issue_qty: 0 }]
    });
  };

  const removeDirectItem = (index) => {
    const newItems = [...issueModal.items];
    newItems.splice(index, 1);
    setIssueModal({ ...issueModal, items: newItems });
  };

  const updateDirectItem = (index, field, value) => {
    const newItems = [...issueModal.items];
    newItems[index][field] = value;
    setIssueModal({ ...issueModal, items: newItems });
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ fontSize: '1.5rem' }}>📦</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Material Issues</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Manage central store fulfillment, track pending indents, and log direct issues.</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={openDirectIssueModal}
          disabled={!hasAction('issues', 'can_issue')}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          New Issue
        </Button>
      </Box>

      {combinedList.length === 0 ? (
        <Card sx={{ p: 8, textAlign: 'center', border: '1px dashed #CBD5E1', bgcolor: '#F8FAFC', borderRadius: 3 }}>
          <Inventory2 sx={{ fontSize: 48, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>No Issue Records Found</Typography>
          <Typography variant="body2" color="textSecondary">Pending indents and completed issues will appear here.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
          <Table aria-label="issues table">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ width: 50 }} />
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>RECORD NO.</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>REQUESTER / ISSUER</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combinedList.map((row, index) => (
                <IssueRow key={index} row={row} openIssueModal={openIssueModal} stocks={stocks} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {issueModal.isDirect ? 'Direct Material Issue' : 'Issue Materials for Indent'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {issueModal.isDirect ? 'Issue items directly to a project without an indent' : (
                    <>
                      {issueModal.indent?.indent_number} • {issueModal.indent?.requester_name}
                      {(() => {
                        const ind = issueModal.indent;
                        if (!ind) return '';
                        const dept = ind.department || 'Store / User';
                        const loc = [ind.building_name, ind.floor, ind.room_name].filter(Boolean).join('-');
                        return loc ? ` • Issue to: ${dept} (${loc})` : ` • Issue to: ${dept}`;
                      })()}
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setIssueModal({ ...issueModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {issueModal.isDirect && (
            <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source Store</InputLabel>
                  <Select 
                    label="Source Store"
                    value={issueModal.warehouse_id} 
                    onChange={e => setIssueModal({ ...issueModal, warehouse_id: e.target.value })}
                    startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                  >
                    {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name} ({w.code})</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Associated Project</InputLabel>
                  <Select 
                    label="Associated Project"
                    value={issueModal.project_id} 
                    onChange={e => setIssueModal({ ...issueModal, project_id: e.target.value })}
                    startAdornment={<InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                  >
                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {issueModal.isDirect && (
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1E293B' }}>Items to Issue</Typography>
              <Button size="small" startIcon={<Add />} onClick={addDirectItem} sx={{ textTransform: 'none', fontWeight: 700 }}>Add Item</Button>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM</TableCell>
                  {!issueModal.isDirect && <TableCell sx={{ fontWeight: 700 }}>SOURCE STORE</TableCell>}
                  {!issueModal.isDirect && <TableCell align="center" sx={{ fontWeight: 700 }}>APPROVED</TableCell>}
                  {!issueModal.isDirect && <TableCell align="center" sx={{ fontWeight: 700 }}>REMAINING</TableCell>}
                  <TableCell align="center" sx={{ fontWeight: 700 }}>IN STOCK</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 120 }}>ISSUE QTY</TableCell>
                  {issueModal.isDirect && <TableCell align="center" sx={{ width: '5%' }}></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {issueModal.items.map((it, i) => {
                  let inStock = 0;
                  if (issueModal.isDirect) {
                    inStock = Math.round(stocks.find(s => s.warehouse_id === issueModal.warehouse_id && s.material_id === it.material_id)?.quantity || 0);
                  } else {
                    inStock = Math.round(stocks.find(s => s.warehouse_id === it.warehouse_id && s.material_id === it.material_id)?.quantity || 0);
                  }
                  const maxQty = issueModal.isDirect ? inStock : Math.min(it.remaining, inStock);

                  return (
                    <TableRow key={i}>
                      <TableCell>
                        {issueModal.isDirect ? (
                          <MaterialSelect 
                            materials={materials} 
                            value={it.material_id} 
                            onChange={(val) => updateDirectItem(i, 'material_id', val)}
                          />
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{it.material_name}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>{it.material_code}</Typography>
                          </>
                        )}
                      </TableCell>
                      {!issueModal.isDirect && (
                        <TableCell>
                          <Chip 
                            label={it.warehouse_name || 'Mapped Store'} 
                            size="small" 
                            sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1.5 }} 
                          />
                        </TableCell>
                      )}
                      {!issueModal.isDirect && <TableCell align="center">{it.approved}</TableCell>}
                      {!issueModal.isDirect && <TableCell align="center" sx={{ color: '#1E40AF', fontWeight: 600 }}>{it.remaining}</TableCell>}
                      <TableCell align="center" sx={{ fontWeight: 700, color: inStock > 0 ? '#059669' : '#DC2626' }}>
                        {it.material_id ? inStock : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <TextField 
                          size="small" 
                          type="number" 
                          inputProps={{ step: "1", min: "0", max: String(maxQty) }}
                          onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                          value={it.issue_qty} 
                          disabled={inStock <= 0 || !it.material_id}
                          onChange={e => {
                            const newItems = [...issueModal.items];
                            const val = Math.round(parseFloat(e.target.value.replace(/-/g, '')) || 0);
                            newItems[i].issue_qty = Math.max(0, Math.min(val, maxQty));
                            setIssueModal({ ...issueModal, items: newItems });
                          }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      {issueModal.isDirect && (
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => removeDirectItem(i)} disabled={issueModal.items.length === 1}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TextField 
            fullWidth size="small" label="Remarks" 
            value={issueModal.remarks}
            onChange={e => setIssueModal({ ...issueModal, remarks: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ bgcolor: '#FFFBEB', p: 2, borderRadius: 2, border: '1px solid #FEF3C7' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#92400E', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoOutlined fontSize="small" /> Confirmation required
            </Typography>
            <Typography variant="caption" color="#92400E">Review the issue quantities carefully before proceeding. Stock will be instantly deducted.</Typography>
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
