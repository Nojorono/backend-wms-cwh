import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from '../core/domain/entities/inventory-movement.entity';
import { InventoryMovementPallet } from '../core/domain/entities/inventory-movement-pallet.entity';
import { InventoryMovementUser } from '../core/domain/entities/inventory-movment-user.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingHistory } from '../core/domain/entities/inventory-tracking-history.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { InventoryMovementController } from './inventory-movement.controller';
import { InventoryMovementService } from './inventory-movement.service';
import { InventoryMovementRepository } from './inventory-movement.repository';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';
import { PaginationService } from '../core/services/pagination.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovement,
      InventoryMovementPallet,
      InventoryMovementUser,
      InventoryTracking,
      InventoryTrackingHistory,
      MasterWarehouse,
      MasterWarehouseSub,
      MasterWarehouseBin,
      MasterPallet,
    ]),
    InventoryTrackingModule,
  ],
  controllers: [InventoryMovementController],
  providers: [InventoryMovementService, InventoryMovementRepository, PaginationService],
  exports: [InventoryMovementService],
})
export class InventoryMovementModule {}

