export interface CallPlanReminderSalesRow {
  salesName: string;
  salesNik: string;
  routeNumber: string;
  callPlanStartDate: string;
  callPlanEndDate: string;
  isLuarkota: boolean;
}

export interface CallPlanReminderTemplateContext {
  callPlanStartDate: string;
  cabang: string;
  supervisorName: string;
  supervisorNik: string;
  ahomName: string;
  ahomNik: string;
  sales: CallPlanReminderSalesRow[];
  generatedAt: string;
}

export interface RenderedCallPlanReminderEmail {
  subject: string;
  html: string;
  text: string;
}
