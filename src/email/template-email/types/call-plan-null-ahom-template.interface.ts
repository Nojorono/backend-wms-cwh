export interface CallPlanNullAhomSalesRow {
  salesName: string;
  salesNik: string;
  routeNumber: string;
  callPlanStartDate: string;
  callPlanEndDate: string;
  isLuarkota: boolean;
}

export interface CallPlanNullAhomSupervisorBlock {
  supervisorName: string;
  supervisorNik: string;
  sales: CallPlanNullAhomSalesRow[];
}

export interface CallPlanNullAhomTemplateContext {
  callPlanStartDate: string;
  cabang: string;
  ahomName: string;
  ahomNik: string;
  supervisors: CallPlanNullAhomSupervisorBlock[];
  generatedAt: string;
}

export interface RenderedCallPlanNullAhomEmail {
  subject: string;
  html: string;
  text: string;
}

export interface CallPlanNullAhomTemplateEnvTexts {
  subject: string;
  heading: string;
  subheading: string;
  preheader: string;
  intro: string;
  footer: string;
  brand: string;
}
