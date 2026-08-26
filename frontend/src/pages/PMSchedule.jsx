import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Checkbox, CircularProgress, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Select, MenuItem, InputLabel, FormControl, OutlinedInput, ListItemText, TextField
} from '@mui/material';
import { Save, Refresh, Settings } from '@mui/icons-material';
import api from '../services/api';
import { useMessage } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';

const months = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Dec' }
];

export default function PMSchedule() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/equipment/pm-schedule');
      const data = res.data || [];
      // Ensure arrays are initialized
      data.forEach(d => {
        d.advance_email_roles = d.advance_email_roles || [];
        d.advance_email_users = d.advance_email_users || [];
      });
      setSchedules(data);
    } catch (err) {
      showMessage('Failed to load PM Schedule', 'Error', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    api.get('/api/rbac/roles').then(r => setRoles(r.data || [])).catch(e => console.error(e));
    api.get('/api/admin/users').then(r => setUsers(r.data || [])).catch(e => console.error(e));
  }, []);

  const handleCheckboxChange = (index, monthKey) => {
    const updated = [...schedules];
    updated[index][monthKey] = !updated[index][monthKey];
    setSchedules(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/equipment/pm-schedule', schedules);
      showMessage('PM Schedule saved successfully!', 'Success', 'success');
    } catch (err) {
      showMessage('Failed to save PM Schedule', 'Error', 'error');
    }
    setSaving(false);
  };

  const handleGenerate = async () => {
    try {
      const res = await api.post('/api/equipment/generate-maintenance-calls');
      showMessage(`${res.data.pm_calls_generated} PM and ${res.data.calibration_calls_generated} Calibration calls generated!`, 'Success', 'success');
      loadData();
    } catch (err) {
      showMessage('Failed to generate maintenance calls', 'Error', 'error');
    }
  };

  const handleOpenSettings = (index) => {
    setSelectedRowIndex(index);
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setSelectedRowIndex(null);
  };

  const handleSettingChange = (field, value) => {
    const updated = [...schedules];
    updated[selectedRowIndex][field] = value;
    setSchedules(updated);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedSchedule = selectedRowIndex !== null ? schedules[selectedRowIndex] : null;

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
          Preventive Maintenance Schedule
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {hasAction('pm_schedule', 'generate_calls') && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Refresh />}
              onClick={handleGenerate}
              title="Generate PM & Calibration Complaints for the current month"
            >
              Generate Calls
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure which months each department requires Preventive Maintenance. Checked boxes indicate that PM is scheduled for that month.
      </Alert>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: 200 }}>Department</TableCell>
                {months.map(m => (
                  <TableCell key={m.key} align="center" sx={{ fontWeight: 700 }}>
                    {m.label}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 700 }}>Settings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((row, index) => (
                <TableRow key={row.department_name} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#334155' }}>
                    {row.department_name}
                  </TableCell>
                  {months.map((m, mIndex) => {
                    const isPastMonth = mIndex < new Date().getMonth();
                    const callsGenerated = row.monthly_calls && row.monthly_calls[m.key] > 0;
                    const isDisabled = isPastMonth || callsGenerated;
                    return (
                    <TableCell key={m.key} align="center" sx={{ padding: '4px', bgcolor: callsGenerated ? '#f0fdf4' : 'transparent' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Checkbox
                          checked={row[m.key] || callsGenerated}
                          onChange={() => handleCheckboxChange(index, m.key)}
                          color="primary"
                          size="small"
                          disabled={isDisabled}
                        />
                        {callsGenerated && (
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, mt: -0.5, bgcolor: '#dcfce3', px: 1, borderRadius: 1, border: '1px solid #bbf7d0' }}>
                            Generated
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    );
                  })}
                  <TableCell align="center">
                    <IconButton onClick={() => handleOpenSettings(index)} color={row.advance_email_enabled ? 'primary' : 'default'} title="Email Notification Settings">
                      <Settings fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} align="center" sx={{ py: 3, color: '#94A3B8' }}>
                    No schedule matrix found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={handleCloseSettings} fullWidth maxWidth="sm">
        <DialogTitle>Notification Settings - {selectedSchedule?.department_name}</DialogTitle>
        <DialogContent dividers>
          {selectedSchedule && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedSchedule.advance_email_enabled || false}
                    onChange={(e) => handleSettingChange('advance_email_enabled', e.target.checked)}
                  />
                }
                label="Enable Advance Email Notification"
              />

              {selectedSchedule.advance_email_enabled && (
                <>
                  <FormControl fullWidth size="small">
                    <InputLabel>Notification Timing</InputLabel>
                    <Select
                      value={selectedSchedule.advance_email_type || 'One Month'}
                      label="Notification Timing"
                      onChange={(e) => handleSettingChange('advance_email_type', e.target.value)}
                    >
                      <MenuItem value="One Month">One Month</MenuItem>
                      <MenuItem value="One Week">One Week</MenuItem>
                      <MenuItem value="Custom Days">Custom Days</MenuItem>
                    </Select>
                  </FormControl>

                  {selectedSchedule.advance_email_type === 'Custom Days' && (
                    <TextField
                      label="No. of days in advance"
                      type="number"
                      size="small"
                      fullWidth
                      value={selectedSchedule.advance_email_days || ''}
                      onChange={(e) => handleSettingChange('advance_email_days', parseInt(e.target.value) || 0)}
                    />
                  )}

                  <FormControl fullWidth size="small">
                    <InputLabel>Notify Roles</InputLabel>
                    <Select
                      multiple
                      value={selectedSchedule.advance_email_roles || []}
                      onChange={(e) => handleSettingChange('advance_email_roles', e.target.value)}
                      input={<OutlinedInput label="Notify Roles" />}
                      renderValue={(selected) => selected.map(code => {
                        const r = roles.find(rl => rl.code === code);
                        return r ? r.name : code;
                      }).join(', ')}
                    >
                      {roles.map((r) => (
                        <MenuItem key={r.code} value={r.code}>
                          <Checkbox checked={(selectedSchedule.advance_email_roles || []).indexOf(r.code) > -1} />
                          <ListItemText primary={r.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Notify Users</InputLabel>
                    <Select
                      multiple
                      value={selectedSchedule.advance_email_users || []}
                      onChange={(e) => handleSettingChange('advance_email_users', e.target.value)}
                      input={<OutlinedInput label="Notify Users" />}
                      renderValue={(selected) => selected.map(id => {
                        const u = users.find(us => us.id === id);
                        return u ? u.full_name : id;
                      }).join(', ')}
                    >
                      {users.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          <Checkbox checked={(selectedSchedule.advance_email_users || []).indexOf(u.id) > -1} />
                          <ListItemText primary={u.full_name} secondary={u.email} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings} color="primary" variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
