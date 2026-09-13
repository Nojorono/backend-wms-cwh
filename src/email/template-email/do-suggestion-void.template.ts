import {
  escapeHtml,
  loadEmailTemplate,
  renderDataTable,
  renderInfoBox,
  replacePlaceholders,
  wrapEmailLayout,
} from './email-html.util';
import {
  DoSuggestionVoidDetailRow,
  DoSuggestionVoidTemplateContext,
  RenderedDoSuggestionVoidEmail,
} from './types/do-suggestion-void-template.interface';

function renderDetailsTable(details: DoSuggestionVoidDetailRow[]): string {
  const rows = details.map((row, index) => [
    escapeHtml(String(index + 1)),
    escapeHtml(row.lineNumber || '-'),
    escapeHtml(row.itemCode || '-'),
    escapeHtml(row.quantityFinal || '-'),
    escapeHtml(row.itemUom || '-'),
  ]);

  return renderDataTable(
    ['No', 'Line', 'Item Code', 'Qty Final', 'UOM'],
    rows,
    'Tidak ada detail item.',
  );
}

function renderDetailsTextRows(details: DoSuggestionVoidDetailRow[]): string {
  if (!details.length) {
    return '- Tidak ada detail item.';
  }

  return details
    .map(
      (row, index) =>
        `${index + 1}. Line ${row.lineNumber || '-'} | ${row.itemCode || '-'} | Qty Final: ${row.quantityFinal || '-'} | UOM: ${row.itemUom || '-'}`,
    )
    .join('\n');
}

function buildActionMessage(context: DoSuggestionVoidTemplateContext): string {
  if (context.requiresAction) {
    return `DO Suggestion dengan SPB <strong>${escapeHtml(context.spbNumber)}</strong> telah di-void dari DMS dan memerlukan tindakan lanjutan (Back to Kecil) di WMS.`;
  }

  return `DO Suggestion dengan SPB <strong>${escapeHtml(context.spbNumber)}</strong> telah di-void dari DMS.`;
}

function buildActionMessageText(context: DoSuggestionVoidTemplateContext): string {
  if (context.requiresAction) {
    return `DO Suggestion dengan SPB ${context.spbNumber} telah di-void dari DMS dan memerlukan tindakan lanjutan (Back to Kecil) di WMS.`;
  }

  return `DO Suggestion dengan SPB ${context.spbNumber} telah di-void dari DMS.`;
}

function buildSubject(context: DoSuggestionVoidTemplateContext): string {
  const actionLabel = context.requiresAction ? 'Perlu Tindakan' : 'Void';
  return `[${actionLabel}] DO Suggestion Void - ${context.cabang} - ${context.spbNumber}`;
}

export function renderDoSuggestionVoidEmail(
  context: DoSuggestionVoidTemplateContext,
): RenderedDoSuggestionVoidEmail {
  const textTemplate = loadEmailTemplate('do-suggestion-void.txt');
  const bodyTemplate = loadEmailTemplate('do-suggestion-void.body.html');

  const infoBox = renderInfoBox([
    { label: 'Cabang', value: context.cabang },
    { label: 'SPB Number', value: context.spbNumber },
    { label: 'Call Plan', value: context.callplanNumber || '-' },
    { label: 'Call Plan Start', value: context.callplanDateStart || '-' },
    { label: 'Call Plan End', value: context.callplanDateEnd || '-' },
    { label: 'Sales', value: `${context.salesName || '-'} (${context.salesNik || '-'})` },
    { label: 'Supervisor', value: `${context.salesSpv || '-'} (${context.salesSpvNik || '-'})` },
    { label: 'Route', value: context.routeNumber || '-' },
    { label: 'Trip Type', value: context.tripType || '-' },
    { label: 'Status', value: context.status },
    { label: 'Updated By', value: context.updatedBy || '-' },
  ]);

  const placeholders = {
    cabang: context.cabang,
    spbNumber: context.spbNumber,
    callplanNumber: context.callplanNumber || '-',
    callplanDateStart: context.callplanDateStart || '-',
    callplanDateEnd: context.callplanDateEnd || '-',
    salesName: context.salesName || '-',
    salesNik: context.salesNik || '-',
    salesSpv: context.salesSpv || '-',
    salesSpvNik: context.salesSpvNik || '-',
    routeNumber: context.routeNumber || '-',
    tripType: context.tripType || '-',
    status: context.status,
    updatedBy: context.updatedBy || '-',
    generatedAt: context.generatedAt,
    actionMessageText: buildActionMessageText(context),
    detailsTextRows: renderDetailsTextRows(context.details),
  };

  const html = wrapEmailLayout({
    title: `DO Suggestion Void - ${context.cabang}`,
    preheader: `Void DO Suggestion ${context.spbNumber} pada cabang ${context.cabang}`,
    heading: 'Notifikasi Void DO Suggestion',
    subheading: `${context.cabang} • ${context.spbNumber}`,
    content: replacePlaceholders(bodyTemplate, {
      actionMessage: buildActionMessage(context),
      infoBox,
      detailsTable: renderDetailsTable(context.details),
    }),
    footer: `Email ini dikirim otomatis pada ${context.generatedAt}. Mohon tidak membalas email ini.`,
  });

  return {
    subject: buildSubject(context),
    html,
    text: replacePlaceholders(textTemplate, placeholders),
  };
}
