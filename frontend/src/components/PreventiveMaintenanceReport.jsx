import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

const PMCheckbox = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25, px: 0.5 }}>
      <Typography variant="body2" sx={{ fontSize: '12px' }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Box sx={{ 
          width: 16, height: 16, border: '1px solid black', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 'bold'
        }}>
          {value === 'Pass' ? '✓' : ''}
        </Box>
        <Box sx={{ 
          width: 16, height: 16, border: '1px solid black', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 'bold'
        }}>
          {value === 'Fail' ? '✓' : ''}
        </Box>
        <Box sx={{ 
          width: 16, height: 16, border: '1px solid black', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 'bold'
        }}>
          {value === 'NA' ? '✓' : ''}
        </Box>
      </Box>
    </Box>
  );
};

const CheckboxHeader = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, px: 0.5 }}>
    <Box></Box>
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Typography variant="caption" sx={{ width: 16, textAlign: 'center', fontSize: '10px', lineHeight: 1 }}>PASS</Typography>
      <Typography variant="caption" sx={{ width: 16, textAlign: 'center', fontSize: '10px', lineHeight: 1 }}>FAIL</Typography>
      <Typography variant="caption" sx={{ width: 16, textAlign: 'center', fontSize: '10px', lineHeight: 1 }}>NA</Typography>
    </Box>
  </Box>
);

