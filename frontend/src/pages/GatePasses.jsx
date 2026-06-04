import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Select, FormControl, TextField,
  InputLabel, IconButton, InputAdornment, MenuItem
} from '@mui/material';
import { Close, CheckCircle, Warning, Print, LocalShipping, Add, Comment, Person, Numbers, AccountTree } from '@mui/icons-material';
import api from '../services/api';
import MaterialSelect from '../components/MaterialSelect';
import { useAuth } from '../context/AuthContext';

export default function GatePasses() {
  const { hasAction } = useAuth();
  const [gatePasses, setGatePasses] = useState([]);
  const [previewGatePass, setPreviewGatePass] = useState(null);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Modal State
  const [gpModal, setGpModal] = useState({
    open: false,
    gate_pass_type: 'Returnable',
    project_id: '',
    material_id: '',
    quantity: 0,
    vendor_id: '',
    driver_name: '',
    vehicle_number: '',
    remarks: ''
  });

  const load = async () => {
    try {
      const gpRes = await api.get('/api/gate-passes');
      setGatePasses(gpRes.data);
      const pRes = await api.get('/api/projects');
      setProjects(pRes.data);
      const mRes = await api.get('/api/materials', { params: { limit: 10000 } });
      setMaterials(mRes.data.items || []);
      const vRes = await api.get('/api/vendors', { params: { limit: 10000 } });
      setVendors(vRes.data.items || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
  }, []);

  const openGpModal = () => {
    setGpModal({
      open: true,
      gate_pass_type: 'Returnable',
      project_id: projects[0]?.id || '',
      material_id: '',
      quantity: 0,
      vendor_id: '',
      driver_name: '',
      vehicle_number: '',
      remarks: ''
    });
  };

  const handleGpSubmit = async () => {
    try {
      if (!gpModal.project_id || !gpModal.material_id || gpModal.quantity <= 0) {
        alert("Please select project, material, and provide a valid quantity.");
        return;
      }
      const payload = {
        gate_pass_type: gpModal.gate_pass_type,
        project_id: gpModal.project_id,
        material_id: gpModal.material_id,
        quantity: Math.round(parseFloat(gpModal.quantity)),
        vendor_id: gpModal.vendor_id || null,
        driver_name: gpModal.driver_name,
        vehicle_number: gpModal.vehicle_number,
        remarks: gpModal.remarks
      };
      await api.post('/api/gate-passes', payload);
      setGpModal({ ...gpModal, open: false });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating Gate Pass');
    }
  };

  const completeGatePass = async (id) => {
    try {
      await api.put(`/api/gate-passes/${id}`, { status: 'Repaired & Received' });
      load();
    } catch (e) { console.error(e); }
  };

  const scrapGatePass = async (id) => {
    try {
      await api.put(`/api/gate-passes/${id}`, { status: 'Scrapped' });
      load();
    } catch (e) { console.error(e); }
  };

  const generateGatePassHTML = (gp) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${gp.gate_pass_number}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; font-size: 14px; margin: 0; padding: 40px; color: #000; line-height: 1.4; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .hospital-name { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin: 0; }
            .title-section { text-align: right; }
            .doc-title { font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; line-height: 1.8; }
            .meta-column { width: 48%; }
            .meta-label { font-weight: bold; margin-right: 10px; min-width: 90px; display: inline-block; }
            .address-box { border: 1px solid #ccc; padding: 12px; min-height: 80px; margin-top: 5px; border-radius: 4px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 50px; }
            th, td { border: 1px solid #000; padding: 12px 10px; text-align: left; }
            th { background-color: #f8f8f8; font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 100px; }
            .sig-block { text-align: center; font-weight: bold; width: 30%; border-top: 1px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="hospital-name">SMART CAMPUS</h1>
              <div style="font-size: 13px; margin-top: 4px; color: #555;">Store Operations Division</div>
            </div>
            <div class="title-section">
              <h2 class="doc-title">${gp.gate_pass_type === 'Returnable' ? 'Returnable Gate Pass' : 'Non-Returnable Gate Pass'}</h2>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">No:</span> <strong>${gp.gate_pass_number}</strong></div>
              <div style="font-size: 15px;"><span class="meta-label" style="min-width: 50px;">Date:</span> ${formatDate(gp.created_at)}</div>
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-column">
              <div><span class="meta-label">From Dept:</span> Central Store</div>
              <div style="margin-top: 15px;"><span class="meta-label">To:</span></div>
              <div class="address-box">
                 <strong>${gp.vendor_name || 'Vendor / Recipient'}</strong><br/>
                 ${gp.vendor_address ? gp.vendor_address : 'Address not provided'}
              </div>
            </div>
            <div class="meta-column" style="text-align: right;">
              <div><span class="meta-label" style="min-width: auto; margin-right: 5px;">Ref Return No:</span> ${gp.reference_return_number || 'N/A'}</div>
              <div><span class="meta-label" style="min-width: auto; margin-right: 5px;">Purpose:</span> ${gp.remarks || 'Sent Out'}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">Sl. No.</th>
                <th style="width: 45%;">Item / Description</th>
                <th style="width: 17%; text-align: center;">Qty.</th>
                <th style="width: 30%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td><strong>${gp.material_name}</strong></td>
                <td style="text-align: center;">${gp.quantity} ${gp.uom_name || ''}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <div class="signatures">
            <div class="sig-block">Receiver's Sign.</div>
            <div class="sig-block">Issue Sign. Stores</div>
            <div class="sig-block">Authorised Sign. MD / MS</div>
          </div>
        </body>
      </html>
    `;
  };

  const printGatePass = (gp) => {
    setPreviewGatePass(gp);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ fontSize: '1.5rem' }}>🚚</Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', lineHeight: 1.2 }}>Outward Gate Passes</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Track items sent out for repair and manage their return or scrap.</Typography>
          </Box>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={openGpModal}
          disabled={!hasAction('gate_passes', 'can_create') && !hasAction('issues', 'can_issue')} // Fallback
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, bgcolor: '#2563EB' }}
        >
          Create Gate Pass
        </Button>
      </Box>

      {gatePasses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#F8FAFC', borderRadius: 3, border: '2px dashed #E2E8F0' }}>
          <Typography variant="body1" sx={{ color: '#94A3B8', fontWeight: 600 }}>No gate passes found.</Typography>
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: 2, py: 1.5, fontSize: '0.8rem', borderColor: '#F1F5F9' } }}>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>GATE PASS NO.</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>MATERIAL (QTY)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>REF RETURN</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gatePasses.map(gp => (
                  <TableRow key={gp.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#0F172A' }}>{gp.gate_pass_number}</TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{formatDate(gp.created_at)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{gp.material_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Qty: {gp.quantity} {gp.uom_name || ''}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600 }}>{gp.reference_return_number || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={gp.status} 
                        size="small" 
                        color={['Issued', 'Pending Repair'].includes(gp.status) ? 'warning' : ['Repaired & Received', 'Repaired & Returned'].includes(gp.status) ? 'success' : 'error'} 
                        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => printGatePass(gp)}>
                        <Print fontSize="small" />
                      </IconButton>
                      {['Issued', 'Pending Repair'].includes(gp.status) && (
                        <>
                          <IconButton size="small" color="success" onClick={() => completeGatePass(gp.id)}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => scrapGatePass(gp.id)}>
                            <Warning fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* CREATE GATE PASS MODAL */}
      <Dialog open={gpModal.open} onClose={() => setGpModal({ ...gpModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, pt: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
                <LocalShipping fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Gate Pass</Typography>
                <Typography variant="body2" color="text.secondary">Issue a gate pass to send material out</Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setGpModal({ ...gpModal, open: false })} sx={{ color: '#64748B' }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Gate Pass Type</InputLabel>
                <Select
                  label="Gate Pass Type"
                  value={gpModal.gate_pass_type}
                  onChange={e => setGpModal({ ...gpModal, gate_pass_type: e.target.value })}
                >
                  <MenuItem value="Returnable">Returnable</MenuItem>
                  <MenuItem value="Non-Returnable">Non-Returnable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Associated Project</InputLabel>
                <Select
                  label="Associated Project"
                  value={gpModal.project_id}
                  onChange={e => setGpModal({ ...gpModal, project_id: e.target.value })}
                  startAdornment={<InputAdornment position="start"><AccountTree sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} /></InputAdornment>}
                >
                  {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 1 }}>MATERIAL DETAILS</Typography>
              <MaterialSelect 
                materials={materials} 
                value={gpModal.material_id} 
                onChange={(val) => setGpModal({ ...gpModal, material_id: val })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                size="small" fullWidth type="number" label="Quantity"
                inputProps={{ min: 0, step: "1" }}
                value={gpModal.quantity} 
                onChange={e => setGpModal({ ...gpModal, quantity: e.target.value })} 
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Numbers sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>To Vendor (Optional)</InputLabel>
                <Select
                  label="To Vendor (Optional)"
                  value={gpModal.vendor_id}
                  onChange={e => setGpModal({ ...gpModal, vendor_id: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name} ({v.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', display: 'block', mb: 1, mt: 1 }}>TRANSPORT DETAILS</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label="Driver / Carrier Name" 
                value={gpModal.driver_name}
                onChange={e => setGpModal({ ...gpModal, driver_name: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth size="small" label="Vehicle Number" 
                value={gpModal.vehicle_number}
                onChange={e => setGpModal({ ...gpModal, vehicle_number: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LocalShipping sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField 
                fullWidth size="small" label="Remarks / Purpose" 
                value={gpModal.remarks}
                onChange={e => setGpModal({ ...gpModal, remarks: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Comment sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, pt: 2 }}>
          <Button onClick={() => setGpModal({ ...gpModal, open: false })} sx={{ color: '#64748B', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleGpSubmit} variant="contained" sx={{ px: 3, fontWeight: 700, borderRadius: 2 }}>Create Pass</Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewGatePass} onClose={() => setPreviewGatePass(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Gate Pass Preview
          <IconButton onClick={() => setPreviewGatePass(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '70vh' }}>
          {previewGatePass && (
            <iframe 
              srcDoc={generateGatePassHTML(previewGatePass)} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              title="Gate Pass Preview"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewGatePass(null)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={() => {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              document.body.appendChild(iframe);
              iframe.contentDocument.write(generateGatePassHTML(previewGatePass));
              iframe.contentDocument.close();
              setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                  document.body.removeChild(iframe);
                }, 1000);
              }, 200);
            }}
            sx={{ fontWeight: 700, px: 4, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
          >
            Print Gate Pass
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
