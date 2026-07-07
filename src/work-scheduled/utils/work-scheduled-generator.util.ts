import {
  WorkScheduledDayType,
} from '../../core/domain/entities/work-scheduled.entity';
import {
  IndonesiaHolidayEntry,
} from '../data/indonesia-national-holidays.data';

export interface GeneratedWorkScheduledDay {
  calendarDate: Date;
  dayType: WorkScheduledDayType;
  name?: string;
  description?: string;
}

export interface GenerateYearCalendarOptions {
  year: number;
  includeJointLeave?: boolean;
  holidays: IndonesiaHolidayEntry[];
}

export interface GenerateYearCalendarSummary {
  working: number;
  weekend: number;
  holiday: number;
  total: number;
}

export function toDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function normalizeDateOnly(value: Date | string): Date {
  if (value instanceof Date) {
    return value;
  }

  const dateOnly = value.split('T')[0];
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

export function formatDateOnly(date: Date | string): string {
  const normalized = normalizeDateOnly(date);
  const year = normalized.getUTCFullYear();
  const month = String(normalized.getUTCMonth() + 1).padStart(2, '0');
  const day = String(normalized.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function compareDateOnly(left: Date | string, right: Date | string): number {
  return normalizeDateOnly(left).getTime() - normalizeDateOnly(right).getTime();
}

export function isWeekendDate(date: Date): boolean {
  return date.getUTCDay() === 0;
}

function buildHolidayMap(
  holidays: IndonesiaHolidayEntry[],
  includeJointLeave: boolean,
): Map<string, IndonesiaHolidayEntry> {
  const map = new Map<string, IndonesiaHolidayEntry>();

  for (const holiday of holidays) {
    if (!includeJointLeave && holiday.isJointLeave) {
      continue;
    }

    map.set(holiday.date, holiday);
  }

  return map;
}

export function generateYearCalendarDays(
  options: GenerateYearCalendarOptions,
): { days: GeneratedWorkScheduledDay[]; summary: GenerateYearCalendarSummary } {
  const { year, includeJointLeave = true, holidays } = options;
  const holidayMap = buildHolidayMap(holidays, includeJointLeave);
  const days: GeneratedWorkScheduledDay[] = [];
  const summary: GenerateYearCalendarSummary = {
    working: 0,
    weekend: 0,
    holiday: 0,
    total: 0,
  };

  const current = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));

  while (current <= end) {
    const dateKey = formatDateOnly(current);
    const holiday = holidayMap.get(dateKey);
    let dayType: WorkScheduledDayType;
    let name: string | undefined;
    let description: string | undefined;

    if (holiday) {
      dayType = WorkScheduledDayType.HOLIDAY;
      name = holiday.name;
      description = holiday.isJointLeave ? 'Cuti bersama' : 'Libur nasional';
      summary.holiday += 1;
    } else if (isWeekendDate(current)) {
      dayType = WorkScheduledDayType.WEEKEND;
      name = 'Minggu';
      summary.weekend += 1;
    } else {
      dayType = WorkScheduledDayType.WORKING;
      summary.working += 1;
    }

    days.push({
      calendarDate: new Date(current),
      dayType,
      name,
      description,
    });

    summary.total += 1;
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return { days, summary };
}
