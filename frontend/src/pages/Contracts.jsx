import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip,
  Tabs, Tab, Alert, useTheme, useMediaQuery, MenuItem, TableSortLabel, Grid, CircularProgress, Paper
} from '@mui/material';
import {
  Add, Edit, Search, Description, CheckCircle, Cancel, RemoveRedEye
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { formatDate } from '../utils/dateUtils';

export default function Contracts() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('All');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectingContract, setRejectingContract] = useState(null);
  
  const [approveDialog, setApproveDialog] = useState(false);
  const [contractToApprove, setContractToApprove] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const statusColor = {
    'Draft': 'default', 
    'Submitted': 'info', 
    'Approved': 'success', 
    'Active': 'success', 
    'Inactive': 'default', 
    'Closed': 'success', 
    'Rejected': 'error', 
    'Expired': 'default'
  };

  const [sortConfig, setSortConfig] = useState({ key: 'contract_number', direction: 'desc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const [institutions, setInstitutions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/institutions'),
      api.get('/api/departments')
    ]).then(([iRes, dRes]) => {
      setInstitutions(iRes.data);
      setAllDepartments(dRes.data);
    }).catch(err => console.error("Error loading filters", err));
  }, []);

  useEffect(() => {
    if (selectedInstitution) {
      setDepartments(allDepartments.filter(d => d.institution_id === selectedInstitution));
    } else {
      setDepartments([]);
    }
  }, [selectedInstitution, allDepartments]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = () => {
    api.get('/api/contracts').then(r => {
      let data = [...r.data];
      if (search) {
        data = data.filter(c => 
          c.contract_number.toLowerCase().includes(search.toLowerCase()) ||
          c.vendor_name?.toLowerCase().includes(search.toLowerCase())
        );
      }
      if (selectedInstitution) {
        data = data.filter(c => c.institution_id === selectedInstitution);
      }
      if (selectedDepartment) {
        data = data.filter(c => c.department_id === selectedDepartment);
      }
      setContracts(data);
    }).catch(err => {
      showMessage(err.response?.data?.detail || 'Error loading contracts', 'Error', 'error');
    });
  };

  useEffect(() => {
    load();
  }, [search, selectedInstitution, selectedDepartment]);

  const handleOpenApproveDialog = async (id, e) => {
    e.stopPropagation();
    setApproveDialog(true);
    setLoadingDetails(true);
    setContractToApprove(null);
    try {
      const res = await api.get(`/api/contracts/${id}`);
      setContractToApprove(res.data);
    } catch (err) {
      showMessage('Error loading contract details', 'Error', 'error');
      setApproveDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenRejectFromApprove = () => {
    if (contractToApprove) {
      setRejectingContract(contractToApprove.id);
      setApproveDialog(false);
      setRejectDialog(true);
    }
  };

  const handleConfirmApprove = async () => {
    if (!contractToApprove) return;
    try {
      const res = await api.post(`/api/contracts/${contractToApprove.id}/approve`);
      showMessage(res.data.message || 'Contract approved successfully', 'Success', 'success');
      setApproveDialog(false);
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error approving contract', 'Error', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectRemarks.trim()) return;
    try {
      await api.post(`/api/contracts/${rejectingContract}/reject`, { remarks: rejectRemarks });
      showMessage('Contract rejected', 'Warning', 'warning');
      setRejectDialog(false);
      setRejectRemarks('');
      setRejectingContract(null);
      load();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error rejecting contract', 'Error', 'error');
    }
  };

  const pendingApprovals = contracts.filter(c => c.status === 'Submitted'); // Assuming users see all pending approvals if they can view it. Access control is handled backend

  const filteredContracts = contracts.filter(c => {
    if (tabValue === 'All') return true;
    if (tabValue === 'Inactive') return c.status === 'Inactive' || c.status === 'Expired';
    return c.status === tabValue;
  }).sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    // Handle potential null/undefined values safely
    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Contracts Management</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{contracts.length} total contracts</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => navigate('/contracts/new')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Create Contract
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, pb: 0, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search contracts by Number or Vendor"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 0.8, minWidth: 280, maxWidth: 400 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} />,
              sx: { borderRadius: 2 }
            }}
          />
          <TextField
            select
            size="small"
            label="Institution"
            value={selectedInstitution}
            onChange={e => { setSelectedInstitution(e.target.value); setSelectedDepartment(''); }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value=""><em>All Institutions</em></MenuItem>
            {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            size="small"
            label="Department"
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            disabled={!selectedInstitution}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value=""><em>All Departments</em></MenuItem>
            {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
        </Box>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          {['Draft', 'Submitted', 'Approved', 'Active', 'Inactive', 'Closed', 'Rejected', 'All'].map(s => {
            const count = s === 'All' ? contracts.length : contracts.filter(c => {
              if (s === 'Inactive') return c.status === 'Inactive' || c.status === 'Expired';
              return c.status === s;
            }).length;
            if (s !== 'All' && count === 0 && !['Draft', 'Submitted', 'Approved', 'Rejected', 'Active', 'Inactive'].includes(s)) return null;
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

      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'contract_number'} direction={sortConfig.key === 'contract_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('contract_number')}>
                    CONTRACT NO
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'contract_type'} direction={sortConfig.key === 'contract_type' ? sortConfig.direction : 'asc'} onClick={() => handleSort('contract_type')}>
                    TYPE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>
                    VENDOR
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'start_date'} direction={sortConfig.key === 'start_date' ? sortConfig.direction : 'asc'} onClick={() => handleSort('start_date')}>
                    FROM DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'end_date'} direction={sortConfig.key === 'end_date' ? sortConfig.direction : 'asc'} onClick={() => handleSort('end_date')}>
                    TO DATE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'contract_value'} direction={sortConfig.key === 'contract_value' ? sortConfig.direction : 'asc'} onClick={() => handleSort('contract_value')}>
                    VALUE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>
                  <TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>
                    STATUS
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>LVL</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', py: 2 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                    <Typography variant="body2">No contracts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {filteredContracts.map(c => (
                <TableRow
                  key={c.id}
                  hover
                  onClick={() => navigate(`/contracts/edit/${c.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{c.contract_number}</TableCell>
                  <TableCell>
                    <Chip 
                      label={c.contract_type} 
                      size="small" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.7rem',
                        bgcolor: c.contract_type === 'RC' ? '#E0F2FE' : (c.contract_type === 'AMC' ? '#FEF3C7' : '#F3E8FF'),
                        color: c.contract_type === 'RC' ? '#0369A1' : (c.contract_type === 'AMC' ? '#B45309' : '#7E22CE')
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.vendor_name || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {formatDate(c.start_date)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {formatDate(c.end_date)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    ₹{c.contract_value?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={c.status}
                      size="small"
                      color={statusColor[c.status] || 'default'}
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Chip label={`L${c.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={c.status !== 'Submitted' ? "Only submitted contracts can be approved" : (c.can_user_approve ? "Approve" : "Not authorized to approve at this level")}>
                        <span>
                          <IconButton size="small" color="success" disabled={c.status !== 'Submitted' || !c.can_user_approve} onClick={(e) => handleOpenApproveDialog(c.id, e)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={c.status !== 'Submitted' ? "Only submitted contracts can be rejected" : (c.can_user_approve ? "Reject" : "Not authorized to reject at this level")}>
                        <span>
                          <IconButton size="small" color="error" disabled={c.status !== 'Submitted' || !c.can_user_approve} onClick={(e) => { e.stopPropagation(); setRejectingContract(c.id); setRejectDialog(true); }} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={c.status === 'Active' || c.status === 'Closed' || c.current_approval_level > 1 || c.status === 'Approved' || c.status === 'Rejected' ? "View Details" : "Edit Contract"}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/contracts/edit/${c.id}`); }} sx={{ color: '#64748B' }}>
                          {c.status === 'Active' || c.status === 'Closed' || c.current_approval_level > 1 || c.status === 'Approved' || c.status === 'Rejected' ? <RemoveRedEye fontSize="small" /> : <Edit color="primary" fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reject Contract</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#475569' }}>
            Please provide a reason for rejecting this contract. This will be recorded.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Remarks"
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setRejectDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error" 
            disabled={!rejectRemarks.trim()}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', px: 3 }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {contractToApprove ? `Review Contract Details - ${contractToApprove.contract_number}` : 'Review Contract Details'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : contractToApprove ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Institution</Typography>
                  <Typography variant="body2" fontWeight="600">{institutions.find(i => i.id === contractToApprove.institution_id)?.name || contractToApprove.institution_id || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body2" fontWeight="600">{allDepartments.find(d => d.id === contractToApprove.department_id)?.name || contractToApprove.department_id || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Contract No</Typography>
                  <Typography variant="body2" fontWeight="600">{contractToApprove.contract_number}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Vendor</Typography>
                  <Typography variant="body2" fontWeight="600">{contractToApprove.vendor_name || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight="600">{contractToApprove.contract_type}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Total Value</Typography>
                  <Typography variant="body2" fontWeight="600">₹{contractToApprove.contract_value?.toLocaleString() || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Start Date</Typography>
                  <Typography variant="body2" fontWeight="600">{formatDate(contractToApprove.start_date)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">End Date</Typography>
                  <Typography variant="body2" fontWeight="600">{formatDate(contractToApprove.end_date)}</Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Contract Items ({contractToApprove.contract_type})</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      {contractToApprove.contract_type === 'RC' ? (
                        <>
                          <TableCell sx={{ fontWeight: 700 }}>MATERIAL</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>RATE (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>GST %</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>MAX QTY</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>LEAD TIME (DAYS)</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ fontWeight: 700 }}>EQUIPMENT</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>COVERED</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>EXCLUDED</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>RATE (₹)</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contractToApprove.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        {contractToApprove.contract_type === 'RC' ? (
                          <>
                            <TableCell>{item.material?.name || item.material_id}</TableCell>
                            <TableCell>{item.uom || '-'}</TableCell>
                            <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                            <TableCell align="right">{item.gst || 0}%</TableCell>
                            <TableCell align="right">{item.contract_quantity || '-'}</TableCell>
                            <TableCell align="right">{item.delivery_lead_time || '-'}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{item.equipment?.material_name || item.equipment_id}</TableCell>
                            <TableCell>{item.covered_components || '-'}</TableCell>
                            <TableCell>{item.excluded_components || '-'}</TableCell>
                            <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {(!contractToApprove.items || contractToApprove.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={contractToApprove.contract_type === 'RC' ? 6 : 4} align="center" sx={{ py: 2, color: 'text.secondary' }}>No items found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Terms & Conditions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToApprove.payment_terms || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Exclusions</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToApprove.exclusions || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">SLA Details</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToApprove.sla_details || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Renewal Terms</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToApprove.renewal_terms || '-'}</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">Failed to load contract details.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 1 }}>
          <Button onClick={() => setApproveDialog(false)} sx={{ color: '#64748B' }}>Close</Button>
          {contractToApprove && (
            <>
              <Button 
                onClick={handleConfirmApprove} 
                variant="contained" 
                color="success" 
                disabled={loadingDetails}
                startIcon={<CheckCircle />}
              >
                Approve
              </Button>
              <Button 
                onClick={handleOpenRejectFromApprove} 
                variant="contained" 
                color="error" 
                disabled={loadingDetails}
                startIcon={<Cancel />}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
