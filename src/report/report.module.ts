import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportRepository } from './report.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Inbound, OutboundDo])],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
})
export class ReportModule {}
