import { Injectable, Logger } from '@nestjs/common';
import { SendEmailResponseDto } from '../../email/dto/send-email-response.dto';
import { EmailService } from '../../email/email.service';
import { CallPlanReminderTemplateContext } from '../../email/template-email/types/call-plan-reminder-template.interface';
import { UserDetailRepository } from '../../users/user-detail.repository';
import {
  buildCallPlanNullAhomContexts,
  buildCallPlanReminderContexts,
} from './call-plan-reminder.mapper';
import { CallPlanAhomGroupedData } from './types/scheduled-call-plan-data.interface';

export interface CallPlanReminderSendSummary {
  attempted: number;
  sent: number;
  skippedMissingSupervisorEmail: number;
  skippedNoData: number;
  results: SendEmailResponseDto[];
}

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

  /** Sends per-supervisor reminders using renderCallPlanReminder (TO supervisor, CC AHOM). */
  async sendCallPlanRemindersForGroupedData(
    groupedData: CallPlanAhomGroupedData[],
    callPlanStartDate: string,
  ): Promise<CallPlanReminderSendSummary> {
    const contexts = buildCallPlanReminderContexts(groupedData, callPlanStartDate);
    if (!contexts.length) {
      this.logger.log('No supervisor groups with missing call plan data to email');
      return {
        attempted: 0,
        sent: 0,
        skippedMissingSupervisorEmail: 0,
        skippedNoData: groupedData.length,
        results: [],
      };
    }

    const niks = contexts.flatMap((context) => [context.supervisorNik, context.ahomNik]);
    const emailMap = await this.userDetailRepository.findEmailMapByNik(niks);

    const results: SendEmailResponseDto[] = [];
    let skippedMissingSupervisorEmail = 0;

    for (const context of contexts) {
      const supervisorNik = context.supervisorNik.trim().toUpperCase();
      const supervisorEmail = emailMap.get(supervisorNik);

      if (!supervisorEmail) {
        skippedMissingSupervisorEmail += 1;
        this.logger.warn(
          `Skip call plan reminder for supervisor NIK=${context.supervisorNik} cabang=${context.cabang}: supervisorEmail=NOT_FOUND`,
        );
        continue;
      }

      const ahomEmail = emailMap.get(context.ahomNik.trim().toUpperCase());
      if (!ahomEmail) {
        this.logger.warn(
          `No AHOM email found for NIK=${context.ahomNik}; sending supervisor reminder without CC`,
        );
      }

      const result = await this.emailService.sendCallPlanReminderEmail({
        supervisorEmail: [supervisorEmail],
        ahomEmail: ahomEmail ? [ahomEmail] : undefined,
        body: this.toCallPlanReminderBody(context),
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
      skippedMissingSupervisorEmail,
      skippedNoData: 0,
      results,
    };
  }

  /** Sends AHOM summary reminders using renderCallPlanNullAhom (TO AHOM, CC supervisors). */
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

  private toCallPlanReminderBody(context: CallPlanReminderTemplateContext) {
    return {
      callPlanStartDate: context.callPlanStartDate,
      cabang: context.cabang,
      supervisorName: context.supervisorName,
      supervisorNik: context.supervisorNik,
      ahomName: context.ahomName,
      ahomNik: context.ahomNik,
      sales: context.sales,
      generatedAt: context.generatedAt,
    };
  }
}
