import React, { forwardRef } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Checkbox } from '@mui/material';
import dayjs from 'dayjs';

const EngineerEvaluationReport = forwardRef(({ complaint, materialIssues = [] }, ref) => {
  if (!complaint) return null;

  // Flatten items from material issues
  const partsReplaced = materialIssues.reduce((acc, issue) => {
    if (issue.items) {
      acc.push(...issue.items);
    }
    return acc;
  }, []);

  return (
    <Box ref={ref} sx={{ p: 4, bgcolor: '#fff', color: '#000', width: '100%', '@media print': { p: 0 } }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: sans-serif; -webkit-print-color-adjust: exact; }
          .print-border { border: 1px solid #000; }
          .print-border-bottom { border-bottom: 1px solid #000; }
          .print-border-right { border-right: 1px solid #000; }
          .MuiDialog-root, .MuiBackdrop-root, .MuiPopover-root, .chatbot-widget-container { display: none !important; }
        `}
      </style>

      {/* Header section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          EAST POINT HOSPITAL
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Bidarahalli, Virgonagar Post, Bangalore - 560 049
        </Typography>

        <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
          DEPARTMENT OF BIOMEDICAL ENGINEERING
        </Typography>
        <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', textDecoration: 'underline', mb: 1 }}>
          SERVICE REQUEST FROM / Installation report
        </Typography>
      </Box>

      {/* Equipment Details Table */}
      <Box className="print-border" sx={{ mb: 2, '& .MuiTableCell-root': { borderRight: '1px solid #000', borderBottom: '1px solid #000', p: 1, borderColor: '#000' } }}>
        <Table size="small" sx={{ borderCollapse: 'collapse', '& td, & th': { border: '1px solid #000', p: 1 } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ width: '25%', fontWeight: 'bold' }}>NAME OF EQUIPMENT</TableCell>
              <TableCell sx={{ width: '25%' }}>{complaint.equipment_name || complaint.equipment?.name || '-'}</TableCell>
              <TableCell sx={{ width: '25%', fontWeight: 'bold' }}>Sl.No.</TableCell>
              <TableCell sx={{ width: '25%' }}>{complaint.equipment?.serial_number || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>MAKE</TableCell>
              <TableCell>{complaint.equipment?.make || '-'}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>MODEL</TableCell>
              <TableCell>{complaint.equipment?.model || '-'}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>DATE & TIME</TableCell>
              <TableCell>{dayjs(complaint.complaint_date).format('DD/MM/YYYY')} {complaint.complaint_time}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>DEPARTMENT</TableCell>
              <TableCell>{complaint.department_name || '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      {/* Complaint Nature Box */}
      <Box className="print-border" sx={{ mb: 2, minHeight: '80px', position: 'relative', p: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>NATURE OF COMPLAINT : :</Typography>
        <Typography variant="body2">{complaint.nature_of_complaint || '-'}</Typography>
        
        <Box sx={{ position: 'absolute', bottom: 10, right: 10, textAlign: 'right' }}>
          <Typography variant="body2" sx={{ mt: 2 }}>COMPLAINTS SIGNATURE</Typography>
        </Box>
      </Box>

      <Typography align="center" variant="body2" sx={{ fontWeight: 'bold', mb: 2, textDecoration: 'underline' }}>
        This section to be completed by biomedical engineer
      </Typography>

      {/* Action Taken Box */}
      <Box className="print-border" sx={{ mb: 2, minHeight: '100px', p: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>PROBLEM OBSERVED AND ACTION TAKEN :</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{complaint.resolution_entered || ''}</Typography>
      </Box>

      {/* Parts Replaced Table */}
      <Box className="print-border" sx={{ mb: 2 }}>
        <Table size="small" sx={{ borderCollapse: 'collapse', '& td, & th': { border: '1px solid #000', p: 1 } }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell colSpan={5} sx={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: '0.8rem' }}>
                DETAILS OF PARTS/MODULES/ACCESSORIS (IF REPLACED)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ width: '10%' }}>SL NO</TableCell>
              <TableCell sx={{ width: '40%' }}>DESCRIPTION</TableCell>
              <TableCell sx={{ width: '15%' }}>HSN CODE</TableCell>
              <TableCell sx={{ width: '15%' }}>QTY</TableCell>
              <TableCell sx={{ width: '20%' }}>PRICE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partsReplaced.length > 0 ? (
              partsReplaced.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.material_name}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              ))
            ) : (
              // Empty rows if no parts replaced
              [1, 2, 3].map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ height: '30px' }}></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Status On Work Completion */}
      <Box className="print-border" sx={{ mb: 2, p: 2, textAlign: 'center', minHeight: '60px' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>STATUS ON WORK COMPLEION</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>{complaint.status_on_work_completion || ''}</Typography>
      </Box>

      {/* Completion Details Box */}
      <Box className="print-border" sx={{ p: 2, minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" align="center" sx={{ fontWeight: 'bold', mb: 3 }}>COMPLETION DETAILS</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 2 }}>JOB COMPLETED SATISFACTORILY : </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
              <Box sx={{ width: 16, height: 16, border: '1px solid #000', mr: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {complaint.job_completed_satisfactorily ? '✓' : ''}
              </Box> YES
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 16, height: 16, border: '1px solid #000', mr: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {!complaint.job_completed_satisfactorily ? '✓' : ''}
              </Box> NO
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Typography variant="body2" sx={{ mr: 4 }}>DATE : {complaint.completion_date ? dayjs(complaint.completion_date).format('DD/MM/YYYY') : '......................'}</Typography>
            <Typography variant="body2">TIME : {complaint.completion_time || '......................'}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>COMPLAINANT'S SIGNATURE:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>BIOMEDICAL ENGINEER'S SIGNATURE:</Typography>
        </Box>
      </Box>
    </Box>
  );
});

EngineerEvaluationReport.displayName = 'EngineerEvaluationReport';

export default EngineerEvaluationReport;
