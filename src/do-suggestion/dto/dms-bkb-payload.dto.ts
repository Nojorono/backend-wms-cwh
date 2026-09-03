export interface DmsBkbLinePayload {
  item_code: string;
  inventory_item_id: number;
  item_qty_final: number;
  item_uom: string;
  line_number: number;
}

export interface DmsBkbPayload {
  organization_code: string;
  spb_type: number;
  mo_type: string;
  preparation_date: string;
  callplan_number: string;
  callplan_date_start: string;
  callplan_date_end: string;
  route_number: string;
  trip_type: string;
  sales_nik: string;
  sales_name: string;
  sales_spv: string;
  sales_spv_nik: string;
  spb_date: string;
  spb_number: string;
  lines: DmsBkbLinePayload[];
}

export interface HitDmsBkbResult {
  success: boolean;
  message: string;
  spb_number: string;
  payload: DmsBkbPayload;
  dms_response?: unknown;
}

export interface DmsBkbErrorResponse {
  message?: string;
  error?: string;
  errors?: Array<string | { field?: string; message?: string }>;
}
