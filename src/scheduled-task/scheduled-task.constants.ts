export const SCHEDULED_EMAIL_CALLBACK_TYPE = 'sendEmail';
export const SCHEDULED_CALL_PLAN_CALLBACK_TYPE = 'fetchAllCallPlan';

export const SCHEDULED_TASK_CALLBACK_TYPES = [
  SCHEDULED_EMAIL_CALLBACK_TYPE,
  SCHEDULED_CALL_PLAN_CALLBACK_TYPE,
] as const;

export type ScheduledTaskCallbackType = (typeof SCHEDULED_TASK_CALLBACK_TYPES)[number];
