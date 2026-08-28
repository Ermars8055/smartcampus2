import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, IconButton,
  MenuItem, Select, FormControl, InputLabel, Divider, Autocomplete
} from '@mui/material';
import { ArrowBack, AttachFile, OpenInNew, Delete, Add } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useConfig } from '../context/ConfigContext';
import { computeGstSplit } from '../utils/gstCalculations';
import { useMessage } from '../context/MessageContext';

export default function CreditNoteForm() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { tenantConfig } = useConfig();
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [companyAddresses, setCompanyAddresses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    date: '',
    vendor_id: '',
    invoice_id: '',
    original_invoice_number: '',
    original_invoice_date: '',
    consignee_id: '',
    buyer_id: '',
    dispatch_doc_number: '',
    dispatched_through: '',
    destination: '',
    reference_number: '',
    reference_date: '',
    buyer_order_number: '',
    buyer_order_date: '',
    terms_of_delivery: '',
    scan_url: '',
    scan_file_name: '',
    remarks: '',
    items: []
  });

  useEffect(() => {
    setErrors({});
  }, [form]);

  useEffect(() => {
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || r.data || []));
    api.get('/api/invoices').then(r => setInvoices(r.data));
    api.get('/api/company-addresses').then(r => setCompanyAddresses(r.data));
    
    if (id) {
      api.get(`/api/credit-notes/${id}`).then(r => {
        const cn = r.data;
        if (cn) {
          setForm({
            date: cn.date || '',
            vendor_id: cn.vendor_id || '',
            invoice_id: cn.invoice_id || '',
            original_invoice_number: cn.original_invoice_number || '',
            original_invoice_date: cn.original_invoice_date || '',
            consignee_id: cn.consignee_id || '',
            buyer_id: cn.buyer_id || '',
            dispatch_doc_number: cn.dispatch_doc_number || '',
            dispatched_through: cn.dispatched_through || '',
            destination: cn.destination || '',
            reference_number: cn.reference_number || '',
            reference_date: cn.reference_date || '',
            buyer_order_number: cn.buyer_order_number || '',
            buyer_order_date: cn.buyer_order_date || '',
            terms_of_delivery: cn.terms_of_delivery || '',
            scan_url: cn.scan_url || '',
            scan_file_name: cn.scan_url ? cn.scan_url.split('/').pop() : '',
            remarks: cn.remarks || '',
            items: cn.items ? cn.items.map(item => ({
              material_id: item.material_id || '',
              description: item.description || '',
              hsn_sac: item.hsn_sac || '',
              quantity: item.quantity || 1,
              rate: item.rate || '',
              uom: item.uom || '',
              cgst_rate: item.cgst_rate || '',
              sgst_rate: item.sgst_rate || '',
              igst_rate: item.igst_rate || '',
              remarks: item.remarks || ''
            })) : []
          });
        }
      });
    } else {
      addItem();
    }
  }, [id]);

  const handleInvoiceChange = (invId) => {
    setForm(prev => ({ ...prev, invoice_id: invId }));
    if (!invId) return;
    
    const inv = invoices.find(i => i.id === invId);
    if (inv) {
      setForm(prev => ({
        ...prev,
        vendor_id: inv.vendor_id || prev.vendor_id,
        consignee_id: inv.consignee_id || prev.consignee_id,
        buyer_id: inv.buyer_id || prev.buyer_id,
        original_invoice_number: inv.invoice_number || prev.original_invoice_number,
        original_invoice_date: inv.invoice_date || prev.original_invoice_date,
      }));
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, scan_url: res.data.url, scan_file_name: file.name }));
    } catch (err) { showMessage('Upload failed', 'Error', 'error'); }
    setUploading(false);
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: '', description: '', hsn_sac: '', quantity: '', rate: '',
        uom: '', cgst_rate: '', sgst_rate: '', igst_rate: '', remarks: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const handleMaterialSelect = (index, materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      updateItem(index, 'material_id', '');
      return;
    }
    
    const vendor = vendors.find(v => v.id === form.vendor_id);
    const vendorState = vendor?.state || '';
    const gstRate = material.gst_rate || 0;
    
    const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
      gstRate, vendorState, tenantConfig?.base_state,
      tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent
    );

    const newItems = [...form.items];
    newItems[index] = {
      ...newItems[index],
      material_id: material.id,
      description: material.name || '',
      hsn_sac: material.hsn_code || '',
      uom: material.uom_name || '',
      rate: material.standard_cost || 0,
      cgst_rate: cgst_percentage,
      sgst_rate: sgst_percentage,
      igst_rate: igst_percentage
    };
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotals = () => {
    let total_taxable_amount = 0;
    let total_cgst = 0;
    let total_sgst = 0;
    let total_igst = 0;

    const items = form.items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const taxable = qty * rate;
      const cgstAmt = taxable * ((parseFloat(item.cgst_rate) || 0) / 100);
      const sgstAmt = taxable * ((parseFloat(item.sgst_rate) || 0) / 100);
      const igstAmt = taxable * ((parseFloat(item.igst_rate) || 0) / 100);
      const amount = taxable + cgstAmt + sgstAmt + igstAmt;

      total_taxable_amount += taxable;
      total_cgst += cgstAmt;
      total_sgst += sgstAmt;
      total_igst += igstAmt;

      return { 
        ...item, quantity: qty, rate: rate,
        cgst_rate: parseFloat(item.cgst_rate) || 0, 
        sgst_rate: parseFloat(item.sgst_rate) || 0, 
        igst_rate: parseFloat(item.igst_rate) || 0, 
        cgst_amount: cgstAmt, sgst_amount: sgstAmt, igst_amount: igstAmt, 
        taxable_amount: taxable, amount 
      };
    });

    const tax_amount = total_cgst + total_sgst + total_igst;
    const total_amount = total_taxable_amount + tax_amount;

    return { items, total_taxable_amount, total_cgst, total_sgst, total_igst, total_amount };
  };

  const handleSave = async (submitStatus = 'Draft') => {
    const newErrors = {};
    if (!form.date) newErrors.date = "Date is required.";
    if (!form.vendor_id) newErrors.vendor_id = "Vendor is required.";
    if (form.items.length === 0) newErrors.items = "At least one item is required.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showMessage("Please correct the errors before saving", "Validation Error", "error");
      return;
    }

    const totals = calculateTotals();
    const payload = {
      ...form,
      ...totals,
      invoice_id: form.invoice_id || null,
      consignee_id: form.consignee_id || null,
      buyer_id: form.buyer_id || null,
      original_invoice_date: form.original_invoice_date || null,
      reference_date: form.reference_date || null,
      buyer_order_date: form.buyer_order_date || null,
      items: totals.items.map(item => ({ ...item, material_id: item.material_id || null })),
      status: submitStatus
    };

    try {
      if (id) {
        await api.put(`/api/credit-notes/${id}`, payload);
      } else {
        await api.post('/api/credit-notes', payload);
      }
      showMessage(`Credit Note ${submitStatus === 'Submitted' ? 'submitted' : 'saved'} successfully`, 'Success', 'success');
      navigate('/credit-notes');
    } catch (err) {
      showMessage(err.response?.data?.detail || "Failed to save credit note", 'Error', 'error');
    }
  };

  const totals = calculateTotals();
  const noSpinSx = { '& input[type=number]': { MozAppearance: 'textfield' }, '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 } };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/credit-notes')}><ArrowBack /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{id ? 'Edit Credit Note' : 'Create Credit Note'}</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Credit Note Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <DatePicker 
                  label="Date" format="DD-MMM-YYYY" value={form.date ? dayjs(form.date) : null}
                  onChange={(v) => setForm({ ...form, date: v ? v.format('YYYY-MM-DD') : '' })}
                  slotProps={{ textField: { fullWidth: true, size: 'small', required: true, error: !!errors.date } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth required size="small" error={!!errors.vendor_id}>
                  <InputLabel>Vendor</InputLabel>
                  <Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Original Invoice Reference</InputLabel>
                  <Select value={form.invoice_id} label="Original Invoice Reference" onChange={e => handleInvoiceChange(e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {invoices.map(i => <MenuItem key={i.id} value={i.id}>{i.invoice_number}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Original Invoice No" value={form.original_invoice_number} onChange={e => setForm({ ...form, original_invoice_number: e.target.value })} size="small" disabled={!!form.invoice_id} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker 
                  label="Original Invoice Date" format="DD-MMM-YYYY" value={form.original_invoice_date ? dayjs(form.original_invoice_date) : null}
                  onChange={(v) => setForm({ ...form, original_invoice_date: v ? v.format('YYYY-MM-DD') : '' })}
                  disabled={!!form.invoice_id}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Dispatch & Transport Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Dispatch Doc No" value={form.dispatch_doc_number} onChange={e => setForm({ ...form, dispatch_doc_number: e.target.value })} size="small" /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Dispatched Through" value={form.dispatched_through} onChange={e => setForm({ ...form, dispatched_through: e.target.value })} size="small" /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Destination" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} size="small" /></Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>References</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Reference No" value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} size="small" /></Grid>
              <Grid item xs={12}>
                <DatePicker label="Reference Date" format="DD-MMM-YYYY" value={form.reference_date ? dayjs(form.reference_date) : null} onChange={(v) => setForm({ ...form, reference_date: v ? v.format('YYYY-MM-DD') : '' })} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
              </Grid>
            </Grid>
          </Card>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Scan</Typography>
            <Box sx={{ p: 2, border: '2px dashed #CBD5E1', borderRadius: 2, bgcolor: '#F8FAFC', textAlign: 'center' }}>
              {form.scan_url ? (
                <Box>
                  <AttachFile sx={{ color: '#0F172A', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 1, wordBreak: 'break-all', px: 2 }}>{form.scan_file_name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.scan_url), '_blank')}>View</Button>
                    <Button size="small" color="error" onClick={() => setForm({ ...form, scan_url: '' })}>Remove</Button>
                  </Box>
                </Box>
              ) : (
                <Button variant="contained" component="label" disabled={uploading} size="small" sx={{ textTransform: 'none' }}>
                  {uploading ? 'Uploading...' : 'Choose File'}
                  <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0])} />
                </Button>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Line Items</Typography>
          <Button variant="outlined" size="small" startIcon={<Add />} onClick={addItem}>Add Item</Button>
        </Box>
        {errors.items && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{errors.items}</Typography>}
        <Box>
          <Grid container columns={24} spacing={1} sx={{ mb: 1, px: 1, pb: 1, borderBottom: '2px solid #E2E8F0', fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>
            <Grid item xs={5}>Material</Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>Qty</Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>Rate</Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>CGST%</Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>SGST%</Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>IGST%</Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>Amount</Grid>
            <Grid item xs={1} sx={{ textAlign: 'center' }}></Grid>
          </Grid>
          {form.items.map((item, idx) => (
            <Grid container columns={24} spacing={1} key={idx} sx={{ mb: 1, px: 1, alignItems: 'center', borderBottom: '1px solid #F1F5F9', pb: 2 }}>
              <Grid item xs={5}>
                <Autocomplete
                  disabled={!form.vendor_id}
                  size="small" options={materials} getOptionLabel={(o) => `${o.code} - ${o.name}`}
                  value={materials.find(m => m.id === item.material_id) || null}
                  onChange={(e, v) => handleMaterialSelect(idx, v ? v.id : '')}
                  renderInput={(params) => <TextField {...params} variant="standard" placeholder="Select Material" InputProps={{ ...params.InputProps, style: { fontSize: '0.8rem' }, disableUnderline: true }} />}
                />
              </Grid>
              <Grid item xs={3}><TextField fullWidth type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} size="small" variant="standard" sx={noSpinSx} inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
              <Grid item xs={3}><TextField fullWidth type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} size="small" variant="standard" sx={noSpinSx} inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
              <Grid item xs={3}><TextField fullWidth type="number" value={item.cgst_rate} onChange={e => updateItem(idx, 'cgst_rate', e.target.value)} size="small" variant="standard" sx={noSpinSx} inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} InputProps={{ readOnly: true }} /></Grid>
              <Grid item xs={3}><TextField fullWidth type="number" value={item.sgst_rate} onChange={e => updateItem(idx, 'sgst_rate', e.target.value)} size="small" variant="standard" sx={noSpinSx} inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} InputProps={{ readOnly: true }} /></Grid>
              <Grid item xs={3}><TextField fullWidth type="number" value={item.igst_rate} onChange={e => updateItem(idx, 'igst_rate', e.target.value)} size="small" variant="standard" sx={noSpinSx} inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} InputProps={{ readOnly: true }} /></Grid>
              <Grid item xs={3} sx={{ textAlign: 'right', fontWeight: 600, fontSize: '0.8rem' }}>₹{Number(totals.items[idx]?.amount.toFixed(2))}</Grid>
              <Grid item xs={1} sx={{ textAlign: 'center' }}><IconButton color="error" size="small" onClick={() => removeItem(idx)}><Delete fontSize="small" /></IconButton></Grid>
            </Grid>
          ))}
        </Box>
      </Card>

      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container justifyContent="flex-end">
          <Grid item xs={12} sm={8} md={5}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{Number(totals.total_taxable_amount.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total CGST</Typography><Typography>₹{Number(totals.total_cgst.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total SGST</Typography><Typography>₹{Number(totals.total_sgst.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total IGST</Typography><Typography>₹{Number(totals.total_igst.toFixed(2))}</Typography></Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>₹{Number(totals.total_amount.toFixed(2))}</Typography></Box>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button onClick={() => navigate('/credit-notes')}>Cancel</Button>
        <Button variant="outlined" color="primary" onClick={() => handleSave('Draft')}>Save Draft</Button>
        <Button variant="contained" color="success" onClick={() => handleSave('Submitted')}>Submit</Button>
      </Box>
    </Box>
  );
}
