export interface CallPlanDetail {
  CABANG: string;
  CALL_PLAN_NUMBER: string;
  ROUTE_NUMBER: string;
  SALES_NAME: string;
  SALES_NIK: string;
}

export interface CallPlanSupervisorData {
  SALES_SUPERVISOR_NIK: string;
  SALES_SUPERVISOR_NAME: string;
  DETAIL: CallPlanDetail[];
}

export interface ScheduledCallPlanFetchResult {
  callPlanStartDate: string;
  totalRows: number;
  data: CallPlanSupervisorData[];
}
