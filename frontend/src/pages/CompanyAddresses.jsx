import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Chip, Grid, InputAdornment, Badge, Select, MenuItem, InputLabel, FormControl, OutlinedInput
} from '@mui/material';
import { Add, Edit, Delete, Close, Business, LocationCity, Map, Numbers, Receipt, LocationOn, Person, Phone, Email, AppRegistration, PinDrop, Description, Store } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

const STATES_LIST = [
  "01 - Jammu & Kashmir", "02 - Himachal Pradesh", "03 - Punjab", "04 - Chandigarh",
  "05 - Uttarakhand", "06 - Haryana", "07 - Delhi", "08 - Rajasthan",
  "09 - Uttar Pradesh", "10 - Bihar", "11 - Sikkim", "12 - Arunachal Pradesh",
  "13 - Nagaland", "14 - Manipur", "15 - Mizoram", "16 - Tripura", "17 - Meghalaya",
  "18 - Assam", "19 - West Bengal", "20 - Jharkhand", "21 - Odisha", "22 - Chhattisgarh",
  "23 - Madhya Pradesh", "24 - Gujarat", "26 - Dadra and Nagar Haveli and Daman and Diu",
  "27 - Maharashtra", "29 - Karnataka", "30 - Goa", "31 - Lakshadweep", "32 - Kerala",
  "33 - Tamil Nadu", "34 - Puducherry", "35 - Andaman and Nicobar Islands",
  "36 - Telangana", "37 - Andhra Pradesh", "38 - Ladakh", "97 - Other Territory"
];

export default function CompanyAddresses() {
  const { showMessage } = useMessage();
  const [addresses, setAddresses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    code: '', name: '', contact_person: '', phone: '', email: '',
    gst_number: '', pan_number: '', address: '', city: '', state: '',
    pincode: '', bank_name: '', bank_account: '', ifsc_code: ''
  });

  const loadAddresses = async () => {
    try {
      const res = await api.get('/api/company-addresses');
      setAddresses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openModal = (addr = null) => {
    if (addr) {
      setEditingId(addr.id);
      setForm({
        code: addr.code || '',
        name: addr.name || '',
        contact_person: addr.contact_person || '',
        phone: addr.phone || '',
        email: addr.email || '',
        gst_number: addr.gst_number || '',
        pan_number: addr.pan_number || '',
        address: addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || '',
        bank_name: addr.bank_name || '',
        bank_account: addr.bank_account || '',
        ifsc_code: addr.ifsc_code || ''
      });
    } else {
      setEditingId(null);
      setForm({
        code: '', name: '', contact_person: '', phone: '', email: '',
        gst_number: '', pan_number: '', address: '', city: '', state: '',
        pincode: '', bank_name: '', bank_account: '', ifsc_code: ''
      });
    }
    setErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Company Name is required';

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!form.gst_number) newErrors.gst_number = 'GST number is required';
    else if (!gstRegex.test(form.gst_number)) newErrors.gst_number = 'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)';

    if (form.phone && !/^\d{10,11}$/.test(form.phone)) {
      newErrors.phone = 'Contact Number must be 10 to 11 digits';
    }

    if (form.contact_person && /[^a-zA-Z\s]/.test(form.contact_person)) {
      newErrors.contact_person = 'Contact Person cannot contain numbers or special characters';
    }

    if (form.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!form.city) newErrors.city = 'City is required';

    if (!form.pincode) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode)) newErrors.pincode = 'Pincode must be exactly 6 digits';

    if (!form.state) newErrors.state = 'State is required';
    if (!form.address) newErrors.address = 'Registered Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingId) {
        await api.put(`/api/company-addresses/${editingId}`, form);
      } else {
        await api.post('/api/company-addresses', form);
      }
      setModalOpen(false);
      loadAddresses();
    } catch (e) {
      showMessage('Error saving address', 'Error', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/api/company-addresses/${id}`);
      loadAddresses();
    } catch (e) {
      showMessage('Error deleting address', 'Error', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
            <Business />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Company Addresses</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Manage billing and shipping addresses</Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openModal()}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          Add Address
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>CODE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>COMPANY NAME AND ADDRESS</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>STATE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>CONTACT</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>GSTIN</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addresses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                    No addresses found.
                  </TableCell>
                </TableRow>
              ) : (
                addresses.map((addr) => (
                  <TableRow key={addr.id} hover>
                    <TableCell>
                      <Chip label={addr.code || 'N/A'} size="small" variant="outlined" sx={{ fontWeight: 600, color: '#475569' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                        {addr.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                        {addr.address}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                        {addr.city} - {addr.pincode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block' }}>
                        {addr.state}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontWeight: 500 }}>
                        {addr.contact_person || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                        {addr.phone ? `Ph: ${addr.phone}` : ''}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                        {addr.email || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>{addr.gst_number || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => openModal(addr)}>
                        <Edit color="primary" fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(addr.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <Store fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {editingId ? 'Edit Company Address' : 'New Company Address'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {editingId ? 'Update billing and shipping address credentials.' : 'Enter the details to add a new address.'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2.5, pt: 2 }}>
            <TextField
              fullWidth
              label="Company Address Code"
              value={form.code || ''}
              placeholder="Auto-generated"
              disabled
              InputProps={{
                startAdornment: <InputAdornment position="start"><Badge sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Company Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              error={!!errors.name}
              helperText={errors.name}
              sx={{ gridColumn: { sm: 'span 2' } }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Business sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Contact Person"
              value={form.contact_person}
              onChange={e => setForm({ ...form, contact_person: e.target.value })}
              error={!!errors.contact_person}
              helperText={errors.contact_person}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Contact Number"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
              inputProps={{ maxLength: 11 }}
              error={!!errors.phone}
              helperText={errors.phone}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Email Address"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="GST Number"
              value={form.gst_number}
              onChange={e => setForm({ ...form, gst_number: e.target.value.toUpperCase().slice(0, 15) })}
              inputProps={{ maxLength: 15 }}
              required
              error={!!errors.gst_number}
              helperText={errors.gst_number}
              InputProps={{
                startAdornment: <InputAdornment position="start"><AppRegistration sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="City"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              required
              error={!!errors.city}
              helperText={errors.city}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocationCity sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Pincode"
              value={form.pincode}
              onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              inputProps={{ maxLength: 6 }}
              required
              error={!!errors.pincode}
              helperText={errors.pincode}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Numbers sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
            <TextField
              select
              fullWidth
              label="State"
              value={form.state}
              onChange={e => setForm({ ...form, state: e.target.value })}
              required
              error={!!errors.state}
              helperText={errors.state}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PinDrop sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            >
              {STATES_LIST.map((stateOption) => (
                <MenuItem key={stateOption} value={stateOption}>
                  {stateOption}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Registered Address"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              multiline
              rows={3}
              required
              error={!!errors.address}
              helperText={errors.address}
              sx={{ gridColumn: { sm: 'span 3' } }}
              InputProps={{
                startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><Description sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2, justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              textTransform: 'none'
            }}
          >
            {editingId ? 'Update Address' : 'Create Address'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
