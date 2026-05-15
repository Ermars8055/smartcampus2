import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Grid, Tab, Tabs, FormControl, InputLabel,
  Select, MenuItem, Chip
} from '@mui/material';
import { Download, Assessment } from '@mui/icons-material';
import api from '../services/api';

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter, setWhFilter] = useState('');

  useEffect(() => { api.get('/api/warehouses').then(r => setWarehouses(r.data)); }, []);

  useEffect(() => {
    const endpoints = ['/api/reports/stock', '/api/reports/consumption', '/api/reports/pr-status', '/api/reports/po-status', '/api/reports/movement'];
    const params = tab === 0 && whFilter ? { warehouse_id: whFilter } : {};
    api.get(endpoints[tab], { params }).then(r => setData(r.data));
  }, [tab, whFilter]);

  const downloadCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${['stock', 'consumption', 'pr_status', 'po_status', 'movement'][tab]}.csv`;
    a.click();
  };

  const tabLabels = ['Stock Report', 'Consumption Report', 'PR Status', 'PO Status', 'Material Movement'];
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Reports</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Download and analyze operational data</Typography>
        </Box>
        <Button variant="contained" startIcon={<Download />} onClick={downloadCSV} disabled={!data.length}>
          Export CSV
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {tabLabels.map((label, i) => (
            <Tab key={i} label={label} sx={{ textTransform: 'none', fontWeight: 500, fontSize: '0.85rem' }} />
          ))}
        </Tabs>
      </Card>

      {tab === 0 && (
        <Card sx={{ mb: 2, p: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Store</InputLabel>
            <Select value={whFilter} label="Store" onChange={e => setWhFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Card>
      )}

      <Card>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {headers.map(h => (
                  <TableCell key={h} sx={{ whiteSpace: 'nowrap' }}>
                    {h.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ background: row.status === 'Low' ? '#FEF2F2' : 'inherit' }}>
                  {headers.map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {h === 'status' ? (
                        <Chip label={row[h]} size="small" color={row[h] === 'Low' ? 'error' : row[h] === 'OK' ? 'success' :
                          row[h] === 'Approved' ? 'success' : row[h] === 'Closed' ? 'default' : 'warning'} sx={{ fontSize: '0.7rem' }} />
                      ) : typeof row[h] === 'number' && h.includes('amount') || h.includes('cost') || h.includes('value') ? (
                        `₹${row[h]?.toLocaleString('en-IN')}`
                      ) : (
                        String(row[h] ?? '')
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow><TableCell colSpan={headers.length || 5} sx={{ textAlign: 'center', py: 4 }}>No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 1.5, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#64748B' }}>{data.length} records</Typography>
          <Typography variant="caption" sx={{ color: '#64748B' }}>NissiGrid Smart Campus Report</Typography>
        </Box>
      </Card>
    </Box>
  );
}
