import { SCHEDULED_ON_HAND_ATR_CALLBACK_TYPE } from '../scheduled-task.constants';

export { SCHEDULED_ON_HAND_ATR_CALLBACK_TYPE };

export const SCHEDULED_ON_HAND_ATR_FETCH_ALL_JOB_NAME = 'fetch-all-on-hand-atr';

export const SCHEDULED_ON_HAND_ATR_FETCH_ALL_CRON = '0 6 * * *';

export const SCHEDULED_ON_HAND_ATR_FETCH_ALL_TIMEZONE = 'Asia/Jakarta';

export const SCHEDULED_ON_HAND_ATR_BRANCH_ORGANIZATION_TYPES = ['BRANCH', 'SUBBRANCH'] as const;

export type ScheduledOnHandAtrScheduleMode = 'database' | 'memory' | 'off';
