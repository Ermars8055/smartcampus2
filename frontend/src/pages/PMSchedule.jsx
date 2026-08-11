import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Checkbox, CircularProgress, Alert
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
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

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/equipment/pm-schedule');
      setSchedules(res.data || []);
    } catch (err) {
      showMessage('Failed to load PM Schedule', 'Error', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1200, margin: '0 auto' }}>
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
                </TableRow>
              ))}
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} align="center" sx={{ py: 3, color: '#94A3B8' }}>
                    No schedule matrix found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
