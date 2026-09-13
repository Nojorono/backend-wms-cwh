import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionPickingService } from './transaction-picking.service';
import { TransactionPickingController } from './transaction-picking.controller';
import { TransactionPickingRepository } from './transaction-picking.repository';
import { TransactionPickingCancelRevertService } from './transaction-picking-cancel-revert.service';
import { PickingTransaction } from '../core/domain/entities/transaction-picking.entity';
import { ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { PaginationModule } from '../core/modules/pagination.module';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PickingTransaction, ScanPickingTransaction]),
    PaginationModule,
    MasterPalletModule,
    InventoryTrackingModule,
  ],
  controllers: [TransactionPickingController],
  providers: [
    TransactionPickingService,
    TransactionPickingRepository,
    TransactionPickingCancelRevertService,
  ],
  exports: [TransactionPickingService, TransactionPickingRepository],
})
export class TransactionPickingModule {}
