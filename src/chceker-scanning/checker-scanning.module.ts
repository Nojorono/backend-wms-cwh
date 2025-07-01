import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckerScanning } from '../core/domain/entities/checker-scanning.entity';
import { CheckerScanningController } from './checker-scanning.controller';
import { CheckerScanningService } from './checker-scanning.service';
import { CheckerScanningRepository } from './checker-scanning.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CheckerScanning])],
  controllers: [CheckerScanningController],
  providers: [
    CheckerScanningService,
    CheckerScanningRepository,
  ],
  exports: [CheckerScanningService],
})
export class CheckerScanningModule {} 