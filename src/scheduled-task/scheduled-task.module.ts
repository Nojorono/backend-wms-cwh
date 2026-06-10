import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledTask } from '../core/domain/entities/scheduled-task.entity';
import { ScheduledCallPlanModule } from './scheduled-call-plan/scheduled-call-plan.module';
import { ScheduledTaskController } from './scheduled-task.controller';
import { ScheduledTaskRepository } from './scheduled-task.repository';
import { ScheduledTaskService } from './scheduled-task.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ScheduledTask]),
    forwardRef(() => ScheduledCallPlanModule),
  ],
  controllers: [ScheduledTaskController],
  providers: [ScheduledTaskService, ScheduledTaskRepository],
  exports: [ScheduledTaskService],
})
export class ScheduledTaskModule {}
