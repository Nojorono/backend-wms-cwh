import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingHistory } from '../core/domain/entities/inventory-tracking-history.entity';
import { InventoryTrackingController } from './inventory-tracking.controller';
import { InventoryTrackingService } from './inventory-tracking.service';
import { InventoryTrackingRepository } from './inventory-tracking.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryTracking, InventoryTrackingHistory])],
  controllers: [InventoryTrackingController],
  providers: [InventoryTrackingService, InventoryTrackingRepository],
  exports: [InventoryTrackingService],
})
export class InventoryTrackingModule {}


