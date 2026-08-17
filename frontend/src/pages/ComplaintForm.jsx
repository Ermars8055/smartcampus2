import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, IconButton, Divider, Snackbar, Alert, CircularProgress,
  Autocomplete, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, Card
} from '@mui/material';
import { ArrowBack, PhotoCamera, Close, CloudUpload } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getFileUrl } from '../services/api';

export default function ComplaintForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    docket_no: '',
    institution_id: '',
    department_name: '',
    building_id: '',
    floor_id: '',
    room_id: '',
    location: '',
    nature_of_complaint: '',
    individual_detailed: '',
    name_and_trade: '',
    complaint_type: ''
  });

  const [institutions, setInstitutions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [complaintTypes, setComplaintTypes] = useState([]);

  useEffect(() => {
    let fetchedInsts = [];
    let fetchedDepts = [];
    let fetchedBldgs = [];

    Promise.all([
      api.get('/api/institutions').then(r => { fetchedInsts = r.data; setInstitutions(r.data); }).catch(() => setInstitutions([])),
      api.get('/api/departments').then(r => { fetchedDepts = r.data; setAllDepartments(r.data); }).catch(() => setAllDepartments([])),
      api.get('/api/buildings').then(r => { fetchedBldgs = r.data; setAllBuildings(r.data); }).catch(() => setAllBuildings([])),
      api.get('/api/configurations/lookups/ComplaintType').then(r => setComplaintTypes(r.data || [])).catch(() => setComplaintTypes([]))
    ]).then(() => {
      let instId = fetchedInsts.length === 1 ? fetchedInsts[0].id : '';
      let deptName = '';
      const uniqueDepts = Array.from(new Set(fetchedDepts.map(d => d.name)));
      if (uniqueDepts.length === 1) deptName = uniqueDepts[0];

      if (id) {
        api.get(`/api/complaints/${id}`).then(res => {
          const c = res.data;
          setFormData(prev => ({
            ...prev,
            docket_no: c.docket_no || '',
            institution_id: c.institution_id || '',
            department_name: c.department_name || '',
            building_id: c.building_id || '',
            floor_id: c.floor_id || '',
            room_id: c.room_id || '',
            location: c.location || '',
            nature_of_complaint: c.nature_of_complaint || '',
            individual_detailed: c.individual_detailed || '',
            name_and_trade: c.name_and_trade || '',
            complaint_type: c.complaint_type || ''
          }));
          
          if (c.images && c.images.length > 0) {
            const existingUrls = c.images.filter(img => !img.is_resolution_image).map(img => getFileUrl(img.image_url));
            setImagePreviewUrls(existingUrls);
            setImages(new Array(existingUrls.length).fill(null));
          }
          
          if (c.department_name) {
            api.get(`/api/rooms?department_name=${encodeURIComponent(c.department_name)}`).then(r => {
              const fetchedRooms = r.data || [];
              const uniqueBuildings = new Map();
              const uniqueFloors = new Map();
              fetchedRooms.forEach(room => {
                if (room.building_id && room.building_name) uniqueBuildings.set(room.building_id, { id: room.building_id, name: room.building_name });
                if (room.floor_id && room.floor_name) uniqueFloors.set(room.floor_id, { id: room.floor_id, name: room.floor_name, building_id: room.building_id });
              });
              const masterDepts = fetchedDepts.filter(d => d.name === c.department_name);
              masterDepts.forEach(d => {
                if (d.building_id && d.building_name) uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
              });
              fetchedBldgs.forEach(b => {
                if (b.department_name === c.department_name && (!c.institution_id || b.institution_id === c.institution_id)) {
                  uniqueBuildings.set(b.id, { id: b.id, name: b.name });
                }
              });
              setBuildings(Array.from(uniqueBuildings.values()));
              setFloors(Array.from(uniqueFloors.values()));
              setRooms(fetchedRooms);
            }).catch(() => {});
          }
        }).catch(err => {
          setSnackbar({ open: true, message: 'Failed to fetch complaint details', severity: 'error' });
        });
      } else {
        if (instId || deptName) {
          setFormData(prev => ({ ...prev, institution_id: instId, department_name: deptName }));
          if (deptName) {
            api.get(`/api/rooms?department_name=${encodeURIComponent(deptName)}`).then(r => {
              const fetchedRooms = r.data || [];
              const uniqueBuildings = new Map();
              const uniqueFloors = new Map();
              fetchedRooms.forEach(room => {
                if (room.building_id && room.building_name) uniqueBuildings.set(room.building_id, { id: room.building_id, name: room.building_name });
                if (room.floor_id && room.floor_name) uniqueFloors.set(room.floor_id, { id: room.floor_id, name: room.floor_name, building_id: room.building_id });
              });
              const masterDepts = fetchedDepts.filter(d => d.name === deptName);
              masterDepts.forEach(d => {
                if (d.building_id && d.building_name) uniqueBuildings.set(d.building_id, { id: d.building_id, name: d.building_name });
              });
              fetchedBldgs.forEach(b => {
                if (b.department_name === deptName && (!instId || b.institution_id === instId)) {
                  uniqueBuildings.set(b.id, { id: b.id, name: b.name });
                }
              });
              setBuildings(Array.from(uniqueBuildings.values()));
              setFloors(Array.from(uniqueFloors.values()));
              setRooms(fetchedRooms);
            }).catch(() => {});
          }
        }
      }
    });
  }, [id]);

  const filteredDepartments = formData.institution_id 
    ? Array.from(new Set(allDepartments.filter(d => d.institution_id === formData.institution_id).map(d => d.name)))
    : Array.from(new Set(allDepartments.map(d => d.name)));

  const handleInstitutionChange = (instId) => {
    setFormData(prev => ({ ...prev, institution_id: instId, department_name: '', building_id: '', floor_id: '', room_id: '' }));
    setBuildings([]);
    setFloors([]);
    setRooms([]);
  };

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
        allBuildings.forEach(b => {
          if (b.department_name === newDept && (!formData.institution_id || b.institution_id === formData.institution_id)) {
            uniqueBuildings.set(b.id, { id: b.id, name: b.name });
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
  const [previewDialog, setPreviewDialog] = useState({ open: false, url: '' });

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
        if (!file) continue; // Skip existing images
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        const uploadRes = await api.post('/api/upload?folder=complaints', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(uploadRes.data.url);
      }

      // 2. Create complaint
      const existingUrlsToKeep = imagePreviewUrls.filter((_, idx) => !images[idx]);
      const payload = {
        ...formData,
        building_id: formData.building_id ? parseInt(formData.building_id) : null,
        room_id: formData.room_id ? parseInt(formData.room_id) : null,
        image_urls: [...existingUrlsToKeep, ...uploadedUrls]
      };
      delete payload.institution_id;
      delete payload.floor_id; // floor_id is also not in backend schema, just in case

      if (id) {
        await api.put(`/api/complaints/${id}`, payload);
        setSnackbar({ open: true, message: 'Complaint Updated Successfully', severity: 'success' });
      } else {
        await api.post('/api/complaints', payload);
        setSnackbar({ open: true, message: 'Complaint Raised Successfully', severity: 'success' });
      }
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{id ? 'Edit Complaint' : 'Raise New Complaint'}</Typography>
      </Box>

      <Card sx={{ p: { xs: 2, md: 4 } }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Complaint Slip Details</Typography>
          <Grid container spacing={3}>
            {id && (
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="Docket No" value={formData.docket_no} InputProps={{ readOnly: true }} disabled />
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth required>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={formData.institution_id}
                  label="Institution *"
                  onChange={e => handleInstitutionChange(e.target.value)}
                  required
                >
                  <MenuItem value="" disabled><em>Select Institution</em></MenuItem>
                  {institutions.map(inst => <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={filteredDepartments}
                value={formData.department_name || null}
                onChange={(e, val) => handleDepartmentChange(val)}
                disabled={!formData.institution_id}
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Call Type / Complaint Type</InputLabel>
                <Select
                  name="complaint_type"
                  value={formData.complaint_type}
                  label="Call Type / Complaint Type *"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="" disabled><em>Select Type</em></MenuItem>
                  {complaintTypes.map((type) => (
                    <MenuItem key={type.id} value={type.lookup_value}>{type.lookup_value}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth required label="Nature of Complaint" name="nature_of_complaint" value={formData.nature_of_complaint} onChange={handleChange} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField fullWidth required multiline rows={3} label="Individual Detailed" name="individual_detailed" value={formData.individual_detailed} onChange={handleChange} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Photo Attachments</Typography>
          
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
                    <img 
                      src={url} 
                      alt={`Preview ${idx}`} 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                      onClick={() => setPreviewDialog({ open: true, url })}
                    />
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
              {id ? 'Update Complaint' : 'Submit Complaint'}
            </Button>
          </Box>
        </form>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, url: '' })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Image Preview
          <IconButton onClick={() => setPreviewDialog({ open: false, url: '' })} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', bgcolor: '#000' }}>
          <img src={previewDialog.url} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
