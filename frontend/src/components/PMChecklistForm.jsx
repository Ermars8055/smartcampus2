import React from 'react';
import { Box, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';

const CHECKBOX_OPTIONS = ['Pass', 'Fail', 'NA'];

const FormCheckbox = ({ label, value, onChange }) => (
  <FormControl fullWidth size="small" margin="dense">
    <InputLabel sx={{ fontSize: '12px' }}>{label}</InputLabel>
    <Select value={value || ''} label={label} onChange={onChange} sx={{ fontSize: '12px' }}>
      {CHECKBOX_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
    </Select>
  </FormControl>
);

export default function PMChecklistForm({ data, onChange }) {
  const handleChange = (field) => (e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #E2E8F0', borderRadius: 1, bgcolor: '#F8FAFC', mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>PM Checklist Details</Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
           <TextField fullWidth size="small" label="Description" value={data.description || ''} onChange={handleChange('description')} />
        </Grid>
      </Grid>
      
      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>GENERAL MAINTENANCE</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormCheckbox label="1) INTERNAL CLEANING" value={data.internal_cleaning} onChange={handleChange('internal_cleaning')} />
          <FormCheckbox label="2) EXTERNAL CLEANING" value={data.external_cleaning} onChange={handleChange('external_cleaning')} />
          <FormCheckbox label="3) SAFETY TEST" value={data.general_safety_test} onChange={handleChange('general_safety_test')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormCheckbox label="4) LUBRICATING" value={data.lubricating} onChange={handleChange('lubricating')} />
          <FormCheckbox label="5) CALIBRATION TEST" value={data.calibration_test} onChange={handleChange('calibration_test')} />
          <FormCheckbox label="6) REPLACED" value={data.replaced} onChange={handleChange('replaced')} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>COMPONENT INSPECTION</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormCheckbox label="1) FILTERS" value={data.filters} onChange={handleChange('filters')} />
          <FormCheckbox label="2) HOSE/TUBE LEAKAGE" value={data.hose_tube_leakage} onChange={handleChange('hose_tube_leakage')} />
          <FormCheckbox label="3) CABLES" value={data.cables} onChange={handleChange('cables')} />
          <FormCheckbox label="4) CONNECTORS" value={data.connectors} onChange={handleChange('connectors')} />
          <FormCheckbox label="5) MOTOR/FAN/PUMP" value={data.motor_fan_pump} onChange={handleChange('motor_fan_pump')} />
          <FormCheckbox label="6) LAMP/LIGHT/BULB" value={data.lamp_light_bulb} onChange={handleChange('lamp_light_bulb')} />
          <FormCheckbox label="7) KEYPAD/SWITCHES" value={data.keypad_switches} onChange={handleChange('keypad_switches')} />
          <FormCheckbox label="8) EXPIRATORY VALVE" value={data.expiratory_valve} onChange={handleChange('expiratory_valve')} />
          <FormCheckbox label="9) WATER TRAP" value={data.water_trap} onChange={handleChange('water_trap')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormCheckbox label="10) ALARM" value={data.alarm} onChange={handleChange('alarm')} />
          <FormCheckbox label="11) AUDIO ABLE SIGNAL" value={data.audio_able_signal} onChange={handleChange('audio_able_signal')} />
          <FormCheckbox label="12) DISPLAY" value={data.display} onChange={handleChange('display')} />
          <FormCheckbox label="13) ELECTRODES" value={data.electrodes} onChange={handleChange('electrodes')} />
          <FormCheckbox label="14) TRANSDUCERS" value={data.transducers} onChange={handleChange('transducers')} />
          <FormCheckbox label="15) POWER SUPPLY" value={data.power_supply} onChange={handleChange('power_supply')} />
          <FormCheckbox label="16) ELECTRONIC BOARD" value={data.electronic_board} onChange={handleChange('electronic_board')} />
          <FormCheckbox label="17) FUSE" value={data.fuse} onChange={handleChange('fuse')} />
          <FormCheckbox label="18) COMPRESSOR" value={data.compressor} onChange={handleChange('compressor')} />
          <FormCheckbox label="19) OTHER" value={data.other_part} onChange={handleChange('other_part')} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>SAFETY TEST</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormCheckbox label="1) ELECTRICAL" value={data.electrical} onChange={handleChange('electrical')} />
          <FormCheckbox label="2) POWER CORD" value={data.power_cord} onChange={handleChange('power_cord')} />
          <FormCheckbox label="3) PLUG TOP" value={data.plug_top} onChange={handleChange('plug_top')} />
          <FormCheckbox label="4) LEAKAGE CURRENT" value={data.leakage_current} onChange={handleChange('leakage_current')} />
          <FormCheckbox label="5) GROUNDING/EARTHLING" value={data.grounding_earthling} onChange={handleChange('grounding_earthling')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormCheckbox label="6) WHEEL MOVEMENT" value={data.wheel_movement} onChange={handleChange('wheel_movement')} />
          <FormCheckbox label="7) BALANCE" value={data.balance} onChange={handleChange('balance')} />
          <FormCheckbox label="8) BATTERY" value={data.battery} onChange={handleChange('battery')} />
          <FormCheckbox label="9) OTHER" value={data.other_safety} onChange={handleChange('other_safety')} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Footer Details</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
           <DateTimePicker 
              label="PM Start Date/Time" 
              format="DD-MMM-YYYY hh:mm A"
              localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              value={data.pm_start_date_time ? dayjs(data.pm_start_date_time) : null} 
              onChange={(newValue) => onChange({ ...data, pm_start_date_time: newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '' })} 
              slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }} 
           />
        </Grid>
        <Grid item xs={12} sm={6}>
           <DateTimePicker 
              label="PM Completed Date/Time" 
              format="DD-MMM-YYYY hh:mm A"
              localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              minDateTime={data.pm_start_date_time ? dayjs(data.pm_start_date_time) : undefined}
              value={data.pm_completed_date ? dayjs(data.pm_completed_date) : null} 
              onChange={(newValue) => onChange({ ...data, pm_completed_date: newValue ? newValue.format('YYYY-MM-DDTHH:mm') : '' })} 
              slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }} 
           />
        </Grid>
        <Grid item xs={12} sm={6}>
           <DatePicker 
              label="Next PM Due On" 
              format="DD-MMM-YYYY"
              localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              value={data.next_pm_due_on ? dayjs(data.next_pm_due_on) : null} 
              onChange={(newValue) => onChange({ ...data, next_pm_due_on: newValue ? newValue.format('YYYY-MM-DD') : '' })} 
              slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }} 
           />
        </Grid>
        <Grid item xs={12} sm={6}>
           <FormControl fullWidth size="small">
             <InputLabel required>Status</InputLabel>
             <Select required value={data.status || ''} label="Status *" onChange={handleChange('status')}>
               <MenuItem value="COMPLETED">COMPLETED</MenuItem>
               <MenuItem value="PENDING">PENDING</MenuItem>
               <MenuItem value="PREPOND">PREPOND</MenuItem>
               <MenuItem value="POSTPONED">POSTPONED</MenuItem>
             </Select>
           </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
           <FormControl fullWidth size="small">
             <InputLabel required>Accepted For Use</InputLabel>
             <Select required value={data.accepted_for_use || ''} label="Accepted For Use *" onChange={handleChange('accepted_for_use')}>
               <MenuItem value="Yes">Yes</MenuItem>
               <MenuItem value="No">No</MenuItem>
             </Select>
           </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}
