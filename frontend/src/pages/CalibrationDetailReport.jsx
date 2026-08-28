import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  IconButton, Tooltip, Grid, Card, CardContent
} from '@mui/material';
import {
  FileDownload, PictureAsPdf, Print, Search, Clear, Refresh
} from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

export default function CalibrationDetailReport() {
  const { showMessage } = useMessage();
  
  // Filters
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate.format('YYYY-MM-DD');
      if (toDate) params.to_date = toDate.format('YYYY-MM-DD');
      if (department) params.department = department;
      if (search) params.search = search;

      const res = await api.get('/api/reports/calibration-details', { params });
      setReportData(res.data);
    } catch (err) {
      console.error("Error fetching calibration report:", err);
      showMessage("Failed to fetch report data", "Error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFromDate(null);
    setToDate(null);
    setDepartment('');
    setSearch('');
    setReportData(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return '#10B981';
      case 'Breakdown': return '#EF4444';
      case 'In Store': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const handleExportExcel = async () => {
    if (!reportData?.data?.length) return;
    setIsExportingExcel(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Calibration Details');

      // Title
      ws.addRow(['Calibration Detail Report']);
      ws.mergeCells('A1:J1');
      ws.getCell('A1').font = { size: 16, bold: true };
      ws.getCell('A1').alignment = { horizontal: 'center' };
      ws.addRow([]);

      // Metadata
      let filterText = [];
      if (fromDate) filterText.push(`From Due Date: ${fromDate.format('DD-MMM-YYYY')}`);
      if (toDate) filterText.push(`To Due Date: ${toDate.format('DD-MMM-YYYY')}`);
      if (department) filterText.push(`Department: ${department}`);
      
      if (filterText.length > 0) {
        ws.addRow(['Filters:', filterText.join(' | ')]);
      }
      ws.addRow(['Generated:', reportData.generated_at]);
      ws.addRow([]);

      // Headers
      const headers = [
        'Equipment Code', 'Equipment Name', 'Make', 'Model', 'Serial Number',
        'Department', 'Last Calibration Date', 'Next Due Date', 'Status'
      ];
      const headerRow = ws.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Data
      reportData.data.forEach(row => {
        ws.addRow([
          row.equipment_code,
          row.equipment_name,
          row.make,
          row.model,
          row.serial_number,
          row.department,
          row.last_calibration_date,
          row.next_calibration_due_date,
          row.status
        ]);
      });

      // Columns width
      ws.columns.forEach(col => { col.width = 18; });
      ws.getColumn(2).width = 30;

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Calibration_Detail_Report_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`);
    } catch (err) {
      console.error("Excel Export Error:", err);
      showMessage("Failed to export Excel", "Error", "error");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportData?.data?.length) return;
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF('l', 'pt', 'a4'); // Landscape

      doc.setFontSize(18);
      doc.text('Calibration Detail Report', 40, 40);

      doc.setFontSize(10);
      let yPos = 60;
      doc.text(`Generated: ${reportData.generated_at}`, 40, yPos);
      
      let filterText = [];
      if (fromDate) filterText.push(`From Due Date: ${fromDate.format('DD-MMM-YYYY')}`);
      if (toDate) filterText.push(`To Due Date: ${toDate.format('DD-MMM-YYYY')}`);
      if (department) filterText.push(`Dept: ${department}`);
      
      if (filterText.length > 0) {
        yPos += 15;
        doc.text(`Filters: ${filterText.join(' | ')}`, 40, yPos);
      }

      const tableData = reportData.data.map(row => [
        row.equipment_code,
        row.equipment_name,
        row.make,
        row.model,
        row.serial_number,
        row.department,
        row.last_calibration_date,
        row.next_calibration_due_date,
        row.status
      ]);

      doc.autoTable({
        startY: yPos + 20,
        head: [['Eq Code', 'Name', 'Make', 'Model', 'Serial No', 'Department', 'Last Cal.', 'Next Due', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 8 },
        columnStyles: { 1: { cellWidth: 100 } }
      });

      doc.save(`Calibration_Detail_Report_${dayjs().format('YYYYMMDD_HHmm')}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      showMessage("Failed to export PDF", "Error", "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1E293B', mb: 0.5 }}>
            Calibration Detail Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            List of equipment requiring calibration and their due dates.
          </Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Search (Eq Code, Name, S/N)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                size="small"
                fullWidth
                label="Department"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="From Due Date"
                value={fromDate}
                onChange={setFromDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                format="DD-MMM-YYYY"
                localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="To Due Date"
                value={toDate}
                onChange={setToDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                format="DD-MMM-YYYY"
                localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Button variant="outlined" startIcon={<Refresh />} onClick={handleClear}>
                  Reset
                </Button>
                <Button 
                  variant="contained" 
                  onClick={fetchReport}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                >
                  Generate Report
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1E293B' }}>
            Report Data
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownload />}
              onClick={handleExportExcel}
              disabled={!reportData || isExportingExcel}
              sx={{ color: '#0F172A', borderColor: '#0F172A' }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<PictureAsPdf />}
              onClick={handleExportPDF}
              disabled={!reportData || isExportingPDF}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="info"
              startIcon={<Print />}
              onClick={() => window.print()}
              disabled={!reportData}
            >
              Print
            </Button>
          </Box>
        </Box>

        <Box id="report-print-container" sx={{ '& @media print': { m: 0, p: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Eq Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Make/Model</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Serial No</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Last Cal.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Next Due</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                )}
                {!loading && reportData && reportData.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#94A3B8' }}>
                      No equipment requires calibration based on the selected filters.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !reportData && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#94A3B8' }}>
                      Select filters and click "Generate" to view report
                    </TableCell>
                  </TableRow>
                )}
                
                {reportData && reportData.data.map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{row.equipment_code}</TableCell>
                    <TableCell>{row.equipment_name}</TableCell>
                    <TableCell>
                      {row.make !== '-' || row.model !== '-' ? (
                        <Box>
                          <Typography variant="body2">{row.make}</Typography>
                          <Typography variant="caption" color="textSecondary">{row.model}</Typography>
                        </Box>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{row.serial_number}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.last_calibration_date}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: row.next_calibration_due_date !== '-' && new Date(row.next_calibration_due_date) < new Date() ? '#EF4444' : 'inherit' }}>
                      {row.next_calibration_due_date}
                    </TableCell>
                    <TableCell>
                      <Box sx={{
                        px: 1, py: 0.5, borderRadius: 1, display: 'inline-block',
                        backgroundColor: `${getStatusColor(row.status)}15`,
                        color: getStatusColor(row.status),
                        fontSize: '12px', fontWeight: 'bold'
                      }}>
                        {row.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {reportData && (
            <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Total Equipment: {reportData.total_count}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Generated: {reportData.generated_at}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
