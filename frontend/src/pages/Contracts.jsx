import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip,
  Tabs, Tab, Alert, useTheme, useMediaQuery, MenuItem, TableSortLabel, Grid, CircularProgress, Paper,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Add, Edit, Search, Description, CheckCircle, Cancel, RemoveRedEye, Print
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { useConfig } from '../context/ConfigContext';
import { formatDate } from '../utils/dateUtils';
import { computeGstSplit } from '../utils/gstCalculations';
import { numberToWords } from '../utils/numberUtils';

export default function Contracts() {
  const { showMessage } = useMessage();
  const { tenantConfig } = useConfig();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [search, setSearch] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isContractActive = (c) => {
    if (c.status === 'Active') return true;
    if (c.status !== 'Approved') return false;
    if (!c.start_date || !c.end_date) return false;
    const start = new Date(c.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(c.end_date);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  };

  const isContractInactive = (c) => {
    if (c.status === 'Inactive' || c.status === 'Expired') return true;
    if (c.status !== 'Approved') return false;
    if (!c.start_date || !c.end_date) return false;
    const end = new Date(c.end_date);
    end.setHours(23, 59, 59, 999);
    return today > end;
  };

  const [tabValue, setTabValue] = useState('All');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [rejectingContract, setRejectingContract] = useState(null);
  
  const [viewDialog, setViewDialog] = useState(false);
  const [contractToView, setContractToView] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const statusColor = {
    'Draft': 'default', 
    'Submitted': 'info', 
    'Approved': 'success', 
    'Active': 'success', 
    'Inactive': 'default', 
    'Closed': 'default', 
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

  const handleOpenViewDialog = async (c, e) => {
    if (e) e.stopPropagation();
    setViewDialog(true);
    setLoadingDetails(true);
    setContractToView(null);
    try {
      const res = await api.get(`/api/contracts/${c.id}`);
      let vendorRes = null;
      if (res.data.vendor_id) {
        vendorRes = await api.get(`/api/vendors/${res.data.vendor_id}`).catch(() => null);
      }
      setContractToView({ ...res.data, can_user_approve: c.can_user_approve, vendorDetails: vendorRes?.data });
    } catch (err) {
      showMessage('Error loading contract details', 'Error', 'error');
      setViewDialog(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenRejectFromApprove = () => {
    if (contractToView) {
      setRejectingContract(contractToView.id);
      setViewDialog(false);
      setRejectDialog(true);
    }
  };

  const handleConfirmApprove = async () => {
    if (!contractToView) return;
    try {
      const res = await api.post(`/api/contracts/${contractToView.id}/approve`);
      showMessage(res.data.message || 'Contract approved successfully', 'Success', 'success');
      setViewDialog(false);
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

  const handlePrintContract = async () => {
    if (!contractToView) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('Loading document...');
    
    let vendor = null;
    if (contractToView.vendor_id) {
      try {
        const vRes = await api.get(`/api/vendors/${contractToView.vendor_id}`);
        vendor = vRes.data;
      } catch(e) {}
    }

    const institutionName = institutions.find(i => i.id === contractToView.institution_id)?.name || contractToView.institution_id || 'EAST POINT COLLEGE OF MEDICAL SCIENCES & RESEARCH CENTER';
    const docTitle = contractToView.contract_type === 'RC' 
      ? 'CONTRACT AGREEMENT (RC)' 
      : `WORK ORDER for ${contractToView.contract_type}`;
    
    let totalNet = 0;
    const itemsHtml = contractToView.items?.map((item, idx) => {
      const split = computeGstSplit(item.gst || 0, vendor?.state, tenantConfig?.base_state, tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent);
      const qty = item.contract_quantity || 1;
      const rate = item.rate || 0;
      const disc = item.discount_percent || 0;
      const amt = (rate * qty) * (1 - disc / 100);
      totalNet += amt;
      
      const itemName = contractToView.contract_type === 'RC' 
        ? (item.material?.name || item.material_id)
        : (item.material_name || item.equipment_id);

      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align: left;">${itemName}</td>
          <td>${contractToView.contract_type === 'RC' ? '-' : (item.equipment_serial || 'NA')}</td>
          <td style="text-align: right;">${rate.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          <td style="text-align: right;">${disc.toLocaleString(undefined, {minimumFractionDigits: 2})}%</td>
          <td style="text-align: right;">${(split.cgst_percentage || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}%<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align: right;">${(split.sgst_percentage || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}%<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align: right;">${(split.igst_percentage || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}%<br/><span style="font-size: 8px;">${item.is_gst_inclusive ? '(Incl)' : '(Excl)'}</span></td>
          <td style="text-align: right;">${amt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        </tr>
      `;
    }).join('') || '<tr><td colSpan="10" style="text-align: center;">No items found</td></tr>';

    const html = `
      <html>
        <head>
          <title>${docTitle} - ${contractToView.contract_number}</title>
          <style>
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; color: #000; background-color: #f8fafc; }
            .print-wrapper { max-width: 800px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px; }
            @media print {
              body { background-color: white; padding: 0; }
              .print-wrapper { max-width: 100%; margin: 0; padding: 0; box-shadow: none; border-radius: 0; }
            }
            .action-bar { display: flex; justify-content: flex-end; gap: 12px; margin-bottom: 20px; }
            .btn { padding: 8px 20px; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; border: none; display: flex; align-items: center; gap: 6px; }
            .btn-print { background: #2563EB; color: white; }
            .btn-close { background: #e2e8f0; color: #334155; }
            .header-container { text-align: center; margin-bottom: 15px; }
            .doc-title { font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
            .inst-name { font-size: 14px; font-weight: bold; }
            
            .address-table { width: 100%; border: none; margin-bottom: 15px; font-size: 11px; }
            .address-table td { vertical-align: top; padding: 4px; }
            
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
            .items-table th, .items-table td { border: 1px solid #000; padding: 4px; text-align: center; }
            .items-table th { font-weight: bold; background-color: #f1f5f9; }
            
            .summary-table { width: 100%; border: none; margin-bottom: 20px; font-size: 11px; }
            .summary-table td { padding: 4px; }
            
            .terms-title { font-weight: bold; margin-bottom: 5px; text-decoration: underline; }
            .terms-list { margin-bottom: 20px; line-height: 1.5; }
            
            .signature-table { width: 100%; margin-top: 50px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            <div class="action-bar no-print">
              <button class="btn btn-close" onclick="window.close()">Close</button>
              <button class="btn btn-print" onclick="window.print()">Print</button>
            </div>
            
            <div class="header-container">
              <div class="inst-name">${institutionName}</div>
              <div class="doc-title">${docTitle}</div>
            </div>
            
            <table class="address-table">
              <tr>
                <td style="width: 60%;">
                  <b>${vendor?.name || contractToView.vendor_name || '-'}</b><br/>
                  ${vendor?.address || ''}<br/>
                  ${vendor?.city || ''}, ${vendor?.state || ''}<br/>
                  PINCODE ${vendor?.pincode || ''}<br/>
                  Phone No : ${vendor?.phone || '-'}<br/>
                  E-MAIL : ${vendor?.email || '-'}
                </td>
                <td style="width: 40%;">
                  <table style="width: 100%">
                    <tr><td style="width: 40%">WO Number</td><td>: <b>${contractToView.contract_number}</b></td></tr>
                    <tr><td>WO Date</td><td>: ${formatDate(contractToView.start_date)}</td></tr>
                    <tr><td>GSTIN</td><td>: ${vendor?.gstin || '-'}</td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <div>Dear Sir/Madam,</div>
            <div style="margin-bottom: 10px;">We are pleased to place an order for the following items, terms & conditions mentioned below.</div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th style="text-align: left;">Item Description</th>
                  <th>Serial No.</th>
                  <th style="text-align: right;">RATE</th>
                  <th style="text-align: right;">Disc. %</th>
                  <th style="text-align: right;">CGST %</th>
                  <th style="text-align: right;">SGST/UTGST %</th>
                  <th style="text-align: right;">IGST %</th>
                  <th style="text-align: right;">Item Amt.</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <table class="summary-table">
              <tr>
                <td style="width: 70%; vertical-align: top;" rowspan="3">
                  <div><b>Amount in Words:</b><br/>${numberToWords(totalNet)}</div>
                </td>
                <td style="text-align: right; width: 15%;"><b>Total Amount</b></td>
                <td style="text-align: right; width: 15%;">${totalNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td style="text-align: right;"><b>Round Off</b></td>
                <td style="text-align: right;">0.00</td>
              </tr>
              <tr>
                <td style="text-align: right;"><b>Total Net Amount</b></td>
                <td style="text-align: right;">${totalNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            </table>
            
            <div class="terms-title">TERMS AND CONDITIONS:</div>
            <div class="terms-list">
              01. Bill/Invoices in the name of ${institutionName}<br/>
              02. Period of agreement: ${formatDate(contractToView.start_date)} to ${formatDate(contractToView.end_date)}<br/>
              03. Payment Terms: ${contractToView.payment_terms || '-'}<br/>
              04. GST included<br/>
              ${contractToView.contract_type !== 'RC' ? `05. Inclusions: Spare Parts (${contractToView.spare_parts_included ? 'Yes' : 'No'}), Consumables (${contractToView.consumables_included ? 'Yes' : 'No'})<br/>` : ''}
              ${contractToView.contract_type !== 'RC' ? `06. Exclusions: ${contractToView.exclusions || '-'}<br/>` : ''}
              ${contractToView.contract_type !== 'RC' ? `07. SLA Details: ${contractToView.sla_details || '-'}<br/>` : ''}
            </div>
            
            <table class="signature-table">
              <tr>
                <td style="width: 33%; text-align: left;">Prepared By</td>
                <td style="width: 33%;">CC: Manager Accounts</td>
                <td style="width: 33%; text-align: right;">For ${institutionName}<br/><br/><br/>Authorized Signatory</td>
              </tr>
            </table>
            
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const pendingApprovals = contracts.filter(c => c.status === 'Submitted'); // Assuming users see all pending approvals if they can view it. Access control is handled backend

  const filteredContracts = contracts.filter(c => {
    if (tabValue === 'All') return true;
    if (tabValue === 'Approved') return c.status === 'Approved' && isContractActive(c);
    if (tabValue === 'Upcoming') return c.status === 'Approved' && !isContractActive(c) && !isContractInactive(c);
    if (tabValue === 'Expired') return isContractInactive(c);
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
            <MenuItem value="">All Institutions</MenuItem>
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
            <MenuItem value="">All Departments</MenuItem>
            {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 1, borderColor: 'divider', pr: 2 }}>
          <Tabs
            value={['Draft', 'Submitted', 'Approved', 'Upcoming', 'Expired', 'Rejected', 'All'].includes(tabValue) ? tabValue : false}
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons={false}
          >
            {['Draft', 'Submitted', 'Approved', 'Upcoming', 'Expired', 'Rejected', 'All'].map(s => {
              const count = s === 'All' ? contracts.length : contracts.filter(c => {
                if (s === 'Approved') return c.status === 'Approved' && isContractActive(c);
                if (s === 'Upcoming') return c.status === 'Approved' && !isContractActive(c) && !isContractInactive(c);
                if (s === 'Expired') return isContractInactive(c);
                return c.status === s;
              }).length;
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
        </Box>
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
                  onClick={() => handleOpenViewDialog(c)}
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
                    {c.contract_type === 'RC' ? '-' : `₹${c.contract_value?.toLocaleString() || 0}`}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={isContractInactive(c) ? 'Expired' : (isContractActive(c) ? 'Approved' : (c.status === 'Approved' ? 'Upcoming' : c.status))}
                      size="small"
                      color={isContractInactive(c) ? 'default' : (isContractActive(c) ? statusColor['Approved'] : (c.status === 'Approved' ? 'info' : (statusColor[c.status] || 'default')))}
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Chip label={`L${c.current_approval_level || 1}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={!(c.status === 'Active' || c.status === 'Closed' || c.status === 'Expired' || c.current_approval_level > 1 || c.status === 'Approved' || c.status === 'Rejected') ? "Edit Contract" : "Contract cannot be edited"}>
                        <span>
                          <IconButton size="small" disabled={(c.status === 'Active' || c.status === 'Closed' || c.status === 'Expired' || c.current_approval_level > 1 || c.status === 'Approved' || c.status === 'Rejected')} onClick={(e) => { e.stopPropagation(); navigate(`/contracts/edit/${c.id}`); }} sx={{ color: '#64748B' }}>
                            <Edit color={(c.status === 'Active' || c.status === 'Closed' || c.status === 'Expired' || c.current_approval_level > 1 || c.status === 'Approved' || c.status === 'Rejected') ? 'inherit' : 'primary'} fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={c.status !== 'Submitted' ? "Only submitted contracts can be approved" : (c.can_user_approve ? "Approve" : "Not authorized to approve at this level")}>
                        <span>
                          <IconButton size="small" color="success" disabled={c.status !== 'Submitted' || !c.can_user_approve} onClick={(e) => handleOpenViewDialog(c, e)} sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
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

      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {contractToView ? `Review Contract Details - ${contractToView.contract_number}` : 'Review Contract Details'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : contractToView ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Institution</Typography>
                  <Typography variant="body2" fontWeight="600">{institutions.find(i => i.id === contractToView.institution_id)?.name || contractToView.institution_id || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Department</Typography>
                  <Typography variant="body2" fontWeight="600">{allDepartments.find(d => d.id === contractToView.department_id)?.name || contractToView.department_id || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Contract No</Typography>
                  <Typography variant="body2" fontWeight="600">{contractToView.contract_number}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Vendor</Typography>
                  <Typography variant="body2" fontWeight="600">{contractToView.vendor_name || '-'}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" fontWeight="600">{contractToView.contract_type}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Start Date</Typography>
                  <Typography variant="body2" fontWeight="600">{formatDate(contractToView.start_date)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">End Date</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="600">{formatDate(contractToView.end_date)}</Typography>
                    {(contractToView.status === 'Approved' || contractToView.status === 'Expired' || contractToView.status === 'Inactive' || contractToView.status === 'Active') && (
                      <Chip 
                        label={isContractInactive(contractToView) ? (contractToView.status === 'Inactive' ? 'Inactive' : 'Expired') : (isContractActive(contractToView) ? 'Active' : 'Upcoming')} 
                        size="small" 
                        color={isContractActive(contractToView) ? 'success' : (isContractInactive(contractToView) ? 'default' : 'info')} 
                        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} 
                      />
                    )}
                  </Box>
                </Grid>
                {contractToView.contract_type !== 'RC' && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total Value</Typography>
                    <Typography variant="body2" fontWeight="600">₹{contractToView.contract_value?.toLocaleString() || 0}</Typography>
                  </Grid>
                )}
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Contract Items ({contractToView.contract_type})</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      {contractToView.contract_type === 'RC' ? (
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
                          <TableCell sx={{ fontWeight: 700 }}>SERIAL NUMBER</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>RATE (₹)</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>DISC %</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>GST TYPE</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>CGST %</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>SGST %</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>IGST %</TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contractToView.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        {contractToView.contract_type === 'RC' ? (
                          <>
                            <TableCell>{item.material?.name || item.material_id}</TableCell>
                            <TableCell>{item.uom || '-'}</TableCell>
                            <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                            <TableCell align="right">{item.gst || 0}%</TableCell>
                            <TableCell align="right">{item.contract_quantity || '-'}</TableCell>
                            <TableCell align="right">{item.delivery_lead_time || '-'}</TableCell>
                          </>
                        ) : (
                          (() => {
                            const split = computeGstSplit(item.gst || 0, contractToView.vendorDetails?.state, tenantConfig?.base_state, tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent);
                            return (
                              <>
                                <TableCell>{item.material_name || item.equipment_id}</TableCell>
                                <TableCell>{item.equipment_serial || 'NA'}</TableCell>
                                <TableCell align="right">₹{item.rate?.toLocaleString()}</TableCell>
                                <TableCell align="right">{item.discount_percent || 0}%</TableCell>
                                <TableCell>{item.is_gst_inclusive ? 'Inclusive' : 'Exclusive'}</TableCell>
                                <TableCell align="right">{split.cgst_percentage !== undefined ? split.cgst_percentage : 0}%</TableCell>
                                <TableCell align="right">{split.sgst_percentage !== undefined ? split.sgst_percentage : 0}%</TableCell>
                                <TableCell align="right">{split.igst_percentage !== undefined ? split.igst_percentage : 0}%</TableCell>
                              </>
                            );
                          })()
                        )}
                      </TableRow>
                    ))}
                    {(!contractToView.items || contractToView.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={contractToView.contract_type === 'RC' ? 6 : 8} align="center" sx={{ py: 2, color: 'text.secondary' }}>No items found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Terms & Conditions</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToView.payment_terms || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Exclusions</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToView.exclusions || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">SLA Details</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToView.sla_details || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Renewal Terms</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{contractToView.renewal_terms || '-'}</Typography>
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
          {contractToView && (contractToView.status === 'Approved' || contractToView.status === 'Active') && (
            <Button onClick={handlePrintContract} variant="outlined" startIcon={<Print />}>Print Contract</Button>
          )}
          <Button onClick={() => setViewDialog(false)} sx={{ color: '#64748B' }}>Close</Button>
          {contractToView && contractToView.status === 'Submitted' && contractToView.can_user_approve && (
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
