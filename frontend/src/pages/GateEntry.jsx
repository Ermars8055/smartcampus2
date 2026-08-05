import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, TableSortLabel, Divider, FormHelperText,
  Select, MenuItem, FormControl, InputLabel, Tab, Tabs
} from '@mui/material';
import { Add, Search, LocalShipping, AttachFile, OpenInNew } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import api, { getFileUrl } from '../services/api';
import { formatDateTime, formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function GateEntry() {
  const { hasAction } = useAuth();
  const { showMessage } = useMessage();
  const location = useLocation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [errors, setErrors] = useState({});


  const [dialog, setDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(2);
  const statusFilters = useMemo(() => ['Awaiting GRN', 'Completed', 'All'], []);
  const [sortConfig, setSortConfig] = useState({ key: 'entry_number', direction: 'desc' });

  const initialForm = {
    invoice_number: '', invoice_date: '', invoice_amount: '', invoice_scan_url: '',
    dc_number: '', dc_date: '', dc_scan_url: '',
    vehicle_number: '', delivery_person_name: '', remarks: '',
    tare_weight: '', gross_weight: '', net_weight: '', weight_report_url: ''
  };

  const [form, setForm] = useState(initialForm);


  const [uploading, setUploading] = useState(false);




  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear all errors when form changes
    });
  }, [form]);

  const load = () => { api.get('/api/gate-entries', { params: { search: search || undefined } }).then(r => setEntries(r.data)); };
  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    if (location.state?.openGEId && entries.length > 0) {
      const entryToOpen = entries.find(e => e.id === location.state.openGEId);
      if (entryToOpen) {
        setDetailDialog(entryToOpen);
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, entries, location.pathname, navigate]);





  const handleUpload = async (file, fieldName) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, [fieldName]: res.data.url }));
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    } catch (err) { showMessage('Upload failed: ' + (err.response?.data?.detail || err.message), 'Error', 'error'); }
    setUploading(false);
  };

  const handleCreate = async () => {
    const newErrors = {};

    const hasInvoice = form.invoice_number || form.invoice_date || form.invoice_amount || form.invoice_scan_url;
    const hasDC = form.dc_number || form.dc_date || form.dc_scan_url;

    if (!hasInvoice && !hasDC) {
      newErrors.invoice_number = "Either Invoice or Delivery Challan is required.";
      newErrors.dc_number = "Either Invoice or Delivery Challan is required.";
    }

    if (hasInvoice) {
      if (!form.invoice_scan_url) newErrors.invoice_scan_url = "Please upload the invoice document.";
      if (!form.invoice_number?.trim()) newErrors.invoice_number = "Invoice Number is required.";
      if (!form.invoice_date) {
        newErrors.invoice_date = "Invoice Date is required.";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(form.invoice_date);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate > today) newErrors.invoice_date = "Future dates are not allowed.";
      }
    }

    if (hasDC) {
      if (!form.dc_scan_url) newErrors.dc_scan_url = "Please upload the Delivery Challan document.";
      if (!form.dc_number?.trim()) newErrors.dc_number = "DC Number is required.";
      if (!form.dc_date) {
        newErrors.dc_date = "DC Date is required.";
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(form.dc_date);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate > today) newErrors.dc_date = "Future dates are not allowed.";
      }
    }

    if (!form.delivery_person_name?.trim()) newErrors.delivery_person_name = "Delivery Person Name is required.";

    if (form.gross_weight && form.tare_weight) {
      if (parseFloat(form.gross_weight) < parseFloat(form.tare_weight)) {
        newErrors.gross_weight = "Gross weight cannot be less than Tare weight";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const payload = {
        entry_type: 'Standard',
        vehicle_number: form.vehicle_number || '',
        delivery_person_name: form.delivery_person_name || '',
        invoice_number: form.invoice_number || '',
        invoice_date: form.invoice_date || null,
        invoice_amount: parseFloat(form.invoice_amount) || 0,
        invoice_scan_url: form.invoice_scan_url || '',
        dc_number: form.dc_number || '',
        dc_date: form.dc_date || null,
        dc_scan_url: form.dc_scan_url || '',
        remarks: form.remarks,
        driver_name: form.delivery_person_name || '', // Keep driver_name synced if needed
        tare_weight: form.tare_weight ? parseFloat(form.tare_weight) : null,
        gross_weight: form.gross_weight ? parseFloat(form.gross_weight) : null,
        net_weight: form.net_weight ? parseFloat(form.net_weight) : null,
        weight_report_url: form.weight_report_url || '',
      };

      const res = await api.post('/api/gate-entries', payload);
      setDialog(false); load();
      const entryNum = res?.data?.entry_number || '';
      showMessage(`Gate Entry ${entryNum} recorded successfully!`.trim(), 'Success', 'success');
    } catch (err) {
      const detail = err.response?.data?.detail;
      showMessage(typeof detail === 'object' ? JSON.stringify(detail) : (detail || 'Error'), 'Error', 'error');
    }
  };

  const statusColor = { 'Awaiting GRN': 'warning', 'Completed': 'success' };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedEntries = useMemo(() => {
    let list = entries;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e => 
        e.entry_number?.toLowerCase().includes(q) ||
        e.vehicle_number?.toLowerCase().includes(q) ||
        e.delivery_person_name?.toLowerCase().includes(q) ||
        e.invoice_number?.toLowerCase().includes(q) ||
        e.dc_number?.toLowerCase().includes(q)
      );
    }
    if (statusFilters[tab] !== 'All') {
      list = list.filter(e => e.status === statusFilters[tab]);
    }

    return [...list].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
  
      if (sortConfig.key === 'vehicle_person') {
        valA = a.vehicle_number || a.delivery_person_name;
        valB = b.vehicle_number || b.delivery_person_name;
      }
  
      if (valA == null) valA = '';
      if (valB == null) valB = '';
  
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [entries, search, tab, statusFilters, sortConfig]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Security Gate Entry</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Record incoming materials at site gate</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} disabled={!hasAction('gate_entry', 'can_record_entry')} onClick={() => {
          setForm(initialForm);
          setErrors({});
          setDialog(true);
        }}>New Gate Entry</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search entry number, vehicle, or document..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 380 }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} /> }}
          />
        </Box>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {statusFilters.map((s, i) => (
            <Tab
              key={i}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {s}
                  <Chip
                    label={s === 'All' ? entries.length : entries.filter(e => e.status === s).length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: tab === i ? 'primary.main' : 'action.selected',
                      color: tab === i ? 'white' : 'text.primary',
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
          <Table size="small">
            <TableHead><TableRow>
              <TableCell><TableSortLabel active={sortConfig.key === 'entry_number'} direction={sortConfig.key === 'entry_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('entry_number')}>Entry No.</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'vehicle_person'} direction={sortConfig.key === 'vehicle_person' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vehicle_person')}>Vehicle/Person</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'invoice_number'} direction={sortConfig.key === 'invoice_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_number')}>Document No.</TableSortLabel></TableCell>
              <TableCell align="right"><TableSortLabel active={sortConfig.key === 'invoice_amount'} direction={sortConfig.key === 'invoice_amount' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_amount')}>Amount</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'arrival_time'} direction={sortConfig.key === 'arrival_time' ? sortConfig.direction : 'asc'} onClick={() => handleSort('arrival_time')}>Arrival Time</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>Status</TableSortLabel></TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filteredAndSortedEntries.map(e => (
                <TableRow key={e.id} sx={{ cursor: 'pointer' }} onClick={() => setDetailDialog(e)}>
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{e.entry_number}</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {e.vehicle_number || e.delivery_person_name || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{[e.invoice_number ? 'INV: ' + e.invoice_number : '', e.dc_number ? 'DC: ' + e.dc_number : ''].filter(Boolean).join(' | ') || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{e.invoice_amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDateTime(e.arrival_time)}</TableCell>
                  <TableCell><Chip label={e.status} size="small" color={statusColor[e.status] || 'default'} sx={{ fontSize: '0.7rem' }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Gate Entry Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDetailDialog(null); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{detailDialog?.entry_number} — Gate Entry Details</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Vehicle Number</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.vehicle_number || '—'}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Delivery Person</Typography><Typography sx={{ fontWeight: 600 }}>{detailDialog?.delivery_person_name || '—'}</Typography></Grid>

            {detailDialog?.invoice_number && (
              <>
                <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, color: '#1E3A8A' }}>Invoice Details</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="textSecondary">Invoice Number</Typography><Typography>{detailDialog.invoice_number}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="textSecondary">Invoice Date</Typography><Typography>{formatDate(detailDialog.invoice_date)}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="textSecondary">Amount</Typography><Typography>₹{detailDialog.invoice_amount?.toFixed(2) || '0.00'}</Typography></Grid>
              </>
            )}
            {detailDialog?.dc_number && (
              <>
                <Grid item xs={12}><Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, color: '#1E3A8A' }}>Delivery Challan Details</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="textSecondary">DC Number</Typography><Typography>{detailDialog.dc_number}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="textSecondary">DC Date</Typography><Typography>{formatDate(detailDialog.dc_date)}</Typography></Grid>
              </>
            )}

            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Arrival Time</Typography><Typography>{formatDateTime(detailDialog?.arrival_time)}</Typography></Grid>
            <Grid item xs={6}><Typography variant="caption" color="textSecondary">Status</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={detailDialog?.status} size="small" color={statusColor[detailDialog?.status] || 'default'} /></Box>
            </Grid>

            {(detailDialog?.tare_weight || detailDialog?.gross_weight) && (
              <>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={4}><Typography variant="caption" color="textSecondary">Tare Weight</Typography><Typography>{detailDialog?.tare_weight ? `${detailDialog.tare_weight} kg` : '—'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="textSecondary">Gross Weight</Typography><Typography>{detailDialog?.gross_weight ? `${detailDialog.gross_weight} kg` : '—'}</Typography></Grid>
                <Grid item xs={4}><Typography variant="caption" color="textSecondary">Net Weight</Typography><Typography>{detailDialog?.net_weight ? `${detailDialog.net_weight} kg` : '—'}</Typography></Grid>
              </>
            )}

            <Grid item xs={12}><Typography variant="caption" color="textSecondary">Remarks</Typography><Typography>{detailDialog?.remarks || '—'}</Typography></Grid>

            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

            {detailDialog?.invoice_scan_url && (
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Invoice Scan</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => window.open(getFileUrl(detailDialog.invoice_scan_url), '_blank')}>View Invoice Scan</Button>
                </Box>
              </Grid>
            )}

            {detailDialog?.dc_scan_url && (
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">DC Scan</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => window.open(getFileUrl(detailDialog.dc_scan_url), '_blank')}>View DC Scan</Button>
                </Box>
              </Grid>
            )}

            {detailDialog?.weight_report_url && (
              <Grid item xs={4}>
                <Typography variant="caption" color="textSecondary">Weight Report</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Button size="small" variant="outlined" startIcon={<OpenInNew />}
                    onClick={() => window.open(getFileUrl(detailDialog.weight_report_url), '_blank')}>View Weight Report</Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Create Gate Entry Dialog */}
      <Dialog open={dialog} onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(false); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <LocalShipping fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Record Gate Entry</Typography>
              <Typography variant="body2" color="text.secondary">Log incoming materials and capture invoice details.</Typography>
            </Box>
          </Box>
        </DialogTitle>
                <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={3}>
            {/* DC Section (Left Half) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Delivery Challan Details {(form.dc_number || form.dc_date || form.dc_scan_url) ? <span style={{color: '#d32f2f'}}>*</span> : ''}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="DC Number *" value={form.dc_number} onChange={e => { setForm({ ...form, dc_number: e.target.value }); setErrors(prev => ({ ...prev, dc_number: null })); }} error={!!errors.dc_number} helperText={errors.dc_number} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <DatePicker
                      label="DC Date *"
                      value={form.dc_date ? dayjs(form.dc_date) : null}
                      onChange={val => {
                        setForm({ ...form, dc_date: val ? val.format('YYYY-MM-DD') : '' });
                        setErrors(prev => ({ ...prev, dc_date: null }));
                      }}
                      format="DD/MMM/YYYY"
                      disableFuture
                      localeText={{ fieldMonthPlaceholder: () => 'MMM' }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.dc_date,
                          helperText: errors.dc_date,
                          sx: { bgcolor: 'white' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {form.dc_scan_url ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: 'white' }}>
                        <AttachFile sx={{ color: '#1E3A8A' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#1E3A8A' }}>DC attached ✓</Typography>
                        <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.dc_scan_url), '_blank')}>View</Button>
                        <Button size="small" color="error" onClick={() => setForm({ ...form, dc_scan_url: '' })}>Remove</Button>
                      </Box>
                    ) : (
                      <Button fullWidth variant="outlined" component="label" disabled={uploading}
                        color={errors.dc_scan_url ? 'error' : 'primary'}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{uploading ? 'Uploading...' : '📎 Upload Delivery Challan'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem', mt: 0.5, textTransform: 'none' }}>(PDF, PNG, JPG allowed)</Typography>
                        <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                          onChange={e => handleUpload(e.target.files[0], 'dc_scan_url')} />
                      </Button>
                    )}
                    {errors.dc_scan_url && <FormHelperText error>{errors.dc_scan_url}</FormHelperText>}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Invoice Section (Right Half) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Invoice Details {(form.invoice_number || form.invoice_date || form.invoice_amount || form.invoice_scan_url) ? <span style={{color: '#d32f2f'}}>*</span> : ''}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Invoice Number *" value={form.invoice_number} onChange={e => { setForm({ ...form, invoice_number: e.target.value }); setErrors(prev => ({ ...prev, invoice_number: null })); }} error={!!errors.invoice_number} helperText={errors.invoice_number} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    <DatePicker
                      label="Invoice Date *"
                      value={form.invoice_date ? dayjs(form.invoice_date) : null}
                      onChange={val => {
                        setForm({ ...form, invoice_date: val ? val.format('YYYY-MM-DD') : '' });
                        setErrors(prev => ({ ...prev, invoice_date: null }));
                      }}
                      format="DD/MMM/YYYY"
                      disableFuture
                      localeText={{ fieldMonthPlaceholder: () => 'MMM' }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.invoice_date,
                          helperText: errors.invoice_date,
                          sx: { bgcolor: 'white' }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth className="no-spin" label="Amount" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.invoice_amount} onChange={e => setForm({ ...form, invoice_amount: e.target.value })} sx={{ bgcolor: 'white' }} />
                  </Grid>
                  <Grid item xs={12}>
                    {form.invoice_scan_url ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: 'white' }}>
                        <AttachFile sx={{ color: '#1E3A8A' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#1E3A8A' }}>Invoice attached ✓</Typography>
                        <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.invoice_scan_url), '_blank')}>View</Button>
                        <Button size="small" color="error" onClick={() => setForm({ ...form, invoice_scan_url: '' })}>Remove</Button>
                      </Box>
                    ) : (
                      <Button fullWidth variant="outlined" component="label" disabled={uploading}
                        color={errors.invoice_scan_url ? 'error' : 'primary'}
                        sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, bgcolor: 'white', display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{uploading ? 'Uploading...' : '📎 Upload Invoice'}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem', mt: 0.5, textTransform: 'none' }}>(PDF, PNG, JPG allowed)</Typography>
                        <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                          onChange={e => handleUpload(e.target.files[0], 'invoice_scan_url')} />
                      </Button>
                    )}
                    {errors.invoice_scan_url && <FormHelperText error>{errors.invoice_scan_url}</FormHelperText>}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Delivery Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 2, fontWeight: 600 }}>Delivery Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Delivery Person Name *" value={form.delivery_person_name} onChange={e => { setForm({ ...form, delivery_person_name: e.target.value }); setErrors(prev => ({ ...prev, delivery_person_name: null })); }} error={!!errors.delivery_person_name} helperText={errors.delivery_person_name} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Vehicle Number" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField inputProps={{ maxLength: 255 }} fullWidth label="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Any additional notes..." />
                </Grid>
              </Grid>
            </Grid>

            {/* Vehicle Weight Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 2, fontWeight: 600 }}>Vehicle Weight Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth className="no-spin" label="Tare Weight (Empty)" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.tare_weight} onChange={e => {
                    const val = e.target.value;
                    const net = (form.gross_weight && val) ? (parseFloat(form.gross_weight) - parseFloat(val)).toFixed(2) : '';
                    setForm({ ...form, tare_weight: val, net_weight: net });
                    setErrors(prev => ({ ...prev, gross_weight: null }));
                  }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth className="no-spin" label="Gross Weight (Loaded)" type="number" inputProps={{ step: "0.01", min: "0" }} value={form.gross_weight} onChange={e => {
                    const val = e.target.value;
                    const net = (val && form.tare_weight) ? (parseFloat(val) - parseFloat(form.tare_weight)).toFixed(2) : '';
                    setForm({ ...form, gross_weight: val, net_weight: net });
                    setErrors(prev => ({ ...prev, gross_weight: null }));
                  }} error={!!errors.gross_weight} helperText={errors.gross_weight} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth className="no-spin" label="Net Weight" type="number" value={form.net_weight} InputProps={{ readOnly: true }} disabled />
                </Grid>
                <Grid item xs={12} sm={3}>
                  {form.weight_report_url ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #E2E8F0', borderRadius: 1 }}>
                      <AttachFile sx={{ color: '#475569' }} />
                      <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#475569' }}>Report ✓</Typography>
                      <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.weight_report_url), '_blank')}>View</Button>
                      <Button size="small" color="error" onClick={() => setForm({ ...form, weight_report_url: '' })}>Remove</Button>
                    </Box>
                  ) : (
                    <Button fullWidth variant="outlined" component="label" disabled={uploading}
                      sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2, color: '#475569', borderColor: '#475569' }}>
                      {uploading ? 'Uploading...' : '📎 Upload Report'}
                      <input type="file" hidden accept="image/*,application/pdf" capture="environment"
                        onChange={e => handleUpload(e.target.files[0], 'weight_report_url')} />
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 700, textTransform: 'none' }}>Record Entry</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
