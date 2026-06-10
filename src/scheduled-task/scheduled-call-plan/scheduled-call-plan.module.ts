import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduledTaskModule } from '../scheduled-task.module';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import { ScheduledCallPlanController } from './scheduled-call-plan.controller';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@Module({
  imports: [ConfigModule, forwardRef(() => ScheduledTaskModule)],
  controllers: [ScheduledCallPlanController],
  providers: [ScheduledCallPlanService, ScheduledCallPlanSnowflakeService],
  exports: [ScheduledCallPlanService],
})
export class ScheduledCallPlanModule {}
