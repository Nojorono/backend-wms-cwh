import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledTaskService } from '../scheduled-task.service';
import {
  SCHEDULED_SPB_SUBMITTED_CALLBACK_TYPE,
  SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_CRON,
  SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_JOB_NAME,
  SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_TIMEZONE,
  ScheduledSpbSubmittedScheduleMode,
} from './scheduled-spb-submitted.constants';

@Injectable()
export class ScheduledSpbSubmittedScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledSpbSubmittedScheduler.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly scheduledTaskService: ScheduledTaskService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.bootstrap();
  }

  async bootstrap(): Promise<void> {
    const mode = this.resolveScheduleMode();
    if (mode === 'off') {
      this.logger.log('SPB submitted auto-schedule is disabled (SPB_SUBMITTED_SCHEDULE_MODE=off)');
      return;
    }

    const cronTime =
      this.configService.get<string>('SPB_SUBMITTED_CRON')?.trim() ||
      SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_CRON;
    const timezone =
      this.configService.get<string>('SPB_SUBMITTED_CRON_TIMEZONE')?.trim() ||
      SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_TIMEZONE;

    await this.scheduledTaskService.ensureCronJob({
      name: SCHEDULED_SPB_SUBMITTED_SUBMIT_ALL_JOB_NAME,
      cronTime,
      callbackType: SCHEDULED_SPB_SUBMITTED_CALLBACK_TYPE,
      timezone,
      persist: mode === 'database',
    });

    this.logger.log(
      `SPB submitted schedule ensured mode=${mode} cron="${cronTime}" timezone=${timezone}`,
    );
  }

  private resolveScheduleMode(): ScheduledSpbSubmittedScheduleMode {
    const raw = this.configService
      .get<string>('SPB_SUBMITTED_SCHEDULE_MODE')
      ?.trim()
      .toLowerCase();

    if (raw === 'memory' || raw === 'in-memory' || raw === 'cron') {
      return 'memory';
    }
    if (raw === 'off' || raw === 'disabled' || raw === 'false' || raw === '0') {
      return 'off';
    }

    return 'database';
  }
}
