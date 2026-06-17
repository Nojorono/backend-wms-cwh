import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduledTaskModule } from '../scheduled-task.module';
import { ScheduledCallPlanCallbackHandler } from './scheduled-call-plan-callback.handler';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import { ScheduledCallPlanController } from './scheduled-call-plan.controller';
import { ScheduledCallPlanScheduler } from './scheduled-call-plan.scheduler';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@Module({
  imports: [ConfigModule, ScheduledTaskModule],
  controllers: [ScheduledCallPlanController],
  providers: [
    ScheduledCallPlanService,
    ScheduledCallPlanSnowflakeService,
    ScheduledCallPlanCallbackHandler,
    ScheduledCallPlanScheduler,
  ],
  exports: [ScheduledCallPlanService],
})
export class ScheduledCallPlanModule {}
