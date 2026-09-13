import { CallPlanReminderTemplateDto } from '../dto/call-plan-reminder-template.dto';

export const CALL_PLAN_REMINDER_PREVIEW_SAMPLE: CallPlanReminderTemplateDto = {
  callPlanStartDate: '2026-06-02',
  cabang: 'JOG',
  supervisorName: 'AHMAD GAHAR HABIBIE',
  supervisorNik: '250416.00028BC',
  ahomName: 'DAVID PALGUNA',
  ahomNik: '250801.00030DA',
  sales: [
    {
      salesName: 'BUDI HARYANTO',
      salesNik: '090513.00174DA',
      routeNumber: '43',
      callPlanStartDate: '',
      callPlanEndDate: '',
      isLuarkota: false,
    },
  ],
};

export function mergeCallPlanReminderPreviewBody(
  overrides: Partial<CallPlanReminderTemplateDto> = {},
): CallPlanReminderTemplateDto {
  return {
    ...CALL_PLAN_REMINDER_PREVIEW_SAMPLE,
    ...overrides,
    sales: overrides.sales?.length ? overrides.sales : CALL_PLAN_REMINDER_PREVIEW_SAMPLE.sales,
  };
}
