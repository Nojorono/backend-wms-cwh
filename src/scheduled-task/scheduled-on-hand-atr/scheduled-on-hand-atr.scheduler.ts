import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledTaskService } from '../scheduled-task.service';
import {
  SCHEDULED_ON_HAND_ATR_CALLBACK_TYPE,
  SCHEDULED_ON_HAND_ATR_FETCH_ALL_CRON,
  SCHEDULED_ON_HAND_ATR_FETCH_ALL_JOB_NAME,
  SCHEDULED_ON_HAND_ATR_FETCH_ALL_TIMEZONE,
  ScheduledOnHandAtrScheduleMode,
} from './scheduled-on-hand-atr.constants';

@Injectable()
export class ScheduledOnHandAtrScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledOnHandAtrScheduler.name);

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
      this.logger.log('On-hand ATR auto-schedule is disabled (ON_HAND_ATR_SCHEDULE_MODE=off)');
      return;
    }

    const cronTime =
      this.configService.get<string>('ON_HAND_ATR_CRON')?.trim() ||
      SCHEDULED_ON_HAND_ATR_FETCH_ALL_CRON;
    const timezone =
      this.configService.get<string>('ON_HAND_ATR_CRON_TIMEZONE')?.trim() ||
      SCHEDULED_ON_HAND_ATR_FETCH_ALL_TIMEZONE;

    await this.scheduledTaskService.ensureCronJob({
      name: SCHEDULED_ON_HAND_ATR_FETCH_ALL_JOB_NAME,
      cronTime,
      callbackType: SCHEDULED_ON_HAND_ATR_CALLBACK_TYPE,
      timezone,
      persist: mode === 'database',
    });

    this.logger.log(
      `On-hand ATR schedule ensured mode=${mode} cron="${cronTime}" timezone=${timezone}`,
    );
  }

  private resolveScheduleMode(): ScheduledOnHandAtrScheduleMode {
    const raw = this.configService.get<string>('ON_HAND_ATR_SCHEDULE_MODE')?.trim().toLowerCase();

    if (raw === 'memory' || raw === 'in-memory' || raw === 'cron') {
      return 'memory';
    }
    if (raw === 'off' || raw === 'disabled' || raw === 'false' || raw === '0') {
      return 'off';
    }

    return 'database';
  }
}
