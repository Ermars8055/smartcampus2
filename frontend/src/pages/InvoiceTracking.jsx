import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Checkbox, Button, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  TableSortLabel, Tabs, Tab, Alert, IconButton, Tooltip, Divider, Grid
} from '@mui/material';
import { Search, CheckCircle, Undo, Visibility, Send, Payment, ReceiptLong, OpenInNew, Outbox } from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

export default function InvoiceTracking() {
  const { hasAction } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [currentTab, setCurrentTab] = useState('approved');
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'invoice_date', direction: 'asc' });
  const [selected, setSelected] = useState([]);
  const [targetAmount, setTargetAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dialogs
  const [detailDialog, setDetailDialog] = useState(null);
  const [remarkDialog, setRemarkDialog] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [sendForPaymentDialog, setSendForPaymentDialog] = useState(false);
  const [markPaidDialog, setMarkPaidDialog] = useState(false);
  const [undoDialog, setUndoDialog] = useState(null);
  const [singleSendDialog, setSingleSendDialog] = useState(null);
  const [singlePaidDialog, setSinglePaidDialog] = useState(null);
  const [singleTargetAmount, setSingleTargetAmount] = useState('');
  const [sendHardCopyDialog, setSendHardCopyDialog] = useState(null);

  const load = () => {
    // Fetch all Approved invoices (this covers Pending, Sent for Payment, and Paid payment statuses)
    api.get('/api/finance/invoices').then(r => {
      setInvoices(r.data.filter(i => i.status === 'Approved'));
    }).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  // Clear selection when changing tabs
  useEffect(() => { setSelected([]); setTargetAmount(''); setPaymentRef(''); }, [currentTab]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Categorize invoices into the 6 linear workflow tabs
  const categorized = useMemo(() => {
    return {
      all: invoices,
      approved: invoices.filter(i => !i.hard_copy_sent && i.payment_status === 'Pending'),
      sent_hard_copy: invoices.filter(i => i.hard_copy_sent === true && i.hard_copy_received === false && i.payment_status === 'Pending'),
      received_hard_copy: invoices.filter(i => i.hard_copy_received === true && i.payment_status === 'Pending'),
      sent_for_payment: invoices.filter(i => i.payment_status === 'Sent for Payment'),
      paid: invoices.filter(i => i.payment_status === 'Paid')
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    let list = categorized[currentTab] || [];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(i =>
        i.invoice_number?.toLowerCase().includes(s) ||
        i.vendor_name?.toLowerCase().includes(s) ||
        i.code?.toLowerCase().includes(s) ||
        i.payment_reference?.toLowerCase().includes(s)
      );
    }
    return [...list].sort((a, b) => {
      let valA = a[sortConfig.key]; let valB = b[sortConfig.key];
      if (valA == null) valA = ''; if (valB == null) valB = '';
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [categorized, currentTab, search, sortConfig]);

  // Bulk Selection Logic
  const selectedTotal = useMemo(() => {
    return filteredInvoices.filter(i => selected.includes(i.id)).reduce((sum, i) => sum + (i.total_amount || 0), 0);
  }, [selected, filteredInvoices]);

  const target = parseFloat(targetAmount) || 0;
  const progress = target > 0 ? Math.min((selectedTotal / target) * 100, 100) : 0;
  const isOverTarget = target > 0 && selectedTotal > target;

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelected(filteredInvoices.map(i => i.id));
    else setSelected([]);
  };

  // Actions
  const handleMarkHardCopyReceived = async (invoiceId, received = true) => {
    try {
      await api.put('/api/finance/hard-copy', {
        invoice_id: invoiceId,
        hard_copy_received: received,
        hard_copy_remarks: received ? remarks : null
      });
      setRemarkDialog(null);
      setRemarks('');
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update hard copy status');
    }
  };

  const handleSendForPayment = async () => {
    setLoading(true);
    try {
      await api.put('/api/finance/send-for-payment', {
        invoice_ids: selected,
        target_amount: target
      });
      setSelected([]);
      setTargetAmount('');
      setSendForPaymentDialog(false);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send for payment');
    }
    setLoading(false);
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      await api.put('/api/finance/update-payment-status', {
        invoice_ids: selected,
        payment_reference: paymentRef || null
      });
      setSelected([]);
      setPaymentRef('');
      setMarkPaidDialog(false);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update payment status');
    }
    setLoading(false);
  };

  const handleSendHardCopy = async (id) => {
    try {
      await api.put('/api/finance/send-hard-copy', {
        invoice_id: id
      });
      setSendHardCopyDialog(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send hard copy');
    }
  };

  const handleSingleSendForPayment = async (targetAmt) => {
    setLoading(true);
    try {
      await api.put('/api/finance/send-for-payment', {
        invoice_ids: [singleSendDialog.id],
        target_amount: parseFloat(targetAmt) || 0
      });
      setSingleSendDialog(null);
      setSingleTargetAmount('');
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send for payment');
    }
    setLoading(false);
  };

  const handleSingleMarkPaid = async () => {
    setLoading(true);
    try {
      await api.put('/api/finance/update-payment-status', {
        invoice_ids: [singlePaidDialog.id],
        payment_reference: paymentRef || null
      });
      setSinglePaidDialog(null);
      setPaymentRef('');
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update payment status');
    }
    setLoading(false);
  };

  const statusColor = { 'Pending': 'warning', 'Sent for Payment': 'info', 'Paid': 'success' };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Invoice Tracking</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Track invoices from hard copy receipt through payment completion</Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search invoices..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300, bgcolor: 'white', borderRadius: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Approved (${categorized.approved.length})`} value="approved" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Sent Hard Copy (${categorized.sent_hard_copy.length})`} value="sent_hard_copy" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Hard Copy Received (${categorized.received_hard_copy.length})`} value="received_hard_copy" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Sent for Payment (${categorized.sent_for_payment.length})`} value="sent_for_payment" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`Paid (${categorized.paid.length})`} value="paid" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto', mr: 2 }} />
          <Tab label={`All (${categorized.all?.length || 0})`} value="all" sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto' }} />
        </Tabs>
      </Card>

      {/* Bulk Action Bars */}
      {currentTab === 'received_hard_copy' && selected.length > 0 && hasAction('finance_invoices', 'can_send_for_payment') && (
        <Card sx={{ mb: 2, p: 2, background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #86EFAC' }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Target Amount (₹)"
              type="number"
              size="small"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Selected: {selected.length} invoice(s) — ₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Typography>
                {target > 0 && (
                  <Typography variant="body2" sx={{ color: isOverTarget ? '#DC2626' : '#059669', fontWeight: 600 }}>
                    {isOverTarget ? 'Over Target!' : `₹${(target - selectedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`}
                  </Typography>
                )}
              </Box>
              {target > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8, borderRadius: 4,
                    backgroundColor: '#E2E8F0',
                    '& .MuiLinearProgress-bar': { backgroundColor: isOverTarget ? '#DC2626' : progress >= 95 ? '#059669' : '#2563EB', borderRadius: 4 }
                  }}
                />
              )}
            </Box>
            <Button
              variant="contained" startIcon={<Send />} disabled={isOverTarget} onClick={() => setSendForPaymentDialog(true)}
              sx={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', textTransform: 'none', fontWeight: 600 }}
            >
              Send for Payment
            </Button>
          </Box>
          {isOverTarget && <Alert severity="error" sx={{ mt: 2 }}>Selection exceeds target amount. Must be exact or less.</Alert>}
        </Card>
      )}

      {currentTab === 'sent_for_payment' && selected.length > 0 && hasAction('finance_invoices', 'can_mark_paid') && (
        <Card sx={{ mb: 2, p: 2, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #93C5FD' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 600 }}>
              {selected.length} invoice(s) selected — ₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" color="success" startIcon={<Payment />} onClick={() => setMarkPaidDialog(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Mark as Paid
            </Button>
          </Box>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {(currentTab === 'received_hard_copy' || currentTab === 'sent_for_payment') && (
                  <TableCell padding="checkbox">
                    <Checkbox indeterminate={selected.length > 0 && selected.length < filteredInvoices.length} checked={filteredInvoices.length > 0 && selected.length === filteredInvoices.length} onChange={handleSelectAll} />
                  </TableCell>
                )}
                <TableCell><TableSortLabel active={sortConfig.key === 'invoice_number'} direction={sortConfig.key === 'invoice_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_number')}>Invoice No.</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'invoice_date'} direction={sortConfig.key === 'invoice_date' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_date')}>Date</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor</TableSortLabel></TableCell>
                <TableCell align="right"><TableSortLabel active={sortConfig.key === 'total_amount'} direction={sortConfig.key === 'total_amount' ? sortConfig.direction : 'asc'} onClick={() => handleSort('total_amount')}>Amount (₹)</TableSortLabel></TableCell>
                <TableCell>Hard Copy</TableCell>
                <TableCell>Payment Status</TableCell>
                {currentTab === 'sent_for_payment' && <TableCell>Sent Date</TableCell>}
                {currentTab === 'paid' && <TableCell>Payment Ref</TableCell>}
                {currentTab === 'paid' && <TableCell>Paid Date</TableCell>}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map(i => (
                <TableRow key={i.id} hover selected={selected.includes(i.id)} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(i)}>
                  {(currentTab === 'received_hard_copy' || currentTab === 'sent_for_payment') && (
                    <TableCell padding="checkbox"><Checkbox checked={selected.includes(i.id)} onChange={(e) => { e.stopPropagation(); handleSelect(i.id); }} onClick={(e) => e.stopPropagation()} /></TableCell>
                  )}
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{i.invoice_number}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(i.invoice_date)}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{i.vendor_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{i.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Chip label={i.hard_copy_received ? 'Received' : 'Pending'} size="small" color={i.hard_copy_received ? 'success' : 'warning'} sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={i.payment_status} size="small" color={statusColor[i.payment_status] || 'default'} sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  {currentTab === 'sent_for_payment' && <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(i.sent_for_payment_at)}</TableCell>}
                  {currentTab === 'paid' && <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{i.payment_reference || '-'}</TableCell>}
                  {currentTab === 'paid' && <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(i.payment_completed_at)}</TableCell>}
                  <TableCell align="center" onClick={(e) => e.stopPropagation()} sx={{ whiteSpace: 'nowrap' }}>
                    {hasAction('finance_invoices', 'can_send_hard_copy') && (
                      <Tooltip title="Send Hard Copy">
                        <span>
                          <IconButton size="small" color="primary" disabled={!(i.payment_status === 'Pending' && !i.hard_copy_sent)} onClick={() => setSendHardCopyDialog(i)}>
                            <Outbox fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}

                    {hasAction('finance_invoices', 'can_receive_hard_copy') && (
                      <Tooltip title="Mark Hard Copy Received">
                        <span>
                          <IconButton size="small" color="success" disabled={!(i.payment_status === 'Pending' && i.hard_copy_sent && !i.hard_copy_received)} onClick={() => { setRemarkDialog(i); setRemarks(''); }}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}

                    {hasAction('finance_invoices', 'can_send_for_payment') && (
                      <Tooltip title="Send for Payment">
                        <span>
                          <IconButton size="small" color="primary" disabled={!(i.payment_status === 'Pending' && i.hard_copy_received)} onClick={() => { setSingleSendDialog(i); setSingleTargetAmount(''); }}>
                            <Send fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}

                    {hasAction('finance_invoices', 'can_mark_paid') && (
                      <Tooltip title="Mark as Paid">
                        <span>
                          <IconButton size="small" color="success" disabled={i.payment_status !== 'Sent for Payment'} onClick={() => setSinglePaidDialog(i)}>
                            <Payment fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: '#64748B' }}>No invoices found in this stage.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Mark Hard Copy Received Dialog */}
      <Dialog open={!!remarkDialog} onClose={() => setRemarkDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Hard Copy Receipt</DialogTitle>
        <DialogContent dividers>
          {remarkDialog && (
            <Box>
              <Typography sx={{ mb: 2 }}>Marking hard copy received for invoice <strong>{remarkDialog.invoice_number}</strong> from <strong>{remarkDialog.vendor_name}</strong></Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Amount: <strong>₹{remarkDialog.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></Typography>
              <TextField inputProps={{ maxLength: 255 }} label="Remarks (Optional)" fullWidth multiline rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} sx={{ mt: 2 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRemarkDialog(null)}>Cancel</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleMarkHardCopyReceived(remarkDialog.id, true)}>Confirm Receipt</Button>
        </DialogActions>
      </Dialog>

      {/* Send Hard Copy Dialog */}
      <Dialog open={!!sendHardCopyDialog} onClose={() => setSendHardCopyDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Send Hard Copy</DialogTitle>
        <DialogContent dividers>
          {sendHardCopyDialog && (
            <Box>
              <Typography sx={{ mb: 2 }}>Are you sure you want to mark the hard copy as sent for invoice <strong>{sendHardCopyDialog.invoice_number}</strong> from <strong>{sendHardCopyDialog.vendor_name}</strong>?</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSendHardCopyDialog(null)}>Cancel</Button>
          <Button variant="contained" color="primary" startIcon={<Outbox />} onClick={() => handleSendHardCopy(sendHardCopyDialog.id)}>Confirm Send</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Send for Payment Dialog */}
      <Dialog open={sendForPaymentDialog} onClose={() => setSendForPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Send for Payment (Bulk)</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>You are about to send <strong>{selected.length} invoice(s)</strong> for payment.</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Amount:</Typography><Typography sx={{ fontWeight: 700, color: '#059669' }}>₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
          {target > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography color="textSecondary">Target Amount:</Typography><Typography sx={{ fontWeight: 600 }}>₹{target.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSendForPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSendForPayment} disabled={loading} startIcon={<CheckCircle />}>{loading ? 'Processing...' : 'Confirm'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!singleSendDialog} onClose={() => { setSingleSendDialog(null); setSingleTargetAmount(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Payment Processing</DialogTitle>
        <DialogContent dividers sx={{ background: '#F8FAFC' }}>
          {singleSendDialog && (() => {
            const tgt = parseFloat(singleTargetAmount) || 0;
            const singleTotal = singleSendDialog.total_amount || 0;
            const prog = tgt > 0 ? Math.min((singleTotal / tgt) * 100, 100) : 0;
            const isOver = tgt > 0 && singleTotal > tgt;
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={{ fontWeight: 600 }}>Processing Invoice <strong>{singleSendDialog.invoice_number}</strong></Typography>
                <TextField label="Target Amount (₹)" type="number" size="small" value={singleTargetAmount} onChange={(e) => setSingleTargetAmount(e.target.value)} sx={{ bgcolor: 'white', borderRadius: 1 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Invoice Amount: ₹{singleTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                    {tgt > 0 && (
                      <Typography variant="body2" sx={{ color: isOver ? '#DC2626' : '#059669', fontWeight: 600 }}>
                        {isOver ? 'Over Target!' : `₹${(tgt - singleTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`}
                      </Typography>
                    )}
                  </Box>
                  {tgt > 0 && <LinearProgress variant="determinate" value={prog} sx={{ height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', '& .MuiLinearProgress-bar': { backgroundColor: isOver ? '#DC2626' : prog >= 95 ? '#059669' : '#2563EB', borderRadius: 4 } }} />}
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => { setSingleSendDialog(null); setSingleTargetAmount(''); }}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => handleSingleSendForPayment(singleTargetAmount)} disabled={loading || (parseFloat(singleTargetAmount) > 0 && singleSendDialog?.total_amount > parseFloat(singleTargetAmount))} startIcon={<Send />}>{loading ? 'Processing...' : 'Send for Payment'}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Mark Paid Dialog (Bulk) */}
      <Dialog open={markPaidDialog} onClose={() => setMarkPaidDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Mark as Paid (Bulk)</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>Marking <strong>{selected.length} invoice(s)</strong> as paid.</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total Amount:</Typography><Typography sx={{ fontWeight: 700, color: '#059669' }}>₹{selectedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
          <TextField label="Payment Reference (UTR / Cheque No.)" fullWidth value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Enter UTR number, cheque number, or reference" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMarkPaidDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleMarkPaid} disabled={loading} startIcon={<CheckCircle />}>{loading ? 'Processing...' : 'Confirm Payment'}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Single Mark Paid Dialog */}
      <Dialog open={!!singlePaidDialog} onClose={() => setSinglePaidDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Mark as Paid</DialogTitle>
        <DialogContent dividers>
          {singlePaidDialog && (
            <Box>
              <Typography sx={{ mb: 2 }}>Marking invoice <strong>{singlePaidDialog.invoice_number}</strong> as paid.</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Amount:</Typography><Typography sx={{ fontWeight: 700, color: '#059669' }}>₹{singlePaidDialog.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
              <TextField label="Payment Reference (UTR / Cheque No.)" fullWidth value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Enter UTR number, cheque number, or reference" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSinglePaidDialog(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSingleMarkPaid} disabled={loading} startIcon={<CheckCircle />}>{loading ? 'Processing...' : 'Confirm Payment'}</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Invoice: {detailDialog?.invoice_number}</span>
          <Chip label={detailDialog?.status} size="small" color={detailDialog?.status === 'Approved' ? 'success' : 'default'} />
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#F8FAFC' }}>
          <Grid container spacing={3}>
            {/* Left Column: General & Hard Copy */}
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>General Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Invoice Date</Typography><Typography sx={{ fontWeight: 600 }}>{formatDate(detailDialog?.invoice_date)}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Vendor</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vendor_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Registered By</Typography><Typography>{detailDialog?.created_by_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">PO Ref</Typography><Typography>{detailDialog?.po_number || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="textSecondary">Gate Entry</Typography><Typography>{detailDialog?.gate_entry_number || '-'}</Typography></Grid>
                </Grid>
              </Card>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Hard Copy Tracking</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Received Status</Typography><Box><Chip label={detailDialog?.hard_copy_received ? 'Received' : 'Pending'} size="small" color={detailDialog?.hard_copy_received ? 'success' : 'warning'} /></Box></Grid>
                  {detailDialog?.hard_copy_sent && <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Sent By</Typography><Typography>{detailDialog?.hard_copy_sent_by_name || '-'}</Typography></Grid>}
                  {detailDialog?.hard_copy_sent && <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Sent Date</Typography><Typography>{formatDate(detailDialog?.hard_copy_sent_at)}</Typography></Grid>}
                  {detailDialog?.hard_copy_received && <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Received By</Typography><Typography>{detailDialog?.hard_copy_received_by_name || '-'}</Typography></Grid>}
                  {detailDialog?.hard_copy_received && <Grid item xs={6} sm={3}><Typography variant="caption" color="textSecondary">Received Date</Typography><Typography>{formatDate(detailDialog?.hard_copy_received_at)}</Typography></Grid>}
                  {detailDialog?.hard_copy_received && <Grid item xs={12}><Typography variant="caption" color="textSecondary">Remarks</Typography><Typography>{detailDialog?.hard_copy_remarks || '-'}</Typography></Grid>}
                </Grid>
              </Card>
            </Grid>

            {/* Right Column: Payment & Summary */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Payment Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}><Typography variant="caption" color="textSecondary">Payment Status</Typography><Box><Chip label={detailDialog?.payment_status} size="small" color={statusColor[detailDialog?.payment_status] || 'default'} /></Box></Grid>
                  {detailDialog?.sent_for_payment_at && <Grid item xs={12}><Typography variant="caption" color="textSecondary">Sent For Payment</Typography><Typography>{formatDate(detailDialog?.sent_for_payment_at)} by {detailDialog?.sent_for_payment_by_name}</Typography></Grid>}
                  {detailDialog?.payment_completed_at && <Grid item xs={12}><Typography variant="caption" color="textSecondary">Paid On</Typography><Typography>{formatDate(detailDialog?.payment_completed_at)} by {detailDialog?.payment_completed_by_name}</Typography></Grid>}
                  {detailDialog?.payment_reference && <Grid item xs={12}><Typography variant="caption" color="textSecondary">Payment Ref (UTR)</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.payment_reference}</Typography></Grid>}
                  {detailDialog?.scan_url && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="textSecondary">Invoice Scan</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Button size="small" variant="outlined" startIcon={<OpenInNew />} onClick={() => window.open(getFileUrl(detailDialog.scan_url), '_blank')}>View Invoice Scan</Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Card>
            </Grid>
          </Grid>
          
          {/* Summary */}
          <Card sx={{ p: 3, mt: 1, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }} elevation={0}>
            <Grid container justifyContent="flex-end">
              <Grid item xs={12} sm={8} md={5}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Summary</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{detailDialog?.total_taxable_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxes (GST)</Typography><Typography>₹{((detailDialog?.total_cgst||0) + (detailDialog?.total_sgst||0) + (detailDialog?.total_igst||0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>₹{detailDialog?.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography></Box>
              </Grid>
            </Grid>
          </Card>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
