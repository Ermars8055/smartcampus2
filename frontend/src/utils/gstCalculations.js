export const computeGstSplit = (gstRate, vendorState, baseState, cgstSharePct = 50, sgstSharePct = 50) => {
  const rate = parseFloat(gstRate) || 0;
  
  if (!vendorState) {
    return {
      cgst_percentage: 0,
      sgst_percentage: 0,
      igst_percentage: 0
    };
  }

  if (!baseState || vendorState !== baseState) {
    // Inter-state or missing base state info -> Apply entire GST as IGST
    return {
      cgst_percentage: 0,
      sgst_percentage: 0,
      igst_percentage: Number(rate.toFixed(2))
    };
  }

  // Intra-state -> Apply CGST and SGST based on configured shares
  const cgst = rate * (parseFloat(cgstSharePct) / 100);
  const sgst = rate * (parseFloat(sgstSharePct) / 100);

  return {
    cgst_percentage: Number(cgst.toFixed(2)),
    sgst_percentage: Number(sgst.toFixed(2)),
    igst_percentage: 0
  };
};
