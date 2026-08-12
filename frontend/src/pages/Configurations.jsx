import { useState, useEffect } from 'react';
import { Box, Typography, Card, Button, TextField, MenuItem, InputAdornment, Grid, Alert, Autocomplete, Chip } from '@mui/material';
import { Save, PinDrop, Percent, NotificationsActive } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';

const STATES_LIST = [
  '01 - Jammu And Kashmir',
  '02 - Himachal Pradesh',
  '03 - Punjab',
  '04 - Chandigarh',
  '05 - Uttarakhand',
  '06 - Haryana',
  '07 - Delhi',
  '08 - Rajasthan',
  '09 - Uttar Pradesh',
  '10 - Bihar',
  '11 - Sikkim',
  '12 - Arunachal Pradesh',
  '13 - Nagaland',
  '14 - Manipur',
  '15 - Mizoram',
  '16 - Tripura',
  '17 - Meghalaya',
  '18 - Assam',
  '19 - West Bengal',
  '20 - Jharkhand',
  '21 - Orissa',
  '22 - Chhattisgarh',
  '23 - Madhya Pradesh',
  '24 - Gujarat',
  '26 - Dadra And Nagar Haveli & Daman And Diu',
  '27 - Maharashtra',
  '29 - Karnataka',
  '30 - Goa',
  '31 - Lakshadweep',
  '32 - Kerala',
  '33 - Tamil Nadu',
  '34 - Puducherry',
  '35 - Andaman And Nicobar',
  '36 - Telangana',
  '37 - Andhra Pradesh',
  '38 - Ladakh',
  '97 - Other Territory',
  '99 - Other Country'
];

export default function Configurations() {
  const [form, setForm] = useState({
    base_state: '',
    cgst_share_percent: 50,
    sgst_share_percent: 50,
    po_short_close_notify_roles: [],
    wo_short_close_notify_roles: []
  });
  const [errors, setErrors] = useState({});
  const { showMessage } = useMessage();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    loadConfig();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await api.get('/api/rbac/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await api.get('/api/configurations');
      if (res.data) {
        setForm({
          base_state: res.data.base_state || '',
          cgst_share_percent: res.data.cgst_share_percent !== undefined ? res.data.cgst_share_percent : 50,
          sgst_share_percent: res.data.sgst_share_percent !== undefined ? res.data.sgst_share_percent : 50,
          po_short_close_notify_roles: res.data.po_short_close_notify_roles || [],
          wo_short_close_notify_roles: res.data.wo_short_close_notify_roles || []
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to load configurations:', err);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.base_state) newErrors.base_state = 'Base State is required';

    const cgst = parseFloat(form.cgst_share_percent);
    const sgst = parseFloat(form.sgst_share_percent);

    if (isNaN(cgst)) newErrors.cgst_share_percent = 'Valid number is required';
    if (isNaN(sgst)) newErrors.sgst_share_percent = 'Valid number is required';

    if (Object.keys(newErrors).length === 0) {
      if (Math.abs((cgst + sgst) - 100) > 0.01) {
        showMessage('CGST Share + SGST Share must equal 100%', 'Validation Error', 'error');
        return false;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        base_state: form.base_state,
        cgst_share_percent: Number(parseFloat(form.cgst_share_percent).toFixed(2)),
        sgst_share_percent: Number(parseFloat(form.sgst_share_percent).toFixed(2)),
        po_short_close_notify_roles: form.po_short_close_notify_roles,
        wo_short_close_notify_roles: form.wo_short_close_notify_roles
      };

      await api.put('/api/configurations', payload);
      showMessage('Configurations saved successfully', 'Success', 'success');
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to save configurations', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Configurations</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 600 }}>
        <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
            Tax Settings
          </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Base State"
              value={form.base_state}
              onChange={e => setForm({ ...form, base_state: e.target.value })}
              required
              error={!!errors.base_state}
              helperText={errors.base_state || "Used as the reference state for GST determination"}
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
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CGST Share (%)"
              type="number"
              value={form.cgst_share_percent}
              onChange={e => setForm({ ...form, cgst_share_percent: e.target.value })}
              required
              error={!!errors.cgst_share_percent}
              helperText={errors.cgst_share_percent}
              inputProps={{ step: "0.01", min: 0, max: 100 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Percent sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="SGST Share (%)"
              type="number"
              value={form.sgst_share_percent}
              onChange={e => setForm({ ...form, sgst_share_percent: e.target.value })}
              required
              error={!!errors.sgst_share_percent}
              helperText={errors.sgst_share_percent}
              inputProps={{ step: "0.01", min: 0, max: 100 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Percent sx={{ color: '#94A3B8' }} /></InputAdornment>,
              }}
            />
          </Grid>
        </Grid>

        </Card>

        <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1E293B' }}>
            Notification Settings
          </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={roles.map(r => r.name)}
              value={form.po_short_close_notify_roles}
              onChange={(e, newValue) => setForm({ ...form, po_short_close_notify_roles: newValue })}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="PO Short Close Notification Roles"
                  placeholder="Select roles"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><NotificationsActive sx={{ color: '#94A3B8', ml: 1 }} /></InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={roles.map(r => r.name)}
              value={form.wo_short_close_notify_roles}
              onChange={(e, newValue) => setForm({ ...form, wo_short_close_notify_roles: newValue })}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="WO Short Close Notification Roles"
                  placeholder="Select roles"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><NotificationsActive sx={{ color: '#94A3B8', ml: 1 }} /></InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
            sx={{ fontWeight: 600, px: 4 }}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