export default function PreventiveMaintenanceReport({ complaint, pmChecklistData = {}, materialIssues = [] }) {
  const tableBorder = '1px solid black';

  return (
    <Box sx={{ p: 2, bgcolor: 'white', color: 'black', fontFamily: 'Arial, sans-serif', width: '100%', margin: 'auto', '@media print': { p: 0 } }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: sans-serif; -webkit-print-color-adjust: exact; }
          body, html, #root, main, .MuiBox-root { overflow: visible !important; height: auto !important; }
          .MuiDialog-root, .MuiBackdrop-root, .MuiPopover-root, .chatbot-widget-container { display: none !important; }
        `}
      </style>
      <Paper elevation={0} sx={{ border: tableBorder, borderRadius: 0, p: 0 }}>
        {/* Header */}
        <Box sx={{ borderBottom: tableBorder, p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <img src="/logo.png" alt="East Point Logo" style={{ height: '60px', objectFit: 'contain', filter: 'grayscale(100%) contrast(500%)' }} />
            <Box textAlign="left">
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                EAST POINT HOSPITAL
              </Typography>
              <Typography variant="body2">
                Bidarahalli, Virgonagar Post, Bangalore - 560 049
              </Typography>
            </Box>
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            DEPARTMENT OF BIOMEDICAL ENGINEERING
          </Typography>
        </Box>
        <Box sx={{ borderBottom: tableBorder, p: 0.5, textAlign: 'center', bgcolor: '#f0f0f0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>PREVENTIVE MAINTENANCE CHECKLIST FOR MEDICAL EQUIPMENT</Typography>
        </Box>

        {/* Details Section */}
        <Box sx={{ p: 1.5, borderBottom: tableBorder }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 2, fontSize: '12px' }}>DESCRIPTION</Typography>
            <Typography sx={{ borderBottom: '1px solid black', flexGrow: 1, maxWidth: '500px', fontSize: '12px', textAlign: 'center' }}>
               {pmChecklistData.description || complaint.equipment_name || complaint.equipment?.name || ''}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>ASSET NO:</Typography>
                <Typography sx={{ border: '1px solid black', px: 0.5, flexGrow: 1, fontSize: '12px', minHeight: '18px', display: 'flex', alignItems: 'center' }}>{complaint.equipment_code}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>MODEL:</Typography>
                <Typography sx={{ border: '1px solid black', px: 0.5, flexGrow: 1, fontSize: '12px', minHeight: '18px', display: 'flex', alignItems: 'center' }}>{complaint.equipment_model || complaint.equipment?.model || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>SR NO:</Typography>
                <Typography sx={{ border: '1px solid black', px: 0.5, flexGrow: 1, fontSize: '12px', minHeight: '18px', display: 'flex', alignItems: 'center' }}>{complaint.equipment_serial_number || complaint.equipment?.serial_number || ''}</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>MAKE:</Typography>
                <Typography sx={{ border: '1px solid black', px: 0.5, flexGrow: 1, fontSize: '12px', minHeight: '18px', display: 'flex', alignItems: 'center' }}>{complaint.equipment_make || complaint.equipment?.make || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>DEPT:</Typography>
                <Typography sx={{ border: '1px solid black', px: 0.5, flexGrow: 1, fontSize: '12px', minHeight: '18px', display: 'flex', alignItems: 'center' }}>{complaint.department_name || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>LOCATION:</Typography>
                <Typography sx={{ border: '1px solid black', px: 0.5, flexGrow: 1, fontSize: '12px', minHeight: '18px', display: 'flex', alignItems: 'center' }}>{complaint.location || complaint.room_name || ''}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Section 1 */}
        {/* Section 1 */}
        <Box sx={{ p: 1, borderBottom: tableBorder }}>
           <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '11px' }}>GENERAL MAINTENANCE</Typography>
           <Box sx={{ display: 'flex' }}>
             <Box sx={{ flex: 1, pr: 1 }}>
               <CheckboxHeader />
               <PMCheckbox label="1) INTERNAL CLEANING" value={pmChecklistData.internal_cleaning} />
               <PMCheckbox label="2) EXTERNAL CLEANING" value={pmChecklistData.external_cleaning} />
             </Box>
             <Box sx={{ flex: 1, px: 1, borderLeft: '1px dashed #ccc' }}>
               <CheckboxHeader />
               <PMCheckbox label="3) SAFETY TEST" value={pmChecklistData.general_safety_test} />
               <PMCheckbox label="4) LUBRICATING" value={pmChecklistData.lubricating} />
             </Box>
             <Box sx={{ flex: 1, pl: 1, borderLeft: '1px dashed #ccc' }}>
               <CheckboxHeader />
               <PMCheckbox label="5) CALIBRATION TEST" value={pmChecklistData.calibration_test} />
               <PMCheckbox label="6) REPLACED" value={pmChecklistData.replaced} />
               <Typography variant="caption" sx={{ pl: 1, fontSize: '9px', lineHeight: 1, display: 'block' }}>if replaced, mention in spare utilized column</Typography>
             </Box>
           </Box>
        </Box>

        {/* Section 2 */}
        {/* Section 2 */}
        <Box sx={{ p: 1, borderBottom: tableBorder }}>
           <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '11px' }}>COMPONENT INSPECTION</Typography>
           <Box sx={{ display: 'flex' }}>
             <Box sx={{ flex: 1, pr: 1 }}>
               <CheckboxHeader />
               <PMCheckbox label="1) FILTERS" value={pmChecklistData.filters} />
               <PMCheckbox label="2) HOSE/TUBE LEAKAGE" value={pmChecklistData.hose_tube_leakage} />
               <PMCheckbox label="3) CABLES" value={pmChecklistData.cables} />
               <PMCheckbox label="4) CONNECTORS" value={pmChecklistData.connectors} />
               <PMCheckbox label="5) MOTOR/FAN/PUMP" value={pmChecklistData.motor_fan_pump} />
               <PMCheckbox label="6) LAMP/LIGHT/BULB" value={pmChecklistData.lamp_light_bulb} />
               <PMCheckbox label="7) KEYPAD/SWITCHES" value={pmChecklistData.keypad_switches} />
             </Box>
             <Box sx={{ flex: 1, px: 1, borderLeft: '1px dashed #ccc' }}>
               <CheckboxHeader />
               <PMCheckbox label="8) EXPIRATORY VALVE" value={pmChecklistData.expiratory_valve} />
               <PMCheckbox label="9) WATER TRAP" value={pmChecklistData.water_trap} />
               <PMCheckbox label="10) ALARM" value={pmChecklistData.alarm} />
               <PMCheckbox label="11) AUDIO ABLE SIGNAL" value={pmChecklistData.audio_able_signal} />
               <PMCheckbox label="12) DISPLAY" value={pmChecklistData.display} />
               <PMCheckbox label="13) ELECTRODES" value={pmChecklistData.electrodes} />
             </Box>
             <Box sx={{ flex: 1, pl: 1, borderLeft: '1px dashed #ccc' }}>
               <CheckboxHeader />
               <PMCheckbox label="14) TRANSDUCERS" value={pmChecklistData.transducers} />
               <PMCheckbox label="15) POWER SUPPLY" value={pmChecklistData.power_supply} />
               <PMCheckbox label="16) ELECTRONIC BOARD" value={pmChecklistData.electronic_board} />
               <PMCheckbox label="17) FUSE" value={pmChecklistData.fuse} />
               <PMCheckbox label="18) COMPRESSOR" value={pmChecklistData.compressor} />
               <PMCheckbox label="19) OTHER" value={pmChecklistData.other_part} />
             </Box>
           </Box>
        </Box>

        {/* Section 3: Safety Test */}
        <Box sx={{ p: 1, borderBottom: tableBorder }}>
           <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '11px' }}>SAFETY TEST</Typography>
           <Box sx={{ display: 'flex' }}>
              <Box sx={{ flex: 1, pr: 1 }}>
                <CheckboxHeader />
                <PMCheckbox label="1) ELECTRICAL" value={pmChecklistData.electrical} />
                <PMCheckbox label="2) POWER CORD" value={pmChecklistData.power_cord} />
                <PMCheckbox label="3) PLUG TOP" value={pmChecklistData.plug_top} />
              </Box>
              <Box sx={{ flex: 1, px: 1, borderLeft: '1px dashed #ccc' }}>
                <CheckboxHeader />
                <PMCheckbox label="4) LEAKAGE CURRENT" value={pmChecklistData.leakage_current} />
                <PMCheckbox label="5) GROUNDING/EARTHLING" value={pmChecklistData.grounding_earthling} />
                <PMCheckbox label="6) WHEEL MOVEMENT" value={pmChecklistData.wheel_movement} />
              </Box>
              <Box sx={{ flex: 1, pl: 1, borderLeft: '1px dashed #ccc' }}>
                <CheckboxHeader />
                <PMCheckbox label="7) BALANCE" value={pmChecklistData.balance} />
                <PMCheckbox label="8) BATTERY" value={pmChecklistData.battery} />
                <PMCheckbox label="9) OTHER" value={pmChecklistData.other_safety} />
              </Box>
           </Box>
        </Box>
        
        {/* Footer Info */}
        <Box sx={{ borderBottom: tableBorder, display: 'flex', flexDirection: 'column' }}>
           
           {/* Top Half of Footer */}
           <Box sx={{ display: 'flex', borderBottom: tableBorder }}>
             
             {/* Left Column */}
             <Box sx={{ flex: 1, borderRight: tableBorder, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', borderBottom: tableBorder, flex: 1 }}>
                   <Box sx={{ width: '150px', p: 0.5, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>PM START DATE/TIME</Typography>
                   </Box>
                   <Box sx={{ borderLeft: tableBorder, flexGrow: 1, p: 0.5, display: 'flex', alignItems: 'center' }}>
                     <Typography variant="body2" sx={{ fontSize: '10px' }}>{pmChecklistData.pm_start_date_time ? dayjs(pmChecklistData.pm_start_date_time).format('DD-MMM-YYYY hh:mm A') : ''}</Typography>
                   </Box>
                </Box>
                <Box sx={{ display: 'flex', flex: 1 }}>
                   <Box sx={{ width: '150px', p: 0.5, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>PM COMPLETED BY<br/>NAME/SIGN</Typography>
                   </Box>
                   <Box sx={{ borderLeft: tableBorder, flexGrow: 1, minHeight: '40px' }}></Box>
                </Box>
             </Box>
             
             {/* Right Column */}
             <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                
                {/* W.O Detail & Dates Block */}
                <Box sx={{ display: 'flex', borderBottom: tableBorder, flexGrow: 1 }}>
                   {/* Left side: W.O. Detail */}
                   <Box sx={{ flex: 1, borderRight: tableBorder, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ p: 0.5, borderBottom: tableBorder }}>
                         <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>W.O. DETAIL</Typography>
                      </Box>
                      <Box sx={{ flexGrow: 1, p: 0.5, display: 'flex', alignItems: 'center' }}>
                         <Typography variant="body2" sx={{ fontSize: '10px', wordBreak: 'break-all' }}>{complaint.docket_no || ''}</Typography>
                      </Box>
                   </Box>
                   {/* Right side: Dates */}
                   <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ flex: 1, display: 'flex', borderBottom: tableBorder }}>
                         <Box sx={{ width: '130px', p: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>PM COMPLETED DATE/TIME</Typography>
                         </Box>
                         <Box sx={{ borderLeft: tableBorder, flexGrow: 1, p: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '10px' }}>{pmChecklistData.pm_completed_date ? dayjs(pmChecklistData.pm_completed_date).format('DD-MMM-YYYY hh:mm A') : ''}</Typography>
                         </Box>
                      </Box>
                      <Box sx={{ flex: 1, display: 'flex' }}>
                         <Box sx={{ width: '130px', p: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>NEXT PM DUE ON</Typography>
                         </Box>
                         <Box sx={{ borderLeft: tableBorder, flexGrow: 1, p: 0.5, display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontSize: '10px' }}>{pmChecklistData.next_pm_due_on ? dayjs(pmChecklistData.next_pm_due_on).format('DD-MMM-YYYY') : ''}</Typography>
                         </Box>
                      </Box>
                   </Box>
                </Box>
                
                {/* Biomedical Name/Sign */}
                <Box sx={{ display: 'flex', flex: 1 }}>
                   <Box sx={{ width: '160px', p: 0.5, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>BIOMEDICAL NAME/SIGN</Typography>
                   </Box>
                   <Box sx={{ borderLeft: tableBorder, flexGrow: 1, minHeight: '40px' }}></Box>
                </Box>
             </Box>
           </Box>
           
           {/* Bottom Half of Footer */}
           <Box sx={{ display: 'flex' }}>
             
             {/* Bottom Left */}
             <Box sx={{ flex: 1, borderRight: tableBorder, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', borderBottom: tableBorder, flex: 1 }}>
                   <Box sx={{ width: '80px', p: 0.5, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>STATUS</Typography>
                   </Box>
                   <Box sx={{ borderLeft: tableBorder, flexGrow: 1, p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Typography variant="body2" sx={{ fontSize: '10px', textAlign: 'center' }}>{pmChecklistData.status || 'COMPLETED/PENDING/PREPOND/POSTPONED'}</Typography>
                   </Box>
                </Box>
                <Box sx={{ display: 'flex', flex: 1 }}>
                   <Box sx={{ flexGrow: 1, p: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Typography variant="body2" sx={{ fontSize: '10px', textAlign: 'center' }}>{pmChecklistData.accepted_for_use === 'Yes' ? 'ACCEPTED FOR USE' : (pmChecklistData.accepted_for_use === 'No' ? 'NOT ACCEPTED FOR USE' : 'ACCEPTED FOR USE/ NOT ACCEPTED FOR USE')}</Typography>
                   </Box>
                </Box>
             </Box>
             
             {/* Bottom Right (Accepted By Name/Sign) */}
             <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column', p: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '10px', fontWeight: 'bold' }}>ACCEPTED BY NAME/SIGN</Typography>
                <Box sx={{ flexGrow: 1, minHeight: '40px' }}></Box>
             </Box>
             
           </Box>
        </Box>

        {/* Spares Utilized */}
        <Box>
           <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', p: 0.5 }}>
              SPARE UTILIZED
           </Typography>
           <Table size="small" sx={{ '& th, & td': { border: tableBorder, p: 0.25, fontSize: '10px', textAlign: 'center' }, '& th:first-of-type, & td:first-of-type': { borderLeft: 0 }, '& th:last-child, & td:last-child': { borderRight: 0 }, '& th': { borderTop: tableBorder } }}>
             <TableHead>
               <TableRow>
                 <TableCell sx={{ width: '15%', fontWeight: 'bold' }}>PART NO</TableCell>
                 <TableCell sx={{ width: '30%', fontWeight: 'bold' }}>DESCRIPTION</TableCell>
                 <TableCell sx={{ width: '10%', fontWeight: 'bold' }}>QTY</TableCell>
                 <TableCell sx={{ width: '25%', fontWeight: 'bold' }}>SOURCE</TableCell>
                 <TableCell sx={{ width: '20%', fontWeight: 'bold' }}>REMARK</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {(() => {
                 const issuedItems = materialIssues.reduce((acc, issue) => {
                   if (issue.items) {
                     acc.push(...issue.items);
                   }
                   return acc;
                 }, []);

                 const systemSpares = issuedItems.map(item => ({
                   part_no: item.material_code || item.item_code || '',
                   description: item.material_name || item.name || '',
                   qty: item.quantity || item.qty || '',
                   source: 'Store',
                   remark: ''
                 }));
                 const manualSpares = (pmChecklistData.spares_utilized || []).filter(s => s.part_no || s.description);
                 const combinedSpares = [...systemSpares, ...manualSpares];
                 const overallRemark = pmChecklistData.spares_utilized?.[0]?.remark || '';

                 if (materialIssues.length > 0 && combinedSpares.length === 0) {
                     console.error("MATERIAL ISSUES EXIST BUT PARSED EMPTY!", materialIssues, issuedItems);
                 }

                 return (
                   <>
                     {combinedSpares.map((spare, idx) => (
                       <TableRow key={idx}>
                         <TableCell sx={{ minHeight: '24px' }}>{spare.part_no || '\u00A0'}</TableCell>
                         <TableCell>{spare.description || '\u00A0'}</TableCell>
                         <TableCell>{spare.qty || '\u00A0'}</TableCell>
                         <TableCell>{spare.source || '\u00A0'}</TableCell>
                         {idx === 0 ? (
                           <TableCell rowSpan={Math.max(2, combinedSpares.length)} sx={{ borderLeft: `${tableBorder} !important`, borderBottom: '0 !important' }}>{overallRemark || '\u00A0'}</TableCell>
                         ) : null}
                       </TableRow>
                     ))}
                     {/* Pad to at least 2 rows */}
                     {combinedSpares.length < 2 && 
                       Array.from({ length: 2 - combinedSpares.length }).map((_, idx) => {
                         const absoluteIdx = combinedSpares.length + idx;
                         return (
                           <TableRow key={`empty-${idx}`}>
                             <TableCell sx={{ minHeight: '24px' }}>&nbsp;</TableCell>
                             <TableCell>&nbsp;</TableCell>
                             <TableCell>&nbsp;</TableCell>
                             <TableCell>&nbsp;</TableCell>
                             {absoluteIdx === 0 ? <TableCell rowSpan={2} sx={{ borderLeft: `${tableBorder} !important`, borderBottom: '0 !important' }}>{overallRemark || '\u00A0'}</TableCell> : null}
                           </TableRow>
                         );
                       })
                     }
                   </>
                 );
               })()}
             </TableBody>
           </Table>
        </Box>

      </Paper>
    </Box>
  );
}
