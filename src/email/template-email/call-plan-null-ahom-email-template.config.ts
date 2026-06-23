import { ConfigService } from '@nestjs/config';
import { replacePlaceholders } from './email-html.util';
import { CallPlanNullAhomTemplateContext } from './types/call-plan-null-ahom-template.interface';

const DEFAULT_SUBJECT =
  '[Reminder Call Plan] {{cabang}} - {{callPlanStartDate}} - Sales Tanpa Call Plan';
const DEFAULT_HEADING = 'Reminder Call Plan — Sales Tanpa Call Plan';
const DEFAULT_SUBHEADING = 'Cabang {{cabang}} • Tanggal {{callPlanStartDate}}';
const DEFAULT_PREHEADER =
  '{{totalSales}} sales belum memiliki Call Plan pada tanggal {{callPlanStartDate}}';
const DEFAULT_INTRO =
  'Yth. {{ahomName}} ({{ahomNik}}), berikut daftar seluruh sales yang belum memiliki Call Plan untuk tanggal {{callPlanStartDate}}. Supervisor terkait dicantumkan sebagai CC untuk tindak lanjut.';
const DEFAULT_FOOTER =
  'Email ini dikirim otomatis pada {{generatedAt}}. Supervisor dicantumkan sebagai CC. Mohon tidak membalas email ini.';
const DEFAULT_BRAND = 'WMS Notification';

export function countCallPlanNullSales(context: CallPlanNullAhomTemplateContext): number {
  return context.supervisors.reduce((total, supervisor) => total + supervisor.sales.length, 0);
}

export function buildCallPlanNullAhomPlaceholderValues(
  context: CallPlanNullAhomTemplateContext,
): Record<string, string> {
  const totalSales = String(countCallPlanNullSales(context));
  const supervisorCount = String(context.supervisors.length);

  return {
    cabang: context.cabang,
    callPlanStartDate: context.callPlanStartDate,
    ahomName: context.ahomName,
    ahomNik: context.ahomNik,
    generatedAt: context.generatedAt,
    totalSales,
    supervisorCount,
  };
}

export function resolveCallPlanNullAhomTemplateTexts(
  configService: ConfigService,
  context: CallPlanNullAhomTemplateContext,
): {
  subject: string;
  heading: string;
  subheading: string;
  preheader: string;
  intro: string;
  footer: string;
  brand: string;
} {
  const placeholders = buildCallPlanNullAhomPlaceholderValues(context);

  return {
    subject: resolveEnvTemplate(
      configService,
      'CALL_PLAN_NULL_EMAIL_SUBJECT',
      DEFAULT_SUBJECT,
      placeholders,
    ),
    heading: resolveEnvTemplate(
      configService,
      'CALL_PLAN_NULL_EMAIL_HEADING',
      DEFAULT_HEADING,
      placeholders,
    ),
    subheading: resolveEnvTemplate(
      configService,
      'CALL_PLAN_NULL_EMAIL_SUBHEADING',
      DEFAULT_SUBHEADING,
      placeholders,
    ),
    preheader: resolveEnvTemplate(
      configService,
      'CALL_PLAN_NULL_EMAIL_PREHEADER',
      DEFAULT_PREHEADER,
      placeholders,
    ),
    intro: resolveEnvTemplate(
      configService,
      'CALL_PLAN_NULL_EMAIL_INTRO',
      DEFAULT_INTRO,
      placeholders,
    ),
    footer: resolveEnvTemplate(
      configService,
      'CALL_PLAN_NULL_EMAIL_FOOTER',
      DEFAULT_FOOTER,
      placeholders,
    ),
    brand: resolveEnvTemplate(
      configService,
      'CALL_PLAN_EMAIL_BRAND',
      DEFAULT_BRAND,
      placeholders,
    ),
  };
}

function resolveEnvTemplate(
  configService: ConfigService,
  envKey: string,
  defaultTemplate: string,
  placeholders: Record<string, string>,
): string {
  const raw = configService.get<string>(envKey)?.trim() || defaultTemplate;
  return replacePlaceholders(raw, placeholders);
}
