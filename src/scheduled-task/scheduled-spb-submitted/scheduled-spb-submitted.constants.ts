import { SCHEDULED_SPB_SUBMITTED_CALLBACK_TYPE } from '../scheduled-task.constants';

export { SCHEDULED_SPB_SUBMITTED_CALLBACK_TYPE };

export const SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_JOB_NAME = 'submit-all-spb-pending';

export const SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_CRON = '0 23 * * *';

export const SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_TIMEZONE = 'Asia/Jakarta';

export type ScheduledSpbSubmittedScheduleMode = 'database' | 'memory' | 'off';
