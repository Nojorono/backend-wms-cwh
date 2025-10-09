import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingHistory } from '../core/domain/entities/inventory-tracking-history.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { InventoryTrackingController } from './inventory-tracking.controller';
import { InventoryTrackingService } from './inventory-tracking.service';
import { InventoryTrackingRepository } from './inventory-tracking.repository';
import { InventoryAutoSuggestionService } from './auto-suggestion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryTracking, 
      InventoryTrackingHistory,
      MasterPallet,
      MasterItem,
      MasterWarehouse,
      MasterWarehouseSub,
      MasterWarehouseBin
    ])
  ],
  controllers: [InventoryTrackingController],
  providers: [InventoryTrackingService, InventoryTrackingRepository, InventoryAutoSuggestionService],
  exports: [InventoryTrackingService, InventoryAutoSuggestionService],
})
export class InventoryTrackingModule {}


