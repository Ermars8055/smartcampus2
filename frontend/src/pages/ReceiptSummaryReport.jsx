import { useState, useEffect, Fragment } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Switch, CircularProgress, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh,
  Close, Receipt
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

export default function ReceiptSummaryReport() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [drillData, setDrillData] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);

  const [filters, setFilters] = useState({
    fromDate: dayjs().startOf('month'),
    toDate: dayjs(),
    warehouseId: '',
    vendorId: '',
    categoryId: '',
    subcategoryId: '',
    search: '',
    grnNumber: '',
    includeCancelled: false,
    onlyReceipts: true
  });

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/api/vendors').then(r => setVendors(r.data)).catch(() => {});
    api.get('/api/warehouses').then(r => setWarehouses(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.categoryId) {
      api.get(`/api/categories/${filters.categoryId}/subcategories`).then(r => setSubCategories(r.data)).catch(() => {});
    } else {
      setSubCategories([]);
    }
  }, [filters.categoryId]);

  const fmt = (v) => v != null ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  const fmtQty = (v) => v != null ? Math.round(Number(v)).toLocaleString('en-IN') : '0';

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {
        from_date: filters.fromDate.format('YYYY-MM-DD'),
        to_date: filters.toDate.format('YYYY-MM-DD'),
        include_cancelled: filters.includeCancelled,
        only_receipts: filters.onlyReceipts
      };
      if (filters.warehouseId) params.warehouse_id = filters.warehouseId;
      if (filters.vendorId) params.vendor_id = filters.vendorId;
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.subcategoryId) params.subcategory_id = filters.subcategoryId;
      if (filters.search) params.search = filters.search;
      if (filters.grnNumber) params.grn_number = filters.grnNumber;

      const res = await api.get('/api/reports/receipt-summary', { params });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      fromDate: dayjs().startOf('month'),
      toDate: dayjs(),
      warehouseId: '',
      vendorId: '',
      categoryId: '',
      subcategoryId: '',
      search: '',
      grnNumber: '',
      includeCancelled: false,
      onlyReceipts: true
    });
    setReportData(null);
  };

  const handleCellClick = async (matId, vendorId) => {
    setDetailsDialog(true);
    setDrillLoading(true);
    try {
      const params = {
        material_id: matId,
        vendor_id: vendorId,
        from_date: filters.fromDate.format('YYYY-MM-DD'),
        to_date: filters.toDate.format('YYYY-MM-DD')
      };
      const res = await api.get('/api/reports/receipt-summary/details', { params });
      setDrillData(res.data);
    } catch (err) {
      console.error(err);
      setDrillData([]);
    } finally {
      setDrillLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    
    // Header setup
    const vendorHeads = reportData.vendors.map(v => [v.name, '', '', '', '']);
    const subHeads = reportData.vendors.map(() => ['Bill No & Date', 'Qty', 'Rate', 'Amount', 'Total']);
    
    const aoa = [
      ['MAIN STORE ITEMS - RECEIPT SUMMARY REPORT'],
      [`Period: ${filters.fromDate.format('DD-MMM-YYYY')} to ${filters.toDate.format('DD-MMM-YYYY')}`],
      [],
      ['S.No', 'Material Name', ...vendorHeads.flat()],
      ['', '', ...subHeads.flat()]
    ];

    // Data rows
    reportData.data.forEach((row, i) => {
      const matRow = [i + 1, `${row.material_code} - ${row.material_name}`];
      reportData.vendors.forEach(v => {
        const vData = row.vendor_details[v.id];
        if (vData) {
          const billStr = `${vData.latest_bill_no || ''} dt\n${vData.latest_bill_date ? dayjs(vData.latest_bill_date).format('DD-MMM-YYYY') : ''}`;
          matRow.push(billStr, vData.qty, vData.rate, vData.amount, vData.total);
        } else {
          matRow.push('-', '-', '-', '-', '-');
        }
      });
      aoa.push(matRow);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    
    // Merges for headers
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 + reportData.vendors.length * 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 + reportData.vendors.length * 5 } }, // Period
      { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // S.No
      { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // Material Name
    ];

    reportData.vendors.forEach((v, i) => {
      const colStart = 2 + i * 5;
      merges.push({ s: { r: 3, c: colStart }, e: { r: 3, c: colStart + 4 } });
    });

    ws['!merges'] = merges;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Receipt Summary');
    XLSX.writeFile(wb, `Receipt_Summary_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF('landscape', 'pt', 'a2'); // Larger format for many columns
    
    doc.setFontSize(18);
    doc.text('MAIN STORE ITEMS - RECEIPT SUMMARY REPORT', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Period: ${filters.fromDate.format('DD-MMM-YYYY')} to ${filters.toDate.format('DD-MMM-YYYY')}`, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    const head = [
      [
        { content: 'S.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Material Name', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        ...reportData.vendors.map(v => ({ content: v.name, colSpan: 5, styles: { halign: 'center' } }))
      ],
      [
        ...reportData.vendors.map(() => 'Bill No & Date').flat(),
        ...reportData.vendors.map(() => 'Qty').flat(), // This logic is slightly wrong, need flat array
      ]
    ];
    
    // Fix subheader array
    const subHeads = [];
    reportData.vendors.forEach(() => {
      subHeads.push('Bill No & Date', 'Qty', 'Rate', 'Amount', 'Total');
    });
    head[1] = ['', '', ...subHeads]; // Empty for spans

    const body = reportData.data.map((row, i) => {
      const matRow = [i + 1, `${row.material_code} - ${row.material_name}`];
      reportData.vendors.forEach(v => {
        const vData = row.vendor_details[v.id];
        if (vData) {
          const billStr = `${vData.latest_bill_no || ''}\n${vData.latest_bill_date ? dayjs(vData.latest_bill_date).format('DD-MMM-YYYY') : ''}`;
          matRow.push(billStr, vData.qty, fmt(vData.rate), fmt(vData.amount), fmt(vData.total));
        } else {
          matRow.push('-', '-', '-', '-', '-');
        }
      });
      return matRow;
    });

    autoTable(doc, {
      head: head,
      body: body,
      startY: 80,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 150 }
      }
    });

    doc.save(`Receipt_Summary_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Report Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E3A8A', letterSpacing: 1 }}>
          MAIN STORE ITEMS
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#64748B' }}>
          RECEIPT SUMMARY {filters.fromDate.isSame(filters.toDate, 'day') 
            ? `AS ON : ${filters.fromDate.format('DD-MMM-YYYY')}` 
            : `FROM ${filters.fromDate.format('DD-MMM-YYYY')} TO ${filters.toDate.format('DD-MMM-YYYY')}`}
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.4}>
            <DatePicker label="From Date" value={filters.fromDate} onChange={d => setFilters({ ...filters, fromDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true } }} format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <DatePicker label="To Date" value={filters.toDate} onChange={d => setFilters({ ...filters, toDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true } }} format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Store</InputLabel>
              <Select value={filters.warehouseId} label="Store" onChange={e => setFilters({ ...filters, warehouseId: e.target.value })}>
                <MenuItem value="">All Stores</MenuItem>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select value={filters.vendorId} label="Vendor" onChange={e => setFilters({ ...filters, vendorId: e.target.value })}>
                <MenuItem value="">All Vendors</MenuItem>
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value={filters.categoryId} label="Category" onChange={e => setFilters({ ...filters, categoryId: e.target.value, subcategoryId: '' })}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.4}>
            <FormControl size="small" fullWidth disabled={!filters.categoryId}>
              <InputLabel>Subcategory</InputLabel>
              <Select value={filters.subcategoryId} label="Subcategory" onChange={e => setFilters({ ...filters, subcategoryId: e.target.value })}>
                <MenuItem value="">All Subcategories</MenuItem>
                {subcategories.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField size="small" fullWidth label="Search Material" placeholder="Code or Name"
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField size="small" fullWidth label="GRN Number"
              value={filters.grnNumber} onChange={e => setFilters({ ...filters, grnNumber: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={<Switch size="small" checked={filters.includeCancelled} onChange={e => setFilters({ ...filters, includeCancelled: e.target.checked })} />}
              label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Inc. Cancelled</Typography>} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} size="small">Reset</Button>
              <Button variant="contained" startIcon={<Assessment />} onClick={handleGenerate} disabled={loading} size="small">
                {loading ? <CircularProgress size={20} /> : 'Generate'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Action Buttons */}
      {reportData && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="success" size="small" startIcon={<FileDownload />} onClick={handleExportExcel}>Excel</Button>
          <Button variant="contained" color="error" size="small" startIcon={<PictureAsPdf />} onClick={handleExportPDF}>PDF</Button>
          <Button variant="contained" color="secondary" size="small" startIcon={<Print />} onClick={() => window.print()}>Print</Button>
        </Box>
      )}

      {/* Main Table */}
      <Card sx={{ borderRadius: 1, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
          <Table size="small" stickyHeader sx={{ 
            '& th, & td': { border: '1px solid #E2E8F0', fontSize: '0.75rem', p: 0.5 },
            '& th': { background: '#F8FAFC', fontWeight: 700, textAlign: 'center' }
          }}>
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{ width: 40, background: '#F1F5F9' }}>S.No</TableCell>
                <TableCell rowSpan={2} sx={{ minWidth: 200, background: '#F1F5F9', position: 'sticky', left: 0, zIndex: 3 }}>Material Name</TableCell>
                {reportData?.vendors.map(v => (
                  <TableCell key={v.id} colSpan={5} sx={{ background: '#EFF6FF', color: '#1E40AF', borderBottom: '2px solid #3B82F6' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{v.name}</Typography>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                {reportData?.vendors.map(v => (
                  <Fragment key={v.id}>
                    <TableCell sx={{ minWidth: 100 }}>Bill No & Date</TableCell>
                    <TableCell sx={{ minWidth: 60 }}>Qty</TableCell>
                    <TableCell sx={{ minWidth: 70 }}>Rate</TableCell>
                    <TableCell sx={{ minWidth: 90 }}>Amount</TableCell>
                    <TableCell sx={{ minWidth: 90 }}>Total</TableCell>
                  </Fragment>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={2 + (reportData?.vendors.length || 0) * 5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>}
              {!loading && reportData?.data.map((row, idx) => (
                <TableRow key={row.material_id} hover>
                  <TableCell align="center">{idx + 1}</TableCell>
                  <TableCell sx={{ position: 'sticky', left: 0, background: '#fff', zIndex: 2, fontWeight: 600 }}>
                    {row.material_code} - {row.material_name}
                  </TableCell>
                  {reportData.vendors.map(v => {
                    const vData = row.vendor_details[v.id];
                    if (!vData) return <Fragment key={v.id}><TableCell colSpan={5} align="center" sx={{ color: '#CBD5E1' }}>-</TableCell></Fragment>;
                    return (
                      <Fragment key={v.id}>
                        <TableCell sx={{ cursor: 'pointer', '&:hover': { background: '#F1F5F9' } }} onClick={() => handleCellClick(row.material_id, v.id)}>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{vData.latest_bill_no || '-'}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>dt {vData.latest_bill_date ? dayjs(vData.latest_bill_date).format('DD-MMM-YYYY') : '-'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#0F172A' }}>{fmtQty(vData.qty)}</TableCell>
                        <TableCell align="right">{fmt(vData.rate)}</TableCell>
                        <TableCell align="right">{fmt(vData.amount)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1E40AF' }}>{fmt(vData.total)}</TableCell>
                      </Fragment>
                    );
                  })}
                </TableRow>
              ))}
              {!loading && reportData && (
                <TableRow sx={{ background: '#F8FAFC', '& td': { fontWeight: 800, py: 1.5 } }}>
                  <TableCell colSpan={2} align="right">GRAND TOTAL</TableCell>
                  {reportData.vendors.map(v => {
                    const vTotalQty = reportData.data.reduce((acc, row) => acc + (row.vendor_details[v.id]?.qty || 0), 0);
                    const vTotalAmt = reportData.data.reduce((acc, row) => acc + (row.vendor_details[v.id]?.amount || 0), 0);
                    const vTotalSum = reportData.data.reduce((acc, row) => acc + (row.vendor_details[v.id]?.total || 0), 0);
                    return (
                      <Fragment key={v.id}>
                        <TableCell />
                        <TableCell align="right">{fmtQty(vTotalQty)}</TableCell>
                        <TableCell />
                        <TableCell align="right">{fmt(vTotalAmt)}</TableCell>
                        <TableCell align="right" sx={{ color: '#1E40AF' }}>{fmt(vTotalSum)}</TableCell>
                      </Fragment>
                    );
                  })}
                </TableRow>
              )}
              {!loading && !reportData && (
                <TableRow><TableCell colSpan={2} align="center" sx={{ py: 10, color: '#94A3B8' }}>Select filters and click Generate to view the report</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Drill-down Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            <Typography variant="h6">GRN Details</Typography>
          </Box>
          <IconButton onClick={() => setDetailsDialog(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {drillLoading ? <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box> : (
            <TableContainer>
              <Table size="small" sx={{ '& th, & td': { border: '1px solid #E2E8F0', p: 1 } }}>
                <TableHead>
                  <TableRow sx={{ background: '#F1F5F9' }}>
                    <TableCell>GRN No / Date</TableCell>
                    <TableCell>Vendor / Bill Info</TableCell>
                    <TableCell>Material / UOM</TableCell>
                    <TableCell align="right">Qty Received</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Tax Amt</TableCell>
                    <TableCell align="right">Total Amt</TableCell>
                    <TableCell>Store / Received By</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drillData.map((d, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{d.grn_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.grn_date}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{d.vendor_name}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>Bill: {d.bill_number} dt {d.bill_date}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.material_code} - {d.material_name}</Typography>
                        <Typography variant="caption" color="primary">{d.uom}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtQty(d.qty_received)}</TableCell>
                      <TableCell align="right">{fmt(d.rate)}</TableCell>
                      <TableCell align="right">{fmt(d.tax_amount)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#1E40AF' }}>{fmt(d.total_amount)}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block' }}>{d.store_name}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>By: {d.received_by}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', color: '#64748B', maxWidth: 150 }}>{d.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {drillData.length === 0 && <TableRow><TableCell colSpan={9} align="center">No details found</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
