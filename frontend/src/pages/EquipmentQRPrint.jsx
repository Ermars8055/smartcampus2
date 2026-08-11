import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Radio, RadioGroup, FormControlLabel, Autocomplete, TextField, Paper, CircularProgress, IconButton, Checkbox } from '@mui/material';
import { Print, ArrowBack, CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { renderToString } from 'react-dom/server';
import { useMessage } from '../context/MessageContext';

export default function EquipmentQRPrint() {
  const navigate = useNavigate();
  const [printMode, setPrintMode] = useState('all');
  const [equipments, setEquipments] = useState([]);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { showMessage } = useMessage();

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/equipment');
      setEquipments(res.data);
    } catch (err) {
      showMessage('Failed to load equipment list', 'Error', 'error');
    }
    setLoading(false);
  };

  const handlePrint = async () => {
    if (printMode === 'selective' && selectedEquipments.length === 0) {
      showMessage('Please select at least one equipment to print.', 'Warning', 'warning');
      return;
    }

    setPrinting(true);
    try {
      const payload = {
        is_all: printMode === 'all',
        equipment_ids: printMode === 'all' ? [] : selectedEquipments.map(e => e.id)
      };

      const res = await api.post('/api/equipment/qr/bulk', payload);
      const qrDataList = res.data;

      if (!qrDataList || qrDataList.length === 0) {
        showMessage('No equipment found to print.', 'Info', 'info');
        setPrinting(false);
        return;
      }

      openPrintWindow(qrDataList);
    } catch (err) {
      showMessage('Failed to generate QR codes.', 'Error', 'error');
    }
    setPrinting(false);
  };

  const openPrintWindow = (dataList) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    let labelsHtml = '';

    for (const qrData of dataList) {
      const svgString = renderToString(
        <QRCodeSVG
          value={`${window.location.origin}/equipment/${qrData.asset_id}`}
          size={200}
          level="M"
        />
      );

      labelsHtml += `
        <div class="label-container">
          <div class="header">
            <span class="equipment-name">${qrData.equipment_name || 'Equipment'}</span>
            <span class="hospital-name">${qrData.institution_name || 'Hospital'}</span>
          </div>
          <div class="content">
            <div class="qr-col">
              ${svgString}
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
          <title>Print Bulk QR Labels</title>
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
    }, 500);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/equipment')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Bulk Print Equipment QR Codes
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
          Select Print Mode
        </Typography>
        
        <RadioGroup
          row
          value={printMode}
          onChange={(e) => setPrintMode(e.target.value)}
          sx={{ mb: 4 }}
        >
          <FormControlLabel value="all" control={<Radio />} label="All Equipment" />
          <FormControlLabel value="selective" control={<Radio />} label="Selective Equipment" />
        </RadioGroup>

        {printMode === 'selective' && (
          <Box sx={{ mb: 4 }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={equipments}
              getOptionLabel={(option) => `${option.equipment_code} - ${option.material_name || 'Unknown'}`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedEquipments}
              onChange={(e, newValue) => setSelectedEquipments(newValue)}
              loading={loading}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox
                      icon={<CheckBoxOutlineBlank fontSize="small" />}
                      checkedIcon={<CheckBox fontSize="small" />}
                      style={{ marginRight: 8 }}
                      checked={selected}
                    />
                    {option.equipment_code} - {option.material_name || 'Unknown'}
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search & Select Equipment"
                  placeholder="Type code or name..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={printing ? <CircularProgress size={20} color="inherit" /> : <Print />}
          onClick={handlePrint}
          disabled={printing || (printMode === 'selective' && selectedEquipments.length === 0)}
          sx={{ mt: 2 }}
        >
          {printing ? 'Generating...' : printMode === 'all' ? 'Print All QR Codes' : `Print ${selectedEquipments.length} Selected QR Codes`}
        </Button>
      </Paper>
    </Box>
  );
}
