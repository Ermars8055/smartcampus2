import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Dialog,
  Tooltip, Select, FormControl, InputLabel, TableSortLabel, useTheme, useMediaQuery, MenuItem, DialogTitle, DialogContent, DialogActions, IconButton, TablePagination
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import {
  Add, Search, Edit, ArrowDropUp, ArrowDropDown,
  Inventory, Description, Category, Straighten, Warehouse,
  Percent, Speed, CurrencyRupee, Tag, QrCodeScanner, Print
} from '@mui/icons-material';
import api from '../services/api';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [errors, setErrors] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });
  const [qrDialog, setQrDialog] = useState(false);
  const [selectedQrMaterial, setSelectedQrMaterial] = useState(null);
  const [printLabelCount, setPrintLabelCount] = useState(12);
  const [labelFormat, setLabelFormat] = useState(32);
  const [form, setForm] = useState({
    code: '', name: '', alias: '', reference_no: '', category_id: '', subcategory_id: '', uom_id: '', warehouse_id: '', reorder_level: 0,
    maximum_level: 0, standard_cost: 0, gst_rate: 0, storage_type: 'General',
    material_type: '', hsn_code: '', description: ''
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [totalCount, setTotalCount] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const load = () => {
    setLoading(true);
    const params = {
      skip: page * rowsPerPage,
      limit: rowsPerPage
    };
    if (search) params.search = search;
    if (catFilter) params.category_id = catFilter;
    if (storeFilter) params.warehouse_id = storeFilter;
    api.get('/api/materials', { params }).then(r => {
      setMaterials(r.data.items || []);
      setTotalCount(r.data.total || 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/categories'),
      api.get('/api/uom'),
      api.get('/api/vendors'),
      api.get('/api/subcategories'),
      api.get('/api/warehouses'),
    ]).then(([c, u, v, s, w]) => {
      setCategories(c.data);
      setUoms(u.data);
      setVendors(v.data);
      setSubcategories(s.data);
      setWarehouses(w.data);
    });
  }, []);

  useEffect(() => { setPage(0); }, [search, catFilter, storeFilter]);
  useEffect(() => { load(); }, [search, catFilter, storeFilter, page, rowsPerPage]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Material name is required';
    if (!form.category_id) newErrors.category_id = 'Category is required';
    if (!form.uom_id) newErrors.uom_id = 'UOM is required';

    if (form.gst_rate < 0 || form.gst_rate > 100) {
      newErrors.gst_rate = 'GST Rate must be between 0 and 100';
    } else if (form.gst_rate.toString().includes('.') && form.gst_rate.toString().split('.')[1].length > 2) {
      newErrors.gst_rate = 'GST Rate allows maximum 2 decimal places';
    }

    if (form.standard_cost < 0) {
      newErrors.standard_cost = 'Standard Cost cannot be negative';
    } else if (form.standard_cost > 1000000000) {
      newErrors.standard_cost = 'Standard Cost cannot exceed 100 Crores';
    } else if (form.standard_cost.toString().includes('.') && form.standard_cost.toString().split('.')[1].length > 2) {
      newErrors.standard_cost = 'Standard Cost allows maximum 2 decimal places';
    }

    if (form.reorder_level < 0) {
      newErrors.reorder_level = 'Reorder Level must be a positive number';
    } else if (!Number.isInteger(Number(form.reorder_level))) {
      newErrors.reorder_level = 'Reorder Level must be a whole number';
    }

    if (form.maximum_level < 0) {
      newErrors.maximum_level = 'Maximum Level must be a positive number';
    } else if (!Number.isInteger(Number(form.maximum_level))) {
      newErrors.maximum_level = 'Maximum Level must be a whole number';
    }
    if (Number(form.maximum_level) > 0 && Number(form.maximum_level) <= Number(form.reorder_level)) {
      newErrors.maximum_level = 'Maximum Level must be greater than Reorder Level';
    }
    if (!form.material_type) {
      newErrors.material_type = 'Material type is required';
    }

    if (form.hsn_code && !/^(\d{2}|\d{4}|\d{6}|\d{8})$/.test(form.hsn_code)) {
      newErrors.hsn_code = 'HSN Code must be 2, 4, 6, or 8 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    if (!validateForm()) return;

    try {
      const payload = {
        name: form.name,
        alias: form.alias,
        reference_no: form.reference_no,
        category_id: form.category_id,
        subcategory_id: form.subcategory_id || null,
        uom_id: form.uom_id,
        warehouse_id: form.warehouse_id || null,
        reorder_level: Number(form.reorder_level),
        maximum_level: Number(form.maximum_level),
        standard_cost: Number(form.standard_cost),
        gst_rate: Number(form.gst_rate),
        storage_type: form.storage_type,
        material_type: form.material_type,
        hsn_code: form.hsn_code,
        description: form.description
      };

      if (!editing && form.code) payload.code = form.code;

      if (editing) {
        await api.put(`/api/materials/${editing}`, payload);
      } else {
        await api.post('/api/materials', payload);
      }
      setDialog(false);
      setEditing(null);
      setErrors({});
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const serverErrors = {};
        detail.forEach(e => {
          if (e.loc?.includes('name')) serverErrors.name = e.msg;
          else if (e.loc?.includes('code')) serverErrors.code = e.msg;
        });
        setErrors(serverErrors);
      } else {
        alert(detail || 'Error saving material');
      }
    }
  };

  const formatQty = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Math.round(Number(val)).toLocaleString('en-IN');
  };

  const formatAmt = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const openEdit = (m, view = false) => {
    setEditing(m.id);
    setViewOnly(view);
    setErrors({});
    setForm({
      code: m.code, name: m.name, alias: m.alias || '', reference_no: m.reference_no || '', category_id: m.category_id, subcategory_id: m.subcategory_id || '', uom_id: m.uom_id,
      reorder_level: m.reorder_level === 0 ? '' : m.reorder_level,
      maximum_level: m.maximum_level === 0 ? '' : m.maximum_level,
      standard_cost: m.standard_cost === 0 ? '' : m.standard_cost,
      gst_rate: m.gst_rate === 0 ? '' : (m.gst_rate || ''),
      storage_type: m.storage_type || 'General',
      material_type: m.material_type || '',
      hsn_code: m.hsn_code || '',
      warehouse_id: m.warehouse_id || '',
      description: m.description || ''
    });
    setDialog(true);
  };

  const openNew = () => {
    setEditing(null);
    setViewOnly(false);
    setErrors({});
    setForm({
      code: '', name: '', alias: '', reference_no: '', category_id: '', subcategory_id: '', uom_id: '',
      reorder_level: '', maximum_level: '', standard_cost: '', gst_rate: '',
      storage_type: 'General', material_type: '', hsn_code: '', warehouse_id: '', description: ''
    });
    setDialog(true);
  };

  const openQr = (m) => {
    setSelectedQrMaterial(m);
    setPrintLabelCount(12);
    setQrDialog(true);
  };

  const handlePrintQr = () => {
    if (!selectedQrMaterial) return;
    const printWindow = window.open('', '', 'width=800,height=800');
    
    const svgElement = document.getElementById('material-qr-svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';
    
    const formatConfigs = {
      1: { columns: 1, height: '95vh', svgSize: 300, nameSize: '2rem', codeSize: '1.5rem', uomSize: '1.2rem', padding: '40px', gap: '20px' },
      2: { columns: 1, height: '46vh', svgSize: 200, nameSize: '1.5rem', codeSize: '1.2rem', uomSize: '1rem', padding: '30px', gap: '20px' },
      4: { columns: 2, height: '46vh', svgSize: 180, nameSize: '1.3rem', codeSize: '1.1rem', uomSize: '0.9rem', padding: '20px', gap: '20px' },
      8: { columns: 2, height: '23vh', svgSize: 150, nameSize: '1.1rem', codeSize: '0.9rem', uomSize: '0.8rem', padding: '15px', gap: '15px' },
      12: { columns: 3, height: '23vh', svgSize: 120, nameSize: '0.9rem', codeSize: '0.8rem', uomSize: '0.7rem', padding: '12px', gap: '15px' },
      16: { columns: 4, height: '23vh', svgSize: 100, nameSize: '0.8rem', codeSize: '0.7rem', uomSize: '0.65rem', padding: '10px', gap: '10px' },
      32: { columns: 4, height: '11.5vh', svgSize: 80, nameSize: '0.7rem', codeSize: '0.6rem', uomSize: '0.55rem', padding: '5px', gap: '5px' }
    };
    
    const config = formatConfigs[labelFormat] || formatConfigs[32];

    let labelsHtml = '';
    for (let i = 0; i < printLabelCount; i++) {
      labelsHtml += `
        <div class="label-container">
          <div class="material-name" title="${selectedQrMaterial.name}">${selectedQrMaterial.name}</div>
          <div class="material-code">${selectedQrMaterial.code}</div>
          <div class="qr-code-container">${svgHtml}</div>
          <div class="uom">UOM: ${selectedQrMaterial.uom_name}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label</title>
          <style>
            @page { margin: 0; size: auto; }
            body { 
              font-family: sans-serif; 
              margin: 0; 
              padding: 15px; 
              box-sizing: border-box;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(${config.columns}, 1fr);
              gap: ${config.gap};
              justify-content: start;
              align-content: start;
            }
            .label-container { 
              text-align: center; 
              border: 1px dashed #999; 
              padding: ${config.padding}; 
              border-radius: 4px; 
              page-break-inside: avoid; 
              background: #fff;
              overflow: hidden;
              height: ${config.height};
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              box-sizing: border-box;
            }
            .material-name { 
              font-weight: bold; 
              font-size: ${config.nameSize}; 
              margin-bottom: 2px; 
              white-space: nowrap; 
              overflow: hidden; 
              text-overflow: ellipsis; 
            }
            .material-code { color: #666; margin-bottom: 5px; font-size: ${config.codeSize}; }
            .uom { font-size: ${config.uomSize}; margin-top: 3px; color: #444; }
            .qr-code-container svg { width: ${config.svgSize}px; height: ${config.svgSize}px; }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>Material Master</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>{totalCount} materials</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>Add Material</Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search materials by name, code or alias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 400 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#94A3B8' }} />,
              sx: { borderRadius: 2 }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Store</InputLabel>
            <Select
              value={storeFilter}
              label="Filter by Store"
              onChange={e => setStoreFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Stores</MenuItem>
              {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={catFilter}
              label="Filter by Category"
              onChange={e => setCatFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 1.5 }}>
            {sortedMaterials.length === 0 && !loading && (
              <Typography variant="body2" align="center" sx={{ py: 4, color: '#94A3B8' }}>
                No materials found.
              </Typography>
            )}
            {sortedMaterials.map(m => (
              <Card key={m.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#2563EB' } }} onClick={() => openEdit(m, true)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1, alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>{m.name}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#2563EB' }}>{m.code}</Typography>
                  </Box>
                  <Chip
                    label={m.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    color={m.is_active ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#334155' }}><strong>Category:</strong> {m.category_name} | <strong>UOM:</strong> {m.uom_name}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}><strong>Type:</strong> {m.material_type}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Stock / Reorder</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={formatQty(m.current_stock)}
                        size="small"
                        color={(m.current_stock || 0) < m.reorder_level ? 'error' : 'success'}
                        sx={{ fontWeight: 700, minWidth: 40, height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748B' }}>/ {formatQty(m.reorder_level)}</Typography>
                    </Box>
                  </Box>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="QR Code">
                      <IconButton size="small" onClick={() => openQr(m)} sx={{ color: '#64748B', mr: 0.5 }}>
                        <QrCodeScanner fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Material">
                      <IconButton size="small" onClick={() => openEdit(m, false)} sx={{ color: '#64748B' }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'code'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('code')}
                    >
                      CODE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'name'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('name')}
                    >
                      MATERIAL NAME
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'category'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('category')}
                    >
                      CATEGORY
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'uom'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('uom')}
                    >
                      UOM
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'gst_rate'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('gst_rate')}
                    >
                      GST
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'standard_cost'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('standard_cost')}
                    >
                      COST
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'reorder_level'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('reorder_level')}
                    >
                      REORDER
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'stock'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('stock')}
                    >
                      STOCK
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'material_type'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('material_type')}
                    >
                      TYPE
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>
                    <TableSortLabel
                      active={sortConfig.key === 'is_active'}
                      direction={sortConfig.direction}
                      onClick={() => handleSort('is_active')}
                    >
                      STATUS
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', px: 1 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedMaterials.map(m => (
                  <TableRow
                    key={m.id}
                    hover
                    onClick={() => openEdit(m, true)}
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#2563EB', fontSize: '0.8rem', px: 1 }}>{m.code}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500, px: 1 }}>{m.name}</TableCell>
                    <TableCell sx={{ py: 1, px: 1 }}>
                      <Chip label={m.category_name} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', px: 1 }}>{m.uom_name}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', px: 1 }}>{formatAmt(m.gst_rate)}%</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, px: 1 }}>₹{formatAmt(m.standard_cost)}</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.8rem', px: 1 }}>{formatQty(m.reorder_level)}</TableCell>
                    <TableCell align="right" sx={{ px: 1 }}>
                      <Chip
                        label={formatQty(m.current_stock)}
                        size="small"
                        color={(m.current_stock || 0) < m.reorder_level ? 'error' : 'success'}
                        sx={{ fontWeight: 700, minWidth: 45, height: 22, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ px: 1 }}>
                      <Chip
                        label={m.material_type}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                        color={m.material_type === 'Non-Consumable' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell sx={{ px: 1 }}>
                      <Chip
                        label={m.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={m.is_active ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0 }} onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="QR Code">
                          <IconButton size="small" onClick={() => openQr(m)} sx={{ color: '#64748B' }}>
                            <QrCodeScanner fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Material">
                          <IconButton size="small" onClick={() => openEdit(m, false)} sx={{ color: '#64748B' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {materials.length === 0 && !loading && (
                  <TableRow><TableCell colSpan={11} sx={{ textAlign: 'center', py: 4, color: '#94A3B8' }}>No materials found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100, 250]}
        />
      </Card>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <Inventory fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {viewOnly ? 'Material Details' : (editing ? 'Edit Material Details' : 'Register New Material')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {viewOnly ? 'Comprehensive information about this material record.' : (editing ? 'Update material governance and inventory parameters.' : 'Enter the details to add a new material to the platform.')}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, pt: 2 }}>
            <TextField
              fullWidth
              label="Material Code"
              value={form.code || ''}
              placeholder="Auto-generated"
              disabled
              InputProps={{ startAdornment: <InputAdornment position="start"><Inventory sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />
            <TextField
              fullWidth
              label="Material Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              disabled={viewOnly}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ gridColumn: { sm: 'span 2' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Description sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />
            
            <TextField
              fullWidth
              label="Material Alias (comma separated)"
              value={form.alias}
              onChange={e => setForm({ ...form, alias: e.target.value })}
              disabled={viewOnly}
              placeholder="Enter alias names"
              sx={{ gridColumn: { sm: 'span 2' } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Description sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />
            <TextField
              fullWidth
              label="Material Reference No."
              value={form.reference_no}
              onChange={e => setForm({ ...form, reference_no: e.target.value })}
              disabled={viewOnly}
              placeholder="Enter old material number"
              InputProps={{ startAdornment: <InputAdornment position="start"><Tag sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <FormControl fullWidth error={!!errors.category_id}>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}
                disabled={viewOnly}
                label="Category"
                startAdornment={<InputAdornment position="start"><Category sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Sub Category</InputLabel>
              <Select
                value={form.subcategory_id}
                onChange={e => setForm({ ...form, subcategory_id: e.target.value })}
                disabled={viewOnly || !form.category_id}
                label="Sub Category"
                startAdornment={<InputAdornment position="start"><Category sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {form.category_id && subcategories.filter(s => s.category_id === form.category_id).map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth error={!!errors.uom_id}>
              <InputLabel>UOM</InputLabel>
              <Select
                value={form.uom_id}
                onChange={e => setForm({ ...form, uom_id: e.target.value })}
                disabled={viewOnly}
                label="UOM"
                startAdornment={<InputAdornment position="start"><Straighten sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {uoms.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Store</InputLabel>
              <Select
                value={form.warehouse_id}
                onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                disabled={viewOnly}
                label="Store"
                startAdornment={<InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth error={!!errors.material_type}>
              <InputLabel>Material Type</InputLabel>
              <Select
                value={form.material_type}
                onChange={e => setForm({ ...form, material_type: e.target.value })}
                disabled={viewOnly}
                label="Material Type"
                startAdornment={<InputAdornment position="start"><Category sx={{ color: '#94A3B8' }} /></InputAdornment>}
              >
                <MenuItem value="Consumable">Consumable</MenuItem>
                <MenuItem value="Non-Consumable">Non-Consumable</MenuItem>
              </Select>
              {errors.material_type && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.material_type}</Typography>}
            </FormControl>

            <TextField
              fullWidth
              label="Storage Type"
              value={form.storage_type}
              onChange={e => setForm({ ...form, storage_type: e.target.value })}
              disabled={viewOnly}
              InputProps={{ startAdornment: <InputAdornment position="start"><Warehouse sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="GST Rate (%)"
              type="number"
              value={form.gst_rate}
              onChange={e => setForm({ ...form, gst_rate: e.target.value })}
              disabled={viewOnly}
              error={!!errors.gst_rate}
              helperText={errors.gst_rate}
              inputProps={{ min: 0, max: 100, step: "0.01" }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Percent sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="HSN Code"
              value={form.hsn_code}
              onChange={e => setForm({ ...form, hsn_code: e.target.value.replace(/\D/g, '') })}
              disabled={viewOnly}
              error={!!errors.hsn_code}
              helperText={errors.hsn_code}
              inputProps={{ maxLength: 8 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Tag sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="Standard Cost (₹)"
              type="number"
              value={form.standard_cost}
              onChange={e => setForm({ ...form, standard_cost: e.target.value })}
              disabled={viewOnly}
              error={!!errors.standard_cost}
              helperText={errors.standard_cost}
              inputProps={{ min: 0, step: "0.01" }}
              InputProps={{ startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="Reorder Level"
              type="number"
              value={form.reorder_level}
              onChange={e => setForm({ ...form, reorder_level: e.target.value })}
              disabled={viewOnly}
              error={!!errors.reorder_level}
              helperText={errors.reorder_level}
              inputProps={{ min: 0 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Speed sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="Maximum Level"
              type="number"
              value={form.maximum_level}
              onChange={e => setForm({ ...form, maximum_level: e.target.value })}
              disabled={viewOnly}
              error={!!errors.maximum_level}
              helperText={errors.maximum_level}
              inputProps={{ min: 0 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Speed sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="General Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              disabled={viewOnly}
              sx={{ gridColumn: { sm: 'span 3' } }}
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><Description sx={{ color: '#94A3B8' }} /></InputAdornment> }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={viewOnly}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              textTransform: 'none',
              display: viewOnly ? 'none' : 'inline-flex'
            }}
          >
            {editing ? 'Update Material' : 'Create Material'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={qrDialog} onClose={() => setQrDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          Material QR Code
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {selectedQrMaterial && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                {selectedQrMaterial.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedQrMaterial.code}
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <QRCodeSVG 
                  id="material-qr-svg"
                  value={JSON.stringify({ 
                    code: selectedQrMaterial.code, 
                    name: selectedQrMaterial.name, 
                    uom: selectedQrMaterial.uom_name 
                  })}
                  size={200}
                  level="M"
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 3, color: '#64748B' }}>
                UOM: {selectedQrMaterial.uom_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Format (Labels/Page)</InputLabel>
                  <Select
                    value={labelFormat}
                    label="Format (Labels/Page)"
                    onChange={e => setLabelFormat(e.target.value)}
                  >
                    <MenuItem value={1}>1 Label (Full Page)</MenuItem>
                    <MenuItem value={2}>2 Labels per page</MenuItem>
                    <MenuItem value={4}>4 Labels per page</MenuItem>
                    <MenuItem value={8}>8 Labels per page</MenuItem>
                    <MenuItem value={12}>12 Labels per page</MenuItem>
                    <MenuItem value={16}>16 Labels per page</MenuItem>
                    <MenuItem value={32}>32 Labels per page</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  label="Total to Print"
                  size="small"
                  value={printLabelCount}
                  onChange={e => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > 180) val = 180;
                    setPrintLabelCount(val);
                  }}
                  inputProps={{ min: 1, max: 180 }}
                  sx={{ width: 140 }}
                />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="outlined" onClick={() => setQrDialog(false)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Print />} 
            onClick={handlePrintQr}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
          >
            Print Label
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
