import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskCallbackHandler } from '../interfaces/scheduled-task-callback.handler.interface';
import { ScheduledTaskCallbackRegistry } from '../scheduled-task-callback.registry';
import { SCHEDULED_SPB_SUBMITTED_CALLBACK_TYPE } from '../scheduled-task.constants';
import { ScheduledSpbSubmittedService } from './scheduled-spb-submitted.service';

@Injectable()
export class ScheduledSpbSubmittedCallbackHandler
  implements ScheduledTaskCallbackHandler, OnModuleInit
{
  readonly callbackType = SCHEDULED_SPB_SUBMITTED_CALLBACK_TYPE;

  private readonly logger = new Logger(ScheduledSpbSubmittedCallbackHandler.name);

  constructor(
    private readonly callbackRegistry: ScheduledTaskCallbackRegistry,
    private readonly spbSubmittedService: ScheduledSpbSubmittedService,
  ) {}

  onModuleInit(): void {
    this.callbackRegistry.register(this);
  }

  async execute(job: ScheduledTask): Promise<void> {
    const result = await this.spbSubmittedService.runSubmitNowFromJob(job);

    this.logger.log(
      `[${job.name}] SPB submit pending=${result.total_pending} submitted=${result.submitted_count} ` +
        `skipped=${result.skipped_count} failed=${result.failed_count} lines=${result.updated_lines}`,
    );
  }
}
