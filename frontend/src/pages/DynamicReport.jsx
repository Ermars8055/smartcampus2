import { useState, useEffect } from 'react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, FormControl, InputLabel, Select, MenuItem, Chip
} from '@mui/material';
import { Download } from '@mui/icons-material';
import api from '../services/api';

export default function DynamicReport({ title, description, endpoint, hasWarehouseFilter, downloadFilename }) {
  const [data, setData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [whFilter, setWhFilter] = useState('');

  useEffect(() => {
    if (hasWarehouseFilter) {
      api.get('/api/warehouses').then(r => setWarehouses(r.data));
    }
  }, [hasWarehouseFilter]);

  useEffect(() => {
    const params = hasWarehouseFilter && whFilter ? { warehouse_id: whFilter } : {};
    api.get(endpoint, { params }).then(r => setData(r.data));
  }, [endpoint, hasWarehouseFilter, whFilter]);

  const downloadCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => {
      let val = r[h] ?? '';
      if (val) {
        if (h.toLowerCase() === 'created_at' || h.toLowerCase() === 'updated_at') val = formatDateTime(val);
        else if (h.toLowerCase().includes('date')) val = formatDate(val);
      }
      return `"${val}"`;
    }).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFilename}.csv`;
    a.click();
  };

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{description}</Typography>
        </Box>
        <Button variant="contained" startIcon={<Download />} onClick={downloadCSV} disabled={!data.length}>
          Export CSV
        </Button>
      </Box>

      {hasWarehouseFilter && (
        <Card sx={{ mb: 2, p: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel shrink>Store</InputLabel>
            <Select displayEmpty value={whFilter} label="Store" onChange={e => setWhFilter(e.target.value)}>
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
                  <TableCell key={h} sx={{ 
                    whiteSpace: h === 'material_name' || h === 'MATERIAL_NAME' ? 'normal' : 'nowrap',
                    minWidth: h === 'material_name' || h === 'MATERIAL_NAME' ? 250 : 'auto',
                    maxWidth: h === 'material_name' || h === 'MATERIAL_NAME' ? 400 : 'none',
                    textAlign: h.toLowerCase().includes('quantity') || h.toLowerCase().includes('qty') || h.toLowerCase().includes('value') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('cost') ? 'right' : 'left'
                  }}>
                    {h.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ background: row.status === 'Low' ? '#FEF2F2' : 'inherit' }}>
                  {headers.map(h => (
                    <TableCell key={h} sx={{ 
                      fontSize: '0.8rem', 
                      whiteSpace: h === 'material_name' || h === 'MATERIAL_NAME' ? 'normal' : 'nowrap',
                      minWidth: h === 'material_name' || h === 'MATERIAL_NAME' ? 250 : 'auto',
                      maxWidth: h === 'material_name' || h === 'MATERIAL_NAME' ? 400 : 'none',
                      textAlign: h.toLowerCase().includes('quantity') || h.toLowerCase().includes('qty') || h.toLowerCase().includes('value') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('cost') ? 'right' : 'left'
                    }}>
                      {h === 'status' ? (
                        <Chip label={row[h]} size="small" color={row[h] === 'Low' ? 'error' : row[h] === 'OK' ? 'success' :
                          row[h] === 'Approved' ? 'success' : row[h] === 'Closed' ? 'default' : 'warning'} sx={{ fontSize: '0.7rem' }} />
                      ) : typeof row[h] === 'number' && (h.includes('amount') || h.includes('cost') || h.includes('value')) ? (
                        `₹${row[h]?.toLocaleString('en-IN')}`
                      ) : (h.toLowerCase() === 'created_at' || h.toLowerCase() === 'updated_at') && row[h] ? (
                        formatDateTime(row[h])
                      ) : h.toLowerCase().includes('date') && row[h] ? (
                        formatDate(row[h])
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
          <Typography variant="caption" sx={{ color: '#64748B' }}>Eastpoint Smart Campus | Powered by NissiGrid</Typography>
        </Box>
      </Card>
    </Box>
  );
}
