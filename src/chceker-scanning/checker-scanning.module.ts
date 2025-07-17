import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';
import { CheckerScanningController } from './checker-scanning.controller';
import { CheckerScanningService } from './checker-scanning.service';
import { CheckerScanningRepository } from './checker-scanning.repository';
import { User } from 'src/core/domain/entities/user.entity';
import { InboundDeliveryOrder } from 'src/core/domain/entities/inbound-delivery-order.entity';
import { InboundPlan } from 'src/core/domain/entities/inbound-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckerScanning, User, InboundDeliveryOrder, InboundPlan])],
  controllers: [CheckerScanningController],
  providers: [
    CheckerScanningService,
    CheckerScanningRepository,
  ],
  exports: [CheckerScanningService],
})
export class CheckerScanningModule {} 