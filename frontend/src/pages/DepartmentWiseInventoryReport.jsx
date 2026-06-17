import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, OutlinedInput, ListSubheader, TablePagination, TextField, FormControlLabel, Switch, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh, Close
} from '@mui/icons-material';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

export default function DepartmentWiseInventoryReport() {
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setAllDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');

  const [filters, setFilters] = useState({
    categoryId: '',
    institutionId: '',
    departmentIds: [],
    search: '',
    onlyWithStock: false
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  const tableRef = useRef(null);

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => { });
    api.get('/api/institutions').then(r => setInstitutions(r.data)).catch(() => { });
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
      if (filters.institutionId) params.institution_id = filters.institutionId;
      if (filters.departmentIds.length > 0) params.department_id = filters.departmentIds.join(',');
      if (filters.search) params.search = filters.search;

      const res = await api.get('/api/reports/department-inventory', { params });
      setReportData(res.data);
      setPage(0);
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
      institutionId: '',
      departmentIds: [],
      search: '',
      onlyWithStock: false
    });
    setReportData(null);
    setPage(0);
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

    // Ordered list of all departments based on institution order
    const orderedDepts = [];
    reportData.institutions.forEach(inst => {
      inst.departments.forEach(d => orderedDepts.push(d));
    });

    const totalCols = orderedDepts.length + 4; // 3 prefix + orderedDepts + 1 suffix

    // Filters and Titles
    ws.addRow(['DEPARTMENT WISE INVENTORY REPORT']);
    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = 'DEPARTMENT WISE INVENTORY REPORT';
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const dateRange = `${reportData.generated_at}`;
    const catName = categories.find(c => c.id === filters.categoryId)?.name || 'All Categories';
    const depts = filters.departmentIds.length > 0 ? departments.filter(d => filters.departmentIds.includes(d.id)).map(d => d.name).join(', ') : 'All';
    const searchVal = filters.search || 'None';
    const stockOnlyVal = filters.onlyWithStock ? 'Yes' : 'No';

    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]); // Empty row 4

    // Date/Time (Left)
    ws.mergeCells(2, 1, 2, 2);
    const cellDate = ws.getCell(2, 1);
    cellDate.value = { richText: [{ font: { bold: true }, text: 'Report Time: ' }, { text: dateRange }] };
    cellDate.alignment = { horizontal: 'left', vertical: 'middle' };

    // Category (Center)
    ws.mergeCells(2, 3, 2, 5);
    const cellCat = ws.getCell(2, 3);
    cellCat.value = { richText: [{ font: { bold: true }, text: 'Category: ' }, { text: catName }] };
    cellCat.alignment = { horizontal: 'center', vertical: 'middle' };

    // Depts (Left)
    ws.mergeCells(3, 1, 3, 2);
    const cellDept = ws.getCell(3, 1);
    cellDept.value = { richText: [{ font: { bold: true }, text: 'Department: ' }, { text: depts }] };
    cellDept.alignment = { horizontal: 'left', vertical: 'middle' };

    // Search (Center)
    ws.mergeCells(3, 3, 3, 5);
    const cellSearch = ws.getCell(3, 3);
    cellSearch.value = { richText: [{ font: { bold: true }, text: 'Search: ' }, { text: searchVal }] };
    cellSearch.alignment = { horizontal: 'center', vertical: 'middle' };

    // Stock Only (Right)
    ws.mergeCells(3, 6, 3, totalCols);
    const cellStock = ws.getCell(3, 6);
    cellStock.value = { richText: [{ font: { bold: true }, text: 'Stock Only: ' }, { text: stockOnlyVal }] };
    cellStock.alignment = { horizontal: 'right', vertical: 'middle' };

    ws.getRow(2).height = 20;
    ws.getRow(3).height = 20;

    // First Header Row (Institutions)
    const instHeaderRow = ['S.No', 'Material Name', 'UOM'];
    reportData.institutions.forEach(inst => {
      instHeaderRow.push(inst.name);
      for(let i=1; i<inst.departments.length; i++) instHeaderRow.push('');
    });
    instHeaderRow.push('Total Inventory');
    ws.addRow(instHeaderRow);
    const instHeaderIdx = 5;

    // Second Header Row (Depts)
    const deptHeaderRow = ['', '', ''];
    reportData.institutions.forEach(inst => {
      inst.departments.forEach(d => deptHeaderRow.push(d));
    });
    deptHeaderRow.push('');
    ws.addRow(deptHeaderRow);
    const deptHeaderIdx = 6;

    // Merge Cells for headers
    ws.mergeCells(instHeaderIdx, 1, deptHeaderIdx, 1); // S.No
    ws.mergeCells(instHeaderIdx, 2, deptHeaderIdx, 2); // Material
    ws.mergeCells(instHeaderIdx, 3, deptHeaderIdx, 3); // UOM
    ws.mergeCells(instHeaderIdx, totalCols, deptHeaderIdx, totalCols); // Total

    let currentCol = 4;
    reportData.institutions.forEach(inst => {
      if (inst.departments.length > 1) {
        ws.mergeCells(instHeaderIdx, currentCol, instHeaderIdx, currentCol + inst.departments.length - 1);
      }
      currentCol += inst.departments.length;
    });

    ws.getRow(deptHeaderIdx).height = 140;

    const border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    // Formatting Headers
    for (let c = 1; c <= totalCols; c++) {
      const cell1 = ws.getCell(instHeaderIdx, c);
      const cell2 = ws.getCell(deptHeaderIdx, c);
      cell1.fill = headerFill; cell1.border = border; cell1.font = { bold: true };
      cell2.fill = headerFill; cell2.border = border; cell2.font = { bold: true };

      if (c <= 3 || c === totalCols) {
        cell1.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
        cell2.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
      } else {
        cell1.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
        cell2.alignment = { textRotation: 90, vertical: 'bottom', horizontal: 'center', wrapText: true };
      }
    }

    // Data Rows
    reportData.data.forEach((row, i) => {
      const rowData = [i + 1, `${row.material_code} - ${row.material_name}`, row.uom];
      orderedDepts.forEach(d => {
        rowData.push(row.department_inventory[d] || '');
      });
      rowData.push(row.total_inventory || 0);
      ws.addRow(rowData);
    });

    // Totals Row
    const totals = calculateTotals(reportData.data, orderedDepts);
    const totalRow = ['', 'Grand Total', ''];
    orderedDepts.forEach(d => totalRow.push(totals[d] || ''));
    totalRow.push(totals.total_inventory || 0);
    ws.addRow(totalRow);

    // Formatting Data Rows
    const lastRowIdx = deptHeaderIdx + reportData.data.length + 1;
    for (let r = deptHeaderIdx + 1; r <= lastRowIdx; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.border = border;

        if (r === lastRowIdx) {
          cell.font = { bold: true };
        }

        if (c === 2 || c === 3) {
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
    ws.getColumn(3).width = 15; // UOM
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

    const orderedDepts = [];
    reportData.institutions.forEach(inst => inst.departments.forEach(d => orderedDepts.push(d)));

    const headers = [
      'S.No', 'Material Name', 'UOM',
      ...orderedDepts,
      'Total Inventory'
    ];

    const body = reportData.data.map((row, index) => {
      const rowData = [
        index + 1,
        `${row.material_code} - ${row.material_name}`,
        row.uom
      ];
      orderedDepts.forEach(d => rowData.push(formatQty(row.department_inventory[d] || 0)));
      rowData.push(formatQty(row.total_inventory));
      return rowData;
    });

    const totals = calculateTotals(reportData.data, orderedDepts);
    const footer = [
      '', 'Grand Total', '',
      ...orderedDepts.map(d => formatQty(totals[d])),
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Institution</InputLabel>
              <Select value={filters.institutionId} label="Institution" onChange={e => setFilters({ ...filters, institutionId: e.target.value, departmentIds: [] })}>
                <MenuItem value="">All Institutions</MenuItem>
                {institutions.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>)}
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
          <Grid item xs={12} sm={6} md={2}>
            <TextField size="small" fullWidth label="Material Search" placeholder="Code / Name" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
                  <TableRow sx={{ '& th': { background: '#F8FAFC', fontWeight: 700, color: '#1E293B', py: 1.5, borderBottom: 'none' } }}>
                    <TableCell align="center" rowSpan={2} sx={stickyStyle(0, true)}>S.No</TableCell>
                    <TableCell sx={{ ...stickyStyle(50, true), minWidth: 250 }} rowSpan={2}>Material Name</TableCell>
                    <TableCell align="center" rowSpan={2} sx={stickyStyle(300, true)}>UOM</TableCell>

                    {reportData.institutions.map((inst, i) => (
                      <TableCell key={i} align="center" colSpan={inst.departments.length} sx={{ borderBottom: '1px solid #CBD5E1' }}>
                        {inst.name}
                      </TableCell>
                    ))}

                    <TableCell align="center" rowSpan={2} sx={{ background: '#F1F5F9', fontWeight: 800 }}>Total Inventory</TableCell>
                  </TableRow>
                  <TableRow sx={{ '& th': { background: '#F8FAFC', fontWeight: 700, color: '#1E293B', py: 1.5, borderTop: 'none' } }}>
                    {reportData.institutions.map(inst => inst.departments.map((dept, i) => (
                      <TableCell key={`${inst.name}-${dept}-${i}`} align="center" sx={{ minWidth: 80, p: 1 }}>
                        <Typography sx={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          maxHeight: 150,
                          mx: 'auto'
                        }}>
                          {dept}
                        </Typography>
                      </TableCell>
                    )))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                    <TableRow key={row.material_id} hover>
                      <TableCell align="center" sx={stickyStyle(0, false)}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ ...stickyStyle(50, false), minWidth: 250 }}>
                        {row.material_code} - {row.material_name}
                      </TableCell>
                      <TableCell align="center" sx={stickyStyle(300, false)}>{row.uom}</TableCell>

                      {reportData.institutions.map(inst => inst.departments.map((dept, i) => (
                        <TableCell key={`${inst.name}-${dept}-${i}`} align="center">
                          {formatQty(row.department_inventory[dept] || '')}
                        </TableCell>
                      )))}

                      <TableCell align="center" sx={{ fontWeight: 700, background: '#F8FAFC' }}>
                        {formatQty(row.total_inventory)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  {(() => {
                    const orderedDepts = [];
                    reportData.institutions.forEach(inst => inst.departments.forEach(d => orderedDepts.push(d)));
                    const totals = calculateTotals(reportData.data, orderedDepts);
                    return (
                      <TableRow sx={{ background: '#F8FAFC', '& td': { fontWeight: 800, color: '#1E293B' } }}>
                        <TableCell colSpan={3} align="right" sx={stickyStyle(0, false)}>DEPARTMENT TOTALS</TableCell>
                        {orderedDepts.map((d, i) => (
                          <TableCell key={i} align="center">{formatQty(totals[d])}</TableCell>
                        ))}
                        <TableCell align="center" sx={{ background: '#E2E8F0' }}>{formatQty(totals.total_inventory)}</TableCell>
                      </TableRow>
                    )
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={reportData.data.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[50, 100, 250, 500]}
            />
          </Card>

          <Box sx={{ mt: 2, display: 'none', '@media print': { display: 'flex', justifyContent: 'space-between' } }}>
            <Typography variant="caption">Generated by: {reportData.generated_by}</Typography>
            <Typography variant="caption">Eastpoint Smart Campus | Powered by NissiGrid Technologies</Typography>
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
