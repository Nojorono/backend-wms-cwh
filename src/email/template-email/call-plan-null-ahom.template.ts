import { ConfigService } from '@nestjs/config';
import {
  buildCallPlanNullAhomPlaceholderValues,
  resolveCallPlanNullAhomTemplateTexts,
} from './call-plan-null-ahom-email-template.config';
import {
  escapeHtml,
  loadEmailTemplate,
  renderDataTable,
  renderInfoBox,
  replacePlaceholders,
  wrapEmailLayout,
} from './email-html.util';
import {
  CallPlanNullAhomSupervisorBlock,
  CallPlanNullAhomTemplateContext,
  RenderedCallPlanNullAhomEmail,
} from './types/call-plan-null-ahom-template.interface';

function formatLuarkota(value: boolean): string {
  return value ? 'Ya' : 'Tidak';
}

function renderSupervisorSalesTable(supervisor: CallPlanNullAhomSupervisorBlock): string {
  const rows = supervisor.sales.map((row, index) => [
    escapeHtml(String(index + 1)),
    escapeHtml(row.salesName),
    escapeHtml(row.salesNik),
    escapeHtml(row.routeNumber || '-'),
    escapeHtml(row.callPlanStartDate || '-'),
    escapeHtml(row.callPlanEndDate || '-'),
    escapeHtml(formatLuarkota(row.isLuarkota)),
  ]);

  return renderDataTable(
    ['No', 'Sales', 'NIK Sales', 'Route', 'Start Date', 'End Date', 'Luar Kota'],
    rows,
    'Tidak ada data sales.',
  );
}

function renderSupervisorSalesSectionsHtml(supervisors: CallPlanNullAhomSupervisorBlock[]): string {
  if (!supervisors.length) {
    return '<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;">Tidak ada data supervisor dan sales tanpa Call Plan.</p>';
  }

  return supervisors
    .map(
      (supervisor) => `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#111827;padding:0 0 10px 0;">
      <strong>Supervisor:</strong> ${escapeHtml(supervisor.supervisorName)} (${escapeHtml(supervisor.supervisorNik)})
    </td>
  </tr>
  <tr>
    <td>
      ${renderSupervisorSalesTable(supervisor)}
    </td>
  </tr>
</table>`,
    )
    .join('\n');
}

function renderSupervisorSalesSectionsText(supervisors: CallPlanNullAhomSupervisorBlock[]): string {
  if (!supervisors.length) {
    return '- Tidak ada data supervisor dan sales tanpa Call Plan.';
  }

  return supervisors
    .map((supervisor) => {
      const salesLines = supervisor.sales.length
        ? supervisor.sales
            .map(
              (row, index) =>
                `  ${index + 1}. ${row.salesName} (${row.salesNik}) | Route: ${row.routeNumber || '-'} | ` +
                `Start: ${row.callPlanStartDate || '-'} | End: ${row.callPlanEndDate || '-'} | ` +
                `Luar Kota: ${formatLuarkota(row.isLuarkota)}`,
            )
            .join('\n')
        : '  - Tidak ada data sales.';

      return `Supervisor: ${supervisor.supervisorName} (${supervisor.supervisorNik})\n${salesLines}`;
    })
    .join('\n\n');
}

function renderNullCallPlanContent(
  context: CallPlanNullAhomTemplateContext,
  texts: ReturnType<typeof resolveCallPlanNullAhomTemplateTexts>,
): string {
  const bodyTemplate = loadEmailTemplate('call-plan-null-ahom.body.html');
  const placeholders = buildCallPlanNullAhomPlaceholderValues(context);

  const infoBox = renderInfoBox([
    { label: 'AHOM', value: `${context.ahomName} (${context.ahomNik})` },
    { label: 'Cabang', value: context.cabang },
    { label: 'Tanggal Call Plan', value: context.callPlanStartDate },
    { label: 'Jumlah Supervisor', value: placeholders.supervisorCount },
    { label: 'Jumlah Sales', value: placeholders.totalSales },
  ]);

  return replacePlaceholders(bodyTemplate, {
    intro: escapeHtml(texts.intro),
    infoBox,
    supervisorSections: renderSupervisorSalesSectionsHtml(context.supervisors),
  });
}

export function renderCallPlanNullAhomEmail(
  context: CallPlanNullAhomTemplateContext,
  configService: ConfigService,
): RenderedCallPlanNullAhomEmail {
  const texts = resolveCallPlanNullAhomTemplateTexts(configService, context);
  const placeholders = buildCallPlanNullAhomPlaceholderValues(context);
  const textTemplate = loadEmailTemplate('call-plan-null-ahom.txt');

  const html = wrapEmailLayout({
    title: texts.subject,
    preheader: texts.preheader,
    brand: texts.brand,
    heading: texts.heading,
    subheading: texts.subheading,
    content: renderNullCallPlanContent(context, texts),
    footer: texts.footer,
  });

  return {
    subject: texts.subject,
    html,
    text: replacePlaceholders(textTemplate, {
      ...placeholders,
      intro: texts.intro,
      supervisorSalesSections: renderSupervisorSalesSectionsText(context.supervisors),
    }),
  };
}
