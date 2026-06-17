import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, CircularProgress, Chip
} from '@mui/material';
import { Search, Assessment, FileDownload, PictureAsPdf, Print, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

export default function PendingGatepassReturnsReport() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    vendorId: '',
    search: '',
  });

  useEffect(() => {
    api.get('/api/vendors').then(r => setVendors(r.data)).catch(() => {});
    // Auto-generate on mount
    handleGenerate({ fromDate: null, toDate: null, vendorId: '', search: '' });
  }, []);

  const handleGenerate = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.fromDate) params.from_date = currentFilters.fromDate.format('YYYY-MM-DD');
      if (currentFilters.toDate) params.to_date = currentFilters.toDate.format('YYYY-MM-DD');
      if (currentFilters.vendorId) params.vendor_id = currentFilters.vendorId;
      if (currentFilters.search) params.search = currentFilters.search;

      const res = await api.get('/api/reports/pending-gatepass-returns', { params });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultFilters = {
      fromDate: null,
      toDate: null,
      vendorId: '',
      search: '',
    };
    setFilters(defaultFilters);
    handleGenerate(defaultFilters);
  };

  const fmtQty = (v) => v != null ? Math.round(Number(v)).toLocaleString('en-IN') : '0';

  const handleExportExcel = async () => {
    if (!reportData) return;
    
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Pending Gatepass Returns');
    
    ws.addRow(['PENDING GATEPASS RETURNS REPORT']);
    ws.addRow([`Generated On: ${reportData.generated_at}`]);
    ws.addRow([]);
    
    const headers = [
      'S.No', 'Date', 'Gate Pass No', 'Vendor', 'Material Code', 'Material Name', 
      'Qty', 'UOM', 'From Location', 'Driver / Vehicle', 'Status', 'Age (Days)'
    ];
    ws.addRow(headers);
    
    reportData.data.forEach((row, i) => {
      ws.addRow([
        i + 1,
        row.gate_pass_date,
        row.gate_pass_number,
        row.vendor_name,
        row.material_code,
        row.material_name,
        row.quantity,
        row.uom_name,
        row.from_location,
        `${row.driver_name || '-'} / ${row.vehicle_number || '-'}`,
        row.status,
        row.age_days
      ]);
    });

    // Formatting Header
    const headerRow = ws.getRow(4);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    
    ws.getColumn(1).width = 6;
    ws.getColumn(2).width = 15;
    ws.getColumn(3).width = 20;
    ws.getColumn(4).width = 35;
    ws.getColumn(5).width = 15;
    ws.getColumn(6).width = 35;
    ws.getColumn(7).width = 10;
    ws.getColumn(8).width = 10;
    ws.getColumn(9).width = 20;
    ws.getColumn(10).width = 25;
    ws.getColumn(11).width = 15;
    ws.getColumn(12).width = 10;
    
    ws.getCell('A1').font = { size: 14, bold: true };
    ws.getCell('A2').font = { size: 11, bold: true };
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Pending_Gatepass_Returns_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    doc.setFontSize(16);
    doc.text('PENDING GATEPASS RETURNS REPORT', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated On: ${reportData.generated_at}`, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    const head = [[
      'S.No', 'Date', 'Gate Pass No', 'Vendor', 'Material', 'UOM', 'Qty', 'Location', 'Age (Days)'
    ]];
    
    const body = reportData.data.map((row, i) => [
      i + 1,
      row.gate_pass_date,
      row.gate_pass_number,
      row.vendor_name,
      `${row.material_code} - ${row.material_name}`,
      row.uom_name,
      fmtQty(row.quantity),
      row.from_location,
      row.age_days
    ]);

    autoTable(doc, {
      head: head,
      body: body,
      startY: 80,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    doc.save(`Pending_Gatepass_Returns_${dayjs().format('YYYYMMDD')}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Yet to Receive': return 'warning';
      case 'Pending Repair': return 'error';
      case 'Partially Received': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E3A8A', letterSpacing: 1 }}>
          PENDING GATEPASS RETURNS
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#64748B' }}>
          TRACK RETURNABLE ITEMS NOT YET RECEIVED
        </Typography>
      </Box>

      <Card sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2.5}>
            <DatePicker label="From Date" value={filters.fromDate} onChange={d => setFilters({ ...filters, fromDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true } }} format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <DatePicker label="To Date" value={filters.toDate} onChange={d => setFilters({ ...filters, toDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true } }} format="DD-MMM-YYYY" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select value={filters.vendorId} label="Vendor" onChange={e => setFilters({ ...filters, vendorId: e.target.value })}>
                <MenuItem value="">All Vendors</MenuItem>
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField size="small" fullWidth label="Search" placeholder="Gate Pass No, Vendor, Material"
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} size="small">Reset</Button>
              <Button variant="contained" startIcon={<Search />} onClick={() => handleGenerate()} disabled={loading} size="small">
                {loading ? <CircularProgress size={20} /> : 'Search'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {reportData && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
          <Button variant="contained" color="success" size="small" startIcon={<FileDownload />} onClick={handleExportExcel}>Excel</Button>
          <Button variant="contained" color="error" size="small" startIcon={<PictureAsPdf />} onClick={handleExportPDF}>PDF</Button>
          <Button variant="contained" color="secondary" size="small" startIcon={<Print />} onClick={() => window.print()}>Print</Button>
        </Box>
      )}

      <Card sx={{ borderRadius: 1, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table size="small" stickyHeader sx={{ 
            '& th': { background: '#F8FAFC', fontWeight: 700, fontSize: '0.8rem' },
            '& td': { fontSize: '0.8rem', p: 1 }
          }}>
            <TableHead>
              <TableRow>
                <TableCell>S.No</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Gate Pass No</TableCell>
                <TableCell>Vendor Name</TableCell>
                <TableCell>Material</TableCell>
                <TableCell align="center">UOM</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="center">Age (Days)</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell>
                </TableRow>
              )}
              {!loading && reportData?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 5, color: '#64748B' }}>No pending gatepass returns found matching the criteria.</TableCell>
                </TableRow>
              )}
              {!loading && reportData?.data.map((row, idx) => (
                <TableRow key={idx} hover sx={{ '&:hover': { background: '#F1F5F9' } }}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.gate_pass_date}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.gate_pass_number}</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1E293B' }}>{row.vendor_name}</Typography>
                    {row.driver_name && (
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        Driver: {row.driver_name} | Veh: {row.vehicle_number}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.material_code} - {row.material_name}</Typography>
                  </TableCell>
                  <TableCell align="center">{row.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmtQty(row.quantity)}</TableCell>
                  <TableCell>{row.from_location}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={row.age_days} 
                      size="small" 
                      color={row.age_days > 30 ? 'error' : row.age_days > 15 ? 'warning' : 'default'}
                      sx={{ fontWeight: 700, minWidth: 40 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={getStatusColor(row.status)} sx={{ fontSize: '0.7rem', height: 20 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
