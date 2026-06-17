import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskCallbackHandler } from '../interfaces/scheduled-task-callback.handler.interface';
import { ScheduledTaskCallbackRegistry } from '../scheduled-task-callback.registry';
import { SCHEDULED_CALL_PLAN_CALLBACK_TYPE } from '../scheduled-task.constants';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@Injectable()
export class ScheduledCallPlanCallbackHandler
  implements ScheduledTaskCallbackHandler, OnModuleInit
{
  readonly callbackType = SCHEDULED_CALL_PLAN_CALLBACK_TYPE;

  private readonly logger = new Logger(ScheduledCallPlanCallbackHandler.name);

  constructor(
    private readonly callbackRegistry: ScheduledTaskCallbackRegistry,
    private readonly callPlanService: ScheduledCallPlanService,
  ) {}

  onModuleInit(): void {
    this.callbackRegistry.register(this);
  }

  async execute(job: ScheduledTask): Promise<void> {
    const result = await this.callPlanService.runFetchNowFromJob(job);

    this.logger.log(
      `[${job.name}] Fetched ${result.data.length} call plan supervisor record(s) for ${result.callPlanStartDate}`,
    );
  }
}
