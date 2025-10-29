import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundDoService } from './outbound-do.service';
import { OutboundDoController } from './outbound-do.controller';
import { OutboundDoRepository } from './outbound-do.repository';
import { PickingSuggestionService } from './picking-suggestion.service';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoItem } from '../core/domain/entities/outbound-memo-item.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutboundDo,
      OutboundMemo,
      OutboundMemoItem,
      InventoryTracking,
      MasterItem,
      MasterWarehouseBin,
      MasterWarehouseSub,
      MasterWarehouse,
      MasterPallet,
    ]),
  ],
  controllers: [OutboundDoController],
  providers: [OutboundDoService, OutboundDoRepository, PickingSuggestionService],
  exports: [OutboundDoService, OutboundDoRepository, PickingSuggestionService],
})
export class OutboundDoModule {}
