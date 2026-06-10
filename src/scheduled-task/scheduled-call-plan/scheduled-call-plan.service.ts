import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  forwardRef,
} from '@nestjs/common';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskService } from '../scheduled-task.service';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import {
  SCHEDULED_CALL_PLAN_CALLBACK_TYPE,
  SCHEDULED_CALL_PLAN_FETCH_ALL_CRON,
  SCHEDULED_CALL_PLAN_FETCH_ALL_JOB_NAME,
  SCHEDULED_CALL_PLAN_FETCH_ALL_TIMEZONE,
} from './scheduled-call-plan.constants';
import { ScheduledCallPlanFetchResult } from './types/scheduled-call-plan-data.interface';
import { ScheduledCallPlanFetchPayload } from './types/scheduled-call-plan-fetch-payload.interface';

@Injectable()
export class ScheduledCallPlanService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledCallPlanService.name);

  constructor(
    private readonly snowflakeService: ScheduledCallPlanSnowflakeService,
    @Inject(forwardRef(() => ScheduledTaskService))
    private readonly scheduledTaskService: ScheduledTaskService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureDefaultFetchJob();
  }

  async ensureDefaultFetchJob(): Promise<void> {
    await this.scheduledTaskService.ensureCronJob({
      name: SCHEDULED_CALL_PLAN_FETCH_ALL_JOB_NAME,
      cronTime: SCHEDULED_CALL_PLAN_FETCH_ALL_CRON,
      callbackType: SCHEDULED_CALL_PLAN_CALLBACK_TYPE,
      timezone: SCHEDULED_CALL_PLAN_FETCH_ALL_TIMEZONE,
    });

    this.logger.log(`Ensured call plan job "${SCHEDULED_CALL_PLAN_FETCH_ALL_JOB_NAME}"`);
  }

  async runFetchNow(
    payload?: ScheduledCallPlanFetchPayload,
  ): Promise<ScheduledCallPlanFetchResult> {
    return await this.fetchCallPlan(payload ?? {});
  }

  async execute(job: ScheduledTask): Promise<void> {
    const payload = this.parsePayload(job.payload);
    const result = await this.fetchCallPlan(payload);

    this.logger.log(
      `[${job.name}] Fetched ${result.data.length} call plan supervisor record(s) for ${result.callPlanStartDate}`,
    );
  }

  private async fetchCallPlan(
    payload: ScheduledCallPlanFetchPayload,
  ): Promise<ScheduledCallPlanFetchResult> {
    return await this.snowflakeService.fetchCallPlan(payload.callPlanStartDate);
  }

  private parsePayload(payload: ScheduledTask['payload']): ScheduledCallPlanFetchPayload {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const parsed = payload as ScheduledCallPlanFetchPayload;

    return {
      callPlanStartDate:
        typeof parsed.callPlanStartDate === 'string' ? parsed.callPlanStartDate : undefined,
    };
  }
}
