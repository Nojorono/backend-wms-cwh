import { Injectable, Logger } from '@nestjs/common';
import { SendEmailResponseDto } from '../../email/dto/send-email-response.dto';
import { EmailService } from '../../email/email.service';
import { UserDetailRepository } from '../../users/user-detail.repository';
import { buildCallPlanReminderContexts } from './call-plan-reminder.mapper';
import { CallPlanAhomGroupedData } from './types/scheduled-call-plan-data.interface';

export interface CallPlanReminderSendSummary {
  attempted: number;
  sent: number;
  skippedMissingEmail: number;
  results: SendEmailResponseDto[];
}

@Injectable()
export class ScheduledCallPlanEmailService {
  private readonly logger = new Logger(ScheduledCallPlanEmailService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly userDetailRepository: UserDetailRepository,
  ) {}

  buildReminderContexts(groupedData: CallPlanAhomGroupedData[], callPlanStartDate: string) {
    return buildCallPlanReminderContexts(groupedData, callPlanStartDate);
  }

  async sendRemindersForGroupedData(
    groupedData: CallPlanAhomGroupedData[],
    callPlanStartDate: string,
  ): Promise<CallPlanReminderSendSummary> {
    const contexts = this.buildReminderContexts(groupedData, callPlanStartDate);
    const niks = contexts.flatMap((context) => [context.supervisorNik, context.ahomNik]);
    const emailMap = await this.userDetailRepository.findEmailMapByNik(niks);

    const results: SendEmailResponseDto[] = [];
    let skippedMissingEmail = 0;

    for (const context of contexts) {
      const supervisorNik = context.supervisorNik.trim().toUpperCase();
      const ahomNik = context.ahomNik.trim().toUpperCase();
      const supervisorEmail = emailMap.get(supervisorNik);
      const ahomEmail = emailMap.get(ahomNik);

      if (!supervisorEmail) {
        skippedMissingEmail += 1;
        this.logger.warn(
          `Skip call plan reminder for supervisor NIK=${context.supervisorNik}: supervisorEmail=NOT_FOUND`,
        );
        continue;
      }

      if (!ahomEmail) {
        this.logger.warn(
          `AHOM email not found for NIK=${context.ahomNik}; sending reminder to supervisor only`,
        );
      }

      const result = await this.emailService.sendCallPlanReminderEmail({
        supervisorEmail: [supervisorEmail],
        ahomEmail: ahomEmail ? [ahomEmail] : undefined,
        body: {
          callPlanStartDate: context.callPlanStartDate,
          cabang: context.cabang,
          supervisorName: context.supervisorName,
          supervisorNik: context.supervisorNik,
          ahomName: context.ahomName,
          ahomNik: context.ahomNik,
          sales: context.sales,
        },
      });
      results.push(result);

      this.logger.log(
        `Sent call plan reminder to supervisor=${supervisorEmail}` +
          `${ahomEmail ? ` cc ahom=${ahomEmail}` : ''} cabang=${context.cabang}`,
      );
    }

    return {
      attempted: contexts.length,
      sent: results.length,
      skippedMissingEmail,
      results,
    };
  }
}
