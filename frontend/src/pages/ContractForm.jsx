import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, MenuItem,
  IconButton, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Autocomplete, FormControlLabel, Switch, Divider,
  InputAdornment, Tooltip
} from '@mui/material';
import { Add, Delete, Save, ArrowBack } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

export default function ContractForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const isEdit = !!id;

  const [form, setForm] = useState({
    contract_type: 'RC',
    vendor_id: '',
    institution_id: '',
    department_id: '',
    start_date: '',
    end_date: '',
    contract_value: '',
    payment_terms: '',
    exclusions: '',
    renewal_terms: '',
    sla_details: '',
    spare_parts_included: false,
    consumables_included: false,
    status: 'Draft',
    current_approval_level: 1,
    items: []
  });

  const isViewMode = isEdit && (form.status === 'Active' || form.status === 'Closed' || form.status === 'Approved' || form.status === 'Rejected' || form.current_approval_level > 1);

  const [vendors, setVendors] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/api/vendors'),
      api.get('/api/institutions'),
      api.get('/api/materials'),
      api.get('/api/equipment')
    ]).then(([vRes, iRes, mRes, eRes]) => {
      setVendors(vRes.data);
      setInstitutions(iRes.data);
      setMaterials(mRes.data.items || mRes.data);
      setEquipment(eRes.data);
    }).catch(err => {
      console.error("Error loading form dependencies", err);
      showMessage("Failed to load required data. Please refresh.", "Error", "error");
    });
  }, []);

  useEffect(() => {
    if (form.institution_id) {
      api.get('/api/departments').then(res => {
        setDepartments(res.data.filter(d => d.institution_id === form.institution_id));
      }).catch(err => {
        console.error("Error loading departments", err);
      });
    } else {
      setDepartments([]);
    }
  }, [form.institution_id]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/api/contracts/${id}`).then(res => {
        setForm({
          ...res.data,
          vendor_id: res.data.vendor_id || '',
          institution_id: res.data.institution_id || '',
          department_id: res.data.department_id || '',
          contract_value: res.data.contract_value || '',
          items: res.data.items || []
        });
      });
    }
  }, [id]);

  const validate = () => {
    const newErrs = {};
    if (!form.vendor_id) newErrs.vendor_id = 'Required';
    if (!form.start_date) newErrs.start_date = 'Required';
    if (!form.end_date) newErrs.end_date = 'Required';
    if (form.contract_type !== 'RC' && !form.contract_value) newErrs.contract_value = 'Required';
    if (form.items.length === 0) newErrs.items = 'At least one item is required';
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSave = async (isDraft = false) => {
    if (!validate()) {
      showMessage('Please fill all required fields.', 'Validation Error', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, status: isDraft ? 'Draft' : 'Submitted' };
      if (!payload.institution_id) delete payload.institution_id;
      if (!payload.department_id) delete payload.department_id;
      if (!payload.contract_value) delete payload.contract_value;
      else payload.contract_value = parseFloat(payload.contract_value);
      if (payload.start_date) payload.start_date = dayjs(payload.start_date).format('YYYY-MM-DD');
      if (payload.end_date) payload.end_date = dayjs(payload.end_date).format('YYYY-MM-DD');

      payload.items = payload.items.map(item => ({
        ...item,
        rate: item.rate !== '' && item.rate != null ? parseFloat(item.rate) : 0,
        gst: item.gst !== '' && item.gst != null ? parseFloat(item.gst) : 0,
        contract_quantity: item.contract_quantity !== '' && item.contract_quantity != null ? parseFloat(item.contract_quantity) : null,
        delivery_lead_time: item.delivery_lead_time !== '' && item.delivery_lead_time != null ? parseInt(item.delivery_lead_time) : null
      }));

      if (isEdit) {
        await api.put(`/api/contracts/${id}`, payload);
        showMessage('Contract updated successfully', 'Success', 'success');
      } else {
        await api.post('/api/contracts', payload);
        showMessage('Contract created successfully', 'Success', 'success');
      }
      navigate('/contracts');
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Error saving contract', 'Error', 'error');
    }
    setLoading(false);
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: null, equipment_id: null, uom: '', allow_decimal: false, rate: '', gst: '',
        delivery_lead_time: '', contract_quantity: '', covered_components: '', excluded_components: ''
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const getDuration = () => {
    if (form.start_date && form.end_date) {
      const start = dayjs(form.start_date);
      const end = dayjs(form.end_date);
      if (end.isBefore(start, 'day')) return "End date cannot be before start date.";
      
      const years = end.diff(start, 'year');
      const startAfterYears = start.add(years, 'year');
      const months = end.diff(startAfterYears, 'month');
      const startAfterMonths = startAfterYears.add(months, 'month');
      const days = end.diff(startAfterMonths, 'day');
      
      let durationStr = [];
      if (years > 0) durationStr.push(`${years} year${years > 1 ? 's' : ''}`);
      if (months > 0) durationStr.push(`${months} month${months > 1 ? 's' : ''}`);
      if (days > 0) durationStr.push(`${days} day${days > 1 ? 's' : ''}`);
      
      if (durationStr.length === 0) return "Duration: 0 days";
      return `Duration: ${durationStr.join(', ')}`;
    }
    return null;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/contracts')} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B' }}>
          {isViewMode ? 'View Contract' : (isEdit ? 'Edit Contract' : 'Create New Contract')}
        </Typography>
      </Box>

      <Card sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Basic Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Institution"
              value={form.institution_id}
              onChange={e => setForm({ ...form, institution_id: e.target.value, department_id: '' })}
              disabled={isViewMode}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Department"
              value={form.department_id}
              onChange={e => setForm({ ...form, department_id: e.target.value })}
              disabled={!form.institution_id || isViewMode}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={form.contract_type === 'RC' ? 6 : 4}>
            <TextField
              select
              fullWidth
              label="Contract Type"
              value={form.contract_type}
              onChange={e => setForm({ ...form, contract_type: e.target.value, items: [] })}
              disabled={isEdit}
              required
            >
              <MenuItem value="RC">Rate Contract (RC)</MenuItem>
              <MenuItem value="AMC">Annual Maintenance Contract (AMC)</MenuItem>
              <MenuItem value="CMC">Comprehensive Maintenance Contract (CMC)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={form.contract_type === 'RC' ? 6 : 4}>
            <TextField
              select
              fullWidth
              label="Vendor"
              value={form.vendor_id}
              onChange={e => setForm({ ...form, vendor_id: e.target.value })}
              error={!!errors.vendor_id}
              helperText={errors.vendor_id}
              required
              disabled={isViewMode}
            >
              {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
            </TextField>
          </Grid>
          {form.contract_type !== 'RC' && (
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Contract Value (₹) *"
                type="number"
                inputProps={{ step: "0.01" }}
                value={form.contract_value}
                onChange={e => {
                  let val = e.target.value;
                  if (val.length > 1 && val.startsWith('0') && val[1] !== '.') val = val.replace(/^0+/, '');
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setForm({ ...form, contract_value: val });
                  }
                }}
                error={!!errors.contract_value}
                helperText={errors.contract_value}
                disabled={isViewMode}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date *"
              value={form.start_date ? dayjs(form.start_date) : null}
              onChange={val => setForm({ ...form, start_date: val })}
              format="DD-MMM-YYYY"
              disabled={isViewMode}
              localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  placeholder: "DD-MMM-YYYY",
                  error: !!errors.start_date,
                  helperText: errors.start_date
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date *"
              value={form.end_date ? dayjs(form.end_date) : null}
              onChange={val => setForm({ ...form, end_date: val })}
              format="DD-MMM-YYYY"
              disabled={isViewMode}
              localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  placeholder: "DD-MMM-YYYY",
                  error: !!errors.end_date,
                  helperText: errors.end_date
                }
              }}
            />
          </Grid>
          {getDuration() && (
            <Grid item xs={12} sx={{ mt: -1 }}>
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                {getDuration()}
              </Typography>
            </Grid>
          )}
          {(form.contract_type === 'AMC' || form.contract_type === 'CMC') && (
            <Grid item xs={12} sx={{ display: 'flex', gap: 4 }}>
              <FormControlLabel
                control={<Switch disabled={form.contract_type === 'AMC' || isViewMode} checked={form.contract_type === 'AMC' ? false : form.spare_parts_included} onChange={e => setForm({ ...form, spare_parts_included: e.target.checked })} />}
                label="Spare Parts Included"
              />
              <FormControlLabel
                control={<Switch disabled={form.contract_type === 'AMC' || isViewMode} checked={form.contract_type === 'AMC' ? false : form.consumables_included} onChange={e => setForm({ ...form, consumables_included: e.target.checked })} />}
                label="Consumables Included"
              />
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Contract Items ({form.contract_type})
          </Typography>
        </Box>
        {errors.items && <Typography color="error" variant="caption" sx={{ display: 'block', mb: 1 }}>{errors.items}</Typography>}
        <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                {form.contract_type === 'RC' ? (
                  <>
                    <TableCell>MATERIAL</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell>RATE (₹)</TableCell>
                    <TableCell>GST %</TableCell>
                    <TableCell>MAX QTY</TableCell>
                    <TableCell>LEAD TIME (Days)</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>EQUIPMENT</TableCell>
                    <TableCell>COST (₹)</TableCell>
                  </>
                )}
                {!isViewMode && <TableCell align="center">ACTION</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {form.items.map((item, index) => (
                <TableRow key={index}>
                  {form.contract_type === 'RC' ? (
                    <>
                      <TableCell sx={{ minWidth: 250 }}>
                        <Autocomplete
                          options={materials}
                          getOptionLabel={(option) => `${option.code} - ${option.name}`}
                          value={materials.find(m => m.id === item.material_id) || null}
                          disabled={isViewMode}
                          onChange={(e, val) => {
                            updateItem(index, 'material_id', val?.id || null);
                            updateItem(index, 'uom', val?.uom_name || '');
                            updateItem(index, 'allow_decimal', val?.uom_allow_decimal || false);
                          }}
                          renderInput={(params) => <TextField {...params} size="small" placeholder="Select Material" />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                          {item.uom || materials.find(m => m.id === item.material_id)?.uom_name || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField 
                          size="small" 
                          type="number" 
                          inputProps={{ step: "0.01" }}
                          disabled={isViewMode} 
                          value={item.rate} 
                          onChange={e => {
                            let val = e.target.value;
                            if (val.length > 1 && val.startsWith('0') && val[1] !== '.') val = val.replace(/^0+/, '');
                            if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                              updateItem(index, 'rate', val);
                            }
                          }} 
                          sx={{ width: 100 }} 
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          size="small" 
                          type="number" 
                          disabled={isViewMode} 
                          value={item.gst} 
                          onChange={e => {
                            let val = e.target.value;
                            if (val.length > 1 && val.startsWith('0') && val[1] !== '.') val = val.replace(/^0+/, '');
                            if (val === '' || val === '.') {
                              updateItem(index, 'gst', val);
                            } else if (/^\d*\.?\d{0,2}$/.test(val)) {
                              if (parseFloat(val) <= 100) {
                                updateItem(index, 'gst', val);
                              }
                            }
                          }} 
                          sx={{ width: 80 }} 
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          size="small" 
                          type="number" 
                          disabled={isViewMode} 
                          placeholder="Optional" 
                          value={item.contract_quantity || ''} 
                          onChange={e => {
                            let val = e.target.value;
                            if (val.length > 1 && val.startsWith('0') && val[1] !== '.') val = val.replace(/^0+/, '');
                            const allow_decimal = item.allow_decimal !== undefined ? item.allow_decimal : materials.find(m => m.id === item.material_id)?.uom_allow_decimal || false;
                            if (allow_decimal) {
                              if (val === '' || /^\d*\.?\d*$/.test(val)) updateItem(index, 'contract_quantity', val);
                            } else {
                              if (val === '' || /^\d*$/.test(val)) updateItem(index, 'contract_quantity', val);
                            }
                          }} 
                          sx={{ width: 100 }} 
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          size="small" 
                          type="number" 
                          disabled={isViewMode} 
                          placeholder="Days" 
                          value={item.delivery_lead_time || ''} 
                          onChange={e => {
                            let val = e.target.value;
                            if (val === '' || /^\d{0,3}$/.test(val)) {
                              updateItem(index, 'delivery_lead_time', val);
                            }
                          }} 
                          sx={{ width: 100 }} 
                        />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={{ minWidth: 450, width: '60%' }}>
                        <Autocomplete
                          options={equipment}
                          getOptionLabel={(option) => `${option.equipment_code} - ${option.material_name} (${option.serial_number || 'No SN'})`}
                          value={equipment.find(e => e.id === item.equipment_id) || null}
                          disabled={isViewMode}
                          onChange={(e, val) => updateItem(index, 'equipment_id', val?.id || null)}
                          renderInput={(params) => <TextField {...params} size="small" placeholder="Select Equipment" />}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          size="small" 
                          type="number" 
                          inputProps={{ step: "0.01" }}
                          disabled={isViewMode} 
                          value={item.rate} 
                          onChange={e => {
                            let val = e.target.value;
                            if (val.length > 1 && val.startsWith('0') && val[1] !== '.') val = val.replace(/^0+/, '');
                            if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                              updateItem(index, 'rate', val);
                            }
                          }} 
                          sx={{ width: 100 }} 
                        />
                      </TableCell>
                    </>
                  )}
                  {!isViewMode && (
                    <TableCell align="center">
                      <Tooltip title="Remove">
                        <IconButton color="error" size="small" onClick={() => removeItem(index)}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {form.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isViewMode ? (form.contract_type === 'RC' ? 6 : 2) : (form.contract_type === 'RC' ? 7 : 3)} align="center" sx={{ py: 3, color: '#94A3B8' }}>No items added yet</TableCell>
                </TableRow>
              )}
              {!isViewMode && (
                <TableRow>
                  <TableCell colSpan={form.contract_type === 'RC' ? 7 : 3} align="center" sx={{ py: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={addItem}
                      sx={{ 
                        textTransform: 'none', 
                        fontWeight: 600, 
                        borderStyle: 'dashed', 
                        width: '100%', 
                        color: '#2563EB', 
                        fontSize: '0.95rem',
                        borderColor: '#cbd5e1', 
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } 
                      }}
                    >
                      Add Another Item
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Terms & Conditions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Payment Terms"
              value={form.payment_terms}
              onChange={e => setForm({ ...form, payment_terms: e.target.value })}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Exclusions"
              value={form.exclusions}
              onChange={e => setForm({ ...form, exclusions: e.target.value })}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="SLA Details"
              value={form.sla_details}
              onChange={e => setForm({ ...form, sla_details: e.target.value })}
              disabled={isViewMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Renewal Terms"
              value={form.renewal_terms}
              onChange={e => setForm({ ...form, renewal_terms: e.target.value })}
              disabled={isViewMode}
            />
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={() => navigate('/contracts')} sx={{ fontWeight: 600, color: '#64748B' }}>
          {isViewMode ? 'Close' : 'Cancel'}
        </Button>
        {!isViewMode && (
          <>
            <Button
              variant="outlined"
              onClick={() => handleSave(true)}
              disabled={loading}
              sx={{ fontWeight: 700, borderRadius: 2, px: 4 }}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSave(false)}
              disabled={loading}
              sx={{ fontWeight: 700, borderRadius: 2, px: 4 }}
            >
              {isEdit ? 'Update Contract' : 'Create Contract'}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
