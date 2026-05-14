import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Switch, CircularProgress, Chip, IconButton,
  TableSortLabel, Collapse, Tooltip
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh,
  KeyboardArrowDown, KeyboardArrowUp
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

const QUICK_RANGES = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 60 Days', days: 60 },
  { label: 'Last 90 Days', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
];

export default function RateAnalysisReport() {
  const [categories, setCategories] = useState([]);

  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [sortField, setSortField] = useState('material_code');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedRow, setExpandedRow] = useState(null);
  const [drillData, setDrillData] = useState(null);
  const [drillLoading, setDrillLoading] = useState(false);

  const [filters, setFilters] = useState({
    fromDate: dayjs().subtract(90, 'day'),
    toDate: dayjs(),
    categoryId: '', vendorId: '', warehouseId: '',
    search: '', includeTax: false, varianceType: 'amount'
  });

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/api/vendors').then(r => setVendors(r.data)).catch(() => {});
    api.get('/api/warehouses').then(r => setWarehouses(r.data)).catch(() => {});
  }, []);



  const setQuickRange = (days) => {
    setFilters(f => ({ ...f, fromDate: dayjs().subtract(days, 'day'), toDate: dayjs() }));
  };

  const fmt = (v) => v != null ? `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';

  const handleGenerate = async () => {
    if (!filters.fromDate || !filters.toDate) return alert('Select date range');
    if (filters.fromDate.isAfter(filters.toDate)) return alert('From Date cannot exceed To Date');
    setLoading(true);
    setExpandedRow(null);
    setDrillData(null);
    try {
      const params = {
        from_date: filters.fromDate.format('YYYY-MM-DD'),
        to_date: filters.toDate.format('YYYY-MM-DD'),
        include_tax: filters.includeTax,
        variance_type: filters.varianceType
      };
      if (filters.categoryId) params.category_id = filters.categoryId;

      if (filters.vendorId) params.vendor_id = filters.vendorId;
      if (filters.warehouseId) params.warehouse_id = filters.warehouseId;
      if (filters.search) params.search = filters.search;
      const res = await api.get('/api/reports/rate-analysis', { params });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ fromDate: dayjs().subtract(90, 'day'), toDate: dayjs(), categoryId: '', vendorId: '', warehouseId: '', search: '', includeTax: false, varianceType: 'amount' });
    setReportData(null); setExpandedRow(null); setDrillData(null);
  };

  const handleSort = (field) => {
    setSortDir(sortField === field && sortDir === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortedData = () => {
    if (!reportData?.data) return [];
    return [...reportData.data].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : (av - bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const handleDrillDown = async (matId) => {
    if (expandedRow === matId) { setExpandedRow(null); return; }
    setExpandedRow(matId);
    setDrillLoading(true);
    try {
      const params = {
        material_id: matId,
        from_date: filters.fromDate.format('YYYY-MM-DD'),
        to_date: filters.toDate.format('YYYY-MM-DD'),
        include_tax: filters.includeTax
      };
      if (filters.vendorId) params.vendor_id = filters.vendorId;
      if (filters.warehouseId) params.warehouse_id = filters.warehouseId;
      const res = await api.get('/api/reports/rate-analysis/drilldown', { params });
      setDrillData(res.data);
    } catch { setDrillData(null); } finally { setDrillLoading(false); }
  };

  const getVarianceColor = (row) => {
    if (row.variance_pct >= 20) return '#EA580C';
    if (row.variance_pct > 0) return '#D97706';
    return 'inherit';
  };

  const getRateColor = (rate, minR, maxR) => {
    if (rate === minR && minR !== maxR) return '#059669';
    if (rate === maxR && minR !== maxR) return '#DC2626';
    return 'inherit';
  };

  const handleExportExcel = () => {
    if (!reportData?.data?.length) return;
    const rows = reportData.data.map((r, i) => ({
      'S.No': i + 1, 'Material Code': r.material_code, 'Material Name': r.material_name,
      'Category': r.category_name, 'Min Rate': r.min_rate, 'Max Rate': r.max_rate,
      'Avg Rate': r.avg_rate,
      'Variance': filters.varianceType === 'percentage' ? `${r.variance_pct}%` : r.variance_amt,
      'GRN Txns': r.grn_txn_count
    }));
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, [
      ['MATERIAL RATE ANALYSIS REPORT'],
      [`Period: ${filters.fromDate.format('DD-MMM-YYYY')} to ${filters.toDate.format('DD-MMM-YYYY')}`],
      [`Tax: ${filters.includeTax ? 'Inclusive' : 'Exclusive'}`],
      [`Generated: ${reportData.generated_at}`], []
    ], { origin: 'A1' });
    XLSX.utils.sheet_add_json(ws, rows, { origin: 'A6' });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rate Analysis');
    XLSX.writeFile(wb, `Rate_Analysis_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData?.data?.length) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('MATERIAL RATE ANALYSIS REPORT', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Period: ${filters.fromDate.format('DD-MMM-YYYY')} to ${filters.toDate.format('DD-MMM-YYYY')} | Tax: ${filters.includeTax ? 'Inclusive' : 'Exclusive'} | Generated: ${reportData.generated_at}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const heads = [['S.No', 'Material Code', 'Material Name', 'Min Rate', 'Max Rate', 'Avg Rate', 'Variance', 'GRN Txns']];
    const body = reportData.data.map((r, i) => [
      i + 1, r.material_code, r.material_name,
      fmt(r.min_rate), fmt(r.max_rate), fmt(r.avg_rate),
      filters.varianceType === 'percentage' ? `${r.variance_pct}%` : fmt(r.variance_amt),
      r.grn_txn_count
    ]);
    autoTable(doc, {
      head: heads, body, startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
      columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'center' } }
    });
    doc.save(`Rate_Analysis_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  const sortedData = getSortedData();
  const colDefs = [
    { id: 'material_code', label: 'Material Code', align: 'left' },
    { id: 'material_name', label: 'Material Name', align: 'left' },
    { id: 'min_rate', label: 'Min Rate', align: 'right' },
    { id: 'max_rate', label: 'Max Rate', align: 'right' },
    { id: 'avg_rate', label: 'Avg Rate', align: 'right' },
    { id: 'variance', label: 'Variance', align: 'right' },
    { id: 'grn_txn_count', label: 'GRN Txns', align: 'center' },
  ];

  return (
    <Box>
      {/* Title */}
      <Box sx={{ textAlign: 'center', mb: 2, '@media print': { mb: 1 } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', letterSpacing: 1 }}>
          <Assessment sx={{ verticalAlign: 'middle', mr: 1, color: '#1E3A8A' }} />
          MATERIAL RATE ANALYSIS REPORT
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
          RATE ANALYSIS AS ON : {dayjs().format('DD-MMM-YYYY')}
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2.5, mb: 2, '@media print': { display: 'none' } }}>
        {/* Row 1: Quick Range */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mr: 1 }}>Quick Range:</Typography>
          {QUICK_RANGES.map(q => (
            <Chip key={q.days} label={q.label} size="small" variant="outlined" onClick={() => setQuickRange(q.days)}
              sx={{ cursor: 'pointer', '&:hover': { background: '#EFF6FF', borderColor: '#2563EB' } }} />
          ))}
        </Box>

        {/* Row 2: Date Range + Category / Subcategory / Vendor / Store */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <DatePicker label="From Date" value={filters.fromDate} onChange={d => setFilters({ ...filters, fromDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true, InputLabelProps: { shrink: true } } }} format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <DatePicker label="To Date" value={filters.toDate} onChange={d => setFilters({ ...filters, toDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true, InputLabelProps: { shrink: true } } }} format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Material Category</InputLabel>
              <Select value={filters.categoryId} label="Material Category" displayEmpty
                onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                sx={{ mt: 1 }}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Vendor</InputLabel>
              <Select value={filters.vendorId} label="Vendor" displayEmpty
                onChange={e => setFilters({ ...filters, vendorId: e.target.value })}
                sx={{ mt: 1 }}>
                <MenuItem value="">All Vendors</MenuItem>
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Row 3: Store + Search + Variance + Tax */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Store</InputLabel>
              <Select value={filters.warehouseId} label="Store" displayEmpty
                onChange={e => setFilters({ ...filters, warehouseId: e.target.value })}
                sx={{ mt: 1 }}>
                <MenuItem value="">All Stores</MenuItem>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField size="small" fullWidth label="Search Material" placeholder="Code or Name"
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Variance Type</InputLabel>
              <Select value={filters.varianceType} label="Variance Type" displayEmpty
                onChange={e => setFilters({ ...filters, varianceType: e.target.value })}
                sx={{ mt: 1 }}>
                <MenuItem value="amount">Amount (₹)</MenuItem>
                <MenuItem value="percentage">Percentage (%)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch size="small" checked={filters.includeTax} onChange={e => setFilters({ ...filters, includeTax: e.target.checked })} />}
              label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Include Tax</Typography>} />
          </Grid>
        </Grid>

        {/* Row 4: Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap', pt: 1, borderTop: '1px solid #F1F5F9' }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset}>Reset</Button>
          <Button variant="contained" startIcon={<Search />} onClick={handleGenerate} disabled={loading}>
            {loading ? <CircularProgress size={22} /> : 'Generate Report'}
          </Button>
          <Button variant="contained" color="success" startIcon={<FileDownload />} onClick={handleExportExcel} disabled={!reportData}>Excel</Button>
          <Button variant="contained" color="error" startIcon={<PictureAsPdf />} onClick={handleExportPDF} disabled={!reportData}>PDF</Button>
          <Button variant="contained" color="secondary" startIcon={<Print />} onClick={() => window.print()} disabled={!reportData}>Print</Button>
        </Box>
      </Card>

      {/* Print Header */}
      <Box sx={{ display: 'none', '@media print': { display: 'block', textAlign: 'center', mb: 2 } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>MATERIAL RATE ANALYSIS REPORT</Typography>
        <Typography variant="subtitle2">Period: {filters.fromDate?.format('DD-MMM-YYYY')} to {filters.toDate?.format('DD-MMM-YYYY')}</Typography>
      </Box>

      {/* Main Grid */}
      <Card sx={{ borderRadius: 1, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', '@media print': { maxHeight: 'none', overflow: 'visible' } }}>
          <Table size="small" stickyHeader sx={{ '& th, & td': { border: '1px solid #E2E8F0', fontSize: '0.82rem', py: 1, px: 1.5 } }}>
            <TableHead>
              <TableRow sx={{ '& th': { background: '#F1F5F9', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' } }}>
                <TableCell sx={{ width: 40 }} />
                {colDefs.map(col => (
                  <TableCell key={col.id} align={col.align}>
                    <TableSortLabel active={sortField === col.id} direction={sortField === col.id ? sortDir : 'asc'} onClick={() => handleSort(col.id)}>
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>}
              {!loading && sortedData.map(row => (
                <Box component="tbody" key={row.material_id}>
                  <TableRow hover sx={{ cursor: 'pointer', '&:hover td': { background: '#F8FAFC' } }} onClick={() => handleDrillDown(row.material_id)}>
                    <TableCell sx={{ width: 40, textAlign: 'center' }}>
                      <IconButton size="small">{expandedRow === row.material_id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}</IconButton>
                    </TableCell>
                    <TableCell sx={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>{row.material_code}</TableCell>
                    <TableCell>{row.material_name}</TableCell>
                    <TableCell align="right" sx={{ color: '#059669', fontWeight: 500 }}>{fmt(row.min_rate)}</TableCell>
                    <TableCell align="right" sx={{ color: '#DC2626', fontWeight: 500 }}>{fmt(row.max_rate)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.avg_rate)}</TableCell>
                    <TableCell align="right" sx={{ color: getVarianceColor(row), fontWeight: 600 }}>
                      {filters.varianceType === 'percentage' ? `${row.variance_pct}%` : fmt(row.variance_amt)}
                      {row.variance_pct >= 20 && <Typography component="span" sx={{ ml: 0.5, fontSize: '0.7rem', color: '#EA580C' }}>⚠</Typography>}
                    </TableCell>
                    <TableCell align="center"><Chip label={row.grn_txn_count} size="small" sx={{ fontWeight: 600, minWidth: 32 }} /></TableCell>
                  </TableRow>
                  {/* Drill-down row */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, borderBottom: expandedRow === row.material_id ? '2px solid #2563EB' : 'none' }}>
                      <Collapse in={expandedRow === row.material_id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, background: '#F8FAFC' }}>
                          {drillLoading ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} /></Box>
                          ) : drillData ? (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1E293B' }}>
                                {drillData.material.code} — {drillData.material.name} | GST: {drillData.material.gst_rate}%
                              </Typography>
                              {/* Vendor Summary */}
                              {drillData.vendor_summary.length > 0 && (
                                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                  {drillData.vendor_summary.map(vs => (
                                    <Card key={vs.vendor_id} sx={{ p: 1.5, minWidth: 180, border: '1px solid #E2E8F0', borderRadius: 2 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E3A8A', display: 'block' }}>{vs.vendor_name}</Typography>
                                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mt: 0.5, fontSize: '0.75rem' }}>
                                        <Typography variant="caption">Min: <b style={{ color: '#059669' }}>{fmt(vs.min_rate)}</b></Typography>
                                        <Typography variant="caption">Max: <b style={{ color: '#DC2626' }}>{fmt(vs.max_rate)}</b></Typography>
                                        <Typography variant="caption">Avg: <b>{fmt(vs.avg_rate)}</b></Typography>
                                        <Typography variant="caption">Latest: <b style={{ color: '#2563EB' }}>{fmt(vs.latest_rate)}</b></Typography>
                                      </Box>
                                      <Typography variant="caption" sx={{ color: '#64748B' }}>{vs.txn_count} transaction(s)</Typography>
                                    </Card>
                                  ))}
                                </Box>
                              )}
                              {/* Transaction Table */}
                              <TableContainer sx={{ maxHeight: 350 }}>
                                <Table size="small" sx={{ '& th, & td': { fontSize: '0.78rem', border: '1px solid #E2E8F0', py: 0.5, px: 1 } }}>
                                  <TableHead>
                                    <TableRow sx={{ '& th': { background: '#EFF6FF', fontWeight: 600, whiteSpace: 'nowrap' } }}>
                                      <TableCell>GRN No</TableCell><TableCell>GRN Date</TableCell><TableCell>Vendor</TableCell>
                                      <TableCell align="right">Qty</TableCell><TableCell align="right">Rate</TableCell>
                                      <TableCell align="right">Tax%</TableCell><TableCell align="right">Tax Amt</TableCell>
                                      <TableCell align="right">Net Rate</TableCell><TableCell align="right">Total</TableCell>
                                      <TableCell>Invoice</TableCell><TableCell>Inv Date</TableCell><TableCell>PO No</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {drillData.transactions.map((t, i) => {
                                      const allRates = drillData.transactions.map(x => x.purchase_rate);
                                      const minR = Math.min(...allRates), maxR = Math.max(...allRates);
                                      const isLatest = i === drillData.transactions.length - 1;
                                      return (
                                        <TableRow key={i} sx={{ background: isLatest ? '#FFFBEB' : 'inherit' }}>
                                          <TableCell>{t.grn_number}</TableCell>
                                          <TableCell>{t.grn_date_display}</TableCell>
                                          <TableCell>{t.vendor_name}</TableCell>
                                          <TableCell align="right">{t.qty_received}</TableCell>
                                          <TableCell align="right" sx={{ color: getRateColor(t.purchase_rate, minR, maxR), fontWeight: isLatest ? 700 : 500 }}>{fmt(t.purchase_rate)}</TableCell>
                                          <TableCell align="right">{t.tax_pct}%</TableCell>
                                          <TableCell align="right">{fmt(t.tax_amount)}</TableCell>
                                          <TableCell align="right">{fmt(t.net_rate)}</TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(t.total_amount)}</TableCell>
                                          <TableCell>{t.invoice_number}</TableCell>
                                          <TableCell>{t.invoice_date}</TableCell>
                                          <TableCell>{t.po_number}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          ) : null}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Box>
              ))}
              {!loading && reportData && sortedData.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: '#64748B' }}>No records found for the selected criteria</TableCell></TableRow>
              )}
              {!loading && !reportData && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: '#94A3B8' }}>Select filters and click "Generate Report" to view data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {reportData && (
          <Box sx={{ p: 1.5, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', background: '#FAFAFA' }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>{reportData.total_materials} material(s) | Tax: {reportData.include_tax ? 'Inclusive' : 'Exclusive'}</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Generated: {reportData.generated_at} | NissiGrid Smart Campus</Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
