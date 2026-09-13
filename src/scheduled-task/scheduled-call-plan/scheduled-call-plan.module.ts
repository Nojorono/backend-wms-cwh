import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../../email/email.module';
import { UserModule } from '../../users/user.module';
import { ScheduledTaskModule } from '../scheduled-task.module';
import { ScheduledCallPlanCallbackHandler } from './scheduled-call-plan-callback.handler';
import { ScheduledCallPlanEmailService } from './scheduled-call-plan-email.service';
import { ScheduledCallPlanSnowflakeService } from './scheduled-call-plan-snowflake.service';
import { ScheduledCallPlanScheduler } from './scheduled-call-plan.scheduler';
import { ScheduledCallPlanService } from './scheduled-call-plan.service';

@Module({
  imports: [ConfigModule, EmailModule, UserModule, forwardRef(() => ScheduledTaskModule)],
  providers: [
    ScheduledCallPlanService,
    ScheduledCallPlanSnowflakeService,
    ScheduledCallPlanEmailService,
    ScheduledCallPlanCallbackHandler,
    ScheduledCallPlanScheduler,
  ],
  exports: [ScheduledCallPlanService, ScheduledCallPlanScheduler, ScheduledCallPlanEmailService],
})
export class ScheduledCallPlanModule {}
