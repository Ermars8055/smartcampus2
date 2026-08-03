import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  Tabs, Tab, IconButton, Tooltip, useTheme, useMediaQuery, Alert,
  Autocomplete, createFilterOptions, Switch, FormControlLabel
} from '@mui/material';
import {
  Search, Build, QrCode, UploadFile, CheckCircle, Warning, OpenInNew,
  LocalHospital, PrecisionManufacturing, Edit, FilterList, Refresh, Assignment, DeleteOutline, Print, Science, CompareArrows
} from '@mui/icons-material';
import api, { getFileUrl } from '../services/api';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { QRCodeSVG } from 'qrcode.react';

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
  const [selectedInstitution, setSelectedInstitution] = useState('');

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
  const [printLabelCount, setPrintLabelCount] = useState(12);
  const [labelFormat, setLabelFormat] = useState(32);
  
  // Write Off Dialog
  const [writeOffDialog, setWriteOffDialog] = useState(null);
  const [writeOffDate, setWriteOffDate] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffSubmitting, setWriteOffSubmitting] = useState(false);

  // Relocate Dialog
  const [relocateDialog, setRelocateDialog] = useState(null);
  const [relocateDate, setRelocateDate] = useState('');
  const [relocateLocation, setRelocateLocation] = useState('');
  const [relocateRemarks, setRelocateRemarks] = useState('');
  const [relocateSubmitting, setRelocateSubmitting] = useState(false);

  // Reagent Consumption Dialog
  const [consumptionDialog, setConsumptionDialog] = useState(null);
  const [consumptionDate, setConsumptionDate] = useState('');
  const [testsPerformed, setTestsPerformed] = useState('');
  const [consumptionRemarks, setConsumptionRemarks] = useState('');
  const [consumptionSubmitting, setConsumptionSubmitting] = useState(false);

  // View/Edit Dialogs
  const [viewDialog, setViewDialog] = useState(null);
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

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

      // Biomedical & Medical College filter
      if (selectedBiomedical === 'biomedical' && !item.is_biomedical) return false;
      if (selectedBiomedical === 'standard' && item.is_biomedical) return false;
      if (selectedBiomedical === 'medical_college' && !item.institution_name?.toLowerCase().includes('medical college') && !item.institution_code?.toLowerCase().includes('medical college')) return false;

      // Institution filter
      if (selectedInstitution && item.institution_code !== selectedInstitution && item.institution_name !== selectedInstitution) {
         // Also handle cases where code might be used or name is used.
         // Let's assume the API returns institution_name or institution_code or institution_id.
         // Actually, if we filter by string "Hospital" vs "Medical College", we can check if it matches.
         if (!item.institution_name?.toLowerCase().includes(selectedInstitution.toLowerCase()) && 
             !item.institution_code?.toLowerCase().includes(selectedInstitution.toLowerCase())) {
            return false;
         }
      }

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
  }, [equipmentList, activeTab, selectedWarehouse, selectedBiomedical, selectedInstitution, search]);

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
    if (!installSerial.trim() || !installDate || !installedBy.trim() || !contactNumber.trim() || !installLocation || !installFile || !equipmentPhoto || !serialPhoto) {
      showMessage('Please fill all required details and upload all photos/reports.', 'Validation Error', 'warning');
      return;
    }
    setInstallSubmitting(true);
    try {
      let finalLocationId = installLocation;
      
      // If installLocation is a string, it means we need to create a new location first
      if (typeof installLocation === 'string') {
        const newLocRes = await api.post('/api/configurations/locations', {
          location_name: installLocation.trim(),
          location_code: installLocation.trim().substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
          is_active: true
        });
        finalLocationId = newLocRes.data.id;
        // Optionally update local locations list
        setLocations(prev => [...prev, newLocRes.data]);
      }

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
      if (finalLocationId) {
        formData.append('location_id', finalLocationId);
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
      setPrintLabelCount(12);
      setQrDialog(item);
    } catch (err) {
      showMessage('Failed to load QR data', 'Error', 'error');
    }
  };

  const handlePrintQr = () => {
    if (!qrData || !qrDialog) return;
    const printWindow = window.open('', '', 'width=800,height=800');
    
    const svgElement = document.getElementById('equipment-qr-svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';
    
    const formatConfigs = {
      1: { columns: 1, height: '95vh', svgSize: 250, titleSize: '1.8rem', nameSize: '1.4rem', textSize: '1.2rem', padding: '40px', gap: '20px' },
      2: { columns: 1, height: '46vh', svgSize: 180, titleSize: '1.4rem', nameSize: '1.1rem', textSize: '0.9rem', padding: '30px', gap: '20px' },
      4: { columns: 2, height: '46vh', svgSize: 150, titleSize: '1.2rem', nameSize: '1rem', textSize: '0.85rem', padding: '20px', gap: '20px' },
      8: { columns: 2, height: '23vh', svgSize: 120, titleSize: '1rem', nameSize: '0.85rem', textSize: '0.75rem', padding: '15px', gap: '15px' },
      12: { columns: 3, height: '23vh', svgSize: 100, titleSize: '0.9rem', nameSize: '0.8rem', textSize: '0.65rem', padding: '12px', gap: '15px' },
      16: { columns: 4, height: '23vh', svgSize: 85, titleSize: '0.8rem', nameSize: '0.7rem', textSize: '0.6rem', padding: '10px', gap: '10px' },
      32: { columns: 4, height: '11.5vh', svgSize: 60, titleSize: '0.6rem', nameSize: '0.55rem', textSize: '0.45rem', padding: '5px', gap: '5px' }
    };
    
    const config = formatConfigs[labelFormat] || formatConfigs[32];

    let labelsHtml = '';
    for (let i = 0; i < printLabelCount; i++) {
      labelsHtml += `
        <div class="label-container">
          <div class="department-header">BIOMEDICAL ENGINEERING DEPARTMENT</div>
          <div class="equipment-name">${qrData.equipment_name}</div>
          <div class="qr-code-container">${svgHtml}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Equipment QR Label</title>
          <style>
            @page { margin: 0; size: auto; }
            body { 
              font-family: sans-serif; 
              margin: 0; 
              padding: 15px; 
              box-sizing: border-box;
            }
            .grid-container {
              display: grid;
              grid-template-columns: repeat(${config.columns}, 1fr);
              gap: ${config.gap};
              justify-content: start;
              align-content: start;
            }
            .label-container { 
              text-align: center; 
              border: 1px dashed #999; 
              padding: ${config.padding}; 
              border-radius: 4px; 
              page-break-inside: avoid; 
              background: #fff;
              overflow: hidden;
              height: ${config.height};
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              box-sizing: border-box;
            }
            .department-header { 
              font-weight: 800; 
              font-size: ${config.titleSize}; 
              margin-bottom: 4px; 
            }
            .qr-code-container { margin: 4px 0; }
            .qr-code-container svg { width: ${config.svgSize}px; height: ${config.svgSize}px; }
            .equipment-name {
              font-weight: bold;
              font-size: ${config.nameSize};
              margin-top: 4px;
              margin-bottom: 6px;
              white-space: nowrap; 
              overflow: hidden; 
              text-overflow: ellipsis;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="grid-container">
            ${labelsHtml}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleRelocateSubmit = async () => {
    if (!relocateLocation || !relocateDate) {
      showMessage('Please select a new location and date.', 'Warning', 'warning');
      return;
    }
    setRelocateSubmitting(true);
    try {
      let finalLocationId = relocateLocation;
      if (typeof relocateLocation === 'string') {
        const newLocRes = await api.post('/api/configurations/locations', {
          location_name: relocateLocation.trim(),
          location_code: relocateLocation.trim().substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
          is_active: true
        });
        finalLocationId = newLocRes.data.id;
        setLocations(prev => [...prev, newLocRes.data]);
      }
      
      await api.post(`/api/equipment/${relocateDialog.id}/relocate`, {
        new_location_id: finalLocationId,
        relocation_date: relocateDate,
        remarks: relocateRemarks
      });
      showMessage('Equipment relocated successfully!', 'Success', 'success');
      setRelocateDialog(null);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to relocate equipment', 'Error', 'error');
    }
    setRelocateSubmitting(false);
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

  const handleEditSubmit = async () => {
    setEditSubmitting(true);
    try {
      await api.put(`/api/equipment/${editDialog.id}`, editForm);
      showMessage('Equipment updated successfully', 'Success', 'success');
      setEditDialog(null);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to update equipment', 'Error', 'error');
    }
    setEditSubmitting(false);
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
              <MenuItem value="medical_college">Medical College Equipment</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Institution</InputLabel>
            <Select value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)} label="Institution">
              <MenuItem value="">All Institutions</MenuItem>
              <MenuItem value="Hospital">Hospital</MenuItem>
              <MenuItem value="Medical College">Medical College</MenuItem>
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
              <Card key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2, cursor: 'pointer' }} onClick={() => setViewDialog(item)}>
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
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                    <strong>Institution:</strong> {item.institution_name || item.institution_code || '-'}
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
                  <Button size="small" variant="outlined" color="primary" startIcon={<Edit />} onClick={(e) => { e.stopPropagation(); setEditForm(item); setEditDialog(item); }}>
                    Edit
                  </Button>
                  {item.serial_number_status === 'Pending Update' && (
                    <Button size="small" variant="outlined" color="warning" startIcon={<Edit />} onClick={(e) => { e.stopPropagation(); setSerialDialog(item); setSerialInput(''); }}>
                      Update Serial
                    </Button>
                  )}
                  {item.installation_status === 'Pending Installation' && (
                    <Button size="small" variant="contained" color="primary" startIcon={<Build />} onClick={(e) => { e.stopPropagation(); openInstallationDialog(item); }}>
                      Install Equipment
                    </Button>
                  )}
                  {item.installation_report_url && (
                    <Button size="small" variant="outlined" color="success" startIcon={<OpenInNew />} onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(item.installation_report_url), '_blank'); }}>
                      Report
                    </Button>
                  )}
                  {item.status === 'Operational' && (item.cost_per_test > 0 || item.rental_type === 'Reagent Rental') && (
                    <Button size="small" variant="outlined" color="secondary" startIcon={<Science />} onClick={(e) => { e.stopPropagation(); setConsumptionDialog(item); setConsumptionDate(new Date().toISOString().split('T')[0]); setTestsPerformed(''); setConsumptionRemarks(''); }}>
                      Log Usage
                    </Button>
                  )}
                  {item.status === 'Operational' && (
                    <Button size="small" variant="outlined" color="primary" startIcon={<CompareArrows />} onClick={(e) => { e.stopPropagation(); setRelocateDialog(item); setRelocateDate(new Date().toISOString().split('T')[0]); setRelocateLocation(item.location_id || ''); setRelocateRemarks(''); }}>
                      Relocate
                    </Button>
                  )}
                  {item.status !== 'Written Off' && (
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutline />} onClick={(e) => { e.stopPropagation(); setWriteOffDialog(item); setWriteOffDate(new Date().toISOString().split('T')[0]); setWriteOffReason(''); }}>
                      Write-Off
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
                  <TableCell sx={{ fontWeight: 700 }}>Institution</TableCell>
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
                  <TableRow key={item.id} hover onClick={() => setViewDialog(item)} sx={{ cursor: 'pointer' }}>
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
                    <TableCell sx={{ fontSize: '0.85rem' }}>{item.institution_name || item.institution_code || '-'}</TableCell>
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
                        <Tooltip title="Edit Equipment">
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setEditForm(item); setEditDialog(item); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {item.serial_number_status === 'Pending Update' && (
                          <Tooltip title="Update Serial Number">
                            <Button size="small" variant="outlined" color="warning" sx={{ textTransform: 'none', py: 0.5 }} onClick={(e) => { e.stopPropagation(); setSerialDialog(item); setSerialInput(''); }}>
                              Serial No.
                            </Button>
                          </Tooltip>
                        )}
                        {item.installation_status === 'Pending Installation' && (
                          <Tooltip title="Record Installation & Upload Report">
                            <Button size="small" variant="contained" color="primary" sx={{ textTransform: 'none', py: 0.5 }} onClick={(e) => { e.stopPropagation(); openInstallationDialog(item); }}>
                              Install
                            </Button>
                          </Tooltip>
                        )}
                        {item.installation_report_url && (
                          <Tooltip title="View Installation Report">
                            <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(item.installation_report_url), '_blank'); }}>
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (
                          <Tooltip title="Print QR Code">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenQr(item); }}>
                              <QrCode fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (item.cost_per_test > 0 || item.rental_type === 'Reagent Rental') && (
                          <Tooltip title="Log Reagent Usage">
                            <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); setConsumptionDialog(item); setConsumptionDate(new Date().toISOString().split('T')[0]); setTestsPerformed(''); setConsumptionRemarks(''); }}>
                              <Science fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (
                          <Tooltip title="Relocate Equipment">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setRelocateDialog(item); setRelocateDate(new Date().toISOString().split('T')[0]); setRelocateLocation(item.location_id || ''); setRelocateRemarks(''); }}>
                              <CompareArrows fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.status === 'Operational' && (
                          <Tooltip title="Write-off Equipment">
                            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setWriteOffDialog(item); setWriteOffDate(new Date().toISOString().split('T')[0]); setWriteOffReason(''); }}>
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
                  label="Serial Number *"
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
                  label="Installation Date *"
                  value={installDate}
                  onChange={e => setInstallDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Installed By (Engineer Name) *"
                  value={installedBy}
                  onChange={e => setInstalledBy(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Number *"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={locations.filter(l => l.is_active)}
                  value={
                    typeof installLocation === 'string'
                      ? installLocation
                      : locations.find(l => l.id === installLocation) || null
                  }
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    if (option.inputValue) return option.inputValue;
                    return `${option.location_name} (${option.location_code})`;
                  }}
                  onChange={(event, newValue) => {
                    if (typeof newValue === 'string') {
                      setInstallLocation(newValue);
                    } else if (newValue && newValue.inputValue) {
                      setInstallLocation(newValue.inputValue);
                    } else {
                      setInstallLocation(newValue ? newValue.id : '');
                    }
                  }}
                  filterOptions={(options, params) => {
                    const filter = createFilterOptions();
                    const filtered = filter(options, params);
                    if (params.inputValue !== '') {
                      filtered.push({
                        inputValue: params.inputValue,
                        location_name: `Add "${params.inputValue}"`,
                        location_code: 'NEW'
                      });
                    }
                    return filtered;
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Location (Department/Ward) *" placeholder="Select or type new location" />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 2, border: '1px dashed #CBD5E1', borderRadius: 2, textAlign: 'center', bgcolor: '#F8FAFC', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                    📎 Installation Report *
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
                    📸 Equipment Photo *
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
                    🔢 Serial No. Photo *
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
        <DialogTitle sx={{ fontWeight: 700, textAlign: 'center' }}>
          Equipment QR Code
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {qrData ? (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, textAlign: 'center' }}>
                {qrData.department}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Asset ID: {qrData.asset_id}
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <QRCodeSVG 
                  id="equipment-qr-svg"
                  value={`${window.location.origin}/equipment/${qrData.asset_id}`}
                  size={200}
                  level="M"
                />
              </Box>
              <Typography variant="caption" sx={{ mt: 3, color: '#64748B', textAlign: 'center', fontWeight: 'bold' }}>
                {qrData.equipment_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Format (Labels/Page)</InputLabel>
                  <Select
                    value={labelFormat}
                    label="Format (Labels/Page)"
                    onChange={e => setLabelFormat(e.target.value)}
                  >
                    <MenuItem value={1}>1 Label (Full Page)</MenuItem>
                    <MenuItem value={2}>2 Labels per page</MenuItem>
                    <MenuItem value={4}>4 Labels per page</MenuItem>
                    <MenuItem value={8}>8 Labels per page</MenuItem>
                    <MenuItem value={12}>12 Labels per page</MenuItem>
                    <MenuItem value={16}>16 Labels per page</MenuItem>
                    <MenuItem value={32}>32 Labels per page</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  type="number"
                  label="Total to Print"
                  size="small"
                  value={printLabelCount}
                  onChange={e => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    if (val > 180) val = 180;
                    setPrintLabelCount(val);
                  }}
                  inputProps={{ min: 1, max: 180 }}
                  sx={{ width: 140 }}
                />
              </Box>
            </>
          ) : (
            <Typography>Loading QR Data...</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="outlined" onClick={() => setQrDialog(null)} sx={{ borderRadius: 2, fontWeight: 600 }}>
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Print />} 
            onClick={handlePrintQr}
            sx={{ borderRadius: 2, fontWeight: 700, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' }}
          >
            Print Label
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relocate Equipment Dialog */}
      <Dialog open={!!relocateDialog} onClose={() => setRelocateDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#2563EB' }}>Relocate Equipment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Relocating <strong>{relocateDialog?.equipment_code}</strong>. Its asset ID will remain unchanged.
            </Alert>
            <TextField
              type="date"
              size="small"
              label="Relocation Date"
              InputLabelProps={{ shrink: true }}
              value={relocateDate}
              onChange={e => setRelocateDate(e.target.value)}
              fullWidth
              required
            />
            <Autocomplete
              freeSolo
              size="small"
              options={locations.map(l => l.location_name)}
              value={
                locations.find(l => l.id === relocateLocation)?.location_name ||
                (typeof relocateLocation === 'string' ? relocateLocation : '')
              }
              onChange={(e, newValue) => {
                if (newValue) {
                  const loc = locations.find(l => l.location_name === newValue);
                  setRelocateLocation(loc ? loc.id : newValue);
                } else {
                  setRelocateLocation('');
                }
              }}
              onInputChange={(e, newInputValue) => {
                const loc = locations.find(l => l.location_name === newInputValue);
                setRelocateLocation(loc ? loc.id : newInputValue);
              }}
              renderInput={(params) => <TextField {...params} label="New Department/Location *" required />}
            />
            <TextField
              size="small"
              label="Remarks / Authorized By"
              multiline rows={2}
              value={relocateRemarks}
              onChange={e => setRelocateRemarks(e.target.value)}
              fullWidth
              placeholder="e.g. Moved to ICU per Dr. Smith"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRelocateDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleRelocateSubmit} variant="contained" color="primary" disabled={relocateSubmitting}>
            {relocateSubmitting ? 'Relocating...' : 'Confirm Relocation'}
          </Button>
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

    {/* View Equipment Dialog */}
      <Dialog open={!!viewDialog} onClose={() => setViewDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Equipment Details: {viewDialog?.equipment_code}</DialogTitle>
        <DialogContent dividers>
          {viewDialog && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>General Information</Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Material</TableCell><TableCell>{viewDialog.material_name}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Serial Number</TableCell><TableCell>{viewDialog.serial_number || 'N/A'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Status</TableCell><TableCell>{viewDialog.status}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Location</TableCell><TableCell>{viewDialog.location_name || '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Make / Model</TableCell><TableCell>{viewDialog.make || '-'} / {viewDialog.model || '-'}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Procurement & Warranty</Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Procurement Type</TableCell><TableCell>{viewDialog.procurement_type}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Warranty Available</TableCell><TableCell>{viewDialog.warranty_available ? 'Yes' : 'No'}</TableCell></TableRow>
                    {viewDialog.warranty_available && (
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>Warranty Expiry</TableCell><TableCell>{viewDialog.warranty_expiry_date ? formatDate(viewDialog.warranty_expiry_date) : '-'}</TableCell></TableRow>
                    )}
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>AMC/CMC Status</TableCell><TableCell>{viewDialog.amc_cmc_status || 'None'}</TableCell></TableRow>
                    {viewDialog.amc_cmc_status && viewDialog.amc_cmc_status !== 'None' && (
                      <TableRow><TableCell sx={{ fontWeight: 600 }}>AMC/CMC End Date</TableCell><TableCell>{viewDialog.amc_cmc_end_date ? formatDate(viewDialog.amc_cmc_end_date) : '-'}</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Maintenance</Typography>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>PM Required</TableCell><TableCell>{viewDialog.pm_required ? 'Yes' : 'No'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Calibration Required</TableCell><TableCell>{viewDialog.calibration_required ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Battery Details</TableCell><TableCell colSpan={3}>{viewDialog.battery_details || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Edit Equipment: {editDialog?.equipment_code}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Make" value={editForm.make || ''} onChange={e => setEditForm({ ...editForm, make: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Model" value={editForm.model || ''} onChange={e => setEditForm({ ...editForm, model: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Machine Type" value={editForm.machine_type || ''} onChange={e => setEditForm({ ...editForm, machine_type: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Machine Cost" type="number" inputProps={{ min: "0", step: "0.01" }} value={editForm.machine_cost || ''} onChange={e => setEditForm({ ...editForm, machine_cost: e.target.value === '' ? null : parseFloat(e.target.value) })} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!editForm.warranty_available} onChange={e => setEditForm({ ...editForm, warranty_available: e.target.checked })} />}
                  label="Warranty Available"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="date" label="Warranty Expiry Date" InputLabelProps={{ shrink: true }} value={editForm.warranty_expiry_date ? editForm.warranty_expiry_date.substring(0, 10) : ''} onChange={e => setEditForm({ ...editForm, warranty_expiry_date: e.target.value || null })} disabled={!editForm.warranty_available} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>AMC/CMC Status</InputLabel>
                  <Select value={editForm.amc_cmc_status || 'None'} label="AMC/CMC Status" onChange={e => setEditForm({ ...editForm, amc_cmc_status: e.target.value })}>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="Under AMC">Under AMC</MenuItem>
                    <MenuItem value="Under CMC">Under CMC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="date" label="AMC/CMC End Date" InputLabelProps={{ shrink: true }} value={editForm.amc_cmc_end_date ? editForm.amc_cmc_end_date.substring(0, 10) : ''} onChange={e => setEditForm({ ...editForm, amc_cmc_end_date: e.target.value || null })} disabled={!editForm.amc_cmc_status || editForm.amc_cmc_status === 'None'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="AMC PO Number" value={editForm.amc_po_number || ''} onChange={e => setEditForm({ ...editForm, amc_po_number: e.target.value })} disabled={!editForm.amc_cmc_status || editForm.amc_cmc_status === 'None'} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="AMC Cost" type="number" inputProps={{ min: "0", step: "0.01" }} value={editForm.amc_cost || ''} onChange={e => setEditForm({ ...editForm, amc_cost: e.target.value === '' ? null : parseFloat(e.target.value) })} disabled={!editForm.amc_cmc_status || editForm.amc_cmc_status === 'None'} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!editForm.pm_required} onChange={e => setEditForm({ ...editForm, pm_required: e.target.checked })} />}
                  label="PM Required"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!editForm.calibration_required} onChange={e => setEditForm({ ...editForm, calibration_required: e.target.checked })} />}
                  label="Calibration Required"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Battery Details" value={editForm.battery_details || ''} onChange={e => setEditForm({ ...editForm, battery_details: e.target.value })} placeholder="e.g. 12V 7Ah Lead Acid" />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary" disabled={editSubmitting}>
            {editSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
