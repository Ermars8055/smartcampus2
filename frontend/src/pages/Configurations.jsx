import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Button, TextField, MenuItem, InputAdornment, Grid,
  Autocomplete, Chip, Tabs, Tab, Checkbox, FormControlLabel, FormControl,
  InputLabel, Select, OutlinedInput, ListItemText, FormHelperText, Divider,
  IconButton, Tooltip, Table, TableHead, TableRow, TableCell, TableBody,
  Alert, CircularProgress, RadioGroup, Radio
} from '@mui/material';
import {
  Save, PinDrop, Percent, NotificationsActive, Add, DeleteOutline,
  RestartAlt, Send, Tune, EventRepeat, InfoOutlined, WarningAmber
} from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';

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

const DEFAULT_CALIBRATION_TIERS = [
  { from_days: 60, to_days: 50, frequency_days: 7, label: 'Weekly Notice' },
  { from_days: 49, to_days: 30, frequency_days: 3, label: 'Every 3 Days' },
  { from_days: 29, to_days: 0, frequency_days: 1, label: 'Daily Alert' }
];

const DEFAULT_PM_TIERS = [
  { from_days: 60, to_days: 50, frequency_days: 7, label: 'Weekly Notice' },
  { from_days: 49, to_days: 30, frequency_days: 3, label: 'Every 3 Days' },
  { from_days: 29, to_days: 0, frequency_days: 1, label: 'Daily Alert' }
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

// Helper to validate non-overlapping integer stage ranges
function validateTiers(tierList) {
  const errors = {};
  for (let i = 0; i < tierList.length; i++) {
    const t1 = tierList[i];
    const f1 = t1.from_days === '' ? NaN : Number(t1.from_days);
    const to1 = t1.to_days === '' ? NaN : Number(t1.to_days);
    const freq1 = t1.frequency_days === '' ? NaN : Number(t1.frequency_days);

    if (isNaN(f1) || isNaN(to1)) {
      errors[i] = 'Enter whole numbers for both From and To days';
      continue;
    }
    if (f1 <= to1) {
      errors[i] = `From Days (${f1}) must be greater than To Days (${to1})`;
      continue;
    }
    if (isNaN(freq1) || freq1 < 1) {
      errors[i] = 'Frequency must be at least 1 whole day';
      continue;
    }

    const min1 = Math.min(f1, to1);
    const max1 = Math.max(f1, to1);

    for (let j = 0; j < tierList.length; j++) {
      if (i === j) continue;
      const t2 = tierList[j];
      if (t2.from_days === '' || t2.to_days === '') continue;
      const f2 = Number(t2.from_days);
      const to2 = Number(t2.to_days);
      const min2 = Math.min(f2, to2);
      const max2 = Math.max(f2, to2);

      if (Math.max(min1, min2) <= Math.min(max1, max2)) {
        errors[i] = `Range ${f1}–${to1}d overlaps with Stage ${j + 1} (${f2}–${to2}d)`;
        break;
      }
    }
  }
  return errors;
}

function FrequencyTierEditor({ tiers, onChange, defaultTiers, label = "Configurable Notification Frequency Stages", onErrorChange }) {
  const currentTiers = tiers || [];
  const tierErrors = validateTiers(currentTiers);
  const hasErrors = Object.keys(tierErrors).length > 0;

  useEffect(() => {
    if (onErrorChange) {
      onErrorChange(hasErrors);
    }
  }, [hasErrors, onErrorChange]);

  const handleTierChange = (index, field, rawValue) => {
    const updated = [...currentTiers];
    let sanitizedVal = rawValue;

    // Enforce clean integers (no decimals, no negative)
    if (field === 'from_days' || field === 'to_days' || field === 'frequency_days') {
      if (rawValue === '') {
        sanitizedVal = '';
      } else {
        const cleanedStr = String(rawValue).replace(/[^0-9]/g, '');
        sanitizedVal = cleanedStr === '' ? '' : parseInt(cleanedStr, 10);
        if (field === 'frequency_days' && sanitizedVal !== '' && sanitizedVal < 1) {
          sanitizedVal = 1;
        }
      }
    }

    updated[index] = { ...updated[index], [field]: sanitizedVal };
    onChange(updated);
  };

  const handleAddTier = () => {
    // Smart auto-suggestion: Find highest covered day across existing tiers
    let maxCovered = 0;
    currentTiers.forEach(t => {
      const f = Number(t.from_days) || 0;
      const to = Number(t.to_days) || 0;
      maxCovered = Math.max(maxCovered, f, to);
    });

    const newFrom = maxCovered > 0 ? maxCovered + 30 : 30;
    const newTo = maxCovered > 0 ? maxCovered + 1 : 1;

    onChange([
      ...currentTiers,
      {
        from_days: newFrom,
        to_days: newTo,
        frequency_days: 3,
        label: `Stage ${currentTiers.length + 1}`
      }
    ]);
  };

  const handleDeleteTier = (index) => {
    const updated = currentTiers.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Prevent decimal and special chars on keydown
  const blockNonIntegerKeys = (e) => {
    if (['.', '-', 'e', 'E', '+', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

    const boxInputSx = {
      bgcolor: '#fff',
      '& .MuiOutlinedInput-root': {
        height: 40,
        fontSize: '13px',
      },
      '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
      '& input[type=number]': {
        MozAppearance: 'textfield',
      }
    };

    return (
      <Box sx={{ mt: 1, p: 2.5, border: '1px solid #E2E8F0', borderRadius: 2, bgcolor: '#F8FAFC' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventRepeat sx={{ fontSize: 18, color: '#2563EB' }} />
              {label}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Set distinct, whole-number day ranges (e.g. 60–50 days, 49–30 days, 29–0 days) without overlap.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAlt />}
              onClick={() => onChange(defaultTiers)}
              sx={{ textTransform: 'none', fontSize: '12px' }}
            >
              Load Recommended Defaults
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddTier}
              sx={{ textTransform: 'none', fontSize: '12px' }}
            >
              Add Stage
            </Button>
          </Box>
        </Box>

        {currentTiers.length === 0 ? (
          <Alert severity="info" sx={{ fontSize: '13px' }}>
            No custom stages configured. Click <strong>Load Recommended Defaults</strong> or <strong>Add Stage</strong> to configure non-overlapping notification stages.
          </Alert>
        ) : (
          <>
            <Table size="small" sx={{ bgcolor: '#FFFFFF', borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <TableHead sx={{ bgcolor: '#F1F5F9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', width: '22%', color: '#334155' }}>
                    FROM (DAYS BEFORE DUE)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', width: '22%', color: '#334155' }}>
                    TO (DAYS BEFORE DUE)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', width: '26%', color: '#334155' }}>
                    FREQUENCY (EVERY N DAYS)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', width: '24%', color: '#334155' }}>
                    LABEL / DESCRIPTION
                  </TableCell>
                  <TableCell sx={{ width: '6%', textAlign: 'center' }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTiers.map((tier, idx) => {
                  const isRowError = Boolean(tierErrors[idx]);
                  return (
                    <TableRow key={idx} sx={{ bgcolor: isRowError ? '#FFF7F7' : 'inherit' }}>
                      {/* FROM DAYS */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.2 }}>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={tier.from_days ?? ''}
                          onChange={(e) => handleTierChange(idx, 'from_days', e.target.value)}
                          onKeyDown={blockNonIntegerKeys}
                          inputProps={{ min: 0, step: 1 }}
                          error={isRowError}
                          sx={boxInputSx}
                        />
                      </TableCell>

                      {/* TO DAYS */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.2 }}>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={tier.to_days ?? ''}
                          onChange={(e) => handleTierChange(idx, 'to_days', e.target.value)}
                          onKeyDown={blockNonIntegerKeys}
                          inputProps={{ min: 0, step: 1 }}
                          error={isRowError}
                          sx={boxInputSx}
                        />
                      </TableCell>

                      {/* FREQUENCY (With inline EndAdornment badge - straight-line alignment preserved!) */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.2 }}>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={tier.frequency_days ?? ''}
                          onChange={(e) => handleTierChange(idx, 'frequency_days', e.target.value)}
                          onKeyDown={blockNonIntegerKeys}
                          inputProps={{ min: 1, step: 1 }}
                          error={isRowError}
                          sx={boxInputSx}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end" sx={{ mr: -0.5, height: '100%', display: 'flex', alignItems: 'center' }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    bgcolor: '#F1F5F9',
                                    color: '#475569',
                                    fontWeight: 600,
                                    fontSize: '11px',
                                    lineHeight: 1,
                                    px: 0.8,
                                    py: 0.35,
                                    borderRadius: 1,
                                    whiteSpace: 'nowrap',
                                    border: '1px solid #E2E8F0',
                                    userSelect: 'none'
                                  }}
                                >
                                  {Number(tier.frequency_days) === 1 ? 'Daily' :
                                   Number(tier.frequency_days) === 7 ? 'Weekly' :
                                   `Every ${tier.frequency_days || 1}d`}
                                </Typography>
                              </InputAdornment>
                            )
                          }}
                        />
                      </TableCell>

                      {/* LABEL */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.2 }}>
                        <TextField
                          size="small"
                          fullWidth
                          value={tier.label || ''}
                          placeholder="e.g. Stage 1"
                          onChange={(e) => handleTierChange(idx, 'label', e.target.value)}
                          sx={boxInputSx}
                        />
                      </TableCell>

                      {/* DELETE ACTION */}
                      <TableCell sx={{ verticalAlign: 'top', py: 1.2, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
                          <Tooltip title="Delete Stage">
                            <IconButton size="small" color="error" onClick={() => handleDeleteTier(idx)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

          {/* Overlap & Range Collision Feedback Banner */}
          {hasErrors && (
            <Alert severity="error" icon={<WarningAmber fontSize="inherit" />} sx={{ mt: 1.5, fontSize: '13px' }}>
              <strong>Stage Configuration Conflicts Detected:</strong>
              <Box component="ul" sx={{ m: 0, pl: 2.5, mt: 0.5 }}>
                {Object.entries(tierErrors).map(([idxStr, errText]) => (
                  <li key={idxStr}>Stage {Number(idxStr) + 1}: {errText}</li>
                ))}
              </Box>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

export default function Configurations() {
  const { user, permissions } = useAuth();
  const { showMessage } = useMessage();

  // Role Workflow Actions / Permissions evaluation for Configurations
  const cfgExt = permissions?.configurations?.extended_actions || {};
  const isPlatformAdmin = Boolean(user?.is_platform_admin);
  const canUpdateCfg = Boolean(permissions?.configurations?.can_update);

  const hasAnyExt = Object.keys(cfgExt).length > 0;
  const canTax = isPlatformAdmin || (hasAnyExt ? Boolean(cfgExt.can_manage_tax_settings) : canUpdateCfg);
  const canPO = isPlatformAdmin || (hasAnyExt ? Boolean(cfgExt.can_manage_po_short_close) : canUpdateCfg);
  const canPM = isPlatformAdmin || (hasAnyExt ? Boolean(cfgExt.can_manage_pm_notifications) : canUpdateCfg);
  const canCal = isPlatformAdmin || (hasAnyExt ? Boolean(cfgExt.can_manage_calibration_notifications) : canUpdateCfg);

  const availableTabs = [
    canTax && { id: 'tax', label: 'Tax Settings', index: 0 },
    canPO && { id: 'po', label: 'PO Short Close Settings', index: 1 },
    canPM && { id: 'pm', label: 'PM Notification Settings', index: 2 },
    canCal && { id: 'cal', label: 'Calibration Notification Settings', index: 3 }
  ].filter(Boolean);

  const [tabValue, setTabValue] = useState(0);

  // Timing mode switch for PM notifications (mutually exclusive)
  const [pmTimingMode, setPmTimingMode] = useState('stages'); // 'stages' | 'legacy'

  const [pmTiersError, setPmTiersError] = useState(false);
  const [calTiersError, setCalTiersError] = useState(false);

  const [form, setForm] = useState({
    base_state: '',
    cgst_share_percent: 50,
    sgst_share_percent: 50,
    po_short_close_notify_roles: [],
    po_short_close_notify_users: [],
    
    // PM Notification Settings
    pm_advance_email_enabled: false,
    pm_advance_email_types: [],
    pm_advance_email_days: '',
    pm_advance_email_roles: [],
    pm_advance_email_users: [],
    pm_advance_email_frequency_tiers: DEFAULT_PM_TIERS,

    // Calibration Notification Settings
    calibration_advance_email_enabled: false,
    calibration_advance_email_roles: [],
    calibration_advance_email_users: [],
    calibration_advance_email_frequency_tiers: DEFAULT_CALIBRATION_TIERS
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [triggeringPM, setTriggeringPM] = useState(false);
  const [triggeringCal, setTriggeringCal] = useState(false);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadConfig();
    loadRoles();
    loadUsers();
  }, []);

  // Sync initial tabValue with first available tab
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(t => t.index === tabValue)) {
      setTabValue(availableTabs[0].index);
    }
  }, [availableTabs, tabValue]);

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

        const rawPmTiers = res.data.pm_advance_email_frequency_tiers || [];
        // Sanitize existing tiers to integers
        const pmTiers = rawPmTiers.map(t => ({
          from_days: Math.round(Number(t.from_days || 0)),
          to_days: Math.round(Number(t.to_days || 0)),
          frequency_days: Math.max(1, Math.round(Number(t.frequency_days || 1))),
          label: t.label || ''
        }));

        const rawCalTiers = res.data.calibration_advance_email_frequency_tiers || [];
        const calTiers = rawCalTiers.length > 0
          ? rawCalTiers.map(t => ({
              from_days: Math.round(Number(t.from_days || 0)),
              to_days: Math.round(Number(t.to_days || 0)),
              frequency_days: Math.max(1, Math.round(Number(t.frequency_days || 1))),
              label: t.label || ''
            }))
          : DEFAULT_CALIBRATION_TIERS;

        // Mutual exclusivity detection on load for PM
        if (pmTiers.length > 0) {
          setPmTimingMode('stages');
        } else if (mappedTypes.length > 0) {
          setPmTimingMode('legacy');
        } else {
          setPmTimingMode('stages');
        }

        setForm({
          base_state: res.data.base_state || '',
          cgst_share_percent: res.data.cgst_share_percent !== undefined ? res.data.cgst_share_percent : 50,
          sgst_share_percent: res.data.sgst_share_percent !== undefined ? res.data.sgst_share_percent : 50,
          po_short_close_notify_roles: res.data.po_short_close_notify_roles || [],
          po_short_close_notify_users: res.data.po_short_close_notify_users || [],
          
          pm_advance_email_enabled: res.data.pm_advance_email_enabled || false,
          pm_advance_email_types: mappedTypes,
          pm_advance_email_days: res.data.pm_advance_email_days || '',
          pm_advance_email_roles: res.data.pm_advance_email_roles || [],
          pm_advance_email_users: res.data.pm_advance_email_users || [],
          pm_advance_email_frequency_tiers: pmTiers.length > 0 ? pmTiers : DEFAULT_PM_TIERS,

          calibration_advance_email_enabled: res.data.calibration_advance_email_enabled || false,
          calibration_advance_email_roles: res.data.calibration_advance_email_roles || [],
          calibration_advance_email_users: res.data.calibration_advance_email_users || [],
          calibration_advance_email_frequency_tiers: calTiers
        });
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Failed to load configurations:', err);
      }
    }
  };

  const handlePmModeSwitch = (mode) => {
    setPmTimingMode(mode);
    if (mode === 'stages') {
      // Clear legacy
      setForm(prev => ({
        ...prev,
        pm_advance_email_types: [],
        pm_advance_email_days: '',
        pm_advance_email_frequency_tiers: prev.pm_advance_email_frequency_tiers?.length > 0
          ? prev.pm_advance_email_frequency_tiers
          : DEFAULT_PM_TIERS
      }));
    } else {
      // Clear stages
      setForm(prev => ({
        ...prev,
        pm_advance_email_frequency_tiers: [],
        pm_advance_email_types: prev.pm_advance_email_types?.length > 0
          ? prev.pm_advance_email_types
          : ['Before One Month', 'Before One Week']
      }));
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

    if (form.pm_advance_email_enabled && pmTimingMode === 'stages') {
      if (pmTiersError) {
        showMessage('Please resolve PM frequency stage range conflicts before saving', 'Validation Error', 'error');
        return false;
      }
      if (!form.pm_advance_email_frequency_tiers || form.pm_advance_email_frequency_tiers.length === 0) {
        showMessage('Please configure at least one PM frequency stage or load defaults', 'Validation Error', 'error');
        return false;
      }
    }

    if (form.calibration_advance_email_enabled) {
      if (calTiersError) {
        showMessage('Please resolve Calibration stage range conflicts before saving', 'Validation Error', 'error');
        return false;
      }
      if (!form.calibration_advance_email_frequency_tiers || form.calibration_advance_email_frequency_tiers.length === 0) {
        showMessage('Please configure at least one Calibration frequency stage or load defaults', 'Validation Error', 'error');
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
        po_short_close_notify_roles: form.po_short_close_notify_roles || [],
        po_short_close_notify_users: form.po_short_close_notify_users || [],
        
        pm_advance_email_enabled: form.pm_advance_email_enabled,
        pm_advance_email_roles: form.pm_advance_email_roles || [],
        pm_advance_email_users: form.pm_advance_email_users || [],
        
        // Mutually exclusive save for PM: only send whichever mode is selected
        pm_advance_email_types: pmTimingMode === 'legacy' ? form.pm_advance_email_types : [],
        pm_advance_email_days: (pmTimingMode === 'legacy' && form.pm_advance_email_days) ? Number(form.pm_advance_email_days) : null,
        pm_advance_email_frequency_tiers: pmTimingMode === 'stages' ? form.pm_advance_email_frequency_tiers : [],

        calibration_advance_email_enabled: form.calibration_advance_email_enabled,
        calibration_advance_email_roles: form.calibration_advance_email_roles || [],
        calibration_advance_email_users: form.calibration_advance_email_users || [],
        calibration_advance_email_frequency_tiers: form.calibration_advance_email_frequency_tiers || []
      };

      await api.put('/api/configurations', payload);
      showMessage('Configurations saved successfully', 'Success', 'success');
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to save configurations', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPMTest = async () => {
    setTriggeringPM(true);
    try {
      const res = await api.post('/api/configurations/trigger-pm-notifications');
      const details = res.data?.details || {};
      showMessage(`PM Notifications dispatched! Emails sent: ${details.emails_sent ?? 0}`, 'Success', 'success');
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to trigger PM notifications', 'Error', 'error');
    } finally {
      setTriggeringPM(false);
    }
  };

  const handleTriggerCalTest = async () => {
    setTriggeringCal(true);
    try {
      const res = await api.post('/api/configurations/trigger-calibration-notifications');
      const details = res.data?.details || {};
      showMessage(`Calibration notifications dispatched! Items: ${details.equipment_notified ?? 0}, Emails sent: ${details.emails_sent ?? 0}`, 'Success', 'success');
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to trigger Calibration notifications', 'Error', 'error');
    } finally {
      setTriggeringCal(false);
    }
  };

  if (availableTabs.length === 0 && !isPlatformAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Configurations</Typography>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          You do not have permission to view or manage any configuration settings. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Configurations</Typography>

      <Box sx={{ maxWidth: 960 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="configuration tabs">
            {canTax && <Tab label="Tax Settings" id="config-tab-0" />}
            {canPO && <Tab label="PO Short Close Settings" id="config-tab-1" />}
            {canPM && <Tab label="PM Notification Settings" id="config-tab-2" />}
            {canCal && <Tab label="Calibration Notification Settings" id="config-tab-3" />}
          </Tabs>
        </Box>

        {/* Tab 0: Tax Settings */}
        {canTax && (
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Percent sx={{ color: '#94A3B8' }} /></InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Card>
          </TabPanel>
        )}

        {/* Tab 1: PO Short Close Settings */}
        {canPO && (
          <TabPanel value={tabValue} index={1}>
            <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1E293B' }}>
                Purchase Order Short-Close Notification Recipients
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2.5 }}>
                Configure both roles and specific users who will receive automated email alerts whenever a PO is short closed.
              </Typography>

              <Grid container spacing={3}>
                {/* Notify Roles */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={roles.map(r => r.name)}
                    value={form.po_short_close_notify_roles || []}
                    onChange={(e, newValue) => setForm({ ...form, po_short_close_notify_roles: newValue })}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip size="small" variant="outlined" label={option} {...getTagProps({ index })} />
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

                {/* Notify Specific Users */}
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    multiple
                    options={users}
                    getOptionLabel={(u) => `${u.full_name || u.username} (${u.email || 'No email'})`}
                    value={users.filter(u => (form.po_short_close_notify_users || []).includes(u.id))}
                    onChange={(e, newVals) => setForm({ ...form, po_short_close_notify_users: newVals.map(u => u.id) })}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip size="small" variant="outlined" label={option.full_name || option.username} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="PO Short Close Notification Users"
                        placeholder="Select specific users"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Card>
          </TabPanel>
        )}

        {/* Tab 2: PM Notification Settings */}
        {canPM && (
          <TabPanel value={tabValue} index={2}>
            <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.pm_advance_email_enabled}
                        onChange={(e) => setForm({ ...form, pm_advance_email_enabled: e.target.checked })}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600, color: '#1E293B' }}>
                        Enable Advance Email Notification for PM Schedule
                      </Typography>
                    }
                  />
                  {form.pm_advance_email_enabled && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={triggeringPM ? <CircularProgress size={16} /> : <Send />}
                      onClick={handleTriggerPMTest}
                      disabled={triggeringPM}
                      title="Send test PM emails for any due department now"
                      sx={{ textTransform: 'none' }}
                    >
                      {triggeringPM ? 'Sending...' : 'Test Send Now'}
                    </Button>
                  )}
                </Box>

                {form.pm_advance_email_enabled && (
                  <>
                    <Typography variant="body2" sx={{ color: '#64748B', mt: -1 }}>
                      Recipients will receive advance reminders prior to the 1st of each scheduled Preventive Maintenance month.
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Notify Roles */}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          multiple
                          options={roles}
                          getOptionLabel={(r) => r.name || r.code || ''}
                          value={roles.filter((r) => (form.pm_advance_email_roles || []).includes(r.code))}
                          onChange={(e, newVals) => setForm({ ...form, pm_advance_email_roles: newVals.map((r) => r.code) })}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip size="small" variant="outlined" label={option.name} {...getTagProps({ index })} />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField {...params} label="Notify Roles" placeholder="Select roles" />
                          )}
                        />
                      </Grid>

                      {/* Notify Specific Users */}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(u) => `${u.full_name || u.username} (${u.email || 'No email'})`}
                          value={users.filter((u) => (form.pm_advance_email_users || []).includes(u.id))}
                          onChange={(e, newVals) => setForm({ ...form, pm_advance_email_users: newVals.map((u) => u.id) })}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip size="small" variant="outlined" label={option.full_name || option.username} {...getTagProps({ index })} />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField {...params} label="Notify Specific Users" placeholder="Select users" />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* Mutually Exclusive Mode Selection */}
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1E293B' }}>
                        Notification Timing Mode
                      </Typography>
                      <RadioGroup
                        row
                        value={pmTimingMode}
                        onChange={(e) => handlePmModeSwitch(e.target.value)}
                      >
                        <FormControlLabel
                          value="stages"
                          control={<Radio size="small" />}
                          label={<Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Custom Frequency Stages (Recommended)</Typography>}
                        />
                        <FormControlLabel
                          value="legacy"
                          control={<Radio size="small" />}
                          label={<Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Standard / Legacy Timing Options</Typography>}
                        />
                      </RadioGroup>
                    </Box>

                    {/* Mode A: Custom Frequency Stages */}
                    {pmTimingMode === 'stages' && (
                      <FrequencyTierEditor
                        label="PM Notification Frequency Stages"
                        tiers={form.pm_advance_email_frequency_tiers}
                        onChange={(newTiers) => setForm({ ...form, pm_advance_email_frequency_tiers: newTiers })}
                        defaultTiers={DEFAULT_PM_TIERS}
                        onErrorChange={setPmTiersError}
                      />
                    )}

                    {/* Mode B: Legacy Timing Option */}
                    {pmTimingMode === 'legacy' && (
                      <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155', mb: 1 }}>
                          Standard Timing Selection
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={form.pm_advance_email_types.includes('Custom Days') ? 6 : 12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Legacy Timing Options</InputLabel>
                              <Select
                                multiple
                                value={form.pm_advance_email_types}
                                onChange={(e) => setForm({ ...form, pm_advance_email_types: e.target.value })}
                                input={<OutlinedInput label="Legacy Timing Options" />}
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
                          </Grid>

                          {form.pm_advance_email_types.includes('Custom Days') && (
                            <Grid item xs={12} sm={6}>
                              <TextField
                                size="small"
                                label="Custom Days in Advance"
                                type="number"
                                fullWidth
                                value={form.pm_advance_email_days}
                                onChange={(e) => setForm({ ...form, pm_advance_email_days: e.target.value.replace(/[^0-9]/g, '') })}
                                onKeyDown={(e) => {
                                  if (['.', '-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
                                }}
                                inputProps={{ min: 1, step: 1 }}
                              />
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Card>
          </TabPanel>
        )}

        {/* Tab 3: Calibration Notification Settings */}
        {canCal && (
          <TabPanel value={tabValue} index={3}>
            <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.calibration_advance_email_enabled}
                        onChange={(e) => setForm({ ...form, calibration_advance_email_enabled: e.target.checked })}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600, color: '#1E293B' }}>
                        Enable Advance Email Notification for Scheduled Calibration
                      </Typography>
                    }
                  />
                  {form.calibration_advance_email_enabled && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={triggeringCal ? <CircularProgress size={16} /> : <Send />}
                      onClick={handleTriggerCalTest}
                      disabled={triggeringCal}
                      title="Send test Calibration digest for any due equipment now"
                      sx={{ textTransform: 'none' }}
                    >
                      {triggeringCal ? 'Sending...' : 'Test Send Now'}
                    </Button>
                  )}
                </Box>

                {form.calibration_advance_email_enabled && (
                  <>
                    <Typography variant="body2" sx={{ color: '#64748B', mt: -1 }}>
                      Recipients will receive advance reminders prior to each equipment&apos;s calibration due date to allow sufficient time for obtaining quotations and scheduling vendors.
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Notify Roles */}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          multiple
                          options={roles}
                          getOptionLabel={(r) => r.name || r.code || ''}
                          value={roles.filter((r) => (form.calibration_advance_email_roles || []).includes(r.code))}
                          onChange={(e, newVals) => setForm({ ...form, calibration_advance_email_roles: newVals.map((r) => r.code) })}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip size="small" variant="outlined" label={option.name} {...getTagProps({ index })} />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField {...params} label="Notify Roles" placeholder="Select roles" />
                          )}
                        />
                      </Grid>

                      {/* Notify Specific Users */}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          multiple
                          options={users}
                          getOptionLabel={(u) => `${u.full_name || u.username} (${u.email || 'No email'})`}
                          value={users.filter((u) => (form.calibration_advance_email_users || []).includes(u.id))}
                          onChange={(e, newVals) => setForm({ ...form, calibration_advance_email_users: newVals.map((u) => u.id) })}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip size="small" variant="outlined" label={option.full_name || option.username} {...getTagProps({ index })} />
                            ))
                          }
                          renderInput={(params) => (
                            <TextField {...params} label="Notify Specific Users" placeholder="Select users" />
                          )}
                        />
                      </Grid>
                    </Grid>

                    {/* Configurable Calibration Frequency Stages */}
                    <FrequencyTierEditor
                      label="Calibration Notification Frequency Stages"
                      tiers={form.calibration_advance_email_frequency_tiers}
                      onChange={(newTiers) => setForm({ ...form, calibration_advance_email_frequency_tiers: newTiers })}
                      defaultTiers={DEFAULT_CALIBRATION_TIERS}
                      onErrorChange={setCalTiersError}
                    />

                    <Alert severity="info" icon={<InfoOutlined />} sx={{ fontSize: '13px' }}>
                      <strong>Consolidated Digest:</strong> When multiple equipment items match the notification schedule on the same day, recipients receive a single consolidated summary table to prevent inbox overflow.
                    </Alert>
                  </>
                )}
              </Box>
            </Card>
          </TabPanel>
        )}

        {/* Global Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading || (form.pm_advance_email_enabled && pmTimingMode === 'stages' && pmTiersError) || (form.calibration_advance_email_enabled && calTiersError)}
            sx={{ fontWeight: 600, px: 4 }}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
