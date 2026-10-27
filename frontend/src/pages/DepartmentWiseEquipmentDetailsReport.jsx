import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, OutlinedInput, ListSubheader, TextField, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Paper, Divider, Stack
} from '@mui/material';
import {
  Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh,
  Close, OpenInNew, PrecisionManufacturing, Build, CheckCircle, Warning, PhotoCamera
} from '@mui/icons-material';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api, { getFileUrl } from '../services/api';
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
  const [selectedEquipment, setSelectedEquipment] = useState(null);

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
                        <TableRow 
                          key={`eq-${d_idx}-${e_idx}`} 
                          hover
                          onClick={() => setSelectedEquipment(eq)}
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            '&:hover': { bgcolor: '#F0F9FF !important' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#0284C7' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <span>{eq.equipment_name}</span>
                              <OpenInNew sx={{ fontSize: '0.85rem', opacity: 0.7 }} />
                            </Box>
                          </TableCell>
                          <TableCell>{eq.make}</TableCell>
                          <TableCell>{eq.model}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{eq.serial_number}</TableCell>
                          <TableCell>{eq.last_pm_date}</TableCell>
                          <TableCell>{eq.next_pm_due_date}</TableCell>
                          <TableCell>{eq.last_calibration_date}</TableCell>
                          <TableCell>{eq.next_calibration_due_date}</TableCell>
                          <TableCell>
                            <Chip 
                              label={eq.status} 
                              size="small" 
                              color={eq.status === 'Operational' ? 'success' : (eq.status === 'Under Repair' ? 'warning' : 'default')}
                              sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                            />
                          </TableCell>
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

      {/* Equipment Details Popup Modal */}
      <Dialog 
        open={!!selectedEquipment} 
        onClose={() => setSelectedEquipment(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#E0F2FE', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PrecisionManufacturing sx={{ color: '#0284C7', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {selectedEquipment?.equipment_name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Code: <strong>{selectedEquipment?.equipment_code}</strong> | Serial No: <strong>{selectedEquipment?.serial_number || 'N/A'}</strong>
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedEquipment(null)} size="small" sx={{ color: '#64748B' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedEquipment && (
            <Stack spacing={2.5}>
              
              {/* Status & Location Banner */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>DEPARTMENT / LOCATION</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>{selectedEquipment.department_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>INSTITUTION</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#1E293B' }}>{selectedEquipment.institution_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 600 }}>CURRENT STATUS</Typography>
                  <Chip 
                    label={selectedEquipment.status} 
                    color={selectedEquipment.status === 'Operational' ? 'success' : (selectedEquipment.status === 'Under Repair' ? 'warning' : 'default')}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              </Paper>

              {/* Specifications Card */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Equipment Specifications
                </Typography>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: '25%', bgcolor: '#F8FAFC' }}>Make</TableCell>
                        <TableCell sx={{ width: '25%' }}>{selectedEquipment.make || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: '25%', bgcolor: '#F8FAFC' }}>Model</TableCell>
                        <TableCell sx={{ width: '25%' }}>{selectedEquipment.model || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Serial Number</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedEquipment.serial_number || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Category</TableCell>
                        <TableCell>{selectedEquipment.equipment_category || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Procurement Type</TableCell>
                        <TableCell>{selectedEquipment.procurement_type || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Installation Date</TableCell>
                        <TableCell>{selectedEquipment.installation_date || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              {/* Procurement & Financials */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Procurement & Financial Details
                </Typography>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: '25%', bgcolor: '#F8FAFC' }}>PO Number</TableCell>
                        <TableCell sx={{ width: '25%' }}>{selectedEquipment.po_number || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: '25%', bgcolor: '#F8FAFC' }}>GRN Number</TableCell>
                        <TableCell sx={{ width: '25%' }}>{selectedEquipment.grn_number || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Equipment Cost</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {selectedEquipment.equipment_cost != null ? `₹${selectedEquipment.equipment_cost.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Year of Purchase</TableCell>
                        <TableCell>{selectedEquipment.year_of_purchase || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              {/* Maintenance & Warranty */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Maintenance & Service Status
                </Typography>
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: '25%', bgcolor: '#F8FAFC' }}>Warranty Status</TableCell>
                        <TableCell sx={{ width: '25%' }}>
                          {selectedEquipment.warranty_available ? (
                            <Chip label="Under Warranty" color="success" size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
                          ) : (
                            <Chip label="No Warranty" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', width: '25%', bgcolor: '#F8FAFC' }}>Warranty Expiry</TableCell>
                        <TableCell sx={{ width: '25%' }}>{selectedEquipment.warranty_expiry_date || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>AMC / CMC</TableCell>
                        <TableCell>
                          {selectedEquipment.amc_cmc_required ? (
                            <Chip label={selectedEquipment.amc_cmc_status || 'Required'} color="primary" size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
                          ) : 'Not Applicable'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Contract Period</TableCell>
                        <TableCell>
                          {selectedEquipment.amc_cmc_start_date !== '-' || selectedEquipment.amc_cmc_end_date !== '-' 
                            ? `${selectedEquipment.amc_cmc_start_date} to ${selectedEquipment.amc_cmc_end_date}` 
                            : '-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Last PM Date</TableCell>
                        <TableCell>{selectedEquipment.last_pm_date || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Next PM Due</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#0284C7' }}>{selectedEquipment.next_pm_due_date || '-'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Last Calibration</TableCell>
                        <TableCell>{selectedEquipment.last_calibration_date || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748B', bgcolor: '#F8FAFC' }}>Next Calibration Due</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#D97706' }}>{selectedEquipment.next_calibration_due_date || '-'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              {/* Photos (if available) */}
              {((selectedEquipment.equipment_photos && selectedEquipment.equipment_photos.length > 0) || selectedEquipment.equipment_photo_url) && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Equipment Photos
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {selectedEquipment.equipment_photos && selectedEquipment.equipment_photos.length > 0 ? (
                      selectedEquipment.equipment_photos.map((photo, pIdx) => (
                        <Box 
                          key={pIdx} 
                          component="img" 
                          src={getFileUrl(photo.url || photo)} 
                          alt="Equipment" 
                          sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 2, border: '1px solid #E2E8F0' }} 
                        />
                      ))
                    ) : (
                      selectedEquipment.equipment_photo_url && (
                        <Box 
                          component="img" 
                          src={getFileUrl(selectedEquipment.equipment_photo_url)} 
                          alt="Equipment" 
                          sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 2, border: '1px solid #E2E8F0' }} 
                        />
                      )
                    )}
                  </Box>
                </Box>
              )}

            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
          <Button 
            onClick={() => setSelectedEquipment(null)} 
            variant="contained" 
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600, bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
