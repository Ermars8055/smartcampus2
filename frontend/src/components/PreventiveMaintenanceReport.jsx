import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

const PMCheckbox = ({ label, value }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, px: 1 }}>
      <Typography variant="body2" sx={{ fontSize: '12px' }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ 
          width: 16, height: 16, border: '1px solid black', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 'bold'
        }}>
          {value === 'Pass' ? '✓' : ''}
        </Box>
        <Box sx={{ 
          width: 16, height: 16, border: '1px solid black', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 'bold'
        }}>
          {value === 'Fail' ? '✓' : ''}
        </Box>
        <Box sx={{ 
          width: 16, height: 16, border: '1px solid black', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 'bold'
        }}>
          {value === 'NA' ? '✓' : ''}
        </Box>
      </Box>
    </Box>
  );
};

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
        <Box sx={{ borderBottom: tableBorder, p: 2, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>EAST POINT HOSPITAL</Typography>
          <Typography variant="body2">Bidarahalli, Virgonagar Post, Bangalore - 560 049</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>DEPARTMENT OF BIOMEDICAL ENGINEERING</Typography>
        </Box>
        <Box sx={{ borderBottom: tableBorder, p: 0.5, textAlign: 'center', bgcolor: '#f0f0f0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>PREVENTIVE MAINTENANCE CHECKLIST FOR MEDICAL EQUIPMENT</Typography>
        </Box>

        {/* Details Section */}
        <Box sx={{ p: 2, borderBottom: tableBorder }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 2, width: '120px' }}>DESCRIPTION</Typography>
            <Box sx={{ border: '1px solid black', p: 0.5, flexGrow: 1, maxWidth: '500px', minHeight: '28px', fontSize: '12px' }}>
               {pmChecklistData.description || complaint.equipment?.name || ''}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px' }}>ASSET NO</Typography>
                <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, minHeight: '24px', fontSize: '12px' }}>{complaint.equipment_code}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px' }}>MODEL</Typography>
                <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, minHeight: '24px', fontSize: '12px' }}>{complaint.equipment?.model || ''}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px' }}>SR NO.</Typography>
                <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, minHeight: '24px', fontSize: '12px' }}>{complaint.equipment?.serial_number || ''}</Box>
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px' }}>MAKE</Typography>
                <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, minHeight: '24px', fontSize: '12px' }}>{complaint.equipment?.make || ''}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px' }}>DEPT</Typography>
                <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, minHeight: '24px', fontSize: '12px' }}>{complaint.department_name || ''}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ width: '80px', fontSize: '12px' }}>LOCATION</Typography>
                <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, minHeight: '24px', fontSize: '12px' }}>{complaint.location || complaint.room_name || ''}</Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Section 1 */}
        <Box sx={{ p: 2, borderBottom: tableBorder, display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 1, mb: 1 }}>
               <Typography variant="caption" sx={{ width: '16px', textAlign: 'center', fontSize: '10px' }}>PASS</Typography>
               <Typography variant="caption" sx={{ width: '16px', textAlign: 'center', fontSize: '10px' }}>FAIL</Typography>
               <Typography variant="caption" sx={{ width: '16px', textAlign: 'center', fontSize: '10px' }}>NA</Typography>
            </Box>
            <PMCheckbox label="1) INTERNAL CLEANING" value={pmChecklistData.internal_cleaning} />
            <PMCheckbox label="2) EXTERNAL CLEANING" value={pmChecklistData.external_cleaning} />
            <PMCheckbox label="3) SAFETY TEST" value={pmChecklistData.general_safety_test} />
          </Box>
          <Box sx={{ flex: 1, pl: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 1, mb: 1 }}>
               <Typography variant="caption" sx={{ width: '16px', textAlign: 'center', fontSize: '10px' }}>PASS</Typography>
               <Typography variant="caption" sx={{ width: '16px', textAlign: 'center', fontSize: '10px' }}>FAIL</Typography>
               <Typography variant="caption" sx={{ width: '16px', textAlign: 'center', fontSize: '10px' }}>NA</Typography>
            </Box>
            <PMCheckbox label="4) LUBRICATING" value={pmChecklistData.lubricating} />
            <PMCheckbox label="5) CALIBRATION TEST" value={pmChecklistData.calibration_test} />
            <PMCheckbox label="6) REPLACED" value={pmChecklistData.replaced} />
            <Typography variant="caption" sx={{ pl: 2, fontSize: '10px' }}>if replaced, mention in spare utilized column</Typography>
          </Box>
        </Box>

        {/* Section 2 */}
        <Box sx={{ p: 2, borderBottom: tableBorder, display: 'flex' }}>
          <Box sx={{ flex: 1 }}>
            <PMCheckbox label="1) FILTERS" value={pmChecklistData.filters} />
            <PMCheckbox label="2) HOSE/TUBE LEAKAGE" value={pmChecklistData.hose_tube_leakage} />
            <PMCheckbox label="3) CABLES" value={pmChecklistData.cables} />
            <PMCheckbox label="4) CONNECTORS" value={pmChecklistData.connectors} />
            <PMCheckbox label="5) MOTOR/FAN/PUMP" value={pmChecklistData.motor_fan_pump} />
            <PMCheckbox label="6) LAMP/LIGHT/BULB" value={pmChecklistData.lamp_light_bulb} />
            <PMCheckbox label="7) KEYPAD/SWITCHES" value={pmChecklistData.keypad_switches} />
            <PMCheckbox label="8) EXPIRATORY VALVE" value={pmChecklistData.expiratory_valve} />
            <PMCheckbox label="9) WATER TRAP" value={pmChecklistData.water_trap} />
          </Box>
          <Box sx={{ flex: 1, pl: 2 }}>
            <PMCheckbox label="10) ALARM" value={pmChecklistData.alarm} />
            <PMCheckbox label="11) AUDIO ABLE SIGNAL" value={pmChecklistData.audio_able_signal} />
            <PMCheckbox label="12) DISPLAY" value={pmChecklistData.display} />
            <PMCheckbox label="13) ELECTRODES" value={pmChecklistData.electrodes} />
            <PMCheckbox label="14) TRANSDUCERS" value={pmChecklistData.transducers} />
            <PMCheckbox label="15) POWER SUPPLY" value={pmChecklistData.power_supply} />
            <PMCheckbox label="16) ELECTRONIC BOARD" value={pmChecklistData.electronic_board} />
            <PMCheckbox label="17) FUSE" value={pmChecklistData.fuse} />
            <PMCheckbox label="18) COMPRESSOR" value={pmChecklistData.compressor} />
            <PMCheckbox label="19) OTHER" value={pmChecklistData.other_part} />
          </Box>
        </Box>

        {/* Section 3: Safety Test */}
        <Box sx={{ p: 2 }}>
           <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, fontSize: '12px' }}>SAFETY TEST</Typography>
           <Box sx={{ display: 'flex' }}>
              <Box sx={{ flex: 1 }}>
                <PMCheckbox label="1) ELECTRICAL" value={pmChecklistData.electrical} />
                <PMCheckbox label="2) POWER CORD" value={pmChecklistData.power_cord} />
                <PMCheckbox label="3) PLUG TOP" value={pmChecklistData.plug_top} />
                <PMCheckbox label="4) LEAKAGE CURRENT" value={pmChecklistData.leakage_current} />
                <PMCheckbox label="5) GROUNDING/EARTHLING" value={pmChecklistData.grounding_earthling} />
              </Box>
              <Box sx={{ flex: 1, pl: 2 }}>
                <PMCheckbox label="6) WHEEL MOVEMENT" value={pmChecklistData.wheel_movement} />
                <PMCheckbox label="7) BALANCE" value={pmChecklistData.balance} />
                <PMCheckbox label="8) BATTERY" value={pmChecklistData.battery} />
                <PMCheckbox label="9) OTHER" value={pmChecklistData.other_safety} />
              </Box>
           </Box>
        </Box>
      </Paper>
      
      <Box sx={{ pageBreakBefore: 'always', pt: 2 }} />
      
      <Paper elevation={0} sx={{ border: tableBorder, borderRadius: 0, p: 0 }}>
        {/* Footer Info */}
        <Box sx={{ borderBottom: tableBorder, display: 'flex', flexDirection: 'column' }}>
           
           {/* Top Half of Footer */}
           <Box sx={{ display: 'flex', borderBottom: tableBorder }}>
             
             {/* Left Column */}
             <Box sx={{ flex: 1, borderRight: tableBorder, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', p: 1, alignItems: 'center', borderBottom: tableBorder }}>
                   <Typography variant="body2" sx={{ width: '150px', fontSize: '12px', fontWeight: 'bold' }}>PM START DATE/TIME</Typography>
                   <Box sx={{ border: '1px solid black', flexGrow: 1, minHeight: '24px', px: 1, ml: 1 }}>
                     {pmChecklistData.pm_start_date_time || ''}
                   </Box>
                </Box>
                <Box sx={{ display: 'flex', p: 1, flexGrow: 1 }}>
                   <Typography variant="body2" sx={{ width: '150px', fontSize: '12px', fontWeight: 'bold' }}>PM COMPLETED BY<br/>NAME/SIGN</Typography>
                   <Box sx={{ border: '1px solid black', flexGrow: 1, minHeight: '50px', ml: 1 }}></Box>
                </Box>
             </Box>
             
             {/* Right Column */}
             <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                
                {/* W.O Detail & Dates Block */}
                <Box sx={{ display: 'flex', borderBottom: tableBorder, flexGrow: 1 }}>
                   {/* Left side: W.O. Detail (Spans both rows) */}
                   <Box sx={{ flex: 1, borderRight: tableBorder, p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 'bold', mb: 0.5 }}>W.O. DETAIL</Typography>
                      <Box sx={{ border: '1px solid black', flexGrow: 1, minHeight: '24px', p: 0.5, fontSize: '11px', wordBreak: 'break-all' }}>
                        {complaint.docket_no || ''}
                      </Box>
                   </Box>
                   {/* Right side: Dates */}
                   <Box sx={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ flex: 1, p: 1, display: 'flex', alignItems: 'center', borderBottom: tableBorder }}>
                        <Typography variant="body2" sx={{ width: '130px', fontSize: '12px', fontWeight: 'bold' }}>PM COMPLETED DATE</Typography>
                        <Box sx={{ border: '1px solid black', flexGrow: 1, minHeight: '24px', px: 1 }}>
                          {pmChecklistData.pm_completed_date || ''}
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, p: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ width: '130px', fontSize: '12px', fontWeight: 'bold' }}>NEXT PM DUE ON</Typography>
                        <Box sx={{ border: '1px solid black', flexGrow: 1, minHeight: '24px', px: 1 }}>
                          {pmChecklistData.next_pm_due_on || ''}
                        </Box>
                      </Box>
                   </Box>
                </Box>
                
                {/* Biomedical Name/Sign */}
                <Box sx={{ display: 'flex', p: 1, flexGrow: 1 }}>
                   <Typography variant="body2" sx={{ width: '160px', fontSize: '12px', fontWeight: 'bold' }}>BIOMEDICAL NAME/SIGN</Typography>
                   <Box sx={{ border: '1px solid black', flexGrow: 1, minHeight: '50px', ml: 1 }}></Box>
                </Box>
             </Box>
           </Box>

           {/* Bottom Half of Footer */}
           <Box sx={{ display: 'flex' }}>
             
             {/* Bottom Left */}
             <Box sx={{ flex: 1, borderRight: tableBorder, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', p: 1, alignItems: 'center', borderBottom: tableBorder }}>
                   <Typography variant="body2" sx={{ width: '80px', fontSize: '12px', fontWeight: 'bold' }}>STATUS</Typography>
                   <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, fontSize: '12px', textAlign: 'center' }}>
                     {pmChecklistData.status || 'COMPLETED/PENDING/PREPOND/POSTPONED'}
                   </Box>
                </Box>
                <Box sx={{ display: 'flex', p: 1, alignItems: 'center' }}>
                   <Box sx={{ border: '1px solid black', flexGrow: 1, p: 0.5, fontSize: '12px', textAlign: 'center' }}>
                     {pmChecklistData.accepted_for_use === 'Yes' ? 'ACCEPTED FOR USE' : (pmChecklistData.accepted_for_use === 'No' ? 'NOT ACCEPTED FOR USE' : 'ACCEPTED FOR USE/ NOT ACCEPTED FOR USE')}
                   </Box>
                </Box>
             </Box>
             
             {/* Bottom Right (Accepted By Name/Sign) */}
             <Box sx={{ flex: 1.2, p: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 'bold', mb: 1 }}>ACCEPTED BY NAME/SIGN</Typography>
                <Box sx={{ flexGrow: 1 }}></Box>
             </Box>
             
           </Box>
        </Box>

        {/* Spares Utilized */}
        <Box>
           <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '12px', p: 1 }}>
              SPARE UTILIZED (Debug: {materialIssues.length} issues passed. {JSON.stringify(materialIssues).substring(0, 50)})
           </Typography>
           <Table size="small" sx={{ '& th, & td': { border: tableBorder, p: 0.5, fontSize: '12px', textAlign: 'center' }, '& th:first-of-type, & td:first-of-type': { borderLeft: 0 }, '& th:last-child, & td:last-child': { borderRight: 0 }, '& th': { borderTop: tableBorder } }}>
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
                           <TableCell rowSpan={Math.max(3, combinedSpares.length)} sx={{ borderLeft: `${tableBorder} !important`, borderBottom: '0 !important' }}>{overallRemark || '\u00A0'}</TableCell>
                         ) : null}
                       </TableRow>
                     ))}
                     {/* Pad to at least 3 rows */}
                     {combinedSpares.length < 3 && 
                       Array.from({ length: 3 - combinedSpares.length }).map((_, idx) => {
                         const absoluteIdx = combinedSpares.length + idx;
                         return (
                           <TableRow key={`empty-${idx}`}>
                             <TableCell sx={{ minHeight: '24px' }}>&nbsp;</TableCell>
                             <TableCell>&nbsp;</TableCell>
                             <TableCell>&nbsp;</TableCell>
                             <TableCell>&nbsp;</TableCell>
                             {absoluteIdx === 0 ? <TableCell rowSpan={3} sx={{ borderLeft: `${tableBorder} !important`, borderBottom: '0 !important' }}>{overallRemark || '\u00A0'}</TableCell> : null}
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
