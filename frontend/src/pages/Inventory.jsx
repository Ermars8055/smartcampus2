import { useState, useEffect } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, TextField, Chip, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Grid, Tab, Tabs, ToggleButton, ToggleButtonGroup,
  TableSortLabel
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
  const [filter, setFilter] = useState(searchParams.get('low') === 'true' ? 'low' : 'all');
  const [orderBy, setOrderBy] = useState('material_name');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    api.get('/api/warehouses').then(r => setWarehouses(r.data));
  }, []);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (whFilter) params.warehouse_id = whFilter;
    if (filter !== 'all') params.stock_status = filter;
    api.get('/api/inventory', { params }).then(r => setStock(r.data));
    api.get('/api/inventory/ledger', { params: { warehouse_id: whFilter || undefined, search: search || undefined } }).then(r => setLedger(r.data.items || []));
  }, [search, whFilter, filter]);

  const totalValue = stock.reduce((s, i) => s + (i.stock_value || 0), 0);
  const lowItems = stock.filter(s => s.quantity < s.reorder_level);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedStock = [...stock].sort((a, b) => {
    let aVal = a[orderBy];
    let bVal = b[orderBy];
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedLedger = [...ledger].sort((a, b) => {
    let aVal = a[orderBy];
    let bVal = b[orderBy];
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Inventory Management</Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {stock.length} {stock.length === 1 ? 'item' : 'items'} • Total Value: ₹{totalValue.toLocaleString('en-IN')} {lowItems.length > 0 && `• ${lowItems.length} below reorder level`}
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
          {tab === 0 && (
            <ToggleButtonGroup size="small" value={filter} exclusive
              onChange={(_, v) => v && setFilter(v)} sx={{ bgcolor: '#fff', borderRadius: 2 }}>
              <ToggleButton value="all" sx={{ 
                px: 3, fontWeight: 800, 
                '&.Mui-selected': { bgcolor: '#1E3A8A', color: '#fff', '&:hover': { bgcolor: '#1E3A8A' } } 
              }}>ALL</ToggleButton>
              <ToggleButton value="no" sx={{ 
                px: 3, fontWeight: 800, color: '#64748B',
                '&.Mui-selected': { bgcolor: '#64748B', color: '#fff', '&:hover': { bgcolor: '#475569' } } 
              }}>
                NO STOCK
              </ToggleButton>
              <ToggleButton value="low" sx={{ 
                px: 3, fontWeight: 800, color: '#DC2626',
                '&.Mui-selected': { bgcolor: '#DC2626', color: '#fff', '&:hover': { bgcolor: '#B91C1C' } } 
              }}>
                <Warning sx={{ fontSize: 16, mr: 0.5 }} /> LOW STOCK
              </ToggleButton>
              <ToggleButton value="in" sx={{ 
                px: 3, fontWeight: 800, color: '#059669',
                '&.Mui-selected': { bgcolor: '#059669', color: '#fff', '&:hover': { bgcolor: '#047857' } } 
              }}>
                IN STOCK
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>
      </Card>

      {tab === 0 && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>
                  <TableSortLabel active={orderBy === 'material_code'} direction={orderBy === 'material_code' ? order : 'asc'} onClick={() => handleSort('material_code')}>CODE</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === 'material_name'} direction={orderBy === 'material_name' ? order : 'asc'} onClick={() => handleSort('material_name')}>MATERIAL</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === 'category_name'} direction={orderBy === 'category_name' ? order : 'asc'} onClick={() => handleSort('category_name')}>CATEGORY</TableSortLabel>
                </TableCell>
                <TableCell>UOM</TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === 'warehouse_name'} direction={orderBy === 'warehouse_name' ? order : 'asc'} onClick={() => handleSort('warehouse_name')}>WAREHOUSE</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'quantity'} direction={orderBy === 'quantity' ? order : 'asc'} onClick={() => handleSort('quantity')}>QTY</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'reorder_level'} direction={orderBy === 'reorder_level' ? order : 'asc'} onClick={() => handleSort('reorder_level')}>REORDER</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'standard_cost'} direction={orderBy === 'standard_cost' ? order : 'asc'} onClick={() => handleSort('standard_cost')}>COST (₹)</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'stock_value'} direction={orderBy === 'stock_value' ? order : 'asc'} onClick={() => handleSort('stock_value')}>VALUE (₹)</TableSortLabel>
                </TableCell>
                <TableCell>STATUS</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedStock.map(s => (
                  <TableRow key={s.id} sx={{ background: s.quantity < s.reorder_level ? '#FEF2F2' : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem' }}>{s.material_code}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.material_name}</TableCell>
                    <TableCell><Chip label={s.category_name} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.uom_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.warehouse_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.quantity}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#64748B' }}>{s.reorder_level}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem' }}>₹{s.standard_cost?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹{s.stock_value?.toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      {s.quantity === 0 ? (
                        <Chip label="No Stock" size="small" color="default" sx={{ fontWeight: 600 }} />
                      ) : s.quantity < s.reorder_level ? (
                        <Chip icon={<Warning />} label="Low Stock" size="small" color="error" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="In Stock" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
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
                <TableCell>
                  <TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : 'asc'} onClick={() => handleSort('created_at')}>DATE</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === 'material_name'} direction={orderBy === 'material_name' ? order : 'asc'} onClick={() => handleSort('material_name')}>MATERIAL</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === 'warehouse_name'} direction={orderBy === 'warehouse_name' ? order : 'asc'} onClick={() => handleSort('warehouse_name')}>WAREHOUSE</TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel active={orderBy === 'transaction_type'} direction={orderBy === 'transaction_type' ? order : 'asc'} onClick={() => handleSort('transaction_type')}>TYPE</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'quantity'} direction={orderBy === 'quantity' ? order : 'asc'} onClick={() => handleSort('quantity')}>QTY</TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel active={orderBy === 'balance'} direction={orderBy === 'balance' ? order : 'asc'} onClick={() => handleSort('balance')}>BALANCE</TableSortLabel>
                </TableCell>
                <TableCell>REFERENCE</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedLedger.map(e => (
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
