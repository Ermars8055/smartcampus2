import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Switch, CircularProgress, IconButton,
  Checkbox, ListItemText, OutlinedInput, ListSubheader
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh
} from '@mui/icons-material';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

export default function DepartmentWiseInventoryReport() {
  const [categories, setCategories] = useState([]);
  const [departments, setAllDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');

  const [filters, setFilters] = useState({
    categoryId: '',
    departmentIds: [],
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
    return Math.round(num).toString();
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {
        only_with_stock: filters.onlyWithStock
      };
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.departmentIds.length > 0) params.department_id = filters.departmentIds.join(',');
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
      departmentIds: [],
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

  const handleExportExcel = async () => {
    if (!reportData?.data.length) return;
    
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Dept Inventory');
    
    // Filters and Titles
    ws.addRow(['DEPARTMENT WISE INVENTORY REPORT']);
    ws.addRow([`INVENTORY AS ON: ${reportData.generated_at}`]);
    ws.addRow([]);
    ws.addRow(['Category:', categories.find(c => c.id === filters.categoryId)?.name || 'All']);
    ws.addRow(['Departments:', filters.departmentIds.length > 0 ? departments.filter(d => filters.departmentIds.includes(d.id)).map(d => d.name).join(', ') : 'All']);
    ws.addRow(['Search:', filters.search || 'None']);
    ws.addRow(['Stock Only:', filters.onlyWithStock ? 'Yes' : 'No']);
    ws.addRow([]);
    
    ws.getCell('A1').font = { size: 14, bold: true };
    ws.getCell('A2').font = { size: 11, bold: true };
    
    // Header Row
    const headerRow = ['S.No', 'Material Name', 'UOM', ...reportData.departments, 'Total Inventory'];
    ws.addRow(headerRow);
    
    const headerRowIdx = 8;
    const totalCols = headerRow.length;
    
    const border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    
    // Formatting Headers
    for (let c = 1; c <= totalCols; c++) {
      const cell = ws.getCell(headerRowIdx, c);
      cell.fill = headerFill;
      cell.border = border;
      cell.font = { bold: true };
      
      if (c === 2) {
        cell.alignment = { wrapText: true, vertical: 'bottom', horizontal: 'left' };
      } else {
        cell.alignment = { textRotation: 90, vertical: 'bottom', horizontal: 'center' };
      }
    }
    
    // Data Rows
    reportData.data.forEach((row, i) => {
      const rowData = [i + 1, `${row.material_code} - ${row.material_name}`, row.uom];
      reportData.departments.forEach(d => {
        rowData.push(row.department_inventory[d] || 0);
      });
      rowData.push(row.total_inventory || 0);
      ws.addRow(rowData);
    });
    
    // Totals Row
    const totals = calculateTotals(reportData.data, reportData.departments);
    const totalRow = ['', 'Grand Total', ''];
    reportData.departments.forEach(d => totalRow.push(totals[d] || 0));
    totalRow.push(totals.total_inventory || 0);
    ws.addRow(totalRow);
    
    // Formatting Data Rows
    const lastRowIdx = headerRowIdx + reportData.data.length + 1;
    for (let r = headerRowIdx + 1; r <= lastRowIdx; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.border = border;
        
        if (r === lastRowIdx) {
          cell.font = { bold: true };
        }
        
        if (c === 2) {
          cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'left' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        
        // Number format
        if (c > 3 || c === 1) {
           if (typeof cell.value === 'number') {
             cell.numFmt = '#,##0';
           }
        }
      }
    }
    
    // Merge Grand Total label
    ws.mergeCells(lastRowIdx, 1, lastRowIdx, 3);
    const gtCell = ws.getCell(lastRowIdx, 1);
    gtCell.value = 'Grand Total';
    gtCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    // Column widths
    ws.getColumn(1).width = 5; // S.No
    ws.getColumn(2).width = 35; // Material
    ws.getColumn(3).width = 6; // UOM
    for (let i = 4; i <= totalCols; i++) {
      ws.getColumn(i).width = 6;
    }
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Dept_Inventory_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
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
              <Select
                multiple
                value={filters.departmentIds}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('ALL')) {
                    setFilters({ ...filters, departmentIds: [] });
                  } else {
                    setFilters({ ...filters, departmentIds: typeof val === 'string' ? val.split(',') : val });
                  }
                }}
                input={<OutlinedInput label="Department" />}
                renderValue={(selected) => selected.length === 0 ? 'All Departments' : selected.map(id => departments.find(d => d.id === id)?.name).filter(Boolean).join(', ')}
                MenuProps={{ autoFocus: false }}
              >
                <ListSubheader>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Type to search..."
                    fullWidth
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Escape') {
                        e.stopPropagation();
                      }
                    }}
                  />
                </ListSubheader>
                <MenuItem value="ALL">
                  <Checkbox checked={filters.departmentIds.length === 0} />
                  <ListItemText primary="All Departments" sx={{ fontWeight: 'bold' }} />
                </MenuItem>
                {departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    <Checkbox checked={filters.departmentIds.indexOf(d.id) > -1} />
                    <ListItemText primary={d.name} />
                  </MenuItem>
                ))}
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
      {reportData && reportData.data && reportData.data.length > 0 && (
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
