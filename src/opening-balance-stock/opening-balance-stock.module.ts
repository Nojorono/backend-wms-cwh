import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpeningBalanceStock } from '../core/domain/entities/opening-balance-stock.entity';
import { OpeningBalanceStockItem } from '../core/domain/entities/opening-balance-stock-item.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { OpeningBalanceStockController } from './opening-balance-stock.controller';
import { OpeningBalanceStockService } from './opening-balance-stock.service';
import { OpeningBalanceStockRepository } from './opening-balance-stock.repository';
import { PaginationService } from '../core/services/pagination.service';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OpeningBalanceStock,
      OpeningBalanceStockItem,
      MasterItem,
      MasterWarehouseSub,
      MasterWarehouseBin,
      MasterPallet,
      InventoryTracking,
    ]),
    MasterPalletModule,
    InventoryTrackingModule,
  ],
  controllers: [OpeningBalanceStockController],
  providers: [
    OpeningBalanceStockService,
    OpeningBalanceStockRepository,
    PaginationService,
  ],
  exports: [OpeningBalanceStockService, OpeningBalanceStockRepository],
})
export class OpeningBalanceStockModule {}
