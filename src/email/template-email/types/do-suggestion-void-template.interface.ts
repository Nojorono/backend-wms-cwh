export interface DoSuggestionVoidDetailRow {
  lineNumber: string;
  itemCode: string;
  quantityFinal: string;
  itemUom: string;
}

export interface DoSuggestionVoidTemplateContext {
  cabang: string;
  spbNumber: string;
  callplanNumber: string;
  callplanDateStart: string;
  callplanDateEnd: string;
  salesName: string;
  salesNik: string;
  salesSpv: string;
  salesSpvNik: string;
  routeNumber: string;
  tripType: string;
  status: string;
  updatedBy: string;
  requiresAction: boolean;
  generatedAt: string;
  details: DoSuggestionVoidDetailRow[];
}

export interface RenderedDoSuggestionVoidEmail {
  subject: string;
  html: string;
  text: string;
}
