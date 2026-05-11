import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, MenuItem, IconButton,
  Tooltip, Select, FormControl, InputLabel, TableSortLabel
} from '@mui/material';
import { 
  Add, Search, Edit, ArrowDropUp, ArrowDropDown, 
  Inventory, Description, Category, Straighten, Warehouse, 
  Percent, Speed, AttachMoney 
} from '@mui/icons-material';
import api from '../services/api';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });
  const [form, setForm] = useState({
    code: '', name: '', category_id: '', uom_id: '', reorder_level: 0,
    maximum_level: 0, standard_cost: 0, gst_rate: 18, storage_type: 'General', 
    material_type: 'Consumable', description: ''
  });

  const load = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (catFilter) params.category_id = catFilter;
    api.get('/api/materials', { params }).then(r => setMaterials(r.data.items || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/categories'),
      api.get('/api/uom'),
      api.get('/api/vendors'),
    ]).then(([c, u]) => {
      setCategories(c.data);
      setUoms(u.data);
    });
  }, []);

  useEffect(() => { load(); }, [search, catFilter]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      // Handle special cases like names from IDs
      if (key === 'category') aVal = a.category_name;
      if (key === 'category') bVal = b.category_name;
      if (key === 'uom') aVal = a.uom_name;
      if (key === 'uom') bVal = b.uom_name;
      if (key === 'stock') aVal = a.current_stock || 0;
      if (key === 'stock') bVal = b.current_stock || 0;

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [materials, sortConfig]);

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        category_id: form.category_id,
        uom_id: form.uom_id,
        reorder_level: form.reorder_level,
        maximum_level: form.maximum_level,
        standard_cost: form.standard_cost,
        gst_rate: form.gst_rate,
        storage_type: form.storage_type,
        material_type: form.material_type,
        description: form.description,
        subcategory_id: form.subcategory_id || null,
        preferred_vendor_id: form.preferred_vendor_id || null,
        hsn_code: form.hsn_code || null
      };

      if (!editing) payload.code = form.code;

      if (editing) {
        await api.put(`/api/materials/${editing}`, payload);
      } else {
        await api.post('/api/materials', payload);
      }
      setDialog(false);
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Error saving material');
    }
  };

  const openEdit = (m) => {
    setEditing(m.id);
    setForm({
      code: m.code, name: m.name, category_id: m.category_id, uom_id: m.uom_id,
      reorder_level: m.reorder_level, maximum_level: m.maximum_level,
      standard_cost: m.standard_cost, gst_rate: m.gst_rate || 0,
      storage_type: m.storage_type || 'General',
      material_type: m.material_type || 'Consumable',
      description: m.description || '', subcategory_id: m.subcategory_id || '',
      preferred_vendor_id: m.preferred_vendor_id || ''
    });
    setDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ 
      code: '', name: '', category_id: '', uom_id: '', reorder_level: 0,
      maximum_level: 0, standard_cost: 0, gst_rate: 0, storage_type: 'General', 
      material_type: 'Consumable', description: '' 
    });
    setDialog(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Material Master</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{materials.length} materials</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>Add Material</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search materials..." value={search}
            onChange={e => setSearch(e.target.value)} sx={{ minWidth: 260 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> } }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={catFilter} label="Category" onChange={e => setCatFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card>
        <TableContainer sx={{ overflowX: 'auto', backgroundColor: '#fff' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '70px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'code'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('code')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'code' ? 1 : 0
                      }
                    }}
                  >
                    CODE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'name'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('name')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'name' ? 1 : 0
                      }
                    }}
                  >
                    NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '90px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'category'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('category')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'category' ? 1 : 0
                      }
                    }}
                  >
                    CATEGORY
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '80px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'uom'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('uom')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'uom' ? 1 : 0
                      }
                    }}
                  >
                    UOM
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '50px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'gst_rate'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('gst_rate')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'gst_rate' ? 1 : 0
                      }
                    }}
                  >
                    GST
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '70px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'standard_cost'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('standard_cost')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'standard_cost' ? 1 : 0
                      }
                    }}
                  >
                    COST
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '80px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'reorder_level'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('reorder_level')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'reorder_level' ? 1 : 0
                      }
                    }}
                  >
                    REORDER
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '70px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'stock'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('stock')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'stock' ? 1 : 0
                      }
                    }}
                  >
                    STOCK
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '90px' }}>
                  <TableSortLabel 
                    active={sortConfig.key === 'material_type'} 
                    direction={sortConfig.direction} 
                    onClick={() => handleSort('material_type')}
                    IconComponent={ArrowDropDown}
                    sx={{
                      '& .MuiTableSortLabel-icon': {
                        fontSize: '1.2rem !important',
                        opacity: sortConfig.key === 'material_type' ? 1 : 0
                      }
                    }}
                  >
                    TYPE
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '70px' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, fontWeight: 700, color: '#64748b', fontSize: '0.75rem', width: '80px' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMaterials.map(m => (
                 <TableRow key={m.id} hover>
                  <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1, whiteSpace: 'nowrap', fontWeight: 500 }}>{m.code}</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1 }}>{m.name}</TableCell>
                  <TableCell sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><Chip label={m.category_name} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', py: 1, px: 1, whiteSpace: 'nowrap' }}>{m.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1, px: 1, whiteSpace: 'nowrap' }}>{m.gst_rate}%</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1, px: 1, whiteSpace: 'nowrap' }}>₹{m.standard_cost?.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.75rem', py: 1, px: 1, whiteSpace: 'nowrap' }}>{m.reorder_level}</TableCell>
                  <TableCell align="right" sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}>
                    <Chip label={m.current_stock || 0} size="small"
                      color={(m.current_stock || 0) < m.reorder_level ? 'error' : 'success'}
                      sx={{ fontWeight: 600, minWidth: 50, height: 20, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ py: 0.5, whiteSpace: 'nowrap' }}>
                    <Chip label={m.material_type} size="small" variant="outlined" 
                      color={m.material_type === 'Non-Consumable' ? 'secondary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={m.is_active ? 'Active' : 'Inactive'} size="small"
                      color={m.is_active ? 'success' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {materials.length === 0 && !loading && (
                <TableRow><TableCell colSpan={11} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>No materials found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog 
        open={dialog} 
        onClose={() => setDialog(false)} 
        maxWidth="md" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>
            {editing ? 'Edit Material' : 'New Material'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editing ? 'Update material details and governance parameters.' : 'Create a new material record for procurement and inventory tracking.'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mt: 2 }}>
            {/* Row 1 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Material Code
              </Typography>
              <TextField 
                fullWidth 
                value={form.code} 
                onChange={e => setForm({ ...form, code: e.target.value })} 
                required 
                disabled={!!editing} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Inventory color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Material Name
              </Typography>
              <TextField 
                fullWidth 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Description color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>

            {/* Row 2 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Category
              </Typography>
              <FormControl fullWidth>
                <Select 
                  value={form.category_id} 
                  onChange={e => setForm({ ...form, category_id: e.target.value })} 
                  startAdornment={<InputAdornment position="start"><Category color="action" sx={{ mr: 1 }} /></InputAdornment>}
                >
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                UOM
              </Typography>
              <FormControl fullWidth>
                <Select 
                  value={form.uom_id} 
                  onChange={e => setForm({ ...form, uom_id: e.target.value })} 
                  startAdornment={<InputAdornment position="start"><Straighten color="action" sx={{ mr: 1 }} /></InputAdornment>}
                >
                  {uoms.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>

            {/* Row 3 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Storage Type
              </Typography>
              <TextField 
                fullWidth 
                value={form.storage_type} 
                onChange={e => setForm({ ...form, storage_type: e.target.value })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Warehouse color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Material Type
              </Typography>
              <FormControl fullWidth>
                <Select 
                  value={form.material_type} 
                  onChange={e => setForm({ ...form, material_type: e.target.value })} 
                  startAdornment={<InputAdornment position="start"><Category color="action" sx={{ mr: 1 }} /></InputAdornment>}
                >
                  <MenuItem value="Consumable">Consumable</MenuItem>
                  <MenuItem value="Non-Consumable">Non-Consumable</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Row 4 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                GST Rate (%)
              </Typography>
              <TextField 
                fullWidth 
                type="number" 
                value={form.gst_rate} 
                onChange={e => setForm({ ...form, gst_rate: parseFloat(e.target.value) || 0 })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Percent color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Standard Cost (₹)
              </Typography>
              <TextField 
                fullWidth 
                type="number" 
                value={form.standard_cost} 
                onChange={e => setForm({ ...form, standard_cost: parseFloat(e.target.value) || 0 })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoney color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>

            {/* Row 5 */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Reorder Level
              </Typography>
              <TextField 
                fullWidth 
                type="number" 
                value={form.reorder_level} 
                onChange={e => setForm({ ...form, reorder_level: parseFloat(e.target.value) || 0 })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Speed color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                Maximum Level
              </Typography>
              <TextField 
                fullWidth 
                type="number" 
                value={form.maximum_level} 
                onChange={e => setForm({ ...form, maximum_level: parseFloat(e.target.value) || 0 })} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Speed color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>

            {/* Row 6 */}
            <Box sx={{ gridColumn: 'span 2' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block', ml: 0.5, textTransform: 'uppercase' }}>
                General Description
              </Typography>
              <TextField 
                fullWidth 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                multiline 
                rows={2} 
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Description color="action" sx={{ mr: 1 }} /></InputAdornment> } }} 
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
          <Button onClick={() => setDialog(false)} sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave} 
            sx={{ 
              px: 4, 
              fontWeight: 700, 
              textTransform: 'none', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' 
            }}
          >
            {editing ? 'Update Material' : 'Create Material'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
