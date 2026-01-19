import { Transform } from 'class-transformer';

/**
 * Indonesia timezone: Asia/Jakarta (WIB - UTC+7)
 * This is the default timezone for the application
 */
export const INDONESIA_TIMEZONE = 'Asia/Jakarta';
export const INDONESIA_UTC_OFFSET = 7; // UTC+7 hours

/**
 * Transforms date strings to Date objects, handling timezone properly
 * Assumes input dates are in Indonesia timezone and converts to UTC for storage
 * Use this decorator on date fields in DTOs to ensure proper date parsing
 */
export const TransformDate = () => {
  return Transform(({ value }) => {
    if (!value) return value;
    
    // If already a Date object, return as is (will be stored as UTC)
    if (value instanceof Date) {
      return value;
    }
    
    // If string, parse it
    if (typeof value === 'string') {
      const date = new Date(value);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return value; // Return original if invalid
      }
      // Date is already in UTC when parsed, return as is
      return date;
    }
    
    return value;
  });
};

/**
 * Transforms date to ISO string in Indonesia timezone for API responses
 */
export const TransformDateToIndonesia = () => {
  return Transform(({ value }) => {
    if (!value) return value;
    
    if (value instanceof Date) {
      return formatDateToIndonesia(value);
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return formatDateToIndonesia(date);
      }
    }
    
    return value;
  });
};

/**
 * Transforms date to ISO string for consistent API responses (UTC)
 */
export const TransformDateToISO = () => {
  return Transform(({ value }) => {
    if (!value) return value;
    
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    return value;
  });
};

/**
 * Ensures date is in UTC timezone (for database storage)
 */
export function toUTC(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return null;
  }
  
  // JavaScript Date objects are already in UTC internally
  // This function ensures we're working with UTC
  return new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  ));
}

/**
 * Converts UTC date to Indonesia timezone (WIB, UTC+7)
 * Returns ISO string with Indonesia timezone offset
 */
export function formatDateToIndonesia(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return null;
  }
  
  // Get UTC components
  let utcYear = d.getUTCFullYear();
  let utcMonth = d.getUTCMonth();
  let utcDay = d.getUTCDate();
  let utcHours = d.getUTCHours();
  const utcMinutes = d.getUTCMinutes();
  const utcSeconds = d.getUTCSeconds();
  const utcMilliseconds = d.getUTCMilliseconds();
  
  // Add 7 hours for Indonesia timezone (UTC+7)
  utcHours += INDONESIA_UTC_OFFSET;
  
  // Handle day/month/year rollover
  if (utcHours >= 24) {
    utcHours -= 24;
    utcDay += 1;
    
    // Check if day exceeds month length
    const daysInMonth = new Date(utcYear, utcMonth + 1, 0).getDate();
    if (utcDay > daysInMonth) {
      utcDay = 1;
      utcMonth += 1;
      
      if (utcMonth >= 12) {
        utcMonth = 0;
        utcYear += 1;
      }
    }
  }
  
  // Format as ISO string with +07:00 timezone offset
  const year = String(utcYear);
  const month = String(utcMonth + 1).padStart(2, '0');
  const day = String(utcDay).padStart(2, '0');
  const hours = String(utcHours).padStart(2, '0');
  const minutes = String(utcMinutes).padStart(2, '0');
  const seconds = String(utcSeconds).padStart(2, '0');
  const milliseconds = String(utcMilliseconds).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+07:00`;
}

/**
 * Formats date to ISO string (UTC)
 */
export function formatDateToISO(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return null;
  }
  
  return d.toISOString();
}

/**
 * Converts Indonesia timezone date string to UTC Date object
 * Useful when receiving dates from client in Indonesia timezone
 */
export function fromIndonesiaToUTC(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Parse the date string (assuming it's in Indonesia timezone)
  // If it includes timezone info, Date will parse it correctly
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  // If the date string doesn't have timezone, assume it's in Indonesia timezone
  // and convert to UTC
  if (!dateString.includes('+') && !dateString.includes('Z') && !dateString.includes('-')) {
    // No timezone info, assume Indonesia timezone (UTC+7)
    // Create a date in UTC by subtracting 7 hours
    return new Date(date.getTime() - (INDONESIA_UTC_OFFSET * 60 * 60 * 1000));
  }
  
  return date;
}

