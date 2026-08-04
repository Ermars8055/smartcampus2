import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, IconButton, Tooltip, Rating,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, OutlinedInput,
  Checkbox, ListItemText, useTheme, useMediaQuery, Snackbar, Alert, Switch, FormControlLabel,
  Tabs, Tab
} from '@mui/material';
import {
  Add, Edit, Search, Store, Person, Phone, Email,
  Business, LocationOn, Description, Category, PinDrop,
  Badge, AppRegistration, ArrowDropDown, Numbers, CheckCircle, Cancel
} from '@mui/icons-material';
import { TableSortLabel } from '@mui/material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';

const STATES_LIST = [
  '01 - Jammu And Kashmir',
  '02 - Himachal Pradesh',
  '03 - Punjab',
  '04 - Chandigarh',
  '05 - Uttarakhand',
  '06 - Haryana',
  '07 - Delhi',
  '08 - Rajasthan',
  '09 - Uttar Pradesh',
  '10 - Bihar',
  '11 - Sikkim',
  '12 - Arunachal Pradesh',
  '13 - Nagaland',
  '14 - Manipur',
  '15 - Mizoram',
  '16 - Tripura',
  '17 - Meghalaya',
  '18 - Assam',
  '19 - West Bengal',
  '20 - Jharkhand',
  '21 - Orissa',
  '22 - Chhattisgarh',
  '23 - Madhya Pradesh',
  '24 - Gujarat',
  '26 - Dadra And Nagar Haveli & Daman And Diu',
  '27 - Maharashtra',
  '29 - Karnataka',
  '30 - Goa',
  '31 - Lakshadweep',
  '32 - Kerala',
  '33 - Tamil Nadu',
  '34 - Puducherry',
  '35 - Andaman And Nicobar',
  '36 - Telangana',
  '37 - Andhra Pradesh',
  '38 - Ladakh',
  '97 - Other Territory',
  '99 - Other Country'
];

