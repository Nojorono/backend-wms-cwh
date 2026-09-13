import {
  escapeHtml,
  loadEmailTemplate,
  renderDataTable,
  renderInfoBox,
  replacePlaceholders,
  wrapEmailLayout,
} from './email-html.util';
import {
  CallPlanReminderSalesRow,
  CallPlanReminderTemplateContext,
  RenderedCallPlanReminderEmail,
} from './types/call-plan-reminder-template.interface';

function formatLuarkota(value: boolean): string {
  return value ? 'Ya' : 'Tidak';
}

function renderSalesTable(sales: CallPlanReminderSalesRow[]): string {
  const rows = sales.map((row, index) => [
    escapeHtml(String(index + 1)),
    escapeHtml(row.salesName),
    escapeHtml(row.salesNik),
    // escapeHtml(row.routeNumber || '-'),
    // escapeHtml(row.callPlanStartDate || '-'),
    // escapeHtml(row.callPlanEndDate || '-'),
    // escapeHtml(formatLuarkota(row.isLuarkota)),
  ]);

  return renderDataTable(
    ['No', 'Sales', 'NIK'],
    rows,
    'Tidak ada data sales.',
  );
}

function renderSalesTextRows(sales: CallPlanReminderSalesRow[]): string {
  if (!sales.length) {
    return '- Tidak ada data sales.';
  }

  return sales
    .map(
      (row, index) =>
        `${index + 1}. ${row.salesName} (${row.salesNik}) | Route: ${row.routeNumber || '-'} | Start: ${row.callPlanStartDate || '-'} | End: ${row.callPlanEndDate || '-'} | Luar Kota: ${formatLuarkota(row.isLuarkota)}`,
    )
    .join('\n');
}

function buildSubject(context: CallPlanReminderTemplateContext): string {
  return `[Reminder Call Plan] ${context.cabang} - ${context.callPlanStartDate} - ${context.supervisorName}`;
}

function renderCallPlanReminderContent(context: CallPlanReminderTemplateContext): string {
  const bodyTemplate = loadEmailTemplate('call-plan-reminder.body.html');

  const infoBox = renderInfoBox([
    { label: 'Supervisor', value: `${context.supervisorName} (${context.supervisorNik})` },
    { label: 'AHOM (CC)', value: `${context.ahomName} (${context.ahomNik})` },
    { label: 'Cabang', value: context.cabang },
    { label: 'Tanggal Call Plan', value: context.callPlanStartDate },
  ]);

  return replacePlaceholders(bodyTemplate, {
    supervisorName: escapeHtml(context.supervisorName),
    supervisorNik: escapeHtml(context.supervisorNik),
    callPlanStartDate: escapeHtml(context.callPlanStartDate),
    infoBox,
    salesTable: renderSalesTable(context.sales),
  });
}

export function renderCallPlanReminderEmail(
  context: CallPlanReminderTemplateContext,
): RenderedCallPlanReminderEmail {
  const textTemplate = loadEmailTemplate('call-plan-reminder.txt');

  const placeholders = {
    cabang: context.cabang,
    callPlanStartDate: context.callPlanStartDate,
    supervisorName: context.supervisorName,
    supervisorNik: context.supervisorNik,
    ahomName: context.ahomName,
    ahomNik: context.ahomNik,
    generatedAt: context.generatedAt,
  };

  const html = wrapEmailLayout({
    title: `Reminder Call Plan - ${context.cabang}`,
    preheader: `Reminder: ${context.sales.length} sales belum memiliki Call Plan pada ${context.callPlanStartDate}`,
    heading: 'Reminder Call Plan',
    subheading: `Cabang ${context.cabang} • Tanggal ${context.callPlanStartDate}`,
    content: renderCallPlanReminderContent(context),
    footer: `Email ini dikirim otomatis pada ${context.generatedAt}. AHOM dicantumkan sebagai CC untuk informasi. Mohon tidak membalas email ini.`,
  });

  return {
    subject: buildSubject(context),
    html,
    text: replacePlaceholders(textTemplate, {
      ...placeholders,
      salesTextRows: renderSalesTextRows(context.sales),
    }),
  };
}
