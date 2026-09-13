import { WorkScheduledDayType } from '../domain/entities/work-scheduled.entity';

export function resolveDefaultDayTypeByWeekday(date: Date): WorkScheduledDayType {
  const day = date.getDay();

  if (day === 0) {
    return WorkScheduledDayType.WEEKEND;
  }

  return WorkScheduledDayType.WORKING;
}

export function resolveWorkScheduledDayType(
  date: Date,
  branchDayType?: WorkScheduledDayType | null,
  defaultDayType?: WorkScheduledDayType | null,
): WorkScheduledDayType {
  if (branchDayType) {
    return branchDayType;
  }

  if (defaultDayType) {
    return defaultDayType;
  }

  return resolveDefaultDayTypeByWeekday(date);
}

export function isWorkingDay(dayType: WorkScheduledDayType): boolean {
  return dayType === WorkScheduledDayType.WORKING;
}
