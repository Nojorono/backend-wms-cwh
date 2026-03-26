import { Module } from '@nestjs/common';
import { InboundModule } from '../inbound/inbound.module';
import { ReportController } from './report.controller';

@Module({
  imports: [InboundModule],
  controllers: [ReportController],
})
export class ReportModule {}
