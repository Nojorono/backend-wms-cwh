import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INDONESIA_TIMEZONE } from '../core/utils/date-transformer.util';
import { renderCallPlanNullAhomEmail } from './template-email/call-plan-null-ahom.template';
import { renderCallPlanReminderEmail } from './template-email/call-plan-reminder.template';
import {
  CallPlanNullAhomTemplateContext,
  RenderedCallPlanNullAhomEmail,
} from './template-email/types/call-plan-null-ahom-template.interface';
import {
  CallPlanReminderTemplateContext,
  RenderedCallPlanReminderEmail,
} from './template-email/types/call-plan-reminder-template.interface';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly configService: ConfigService) {}

  renderCallPlanReminder(context: CallPlanReminderTemplateContext): RenderedCallPlanReminderEmail {
    return renderCallPlanReminderEmail({
      ...context,
      generatedAt: context.generatedAt || this.formatGeneratedAt(new Date()),
    });
  }

  renderCallPlanNullAhom(
    context: CallPlanNullAhomTemplateContext,
  ): RenderedCallPlanNullAhomEmail {
    return renderCallPlanNullAhomEmail(
      {
        ...context,
        generatedAt: context.generatedAt || this.formatGeneratedAt(new Date()),
      },
      this.configService,
    );
  }

  private formatGeneratedAt(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: INDONESIA_TIMEZONE,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }
}
