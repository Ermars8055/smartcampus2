import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, IconButton, Divider, Snackbar, Alert, CircularProgress,
  Autocomplete, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { ArrowBack, PhotoCamera, Close, CloudUpload } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ComplaintForm() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    department_name: '',
    building_id: '',
    floor_id: '',
    room_id: '',
    location: '',
    nature_of_complaint: '',
    individual_detailed: '',
    name_and_trade: ''
  });

  const [departmentsList, setDepartmentsList] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get('/api/departments/names').then(r => setDepartmentsList(r.data)).catch(() => setDepartmentsList([]));
    api.get('/api/departments').then(r => setAllDepartments(r.data)).catch(() => setAllDepartments([]));
  }, []);

  const handleDepartmentChange = (newDept) => {
    if (newDept) {
      api.get(`/api/rooms?department_name=${encodeURIComponent(newDept)}`).then(r => {
        const fetchedRooms = r.data || [];
        const uniqueBuildings = new Map();
        const uniqueFloors = new Map();
        fetchedRooms.forEach(room => {
          if (room.building_id && room.building_name) {
            uniqueBuildings.set(room.building_id, { id: room.building_id, name: room.building_name });
          }
          if (room.floor_id && room.floor_name) {
            uniqueFloors.set(room.floor_id, { id: room.floor_id, name: room.floor_name, building_id: room.building_id });
          }
        });
        const masterDepts = allDepartments.filter(d => d.name === newDept);
        masterDepts.forEach(d => {
          if (d.building_id && d.building_name) {
            uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
          }
        });
        setBuildings(Array.from(uniqueBuildings.values()));
        setFloors(Array.from(uniqueFloors.values()));
        setRooms(fetchedRooms);
        setFormData(prev => ({ ...prev, department_name: newDept, building_id: '', floor_id: '', room_id: '' }));
      }).catch(() => {
        setBuildings([]); setFloors([]); setRooms([]);
        setFormData(prev => ({ ...prev, department_name: newDept, building_id: '', floor_id: '', room_id: '' }));
      });
    } else {
      setBuildings([]); setFloors([]); setRooms([]);
      setFormData(prev => ({ ...prev, department_name: '', building_id: '', floor_id: '', room_id: '' }));
    }
  };

  const handleBuildingChange = (buildingId) => {
    setFormData(prev => ({ ...prev, building_id: buildingId, floor_id: '', room_id: '' }));
  };

  const handleFloorChange = (floorId) => {
    setFormData(prev => ({ ...prev, floor_id: floorId, room_id: '' }));
  };

  const [images, setImages] = useState([]); // File objects
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);

      const urls = filesArray.map(f => URL.createObjectURL(f));
      setImagePreviewUrls(prev => [...prev, ...urls]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setUploading(true);
    try {
      // 1. Upload images first
      const uploadedUrls = [];
      for (const file of images) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(uploadRes.data.url);
      }

      // 2. Create complaint
      const payload = {
        ...formData,
        building_id: formData.building_id ? parseInt(formData.building_id) : null,
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        image_urls: uploadedUrls
      };

      await api.post('/api/complaints', payload);
      setSnackbar({ open: true, message: 'Complaint Raised Successfully', severity: 'success' });
      setTimeout(() => navigate('/complaints'), 1500);

    } catch (error) {
      console.error('Submit error:', error);
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to submit complaint', severity: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <IconButton onClick={() => navigate('/complaints')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Raise New Complaint</Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1E3A8A' }}>Complaint Slip Details</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={departmentsList}
                value={formData.department_name || null}
                onChange={(e, val) => handleDepartmentChange(val)}
                renderInput={(params) => (
                  <TextField {...params} required label="Department" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Building</InputLabel>
                <Select
                  value={formData.building_id}
                  label="Building"
                  onChange={e => handleBuildingChange(e.target.value)}
                  disabled={!formData.department_name || buildings.length === 0}
                >
                  <MenuItem value="" disabled><em>Select Building</em></MenuItem>
                  {buildings.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Floor</InputLabel>
                <Select
                  value={formData.floor_id}
                  label="Floor"
                  onChange={e => handleFloorChange(e.target.value)}
                  disabled={!formData.building_id || floors.filter(f => f.building_id === formData.building_id).length === 0}
                >
                  <MenuItem value="" disabled><em>Select Floor</em></MenuItem>
                  {floors.filter(f => !formData.building_id || f.building_id === formData.building_id).map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Room</InputLabel>
                <Select
                  value={formData.room_id}
                  label="Room"
                  onChange={e => setFormData(prev => ({ ...prev, room_id: e.target.value }))}
                  disabled={!formData.floor_id || rooms.filter(rm => rm.floor_id === formData.floor_id).length === 0}
                >
                  <MenuItem value="" disabled><em>Select Room</em></MenuItem>
                  {rooms.filter(rm => !formData.floor_id || rm.floor_id === formData.floor_id).map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Name (Occupant / Trade)" name="name_and_trade" value={formData.name_and_trade} onChange={handleChange} />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Nature of Complaint" name="nature_of_complaint" value={formData.nature_of_complaint} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Individual Detailed" name="individual_detailed" value={formData.individual_detailed} onChange={handleChange} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ mb: 2, color: '#1E3A8A' }}>Photo Attachments</Typography>
          
          <Box sx={{ border: '2px dashed #CBD5E1', borderRadius: 2, p: 3, textAlign: 'center', bgcolor: '#F8FAFC', mb: 3 }}>
             <input
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <Button 
              variant="outlined" 
              startIcon={<PhotoCamera />} 
              onClick={() => fileInputRef.current.click()}
              sx={{ mr: 2 }}
            >
              Capture / Upload Photos
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1, color: '#64748B' }}>
              Support JPG, PNG files. Multiple allowed.
            </Typography>
          </Box>

          {imagePreviewUrls.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {imagePreviewUrls.map((url, idx) => (
                <Grid item xs={4} sm={3} md={2} key={idx}>
                  <Box sx={{ position: 'relative', pt: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <img src={url} alt={`Preview ${idx}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" onClick={() => removeImage(idx)} sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}>
                      <Close fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button onClick={() => navigate('/complaints')} disabled={uploading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={uploading} startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}>
              Submit Complaint
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
