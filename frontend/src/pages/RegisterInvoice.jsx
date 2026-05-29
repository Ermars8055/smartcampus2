import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, IconButton,
  MenuItem, Select, FormControl, InputLabel, Divider, Paper
} from '@mui/material';
import { Add, Delete, ArrowBack, AttachFile, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';

export default function RegisterInvoice() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pos, setPos] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    invoice_number: '',
    invoice_date: '',
    vendor_id: '',
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
    remarks: '',
    items: []
  });

  useEffect(() => {
    api.get('/api/vendors').then(r => setVendors(r.data));
    api.get('/api/materials').then(r => setMaterials(r.data.items || r.data || []));
    api.get('/api/procurement/po').then(r => setPos(r.data));
    api.get('/api/uom').then(r => setUoms(r.data));
    addItem();
  }, []);

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
        rate: item.rate || 0,
        uom: item.uom_name || '',
        discount_percent: item.discount_percent || 0,
        cgst_rate: item.cgst_percentage || 0,
        sgst_rate: item.sgst_percentage || 0,
        igst_rate: item.igst_percentage || 0
      }));

      setForm(prev => ({
        ...prev,
        vendor_id: po.vendor_id || prev.vendor_id,
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
      setForm(prev => ({ ...prev, scan_url: res.data.url }));
    } catch (err) { alert('Upload failed: ' + (err.response?.data?.detail || err.message)); }
    setUploading(false);
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        material_id: '',
        description: '',
        hsn_sac: '',
        quantity: 1,
        rate: 0,
        uom: '',
        discount_percent: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0
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
    const newItems = [...form.items];
    newItems[index][field] = value;
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

      return { ...item, cgst_amount: cgstAmt, sgst_amount: sgstAmt, igst_amount: igstAmt, taxable_amount: taxable, amount };
    });

    const tax_amount = total_cgst + total_sgst + total_igst;
    const total_amount = total_taxable_amount + tax_amount;

    return { items, total_taxable_amount, total_cgst, total_sgst, total_igst, total_discount, tax_amount, total_amount };
  };

  const handleSave = async () => {
    if (!form.invoice_number.trim()) return alert("Invoice Number is required.");
    if (!form.invoice_date) return alert("Invoice Date is required.");
    if (!form.vendor_id) return alert("Vendor is required.");
    if (form.items.length === 0) return alert("At least one item is required.");

    for (let i = 0; i < form.items.length; i++) {
      const hsn = form.items[i].hsn_sac;
      if (hsn && !/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(hsn)) {
        return alert(`Invalid HSN/SAC at item ${i + 1}. It must be exactly 2, 4, 6, or 8 numeric digits.`);
      }
    }

    const totals = calculateTotals();
    const payload = {
      ...form,
      ...totals,
      gate_entry_id: null,
      po_id: form.po_id || null,
      delivery_note_date: form.delivery_note_date || null,
      reference_date: form.reference_date || null
    };

    try {
      await api.post('/api/invoices', payload);
      navigate('/invoices');
    } catch (err) {
      alert("Failed to save invoice: " + (err.response?.data?.detail || err.message));
    }
  };

  const totals = calculateTotals();

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton onClick={() => navigate('/invoices')}><ArrowBack /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Register Tax Invoice</Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>Enter comprehensive invoice details</Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Button variant="outlined" sx={{ mr: 2 }} onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save Invoice</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - General Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Invoice No." value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })} required size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="date" label="Invoice Date" InputLabelProps={{ shrink: true }} value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} required size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Vendor</InputLabel>
                  <Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
                    {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>PO Reference (Optional)</InputLabel>
                  <Select value={form.po_id} label="PO Reference (Optional)" onChange={e => handlePOChange(e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {pos.map(p => <MenuItem key={p.id} value={p.id}>{p.po_number}</MenuItem>)}
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
                <TextField fullWidth type="date" label="Delivery Note Date" InputLabelProps={{ shrink: true }} value={form.delivery_note_date} onChange={e => setForm({ ...form, delivery_note_date: e.target.value })} size="small" />
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
          <Card sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Scan</Typography>
            <Box sx={{ p: 2, border: '2px dashed #CBD5E1', borderRadius: 2, bgcolor: '#F8FAFC', textAlign: 'center' }}>
              {form.scan_url ? (
                <Box>
                  <AttachFile sx={{ color: '#0F172A', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 1 }}>File Attached</Typography>
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
          </Card>
          
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Other References</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Reference No." value={form.reference_number} onChange={e => setForm({ ...form, reference_number: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth type="date" label="Reference Date" InputLabelProps={{ shrink: true }} value={form.reference_date} onChange={e => setForm({ ...form, reference_date: e.target.value })} size="small" />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Mode/Terms of Payment</InputLabel>
                  <Select value={form.payment_terms} label="Mode/Terms of Payment" onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
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

      {/* Line Items */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Line Items</Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={addItem} size="small">Add Item</Button>
        </Box>
        <Box sx={{ width: '100%' }}>
          <Box>
            {/* Header */}
            <Grid container columns={24} spacing={1} sx={{ mb: 1, px: 1, pb: 1, borderBottom: '2px solid #E2E8F0', fontWeight: 600, color: '#475569', fontSize: '0.75rem' }}>
              <Grid item xs={3}>Material</Grid>
              <Grid item xs={2}>HSN</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>Qty</Grid>
              <Grid item xs={2.5} sx={{ textAlign: 'right' }}>Rate</Grid>
              <Grid item xs={2}>UOM</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>Disc%</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>CGST%</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>SGST%</Grid>
              <Grid item xs={2} sx={{ textAlign: 'right' }}>IGST%</Grid>
              <Grid item xs={3.5} sx={{ textAlign: 'right' }}>Amount</Grid>
              <Grid item xs={1} sx={{ textAlign: 'center' }}></Grid>
            </Grid>
            
            {/* Rows */}
            {form.items.map((item, idx) => (
              <Grid container columns={24} spacing={1} key={idx} sx={{ mb: 1, px: 1, alignItems: 'center', borderBottom: '1px solid #F1F5F9', pb: 2 }}>
                <Grid item xs={3} sx={{ position: 'relative' }}>
                  <FormControl fullWidth size="small" variant="standard">
                    <Select 
                      displayEmpty 
                      value={item.material_id || ''} 
                      onChange={e => updateItem(idx, 'material_id', e.target.value)} 
                      disableUnderline 
                      sx={{ fontSize: '0.8rem' }}
                      renderValue={(selected) => {
                        if (!selected) return <em>-- Select --</em>;
                        const m = materials.find(mat => mat.id === selected);
                        return m ? m.code : '';
                      }}
                    >
                      <MenuItem value=""><em>-- Select Material --</em></MenuItem>
                      {materials.map(m => <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.8rem' }}>{m.code} - {m.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {item.material_id && materials.find(m => m.id === item.material_id) ? (
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', position: 'absolute', left: 0, bottom: -16, width: '250%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', zIndex: 1, pl: 1 }}>
                      {materials.find(m => m.id === item.material_id).name}
                    </Typography>
                  ) : null}
                </Grid>
                <Grid item xs={2}>
                  <TextField 
                    fullWidth 
                    value={item.hsn_sac} 
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d{0,8}$/.test(val)) {
                        updateItem(idx, 'hsn_sac', val);
                      }
                    }} 
                    size="small" 
                    variant="standard" 
                    inputProps={{ style: { fontSize: '0.8rem' }, maxLength: 8 }} 
                  />
                </Grid>
                <Grid item xs={2}><TextField fullWidth type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
                <Grid item xs={2.5} sx={{ position: 'relative' }}>
                  <TextField fullWidth type="number" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} />
                  {item.material_id && materials.find(m => m.id === item.material_id)?.standard_cost ? (
                    <Typography sx={{ fontSize: '0.65rem', color: '#2563EB', textAlign: 'right', position: 'absolute', right: 0, bottom: -16, width: '100%', pr: 1 }}>
                      Base: ₹{materials.find(m => m.id === item.material_id).standard_cost}
                    </Typography>
                  ) : null}
                </Grid>
                <Grid item xs={2}>
                  <FormControl fullWidth size="small" variant="standard">
                    <Select displayEmpty value={item.uom || ''} onChange={e => updateItem(idx, 'uom', e.target.value)} disableUnderline sx={{ fontSize: '0.8rem' }}>
                      <MenuItem value=""></MenuItem>
                      {uoms.map(u => <MenuItem key={u.id} value={u.name} sx={{ fontSize: '0.8rem' }}>{u.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}><TextField fullWidth type="number" value={item.discount_percent} onChange={e => updateItem(idx, 'discount_percent', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
                <Grid item xs={2}><TextField fullWidth type="number" value={item.cgst_rate} onChange={e => updateItem(idx, 'cgst_rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
                <Grid item xs={2}><TextField fullWidth type="number" value={item.sgst_rate} onChange={e => updateItem(idx, 'sgst_rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
                <Grid item xs={2}><TextField fullWidth type="number" value={item.igst_rate} onChange={e => updateItem(idx, 'igst_rate', e.target.value)} size="small" variant="standard" inputProps={{ style: { textAlign: 'right', fontSize: '0.8rem' } }} /></Grid>
                <Grid item xs={3.5} sx={{ textAlign: 'right', fontWeight: 600, fontSize: '0.8rem' }}>₹{totals.items[idx]?.amount.toFixed(2)}</Grid>
                <Grid item xs={1} sx={{ textAlign: 'center' }}>
                  <IconButton color="error" size="small" onClick={() => removeItem(idx)} sx={{ p: 0.5 }}><Delete fontSize="small" /></IconButton>
                </Grid>
              </Grid>
            ))}
            {form.items.length === 0 && <Typography sx={{ py: 3, textAlign: 'center', color: '#94A3B8' }}>No items added. Click 'Add Item' to begin.</Typography>}
          </Box>
        </Box>
      </Card>

      {/* Summary */}
      <Grid container justifyContent="flex-end">
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Invoice Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total Taxable Value</Typography><Typography>₹{totals.total_taxable_amount.toFixed(2)}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total CGST</Typography><Typography>₹{totals.total_cgst.toFixed(2)}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography color="textSecondary">Total SGST</Typography><Typography>₹{totals.total_sgst.toFixed(2)}</Typography></Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography color="textSecondary">Total IGST</Typography><Typography>₹{totals.total_igst.toFixed(2)}</Typography></Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>₹{totals.total_amount.toFixed(2)}</Typography></Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
