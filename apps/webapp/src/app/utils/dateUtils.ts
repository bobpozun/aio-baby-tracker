export const getCurrentDateTimeLocal = (): string => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
};

export const getCurrentDateLocal = (): string => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localISOTime = new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
  return localISOTime;
};

export function formatTimeForDisplay(time: string): string {
  if (!time) return '';
  return time.slice(0, 13) + time.slice(13, 16);
}

export function formatDateTimeLocalInput(
  isoString: string | undefined
): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      console.error(
        '[dateUtils] Invalid date string received for input formatting:',
        isoString
      );
      return '';
    }

    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - timezoneOffset)
      .toISOString()
      .slice(0, 16);
    return formatTimeForDisplay(localISOTime);
  } catch (e) {
    console.error('[dateUtils] Error formatting date for input:', e);
    return '';
  }
}

export const calculateDuration = (
  start: string | undefined,
  end: string | undefined
): string => {
  if (!start || !end) return 'Missing Dates';
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.warn(
      '[dateUtils] Invalid date(s) passed to calculateDuration:',
      start,
      end
    );
    return 'Invalid Dates';
  }
  const durationMs = endDate.getTime() - startDate.getTime();
  if (durationMs < 0) return 'End < Start';
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

export function calculatePregnancyWeek(
  dueDateString: string | null | undefined
): number | null {
  if (!dueDateString) return null;
  try {
    const dueDate = new Date(dueDateString);
    if (isNaN(dueDate.getTime())) return null;
    const today = new Date();

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

export function getProfileAgeOrDue(birthdayString: string): string {
  if (!birthdayString) return '';
  const today = new Date();
  const birthday = new Date(birthdayString);
  birthday.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  if (birthday > today) {
    const diffTime = birthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    let years = today.getFullYear() - birthday.getFullYear();
    let months = today.getMonth() - birthday.getMonth();
    let days = today.getDate() - birthday.getDate();
    if (days < 0) {
      months--;

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
export function formatDateTimeDisplay(
  dateString: string | undefined | null
): string {
  if (!dateString) return 'Invalid Date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString();
}
