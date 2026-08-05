import { useState, useEffect, useMemo } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, TextField, Chip, FormControl, InputLabel, Select,
  MenuItem, InputAdornment, Grid, Tab, Tabs, ToggleButton, ToggleButtonGroup,
  TableSortLabel, Button, TablePagination
} from '@mui/material';
import { Search, Warning, ArrowBack } from '@mui/icons-material';
import api from '../services/api';

const getTransactionColor = (type) => {
  switch (type) {
    case 'GRN': return 'success';
    case 'Issue': return 'primary';
    case 'Return': return 'secondary';
    case 'Transfer In': return 'info';
    case 'Transfer Out': return 'warning';
    case 'Repair Received': return 'info';
    case 'Write Off': return 'error';
    default: return 'default';
  }
};

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerRowsPerPage, setLedgerRowsPerPage] = useState(25);
  const location = useLocation();
  const navigate = useNavigate();

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
    setPage(0);
    setLedgerPage(0);
  }, [search, whFilter, filter]);

  const filteredStockBase = useMemo(() => {
    let list = stock;
    const projId = searchParams.get('proj');
    if (projId && warehouses.length > 0) {
      const targetProj = parseInt(projId, 10);
      list = list.filter(item => {
        const wh = warehouses.find(w => w.id === item.warehouse_id);
        return wh && wh.project_id === targetProj;
      });
    }
    return list;
  }, [stock, warehouses, searchParams]);

  const filteredLedgerBase = useMemo(() => {
    let list = ledger;
    const projId = searchParams.get('proj');
    if (projId && warehouses.length > 0) {
      const targetProj = parseInt(projId, 10);
      list = list.filter(item => {
        const wh = warehouses.find(w => w.id === item.warehouse_id);
        return wh && wh.project_id === targetProj;
      });
    }
    return list;
  }, [ledger, warehouses, searchParams]);

  const totalValue = filteredStockBase.reduce((s, i) => s + (i.stock_value || 0), 0);
  const lowItems = filteredStockBase.filter(s => s.quantity < s.reorder_level);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedStock = [...filteredStockBase].sort((a, b) => {
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

  const sortedLedger = [...filteredLedgerBase].sort((a, b) => {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Inventory Management</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            {filteredStockBase.length} {filteredStockBase.length === 1 ? 'item' : 'items'} • Total Value: ₹{totalValue.toLocaleString('en-IN')} {lowItems.length > 0 && `• ${lowItems.length} below reorder level`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {location.state?.fromDashboard && (
            <Button size="small" variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          )}
        </Box>
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
            <InputLabel>Store</InputLabel>
            <Select value={whFilter} label="Store" onChange={e => setWhFilter(e.target.value)}>
              <MenuItem value="">All Stores</MenuItem>
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
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small" sx={{ 
              '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
            }}>
              <TableHead><TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'material_code'} direction={orderBy === 'material_code' ? order : 'asc'} onClick={() => handleSort('material_code')}>CODE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'material_name'} direction={orderBy === 'material_name' ? order : 'asc'} onClick={() => handleSort('material_name')}>MATERIAL</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'category_name'} direction={orderBy === 'category_name' ? order : 'asc'} onClick={() => handleSort('category_name')}>CATEGORY</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>UOM</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'warehouse_name'} direction={orderBy === 'warehouse_name' ? order : 'asc'} onClick={() => handleSort('warehouse_name')}>STORE</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'quantity'} direction={orderBy === 'quantity' ? order : 'asc'} onClick={() => handleSort('quantity')}>QTY</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'reorder_level'} direction={orderBy === 'reorder_level' ? order : 'asc'} onClick={() => handleSort('reorder_level')}>REORDER</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'standard_cost'} direction={orderBy === 'standard_cost' ? order : 'asc'} onClick={() => handleSort('standard_cost')}>COST (₹)</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'stock_value'} direction={orderBy === 'stock_value' ? order : 'asc'} onClick={() => handleSort('stock_value')}>VALUE (₹)</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>STATUS</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedStock.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(s => (
                  <TableRow key={s.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' }, background: s.quantity < s.reorder_level ? '#FEF2F2' : 'inherit' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{s.material_code}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{s.material_name}</TableCell>
                    <TableCell><Chip label={s.category_name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} /></TableCell>
                    <TableCell>{s.uom_name}</TableCell>
                    <TableCell>{s.warehouse_name}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{Math.round(s.quantity)}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748B' }}>{Math.round(s.reorder_level)}</TableCell>
                    <TableCell align="right">₹{s.standard_cost?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{s.stock_value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {s.quantity === 0 ? (
                        <Chip label="No Stock" size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                      ) : s.quantity < s.reorder_level ? (
                        <Chip icon={<Warning style={{ fontSize: 12 }} />} label="Low Stock" size="small" color="error" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                      ) : (
                        <Chip label="In Stock" size="small" color="success" variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={sortedStock.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small" sx={{ 
              '& .MuiTableCell-root': { px: 0.75, py: 1.2, fontSize: '0.72rem', borderColor: '#F1F5F9' } 
            }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}><TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'created_at'} direction={orderBy === 'created_at' ? order : 'asc'} onClick={() => handleSort('created_at')}>DATE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'material_name'} direction={orderBy === 'material_name' ? order : 'asc'} onClick={() => handleSort('material_name')}>MATERIAL</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'warehouse_name'} direction={orderBy === 'warehouse_name' ? order : 'asc'} onClick={() => handleSort('warehouse_name')}>STORE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'transaction_type'} direction={orderBy === 'transaction_type' ? order : 'asc'} onClick={() => handleSort('transaction_type')}>TYPE</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'quantity'} direction={orderBy === 'quantity' ? order : 'asc'} onClick={() => handleSort('quantity')}>QTY</TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>
                  <TableSortLabel active={orderBy === 'balance'} direction={orderBy === 'balance' ? order : 'asc'} onClick={() => handleSort('balance')}>BALANCE</TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>REFERENCE</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedLedger.slice(ledgerPage * ledgerRowsPerPage, ledgerPage * ledgerRowsPerPage + ledgerRowsPerPage).map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{formatDateTime(e.created_at)}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{e.material_name}</TableCell>
                    <TableCell>{e.warehouse_name}</TableCell>
                    <TableCell>
                      <Chip label={e.transaction_type} size="small" color={getTransactionColor(e.transaction_type)} sx={{ fontSize: '0.65rem', height: 20 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: e.quantity > 0 ? '#059669' : '#DC2626' }}>
                      {e.quantity > 0 ? '+' : ''}{Math.round(e.quantity)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{Math.round(e.balance)}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', color: '#64748B' }}>{e.reference_number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={sortedLedger.length}
            rowsPerPage={ledgerRowsPerPage}
            page={ledgerPage}
            onPageChange={(_, newPage) => setLedgerPage(newPage)}
            onRowsPerPageChange={(e) => {
              setLedgerRowsPerPage(parseInt(e.target.value, 10));
              setLedgerPage(0);
            }}
          />
        </Card>
      )}
    </Box>
  );
}
