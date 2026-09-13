export interface CallPlanRowData {
  AHOM_NAME: string;
  AHOM_NIK: string;
  CABANG: string;
  ISLUARKOTA: boolean;
  CALL_PLAN_END_DATE: string;
  CALL_PLAN_NUMBER: string;
  CALL_PLAN_START_DATE: string;
  ROUTE_NUMBER: string;
  SALES_NAME: string;
  SALES_NIK: string;
  SALES_SUPERVISOR_NAME: string;
  SALES_SUPERVISOR_NIK: string;
}

export interface CallPlanSalesData {
  SALES_NAME: string;
  SALES_NIK: string;
  CALL_PLAN_END_DATE: string;
  CALL_PLAN_NUMBER: string;
  CALL_PLAN_START_DATE: string;
  ROUTE_NUMBER: string;
  ISLUARKOTA: boolean;
}

export interface CallPlanSalesSpvData {
  SALES_SUPERVISOR_NAME: string;
  SALES_SUPERVISOR_NIK: string;
  SALES: CallPlanSalesData[];
}

export interface CallPlanAhomGroupedData {
  AHOM_NAME: string;
  AHOM_NIK: string;
  CABANG: string;
  SALES_SPV: CallPlanSalesSpvData[];
}

export interface ScheduledCallPlanSnowflakeFetchResult {
  callPlanStartDate: string;
  totalRows: number;
  data: CallPlanRowData[];
}

export interface ScheduledCallPlanFetchResult {
  callPlanStartDate: string;
  totalRows: number;
  data: CallPlanAhomGroupedData[];
}
