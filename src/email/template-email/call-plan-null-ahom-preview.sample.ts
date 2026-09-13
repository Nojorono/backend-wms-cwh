import { CallPlanNullAhomTemplateDto } from '../dto/call-plan-null-ahom-template.dto';

export const CALL_PLAN_NULL_AHOM_PREVIEW_SAMPLE: CallPlanNullAhomTemplateDto = {
  callPlanStartDate: '2026-06-19',
  cabang: 'KRW',
  ahomName: 'AHOM Example',
  ahomNik: '11223344',
  supervisors: [
    {
      supervisorName: 'Supervisor A',
      supervisorNik: '87654321',
      sales: [
        {
          salesName: 'Sales One',
          salesNik: '12345678',
          routeNumber: 'RT-001',
          callPlanStartDate: '2026-06-19',
          callPlanEndDate: '2026-06-21',
          isLuarkota: false,
        },
        {
          salesName: 'Sales Two',
          salesNik: '22334455',
          routeNumber: 'RT-002',
          callPlanStartDate: '2026-06-19',
          callPlanEndDate: '2026-06-21',
          isLuarkota: true,
        },
      ],
    },
    {
      supervisorName: 'Supervisor B',
      supervisorNik: '99887766',
      sales: [
        {
          salesName: 'Sales Three',
          salesNik: '33445566',
          routeNumber: 'RT-003',
          callPlanStartDate: '2026-06-19',
          callPlanEndDate: '2026-06-21',
          isLuarkota: false,
        },
      ],
    },
  ],
};
