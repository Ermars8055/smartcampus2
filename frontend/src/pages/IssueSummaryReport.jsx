import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Switch, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh, Close
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

export default function IssueSummaryReport() {
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    fromDate: dayjs().startOf('month'),
    toDate: dayjs(),
    warehouseId: '',
    categoryId: '',
    department: '',
    search: '',
    includeZero: false
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Drill-down states
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');

  const tableRef = useRef(null);

  useEffect(() => {
    api.get('/api/warehouses').then(r => setWarehouses(r.data)).catch(() => { });
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => { });
  }, []);

  const formatQty = (val) => {
    if (val == null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return Math.round(num).toString();
  };

  const handleGenerate = async () => {
    if (!filters.fromDate || !filters.toDate) {
      alert("Please select From Date and To Date");
      return;
    }
    if (filters.fromDate.isAfter(filters.toDate)) {
      alert("From Date cannot be greater than To Date");
      return;
    }

    setLoading(true);
    try {
      const params = {
        from_date: filters.fromDate.format('YYYY-MM-DD'),
        to_date: filters.toDate.format('YYYY-MM-DD'),
        include_zero: filters.includeZero
      };
      if (filters.warehouseId) params.warehouse_id = filters.warehouseId;
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.department) params.department = filters.department;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/api/reports/issue-summary', { params });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      fromDate: dayjs().startOf('month'),
      toDate: dayjs(),
      warehouseId: '',
      categoryId: '',
      department: '',
      search: '',
      includeZero: false
    });
    setReportData(null);
  };

  const calculateTotals = (data, depts) => {
    const totals = { opening_stock: 0, total_received: 0, total_issue: 0, other_outward: 0, closing_stock: 0 };
    depts.forEach(d => totals[d] = 0);

    data.forEach(row => {
      totals.opening_stock += (row.opening_stock || 0);
      totals.total_received += (row.total_received || 0);
      totals.total_issue += (row.total_issue || 0);
      totals.other_outward += (row.other_outward || 0);
      totals.closing_stock += (row.closing_stock || 0);
      depts.forEach(d => {
        totals[d] += (row.departments[d] || 0);
      });
    });
    return totals;
  };

  const handleExportExcel = () => {
    if (!reportData?.data.length) return;

    // Format data for excel
    const excelData = reportData.data.map((row, index) => {
      const obj = {
        'S.No': index + 1,
        'Material Name': `${row.material_code} - ${row.material_name}`,
        'UOM': row.uom,
        'Opening Stock': formatQty(row.opening_stock),
        'Total Received': formatQty(row.total_received),
        'Issue No': row.issue_numbers || '-'
      };
      reportData.departments.forEach(d => {
        const colName = (reportData.departments.length === 1 && d === 'UNKNOWN') ? 'Quantity Issued' : (d === 'UNKNOWN' ? 'Unspecified' : d);
        obj[colName] = formatQty(row.departments[d] || 0);
      });
      obj['Total Issued'] = formatQty(row.total_issue);
      obj['Other Outward'] = formatQty(row.other_outward);
      obj['Closing Stock'] = formatQty(row.closing_stock);
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet([]);

    // Add applied filters at the top
    const filterRows = [
      ['Report:', 'Issue Summary'],
      ['Date Range:', `${filters.fromDate.format('DD-MMM-YYYY')} to ${filters.toDate.format('DD-MMM-YYYY')}`],
      ['Store:', warehouses.find(w => w.id === filters.warehouseId)?.name || 'All Stores'],
      ['Category:', categories.find(c => c.id === filters.categoryId)?.name || 'All Categories'],
      ['Department:', filters.department || 'All'],
      ['Search:', filters.search || 'None'],
      ['Include Zero Transaction:', filters.includeZero ? 'Yes' : 'No'],
      [] // Empty row before data
    ];
    XLSX.utils.sheet_add_aoa(worksheet, filterRows, { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, excelData, { origin: 'A10' });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Issue Summary');
    XLSX.writeFile(workbook, `Issue_Summary_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData?.data.length) return;
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    const whName = warehouses.find(w => w.id === filters.warehouseId)?.name || 'ALL STORES';
    doc.text(`${whName} - Material Issue Summary`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`ISSUE SUMMARY FROM ${filters.fromDate.format('DD/MM/YYYY')} TO ${filters.toDate.format('DD/MM/YYYY')}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

    const headers = [
      'S.No', 'Material Name', 'UOM', 'Opening\nStock', 'Total\nReceived', 'Issue No',
      ...reportData.departments.map(d => (reportData.departments.length === 1 && d === 'UNKNOWN') ? 'Quantity\nIssued' : (d === 'UNKNOWN' ? 'Unspecified' : d)),
      'Total\nIssued', 'Other\nOutward', 'Closing\nStock'
    ];

    const body = reportData.data.map((row, index) => {
      const rowData = [
        index + 1,
        `${row.material_code} - ${row.material_name}`,
        row.uom,
        formatQty(row.opening_stock),
        formatQty(row.total_received),
        row.issue_numbers || '-'
      ];
      reportData.departments.forEach(d => rowData.push(formatQty(row.departments[d] || 0)));
      rowData.push(formatQty(row.total_issue));
      rowData.push(formatQty(row.other_outward));
      rowData.push(formatQty(row.closing_stock));
      return rowData;
    });

    const totals = calculateTotals(reportData.data, reportData.departments);
    const footer = [
      '', 'Grand Total', '', formatQty(totals.opening_stock), formatQty(totals.total_received), '',
      ...reportData.departments.map(d => formatQty(totals[d])),
      formatQty(totals.total_issue), formatQty(totals.other_outward), formatQty(totals.closing_stock)
    ];
    body.push(footer);

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak', lineWidth: 0.1, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 20 },
        5: { cellWidth: 35 },
        6: { halign: 'right', cellWidth: 20 },
        7: { halign: 'right', cellWidth: 15 },
        8: { halign: 'right', cellWidth: 15 },
        9: { halign: 'right', cellWidth: 20 }
      },
      didParseCell: function (data) {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [250, 250, 250];
        }
        if (data.column.index > 2 && data.column.index !== headers.length - 1) {
          data.cell.styles.halign = 'right';
        }
      }
    });

    doc.save(`Issue_Summary_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDrillDown = async (materialId, deptName, matName, uom) => {
    setDrillDownTitle(deptName === 'UNKNOWN' ? 'Issue Transactions' : `Transactions: ${deptName}`);
    setDrillDownLoading(true);
    setDrillDownOpen(true);

    try {
      const params = {
        material_id: materialId,
        department: deptName,
        from_date: filters.fromDate.format('YYYY-MM-DD'),
        to_date: filters.toDate.format('YYYY-MM-DD'),
      };
      if (filters.warehouseId) params.warehouse_id = filters.warehouseId;

      const res = await api.get('/api/reports/issue-summary-details', { params });

      const enrichedData = res.data.map(r => ({ ...r, material_name: matName, uom: uom }));
      setDrillDownData(enrichedData);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transaction details");
      setDrillDownData([]);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const stickyStyle = (leftPos, isHeader) => ({
    position: 'sticky',
    left: leftPos,
    background: isHeader ? '#F8FAFC' : '#FFFFFF',
    zIndex: isHeader ? 20 : 10,
    borderRight: '1px solid #E2E8F0',
    fontWeight: isHeader ? 'bold' : 'normal'
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, '@media print': { display: 'none' } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" /> Issue Summary Report
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ p: 2, mb: 3, '@media print': { display: 'none' } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <DatePicker label="From Date" value={filters.fromDate} onChange={d => setFilters({ ...filters, fromDate: d })} 
              slotProps={{ textField: { size: "small", fullWidth: true } }} 
              format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <DatePicker label="To Date" value={filters.toDate} onChange={d => setFilters({ ...filters, toDate: d })} 
              slotProps={{ textField: { size: "small", fullWidth: true } }} 
              format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
              <InputLabel>Store</InputLabel>
              <Select value={filters.warehouseId} label="Store" onChange={e => setFilters({ ...filters, warehouseId: e.target.value })}>
                <MenuItem value="">All Stores</MenuItem>
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
              <InputLabel>Material Category</InputLabel>
              <Select value={filters.categoryId} label="Material Category" onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField size="small" fullWidth label="Department" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <TextField size="small" fullWidth label="Material Search" placeholder="Code / Name" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <FormControlLabel control={<Switch size="small" checked={filters.includeZero} onChange={e => setFilters({ ...filters, includeZero: e.target.checked })} />} label={<Typography variant="body2">Include Zero Transaction</Typography>} />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset}>Reset</Button>
            <Button variant="contained" startIcon={<Search />} onClick={handleGenerate} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Generate Report'}
            </Button>
            <Button variant="contained" color="success" startIcon={<FileDownload />} onClick={handleExportExcel} disabled={!reportData}>Excel</Button>
            <Button variant="contained" color="error" startIcon={<PictureAsPdf />} onClick={handleExportPDF} disabled={!reportData}>PDF</Button>
            <Button variant="contained" color="secondary" startIcon={<Print />} onClick={handlePrint} disabled={!reportData}>Print</Button>
          </Grid>
        </Grid>
      </Card>

      {/* Report Header for Print/PDF */}
      <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 3, textAlign: 'center' } }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', textDecoration: 'underline', mb: 1 }}>
          {warehouses.find(w => w.id === filters.warehouseId)?.name || 'MAIN STORE ITEMS'}
        </Typography>
        <Typography variant="subtitle1">ISSUE SUMMARY FROM {filters.fromDate?.format('DD/MM/YYYY')} TO {filters.toDate?.format('DD/MM/YYYY')}</Typography>
      </Box>

      {/* Report Table */}
      <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', '@media print': { maxHeight: 'none', overflow: 'visible' } }} ref={tableRef}>
          <Table size="small" sx={{ minWidth: 1000, borderCollapse: 'collapse', '& th, & td': { border: '1px solid #CBD5E1', padding: '6px 10px', fontSize: '0.85rem' } }} stickyHeader>
            <TableHead>
              {reportData && (
                <TableRow sx={{ '& th': { background: '#F8FAFC', fontWeight: 700, color: '#1E293B', py: 1.5 } }}>
                  <TableCell align="center" sx={stickyStyle(0, true)}>S.No</TableCell>
                  <TableCell sx={stickyStyle(50, true)}>Material Name</TableCell>
                  <TableCell align="center" sx={stickyStyle(300, true)}>UOM</TableCell>
                  <TableCell align="center" sx={stickyStyle(360, true)}>Opening<br />Stock</TableCell>
                  <TableCell align="center" sx={{ background: '#F8FAFC', fontWeight: 700, color: '#1E293B', minWidth: 100 }}>Total<br />Received</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#334155', minWidth: 100 }}>Issue No</TableCell>

                  {reportData.departments.length === 1 && reportData.departments[0] === 'UNKNOWN' ? (
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#334155', minWidth: 100 }}>
                      Quantity<br />Issued
                    </TableCell>
                  ) : (
                    <TableCell align="center" colSpan={reportData.departments.length} sx={{ p: 0 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ borderBottom: '1px solid #CBD5E1', py: 0.5 }}>Quantity Issued</Box>
                        <Box sx={{ display: 'flex', flex: 1 }}>
                          {reportData.departments.map((dept, i) => (
                            <Box key={i} sx={{
                              flex: 1,
                              borderRight: i < reportData.departments.length - 1 ? '1px solid #CBD5E1' : 'none',
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Typography sx={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: '#475569',
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)',
                                maxHeight: 120,
                              }}>
                                {dept === 'UNKNOWN' ? 'Unspecified' : dept}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </TableCell>
                  )}

                  <TableCell align="center">Total<br />Issued</TableCell>
                  <TableCell align="center">Other<br />Outward</TableCell>
                  <TableCell align="center">Closing<br />Stock</TableCell>
                </TableRow>
              )}
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={20} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              )}
              {!loading && reportData?.data.map((row, idx) => (
                <TableRow key={row.material_id} hover sx={{ '&:hover td': { background: '#F1F5F9' } }}>
                  <TableCell align="center" sx={stickyStyle(0, false)}>{idx + 1}</TableCell>
                  <TableCell sx={{ ...stickyStyle(50, false), minWidth: 250, whiteSpace: 'nowrap' }}>
                    {row.material_code} - {row.material_name}
                  </TableCell>
                  <TableCell align="center" sx={stickyStyle(300, false)}>{row.uom}</TableCell>
                  <TableCell align="center" sx={stickyStyle(360, false)}>{formatQty(row.opening_stock)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#059669' }}>{formatQty(row.total_received)}</TableCell>
                  <TableCell align="left">{row.issue_numbers || '-'}</TableCell>

                  {reportData.departments.map((dept, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{
                        cursor: (row.departments[dept] || 0) > 0 ? 'pointer' : 'default',
                        color: (row.departments[dept] || 0) > 0 ? '#2563EB' : 'inherit',
                        fontWeight: (row.departments[dept] || 0) > 0 ? 600 : 400
                      }}
                      onClick={() => (row.departments[dept] || 0) > 0 && handleDrillDown(row.material_id, dept, row.material_name, row.uom)}
                    >
                      {formatQty(row.departments[dept] || '')}
                    </TableCell>
                  ))}

                  <TableCell align="center" sx={{ fontWeight: 600 }}>{formatQty(row.total_issue)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#DC2626' }}>{formatQty(row.other_outward)}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, background: '#F8FAFC' }}>{formatQty(row.closing_stock)}</TableCell>
                </TableRow>
              ))}

              {!loading && reportData?.data.length === 0 && (
                <TableRow><TableCell colSpan={20} align="center" sx={{ py: 5 }}>No records found for the selected criteria</TableCell></TableRow>
              )}

              {!loading && reportData?.data.length > 0 && (() => {
                const totals = calculateTotals(reportData.data, reportData.departments);
                return (
                  <TableRow sx={{ background: '#F8FAFC', '& td': { fontWeight: 700 } }}>
                    <TableCell colSpan={3} align="right" sx={stickyStyle(0, false)}>Grand Total</TableCell>
                    <TableCell align="center" sx={stickyStyle(360, false)}>{formatQty(totals.opening_stock)}</TableCell>
                    <TableCell align="center">{formatQty(totals.total_received)}</TableCell>
                    <TableCell></TableCell>
                    {reportData.departments.map((d, i) => (
                      <TableCell key={i} align="center">{totals[d] ? formatQty(totals[d]) : ''}</TableCell>
                    ))}
                    <TableCell align="center">{formatQty(totals.total_issue)}</TableCell>
                    <TableCell align="center">{formatQty(totals.other_outward)}</TableCell>
                    <TableCell align="center">{formatQty(totals.closing_stock)}</TableCell>
                  </TableRow>
                )
              })()}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Drill Down Dialog */}
      <Dialog open={drillDownOpen} onClose={() => setDrillDownOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6">{drillDownTitle}</Typography>
          <IconButton onClick={() => setDrillDownOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {drillDownLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 600, background: '#F8FAFC' } }}>
                    <TableCell>Issue No</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Issued By</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drillDownData.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.issue_no}</TableCell>
                      <TableCell>{r.material_name}</TableCell>
                      <TableCell>{r.uom}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>{formatQty(r.qty)}</TableCell>
                      <TableCell>{r.by}</TableCell>
                      <TableCell>{r.remarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrillDownOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
