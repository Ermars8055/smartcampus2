import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, OutlinedInput, ListSubheader, TextField, CircularProgress
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
import { useMessage } from '../context/MessageContext';

export default function DepartmentWiseEquipmentDetailsReport() {
  const { showMessage } = useMessage();
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setAllDepartments] = useState([]);
  const [deptSearch, setDeptSearch] = useState('');

  const [filters, setFilters] = useState({
    categoryId: '',
    institutionId: '',
    departmentIds: [],
    search: ''
  });

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {});
    api.get('/api/institutions').then(r => setInstitutions(r.data)).catch(() => {});
    api.get('/api/configurations/locations').then(r => setAllDepartments(r.data)).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.categoryId) params.category_id = filters.categoryId;
      if (filters.institutionId) params.institution_id = filters.institutionId;
      if (filters.departmentIds.length > 0) params.department_id = filters.departmentIds.join(',');
      if (filters.search) params.search = filters.search;

      const res = await api.get('/api/reports/department-equipment-details', { params });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      showMessage("Failed to fetch report data", 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      categoryId: '',
      institutionId: '',
      departmentIds: [],
      search: ''
    });
    setReportData(null);
  };

  const handleExportExcel = async () => {
    if (!reportData?.departments.length) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Detailed Equipment');

    const totalCols = 9;

    ws.addRow(['DEPARTMENT-WISE EQUIPMENT DETAILS REPORT']);
    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const dateRange = `${reportData.generated_at}`;
    
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);

    ws.mergeCells(2, 1, 2, 3);
    const cellDate = ws.getCell(2, 1);
    cellDate.value = { richText: [{ font: { bold: true }, text: 'Report Time: ' }, { text: dateRange }] };
    
    const headers = [
      'Equipment Name', 'Make', 'Model', 'Serial Number',
      'Last PM Date', 'Next PM Date',
      'Last Cal Date', 'Next Cal Date', 'Status'
    ];
    
    ws.addRow(headers);
    const headerRow = ws.getRow(5);
    headerRow.font = { bold: true };
    for (let i = 1; i <= totalCols; i++) {
        headerRow.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        headerRow.getCell(i).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    }

    reportData.departments.forEach(dept => {
      const deptRow = ws.addRow([`${dept.department_name} (Total: ${dept.equipment_count})`]);
      ws.mergeCells(deptRow.number, 1, deptRow.number, totalCols);
      deptRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      deptRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
      
      dept.equipments.forEach(eq => {
        const row = ws.addRow([
          eq.equipment_name,
          eq.make,
          eq.model,
          eq.serial_number,
          eq.last_pm_date,
          eq.next_pm_due_date,
          eq.last_calibration_date,
          eq.next_calibration_due_date,
          eq.status
        ]);
        for (let i = 1; i <= totalCols; i++) {
          row.getCell(i).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
      });
    });

    ws.getColumn(1).width = 30;
    ws.getColumn(2).width = 15;
    ws.getColumn(3).width = 15;
    ws.getColumn(4).width = 15;
    ws.getColumn(5).width = 15;
    ws.getColumn(6).width = 15;
    ws.getColumn(7).width = 15;
    ws.getColumn(8).width = 15;
    ws.getColumn(9).width = 15;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Detailed_Equipment_Report_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData?.departments.length) return;
    const doc = new jsPDF('landscape');

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text('DEPARTMENT-WISE EQUIPMENT DETAILS REPORT', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`REPORT AS ON: ${reportData.generated_at}`, pageWidth / 2, 22, { align: 'center' });

    const headers = [
      'Equipment Name', 'Make', 'Model', 'Serial Number',
      'Last PM', 'Next PM',
      'Last Cal', 'Next Cal', 'Status'
    ];

    const body = [];
    reportData.departments.forEach(dept => {
      body.push([{ content: `${dept.department_name} (Total Equipments: ${dept.equipment_count})`, colSpan: 9, styles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
      
      dept.equipments.forEach(eq => {
        body.push([
          eq.equipment_name,
          eq.make,
          eq.model,
          eq.serial_number,
          eq.last_pm_date,
          eq.next_pm_due_date,
          eq.last_calibration_date,
          eq.next_calibration_due_date,
          eq.status
        ]);
      });
    });

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`Detailed_Equipment_Report_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, '@media print': { display: 'none' } }}>
        <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" /> Department-Wise Equipment Details Report
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ p: 2, mb: 3, '@media print': { display: 'none' } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Material Category</InputLabel>
              <Select displayEmpty value={filters.categoryId} label="Material Category" onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel shrink>Institution</InputLabel>
              <Select displayEmpty value={filters.institutionId} label="Institution" onChange={e => setFilters({ ...filters, institutionId: e.target.value, departmentIds: [] })}>
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
                {departments.filter(d => (d.location_name || d.name || '').toLowerCase().includes((deptSearch || '').toLowerCase())).map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    <Checkbox checked={filters.departmentIds.indexOf(d.id) > -1} />
                    <ListItemText primary={d.location_name || d.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField size="small" fullWidth label="Search" placeholder="Code / Name / Serial" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
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
      {reportData && reportData.departments && reportData.departments.length > 0 && (
        <Box sx={{ '@media print': { mt: 0 } }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5, letterSpacing: '0.05em' }}>
              DEPARTMENT-WISE EQUIPMENT DETAILS REPORT
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: 600 }}>
              REPORT AS ON : {reportData.generated_at}
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 0, boxShadow: 'none', border: '1px solid #E2E8F0' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', '@media print': { maxHeight: 'none', overflow: 'visible' } }}>
              <Table size="small" sx={{ borderCollapse: 'collapse', '& th, & td': { border: '1px solid #CBD5E1', padding: '6px 10px', fontSize: '0.85rem' } }} stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { background: '#F8FAFC', fontWeight: 700, color: '#1E293B', py: 1.5 } }}>
                    <TableCell>Equipment Name</TableCell>
                    <TableCell>Make</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Serial Number</TableCell>
                    <TableCell>Last PM</TableCell>
                    <TableCell>Next PM</TableCell>
                    <TableCell>Last Cal</TableCell>
                    <TableCell>Next Cal</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.departments.map((dept, d_idx) => (
                    <React.Fragment key={`dept-${d_idx}`}>
                      <TableRow sx={{ background: '#475569' }}>
                        <TableCell colSpan={9} sx={{ color: '#FFF', fontWeight: 'bold' }}>
                          {dept.department_name} (Total Equipments: {dept.equipment_count})
                        </TableCell>
                      </TableRow>
                      {dept.equipments.map((eq, e_idx) => (
                        <TableRow key={`eq-${d_idx}-${e_idx}`} hover>
                          <TableCell>{eq.equipment_name}</TableCell>
                          <TableCell>{eq.make}</TableCell>
                          <TableCell>{eq.model}</TableCell>
                          <TableCell>{eq.serial_number}</TableCell>
                          <TableCell>{eq.last_pm_date}</TableCell>
                          <TableCell>{eq.next_pm_due_date}</TableCell>
                          <TableCell>{eq.last_calibration_date}</TableCell>
                          <TableCell>{eq.next_calibration_due_date}</TableCell>
                          <TableCell>{eq.status}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Box sx={{ mt: 2, display: 'none', '@media print': { display: 'flex', justifyContent: 'space-between' } }}>
            <Typography variant="caption">Generated by: {reportData.generated_by}</Typography>
            <Typography variant="caption">Eastpoint Smart Campus | Powered by NissiGrid Technologies</Typography>
          </Box>
        </Box>
      )}

      {reportData && reportData.departments && reportData.departments.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography color="textSecondary">No equipment data found for the selected filters.</Typography>
        </Box>
      )}
    </Box>
  );
}
