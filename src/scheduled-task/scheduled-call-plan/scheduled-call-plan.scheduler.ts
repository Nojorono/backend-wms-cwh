import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledTaskService } from '../scheduled-task.service';
import {
  SCHEDULED_CALL_PLAN_CALLBACK_TYPE,
  SCHEDULED_CALL_PLAN_FETCH_ALL_CRON,
  SCHEDULED_CALL_PLAN_FETCH_ALL_JOB_NAME,
  SCHEDULED_CALL_PLAN_FETCH_ALL_TIMEZONE,
  ScheduledCallPlanScheduleMode,
} from './scheduled-call-plan.constants';

/**
 * Boots call-plan scheduling based on CALL_PLAN_SCHEDULE_MODE:
 * - database: persisted cron in scheduled_tasks (survives restart, API-manageable)
 * - memory: in-process NestJS cron via SchedulerRegistry (env-driven, no DB row)
 * - off: no automatic schedule; use POST /scheduled-task/call-plan/fetch-now only
 */
@Injectable()
export class ScheduledCallPlanScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledCallPlanScheduler.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly scheduledTaskService: ScheduledTaskService,
  ) { }

  async onApplicationBootstrap(): Promise<void> {
    // await this.bootstrap();
  }

  // async bootstrap(): Promise<void> {
  //   const mode = this.resolveScheduleMode();
  //   if (mode === 'off') {
  //     this.logger.log('Call plan auto-schedule is disabled (CALL_PLAN_SCHEDULE_MODE=off)');
  //     return;
  //   }

  //   const cronTime =
  //     this.configService.get<string>('CALL_PLAN_CRON')?.trim() || SCHEDULED_CALL_PLAN_FETCH_ALL_CRON;
  //   const timezone =
  //     this.configService.get<string>('CALL_PLAN_CRON_TIMEZONE')?.trim() ||
  //     SCHEDULED_CALL_PLAN_FETCH_ALL_TIMEZONE;

  //   await this.scheduledTaskService.ensureCronJob({
  //     name: SCHEDULED_CALL_PLAN_FETCH_ALL_JOB_NAME,
  //     cronTime,
  //     callbackType: SCHEDULED_CALL_PLAN_CALLBACK_TYPE,
  //     timezone,
  //     persist: mode === 'database',
  //   });

  //   this.logger.log(
  //     `Call plan schedule ensured mode=${mode} cron="${cronTime}" timezone=${timezone}`,
  //   );
  // }

  private resolveScheduleMode(): ScheduledCallPlanScheduleMode {
    const raw = this.configService.get<string>('CALL_PLAN_SCHEDULE_MODE')?.trim().toLowerCase();

    if (raw === 'memory' || raw === 'in-memory' || raw === 'cron') {
      return 'memory';
    }
    if (raw === 'off' || raw === 'disabled' || raw === 'false' || raw === '0') {
      return 'off';
    }

    return 'database';
  }
}
