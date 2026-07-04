import { INDONESIA_TIMEZONE } from '../../core/utils/date-transformer.util';
import { formatDateOnly, toDateOnly } from './work-scheduled-generator.util';

const MAX_CALENDAR_SCAN_DAYS = 366;

export function getTodayDateOnlyInIndonesia(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: INDONESIA_TIMEZONE });
  return toDateOnly(formatter.format(new Date()));
}

export async function shiftWorkingDays(
  startDate: Date,
  workingDays: number,
  isWorkingDayFn: (date: Date) => Promise<boolean>,
): Promise<Date> {
  if (workingDays === 0) {
    return new Date(startDate);
  }

  const direction = workingDays > 0 ? 1 : -1;
  let remaining = Math.abs(workingDays);
  const current = new Date(startDate);
  let scannedDays = 0;

  while (remaining > 0) {
    current.setUTCDate(current.getUTCDate() + direction);
    scannedDays += 1;

    if (scannedDays > MAX_CALENDAR_SCAN_DAYS) {
      throw new Error(
        `Unable to shift ${workingDays} working day(s) within ${MAX_CALENDAR_SCAN_DAYS} calendar days`,
      );
    }

    if (await isWorkingDayFn(current)) {
      remaining -= 1;
    }
  }

  return current;
}

export function formatDateOnlyString(date: Date): string {
  return formatDateOnly(date);
}
