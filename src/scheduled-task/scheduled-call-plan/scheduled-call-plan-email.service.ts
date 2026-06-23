import { Injectable, Logger } from '@nestjs/common';
import { SendEmailResponseDto } from '../../email/dto/send-email-response.dto';
import { EmailService } from '../../email/email.service';
import { UserDetailRepository } from '../../users/user-detail.repository';
import {
  buildCallPlanNullAhomContexts,
} from './call-plan-reminder.mapper';
import { CallPlanAhomGroupedData } from './types/scheduled-call-plan-data.interface';

export interface CallPlanNullAhomSendSummary {
  attempted: number;
  sent: number;
  skippedMissingAhomEmail: number;
  skippedNoData: number;
  results: SendEmailResponseDto[];
}

@Injectable()
export class ScheduledCallPlanEmailService {
  private readonly logger = new Logger(ScheduledCallPlanEmailService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly userDetailRepository: UserDetailRepository,
  ) {}

  async sendNullCallPlanRemindersForGroupedData(
    groupedData: CallPlanAhomGroupedData[],
    callPlanStartDate: string,
  ): Promise<CallPlanNullAhomSendSummary> {
    const contexts = buildCallPlanNullAhomContexts(groupedData, callPlanStartDate);
    if (!contexts.length) {
      this.logger.log('No AHOM groups with missing call plan data to email');
      return {
        attempted: 0,
        sent: 0,
        skippedMissingAhomEmail: 0,
        skippedNoData: groupedData.length,
        results: [],
      };
    }

    const niks = contexts.flatMap((context) => [
      context.ahomNik,
      ...context.supervisors.map((supervisor) => supervisor.supervisorNik),
    ]);
    const emailMap = await this.userDetailRepository.findEmailMapByNik(niks);

    const results: SendEmailResponseDto[] = [];
    let skippedMissingAhomEmail = 0;

    for (const context of contexts) {
      const ahomNik = context.ahomNik.trim().toUpperCase();
      const ahomEmail = emailMap.get(ahomNik);

      if (!ahomEmail) {
        skippedMissingAhomEmail += 1;
        this.logger.warn(
          `Skip null call plan reminder for AHOM NIK=${context.ahomNik} cabang=${context.cabang}: ahomEmail=NOT_FOUND`,
        );
        continue;
      }

      const supervisorEmails = Array.from(
        new Set(
          context.supervisors
            .map((supervisor) => emailMap.get(supervisor.supervisorNik.trim().toUpperCase()))
            .filter((email): email is string => Boolean(email?.trim())),
        ),
      );

      if (!supervisorEmails.length) {
        this.logger.warn(
          `No supervisor emails found for AHOM NIK=${context.ahomNik}; sending to AHOM only`,
        );
      }

      const result = await this.emailService.sendCallPlanNullAhomEmail({
        ahomEmail: [ahomEmail],
        supervisorEmail: supervisorEmails.length ? supervisorEmails : undefined,
        body: {
          callPlanStartDate: context.callPlanStartDate,
          cabang: context.cabang,
          ahomName: context.ahomName,
          ahomNik: context.ahomNik,
          supervisors: context.supervisors,
        },
      });
      results.push(result);

      this.logger.log(
        `Sent null call plan reminder to ahom=${ahomEmail}` +
          `${supervisorEmails.length ? ` cc supervisors=${supervisorEmails.join(',')}` : ''} ` +
          `cabang=${context.cabang}`,
      );
    }

    return {
      attempted: contexts.length,
      sent: results.length,
      skippedMissingAhomEmail,
      skippedNoData: 0,
      results,
    };
  }
}
