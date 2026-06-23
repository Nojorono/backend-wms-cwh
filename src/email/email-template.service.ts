import { Injectable } from '@nestjs/common';
import { INDONESIA_TIMEZONE } from '../core/utils/date-transformer.util';
import { renderCallPlanReminderEmail } from './template-email/call-plan-reminder.template';
import {
  CallPlanReminderTemplateContext,
  RenderedCallPlanReminderEmail,
} from './template-email/types/call-plan-reminder-template.interface';

@Injectable()
export class EmailTemplateService {
  renderCallPlanReminder(context: CallPlanReminderTemplateContext): RenderedCallPlanReminderEmail {
    return renderCallPlanReminderEmail({
      ...context,
      generatedAt: context.generatedAt || this.formatGeneratedAt(new Date()),
    });
  }

  private formatGeneratedAt(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: INDONESIA_TIMEZONE,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}
