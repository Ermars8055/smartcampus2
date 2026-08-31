import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, IconButton,
  MenuItem, Select, FormControl, InputLabel, Divider, Paper, Autocomplete,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Delete, ArrowBack, AttachFile, OpenInNew } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useConfig } from '../context/ConfigContext';
import { computeGstSplit } from '../utils/gstCalculations';
import { useMessage } from '../context/MessageContext';
export default function RegisterInvoice() {
  const { showMessage } = useMessage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { tenantConfig } = useConfig();
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pos, setPos] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [companyAddresses, setCompanyAddresses] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [errors, setErrors] = useState({});



  const [form, setForm] = useState({
    invoice_number: '',
    invoice_date: '',
    vendor_id: '',
    institution_id: '',
    po_id: '',
    eway_bill_number: '',
    delivery_note: '',
    delivery_note_date: '',
    payment_terms: '',
    reference_number: '',
    reference_date: '',
    dispatch_doc_number: '',
    dispatched_through: '',
    destination: '',
    lr_rr_number: '',
    vehicle_number: '',
    terms_of_delivery: '',
    scan_url: '',
    scan_file_name: '',
    remarks: '',
    consignee_id: '',
    buyer_id: '',
    po_date: '',
    srf_number: '',
    irn: '',
    ack_number: '',
    ack_date: '',
    transport_charges: '',
    transport_hsn: '',
    transport_cgst_rate: '',
    transport_sgst_rate: '',
    transport_igst_rate: '',
    transport_discount_percent: '',
    items: []
  });






  // Auto-clear resolved errors
  useEffect(() => {
    setErrors(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {}; // Clear all errors when form changes
    });
  }, [form]);

  useEffect(() => {
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials', { params: { limit: 10000 } }).then(r => setMaterials(r.data.items || r.data || []));
    api.get('/api/procurement/po').then(r => setPos(r.data));
    api.get('/api/uom').then(r => setUoms(r.data));
    api.get('/api/company-addresses').then(r => setCompanyAddresses(r.data));
    api.get('/api/institutions').then(r => setInstitutions(r.data));
    
    if (id) {
      api.get(`/api/invoices`).then(r => {
        const inv = r.data.find(i => i.id === parseInt(id));
        if (inv) {
          setForm({
            invoice_number: inv.invoice_number || '',
            invoice_date: inv.invoice_date || '',
            vendor_id: inv.vendor_id || '',
            institution_id: inv.institution_id || '',
            po_id: inv.po_id || '',
            eway_bill_number: inv.eway_bill_number || '',
            delivery_note: inv.delivery_note || '',
            delivery_note_date: inv.delivery_note_date || '',
            payment_terms: inv.payment_terms || '',
            reference_number: inv.reference_number || '',
            reference_date: inv.reference_date || '',
            dispatch_doc_number: inv.dispatch_doc_number || '',
            dispatched_through: inv.dispatched_through || '',
            destination: inv.destination || '',
            lr_rr_number: inv.lr_rr_number || '',
            vehicle_number: inv.vehicle_number || '',
            terms_of_delivery: inv.terms_of_delivery || '',
            scan_url: inv.scan_url || '',
            scan_file_name: inv.scan_url ? inv.scan_url.split('/').pop() : '',
            remarks: inv.remarks || '',
            consignee_id: inv.consignee_id || '',
            buyer_id: inv.buyer_id || '',
            srf_number: inv.srf_number || '',
            irn: inv.irn || '',
            ack_number: inv.ack_number || '',
            ack_date: inv.ack_date || '',
            transport_charges: inv.transport_charges || '',
            transport_hsn: inv.transport_hsn || '',
            transport_cgst_rate: inv.transport_cgst_rate || '',
            transport_sgst_rate: inv.transport_sgst_rate || '',
            transport_igst_rate: inv.transport_igst_rate || '',
            transport_discount_percent: inv.transport_discount_percent || '',
            items: inv.items ? inv.items.map(item => ({
              material_id: item.material_id || '',
              description: item.description || '',
              hsn_sac: item.hsn_sac || '',
              quantity: item.quantity || 1,
              rate: item.rate || '',
              uom: item.uom || '',
              discount_percent: item.discount_percent || '',
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





  const handlePOChange = async (poId) => {
    setForm(prev => ({ ...prev, po_id: poId }));
    if (!poId) return;
    
    try {
      const res = await api.get(`/api/procurement/po/${poId}`);
      const po = res.data;
      
      const poItems = po.items.map(item => ({
        material_id: item.material_id || '',
        description: item.material_name || '',
        hsn_sac: '',
        quantity: item.quantity || 1,
        rate: item.rate || '',
        uom: item.uom_name || '',
        discount_percent: item.discount_percent || '',
        cgst_rate: item.cgst_percentage || '',
        sgst_rate: item.sgst_percentage || '',
        igst_rate: item.igst_percentage || ''
      }));

      setForm(prev => ({
        ...prev,
        vendor_id: po.vendor_id || prev.vendor_id,
        institution_id: po.institution_id || prev.institution_id,
        po_date: po.created_at || prev.po_date,
        payment_terms: po.terms || prev.payment_terms,
        items: poItems.length > 0 ? poItems : prev.items
      }));
    } catch (err) {
      console.error("Failed to fetch PO details", err);
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
    } catch (err) { showMessage('Upload failed: ' + (err.response?.data?.detail || err.message), 'Error', 'error'); }
    setUploading(false);
  };

  const addItem = () => {
    const emptyCount = form.items.filter(it => !it.material_id).length;
    if (emptyCount >= 5) {
      showMessage("Please select materials for the existing empty rows before adding more. Limit reached (5).", 'Validation Error', 'warning');
      return;
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: '',
        description: '',
        hsn_sac: '',
        quantity: '',
        rate: '',
        uom: '',
        discount_percent: '',
        cgst_rate: '',
        sgst_rate: '',
        igst_rate: ''
      }]
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    let finalVal = value;
    if (['discount_percent', 'cgst_rate', 'sgst_rate', 'igst_rate'].includes(field)) {
      if (finalVal !== '' && parseFloat(finalVal) > 100) {
        finalVal = '100';
      }
    }
    const newItems = [...form.items];
    newItems[index][field] = finalVal;
    setForm(prev => ({ ...prev, items: newItems }));
  };

  const updateTransportPercent = (field, value) => {
    let finalVal = value.replace(/-/g, '');
    if (finalVal !== '' && parseFloat(finalVal) > 100) {
      finalVal = '100';
    }
    setForm(prev => ({ ...prev, [field]: finalVal }));
  };

  const handleMaterialSelect = (index, materialId) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
      const newItems = [...form.items];
      newItems[index] = {
        ...newItems[index],
        material_id: '',
        description: '',
        hsn_sac: '',
        uom: '',
        rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        discount_percent: 0,
        discount_amount: 0
      };
      setForm(prev => ({ ...prev, items: newItems }));
      return;
    }
    
    const newItems = [...form.items];
    const vendor = vendors.find(v => v.id === form.vendor_id);
    const vendorState = vendor?.state || '';
    const gstRate = material.gst_rate || 0;
    
    const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
      gstRate, vendorState, tenantConfig?.base_state,
      tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent
    );

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
    let total_discount = 0;

    const items = form.items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const baseAmt = qty * rate;
      const discAmt = baseAmt * ((parseFloat(item.discount_percent) || 0) / 100);
      const taxable = baseAmt - discAmt;
      const cgstAmt = taxable * ((parseFloat(item.cgst_rate) || 0) / 100);
      const sgstAmt = taxable * ((parseFloat(item.sgst_rate) || 0) / 100);
      const igstAmt = taxable * ((parseFloat(item.igst_rate) || 0) / 100);
      const amount = taxable + cgstAmt + sgstAmt + igstAmt;

      total_taxable_amount += taxable;
      total_cgst += cgstAmt;
      total_sgst += sgstAmt;
      total_igst += igstAmt;
      total_discount += discAmt;

      return { 
        ...item, 
        quantity: qty, 
        rate: rate, 
        discount_percent: parseFloat(item.discount_percent) || 0, 
        cgst_rate: parseFloat(item.cgst_rate) || 0, 
        sgst_rate: parseFloat(item.sgst_rate) || 0, 
        igst_rate: parseFloat(item.igst_rate) || 0, 
        cgst_amount: cgstAmt, 
        sgst_amount: sgstAmt, 
        igst_amount: igstAmt, 
        taxable_amount: taxable, 
        amount 
      };
    });

    const t_rate = parseFloat(form.transport_charges) || 0;
    const t_discAmt = t_rate * ((parseFloat(form.transport_discount_percent) || 0) / 100);
    const t_taxable = t_rate - t_discAmt;
    const t_cgstAmt = t_taxable * ((parseFloat(form.transport_cgst_rate) || 0) / 100);
    const t_sgstAmt = t_taxable * ((parseFloat(form.transport_sgst_rate) || 0) / 100);
    const t_igstAmt = t_taxable * ((parseFloat(form.transport_igst_rate) || 0) / 100);
    
    total_taxable_amount += t_taxable;
    total_cgst += t_cgstAmt;
    total_sgst += t_sgstAmt;
    total_igst += t_igstAmt;
    total_discount += t_discAmt;

    const tax_amount = total_cgst + total_sgst + total_igst;
    const total_amount = total_taxable_amount + tax_amount;

    return { 
      items, 
      total_taxable_amount, 
      total_cgst, 
      total_sgst, 
      total_igst, 
      total_discount, 
      tax_amount, 
      transport_charges: t_rate, 
      transport_cgst_rate: parseFloat(form.transport_cgst_rate) || 0,
      transport_sgst_rate: parseFloat(form.transport_sgst_rate) || 0,
      transport_igst_rate: parseFloat(form.transport_igst_rate) || 0,
      transport_discount_percent: parseFloat(form.transport_discount_percent) || 0,
      total_amount 
    };
  };

  const handleSave = async (submitStatus = null) => {
    const newErrors = {};

    if (!form.invoice_number?.trim?.()) newErrors.invoice_number = "Invoice Number is required.";
    if (!form.invoice_date) newErrors.invoice_date = "Invoice Date is required.";
    else if (dayjs(form.invoice_date).isAfter(dayjs(), 'day')) newErrors.invoice_date = "Invoice Date cannot be in the future.";

    if (form.delivery_note_date && dayjs(form.delivery_note_date).isAfter(dayjs(), 'day')) newErrors.delivery_note_date = "Delivery Note Date cannot be in the future.";
    if (form.reference_date && dayjs(form.reference_date).isAfter(dayjs(), 'day')) newErrors.reference_date = "Reference Date cannot be in the future.";
    
    if (!form.vendor_id) newErrors.vendor_id = "Vendor is required.";
    if (!form.institution_id) newErrors.institution_id = "Institution is required.";
    if (form.items.length === 0) newErrors.items = "At least one item is required.";

    for (let i = 0; i < form.items.length; i++) {
      const hsn = form.items[i].hsn_sac;
      if (hsn && !/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(hsn)) {
        newErrors.items = `Invalid HSN/SAC at item ${i + 1}. It must be exactly 2, 4, 6, or 8 numeric digits.`;
        break;
      }
    }

    if (form.transport_hsn && !/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(form.transport_hsn)) {
      newErrors.transport_hsn = "Invalid HSN/SAC for Transport Charges.";
    }

    if (submitStatus === 'Submitted' && !form.scan_url) {
      newErrors.scan_url = "Invoice Scan is mandatory for submitting the invoice.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setConfirmSubmit(false);
      return;
    }

    const totals = calculateTotals();
    const payload = {
      ...form,
      ...totals,
      transport_charges: totals.transport_charges,
      gate_entry_id: null,
      po_id: form.po_id || null,
      institution_id: form.institution_id || null,
      consignee_id: form.consignee_id || null,
      buyer_id: form.buyer_id || null,
      delivery_note_date: form.delivery_note_date || null,
      reference_date: form.reference_date || null,
      ack_date: form.ack_date || null,
      items: totals.items.map(item => ({
        ...item,
        material_id: item.material_id || null,
      }))
    };
    if (submitStatus) payload.status = submitStatus;

    try {
      if (id) {
        await api.put(`/api/invoices/${id}`, payload);
      } else {
        await api.post('/api/invoices', payload);
      }
      navigate('/invoices');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errMsg = Array.isArray(detail) ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ') : (detail || err.message);
      showMessage("Failed to save invoice: " + errMsg, 'Error', 'error');
    }
  };

  const totals = calculateTotals();

  const noSpinSx = {
    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0
    },
    '& input[type=number]': {
      MozAppearance: 'textfield'
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/invoices')}><ArrowBack /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{id ? 'Edit Tax Invoice' : 'Register Tax Invoice'}</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Enter comprehensive invoice details</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - General Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Invoice Code" value={form.code || 'Auto-generated'} disabled size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField id="field-invoice_number" fullWidth label="Invoice No." value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} required size="small" error={!!errors.invoice_number} helperText={errors.invoice_number} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box id="field-invoice_date">
                <DatePicker 
                  label="Invoice Date" 
                  format="DD-MMM-YYYY"
                  value={form.invoice_date ? dayjs(form.invoice_date) : null}
                  onChange={(newValue) => setForm({ ...form, invoice_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                  disableFuture
                  localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', required: true, error: !!errors.invoice_date, helperText: errors.invoice_date, InputProps: { placeholder: 'DD-MMM-YYYY' }, inputProps: { placeholder: 'DD-MMM-YYYY' }, InputLabelProps: { shrink: true } } }}
                />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl id="field-institution_id" fullWidth required size="small" error={!!errors.institution_id}>
                  <InputLabel shrink>Institution</InputLabel>
                  <Select displayEmpty value={form.institution_id} label="Institution" onChange={e => setForm({ ...form, institution_id: e.target.value })}>
                    <MenuItem value="">None</MenuItem>
                    {institutions.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>)}
                  </Select>
                  {errors.institution_id && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.institution_id}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl id="field-vendor_id" fullWidth required size="small" error={!!errors.vendor_id}>
                  <InputLabel>Vendor</InputLabel>
                  <Select 
                    value={form.vendor_id} 
                    label="Vendor" 
                    onChange={e => {
                      const vId = e.target.value;
                      const vendor = vendors.find(v => v.id === vId);
                      const vendorState = vendor?.state || '';
                      
                      const updatedItems = form.items.map(it => {
                        const material = materials.find(m => m.id === it.material_id);
                        if (!material) return it;
                        const gstRate = material.gst_rate || 0;
                        const { cgst_percentage, sgst_percentage, igst_percentage } = computeGstSplit(
                          gstRate, vendorState, tenantConfig?.base_state,
                          tenantConfig?.cgst_share_percent, tenantConfig?.sgst_share_percent
                        );
                        return { ...it, cgst_rate: cgst_percentage, sgst_rate: sgst_percentage, igst_rate: igst_percentage };
                      });
                      
                      setForm({ ...form, vendor_id: vId, items: updatedItems });
                    }}
                  >
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.code} - {v.name}</MenuItem>)}
                  </Select>
                  {errors.vendor_id && <Typography color="error" variant="caption" sx={{ ml: 2, mt: 0.5 }}>{errors.vendor_id}</Typography>}
                </FormControl>
                {form.vendor_id && vendors.find(v => v.id === form.vendor_id) && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1, ml: 1, lineHeight: 1.2 }}>
                    {vendors.find(v => v.id === form.vendor_id).address_line_1}, {vendors.find(v => v.id === form.vendor_id).address_line_2 ? vendors.find(v => v.id === form.vendor_id).address_line_2 + ', ' : ''}{vendors.find(v => v.id === form.vendor_id).city}, {vendors.find(v => v.id === form.vendor_id).state}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>PO Reference</InputLabel>
                  <Select displayEmpty value={form.po_id} label="PO Reference" onChange={e => handlePOChange(e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {pos.map(p => <MenuItem key={p.id} value={p.id}>{p.po_number}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="PO Date" value={form.po_date ? dayjs(form.po_date).format('DD-MMM-YYYY') : ''} size="small" InputProps={{ readOnly: true }} disabled={!form.po_date} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Consignee (Ship-to)</InputLabel>
                  <Select displayEmpty value={form.consignee_id} label="Consignee (Ship-to)" onChange={e => setForm({ ...form, consignee_id: e.target.value })}>
                    <MenuItem value="">None</MenuItem>
                    {companyAddresses.map(c => <MenuItem key={c.id} value={c.id}>{c.name} {c.state ? `(${c.state})` : ''}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Buyer (Bill-to)</InputLabel>
                  <Select displayEmpty value={form.buyer_id} label="Buyer (Bill-to)" onChange={e => setForm({ ...form, buyer_id: e.target.value })}>
                    <MenuItem value="">None</MenuItem>
                    {companyAddresses.map(c => <MenuItem key={c.id} value={c.id}>{c.name} {c.state ? `(${c.state})` : ''}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Dispatch & Transport Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="e-Way Bill No." value={form.eway_bill_number} onChange={e => setForm({ ...form, eway_bill_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Vehicle No." value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Delivery Note" value={form.delivery_note} onChange={e => setForm({ ...form, delivery_note: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box id="field-delivery_note_date">
                <DatePicker 
                  label="Delivery Note Date" 
                  format="DD-MMM-YYYY"
                  value={form.delivery_note_date ? dayjs(form.delivery_note_date) : null}
                  onChange={(newValue) => setForm({ ...form, delivery_note_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                  disableFuture
                  localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors.delivery_note_date, helperText: errors.delivery_note_date, InputProps: { placeholder: 'DD-MMM-YYYY' }, inputProps: { placeholder: 'DD-MMM-YYYY' }, InputLabelProps: { shrink: true } } }}
                />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Dispatch Doc No." value={form.dispatch_doc_number} onChange={e => setForm({ ...form, dispatch_doc_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Dispatched Through" value={form.dispatched_through} onChange={e => setForm({ ...form, dispatched_through: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Destination" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Bill of Lading / LR-RR No." value={form.lr_rr_number} onChange={e => setForm({ ...form, lr_rr_number: e.target.value })} size="small" />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Right Column - Upload & References */}
        <Grid item xs={12} md={4}>
          <Card id="field-scan_url" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Scan</Typography>
            <Box sx={{ p: 2, border: '2px dashed #CBD5E1', borderRadius: 2, bgcolor: '#F8FAFC', textAlign: 'center' }}>
              {form.scan_url ? (
                <Box>
                  <AttachFile sx={{ color: '#0F172A', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 1, wordBreak: 'break-all', px: 2 }}>{form.scan_file_name || form.scan_url.split('/').pop()}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button size="small" variant="outlined" onClick={() => window.open(getFileUrl(form.scan_url), '_blank')}>View</Button>
                    <Button size="small" color="error" onClick={() => setForm({ ...form, scan_url: '' })}>Remove</Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography sx={{ mb: 1, fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>Upload Document</Typography>
                  <Button variant="contained" component="label" disabled={uploading} size="small" sx={{ textTransform: 'none' }}>
                    {uploading ? 'Uploading...' : 'Choose File'}
                    <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => handleUpload(e.target.files[0])} />
                  </Button>
                </>
              )}
            </Box>
            {errors.scan_url && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>{errors.scan_url}</Typography>}
          </Card>
          
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>e-Invoice</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="IRN" value={form.irn} onChange={e => setForm({ ...form, irn: e.target.value })} size="small" multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Ack No." value={form.ack_number} onChange={e => setForm({ ...form, ack_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker 
                  label="Ack Date" 
                  format="DD-MMM-YYYY"
                  value={form.ack_date ? dayjs(form.ack_date) : null}
                  onChange={(newValue) => setForm({ ...form, ack_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                  disableFuture
                  localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', InputProps: { placeholder: 'DD-MMM-YYYY' }, inputProps: { placeholder: 'DD-MMM-YYYY' }, InputLabelProps: { shrink: true } } }}
                />
              </Grid>
            </Grid>
          </Card>
          
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Other References</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="SRF No." value={form.srf_number} onChange={e => setForm({ ...form, srf_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Reference No." value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12}>
                <Box id="field-reference_date">
                <DatePicker 
                  label="Reference Date" 
                  format="DD-MMM-YYYY"
                  value={form.reference_date ? dayjs(form.reference_date) : null}
                  onChange={(newValue) => setForm({ ...form, reference_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                  disableFuture
                  localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                  slotProps={{ textField: { fullWidth: true, size: 'small', error: !!errors.reference_date, helperText: errors.reference_date, InputProps: { placeholder: 'DD-MMM-YYYY' }, inputProps: { placeholder: 'DD-MMM-YYYY' }, InputLabelProps: { shrink: true } } }}
                />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>Mode/Terms of Payment</InputLabel>
                  <Select displayEmpty value={form.payment_terms} label="Mode/Terms of Payment" onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</MenuItem>
                    <MenuItem value="Credit">Credit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Item Details */}
      <Card id="field-items" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Item Details</Typography>
          {errors.items && <Typography color="error" variant="body2">{errors.items}</Typography>}

        </Box>
        <Box sx={{ width: '100%' }}>
          <Box>
            {/* Header */}
            <Grid container columns={24} spacing={1} sx={{ mb: 1, px: 1, pb: 1, borderBottom: '2px solid #E2E8F0', fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>
              <Grid item xs={4}>Material & UOM</Grid>
              <Grid item xs={2}>HSN/SAC</Grid>
              <Grid item xs={1.5} sx={{ textAlign: 'right' }}>Qty</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>Rate</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>Disc%</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>CGST%</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>SGST%</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>IGST%</Grid>
              <Grid item xs={2.5}>Remarks</Grid>
              <Grid item xs={3} sx={{ textAlign: 'right' }}>Amount</Grid>
              <Grid item xs={1} sx={{ textAlign: 'center' }}></Grid>
            </Grid>
            
            {/* Rows */}
            {form.items.map((item, idx) => (
              <Grid container columns={24} spacing={1} key={idx} sx={{ mb: 1, px: 1, alignItems: 'center', borderBottom: '1px solid #F1F5F9', pb: 2 }}>
                <Grid item xs={4} sx={{ position: 'relative' }}>
                  <Autocomplete
                    disabled={!form.vendor_id}
                    size="small"
                    options={materials}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    value={materials.find(m => m.id === item.material_id) || null}
                    onChange={(e, newValue) => handleMaterialSelect(idx, newValue ? newValue.id : '')}
                    renderInput={(params) => (
                      <TextField {...params} variant="standard" placeholder="-- Select Material --" InputProps={{ ...params.InputProps, style: { fontSize: '0.8rem' }, disableUnderline: true }} />
                    )}
                    ListboxProps={{ style: { fontSize: '0.8rem' } }}
                  />
                  {item.material_id && materials.find(m => m.id === item.material_id) ? (
                    <Box sx={{ display: 'flex', gap: 1, position: 'absolute', left: 0, bottom: -16, width: '170%', zIndex: 1, pl: 1, alignItems: 'center' }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {materials.find(m => m.id === item.material_id).name}
                      </Typography>
                      {item.uom && (
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748B' }}>
                          ({item.uom})
                        </Typography>
                      )}
                    </Box>
                  ) : null}
                </Grid>
                <Grid item xs={2}>
                  <TextField 
                    disabled={!item.material_id}
                    fullWidth 
                    value={item.hsn_sac} 
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d{0,8}$/.test(val)) updateItem(idx, 'hsn_sac', val);
                    }} 
                    size="small" 
                    variant="standard" 
                    inputProps={{ style: { fontSize: '0.8rem' }, maxLength: 8 }} 
                  />
                </Grid>
                <Grid item xs={1.5}><TextField disabled={!item.material_id} fullWidth type="number" value={item.quantity} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(idx, 'quantity', e.target.value.replace(/-/g, ''))} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0, step: "any" }} /></Grid>
                <Grid item xs={2} sx={{ position: 'relative' }}>
                  <TextField disabled={!item.material_id} sx={noSpinSx} fullWidth type="number" value={item.rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(idx, 'rate', e.target.value.replace(/-/g, ''))} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0, step: "any" }} />
                  {item.material_id && materials.find(m => m.id === item.material_id)?.standard_cost ? (
                    <Typography sx={{ fontSize: '0.65rem', color: '#2563EB', textAlign: 'right', position: 'absolute', top: '100%', right: 0, width: '100%', pt: 0.5 }}>
                      Base: ₹{materials.find(m => m.id === item.material_id).standard_cost}
                    </Typography>
                  ) : null}
                </Grid>
                <Grid item xs={2}><TextField disabled={!item.material_id} sx={noSpinSx} fullWidth type="number" value={item.discount_percent} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(idx, 'discount_percent', e.target.value.replace(/-/g, ''))} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0, step: "any" }} /></Grid>
                <Grid item xs={2}><TextField disabled={!item.material_id || parseFloat(item.igst_rate) > 0} sx={noSpinSx} fullWidth type="number" value={item.cgst_rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(idx, 'cgst_rate', e.target.value.replace(/-/g, ''))} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0, step: "any" }} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={2}><TextField disabled={!item.material_id || parseFloat(item.igst_rate) > 0} sx={noSpinSx} fullWidth type="number" value={item.sgst_rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(idx, 'sgst_rate', e.target.value.replace(/-/g, ''))} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0, step: "any" }} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={2}><TextField disabled={!item.material_id || parseFloat(item.cgst_rate) > 0 || parseFloat(item.sgst_rate) > 0} sx={noSpinSx} fullWidth type="number" value={item.igst_rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateItem(idx, 'igst_rate', e.target.value.replace(/-/g, ''))} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0, step: "any" }} InputProps={{ readOnly: true }} /></Grid>
                <Grid item xs={2.5}>
                  <TextField disabled={!item.material_id} fullWidth placeholder="Remarks" value={item.remarks || ''} onChange={e => updateItem(idx, 'remarks', e.target.value)} size="small" variant="standard" inputProps={{ maxLength: 255, style: { fontSize: '0.8rem' } }} />
                </Grid>
                <Grid item xs={3} sx={{ textAlign: 'right', fontWeight: 600, fontSize: '0.8rem' }}>₹{Number(totals.items[idx]?.amount.toFixed(2))}</Grid>
                <Grid item xs={1} sx={{ textAlign: 'center' }}>
                  <IconButton color="error" size="small" onClick={() => removeItem(idx)} sx={{ p: 0.5 }}><Delete fontSize="small" /></IconButton>
                </Grid>
              </Grid>
            ))}

            {/* Transport Charges Row */}
            <Grid container columns={24} spacing={1} sx={{ mb: 1, px: 1, alignItems: 'center', borderBottom: '1px solid #F1F5F9', pb: 2, bgcolor: '#F8FAFC' }}>
              <Grid item xs={4}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#475569', pl: 1 }}>Transport Charges</Typography>
              </Grid>
              <Grid item xs={2}>
                <TextField 
                  id="field-transport_hsn"
                  fullWidth 
                  value={form.transport_hsn} 
                  onChange={e => {
                    const val = e.target.value;
                    if (/^\d{0,8}$/.test(val)) setForm({ ...form, transport_hsn: val });
                  }} 
                  size="small" 
                  variant="standard" 
                  inputProps={{ style: { fontSize: '0.8rem' }, maxLength: 8 }} 
                  error={!!errors.transport_hsn}
                  helperText={errors.transport_hsn}
                />
              </Grid>
              <Grid item xs={1.5}></Grid>
              <Grid item xs={2}>
                <TextField fullWidth type="number" value={form.transport_charges} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => setForm({ ...form, transport_charges: e.target.value.replace(/-/g, '') })} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0 }} />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth type="number" value={form.transport_discount_percent} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateTransportPercent('transport_discount_percent', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0 }} />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth type="number" value={form.transport_cgst_rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateTransportPercent('transport_cgst_rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0 }} />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth type="number" value={form.transport_sgst_rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateTransportPercent('transport_sgst_rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0 }} />
              </Grid>
              <Grid item xs={2}>
                <TextField fullWidth type="number" value={form.transport_igst_rate} onKeyDown={e => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} onChange={e => updateTransportPercent('transport_igst_rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' }, min: 0 }} />
              </Grid>
              <Grid item xs={2.5}></Grid>
              <Grid item xs={3} sx={{ textAlign: 'right', fontWeight: 600, fontSize: '0.8rem' }}>
                ₹{ (() => {
                     const r = parseFloat(form.transport_charges) || 0;
                     const d = r * ((parseFloat(form.transport_discount_percent) || 0) / 100);
                     const tx = r - d;
                     const cg = tx * ((parseFloat(form.transport_cgst_rate) || 0) / 100);
                     const sg = tx * ((parseFloat(form.transport_sgst_rate) || 0) / 100);
                     const ig = tx * ((parseFloat(form.transport_igst_rate) || 0) / 100);
                     return Number((tx + cg + sg + ig).toFixed(2));
                   })()
                }
              </Grid>
              <Grid item xs={1}></Grid>
            </Grid>

            {form.items.length === 0 && <Typography sx={{ py: 3, textAlign: 'center', color: '#94A3B8' }}>No items added. Click 'Add Item' to begin.</Typography>}
            <Box sx={{ p: 2 }}>
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
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Summary */}
      <Card sx={{ p: 3, mb: 3, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }} elevation={0}>
        <Grid container justifyContent="flex-end">
          <Grid item xs={12} sm={8} md={5}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{Number(totals.total_taxable_amount.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total CGST</Typography><Typography>₹{Number(totals.total_cgst.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total SGST</Typography><Typography>₹{Number(totals.total_sgst.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total IGST</Typography><Typography>₹{Number(totals.total_igst.toFixed(2))}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Transport Charges</Typography><Typography>₹{Number(totals.transport_charges.toFixed(2))}</Typography></Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>₹{Number(totals.total_amount.toFixed(2))}</Typography></Box>
          </Grid>
        </Grid>
      </Card>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mb: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/invoices')}>Cancel</Button>
        <Button variant="outlined" onClick={() => handleSave('Draft')}>Save Draft</Button>
        <Button variant="contained" color="primary" onClick={() => setConfirmSubmit(true)}>Submit Invoice</Button>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Submission</DialogTitle>
        <DialogContent dividers>
          <Typography>Submitted invoices cannot be modified. If you need to make further changes, save the invoice as a draft by clicking "Save Draft" and submit it once all updates are completed.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmSubmit(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={() => {
            setConfirmSubmit(false);
            handleSave('Submitted');
          }}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
