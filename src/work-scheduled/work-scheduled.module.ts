import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkScheduled } from '../core/domain/entities/work-scheduled.entity';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { IndonesiaNationalHolidayService } from './data/indonesia-national-holiday.service';
import { WorkScheduledController } from './work-scheduled.controller';
import { WorkScheduledRepository } from './work-scheduled.repository';
import { WorkScheduledService } from './work-scheduled.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkScheduled, MasterIO])],
  controllers: [WorkScheduledController],
  providers: [WorkScheduledService, WorkScheduledRepository, IndonesiaNationalHolidayService],
  exports: [WorkScheduledService, WorkScheduledRepository, IndonesiaNationalHolidayService],
})
export class WorkScheduledModule {}
