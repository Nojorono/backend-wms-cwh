import {
  CallPlanAhomGroupedData,
  CallPlanSalesData,
  CallPlanSalesSpvData,
} from './types/scheduled-call-plan-data.interface';
import { CallPlanNullAhomTemplateContext } from '../../email/template-email/types/call-plan-null-ahom-template.interface';
import { CallPlanReminderTemplateContext } from '../../email/template-email/types/call-plan-reminder-template.interface';

function isMissingCallPlanNumber(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

function toSalesRows(sales: CallPlanSalesData[]) {
  return sales
    .filter((row) => isMissingCallPlanNumber(row.CALL_PLAN_NUMBER))
    .map((row) => ({
      salesName: row.SALES_NAME,
      salesNik: row.SALES_NIK,
      routeNumber: row.ROUTE_NUMBER,
      callPlanStartDate: row.CALL_PLAN_START_DATE,
      callPlanEndDate: row.CALL_PLAN_END_DATE,
      isLuarkota: row.ISLUARKOTA === true,
    }));
}

export function buildCallPlanReminderContext(
  ahom: Pick<CallPlanAhomGroupedData, 'AHOM_NAME' | 'AHOM_NIK' | 'CABANG'>,
  supervisor: CallPlanSalesSpvData,
  callPlanStartDate: string,
): CallPlanReminderTemplateContext | null {
  if (!supervisor.SALES_SUPERVISOR_NIK?.trim()) {
    return null;
  }

  const sales = toSalesRows(supervisor.SALES);
  if (!sales.length) {
    return null;
  }

  return {
    callPlanStartDate,
    cabang: ahom.CABANG,
    supervisorName: supervisor.SALES_SUPERVISOR_NAME,
    supervisorNik: supervisor.SALES_SUPERVISOR_NIK,
    ahomName: ahom.AHOM_NAME,
    ahomNik: ahom.AHOM_NIK,
    sales,
    generatedAt: '',
  };
}

export function buildCallPlanReminderContexts(
  groupedData: CallPlanAhomGroupedData[],
  callPlanStartDate: string,
): CallPlanReminderTemplateContext[] {
  const contexts: CallPlanReminderTemplateContext[] = [];

  for (const ahom of groupedData) {
    for (const supervisor of ahom.SALES_SPV) {
      const context = buildCallPlanReminderContext(ahom, supervisor, callPlanStartDate);
      if (context) {
        contexts.push(context);
      }
    }
  }

  return contexts;
}

export function buildCallPlanNullAhomContexts(
  groupedData: CallPlanAhomGroupedData[],
  callPlanStartDate: string,
): CallPlanNullAhomTemplateContext[] {
  const contexts: CallPlanNullAhomTemplateContext[] = [];

  for (const ahom of groupedData) {
    if (!ahom.AHOM_NIK?.trim()) {
      continue;
    }

    const supervisors = ahom.SALES_SPV.flatMap((supervisor) => {
      if (!supervisor.SALES_SUPERVISOR_NIK?.trim()) {
        return [];
      }

      const sales = toSalesRows(supervisor.SALES);
      if (!sales.length) {
        return [];
      }

      return [
        {
          supervisorName: supervisor.SALES_SUPERVISOR_NAME,
          supervisorNik: supervisor.SALES_SUPERVISOR_NIK,
          sales,
        },
      ];
    });

    if (!supervisors.length) {
      continue;
    }

    contexts.push({
      callPlanStartDate,
      cabang: ahom.CABANG,
      ahomName: ahom.AHOM_NAME,
      ahomNik: ahom.AHOM_NIK,
      supervisors,
      generatedAt: '',
    });
  }

  return contexts;
}
