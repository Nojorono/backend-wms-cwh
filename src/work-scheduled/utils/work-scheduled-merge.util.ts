import { WorkScheduled, WorkScheduledDayType } from '../../core/domain/entities/work-scheduled.entity';
import { compareDateOnly, formatDateOnly } from '../utils/work-scheduled-generator.util';
export function mergeCalendarEntries(
  defaultEntries: WorkScheduled[],
  branchEntries: WorkScheduled[],
  dayType?: WorkScheduledDayType,
): WorkScheduled[] {
  const merged = new Map<string, WorkScheduled>();

  for (const entry of defaultEntries) {
    merged.set(formatDateOnly(entry.calendarDate), entry);
  }

  for (const entry of branchEntries) {
    merged.set(formatDateOnly(entry.calendarDate), entry);
  }

  let result = Array.from(merged.values());

  if (dayType) {
    result = result.filter((entry) => entry.dayType === dayType);
  }

  return result.sort((left, right) => compareDateOnly(left.calendarDate, right.calendarDate));
}
