import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Switch, CircularProgress, IconButton
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh
} from '@mui/icons-material';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

export default function DepartmentWiseInventoryReport() {
  const [categories, setCategories] = useState([]);
  const [departments, setAllDepartments] = useState([]);

  const [filters, setFilters] = useState({
    categoryId: '',
    departmentId: '',
    search: '',
    onlyWithStock: true
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const tableRef = useRef(null);

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => { });
    api.get('/api/departments').then(r => setAllDepartments(r.data)).catch(() => { });
  }, []);

  const formatQty = (val) => {
    if (val == null || val === '') return '';
    const num = Number(val);
    if (isNaN(num)) return val;
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {
        only_with_stock: filters.onlyWithStock
      };
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.departmentId) params.department_id = filters.departmentId;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/api/reports/department-inventory', { params });
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
      categoryId: '',
      departmentId: '',
      search: '',
      onlyWithStock: true
    });
    setReportData(null);
  };

  const calculateTotals = (data, depts) => {
    const totals = { total_inventory: 0 };
    depts.forEach(d => totals[d] = 0);

    data.forEach(row => {
      totals.total_inventory += (row.total_inventory || 0);
      depts.forEach(d => {
        totals[d] += (row.department_inventory[d] || 0);
      });
    });
    return totals;
  };

  const handleExportExcel = () => {
    if (!reportData?.data.length) return;

    const excelData = reportData.data.map((row, index) => {
      const obj = {
        'S.No': index + 1,
        'Material Name': `${row.material_code} - ${row.material_name}`,
        'UOM': row.uom
      };
      reportData.departments.forEach(d => {
        obj[d] = formatQty(row.department_inventory[d] || 0);
      });
      obj['Total Inventory'] = formatQty(row.total_inventory);
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet([]);
    const filterRows = [
      ['DEPARTMENT WISE INVENTORY REPORT'],
      [`INVENTORY AS ON: ${reportData.generated_at}`],
      [],
      ['Category:', categories.find(c => c.id === filters.categoryId)?.name || 'All'],
      ['Search:', filters.search || 'None'],
      ['Stock Only:', filters.onlyWithStock ? 'Yes' : 'No'],
      []
    ];
    XLSX.utils.sheet_add_aoa(worksheet, filterRows, { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, excelData, { origin: 'A8' });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dept Inventory');
    XLSX.writeFile(workbook, `Dept_Inventory_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData?.data.length) return;
    const doc = new jsPDF('landscape');

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text('DEPARTMENT WISE INVENTORY REPORT', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`INVENTORY AS ON: ${reportData.generated_at}`, pageWidth / 2, 22, { align: 'center' });

    const headers = [
      'S.No', 'Material Name', 'UOM',
      ...reportData.departments,
      'Total Inventory'
    ];

    const body = reportData.data.map((row, index) => {
      const rowData = [
        index + 1,
        `${row.material_code} - ${row.material_name}`,
        row.uom
      ];
      reportData.departments.forEach(d => rowData.push(formatQty(row.department_inventory[d] || 0)));
      rowData.push(formatQty(row.total_inventory));
      return rowData;
    });

    const totals = calculateTotals(reportData.data, reportData.departments);
    const footer = [
      '', 'Grand Total', '',
      ...reportData.departments.map(d => formatQty(totals[d])),
      formatQty(totals.total_inventory)
    ];
    body.push(footer);

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: { fontSize: 7, cellPadding: 1, lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
      didParseCell: function (data) {
        if (data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
        if (data.column.index > 2) {
          data.cell.styles.halign = 'center';
        }
      }
    });

    doc.save(`Dept_Inventory_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
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
          <Assessment color="primary" /> Department Wise Inventory Report
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ p: 2, mb: 3, '@media print': { display: 'none' } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Material Category</InputLabel>
              <Select value={filters.categoryId} label="Material Category" onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={filters.departmentId} label="Department" onChange={e => setFilters({ ...filters, departmentId: e.target.value })}>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField size="small" fullWidth label="Material Search" placeholder="Code / Name" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel control={<Switch size="small" checked={filters.onlyWithStock} onChange={e => setFilters({ ...filters, onlyWithStock: e.target.checked })} />} label={<Typography variant="body2">Show only materials with stock</Typography>} />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset}>Reset Filters</Button>
            <Button variant="contained" startIcon={<Search />} onClick={handleGenerate} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Generate Report'}
            </Button>
            <Button variant="contained" color="success" startIcon={<FileDownload />} onClick={handleExportExcel} disabled={!reportData}>Export to Excel</Button>
            <Button variant="contained" color="error" startIcon={<PictureAsPdf />} onClick={handleExportPDF} disabled={!reportData}>Export to PDF</Button>
            <Button variant="contained" color="secondary" startIcon={<Print />} onClick={handlePrint} disabled={!reportData}>Print Report</Button>
          </Grid>
        </Grid>
      </Card>

      {/* Report Container */}
      {reportData && (
        <Box sx={{ '@media print': { mt: 0 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5, letterSpacing: '0.05em' }}>
              DEPARTMENT WISE INVENTORY REPORT
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: 600 }}>
              INVENTORY AS ON : {reportData.generated_at}
            </Typography>
          </Box>

          {/* Table */}
          <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', '@media print': { maxHeight: 'none', overflow: 'visible' } }}>
              <Table size="small" sx={{ borderCollapse: 'collapse', '& th, & td': { border: '1px solid #CBD5E1', padding: '6px 10px', fontSize: '0.85rem' } }} stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { background: '#F8FAFC', fontWeight: 700, color: '#1E293B', py: 1.5 } }}>
                    <TableCell align="center" sx={stickyStyle(0, true)}>S.No</TableCell>
                    <TableCell sx={stickyStyle(50, true)}>Material Name</TableCell>
                    <TableCell align="center" sx={stickyStyle(300, true)}>UOM</TableCell>
                    
                    {reportData.departments.map((dept, i) => (
                      <TableCell key={i} align="center" sx={{ minWidth: 100, p: 1 }}>
                        <Typography sx={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          writingMode: reportData.departments.length > 5 ? 'vertical-rl' : 'horizontal-tb',
                          transform: reportData.departments.length > 5 ? 'rotate(180deg)' : 'none',
                          maxHeight: 150,
                          mx: 'auto'
                        }}>
                          {dept}
                        </Typography>
                      </TableCell>
                    ))}
                    
                    <TableCell align="center" sx={{ background: '#F1F5F9', fontWeight: 800 }}>Total Inventory</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.data.map((row, idx) => (
                    <TableRow key={row.material_id} hover>
                      <TableCell align="center" sx={stickyStyle(0, false)}>{idx + 1}</TableCell>
                      <TableCell sx={{ ...stickyStyle(50, false), minWidth: 250 }}>
                        {row.material_code} - {row.material_name}
                      </TableCell>
                      <TableCell align="center" sx={stickyStyle(300, false)}>{row.uom}</TableCell>
                      
                      {reportData.departments.map((dept, i) => (
                        <TableCell key={i} align="center">
                          {formatQty(row.department_inventory[dept] || '')}
                        </TableCell>
                      ))}
                      
                      <TableCell align="center" sx={{ fontWeight: 700, background: '#F8FAFC' }}>
                        {formatQty(row.total_inventory)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  {(() => {
                    const totals = calculateTotals(reportData.data, reportData.departments);
                    return (
                      <TableRow sx={{ background: '#F8FAFC', '& td': { fontWeight: 800, color: '#1E293B' } }}>
                        <TableCell colSpan={3} align="right" sx={stickyStyle(0, false)}>DEPARTMENT TOTALS</TableCell>
                        {reportData.departments.map((d, i) => (
                          <TableCell key={i} align="center">{formatQty(totals[d])}</TableCell>
                        ))}
                        <TableCell align="center" sx={{ background: '#E2E8F0' }}>{formatQty(totals.total_inventory)}</TableCell>
                      </TableRow>
                    )
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
          
          <Box sx={{ mt: 2, display: 'none', '@media print': { display: 'flex', justifyContent: 'space-between' } }}>
             <Typography variant="caption">Generated by: {reportData.generated_by}</Typography>
             <Typography variant="caption">NissiGrid Smart Campus - Inventory Management System</Typography>
          </Box>
        </Box>
      )}

      {reportData && reportData.data.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="textSecondary">No inventory data found for the selected filters.</Typography>
        </Box>
      )}
    </Box>
  );
}
