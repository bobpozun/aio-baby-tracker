/**
 * Gets the current date and time formatted for datetime-local input.
 * Adjusts for the local timezone offset.
 * @returns {string} Formatted string (YYYY-MM-DDTHH:mm)
 */
export const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16); // Get YYYY-MM-DDTHH:mm
  return localISOTime;
};

/**
 * Gets the current date formatted for date input.
 * Adjusts for the local timezone offset.
 * @returns {string} Formatted string (YYYY-MM-DD)
 */
export const getCurrentDateLocal = (): string => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10); // Get YYYY-MM-DD
  return localISOTime;
};


/**
 * Formats an ISO date string (like from DB) into the format required
 * by datetime-local input fields (YYYY-MM-DDTHH:mm).
 * Handles potential invalid date strings.
 * @param {string | undefined} isoString - The ISO date string.
 * @returns {string} Formatted string or empty string if input is invalid.
 */
export const formatDateTimeLocalInput = (isoString: string | undefined): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
       if (isNaN(date.getTime())) { // Check if date is invalid
         console.error('[dateUtils] Invalid date string received for input formatting:', isoString);
         return '';
      }
      // Adjust for local timezone offset before formatting for the input
      const timezoneOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 16);
      return localISOTime;
    } catch (e) {
      console.error('[dateUtils] Error formatting date for input:', e);
      return '';
    }
};

/**
 * Calculates the duration between two ISO date strings.
 * @param {string} start - Start ISO date string.
 * @param {string} end - End ISO date string.
 * @returns {string} Formatted duration (e.g., "Xh Ym") or error string.
 */
export const calculateDuration = (start: string | undefined, end: string | undefined): string => {
    if (!start || !end) return 'Missing Dates';
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Check if dates are valid after creation
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('[dateUtils] Invalid date(s) passed to calculateDuration:', start, end);
        return 'Invalid Dates';
    }
    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs < 0) return 'End < Start'; // More specific error
    const hours = Math.floor(durationMs / 3600000);
    const minutes = Math.floor((durationMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
};

// Add other common date/time utilities here if needed
