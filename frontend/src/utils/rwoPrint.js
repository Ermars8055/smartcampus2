import { formatDate } from './dateUtils';

export const generateRwoHTML = (rwo) => {
  const dateFormatted = rwo?.created_at ? formatDate(rwo.created_at) : '';
  const targetDateFormatted = rwo?.target_completion_date ? formatDate(rwo.target_completion_date) : '-';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Repair Work Order - ${rwo?.rwo_number || ''}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
        .print-container { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 6px; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; }
        .org-title { font-size: 18px; font-weight: bold; margin: 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
        .org-sub { font-size: 11px; color: #64748b; margin: 4px 0 0 0; }
        .doc-title { font-size: 15px; font-weight: 700; margin-top: 12px; letter-spacing: 1px; color: #2563eb; text-transform: uppercase; }
        
        .grid-2 { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
        .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #f8fafc; }
        .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 0.5px; }
        
        .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
        .info-label { font-weight: 600; color: #64748b; }
        .info-val { font-weight: 700; color: #0f172a; text-align: right; }
        
        .section { margin-bottom: 20px; }
        .section-header { font-size: 12px; font-weight: 700; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; color: #334155; text-transform: uppercase; border-left: 4px solid #2563eb; }
        
        .description-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background: #fff; min-height: 60px; white-space: pre-wrap; font-size: 12px; color: #334155; }
        
        .signatures { margin-top: 60px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { text-align: center; width: 200px; }
        .sig-line { border-top: 1px solid #475569; margin-top: 40px; margin-bottom: 5px; }
        .sig-label { font-size: 11px; font-weight: 600; color: #475569; }

        @media print {
          body { padding: 0; background: none; }
          .print-container { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="header">
          <h1 class="org-title">East Point College of Medical Sciences & Research Center</h1>
          <p class="org-sub">Jnana Prabha Campus, Bidarahalli, Virgo Nagar Post, Bengaluru - 560049</p>
          <div class="doc-title">Repair Work Order (RWO)</div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-title">Work Order Information</div>
            <div class="info-row"><span class="info-label">RWO No:</span><span class="info-val">${rwo?.rwo_number || '-'}</span></div>
            <div class="info-row"><span class="info-label">Date Created:</span><span class="info-val">${dateFormatted}</span></div>
            <div class="info-row"><span class="info-label">Status:</span><span class="info-val">${rwo?.status || '-'}</span></div>
            <div class="info-row"><span class="info-label">Complaint Docket:</span><span class="info-val">${rwo?.docket_no || rwo?.complaint_docket || '-'}</span></div>
            <div class="info-row"><span class="info-label">Contract No:</span><span class="info-val">${rwo?.contract_number || '-'}</span></div>
          </div>

          <div class="card">
            <div class="card-title">Equipment & Vendor Details</div>
            <div class="info-row"><span class="info-label">Equipment Name:</span><span class="info-val">${rwo?.equipment_name || '-'}</span></div>
            <div class="info-row"><span class="info-label">Equipment Code:</span><span class="info-val">${rwo?.equipment_code || '-'}</span></div>
            <div class="info-row"><span class="info-label">Serial Number:</span><span class="info-val">${rwo?.equipment_serial || '-'}</span></div>
            <div class="info-row"><span class="info-label">Vendor Name:</span><span class="info-val">${rwo?.vendor_name || '-'}</span></div>
            <div class="info-row"><span class="info-label">Technician:</span><span class="info-val">${rwo?.technician_name || 'Unassigned'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">Problem Description & Nature of Call</div>
          <div class="description-box">${rwo?.problem_description || 'No problem description logged.'}</div>
        </div>

        <div class="section">
          <div class="section-header">Service & Repair Report Details</div>
          <div class="description-box" style="min-height: ${rwo?.service_report_details || rwo?.sla_details ? '60px' : '90px'};">
            ${rwo?.service_report_details || rwo?.sla_details || ''}
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Biomedical Engineer</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">Service Technician</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">HOD / Authorized Signatory</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printRwo = (rwo) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  const content = generateRwoHTML(rwo);
  iframe.contentDocument.write(content);
  iframe.contentDocument.close();
  
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 250);
};
