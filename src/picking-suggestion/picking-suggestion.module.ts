import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PickingSuggestionController } from './picking-suggestion.controller';
import { PickingSuggestionService } from './picking-suggestion.service';
import { PickingSuggestionRepository } from './picking-suggestion.repository';
import { InventoryReservationService } from './inventory-reservation.service';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { OutboundMemo } from '../core/domain/entities/outbound-memo.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { PalletTransactionHistory } from '../core/domain/entities/transaction-pallet-history.entity';
import { PickingTransaction } from '../core/domain/entities/transaction-picking.entity';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OutboundDo,
      OutboundMemo,
      InventoryTracking,
      MasterItem,
      PalletTransactionHistory,
      PickingTransaction,
      MasterWarehouseBin,
      MasterWarehouseSub,
      TransactionScanInbound,
    ]),
    MasterPalletModule,
  ],
  controllers: [PickingSuggestionController],
  providers: [PickingSuggestionService, PickingSuggestionRepository, InventoryReservationService],
  exports: [PickingSuggestionService, PickingSuggestionRepository, InventoryReservationService],
})
export class PickingSuggestionModule {}

