import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Paper, Grid, IconButton, Tooltip,
  Collapse, TableSortLabel, TextField, InputAdornment
} from '@mui/material';
import { ExpandMore, ExpandLess, Search, Receipt, People, CurrencyRupee } from '@mui/icons-material';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

export default function VendorPendingInvoicesReport() {
  const [report, setReport] = useState({ data: [], summary: {} });
  const [expandedVendor, setExpandedVendor] = useState(null);
  const [vendorInvoices, setVendorInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'vendor_name', direction: 'asc' });
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    api.get('/api/finance/reports/vendor-pending-invoices')
      .then(r => setReport(r.data))
      .catch(() => {});
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleExpand = async (vendorId) => {
    if (expandedVendor === vendorId) {
      setExpandedVendor(null);
      return;
    }
    setLoadingDetails(true);
    try {
      const r = await api.get(`/api/finance/reports/vendor-pending-invoices/details?vendor_id=${vendorId}&report_type=pending_invoices`);
      setVendorInvoices(r.data);
      setExpandedVendor(vendorId);
    } catch { }
    setLoadingDetails(false);
  };

  const filteredData = report.data
    .filter(v => {
      if (!search) return true;
      const s = search.toLowerCase();
      return v.vendor_name?.toLowerCase().includes(s) || v.vendor_code?.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      let valA = a[sortConfig.key]; let valB = b[sortConfig.key];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const summary = report.summary || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Vendor-wise Pending Invoices</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Total count and value of approved invoices pending payment per vendor</Typography>
        </Box>
        {report.generated_at && (
          <Typography variant="caption" sx={{ color: '#94A3B8', alignSelf: 'flex-end' }}>Generated: {report.generated_at}</Typography>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #93C5FD' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <People sx={{ color: '#2563EB', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Total Vendors</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E3A8A' }}>{summary.total_vendors || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '1px solid #FDBA74' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Receipt sx={{ color: '#EA580C', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Total Invoices</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#9A3412' }}>{summary.total_invoices || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #86EFAC' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CurrencyRupee sx={{ color: '#16A34A', fontSize: 32 }} />
              <Box>
                <Typography variant="caption" color="textSecondary">Total Value</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#166534' }}>₹{(summary.total_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3, p: 2 }}>
        <TextField
          placeholder="Search vendors..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
        />
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell><TableSortLabel active={sortConfig.key === 'vendor_code'} direction={sortConfig.key === 'vendor_code' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_code')}>Vendor Code</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor Name</TableSortLabel></TableCell>
                <TableCell align="right"><TableSortLabel active={sortConfig.key === 'invoice_count'} direction={sortConfig.key === 'invoice_count' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_count')}>Pending Invoices</TableSortLabel></TableCell>
                <TableCell align="right"><TableSortLabel active={sortConfig.key === 'total_value'} direction={sortConfig.key === 'total_value' ? sortConfig.direction : 'asc'} onClick={() => handleSort('total_value')}>Total Value (₹)</TableSortLabel></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map(v => (
                <React.Fragment key={v.vendor_id}>
                  <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => handleExpand(v.vendor_id)}>
                    <TableCell>
                      <IconButton size="small">
                        {expandedVendor === v.vendor_id ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#2563EB' }}>{v.vendor_code}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{v.vendor_name}</TableCell>
                    <TableCell align="right">
                      <Chip label={v.invoice_count} size="small" color="warning" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>₹{v.total_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0, border: expandedVendor === v.vendor_id ? undefined : 'none' }}>
                      <Collapse in={expandedVendor === v.vendor_id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, background: '#F8FAFC' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Ref #</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Invoice No.</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Amount (₹)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {vendorInvoices.map(inv => (
                                <TableRow key={inv.id}>
                                  <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>{inv.code}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{inv.invoice_number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(inv.invoice_date)}</TableCell>
                                  <TableCell><Chip label={inv.status} size="small" sx={{ fontSize: '0.65rem' }} /></TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>₹{inv.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                              ))}
                              {vendorInvoices.length === 0 && (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 2, color: '#94A3B8', fontSize: '0.75rem' }}>No invoices found</TableCell></TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              {filteredData.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748B' }}>No pending invoices found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
