import { useState, useEffect } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, TextField, Chip, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Grid, Tab, Tabs, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Search, Warning } from '@mui/icons-material';
import api from '../services/api';

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [stock, setStock] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [whFilter, setWhFilter] = useState('');
  const [lowOnly, setLowOnly] = useState(searchParams.get('low') === 'true');

  useEffect(() => {
    api.get('/api/warehouses').then(r => setWarehouses(r.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (whFilter) params.warehouse_id = whFilter;
    if (lowOnly) params.low_stock_only = true;
    api.get('/api/inventory', { params }).then(r => setStock(r.data));
    api.get('/api/inventory/ledger', { params: { warehouse_id: whFilter || undefined, search: search || undefined } }).then(r => setLedger(r.data.items || []));
  }, [search, whFilter, lowOnly]);

  const totalValue = stock.reduce((s, i) => s + (i.stock_value || 0), 0);
  const lowItems = stock.filter(s => s.quantity < s.reorder_level && s.quantity > 0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Inventory Management</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {stock.length} {stock.length === 1 ? 'item' : 'items'} • Total Value: ₹{totalValue.toLocaleString()} {lowItems.length > 0 && `• ${lowItems.length} low stock`}
        </Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Current Stock" sx={{ textTransform: 'none', fontWeight: 500 }} />
          <Tab label="Stock Ledger" sx={{ textTransform: 'none', fontWeight: 500 }} />
        </Tabs>
      </Card>

      <Card sx={{ mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" placeholder="Search materials..." value={search}
            onChange={e => setSearch(e.target.value)} sx={{ minWidth: 250 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Warehouse</InputLabel>
            <Select value={whFilter} label="Warehouse" onChange={e => setWhFilter(e.target.value)}>
              <MenuItem value="">All Warehouses</MenuItem>
              {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </Select>
          </FormControl>
          <ToggleButtonGroup size="small" value={lowOnly ? 'low' : 'all'} exclusive
            onChange={(_, v) => setLowOnly(v === 'low')}>
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="low" sx={{ color: '#DC2626' }}>
              <Warning sx={{ fontSize: 16, mr: 0.5 }} /> Low Stock
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Card>

      {tab === 0 && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Code</TableCell><TableCell>Material</TableCell><TableCell>Category</TableCell>
                <TableCell>UOM</TableCell><TableCell>Warehouse</TableCell><TableCell align="right">Qty</TableCell>
                <TableCell align="right">Reorder</TableCell><TableCell align="right">Cost (₹)</TableCell>
                <TableCell align="right">Value (₹)</TableCell><TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {stock.map(s => (
                  <TableRow key={s.id} sx={{ background: s.quantity < s.reorder_level && s.quantity > 0 ? '#FEF2F2' : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{s.material_code}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.material_name}</TableCell>
                    <TableCell><Chip label={s.category_name} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.uom_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.warehouse_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#64748B' }}>{s.reorder_level}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{s.standard_cost?.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{s.stock_value?.toLocaleString()}</TableCell>
                    <TableCell>
                      {s.quantity < s.reorder_level && s.quantity > 0 ? (
                        <Chip icon={<Warning />} label="Low" size="small" color="error" />
                      ) : s.quantity === 0 ? (
                        <Chip label="Out" size="small" color="default" />
                      ) : (
                        <Chip label="OK" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Date</TableCell><TableCell>Material</TableCell><TableCell>Warehouse</TableCell>
                <TableCell>Type</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Balance</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ledger.map(e => (
                  <TableRow key={e.id}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{formatDateTime(e.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{e.material_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{e.warehouse_name}</TableCell>
                    <TableCell>
                      <Chip label={e.transaction_type} size="small" color={e.quantity > 0 ? 'success' : 'error'} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: e.quantity > 0 ? '#059669' : '#DC2626' }}>
                      {e.quantity > 0 ? '+' : ''}{e.quantity}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{e.balance}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#64748B' }}>{e.reference_number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
