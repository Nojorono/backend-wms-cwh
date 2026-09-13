import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ScheduledTask } from '../../core/domain/entities/scheduled-task.entity';
import { ScheduledTaskCallbackHandler } from '../interfaces/scheduled-task-callback.handler.interface';
import { ScheduledTaskCallbackRegistry } from '../scheduled-task-callback.registry';
import { SCHEDULED_ON_HAND_ATR_CALLBACK_TYPE } from '../scheduled-task.constants';
import { ScheduledOnHandAtrService } from './scheduled-on-hand-atr.service';

@Injectable()
export class ScheduledOnHandAtrCallbackHandler
  implements ScheduledTaskCallbackHandler, OnModuleInit
{
  readonly callbackType = SCHEDULED_ON_HAND_ATR_CALLBACK_TYPE;

  private readonly logger = new Logger(ScheduledOnHandAtrCallbackHandler.name);

  constructor(
    private readonly callbackRegistry: ScheduledTaskCallbackRegistry,
    private readonly onHandAtrService: ScheduledOnHandAtrService,
  ) {}

  onModuleInit(): void {
    this.callbackRegistry.register(this);
  }

  async execute(job: ScheduledTask): Promise<void> {
    const result = await this.onHandAtrService.runFetchNowFromJob(job);

    this.logger.log(
      `[${job.name}] On-hand ATR date=${result.date} branches=${result.total_branches} ` +
        `processed=${result.processed_branches} skipped=${result.skipped_branches} ` +
        `failed=${result.failed_branches} total_rows=${result.total_rows}`,
    );
  }
}
