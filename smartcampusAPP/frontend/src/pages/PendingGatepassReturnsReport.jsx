import { useState, useEffect, Fragment } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, CircularProgress, Chip
} from '@mui/material';
import { Assessment, FileDownload, PictureAsPdf, Print, Refresh } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function PendingGatepassReturnsReport() {
  const { showMessage } = useMessage();
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
      showMessage('Failed to generate report', 'Error', 'error');
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
    const totalCols = 3 + reportData.vendors.length * 5;
    
    // Row 1: Titles
    ws.addRow(['PENDING GATEPASS RETURNS REPORT']);
    ws.mergeCells(1, 1, 1, totalCols);
    const titleCell = ws.getCell(1, 1);
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const genDate = `${reportData.generated_at}`;
    const vendorName = vendors.find(v => v.id === filters.vendorId)?.name || 'All Vendors';
    const searchVal = filters.search || 'None';

    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]); // Empty row 4

    // Generated (Left)
    ws.mergeCells(2, 1, 2, 3);
    const cellDate = ws.getCell(2, 1);
    cellDate.value = { richText: [{ font: { bold: true }, text: 'Generated On: ' }, { text: genDate }] };
    cellDate.alignment = { horizontal: 'left', vertical: 'middle' };

    // Vendor (Center)
    ws.mergeCells(2, 4, 2, 6);
    const cellVendor = ws.getCell(2, 4);
    cellVendor.value = { richText: [{ font: { bold: true }, text: 'Vendor: ' }, { text: vendorName }] };
    cellVendor.alignment = { horizontal: 'center', vertical: 'middle' };

    // Search (Right)
    ws.mergeCells(2, 7, 2, totalCols);
    const cellSearch = ws.getCell(2, 7);
    cellSearch.value = { richText: [{ font: { bold: true }, text: 'Search: ' }, { text: searchVal }] };
    cellSearch.alignment = { horizontal: 'right', vertical: 'middle' };

    ws.getRow(2).height = 20;

    // Row 5: Main Headers
    const headerRow1 = ['S.No', 'Material Name', 'UOM'];
    reportData.vendors.forEach(v => {
      headerRow1.push(`${v.name}`);
      headerRow1.push('', '', '', ''); // Merge spaces
    });
    ws.addRow(headerRow1);
    
    // Row 6: Sub Headers
    const headerRow2 = ['', '', ''];
    reportData.vendors.forEach(() => {
      headerRow2.push('GP No & Date', 'Qty', 'Location', 'Age (Days)', 'Status');
    });
    ws.addRow(headerRow2);
    
    // Data Rows
    reportData.data.forEach((row, i) => {
      const maxTxns = Math.max(1, ...reportData.vendors.map(v => row.vendor_details[v.id]?.transactions?.length || 0));
      
      for (let txnIdx = 0; txnIdx < maxTxns; txnIdx++) {
        const matRow = txnIdx === 0 ? [i + 1, `${row.material_code} - ${row.material_name}`, row.uom_name] : ['', '', ''];
        reportData.vendors.forEach(v => {
          const vData = row.vendor_details[v.id];
          const txn = vData?.transactions?.[txnIdx];
          
          if (txn) {
            const gpStr = `${txn.gate_pass_number}\ndt ${txn.gate_pass_date}`;
            matRow.push(gpStr, txn.quantity, txn.from_location, txn.age_days, txn.status);
          } else {
            matRow.push('-', '-', '-', '-', '-');
          }
        });
        ws.addRow(matRow);
      }
    });

    // Grand Total Row
    const totalRow = ['', 'GRAND TOTAL', ''];
    reportData.vendors.forEach(v => {
      const vTotalQty = reportData.data.reduce((acc, row) => {
          const txns = row.vendor_details[v.id]?.transactions || [];
          return acc + txns.reduce((sum, t) => sum + (t.quantity || 0), 0);
      }, 0);
      totalRow.push('', vTotalQty, '', '', '');
    });
    ws.addRow(totalRow);
    
    // Merges
    ws.mergeCells(5, 1, 6, 1); // S.No
    ws.mergeCells(5, 2, 6, 2); // Material Name
    ws.mergeCells(5, 3, 6, 3); // UOM
    
    reportData.vendors.forEach((v, i) => {
      const colStart = 4 + i * 5;
      ws.mergeCells(5, colStart, 5, colStart + 4);
    });
    
    // Formatting Header row 5 and 6
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    const border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    for (let col = 1; col <= totalCols; col++) {
      const cell5 = ws.getCell(5, col);
      const cell6 = ws.getCell(6, col);
      cell5.fill = headerFill;
      cell6.fill = headerFill;
      cell5.font = { bold: true };
      cell6.font = { bold: true };
      cell5.border = border;
      cell6.border = border;
      cell5.alignment = { horizontal: 'center', vertical: 'middle' };
    }
    
    // Formatting data rows
    const startDataRow = 7;
    const lastRow = ws.rowCount;
    for (let r = startDataRow; r <= lastRow; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= totalCols; c++) {
        const cell = row.getCell(c);
        cell.border = border;
        
        if (r === lastRow) { // Total row
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        }
        
        if (c === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        else if (c === 2) cell.alignment = { vertical: 'middle', wrapText: true };
        else if (c === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
        else {
           const colType = (c - 4) % 5;
           if (colType === 0) { // GP No
             cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
           } else if (colType === 1) { // Qty
             cell.alignment = { horizontal: 'right', vertical: 'middle' };
             if (typeof cell.value === 'number') cell.numFmt = '#,##0';
           } else {
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
           }
        }
      }
    }
    
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 35;
    ws.getColumn(3).width = 10;
    
    for (let i = 0; i < reportData.vendors.length; i++) {
      const start = 4 + i * 5;
      ws.getColumn(start).width = 15; // GP No
      ws.getColumn(start + 1).width = 8; // Qty
      ws.getColumn(start + 2).width = 15; // Location
      ws.getColumn(start + 3).width = 10; // Age
      ws.getColumn(start + 4).width = 15; // Status
    }
    
    // Title styling
    ws.mergeCells(ws.rowCount, 1, ws.rowCount, 3);
    const gtCell = ws.getCell(ws.rowCount, 1);
    gtCell.alignment = { horizontal: 'right', vertical: 'middle' };
    
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Pending_Gatepass_Returns_${dayjs().format('YYYYMMDD')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF('landscape', 'pt', 'a2');
    
    doc.setFontSize(18);
    doc.text('PENDING GATEPASS RETURNS REPORT', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated On: ${reportData.generated_at}`, doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });

    const head = [
      [
        { content: 'S.No', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'Material Name', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'UOM', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        ...reportData.vendors.map(v => ({ content: `${v.name}`, colSpan: 5, styles: { halign: 'center' } }))
      ],
      [
        ...reportData.vendors.map(() => ['GP No & Date', 'Qty', 'Location', 'Age (Days)', 'Status']).flat()
      ]
    ];
    
    const body = [];
    reportData.data.forEach((row, i) => {
      const maxTxns = Math.max(1, ...reportData.vendors.map(v => row.vendor_details[v.id]?.transactions?.length || 0));
      for (let txnIdx = 0; txnIdx < maxTxns; txnIdx++) {
         const matRow = txnIdx === 0 ? [i + 1, `${row.material_code} - ${row.material_name}`, row.uom_name] : ['', '', ''];
         reportData.vendors.forEach(v => {
           const vData = row.vendor_details[v.id];
           const txn = vData?.transactions?.[txnIdx];
           if (txn) {
             const gpStr = `${txn.gate_pass_number}\n${txn.gate_pass_date}`;
             matRow.push(gpStr, txn.quantity, txn.from_location, txn.age_days, txn.status);
           } else {
             matRow.push('-', '-', '-', '-', '-');
           }
         });
         body.push(matRow);
      }
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
        1: { cellWidth: 150 },
        2: { cellWidth: 40, halign: 'center' }
      }
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
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker label="From Date" value={filters.fromDate} onChange={d => setFilters({ ...filters, fromDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true } }} format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker label="To Date" value={filters.toDate} onChange={d => setFilters({ ...filters, toDate: d })}
              slotProps={{ textField: { size: "small", fullWidth: true } }} format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} />
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
          <Grid item xs={12} sm={6} md={2}>
            <TextField size="small" fullWidth label="Search" placeholder="Gate Pass No, Vendor"
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          
          <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={handleReset} size="small">Reset</Button>
              <Button variant="contained" startIcon={<Assessment />} onClick={() => handleGenerate()} disabled={loading} size="small">
                {loading ? <CircularProgress size={20} /> : 'Generate'}
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
            '& th, & td': { border: '1px solid #E2E8F0', fontSize: '0.75rem', p: 0.5 },
            '& th': { background: '#F8FAFC', fontWeight: 700, textAlign: 'center' }
          }}>
            {(reportData && reportData.data && reportData.data.length > 0) && (
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={2} sx={{ width: 40, background: '#F1F5F9' }}>S.No</TableCell>
                  <TableCell rowSpan={2} sx={{ minWidth: 200, background: '#F1F5F9', position: 'sticky', left: 0, zIndex: 3 }}>Material Name</TableCell>
                  <TableCell rowSpan={2} sx={{ width: 80, background: '#F1F5F9', textAlign: 'center' }}>UOM</TableCell>
                  {reportData?.vendors.map(v => (
                    <TableCell key={v.id} colSpan={5} sx={{ background: '#EFF6FF', color: '#1E40AF', borderBottom: '2px solid #3B82F6' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>{v.name}</Typography>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  {reportData?.vendors.map(v => (
                    <Fragment key={v.id}>
                      <TableCell sx={{ minWidth: 100 }}>GP No & Date</TableCell>
                      <TableCell sx={{ minWidth: 60 }}>Qty</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Location</TableCell>
                      <TableCell sx={{ minWidth: 60 }}>Age</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                    </Fragment>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {loading && <TableRow><TableCell colSpan={3 + (reportData?.vendors.length || 0) * 5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>}
              {!loading && reportData?.data.map((row, idx) => {
                const maxTxns = Math.max(1, ...reportData.vendors.map(v => row.vendor_details[v.id]?.transactions?.length || 0));
                
                return Array.from({ length: maxTxns }).map((_, txnIdx) => (
                  <TableRow key={`${row.material_id}-${txnIdx}`} hover>
                    {txnIdx === 0 && (
                      <>
                        <TableCell align="center" rowSpan={maxTxns}>{idx + 1}</TableCell>
                        <TableCell sx={{ position: 'sticky', left: 0, background: '#fff', zIndex: 2, fontWeight: 600 }} rowSpan={maxTxns}>
                          {row.material_code} - {row.material_name}
                        </TableCell>
                        <TableCell align="center" rowSpan={maxTxns}>{row.uom_name}</TableCell>
                      </>
                    )}
                    
                    {reportData.vendors.map(v => {
                      const vData = row.vendor_details[v.id];
                      const txn = vData?.transactions?.[txnIdx];
                      
                      if (!txn) {
                         if (!vData) {
                             if (txnIdx === 0) return <Fragment key={v.id}><TableCell colSpan={5} align="center" sx={{ color: '#CBD5E1' }} rowSpan={maxTxns}>-</TableCell></Fragment>;
                             return null;
                         }
                         return (
                           <Fragment key={v.id}>
                             <TableCell />
                             <TableCell />
                             <TableCell />
                             <TableCell />
                             <TableCell />
                           </Fragment>
                         );
                      }
                      
                      return (
                        <Fragment key={v.id}>
                          <TableCell sx={{ cursor: 'pointer', '&:hover': { background: '#F1F5F9' } }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{txn.gate_pass_number || '-'}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>dt {txn.gate_pass_date || '-'}</Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#0F172A' }}>{fmtQty(txn.quantity)}</TableCell>
                          <TableCell align="center">{txn.from_location}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={txn.age_days} 
                              size="small" 
                              color={txn.age_days > 30 ? 'error' : txn.age_days > 15 ? 'warning' : 'default'}
                              sx={{ fontWeight: 700, minWidth: 40 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={txn.status} size="small" color={getStatusColor(txn.status)} sx={{ fontSize: '0.7rem', height: 20 }} />
                          </TableCell>
                        </Fragment>
                      );
                    })}
                  </TableRow>
                ));
              })}
              {!loading && reportData && (
                <TableRow sx={{ background: '#F8FAFC', '& td': { fontWeight: 800, py: 1.5 } }}>
                  <TableCell colSpan={3} align="right">GRAND TOTAL</TableCell>
                  {reportData.vendors.map(v => {
                    const vTotalQty = reportData.data.reduce((acc, row) => {
                        const txns = row.vendor_details[v.id]?.transactions || [];
                        return acc + txns.reduce((sum, t) => sum + (t.quantity || 0), 0);
                    }, 0);
                    return (
                      <Fragment key={v.id}>
                        <TableCell />
                        <TableCell align="right">{fmtQty(vTotalQty)}</TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                      </Fragment>
                    );
                  })}
                </TableRow>
              )}
              {!loading && !reportData && (
                <TableRow><TableCell colSpan={3} align="center" sx={{ py: 10, color: '#94A3B8' }}>Select filters and click Generate to view the report</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
