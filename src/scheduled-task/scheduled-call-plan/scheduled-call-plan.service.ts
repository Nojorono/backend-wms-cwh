import { Injectable } from '@nestjs/common';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import { ScheduledCallPlanFetchResult } from './types/scheduled-call-plan-data.interface';
import { ScheduledCallPlanFetchPayload } from './types/scheduled-call-plan-fetch-payload.interface';

@Injectable()
export class ScheduledCallPlanService {
  constructor(private readonly snowflakeService: ScheduledCallPlanSnowflakeService) {}

  async runFetchNow(
    payload?: ScheduledCallPlanFetchPayload,
  ): Promise<ScheduledCallPlanFetchResult> {
    return await this.fetchCallPlan(payload ?? {});
  }

  async runFetchNowFromJob(job: ScheduledTask): Promise<ScheduledCallPlanFetchResult> {
    return await this.fetchCallPlan(this.parsePayload(job.payload));
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
