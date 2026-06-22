import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduledTaskModule } from '../scheduled-task.module';
import { ScheduledCallPlanCallbackHandler } from './scheduled-call-plan-callback.handler';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import { ScheduledCallPlanScheduler } from './scheduled-call-plan.scheduler';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@Module({
  imports: [ConfigModule, forwardRef(() => ScheduledTaskModule)],
  providers: [
    ScheduledCallPlanService,
    ScheduledCallPlanSnowflakeService,
    ScheduledCallPlanCallbackHandler,
    ScheduledCallPlanScheduler,
  ],
  exports: [ScheduledCallPlanService, ScheduledCallPlanScheduler],
})
export class ScheduledCallPlanModule {}
