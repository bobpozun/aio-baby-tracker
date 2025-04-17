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


/**
 * Calculates the current pregnancy week given a due date string (YYYY-MM-DD).
 * Returns an integer week (1-42), or null if invalid.
 */
export function calculatePregnancyWeek(dueDateString: string | null | undefined): number | null {
  if (!dueDateString) return null;
  try {
    const dueDate = new Date(dueDateString);
    if (isNaN(dueDate.getTime())) return null;
    const today = new Date();
    // Only use date part for both
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const remainingWeeks = diffDays / 7;
    const currentWeek = 40 - Math.ceil(remainingWeeks);
    return Math.max(1, Math.min(currentWeek, 42));
  } catch {
    return null;
  }
}

/**
 * Returns a string for age (if birthday in past/today) or time until due (if in future).
 * @param birthdayString YYYY-MM-DD
 * @returns string like "2 years, 3 months" or "Due in 5 days"
 */
export function getProfileAgeOrDue(birthdayString: string): string {
  if (!birthdayString) return '';
  const today = new Date();
  const birthday = new Date(birthdayString);
  birthday.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (birthday > today) {
    // Due in future
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    // Already born
    let years = today.getFullYear() - birthday.getFullYear();
    let months = today.getMonth() - birthday.getMonth();
    let days = today.getDate() - birthday.getDate();
    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    let result = '';
    if (years > 0) result += `${years} year${years !== 1 ? 's' : ''}`;
    if (months > 0) {
      if (result) result += ', ';
      result += `${months} month${months !== 1 ? 's' : ''}`;
    }
    if (!result) result = '0 months';
    return result;
  }
}
// Add other common date/time utilities here if needed
