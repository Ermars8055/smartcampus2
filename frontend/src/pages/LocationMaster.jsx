import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, Business } from '@mui/icons-material';
import { useMessage } from '../context/MessageContext';
import api from '../services/api';

export default function LocationMaster() {
  const [locations, setLocations] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    location_name: '',
    location_code: '',
    is_active: true
  });
  const { showMessage } = useMessage();

  const fetchLocations = async () => {
    try {
      const res = await api.get('/api/configurations/locations');
      setLocations(res.data);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to fetch locations', 'error');
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpen = (loc = null) => {
    if (loc) {
      setEditingId(loc.id);
      setFormData({
        location_name: loc.location_name,
        location_code: loc.location_code,
        is_active: loc.is_active
      });
    } else {
      setEditingId(null);
      setFormData({
        location_name: '',
        location_code: '',
        is_active: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    if (!formData.location_name || !formData.location_code) {
      showMessage('Please fill in all required fields', 'warning');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/api/configurations/locations/${editingId}`, formData);
        showMessage('Location updated successfully', 'success');
      } else {
        await api.post('/api/configurations/locations', formData);
        showMessage('Location created successfully', 'success');
      }
      handleClose();
      fetchLocations();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to save location', 'error');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business color="primary" /> Location Master
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Location
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location Code</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No locations found. Click "Add Location" to create one.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((loc) => (
                <TableRow key={loc.id} hover>
                  <TableCell>{loc.id}</TableCell>
                  <TableCell>{loc.location_name}</TableCell>
                  <TableCell>{loc.location_code}</TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'inline-block',
                      px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.85rem', fontWeight: 500,
                      backgroundColor: loc.is_active ? 'success.light' : 'error.light',
                      color: loc.is_active ? 'success.dark' : 'error.dark'
                    }}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpen(loc)} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Location' : 'Add Location'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Location Name"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Location Code"
              value={formData.location_code}
              onChange={(e) => setFormData({ ...formData, location_code: e.target.value })}
              fullWidth
              required
              helperText="E.g. WD17 for Ward 17"
            />
            <FormControlLabel
              control={<Switch checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} color="primary" />}
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
