import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  Tabs, Tab, IconButton, Tooltip, useTheme, useMediaQuery, Alert
} from '@mui/material';
import {
  Search, Build, QrCode, UploadFile, CheckCircle, Warning, OpenInNew,
  LocalHospital, PrecisionManufacturing, Edit, FilterList, Refresh, Assignment, DeleteOutline, Print, Science
} from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

export default function Equipment() {
  const { showMessage } = useMessage();
  const { hasAction } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [equipmentList, setEquipmentList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending_serial', 'pending_installation'
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBiomedical, setSelectedBiomedical] = useState('');

  // Dialog states
  const [serialDialog, setSerialDialog] = useState(null); // Equipment object
  const [serialInput, setSerialInput] = useState('');
  const [serialSubmitting, setSerialSubmitting] = useState(false);

  const [installDialog, setInstallDialog] = useState(null); // Equipment object
  const [installSerial, setInstallSerial] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [installRemarks, setInstallRemarks] = useState('');
  const [installLocation, setInstallLocation] = useState('');
  const [installedBy, setInstalledBy] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [installFile, setInstallFile] = useState(null);
  const [equipmentPhoto, setEquipmentPhoto] = useState(null);
  const [serialPhoto, setSerialPhoto] = useState(null);
  const [installSubmitting, setInstallSubmitting] = useState(false);

  // QR Dialog
  const [qrDialog, setQrDialog] = useState(null);
  const [qrData, setQrData] = useState(null);
  
  // Write Off Dialog
  const [writeOffDialog, setWriteOffDialog] = useState(null);
  const [writeOffDate, setWriteOffDate] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffSubmitting, setWriteOffSubmitting] = useState(false);

  // Reagent Consumption Dialog
  const [consumptionDialog, setConsumptionDialog] = useState(null);
  const [consumptionDate, setConsumptionDate] = useState('');
  const [testsPerformed, setTestsPerformed] = useState('');
  const [consumptionRemarks, setConsumptionRemarks] = useState('');
  const [consumptionSubmitting, setConsumptionSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eqRes, whRes, locRes] = await Promise.all([
        api.get('/api/equipment'),
        api.get('/api/warehouses'),
        api.get('/api/configurations/locations')
      ]);
      setEquipmentList(eqRes.data || []);
      setWarehouses(whRes.data || []);
      setLocations(locRes.data || []);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to load equipment data', 'Error', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Counts for tabs
  const counts = useMemo(() => {
    const pendingSerial = equipmentList.filter(e => e.serial_number_status === 'Pending Update' || !e.serial_number).length;
    const pendingInstall = equipmentList.filter(e => e.installation_status === 'Pending Installation').length;
    return {
      all: equipmentList.length,
      pending_serial: pendingSerial,
      pending_installation: pendingInstall
    };
  }, [equipmentList]);

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(item => {
      // Tab filter
      if (activeTab === 'pending_serial') {
        if (item.serial_number_status !== 'Pending Update' && item.serial_number) return false;
      } else if (activeTab === 'pending_installation') {
        if (item.installation_status !== 'Pending Installation') return false;
      }

      // Warehouse filter
      if (selectedWarehouse && item.warehouse_id !== parseInt(selectedWarehouse, 10)) {
        return false;
      }

      // Biomedical filter
      if (selectedBiomedical === 'biomedical' && !item.is_biomedical) return false;
      if (selectedBiomedical === 'standard' && item.is_biomedical) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = item.equipment_code?.toLowerCase().includes(q);
        const matchSerial = item.serial_number?.toLowerCase().includes(q);
        const matchMatName = item.material_name?.toLowerCase().includes(q);
        const matchMatCode = item.material_code?.toLowerCase().includes(q);
        const matchGRN = item.grn_number?.toLowerCase().includes(q);
        if (!matchCode && !matchSerial && !matchMatName && !matchMatCode && !matchGRN) {
          return false;
        }
      }

      return true;
    });
  }, [equipmentList, activeTab, selectedWarehouse, selectedBiomedical, search]);

  // Handle Serial Number Update Submit
  const handleSerialSubmit = async () => {
    if (!serialInput.trim()) {
      showMessage('Serial number is required', 'Validation Error', 'warning');
      return;
    }
    setSerialSubmitting(true);
    try {
      await api.put(`/api/equipment/${serialDialog.id}/serial-number`, {
        serial_number: serialInput.trim()
      });
      showMessage('Serial number updated successfully!', 'Success', 'success');
      setSerialDialog(null);
      setSerialInput('');
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to update serial number', 'Error', 'error');
    }
    setSerialSubmitting(false);
  };

  // Open Installation Dialog
  const openInstallationDialog = (item) => {
    setInstallDialog(item);
    setInstallSerial(item.serial_number || '');
    setInstallDate(new Date().toISOString().split('T')[0]);
    setInstallRemarks('');
    setInstallLocation(item.location_id || '');
    setInstalledBy('');
    setContactNumber('');
    setInstallFile(null);
    setEquipmentPhoto(null);
    setSerialPhoto(null);
  };

  // Handle Installation Submit
  const handleInstallSubmit = async () => {
    setInstallSubmitting(true);
    try {
      const formData = new FormData();
      if (installSerial.trim()) {
        formData.append('serial_number', installSerial.trim());
      }
      if (installDate) {
        formData.append('installation_date', installDate);
      }
      if (installRemarks.trim()) {
        formData.append('installation_remarks', installRemarks.trim());
      }
      if (installedBy.trim()) {
        formData.append('installed_by', installedBy.trim());
      }
      if (contactNumber.trim()) {
        formData.append('contact_number', contactNumber.trim());
      }
      if (installLocation) {
        formData.append('location_id', installLocation);
      }
      if (installFile) {
        formData.append('file', installFile);
      }
      if (equipmentPhoto) {
        formData.append('equipment_photo', equipmentPhoto);
      }
      if (serialPhoto) {
        formData.append('serial_number_photo', serialPhoto);
      }

      await api.post(`/api/equipment/${installDialog.id}/installation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('Equipment installation recorded successfully!', 'Success', 'success');
      setInstallDialog(null);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to complete installation', 'Error', 'error');
    }
    setInstallSubmitting(false);
  };

  const handleOpenQr = async (item) => {
    try {
      const res = await api.get(`/api/equipment/${item.id}/qr`);
      setQrData(res.data);
      setQrDialog(item);
    } catch (err) {
      showMessage('Failed to load QR data', 'Error', 'error');
    }
  };

  const handleWriteOffSubmit = async () => {
    if (!writeOffDate || !writeOffReason) {
      showMessage('Date and reason are required', 'Warning', 'warning');
      return;
    }
    setWriteOffSubmitting(true);
    try {
      await api.post(`/api/equipment/${writeOffDialog.id}/writeoff`, {
        write_off_date: writeOffDate,
        reason: writeOffReason
      });
      showMessage('Equipment written off successfully', 'Success', 'success');
      setWriteOffDialog(null);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to write off', 'Error', 'error');
    }
    setWriteOffSubmitting(false);
  };

  const handleConsumptionSubmit = async () => {
    if (!consumptionDate || !testsPerformed || parseInt(testsPerformed, 10) <= 0) {
      showMessage('Please enter a valid date and number of tests.', 'Warning', 'warning');
      return;
    }
    setConsumptionSubmitting(true);
    try {
      await api.post('/api/rentals/consumption', {
        equipment_id: consumptionDialog.id,
        consumption_date: consumptionDate,
        tests_performed: parseInt(testsPerformed, 10),
        remarks: consumptionRemarks
      });
      showMessage('Reagent consumption logged successfully!', 'Success', 'success');
      setConsumptionDialog(null);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to log consumption', 'Error', 'error');
    }
    setConsumptionSubmitting(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: 2, color: '#2563EB', display: 'flex' }}>
              <Build fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Equipment Management</Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>Track individual equipment assets, serial numbers, and installation workflows.</Typography>
            </Box>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} size="small" sx={{ height: 38 }}>
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            px: 2,
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, py: 2, fontSize: '0.9rem' }
          }}
        >
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>All Equipment</span>
                <Chip label={counts.all} size="small" sx={{ bgcolor: '#F1F5F9', fontWeight: 700, height: 20 }} />
              </Box>
            }
          />
          <Tab
            value="pending_serial"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Pending Serial Updates</span>
                <Chip
                  label={counts.pending_serial}
                  size="small"
                  color={counts.pending_serial > 0 ? "warning" : "default"}
                  sx={{ fontWeight: 700, height: 20 }}
                />
              </Box>
            }
          />
          <Tab
            value="pending_installation"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Pending Installation</span>
                <Chip
                  label={counts.pending_installation}
                  size="small"
                  color={counts.pending_installation > 0 ? "info" : "default"}
                  sx={{ fontWeight: 700, height: 20 }}
                />
              </Box>
            }
          />
        </Tabs>

        {/* Filters & Search */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search code, serial, material..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 280, flexGrow: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Store</InputLabel>
            <Select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} label="Store">
              <MenuItem value="">All Stores</MenuItem>
              {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category Type</InputLabel>
            <Select value={selectedBiomedical} onChange={e => setSelectedBiomedical(e.target.value)} label="Category Type">
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="biomedical">Biomedical Equipment</MenuItem>
              <MenuItem value="standard">Standard Equipment</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Equipment Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {isMobile ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredEquipment.length === 0 && (
              <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No equipment records found.</Typography>
            )}
            {filteredEquipment.map(item => (
              <Card key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563EB' }}>{item.equipment_code}</Typography>
                  <Chip
                    label={item.status}
                    size="small"
                    color={item.status === 'Operational' ? 'success' : item.status === 'Pending Installation' ? 'info' : 'default'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{item.material_name}</Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>Code: {item.material_code || '-'}</Typography>

                <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1.5, mb: 1.5 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Serial No:</strong> {item.serial_number ? (
                      <Chip label={item.serial_number} size="small" color="success" variant="outlined" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                    ) : (
                      <Chip label="Pending Update" size="small" color="warning" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Store:</strong> {item.warehouse_name || '-'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    <strong>Installation:</strong> {item.installation_status}
                  </Typography>
                  {item.rental_agreement_number && (
                    <>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        <strong>Rental Agreement:</strong> {item.rental_agreement_number}
                      </Typography>
                      {item.rental_start_date && (
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          <strong>Rental Period:</strong> {formatDate(item.rental_start_date)} - {item.rental_end_date ? formatDate(item.rental_end_date) : 'Ongoing'}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {item.serial_number_status === 'Pending Update' && (
                    <Button size="small" variant="outlined" color="warning" startIcon={<Edit />} onClick={() => { setSerialDialog(item); setSerialInput(''); }}>
                      Update Serial
                    </Button>
                  )}
                  {item.installation_status === 'Pending Installation' && (
                    <Button size="small" variant="contained" color="primary" startIcon={<Build />} onClick={() => openInstallationDialog(item)}>
                      Install Equipment
                    </Button>
                  )}
                  {item.installation_report_url && (
                    <Button size="small" variant="outlined" color="success" startIcon={<OpenInNew />} onClick={() => window.open(getFileUrl(item.installation_report_url), '_blank')}>
                      Report
                    </Button>
                  )}
                  {item.status === 'Operational' && (item.cost_per_test > 0 || item.rental_type === 'Reagent Rental') && (
                    <Button size="small" variant="outlined" color="secondary" startIcon={<Science />} onClick={() => { setConsumptionDialog(item); setConsumptionDate(new Date().toISOString().split('T')[0]); setTestsPerformed(''); setConsumptionRemarks(''); }}>
                      Log Usage
                    </Button>
                  )}
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Equipment Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Material Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Serial Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Store</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>GRN Ref</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Installation Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEquipment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                      No equipment records matching current filters.
                    </TableCell>
                  </TableRow>
                )}
                {filteredEquipment.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
                      {item.equipment_code}
                      {item.is_biomedical && (
                        <Tooltip title="Biomedical Equipment">
                          <LocalHospital sx={{ fontSize: 16, color: '#E11D48', ml: 0.5, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                      {item.rental_agreement_number && (
                        <Tooltip title={`Rental Agreement: ${item.rental_agreement_number} | Period: ${item.rental_start_date ? formatDate(item.rental_start_date) : ''} - ${item.rental_end_date ? formatDate(item.rental_end_date) : 'Ongoing'}`}>
                          <Assignment sx={{ fontSize: 16, color: '#0EA5E9', ml: 0.5, verticalAlign: 'middle' }} />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.material_name}</Typography>
                      <Typography variant="caption" color="textSecondary">{item.material_code}</Typography>
                    </TableCell>
                    <TableCell>
                      {item.serial_number ? (
                        <Chip label={item.serial_number} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="Pending Update" size="small" color="warning" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{item.warehouse_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#64748B' }}>{item.grn_number || '-'}</TableCell>
                    <TableCell>
                      {item.installation_status === 'Installed' ? (
                        <Chip label="Installed" size="small" color="success" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: '0.75rem' }} />
                      ) : item.installation_status === 'Pending Installation' ? (
                        <Chip label="Pending Installation" size="small" color="info" icon={<Warning sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: '0.75rem' }} />
                      ) : (
                        <Chip label="Not Required" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'Operational' ? 'success' : item.status === 'Pending Installation' ? 'info' : 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {item.serial_number_status === 'Pending Update' && (
                          <Tooltip title="Update Serial Number">
                            <Button size="small" variant="outlined" color="warning" sx={{ textTransform: 'none', py: 0.5 }} onClick={() => { setSerialDialog(item); setSerialInput(''); }}>
                              Serial No.
                            </Button>
                          </Tooltip>
                        )}
                        {item.installation_status === 'Pending Installation' && (
                          <Tooltip title="Record Installation & Upload Report">
                            <Button size="small" variant="contained" color="primary" sx={{ textTransform: 'none', py: 0.5 }} onClick={() => openInstallationDialog(item)}>
                              Install
                            </Button>
                          </Tooltip>
                        )}
                        {item.installation_report_url && (
                          <Tooltip title="View Installation Report">
                            <IconButton size="small" color="success" onClick={() => window.open(getFileUrl(item.installation_report_url), '_blank')}>
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (
                          <Tooltip title="Print QR Code">
                            <IconButton size="small" color="primary" onClick={() => handleOpenQr(item)}>
                              <QrCode fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (item.cost_per_test > 0 || item.rental_type === 'Reagent Rental') && (
                          <Tooltip title="Log Reagent Usage">
                            <IconButton size="small" color="secondary" onClick={() => { setConsumptionDialog(item); setConsumptionDate(new Date().toISOString().split('T')[0]); setTestsPerformed(''); setConsumptionRemarks(''); }}>
                              <Science fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (
                          <Tooltip title="Write-off Equipment">
                            <IconButton size="small" color="error" onClick={() => { setWriteOffDialog(item); setWriteOffDate(new Date().toISOString().split('T')[0]); setWriteOffReason(''); }}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Dialog 1: Update Serial Number */}
      <Dialog open={!!serialDialog} onClose={() => setSerialDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Serial Number</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              Equipment Code: <strong>{serialDialog?.equipment_code}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Material: <strong>{serialDialog?.material_name}</strong>
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Serial Number *"
              placeholder="Enter equipment serial number"
              value={serialInput}
              onChange={e => setSerialInput(e.target.value)}
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setSerialDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" disabled={serialSubmitting} onClick={handleSerialSubmit}>
            {serialSubmitting ? 'Saving...' : 'Save Serial Number'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog 2: Installation Workflow */}
      <Dialog open={!!installDialog} onClose={() => setInstallDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record Equipment Installation</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Update equipment serial number and upload signed installation compliance report.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">Equipment Code</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{installDialog?.equipment_code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="textSecondary">Material</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>{installDialog?.material_name}</Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Serial Number"
                  placeholder="Enter or confirm serial number"
                  value={installSerial}
                  onChange={e => setInstallSerial(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Installation Date"
                  value={installDate}
                  onChange={e => setInstallDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Installed By (Engineer Name)"
                  value={installedBy}
                  onChange={e => setInstalledBy(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Number"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Location (Department/Ward)</InputLabel>
                  <Select value={installLocation} onChange={e => setInstallLocation(e.target.value)} label="Location (Department/Ward)">
                    <MenuItem value="">Select Location...</MenuItem>
                    {locations.filter(l => l.is_active).map(l => (
                      <MenuItem key={l.id} value={l.id}>{l.location_name} ({l.location_code})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, border: '1px dashed #CBD5E1', borderRadius: 2, textAlign: 'center', bgcolor: '#F8FAFC', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                    📎 Installation Report
                  </Typography>
                  {installFile ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>Selected: {installFile.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => setInstallFile(null)}><DeleteOutline fontSize="small" /></IconButton>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" size="small" startIcon={<UploadFile />}>
                      Upload PDF/Img
                      <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setInstallFile(e.target.files[0])} />
                    </Button>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, border: '1px dashed #CBD5E1', borderRadius: 2, textAlign: 'center', bgcolor: '#F8FAFC', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                    📸 Equipment Photo
                  </Typography>
                  {equipmentPhoto ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>Selected: {equipmentPhoto.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => setEquipmentPhoto(null)}><DeleteOutline fontSize="small" /></IconButton>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" size="small" startIcon={<UploadFile />}>
                      Upload Image
                      <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={e => setEquipmentPhoto(e.target.files[0])} />
                    </Button>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, border: '1px dashed #CBD5E1', borderRadius: 2, textAlign: 'center', bgcolor: '#F8FAFC', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                    🔢 Serial No. Photo
                  </Typography>
                  {serialPhoto ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>Selected: {serialPhoto.name}</Typography>
                      <IconButton size="small" color="error" onClick={() => setSerialPhoto(null)}><DeleteOutline fontSize="small" /></IconButton>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" size="small" startIcon={<UploadFile />}>
                      Upload Image
                      <input type="file" hidden accept=".jpg,.jpeg,.png,.webp" onChange={e => setSerialPhoto(e.target.files[0])} />
                    </Button>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Installation Remarks / Engineer Notes"
                  placeholder="e.g. Installed in Room 102 by Service Engineer John Doe. Operational test passed."
                  value={installRemarks}
                  onChange={e => setInstallRemarks(e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInstallDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" disabled={installSubmitting} onClick={handleInstallSubmit}>
            {installSubmitting ? 'Submitting...' : 'Complete Installation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrDialog} onClose={() => setQrDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #eee' }}>Print QR Label</DialogTitle>
        <DialogContent sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          {qrData ? (
            <Card variant="outlined" sx={{ p: 2, width: '300px', border: '2px solid #000' }}>
              <Typography align="center" variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>{qrData.department}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Asset ID:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{qrData.asset_id}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>Eq. Name:</Typography>
                <Typography variant="caption">{qrData.equipment_name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                {/* Placeholder for actual QR code rendering, e.g. using react-qr-code */}
                <Box sx={{ width: 120, height: 120, bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
                  <QrCode sx={{ fontSize: 60, color: '#888' }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Dept: {qrData.department_used}</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>PM Due: {qrData.pm_due_date || 'N/A'}</Typography>
              </Box>
            </Card>
          ) : (
            <Typography>Loading QR Data...</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQrDialog(null)} color="inherit">Close</Button>
          <Button variant="contained" color="primary" startIcon={<Print />} onClick={() => window.print()}>Print</Button>
        </DialogActions>
      </Dialog>
      
      {/* Write Off Dialog */}
      <Dialog open={!!writeOffDialog} onClose={() => setWriteOffDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#E11D48' }}>Equipment Write-Off</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="warning">
              This action will mark the equipment <strong>{writeOffDialog?.equipment_code}</strong> as written off and remove it from operational status permanently.
            </Alert>
            <TextField
              type="date"
              size="small"
              label="Write-Off Date"
              InputLabelProps={{ shrink: true }}
              value={writeOffDate}
              onChange={e => setWriteOffDate(e.target.value)}
              fullWidth
              required
            />
            <TextField
              size="small"
              label="Reason for Write-off"
              multiline rows={3}
              value={writeOffReason}
              onChange={e => setWriteOffReason(e.target.value)}
              fullWidth
              required
              placeholder="Provide detailed reason (e.g. beyond economical repair)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setWriteOffDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleWriteOffSubmit} variant="contained" color="error" disabled={writeOffSubmitting}>
            {writeOffSubmitting ? 'Processing...' : 'Confirm Write-Off'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reagent Consumption Dialog */}
      <Dialog open={!!consumptionDialog} onClose={() => setConsumptionDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#2563EB' }}>Log Reagent Usage</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Logging consumption for <strong>{consumptionDialog?.equipment_code}</strong> 
              (Cost per test: ₹{consumptionDialog?.cost_per_test || 0}).
            </Alert>
            <TextField
              type="date"
              size="small"
              label="Date of Consumption"
              InputLabelProps={{ shrink: true }}
              value={consumptionDate}
              onChange={e => setConsumptionDate(e.target.value)}
              fullWidth
              required
            />
            <TextField
              type="number"
              size="small"
              label="Tests Performed"
              value={testsPerformed}
              onChange={e => setTestsPerformed(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 1 }}
              placeholder="Number of tests run"
            />
            <TextField
              size="small"
              label="Remarks (Optional)"
              multiline rows={2}
              value={consumptionRemarks}
              onChange={e => setConsumptionRemarks(e.target.value)}
              fullWidth
              placeholder="Any notes for this logging period"
            />
            {testsPerformed && consumptionDialog?.cost_per_test > 0 && (
              <Box sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Estimated Cost:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                  ₹{(parseInt(testsPerformed, 10) * consumptionDialog.cost_per_test).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConsumptionDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleConsumptionSubmit} variant="contained" color="primary" disabled={consumptionSubmitting}>
            {consumptionSubmitting ? 'Logging...' : 'Log Usage'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
