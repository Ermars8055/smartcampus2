/**
 * Date formatting utilities for NissiGrid - IST timezone, dd-MMM-yyyy format.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a date string or Date object to dd-MMM-yyyy in IST.
 * @param {string|Date} dateInput - ISO date string, date string, or Date object
 * @returns {string} Formatted date like "16-Apr-2026"
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  // Convert to IST (UTC+5:30)
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  const day = String(ist.getUTCDate()).padStart(2, '0');
  const month = MONTHS[ist.getUTCMonth()];
  const year = ist.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format a datetime string or Date object to dd-MMM-yyyy HH:mm in IST.
 * @param {string|Date} dateInput - ISO datetime string or Date object
 * @returns {string} Formatted datetime like "16-Apr-2026 14:30"
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  // Convert to IST (UTC+5:30)
  const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
  const day = String(ist.getUTCDate()).padStart(2, '0');
  const month = MONTHS[ist.getUTCMonth()];
  const year = ist.getUTCFullYear();
  const hours = String(ist.getUTCHours()).padStart(2, '0');
  const minutes = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
