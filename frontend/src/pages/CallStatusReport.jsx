import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, Paper, CircularProgress, Chip, Stack, TablePagination
} from '@mui/material';
import { Assessment, FileDownload, Refresh, Search } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

export default function CallStatusReport() {
  const { showMessage } = useMessage();
  const [loading, setLoading] = useState(false);
  
  // Default to last 30 days
  const [filters, setFilters] = useState({
    startDate: dayjs().subtract(30, 'day'),
    endDate: dayjs()
  });

  const [summary, setSummary] = useState({
    AMC: 0,
    CMC: 0,
    Warranty: 0,
    'Out of Warranty': 0,
    'Preventive Maintenance': 0,
    Calibration: 0,
    Installation: 0
  });
  
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (category) => {
    setSelectedCategory(prev => prev === category ? null : category);
    setPage(0);
  };
  
  const filteredHistory = selectedCategory 
    ? history.filter(h => h.service_category === selectedCategory) 
    : history;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.start_date = filters.startDate.format('YYYY-MM-DD');
      if (filters.endDate) params.end_date = filters.endDate.format('YYYY-MM-DD');

      const res = await api.get('/api/reports/call-status', { params });
      setSummary(res.data?.summary || { AMC: 0, CMC: 0, Warranty: 0, 'Out of Warranty': 0, 'Preventive Maintenance': 0, Calibration: 0, Installation: 0 });
      setHistory(res.data?.history || []);
      setPage(0);
    } catch (err) {
      console.error(err);
      showMessage('Failed to load call status report', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleReset = () => {
    setFilters({
      startDate: dayjs().subtract(30, 'day'),
      endDate: dayjs()
    });
    setSelectedCategory(null);
  };

  const exportCSV = () => {
    if (!filteredHistory.length) {
      showMessage('No data available to export', 'Warning', 'warning');
      return;
    }
    
    const headers = [
      'Docket No', 'Date', 'Department', 'Nature of Complaint', 
      'Assigned To', 'Status', 'Service Category', 'Equipment Code', 'Resolved At'
    ];
    
    const csvRows = [
      headers.join(','),
      ...filteredHistory.map(row => [
        `"${row.docket_no || ''}"`,
        `"${row.created_at || ''}"`,
        `"${(row.department || '').replace(/"/g, '""')}"`,
        `"${(row.nature_of_complaint || '').replace(/"/g, '""')}"`,
        `"${(row.assigned_to || '').replace(/"/g, '""')}"`,
        `"${row.status || ''}"`,
        `"${row.service_category || ''}"`,
        `"${row.equipment_code || ''}"`,
        `"${row.resolved_at || ''}"`
      ].join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Call_Status_Report_${dayjs().format('YYYYMMDD')}.csv`);
  };

  const getStatusColor = (category) => {
    switch (category) {
      case 'AMC': return 'primary';
      case 'CMC': return 'secondary';
      case 'Warranty': return 'success';
      case 'Out of Warranty': return 'error';
      case 'Preventive Maintenance': return 'info';
      case 'Calibration': return 'warning';
      case 'Installation': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ color: '#0284C7' }} /> Call Status Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Maintenance call volume and history by service contract category
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={exportCSV}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' } }}
          >
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* Filter Section */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(newValue) => setFilters({ ...filters, startDate: newValue })}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              format="DD/MM/YYYY"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(newValue) => setFilters({ ...filters, endDate: newValue })}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
              format="DD/MM/YYYY"
              minDate={filters.startDate}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={6} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={fetchReport}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
            >
              Generate Report
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Refresh />}
              onClick={handleReset}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* KPI Cards */}
      {/* KPI Cards */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto', pb: 0.5, flexWrap: { xs: 'wrap', xl: 'nowrap' }, alignItems: 'stretch' }}>
        <Paper 
          elevation={selectedCategory === 'AMC' ? 3 : 0}
          onClick={() => handleCategoryClick('AMC')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#EFF6FF', border: selectedCategory === 'AMC' ? '2px solid #1D4ED8' : '1px solid #BFDBFE', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'AMC' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>TOTAL AMC CALLS</Typography>
          <Typography variant="h5" sx={{ color: '#1E3A8A', fontWeight: 900, mt: 'auto' }}>{summary.AMC.toLocaleString('en-IN')}</Typography>
        </Paper>
        <Paper 
          elevation={selectedCategory === 'CMC' ? 3 : 0}
          onClick={() => handleCategoryClick('CMC')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#FDF4FF', border: selectedCategory === 'CMC' ? '2px solid #A21CAF' : '1px solid #F5D0FE', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'CMC' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#A21CAF', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>TOTAL CMC CALLS</Typography>
          <Typography variant="h5" sx={{ color: '#701A75', fontWeight: 900, mt: 'auto' }}>{summary.CMC.toLocaleString('en-IN')}</Typography>
        </Paper>
        <Paper 
          elevation={selectedCategory === 'Warranty' ? 3 : 0}
          onClick={() => handleCategoryClick('Warranty')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#F0FDF4', border: selectedCategory === 'Warranty' ? '2px solid #15803D' : '1px solid #BBF7D0', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'Warranty' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>WARRANTY CALLS</Typography>
          <Typography variant="h5" sx={{ color: '#166534', fontWeight: 900, mt: 'auto' }}>{summary.Warranty.toLocaleString('en-IN')}</Typography>
        </Paper>
        <Paper 
          elevation={selectedCategory === 'Out of Warranty' ? 3 : 0}
          onClick={() => handleCategoryClick('Out of Warranty')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#FEF2F2', border: selectedCategory === 'Out of Warranty' ? '2px solid #B91C1C' : '1px solid #FECACA', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'Out of Warranty' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>OUT OF WARRANTY</Typography>
          <Typography variant="h5" sx={{ color: '#7F1D1D', fontWeight: 900, mt: 'auto' }}>{summary['Out of Warranty'].toLocaleString('en-IN')}</Typography>
        </Paper>
        <Paper 
          elevation={selectedCategory === 'Preventive Maintenance' ? 3 : 0}
          onClick={() => handleCategoryClick('Preventive Maintenance')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#F0FDFA', border: selectedCategory === 'Preventive Maintenance' ? '2px solid #0F766E' : '1px solid #99F6E4', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'Preventive Maintenance' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>PREVENTIVE MAINTENANCE</Typography>
          <Typography variant="h5" sx={{ color: '#134E4A', fontWeight: 900, mt: 'auto' }}>{summary['Preventive Maintenance'].toLocaleString('en-IN')}</Typography>
        </Paper>
        <Paper 
          elevation={selectedCategory === 'Calibration' ? 3 : 0}
          onClick={() => handleCategoryClick('Calibration')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#FFFBEB', border: selectedCategory === 'Calibration' ? '2px solid #B45309' : '1px solid #FDE68A', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'Calibration' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>CALIBRATION CALLS</Typography>
          <Typography variant="h5" sx={{ color: '#78350F', fontWeight: 900, mt: 'auto' }}>{summary.Calibration.toLocaleString('en-IN')}</Typography>
        </Paper>
        <Paper 
          elevation={selectedCategory === 'Installation' ? 3 : 0}
          onClick={() => handleCategoryClick('Installation')}
          sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: selectedCategory === 'Installation' ? '2px solid #475569' : '1px solid #E2E8F0', minWidth: 120, display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s', opacity: selectedCategory && selectedCategory !== 'Installation' ? 0.6 : 1 }}
        >
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.2, minHeight: 34 }}>INSTALLATION CALLS</Typography>
          <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 900, mt: 'auto' }}>{summary.Installation.toLocaleString('en-IN')}</Typography>
        </Paper>
      </Box>

      {/* History Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>
            Call History 
          </Typography>
          {selectedCategory && (
            <Chip 
              label={`Filtered: ${selectedCategory}`} 
              size="small" 
              color={getStatusColor(selectedCategory)} 
              sx={{ ml: 2, fontWeight: 600 }} 
              onDelete={() => handleCategoryClick(selectedCategory)}
            />
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Docket No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Service Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Equipment Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Nature of Complaint</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Assigned To</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Overall Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155', bgcolor: '#F1F5F9' }}>Resolved At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                  <TableRow key={index} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{row.docket_no}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{row.created_at}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.service_category} 
                        size="small" 
                        color={getStatusColor(row.service_category)}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }} 
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{row.equipment_code}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{row.department}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.nature_of_complaint}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{row.assigned_to}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{row.status}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{row.resolved_at}</TableCell>
                  </TableRow>
                ))}
                
                {filteredHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                      No calls found for the selected period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredHistory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}
        />
      </Paper>

    </Box>
  );
}
