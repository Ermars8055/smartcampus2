import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl, InputLabel,
  Tabs, Tab, IconButton, Tooltip, useTheme, useMediaQuery, Alert,
  Autocomplete, createFilterOptions, Switch, FormControlLabel, Divider, TablePagination, TableSortLabel,
  CircularProgress, Paper
} from '@mui/material';
import {
  Search, Build, QrCode, UploadFile, CheckCircle, Warning, OpenInNew,
  LocalHospital, PrecisionManufacturing, Edit, FilterList, Refresh, Assignment, DeleteOutline, Print, Science, CompareArrows, Add, History
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
  const navigate = useNavigate();

  const [equipmentList, setEquipmentList] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending_serial', 'pending_installation'
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'equipment_code', direction: 'asc' });

  // Dialog states
  const [serialDialog, setSerialDialog] = useState(null); // Equipment object
  const [serialInput, setSerialInput] = useState('');
  const [serialNotAvailable, setSerialNotAvailable] = useState(false);
  const [serialSubmitting, setSerialSubmitting] = useState(false);

  // QR Dialog
  const [qrDialog, setQrDialog] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [printLabelCount, setPrintLabelCount] = useState(1);

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

  // Installation Dialog
  const [installDialog, setInstallDialog] = useState(null);
  const [installForm, setInstallForm] = useState({ serial_number: '', installation_date: '', installed_by: '', contact_number: '', location_id: '', installation_remarks: '' });
  const [installFiles, setInstallFiles] = useState({ file: null, equipment_photo: null, serial_number_photo: null });
  const [installSubmitting, setInstallSubmitting] = useState(false);

  // Upload Docs Dialog
  const [uploadDocsDialog, setUploadDocsDialog] = useState(null);
  const [uploadDocsFiles, setUploadDocsFiles] = useState({ file: null, equipment_photo: null, serial_number_photo: null });
  const [uploadDocsSubmitting, setUploadDocsSubmitting] = useState(false);

  // View/Edit Dialogs
  const [viewDialog, setViewDialog] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (viewDialog?.id) {
      setHistoryLoading(true);
      api.get(`/api/equipment/${viewDialog.id}/history`)
        .then(res => setHistoryList(res.data || []))
        .catch(() => setHistoryList([]))
        .finally(() => setHistoryLoading(false));
    } else {
      setHistoryList([]);
    }
  }, [viewDialog]);

  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);


  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({});
  const [addSubmitting, setAddSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eqRes, whRes, locRes, matRes, instRes, poRes] = await Promise.all([
        api.get('/api/equipment'),
        api.get('/api/warehouses'),
        api.get('/api/configurations/locations'),
        api.get('/api/materials', { params: { limit: 10000 } }),
        api.get('/api/institutions'),
        api.get('/api/procurement/po', { params: { limit: 10000 } })
      ]);
      setEquipmentList(eqRes.data || []);
      setWarehouses(whRes.data || []);
      setLocations(locRes.data || []);
      setMaterials(matRes.data?.items || matRes.data || []);
      setInstitutions(instRes.data || []);
      setPurchaseOrders(poRes.data?.items || poRes.data || []);
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
    const pendingInstall = equipmentList.filter(e => e.installation_status === 'Pending Installation' || e.installation_status === 'Installation Requested').length;
    return {
      all: equipmentList.length,
      pending_serial: pendingSerial,
      pending_installation: pendingInstall
    };
  }, [equipmentList]);

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    let filtered = equipmentList.filter(item => {
      // Tab filter
      if (activeTab === 'pending_serial') {
        if (item.serial_number_status !== 'Pending Update' && item.serial_number) return false;
      } else if (activeTab === 'pending_installation') {
        if (item.installation_status !== 'Pending Installation' && item.installation_status !== 'Installation Requested') return false;
      }

      // Status filter
      if (selectedStatus && item.status !== selectedStatus) {
        return false;
      }

      // Institution filter
      if (selectedInstitution && item.institution_id !== selectedInstitution) {
        return false;
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

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Handle nulls
        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        // String comparison
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        // Number comparison
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [equipmentList, activeTab, selectedStatus, selectedInstitution, search, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, selectedStatus, selectedInstitution, search]);

  const paginatedEquipment = useMemo(() => {
    return filteredEquipment.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredEquipment, page, rowsPerPage]);

  // Handle Serial Number Update Submit
  const handleSerialSubmit = async () => {
    const finalSerial = serialNotAvailable ? 'NA' : serialInput.trim();
    if (!finalSerial) {
      showMessage('Serial number is required', 'Validation Error', 'warning');
      return;
    }
    setSerialSubmitting(true);
    try {
      await api.put(`/api/equipment/${serialDialog.id}/serial-number`, {
        serial_number: finalSerial
      });
      const successMessage = finalSerial === 'NA' ? 'Serial number - updated as NA' : `Serial number updated successfully to '${finalSerial}'`;
      showMessage(successMessage, 'Success', 'success');
      setSerialDialog(null);
      setSerialInput('');
      setSerialNotAvailable(false);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to update serial number', 'Duplicate Found', 'warning');
    }
    setSerialSubmitting(false);
  };

  // Handle Request Installation
  const handleRequestInstallation = async (item) => {
    if (window.confirm(`Are you sure you want to generate an Installation ticket for ${item.equipment_code}?`)) {
      try {
        await api.post(`/api/equipment/${item.id}/request-installation`);
        showMessage('Installation ticket generated successfully!', 'Success', 'success');
        loadData();
      } catch (err) {
        showMessage(err.response?.data?.detail || 'Failed to request installation', 'Error', 'error');
      }
    }
  };

  const handleOpenQr = async (item) => {
    try {
      const res = await api.get(`/api/equipment/${item.id}/qr`);
      setQrData(res.data);
      setPrintLabelCount(1);
      setQrDialog(item);
    } catch (err) {
      showMessage('Failed to load QR data', 'Error', 'error');
    }
  };

  const handlePrintQr = () => {
    if (!qrData || !qrDialog) return;
    const printWindow = window.open('', '', 'width=600,height=400');

    const svgElement = document.getElementById('equipment-qr-svg');
    const svgHtml = svgElement ? svgElement.outerHTML : '';

    let labelsHtml = '';
    for (let i = 0; i < printLabelCount; i++) {
      labelsHtml += `
        <div class="label-container">
          <div class="header">
            <span class="equipment-name">${qrData.equipment_name || 'Equipment'}</span>
            <span class="hospital-name">${qrData.institution_name || 'Hospital'}</span>
          </div>
          <div class="content">
            <div class="qr-col">
              ${svgHtml}
            </div>
            <div class="details-col">
              <div class="asset-id">${qrData.asset_id || ''}</div>
              
              <div class="detail-row">
                <div class="label">DEPARTMENT</div>
                <div class="value">${qrData.department_used || qrData.department || ''}</div>
              </div>
              
              <div class="detail-row">
                <div class="label">MAKE & MODEL</div>
                <div class="value">${qrData.make_model || ''}</div>
              </div>
              
              <div class="detail-row no-border">
                <div class="label">SERIAL NUMBER</div>
                <div class="value">${qrData.serial_number || ''}</div>
              </div>
            </div>
          </div>
          <div class="footer">
            Scan to raise a service ticket
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Equipment QR Label</title>
          <style>
            @page { 
              size: auto; 
              margin: 10mm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box;
            }
            .label-container { 
              width: 9cm;
              height: 4.5cm;
              border: 1px solid #000;
              border-radius: 4px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              padding: 2mm 3mm;
              page-break-inside: avoid;
              overflow: hidden;
              background: #fff;
              float: left;
              margin: 2mm;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            .header {
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              font-weight: bold;
              color: #737373 !important;
              margin-bottom: 2mm;
            }
            .equipment-name {
              text-align: left;
              max-width: 50%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .hospital-name {
              text-align: right;
              max-width: 50%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .content {
              display: flex;
              flex: 1;
            }
            .qr-col {
              flex: 0 0 2.5cm;
              display: flex;
              justify-content: flex-start;
              align-items: center;
            }
            .qr-col svg {
              width: 2.2cm;
              height: 2.2cm;
            }
            .details-col {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              padding-left: 2mm;
              border-left: 1px dotted #ccc;
            }
            .asset-id {
              font-size: 11pt;
              font-weight: 900;
              padding-bottom: 1.5mm;
              margin-bottom: 1mm;
              border-bottom: 1px dotted #ccc;
            }
            .detail-row {
              padding-bottom: 1mm;
              margin-bottom: 1mm;
              border-bottom: 1px dotted #ccc;
            }
            .detail-row.no-border {
              border-bottom: none;
              margin-bottom: 0;
            }
            .label {
              font-size: 6.5pt;
              font-weight: 700;
              text-transform: uppercase;
              margin-bottom: 0.5mm;
            }
            .value {
              font-size: 7.5pt;
              margin-bottom: 0px;
            }
            .footer {
              text-align: center;
              font-size: 6.5pt;
              margin-top: auto;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
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

  const handleInstallSubmit = async () => {
    if (!installForm.installed_by || !installForm.contact_number || !installForm.location_id || !installForm.installation_date || (!installForm.serial_number && !installDialog.serial_number)) {
      showMessage('Please fill all required fields including Serial Number.', 'Validation Error', 'warning');
      return;
    }
    setInstallSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('serial_number', installForm.serial_number || installDialog.serial_number || '');
      formData.append('installation_date', installForm.installation_date + 'T12:00:00Z');
      formData.append('installed_by', installForm.installed_by);
      formData.append('contact_number', installForm.contact_number);
      formData.append('location_id', installForm.location_id);
      if (installForm.installation_remarks) formData.append('installation_remarks', installForm.installation_remarks);

      if (installFiles.file) formData.append('file', installFiles.file);
      if (installFiles.equipment_photo) formData.append('equipment_photo', installFiles.equipment_photo);
      if (installFiles.serial_number_photo) formData.append('serial_number_photo', installFiles.serial_number_photo);

      await api.post(`/api/equipment/${installDialog.id}/installation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('Installation completed successfully', 'Success', 'success');
      setInstallDialog(null);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to complete installation', 'Error', 'error');
    }
    setInstallSubmitting(false);
  };

  const handleUploadDocsSubmit = async () => {
    if (!uploadDocsFiles.file && !uploadDocsFiles.equipment_photo && !uploadDocsFiles.serial_number_photo) {
      showMessage('Please select at least one file to upload.', 'Validation Error', 'warning');
      return;
    }
    setUploadDocsSubmitting(true);
    try {
      const formData = new FormData();
      if (uploadDocsFiles.file) formData.append('file', uploadDocsFiles.file);
      if (uploadDocsFiles.equipment_photo) formData.append('equipment_photo', uploadDocsFiles.equipment_photo);
      if (uploadDocsFiles.serial_number_photo) formData.append('serial_number_photo', uploadDocsFiles.serial_number_photo);

      await api.post(`/api/equipment/${uploadDocsDialog.id}/upload-docs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('Documents uploaded successfully', 'Success', 'success');
      setUploadDocsDialog(null);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to upload documents', 'Error', 'error');
    }
    setUploadDocsSubmitting(false);
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

  const handleAddReagent = () => {
    const currentReagents = editForm.linked_reagents || [];
    setEditForm({
      ...editForm,
      linked_reagents: [...currentReagents, { material_id: '', quantity: '' }]
    });
  };

  const handleUpdateReagent = (idx, field, value) => {
    const currentReagents = [...(editForm.linked_reagents || [])];
    currentReagents[idx][field] = value;
    setEditForm({ ...editForm, linked_reagents: currentReagents });
  };

  const handleRemoveReagent = (idx) => {
    const currentReagents = [...(editForm.linked_reagents || [])];
    currentReagents.splice(idx, 1);
    setEditForm({ ...editForm, linked_reagents: currentReagents });
  };

  const handleCreateReagentPO = () => {
    if (!editForm.linked_reagents || editForm.linked_reagents.length === 0) {
      showMessage('No reagents added to create a PO', 'Warning', 'warning');
      return;
    }
    const reagentRentalData = {
      equipment_id: editForm.id,
      equipment_code: editForm.equipment_code,
      rental_agreement_number: editForm.rental_agreement_number,
      po_number: editForm.po_number,
      vendor_id: editForm.rental_vendor_id,
      items: editForm.linked_reagents,
      project_id: editForm.project_id,
      institution_id: editForm.institution_id
    };
    navigate('/purchase-orders', { state: { reagentRentalData } });
  };

  const handleEditSubmit = async () => {
    if (editForm.po_number && !editForm.po_date) {
      showMessage('PO Date is required when PO Number is provided', 'Validation Error', 'warning');
      return;
    }
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

  const openAddDialog = () => {
    setAddForm({
      material_id: '',
      warehouse_id: '',
      location_id: '',
      institution_id: '',
      serial_number: '',
      make: '',
      model: '',
      machine_cost: '',
      machine_type: '',
      warranty_available: false,
      warranty_expiry_date: '',
      amc_cmc_status: 'None',
      amc_cmc_end_date: '',
      pm_required: false,
      calibration_required: false,
      status: 'Operational',
      is_biomedical: false,
      requires_installation: false
    });
    setAddDialog(true);
  };
  const handlePOSelection = async (newValue, isEdit) => {
    const form = isEdit ? editForm : addForm;
    const setForm = isEdit ? setEditForm : setAddForm;

    if (!newValue) {
      setForm({
        ...form,
        po_id: null,
        po_number: '',
        po_date: '',
        procurement_type: 'Purchase',
        rental_type: null,
        rental_agreement_number: null,
        rental_vendor_id: null,
        rental_start_date: null,
        rental_end_date: null,
        billing_frequency: null,
        cost_per_test: null,
      });
      return;
    }

    try {
      const res = await api.get(`/api/procurement/po/${newValue.id}`);
      const po = res.data;

      const updates = {
        po_id: po.id,
        po_number: po.po_number,
        po_date: po.created_at ? po.created_at.split('T')[0] : null,
      };

      if (po.procurement_type && po.procurement_type !== 'Purchase') {
        updates.procurement_type = po.procurement_type;
        updates.rental_type = po.rental_type;
        updates.rental_agreement_number = po.rental_agreement_number;
        updates.rental_vendor_id = po.vendor_id;
        updates.rental_start_date = po.rental_start_date;
        updates.rental_end_date = po.rental_end_date;
        updates.billing_frequency = po.billing_frequency;
        updates.cost_per_test = po.cost_per_test;
      } else {
        updates.procurement_type = 'Purchase';
      }

      setForm({ ...form, ...updates });
    } catch (err) {
      showMessage('Failed to fetch PO details', 'Error', 'error');
    }
  };


  const handleAddSubmit = async () => {
    if (!addForm.material_id || !addForm.institution_id || !addForm.location_id) {
      showMessage('Material, Institution, and Location are required', 'Validation Error', 'warning');
      return;
    }
    if (addForm.po_number && !addForm.po_date) {
      showMessage('PO Date is required when PO Number is provided', 'Validation Error', 'warning');
      return;
    }
    setAddSubmitting(true);
    try {
      // Clean up empty strings to null for integers/dates
      const payload = { ...addForm };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });
      await api.post('/api/equipment', payload);
      showMessage('Equipment added successfully', 'Success', 'success');
      setAddDialog(false);
      loadData();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to add equipment', 'Error', 'error');
    }
    setAddSubmitting(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A' }}>Equipment Management</Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>Track individual equipment assets, serial numbers, and installation workflows.</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData} size="small" sx={{ height: 38 }}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<QrCode />} onClick={() => navigate('/equipment/print-qr')} size="small" sx={{ height: 38 }}>
            Bulk Print QR
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openAddDialog}>
            Add Equipment
          </Button>
        </Box>
      </Box>

      {/* Search, Filters & Tabs */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {/* Filters & Search */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search code, serial, material..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{
              width: 320,
              '& input:focus::placeholder': { color: 'transparent' }
            }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} displayEmpty>
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Operational">Operational</MenuItem>
              <MenuItem value="Pending Installation">Pending Installation</MenuItem>
              <MenuItem value="Under Repair">Under Repair</MenuItem>
              <MenuItem value="Written Off">Written Off</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)} displayEmpty>
              <MenuItem value="">All Institutions</MenuItem>
              {institutions.map(inst => (
                <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            px: 2,
            borderTop: '1px solid #E2E8F0',
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
      </Card>

      {/* Equipment Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {isMobile ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredEquipment.length === 0 && (
              <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No equipment records found.</Typography>
            )}
            {paginatedEquipment.map(item => (
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
                  {item.serial_number_status === 'Pending Update' && (
                    <Button size="small" variant="outlined" color="warning" startIcon={<Edit color="warning" />} onClick={(e) => { e.stopPropagation(); setSerialDialog(item); setSerialInput(''); setSerialNotAvailable(false); }}>
                      Update Serial
                    </Button>
                  )}
                  <Button size="small" variant="outlined" color="primary" startIcon={<Edit color="primary" />} onClick={(e) => { e.stopPropagation(); setEditForm(item); setEditDialog(item); }}>
                    Edit
                  </Button>
                  {(item.installation_status === 'Pending Installation' || item.installation_status === 'Installation Requested') && (
                    <Button size="small" variant="contained" color="secondary" startIcon={<Build />} onClick={(e) => { e.stopPropagation(); setInstallForm({ ...installForm, serial_number: item.serial_number || '' }); setInstallFiles({ file: null, equipment_photo: null, serial_number_photo: null }); setInstallDialog(item); }}>
                      Complete Install
                    </Button>
                  )}
                  {item.installation_status === 'Pending Installation' && (
                    <Button size="small" variant="contained" color="primary" startIcon={<Assignment />} onClick={(e) => { e.stopPropagation(); handleRequestInstallation(item); }}>
                      Request Installation Call
                    </Button>
                  )}
                  {item.installation_status === 'Installation Requested' && (
                    <Button size="small" variant="contained" color="inherit" disabled startIcon={<Assignment />}>
                      Ticket Raised
                    </Button>
                  )}
                  {item.installation_status === 'Installed' && (
                    <Button size="small" variant="outlined" color="primary" startIcon={<UploadFile />} onClick={(e) => { e.stopPropagation(); setUploadDocsFiles({ file: null, equipment_photo: null, serial_number_photo: null }); setUploadDocsDialog(item); }}>
                      Upload Docs
                    </Button>
                  )}
                  {item.installation_report_url && (
                    <Button size="small" variant="outlined" color="success" startIcon={<OpenInNew />} onClick={(e) => { e.stopPropagation(); window.open(getFileUrl(item.installation_report_url), '_blank'); }}>
                      Report
                    </Button>
                  )}
                  {item.status === 'Operational' && (item.cost_per_test > 0 || item.rental_type === 'Cost per test') && (
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
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutline />} onClick={(e) => {
                      e.stopPropagation();
                      navigate('/write-offs', {
                        state: {
                          isEquipmentMode: true,
                          prefillData: {
                            equipment_id: item.id,
                            material_id: item.material_id,
                            warehouse_id: item.warehouse_id,
                            location_id: item.location_id
                          }
                        }
                      });
                    }}>
                      Write-off
                    </Button>
                  )}
                </Box>
              </Card>
            ))}
            <TablePagination
              component="div"
              count={filteredEquipment.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
            />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'hidden' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', minWidth: '100%', '& .MuiTableCell-root': { px: 0.5, py: 0.75, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
              <TableHead sx={{ bgcolor: '#F8FAFC', '& .MuiTableCell-root': { lineHeight: 1.2, whiteSpace: 'normal' } }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '15%' }}>
                    <TableSortLabel active={sortConfig.key === 'equipment_code'} direction={sortConfig.key === 'equipment_code' ? sortConfig.direction : 'asc'} onClick={() => handleSort('equipment_code')}>
                      Equipment Code
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '15%' }}>
                    <TableSortLabel active={sortConfig.key === 'material_name'} direction={sortConfig.key === 'material_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('material_name')}>
                      Material Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '16%' }}>
                    <TableSortLabel active={sortConfig.key === 'serial_number'} direction={sortConfig.key === 'serial_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('serial_number')}>
                      Serial Number
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '10%' }}>
                    <TableSortLabel active={sortConfig.key === 'institution_name'} direction={sortConfig.key === 'institution_name' ? sortConfig.direction : 'asc'} onClick={() => handleSort('institution_name')}>
                      Institution
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '8%' }}>
                    <TableSortLabel active={sortConfig.key === 'grn_number'} direction={sortConfig.key === 'grn_number' ? sortConfig.direction : 'asc'} onClick={() => handleSort('grn_number')}>
                      GRN Ref
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '10%' }}>
                    <TableSortLabel active={sortConfig.key === 'installation_status'} direction={sortConfig.key === 'installation_status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('installation_status')}>
                      Install Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, width: '10%' }}>
                    <TableSortLabel active={sortConfig.key === 'status'} direction={sortConfig.key === 'status' ? sortConfig.direction : 'asc'} onClick={() => handleSort('status')}>
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: '16%' }}>Actions</TableCell>
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
                {paginatedEquipment.map(item => (
                  <TableRow key={item.id} hover onClick={() => setViewDialog(item)} sx={{ cursor: 'pointer' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontSize: '0.85rem' }}>
                      {item.equipment_code}
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
                        <Tooltip title="Update Serial Number">
                          <Chip
                            label="Pending Update"
                            size="small"
                            color="warning"
                            clickable
                            onClick={(e) => { e.stopPropagation(); setSerialDialog(item); setSerialInput(''); setSerialNotAvailable(false); }}
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{item.institution_name || item.institution_code || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: '#64748B' }}>{item.grn_number || '-'}</TableCell>
                    <TableCell>
                      {item.installation_status === 'Installed' ? (
                        <Chip label="Installed" size="small" color="success" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: '0.75rem' }} />
                      ) : item.installation_status === 'Pending Installation' ? (
                        <Chip label="Pending Installation" size="small" color="info" icon={<Warning sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: '0.75rem' }} />
                      ) : item.installation_status === 'Installation Requested' ? (
                        <Chip label="Ticket Raised" size="small" color="secondary" icon={<Assignment sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: '0.75rem' }} />
                      ) : (
                        <Chip label="Not Required" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontSize: '0.75rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        size="small"
                        color={item.status === 'Operational' ? 'success' : (item.status === 'Pending Installation' || item.installation_status === 'Installation Requested') ? 'info' : 'default'}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Tooltip title="Edit Equipment">
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setEditForm(item); setEditDialog(item); }}>
                            <Edit color="primary" fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(item.installation_status === 'Pending Installation' || item.installation_status === 'Installation Requested') && (
                          <Tooltip title="Complete Installation">
                            <IconButton size="small" color="secondary" onClick={(e) => { e.stopPropagation(); setInstallForm({ ...installForm, serial_number: item.serial_number || '' }); setInstallFiles({ file: null, equipment_photo: null, serial_number_photo: null }); setInstallDialog(item); }}>
                              <Build fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {item.installation_status === 'Pending Installation' && (
                          <Tooltip title="Request Installation Call">
                            <Button size="small" variant="contained" color="primary" sx={{ textTransform: 'none', py: 0.5 }} onClick={(e) => { e.stopPropagation(); handleRequestInstallation(item); }}>
                              Request Install
                            </Button>
                          </Tooltip>
                        )}
                        {item.installation_status === 'Installation Requested' && (
                          <Tooltip title="Ticket Raised">
                            <Button size="small" variant="contained" color="inherit" disabled sx={{ textTransform: 'none', py: 0.5 }}>
                              Ticket Raised
                            </Button>
                          </Tooltip>
                        )}
                        {item.installation_status === 'Installed' && (
                          <Tooltip title="Upload Documents">
                            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); setUploadDocsFiles({ file: null, equipment_photo: null, serial_number_photo: null }); setUploadDocsDialog(item); }}>
                              <UploadFile fontSize="small" />
                            </IconButton>
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
                        {item.status === 'Operational' && (item.cost_per_test > 0 || item.rental_type === 'Cost per test') && (
                          <Tooltip title="Log Usage">
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
                        {item.status !== 'Written Off' && (
                          <Tooltip title="Write-off Equipment">
                            <IconButton size="small" color="error" onClick={(e) => {
                              e.stopPropagation();
                              navigate('/write-offs', {
                                state: {
                                  isEquipmentMode: true,
                                  prefillData: {
                                    equipment_id: item.id,
                                    material_id: item.material_id,
                                    warehouse_id: item.warehouse_id,
                                    location_id: item.location_id
                                  }
                                }
                              });
                            }}>
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
            <TablePagination
              component="div"
              count={filteredEquipment.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
            />
          </TableContainer>
        )}
      </Card>

      {/* Dialog 1: Update Serial Number */}
      <Dialog open={!!serialDialog} onClose={() => { setSerialDialog(null); setSerialNotAvailable(false); }} maxWidth="xs" fullWidth>
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
              disabled={serialNotAvailable}
              autoFocus
            />
            <FormControlLabel
              control={
                <Switch
                  checked={serialNotAvailable}
                  onChange={(e) => {
                    setSerialNotAvailable(e.target.checked);
                    if (e.target.checked) setSerialInput('');
                  }}
                  color="primary"
                />
              }
              label="Serial Number Not Available"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setSerialDialog(null); setSerialNotAvailable(false); }} color="inherit">Cancel</Button>
          <Button variant="contained" color="primary" disabled={serialSubmitting} onClick={handleSerialSubmit}>
            {serialSubmitting ? 'Saving...' : 'Save Serial Number'}
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
              <Box
                sx={{
                  width: '340px',
                  height: '170px',
                  border: '1px solid #000',
                  borderRadius: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  p: '8px 11px',
                  bgcolor: '#fff',
                  boxSizing: 'border-box'
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '8px' }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                    {qrData.equipment_name || 'Equipment'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }}>
                    {qrData.institution_name || 'Hospital'}
                  </Typography>
                </Box>

                {/* Content */}
                <Box sx={{ display: 'flex', flex: 1 }}>
                  {/* QR Code */}
                  <Box sx={{ flex: '0 0 90px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <QRCodeSVG
                      id="equipment-qr-svg"
                      value={`${window.location.origin}/equipment/${qrData.asset_id}`}
                      size={83}
                      level="M"
                    />
                  </Box>

                  {/* Details */}
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', pl: 1, borderLeft: '1px dotted #ccc' }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 900, pb: '4px', mb: '4px', borderBottom: '1px dotted #ccc', lineHeight: 1.2 }}>
                      {qrData.asset_id || ''}
                    </Typography>

                    <Box sx={{ pb: '4px', mb: '4px', borderBottom: '1px dotted #ccc' }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, lineHeight: 1, mb: '2px' }}>DEPARTMENT</Typography>
                      <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{qrData.department_used || qrData.department || ''}</Typography>
                    </Box>

                    <Box sx={{ pb: '4px', mb: '4px', borderBottom: '1px dotted #ccc' }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, lineHeight: 1, mb: '2px' }}>MAKE & MODEL</Typography>
                      <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{qrData.make_model || ''}</Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, lineHeight: 1, mb: '2px' }}>SERIAL NUMBER</Typography>
                      <Typography sx={{ fontSize: '0.65rem', lineHeight: 1 }}>{qrData.serial_number || ''}</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Footer */}
                <Typography sx={{ textAlign: 'center', fontSize: '0.55rem', mt: 'auto', pt: '4px' }}>
                  Scan to raise a service ticket
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
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
            <DatePicker
              label="Relocation Date"
              format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              value={relocateDate ? dayjs(relocateDate) : null}
              onChange={(newValue) => setRelocateDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
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
            <DatePicker
              label="Write-Off Date"
              format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              value={writeOffDate ? dayjs(writeOffDate) : null}
              onChange={(newValue) => setWriteOffDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
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
        <DialogTitle sx={{ fontWeight: 700, color: '#2563EB' }}>Log Usage</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Logging consumption for <strong>{consumptionDialog?.equipment_code}</strong>
              (Cost per test: ₹{consumptionDialog?.cost_per_test || 0}).
            </Alert>
            <DatePicker
              label="Date of Consumption"
              format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
              value={consumptionDate ? dayjs(consumptionDate) : null}
              onChange={(newValue) => setConsumptionDate(newValue ? newValue.format('YYYY-MM-DD') : '')}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
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
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Machine Type</TableCell><TableCell>{viewDialog.machine_type || '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Machine Cost</TableCell><TableCell>{viewDialog.machine_cost ? `₹${viewDialog.machine_cost}` : '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Year of Purchase</TableCell><TableCell>{viewDialog.year_of_purchase || '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>PO Number</TableCell><TableCell>{viewDialog.po_number || '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>GRN Number</TableCell><TableCell>{viewDialog.grn_number || '-'}</TableCell></TableRow>
                    <TableRow><TableCell sx={{ fontWeight: 600 }}>Installation Date</TableCell><TableCell>{viewDialog.installation_date ? formatDate(viewDialog.installation_date) : '-'}</TableCell></TableRow>
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
                      <>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>AMC/CMC End Date</TableCell><TableCell>{viewDialog.amc_cmc_end_date ? formatDate(viewDialog.amc_cmc_end_date) : '-'}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>AMC PO Number</TableCell><TableCell>{viewDialog.amc_po_number || '-'}</TableCell></TableRow>
                        <TableRow><TableCell sx={{ fontWeight: 600 }}>AMC Cost</TableCell><TableCell>{viewDialog.amc_cost ? `₹${viewDialog.amc_cost}` : '-'}</TableCell></TableRow>
                      </>
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
                      <TableCell sx={{ fontWeight: 600 }}>PM Due Date</TableCell><TableCell>{viewDialog.next_pm_due_date ? formatDate(viewDialog.next_pm_due_date) : '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Calibration Required</TableCell><TableCell>{viewDialog.calibration_required ? 'Yes' : 'No'}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Calibration Due Date</TableCell><TableCell>{viewDialog.next_calibration_due_date ? formatDate(viewDialog.next_calibration_due_date) : '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Battery Details</TableCell><TableCell colSpan={3}>{viewDialog.battery_details || '-'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>

              {/* Equipment Lifecycle History & Audit Trail */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History sx={{ fontSize: 20 }} /> Equipment Lifecycle History & Audit Trail
                </Typography>

                {historyLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : historyList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                    No history events logged yet for this equipment.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 250 }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Event Type</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Ref #</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Action By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyList.map(h => (
                          <TableRow key={h.id} hover>
                            <TableCell>
                              <Chip
                                label={h.event_type}
                                size="small"
                                color={
                                  h.event_type === 'Installation' ? 'success' :
                                    h.event_type === 'Relocation' ? 'secondary' :
                                      h.event_type === 'Calibration' ? 'info' :
                                        h.event_type === 'Write-off' ? 'error' : 'primary'
                                }
                                sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                              {h.event_date ? dayjs(h.event_date).format('DD-MMM-YYYY HH:mm') : '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.78rem' }}>{h.description || '-'}</TableCell>
                            <TableCell sx={{ fontSize: '0.78rem' }}>{h.reference_id || '-'}</TableCell>
                            <TableCell sx={{ fontSize: '0.78rem' }}>{h.created_by_name || 'System'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(null)}>Close</Button>
        </DialogActions>

      </Dialog>

      {/* Add Equipment Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Add New Equipment</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: -1 }}>Core Details</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth size="small" label="Equipment Code"
                  value="Auto-generated"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <Autocomplete
                  size="small"
                  options={materials.filter(m => m.is_active)}
                  getOptionLabel={option => `${option.name} (${option.code})`}
                  value={materials.find(m => m.id === addForm.material_id) || null}
                  onChange={(e, val) => setAddForm({ ...addForm, material_id: val ? val.id : '' })}
                  renderInput={params => <TextField {...params} label="Material *" />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Store (Warehouse)</InputLabel>
                  <Select
                    value={addForm.warehouse_id || ''}
                    label="Store (Warehouse)"
                    onChange={e => setAddForm({ ...addForm, warehouse_id: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Institution *</InputLabel>
                  <Select
                    value={addForm.institution_id || ''}
                    label="Institution *"
                    onChange={e => setAddForm({ ...addForm, institution_id: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location *</InputLabel>
                  <Select
                    value={addForm.location_id || ''}
                    label="Location *"
                    onChange={e => setAddForm({ ...addForm, location_id: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!addForm.requires_installation} onChange={e => setAddForm({ ...addForm, requires_installation: e.target.checked })} />}
                  label="Requires Installation"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary" sx={{ mb: -1 }}>Editable Details</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Serial Number" value={addForm.serial_number || ''} onChange={e => setAddForm({ ...addForm, serial_number: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Make" value={addForm.make || ''} onChange={e => setAddForm({ ...addForm, make: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Model" value={addForm.model || ''} onChange={e => setAddForm({ ...addForm, model: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Machine Type" value={addForm.machine_type || ''} onChange={e => setAddForm({ ...addForm, machine_type: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Machine Cost" type="number" inputProps={{ min: "0", step: "0.01" }} value={addForm.machine_cost || ''} onChange={e => setAddForm({ ...addForm, machine_cost: e.target.value === '' ? '' : parseFloat(e.target.value) })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Year of Purchase" type="number" placeholder="e.g. 2026" inputProps={{ min: "1900", max: new Date().getFullYear(), step: "1" }} value={addForm.year_of_purchase || ''} onChange={e => { if (e.target.value.length <= 4) setAddForm({ ...addForm, year_of_purchase: e.target.value === '' ? '' : parseInt(e.target.value) }); }} error={addForm.year_of_purchase > new Date().getFullYear()} helperText={addForm.year_of_purchase > new Date().getFullYear() ? "Cannot be a future year" : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={purchaseOrders}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.po_number || ''}
                  value={purchaseOrders.find(p => p.id === addForm.po_id) || addForm.po_number || null}
                  onChange={(e, newValue) => {
                    if (typeof newValue === 'string') {
                      setAddForm({ ...addForm, po_number: newValue, po_id: null, po_date: '' });
                    } else {
                      handlePOSelection(newValue, false);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="PO Number" />}
                />
              </Grid>
              {addForm.po_number && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="PO Date *"
                    format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                    value={addForm.po_date ? dayjs(addForm.po_date) : null}
                    onChange={(newValue) => setAddForm({ ...addForm, po_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                    slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Procurement Type" value={addForm.procurement_type || 'Purchase'} onChange={e => setAddForm({ ...addForm, procurement_type: e.target.value })}>
                  <MenuItem value="Purchase">Purchase</MenuItem>
                  <MenuItem value="Rental">Rental</MenuItem>
                  <MenuItem value="Lease">Lease</MenuItem>
                  <MenuItem value="Reagent Tie-up">Reagent Tie-up</MenuItem>
                </TextField>
              </Grid>
              {addForm.procurement_type && addForm.procurement_type !== 'Purchase' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="primary">Rental Details</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Rental Agreement Number" value={addForm.rental_agreement_number || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Rental Model" value={addForm.rental_type || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker label="Rental Start Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} readOnly slotProps={{ textField: { size: 'small', fullWidth: true } }} value={addForm.rental_start_date ? dayjs(addForm.rental_start_date) : null} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker label="Rental End Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} readOnly slotProps={{ textField: { size: 'small', fullWidth: true } }} value={addForm.rental_end_date ? dayjs(addForm.rental_end_date) : null} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Billing Frequency" value={addForm.billing_frequency || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="Cost per Test" value={addForm.cost_per_test || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="Rental Cost" value={addForm.rental_cost || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary" sx={{ mb: -1 }}>Maintenance & Warranty</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!addForm.warranty_available} onChange={e => setAddForm({ ...addForm, warranty_available: e.target.checked })} />}
                  label="Warranty Available"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker label="Warranty Expiry Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} value={addForm.warranty_expiry_date ? dayjs(addForm.warranty_expiry_date) : null} onChange={(newValue) => setAddForm({ ...addForm, warranty_expiry_date: newValue ? newValue.format('YYYY-MM-DD') : null })} disabled={!addForm.warranty_available} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>AMC/CMC Status</InputLabel>
                  <Select value={addForm.amc_cmc_status || 'None'} label="AMC/CMC Status" onChange={e => setAddForm({ ...addForm, amc_cmc_status: e.target.value })}>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="AMC">AMC</MenuItem>
                    <MenuItem value="CMC">CMC</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker label="AMC/CMC End Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} value={addForm.amc_cmc_end_date ? dayjs(addForm.amc_cmc_end_date) : null} onChange={(newValue) => setAddForm({ ...addForm, amc_cmc_end_date: newValue ? newValue.format('YYYY-MM-DD') : null })} disabled={addForm.amc_cmc_status === 'None'} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!addForm.pm_required} onChange={e => setAddForm({ ...addForm, pm_required: e.target.checked })} />}
                  label="PM Required"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!addForm.calibration_required} onChange={e => setAddForm({ ...addForm, calibration_required: e.target.checked })} />}
                  label="Calibration Required"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setAddDialog(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained" color="primary" disabled={addSubmitting || (addForm.year_of_purchase > new Date().getFullYear())}>
            {addSubmitting ? 'Saving...' : 'Save Equipment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Edit Equipment: {editDialog?.equipment_code}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              {/* Read-Only System Fields */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: -1, mt: 1 }}>System Information (Read-Only)</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Equipment Name" value={editForm.material_name || ''} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Serial Number" value={editForm.serial_number || 'Pending'} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Status" value={editForm.status || ''} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="GRN Number" value={editForm.grn_number || '-'} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Installation Date" value={editForm.installation_date ? formatDate(editForm.installation_date) : '-'} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="PM Due Date" value={editForm.next_pm_due_date ? formatDate(editForm.next_pm_due_date) : '-'} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Calibration Due Date" value={editForm.next_calibration_due_date ? formatDate(editForm.next_calibration_due_date) : '-'} InputProps={{ readOnly: true }} variant="filled" />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="primary" sx={{ mb: -1 }}>Editable Details</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Asset Code" value={editForm.equipment_code || ''} onChange={e => setEditForm({ ...editForm, equipment_code: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={editForm.location_id || ''}
                    label="Location"
                    onChange={e => setEditForm({ ...editForm, location_id: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.location_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
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
                <TextField fullWidth size="small" label="Year of Purchase" type="number" placeholder="e.g. 2026" inputProps={{ min: "1900", max: new Date().getFullYear(), step: "1" }} value={editForm.year_of_purchase || ''} onChange={e => { if (e.target.value.length <= 4) setEditForm({ ...editForm, year_of_purchase: e.target.value === '' ? null : parseInt(e.target.value) }); }} error={editForm.year_of_purchase > new Date().getFullYear()} helperText={editForm.year_of_purchase > new Date().getFullYear() ? "Cannot be a future year" : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={purchaseOrders}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.po_number || ''}
                  value={purchaseOrders.find(p => p.id === editForm.po_id) || editForm.po_number || null}
                  onChange={(e, newValue) => {
                    if (typeof newValue === 'string') {
                      setEditForm({ ...editForm, po_number: newValue, po_id: null, po_date: '' });
                    } else {
                      handlePOSelection(newValue, true);
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="PO Number" />}
                />
              </Grid>
              {editForm.po_number && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="PO Date *"
                    format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }}
                    value={editForm.po_date ? dayjs(editForm.po_date) : null}
                    onChange={(newValue) => setEditForm({ ...editForm, po_date: newValue ? newValue.format('YYYY-MM-DD') : '' })}
                    slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" label="Procurement Type" value={editForm.procurement_type || 'Purchase'} onChange={e => setEditForm({ ...editForm, procurement_type: e.target.value })}>
                  <MenuItem value="Purchase">Purchase</MenuItem>
                  <MenuItem value="Rental">Rental</MenuItem>
                  <MenuItem value="Lease">Lease</MenuItem>
                  <MenuItem value="Reagent Tie-up">Reagent Tie-up</MenuItem>
                </TextField>
              </Grid>
              {editForm.procurement_type && editForm.procurement_type !== 'Purchase' && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" color="primary">Rental Details</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Rental Agreement Number" value={editForm.rental_agreement_number || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Rental Model" value={editForm.rental_type || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker label="Rental Start Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} readOnly slotProps={{ textField: { size: 'small', fullWidth: true } }} value={editForm.rental_start_date ? dayjs(editForm.rental_start_date) : null} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DatePicker label="Rental End Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} readOnly slotProps={{ textField: { size: 'small', fullWidth: true } }} value={editForm.rental_end_date ? dayjs(editForm.rental_end_date) : null} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Billing Frequency" value={editForm.billing_frequency || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="Cost per Test" value={editForm.cost_per_test || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" type="number" label="Rental Cost" value={editForm.rental_cost || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                </>
              )}

              {(editForm.rental_type === 'Reagent Rental' || editForm.procurement_type === 'Reagent Tie-up') && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Reagents Required</Typography>
                    <Button variant="contained" size="small" color="secondary" onClick={handleCreateReagentPO} disabled={!editForm.linked_reagents?.length}>
                      Create PO
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {(!editForm.linked_reagents || editForm.linked_reagents.length === 0) ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>No reagents added yet</Typography>
                    ) : (
                      editForm.linked_reagents.map((item, i) => {
                        const mat = materials.find(m => m.id === item.material_id);
                        return (
                          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 1.5, p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc', position: 'relative' }}>
                            <Box>
                              <Autocomplete
                                options={materials.filter(m => m.is_active || m.id === item.material_id)}
                                getOptionLabel={(option) => `${option.code} - ${option.name}`}
                                value={materials.find(m => m.id === item.material_id) || null}
                                onChange={(e, newValue) => {
                                  const mId = newValue ? newValue.id : '';
                                  handleUpdateReagent(i, 'material_id', mId);
                                }}
                                renderInput={(params) => <TextField {...params} label="Material *" size="small" />}
                                fullWidth
                                size="small"
                                disableClearable
                              />
                            </Box>
                            <TextField size="small" label="Unit" value={mat?.uom_name || '-'} InputProps={{ readOnly: true }} />
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <TextField
                                disabled={!item.material_id}
                                size="small"
                                label="Qty"
                                type="number"
                                value={item.quantity}
                                onKeyDown={e => {
                                  const blockList = ['-', '+', 'e', 'E'];
                                  if (!mat?.uom_allow_decimal) blockList.push('.');
                                  if (blockList.includes(e.key)) e.preventDefault();
                                }}
                                onChange={e => {
                                  let val = e.target.value.replace(/-/g, '');
                                  if (!mat?.uom_allow_decimal) val = val.replace(/\./g, '');
                                  handleUpdateReagent(i, 'quantity', val);
                                }}
                                inputProps={{ min: 0, step: mat?.uom_allow_decimal ? "any" : "1" }}
                                fullWidth
                              />
                              <IconButton size="small" color="error" onClick={() => handleRemoveReagent(i)} sx={{ mt: 0.5 }}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={handleAddReagent}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderStyle: 'dashed',
                        width: '100%',
                        py: 1.5,
                        color: '#2563EB',
                        fontSize: '0.95rem',
                        borderColor: '#cbd5e1',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                      }}
                    >
                      Add Another Item
                    </Button>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!editForm.warranty_available} onChange={e => setEditForm({ ...editForm, warranty_available: e.target.checked })} />}
                  label="Warranty Available"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker label="Warranty Expiry Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} value={editForm.warranty_expiry_date ? dayjs(editForm.warranty_expiry_date) : null} onChange={(newValue) => setEditForm({ ...editForm, warranty_expiry_date: newValue ? newValue.format('YYYY-MM-DD') : null })} disabled={!editForm.warranty_available} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
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
                <DatePicker label="AMC/CMC End Date" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} value={editForm.amc_cmc_end_date ? dayjs(editForm.amc_cmc_end_date) : null} onChange={(newValue) => setEditForm({ ...editForm, amc_cmc_end_date: newValue ? newValue.format('YYYY-MM-DD') : null })} disabled={!editForm.amc_cmc_status || editForm.amc_cmc_status === 'None'} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
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
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch size="small" checked={!!editForm.requires_installation} onChange={e => setEditForm({ ...editForm, requires_installation: e.target.checked })} />}
                  label="Requires Installation"
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
          <Button onClick={handleEditSubmit} variant="contained" color="primary" disabled={editSubmitting || (editForm.year_of_purchase > new Date().getFullYear())}>
            {editSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Install Equipment Dialog */}
      <Dialog open={!!installDialog} onClose={() => setInstallDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Complete Installation: {installDialog?.equipment_code}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth size="small" label="Serial Number" value={installForm.serial_number || ''} onChange={e => setInstallForm({ ...installForm, serial_number: e.target.value })} required />
            <DatePicker label="Installation Date *" format="DD-MMM-YYYY" localeText={{ fieldYearPlaceholder: () => 'YYYY', fieldMonthPlaceholder: () => 'MMM', fieldDayPlaceholder: () => 'DD' }} value={installForm.installation_date ? dayjs(installForm.installation_date) : null} onChange={(newValue) => setInstallForm({ ...installForm, installation_date: newValue ? newValue.format('YYYY-MM-DD') : '' })} slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }} />
            <TextField fullWidth size="small" label="Installed By *" value={installForm.installed_by || ''} onChange={e => setInstallForm({ ...installForm, installed_by: e.target.value })} required />
            <TextField fullWidth size="small" label="Contact Number *" value={installForm.contact_number || ''} onChange={e => setInstallForm({ ...installForm, contact_number: e.target.value })} required />
            <Autocomplete
              size="small"
              options={locations}
              getOptionLabel={(option) => option.location_name}
              value={locations.find(l => l.id === installForm.location_id) || null}
              onChange={(e, newValue) => setInstallForm({ ...installForm, location_id: newValue ? newValue.id : '' })}
              renderInput={(params) => <TextField {...params} label="Location/Department *" required />}
              fullWidth
            />
            <TextField fullWidth size="small" multiline rows={2} label="Installation Remarks" value={installForm.installation_remarks || ''} onChange={e => setInstallForm({ ...installForm, installation_remarks: e.target.value })} />

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary">Upload Documents (Optional)</Typography>

            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Installation Report (PDF/Image)</Typography>
              <TextField type="file" size="small" fullWidth inputProps={{ accept: '.pdf,image/*' }} onChange={e => setInstallFiles({ ...installFiles, file: e.target.files[0] })} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Equipment Photo</Typography>
              <TextField type="file" size="small" fullWidth inputProps={{ accept: 'image/*' }} onChange={e => setInstallFiles({ ...installFiles, equipment_photo: e.target.files[0] })} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Serial Number Photo</Typography>
              <TextField type="file" size="small" fullWidth inputProps={{ accept: 'image/*' }} onChange={e => setInstallFiles({ ...installFiles, serial_number_photo: e.target.files[0] })} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInstallDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleInstallSubmit} variant="contained" color="secondary" disabled={installSubmitting}>
            {installSubmitting ? 'Saving...' : 'Complete Installation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Documents Dialog */}
      <Dialog open={!!uploadDocsDialog} onClose={() => setUploadDocsDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1E293B' }}>Upload Documents: {uploadDocsDialog?.equipment_code}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Alert severity="info" sx={{ mb: 1 }}>Upload missing installation reports or photos for this equipment.</Alert>

            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Installation Report (PDF/Image)</Typography>
              <TextField type="file" size="small" fullWidth inputProps={{ accept: '.pdf,image/*' }} onChange={e => setUploadDocsFiles({ ...uploadDocsFiles, file: e.target.files[0] })} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Equipment Photo</Typography>
              <TextField type="file" size="small" fullWidth inputProps={{ accept: 'image/*' }} onChange={e => setUploadDocsFiles({ ...uploadDocsFiles, equipment_photo: e.target.files[0] })} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Serial Number Photo</Typography>
              <TextField type="file" size="small" fullWidth inputProps={{ accept: 'image/*' }} onChange={e => setUploadDocsFiles({ ...uploadDocsFiles, serial_number_photo: e.target.files[0] })} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUploadDocsDialog(null)} color="inherit">Cancel</Button>
          <Button onClick={handleUploadDocsSubmit} variant="contained" color="primary" disabled={uploadDocsSubmitting}>
            {uploadDocsSubmitting ? 'Uploading...' : 'Upload Documents'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
