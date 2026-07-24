/**
 * Date formatting utilities for Eastpoint - IST timezone, dd-MMM-yyyy format.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a date string or Date object to dd-MMM-yyyy in IST.
 * @param {string|Date} dateInput - ISO date string, date string, or Date object
 * @returns {string} Formatted date like "16-Apr-2026"
 */
export function formatDate(dateInput) {
  if (!dateInput) return '-';
  
  if (typeof dateInput === 'string') {
    let s = dateInput;
    if (s.includes('T') && !s.endsWith('Z') && !s.includes('+') && !s.match(/-\d\d:\d\d$/)) {
      s += 'Z';
    } else if (!s.includes('T')) {
      s += 'T00:00:00Z';
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = MONTHS[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  } else if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '-';
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const parts = formatter.formatToParts(dateInput);
    const getPart = (type) => parts.find(p => p.type === type)?.value;
    return `${getPart('day')}-${getPart('month')}-${getPart('year')}`;
  }
  return '-';
}

/**
 * Format a datetime string or Date object to dd-MMM-yyyy HH:mm in IST.
 * @param {string|Date} dateInput - ISO datetime string or Date object
 * @returns {string} Formatted datetime like "16-Apr-2026 14:30"
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '-';
  
  if (typeof dateInput === 'string') {
    let s = dateInput;
    if (s.includes('T') && !s.endsWith('Z') && !s.includes('+') && !s.match(/-\d\d:\d\d$/)) {
      s += 'Z';
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = MONTHS[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } else if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '-';
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(dateInput);
    const getPart = (type) => parts.find(p => p.type === type)?.value;
    return `${getPart('day')}-${getPart('month')}-${getPart('year')} ${getPart('hour')}:${getPart('minute')}`;
  }
  return '-';
}
