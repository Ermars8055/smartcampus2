import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Chip, Paper, Grid, IconButton, Tooltip, Button,
  Collapse, TableSortLabel, TextField, InputAdornment
} from '@mui/material';
import { ExpandMore, ExpandLess, Search, Receipt, People, CurrencyRupee, Print } from '@mui/icons-material';
import api from '../services/api';
import { formatDate } from '../utils/dateUtils';

export default function VendorPendingInvoicesReport() {
  const [report, setReport] = useState({ data: [], summary: {} });
  const [vendorInvoices, setVendorInvoices] = useState({});
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'vendor_name', direction: 'asc' });
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    api.get('/api/finance/reports/vendor-pending-invoices')
      .then(async r => {
        setReport(r.data);
        const map = {};
        await Promise.all((r.data.data || []).map(async v => {
          try {
            const res = await api.get(`/api/finance/reports/vendor-pending-invoices/details?vendor_id=${v.vendor_id}&report_type=pending_invoices`);
            map[v.vendor_id] = res.data;
          } catch {
            map[v.vendor_id] = [];
          }
        }));
        setVendorInvoices(map);
      })
      .catch(() => {});
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
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
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
          {report.generated_at && (
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>Generated: {report.generated_at}</Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            className="no-print"
          >Print / PDF</Button>
        </Box>
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
      <Card sx={{ mb: 3, p: 2 }} className="no-print">
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
                <TableCell><TableSortLabel active={sortConfig.key === 'vendor_code'} direction={sortConfig.key === 'vendor_code' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_code')}>Vendor Code</TableSortLabel></TableCell>
                <TableCell><TableSortLabel active={sortConfig.key === 'vendor_name'} direction={sortConfig.key === 'vendor_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('vendor_name')}>Vendor Name</TableSortLabel></TableCell>
                <TableCell align="right"><TableSortLabel active={sortConfig.key === 'invoice_count'} direction={sortConfig.key === 'invoice_count' ? sortConfig.direction : 'asc'} onClick={() => handleSort('invoice_count')}>Pending Invoices</TableSortLabel></TableCell>
                <TableCell align="right"><TableSortLabel active={sortConfig.key === 'total_value'} direction={sortConfig.key === 'total_value' ? sortConfig.direction : 'asc'} onClick={() => handleSort('total_value')}>Total Value (₹)</TableSortLabel></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map(v => (
                <React.Fragment key={v.vendor_id}>
                  <TableRow sx={{ background: '#F1F5F9' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#2563EB', py: 1.5 }}>{v.vendor_code}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>{v.vendor_name}</TableCell>
                    <TableCell align="right">
                      <Chip label={v.invoice_count} size="small" color="warning" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>₹{v.total_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ p: 0, pb: 2, borderBottom: '2px solid #E2E8F0' }}>
                        <Box sx={{ p: 2, pt: 1, background: '#FFFFFF' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748B' }}>Ref #</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748B' }}>Invoice No.</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748B' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748B' }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748B' }}>Amount (₹)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(vendorInvoices[v.vendor_id] || []).map(inv => (
                                <TableRow key={inv.id}>
                                  <TableCell sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>{inv.code}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>{inv.invoice_number}</TableCell>
                                  <TableCell sx={{ fontSize: '0.75rem', color: '#475569' }}>{formatDate(inv.invoice_date)}</TableCell>
                                  <TableCell><Chip label={inv.status} size="small" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                                  <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>₹{inv.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                              ))}
                              {(!vendorInvoices[v.vendor_id] || vendorInvoices[v.vendor_id].length === 0) && (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 2, color: '#94A3B8', fontSize: '0.75rem' }}>No invoices found</TableCell></TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Box>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              {filteredData.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748B' }}>No pending invoices found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
