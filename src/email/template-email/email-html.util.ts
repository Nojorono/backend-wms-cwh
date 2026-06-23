import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const TEMPLATE_ROOT_CANDIDATES = [
  __dirname,
  join(process.cwd(), 'dist', 'email', 'template-email'),
  join(process.cwd(), 'src', 'email', 'template-email'),
];

function resolveTemplateRoot(): string {
  for (const candidate of TEMPLATE_ROOT_CANDIDATES) {
    if (existsSync(join(candidate, 'layouts', 'email-base.layout.html'))) {
      return candidate;
    }
  }

  throw new Error(
    `Email template root not found. Checked: ${TEMPLATE_ROOT_CANDIDATES.join(', ')}`,
  );
}

export function loadEmailTemplate(relativePath: string): string {
  const root = resolveTemplateRoot();
  const fullPath = join(root, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Email template not found: ${fullPath}`);
  }
  return readFileSync(fullPath, 'utf8');
}

export function escapeHtml(value: string | null | undefined): string {
  if (value == null) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function replacePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template,
  );
}

export interface EmailLayoutOptions {
  title: string;
  preheader: string;
  brand?: string;
  heading: string;
  subheading: string;
  content: string;
  footer: string;
}

export function wrapEmailLayout(options: EmailLayoutOptions): string {
  const layout = loadEmailTemplate('layouts/email-base.layout.html');

  return replacePlaceholders(layout, {
    emailTitle: escapeHtml(options.title),
    emailPreheader: escapeHtml(options.preheader),
    emailBrand: escapeHtml(options.brand ?? 'WMS Notification'),
    emailHeading: escapeHtml(options.heading),
    emailSubheading: escapeHtml(options.subheading),
    emailContent: options.content,
    emailFooter: escapeHtml(options.footer),
  });
}

export function renderInfoBox(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .map(
      (row) => `<tr>
  <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#374151;padding:4px 0;">
    <strong style="color:#111827;">${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}
  </td>
</tr>`,
    )
    .join('');

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px;background-color:#f8fafc;border:1px solid #e5e7eb;">
  <tr>
    <td style="padding:16px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${body}
      </table>
    </td>
  </tr>
</table>`;
}

export function renderDataTable(
  headers: string[],
  rows: string[][],
  emptyMessage = 'Tidak ada data.',
): string {
  const headerCells = headers
    .map(
      (header) =>
        `<th align="left" bgcolor="#eef2ff" style="background-color:#eef2ff;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:bold;color:#1e3a8a;padding:10px 12px;border-bottom:1px solid #dbeafe;white-space:nowrap;">${escapeHtml(header)}</th>`,
    )
    .join('');

  const bodyRows =
    rows.length > 0
      ? rows
          .map(
            (cells) => `<tr>
  ${cells
    .map(
      (cell) =>
        `<td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#374151;padding:10px 12px;border-bottom:1px solid #f3f4f6;vertical-align:top;">${cell}</td>`,
    )
    .join('\n  ')}
</tr>`,
          )
          .join('\n')
      : `<tr><td colspan="${headers.length}" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6b7280;padding:16px 12px;">${escapeHtml(emptyMessage)}</td></tr>`;

  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="data-table-wrap" style="border:1px solid #e5e7eb;">
  <tr>
    <td style="padding:0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="min-width:520px;">
        <thead>
          <tr>${headerCells}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </td>
  </tr>
</table>`;
}

export function renderParagraph(text: string, options?: { bold?: boolean }): string {
  const style =
    'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#374151;margin:0;padding:0 0 16px 0;';
  const content = options?.bold ? `<strong>${escapeHtml(text)}</strong>` : escapeHtml(text);
  return `<p style="${style}">${content}</p>`;
}
