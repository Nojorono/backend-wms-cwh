import { SCHEDULED_CALL_PLAN_CALLBACK_TYPE } from '../scheduled-task.constants';

export { SCHEDULED_CALL_PLAN_CALLBACK_TYPE };

/** Default job: fetch call plan from Snowflake daily at 08:00 WIB (H-2). */
export const SCHEDULED_CALL_PLAN_FETCH_ALL_JOB_NAME = 'fetch-all-call-plan-h2';

export const SCHEDULED_CALL_PLAN_FETCH_ALL_CRON = '0 8 * * *';

export const SCHEDULED_CALL_PLAN_FETCH_ALL_TIMEZONE = 'Asia/Jakarta';

/**
 * How call-plan auto-fetch is scheduled inside the NestJS server:
 * - database: cron persisted in scheduled_tasks (default)
 * - memory: in-process SchedulerRegistry cron from env (no DB row)
 * - off: manual trigger only
 */
export type ScheduledCallPlanScheduleMode = 'database' | 'memory' | 'off';
