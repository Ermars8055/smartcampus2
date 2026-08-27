import { useState, useEffect } from 'react';
import { Box, Typography, Card, Button, TextField, MenuItem, InputAdornment, Grid, Autocomplete, Chip, Tabs, Tab, Checkbox, FormControlLabel, FormControl, InputLabel, Select, OutlinedInput, ListItemText, FormHelperText } from '@mui/material';
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

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Configurations() {
  const [tabValue, setTabValue] = useState(0);
  const [form, setForm] = useState({
    base_state: '',
    cgst_share_percent: 50,
    sgst_share_percent: 50,
    po_short_close_notify_roles: [],
    pm_advance_email_enabled: false,
    pm_advance_email_types: [],
    pm_advance_email_days: '',
    pm_advance_email_roles: [],
    pm_advance_email_users: []
  });
  const [errors, setErrors] = useState({});
  const { showMessage } = useMessage();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadConfig();
    loadRoles();
    loadUsers();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const loadRoles = async () => {
    try {
      const res = await api.get('/api/rbac/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await api.get('/api/configurations');
      if (res.data) {
        const fetchedTypes = res.data.pm_advance_email_types || [];
        const mappedTypes = fetchedTypes.map(t => {
          if (t === 'One Month') return 'Before One Month';
          if (t === 'One Week') return 'Before One Week';
          return t;
        });
        setForm({
          base_state: res.data.base_state || '',
          cgst_share_percent: res.data.cgst_share_percent !== undefined ? res.data.cgst_share_percent : 50,
          sgst_share_percent: res.data.sgst_share_percent !== undefined ? res.data.sgst_share_percent : 50,
          po_short_close_notify_roles: res.data.po_short_close_notify_roles || [],
          pm_advance_email_enabled: res.data.pm_advance_email_enabled || false,
          pm_advance_email_types: mappedTypes,
          pm_advance_email_days: res.data.pm_advance_email_days || '',
          pm_advance_email_roles: res.data.pm_advance_email_roles || [],
          pm_advance_email_users: res.data.pm_advance_email_users || []
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
        pm_advance_email_enabled: form.pm_advance_email_enabled,
        pm_advance_email_types: form.pm_advance_email_types,
        pm_advance_email_days: form.pm_advance_email_days ? Number(form.pm_advance_email_days) : null,
        pm_advance_email_roles: form.pm_advance_email_roles,
        pm_advance_email_users: form.pm_advance_email_users
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

      <Box sx={{ maxWidth: 800 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="configuration tabs">
            <Tab label="Tax Settings" />
            <Tab label="PO Short Close Settings" />
            <Tab label="PM Notification Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
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
            </Grid>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.pm_advance_email_enabled}
                    onChange={(e) => setForm({ ...form, pm_advance_email_enabled: e.target.checked })}
                  />
                }
                label="Enable Advance Email Notification"
              />

              {form.pm_advance_email_enabled && (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Notification Timing</InputLabel>
                    <Select
                      multiple
                      value={form.pm_advance_email_types}
                      onChange={(e) => setForm({ ...form, pm_advance_email_types: e.target.value })}
                      input={<OutlinedInput label="Notification Timing" />}
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {['Before One Month', 'Before One Week', 'Custom Days'].map((name) => (
                        <MenuItem key={name} value={name}>
                          <Checkbox checked={form.pm_advance_email_types.indexOf(name) > -1} />
                          <ListItemText primary={name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {form.pm_advance_email_types.includes('Custom Days') && (
                    <TextField
                      label="No. of days in advance"
                      type="number"
                      fullWidth
                      value={form.pm_advance_email_days}
                      onChange={(e) => setForm({ ...form, pm_advance_email_days: e.target.value })}
                    />
                  )}

                  <FormControl fullWidth>
                    <InputLabel>Notify Roles</InputLabel>
                    <Select
                      multiple
                      value={form.pm_advance_email_roles}
                      onChange={(e) => setForm({ ...form, pm_advance_email_roles: e.target.value })}
                      input={<OutlinedInput label="Notify Roles" />}
                      renderValue={(selected) => selected.map(code => {
                        const r = roles.find(rl => rl.code === code);
                        return r ? r.name : code;
                      }).join(', ')}
                    >
                      {roles.map((r) => (
                        <MenuItem key={r.code} value={r.code}>
                          <Checkbox checked={form.pm_advance_email_roles.indexOf(r.code) > -1} />
                          <ListItemText primary={r.name} />
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Note: This is common for all departments</FormHelperText>
                  </FormControl>
                </>
              )}
            </Box>
          </Card>
        </TabPanel>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
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