export default function Vendors() {
  const { showMessage } = useMessage();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('All');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', code: '', contact_person: '', phone: '', email: '',
    gst_number: '', address_line_1: '', address_line_2: '', city: '', pincode: '', state: '', category_ids: [], rating: 0, is_active: true
  });
  const [viewOnly, setViewOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectingVendor, setRejectingVendor] = useState(null);
  const [vendorHistory, setVendorHistory] = useState([]);
  const [dialogTab, setDialogTab] = useState(0);

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = () => {
    api.get('/api/vendors', { params: { search: search || undefined, include_inactive: true, all_status: true } }).then(r => {
      let data = [...r.data];
      if (sortConfig.key) {
        data.sort((a, b) => {
          const aVal = a[sortConfig.key] || '';
          const bVal = b[sortConfig.key] || '';
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      setVendors(data);
    });
  };

  useEffect(() => {
    load();
    api.get('/api/categories').then(r => setCategories(r.data));
  }, []);

  useEffect(() => { load(); }, [search, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Vendor name is required';
    if (!form.contact_person) {
      newErrors.contact_person = 'Contact person is required';
    } else if (/[^a-zA-Z\s]/.test(form.contact_person)) {
      newErrors.contact_person = 'Contact Person cannot contain numbers or special characters';
    }

    // Contact Number validation: 10 to 11 digits
    if (!form.phone) newErrors.phone = 'Contact Number is required';
    else if (!/^\d{10,11}$/.test(form.phone)) newErrors.phone = 'Contact Number must be 10 to 11 digits';

    // Email validation: standard regex
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)) newErrors.email = 'Invalid email address';

    // GST validation: Indian GSTIN format
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!form.gst_number) newErrors.gst_number = 'GST number is required';
    else if (!gstRegex.test(form.gst_number)) newErrors.gst_number = 'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)';

    if (!form.city) newErrors.city = 'City is required';
    if (!form.state) newErrors.state = 'State is required';
    if (!form.pincode) newErrors.pincode = 'Pincode is required';
    if (!form.address_line_1) newErrors.address_line_1 = 'Address Line 1 is required';
    if (!form.category_ids || form.category_ids.length === 0) newErrors.category_ids = 'At least one vendor category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const payload = { ...form };
      if (!editing && !payload.code) delete payload.code;

      if (editing) {
        await api.put(`/api/vendors/${editing}`, payload);
      } else {
        await api.post('/api/vendors', payload);
      }

      setDialog(false);
      setEditing(null);
      setErrors({});
      load();
      setSnackbar({ open: true, message: 'Vendor saved successfully!', severity: 'success' });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const serverErrors = {};
        detail.forEach(e => {
          if (e.loc?.includes('email')) serverErrors.email = e.msg;
          else if (e.loc?.includes('phone')) serverErrors.phone = e.msg;
          else if (e.loc?.includes('name')) serverErrors.name = e.msg;
        });
        setErrors(serverErrors);
      } else {
        showMessage(detail || 'Error saving vendor', 'Error', 'error');
      }
    }
  };

  const handleApprove = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/api/vendors/${id}/approve`);
      setSnackbar({ open: true, message: 'Vendor approved successfully!', severity: 'success' });
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error approving vendor', 'Error', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) return;
    try {
      await api.post(`/api/vendors/${rejectingVendor}/reject`, { remarks: rejectRemarks });
      setSnackbar({ open: true, message: 'Vendor rejected', severity: 'warning' });
      setRejectDialog(false);
      setRejectRemarks('');
      setRejectingVendor(null);
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error rejecting vendor', 'Error', 'error');
    }
  };

  const openEdit = (v, view = false) => {
    setEditing(v.id);
    setViewOnly(view);
    setErrors({});
    api.get(`/api/vendors/${v.id}`).then(r => {
      setForm({
        ...r.data,
        category_ids: r.data.category_ids || [],
        address_line_1: r.data.address_line_1 || '',
        address_line_2: r.data.address_line_2 || '',
        city: r.data.city || '',
        pincode: r.data.pincode || '',
        state: r.data.state || '',
        rating: r.data.rating || 0,
        is_active: r.data.is_active !== false
      });
      setDialog(true);
      setDialogTab(0);
      api.get(`/api/vendors/${v.id}/history`).then(res => setVendorHistory(res.data)).catch(() => setVendorHistory([]));
    });
  };

  const pendingApprovals = vendors.filter(v => v.can_user_approve);

  return (
    <Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Vendor Master</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{vendors.length} registered vendors</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditing(null);
            setViewOnly(false);
            setErrors({});
            setVendorHistory([]);
            setDialogTab(0);
            setForm({
              name: '', code: '', contact_person: '', phone: '', email: '',
              gst_number: '', address_line_1: '', address_line_2: '', city: '', pincode: '', state: '', category_ids: [], rating: 0, is_active: true
            });
            setDialog(true);
          }}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Add Vendor
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, pb: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TextField
          size="small"
          placeholder="Search vendors by Code/Name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 350, mb: 2 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} />,
            sx: { borderRadius: 2 }
          }}
        />
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          {['Submitted', 'Approved', 'Rejected', 'Active', 'Inactive', 'All'].map(s => {
            let count = 0;
            if (s === 'All') count = vendors.length;
            else if (s === 'Active') count = vendors.filter(v => v.is_active).length;
            else if (s === 'Inactive') count = vendors.filter(v => !v.is_active).length;
            else count = vendors.filter(v => v.status === s).length;
            
            if (s !== 'All' && count === 0 && !['Submitted', 'Approved'].includes(s)) return null;
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

      {(() => {
        const filteredVendors = vendors.filter(v => {
          if (tabValue === 'All') return true;
          if (tabValue === 'Active') return v.is_active;
          if (tabValue === 'Inactive') return !v.is_active;
          return v.status === tabValue;
        });
        return (
          <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {isMobile ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
                {filteredVendors.length === 0 && (
                  <Typography variant="body2" align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    No vendors found.
                  </Typography>
                )}
                {filteredVendors.map(v => (
                  <Card key={v.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => openEdit(v, true)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1, alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>{v.name}</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#2563EB' }}>{v.code}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Chip label={`L${v.current_approval_level || 1}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
                          <Chip
                            label={v.status === 'Submitted' ? (v.previous_status ? <span style={{ display: 'block', textAlign: 'center', lineHeight: 1.1 }}>Submitted<br /><span style={{ fontSize: '0.55rem', fontWeight: 400 }}>(was {v.previous_status})</span></span> : <span>Submitted</span>) : v.status}
                            size="small"
                            sx={{
                              bgcolor: v.status === 'Approved' ? '#ECFDF5' : (v.status === 'Rejected' ? '#FEF2F2' : (v.status === 'Submitted' ? '#FEF9C3' : '#F1F5F9')),
                              color: v.status === 'Approved' ? '#10B981' : (v.status === 'Rejected' ? '#EF4444' : (v.status === 'Submitted' ? '#CA8A04' : '#64748B')),
                              fontWeight: 600, fontSize: '0.65rem', height: v.status === 'Submitted' ? 'auto' : 20, py: v.status === 'Submitted' ? 0.5 : 0
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Contact:</strong> {v.contact_person} | {v.phone}</Typography>

                    <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: '#64748B' }}>Email: {v.email || '-'}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', flex: 1 }}>
                        {v.categories?.slice(0, 2).map((c, i) => <Chip key={i} label={c} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                        {v.categories?.length > 2 && <Typography variant="caption" sx={{ color: '#64748B', ml: 0.5 }}>+{v.categories.length - 2}</Typography>}
                      </Box>
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit Vendor">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(v, false); }} sx={{ color: '#64748B' }}>
                            <Edit color="primary" fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {v.can_user_approve && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton size="small" color="success" onClick={(e) => handleApprove(v.id, e)} sx={{ ml: 0.5, bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setRejectingVendor(v.id); setRejectDialog(true); }} sx={{ ml: 0.5, bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                        <TableSortLabel
                          active={sortConfig.key === 'code'}
                          direction={sortConfig.direction}
                          onClick={() => requestSort('code')}
                        >
                          CODE
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                        <TableSortLabel
                          active={sortConfig.key === 'name'}
                          direction={sortConfig.direction}
                          onClick={() => requestSort('name')}
                        >
                          VENDOR NAME
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                        <TableSortLabel
                          active={sortConfig.key === 'contact_person'}
                          direction={sortConfig.direction}
                          onClick={() => requestSort('contact_person')}
                        >
                          CONTACT
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                        <TableSortLabel
                          active={sortConfig.key === 'phone'}
                          direction={sortConfig.direction}
                          onClick={() => requestSort('phone')}
                        >
                          PHONE
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                        <TableSortLabel
                          active={sortConfig.key === 'email'}
                          direction={sortConfig.direction}
                          onClick={() => requestSort('email')}
                        >
                          MAIL ID
                        </TableSortLabel>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>CATEGORIES</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>APPROVAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>LVL</TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVendors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                          <Typography variant="body2">No vendors found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredVendors.map(v => (
                      <TableRow
                        key={v.id}
                        hover
                        onClick={() => openEdit(v, true)}
                        sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', whiteSpace: 'normal', wordBreak: 'break-word', minWidth: '80px' }}>{v.code}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'normal', wordBreak: 'break-word', minWidth: '120px' }}>{v.name}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>{v.contact_person}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>{v.phone}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'normal', wordBreak: 'break-all', minWidth: '100px' }}>{v.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {v.categories?.map((c, i) => <Chip key={i} label={c} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />)}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={v.status === 'Submitted' ? (v.previous_status ? <span style={{ display: 'block', textAlign: 'center', lineHeight: 1.1 }}>Submitted<br /><span style={{ fontSize: '0.55rem', fontWeight: 400 }}>(was {v.previous_status})</span></span> : <span>Submitted</span>) : v.status}
                            size="small"
                            sx={{
                              bgcolor: v.status === 'Approved' ? '#ECFDF5' : (v.status === 'Rejected' ? '#FEF2F2' : (v.status === 'Submitted' ? '#FEF9C3' : '#F1F5F9')),
                              color: v.status === 'Approved' ? '#10B981' : (v.status === 'Rejected' ? '#EF4444' : (v.status === 'Submitted' ? '#CA8A04' : '#64748B')),
                              fontWeight: 600, fontSize: '0.75rem', borderRadius: '6px', height: v.status === 'Submitted' ? 'auto' : 24, py: v.status === 'Submitted' ? 0.5 : 0
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`L${v.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 24, fontSize: '0.65rem', borderRadius: '6px', fontWeight: 600 }} />
                        </TableCell>

                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Edit Vendor">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(v, false); }} sx={{ color: '#64748B' }}>
                                <Edit color="primary" fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {v.can_user_approve && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton size="small" color="success" onClick={(e) => handleApprove(v.id, e)} sx={{ ml: 0.5, bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setRejectingVendor(v.id); setRejectDialog(true); }} sx={{ ml: 0.5, bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}

                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        );
      })()}

      <Dialog
        open={dialog}
        onClose={(e, reason) => { if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') setDialog(false); }}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <Store fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {viewOnly ? 'Vendor Details' : (editing ? 'Edit Vendor Details' : 'Register New Vendor')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {viewOnly ? 'Comprehensive information about this vendor partner.' : (editing ? 'Update vendor credentials and contact information.' : 'Enter the details to add a new vendor to the platform.')}
              </Typography>
            </Box>
          </Box>
          {viewOnly && (
            <Tabs value={dialogTab} onChange={(e, v) => setDialogTab(v)} sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Vendor Details" />
              <Tab label="Approval History" />
            </Tabs>
          )}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {dialogTab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, pt: 2 }}>
              <TextField
                fullWidth
                label="Vendor Code"
                value={form.code || ''}
                placeholder="Auto-generated"
                disabled
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Badge sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Vendor Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                disabled={viewOnly || !!editing}
                error={!!errors.name}
                helperText={errors.name}
                sx={{ gridColumn: { sm: 'span 2' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Business sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />

              <FormControl fullWidth sx={{ gridColumn: { sm: 'span 2' } }} required error={!!errors.category_ids}>
                <InputLabel>Vendor Categories</InputLabel>
                <Select
                  multiple
                  value={form.category_ids}
                  onChange={e => setForm({ ...form, category_ids: e.target.value })}
                  disabled={viewOnly}
                  input={<OutlinedInput label="Vendor Categories" startAdornment={<Category sx={{ mr: 1, color: '#94A3B8' }} />} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => (
                        <Chip key={id} label={categories.find(c => c.id === id)?.name} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      <Checkbox checked={form.category_ids.indexOf(cat.id) > -1} />
                      <ListItemText primary={cat.name} />
                    </MenuItem>
                  ))}
                </Select>
                {errors.category_ids && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5, mb: -1 }}>{errors.category_ids}</Typography>}
              </FormControl>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, ml: 1.5 }}>Vendor Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1.5 }}>
                  <Rating
                    value={form.rating}
                    onChange={(e, newVal) => setForm({ ...form, rating: newVal })}
                    precision={0.5}
                    readOnly={viewOnly}
                  />
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 700 }}>{form.rating || 0}</Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Contact Person"
                value={form.contact_person}
                onChange={e => setForm({ ...form, contact_person: e.target.value })}
                required
                disabled={viewOnly}
                error={!!errors.contact_person}
                helperText={errors.contact_person}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Contact Number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                required
                disabled={viewOnly}
                error={!!errors.phone}
                helperText={errors.phone}
                inputProps={{ maxLength: 11 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Email Address"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                disabled={viewOnly}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="GST Number"
                value={form.gst_number}
                onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase().slice(0, 15) })}
                required
                disabled={viewOnly}
                error={!!errors.gst_number}
                helperText={errors.gst_number}
                inputProps={{ maxLength: 15 }}
                sx={{ gridColumn: { sm: 'span 3' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AppRegistration sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Address Line 1"
                value={form.address_line_1}
                onChange={e => setForm({ ...form, address_line_1: e.target.value })}
                required
                disabled={viewOnly}
                error={!!errors.address_line_1}
                helperText={errors.address_line_1}
                sx={{ gridColumn: { sm: 'span 3' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Description sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Address Line 2"
                value={form.address_line_2}
                onChange={e => setForm({ ...form, address_line_2: e.target.value })}
                disabled={viewOnly}
                error={!!errors.address_line_2}
                helperText={errors.address_line_2}
                sx={{ gridColumn: { sm: 'span 3' } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Description sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="City"
                value={form.city}
                onChange={e => setForm({ ...form, city: e.target.value })}
                required
                disabled={viewOnly}
                error={!!errors.city}
                helperText={errors.city}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />
              <TextField
                fullWidth
                label="Pincode"
                value={form.pincode}
                onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                inputProps={{ maxLength: 6 }}
                required
                disabled={viewOnly}
                error={!!errors.pincode}
                helperText={errors.pincode}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Numbers sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              />
              <TextField
                select
                fullWidth
                label="State"
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                required
                disabled={viewOnly}
                error={!!errors.state}
                helperText={errors.state}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PinDrop sx={{ color: '#94A3B8' }} /></InputAdornment>,
                }}
              >
                {STATES_LIST.map((stateOption) => (
                  <MenuItem key={stateOption} value={stateOption}>
                    {stateOption}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={<Switch checked={form.is_active !== false} onChange={e => setForm({ ...form, is_active: e.target.checked })} disabled={viewOnly} color="success" />}
                label="Active Status"
                sx={{ gridColumn: { xs: '1fr', sm: 'span 3' }, ml: 1, mt: 1 }}
              />
              {form.status === 'Rejected' && form.rejection_remarks && (
                <Alert severity="error" sx={{ gridColumn: { xs: '1fr', sm: 'span 3' }, mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Rejected:</Typography>
                  {form.rejection_remarks}
                </Alert>
              )}
            </Box>
          )}
          {dialogTab === 1 && (
            <Box sx={{ pt: 2 }}>
              {vendorHistory.map((h, i) => (
                <Box key={h.id} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: h.action.includes('Reject') ? 'error.main' : (h.action.includes('Approve') ? 'success.main' : 'primary.main'), mt: 0.5 }} />
                    {i < vendorHistory.length - 1 && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.5 }} />}
                  </Box>
                  <Box sx={{ flex: 1, pb: i < vendorHistory.length - 1 ? 2 : 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{h.action}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      by {h.action_by_name} on {new Date(h.action_at).toLocaleString()}
                    </Typography>
                    {h.remarks && <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 1 }}>"{h.remarks}"</Typography>}
                    {h.changes && Object.keys(h.changes).length > 0 && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Changes Made:</Typography>
                        {Object.keys(h.changes).map(k => (
                          <Box key={k} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 80, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</Typography>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'error.main', textDecoration: 'line-through', mr: 1 }}>
                                {JSON.stringify(h.changes[k].old)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                                {JSON.stringify(h.changes[k].new)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
              {vendorHistory.length === 0 && <Typography variant="body2" color="text.secondary">No history available.</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          {viewOnly && form.can_user_approve && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={(e) => { setDialog(false); handleApprove(editing, e); }}
                sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={(e) => { setDialog(false); setRejectingVendor(editing); setRejectDialog(true); }}
                sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
              >
                Reject
              </Button>
            </>
          )}
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={viewOnly}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              textTransform: 'none',
              display: viewOnly ? 'none' : 'inline-flex'
            }}
          >
            {editing ? 'Update Vendor' : 'Save Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Vendor</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Rejection Remarks"
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            sx={{ mt: 1 }}
            required
            placeholder="Please provide a reason for rejecting this vendor..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRejectDialog(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={!rejectRemarks.trim()}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
