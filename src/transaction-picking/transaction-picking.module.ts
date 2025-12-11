import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionPickingService } from './transaction-picking.service';
import { TransactionPickingController } from './transaction-picking.controller';
import { TransactionPickingRepository } from './transaction-picking.repository';
import { PickingTransaction } from '../core/domain/entities/transaction-picking.entity';
import { PaginationModule } from '../core/modules/pagination.module';
import { TransactionScanPickingModule } from '../transaction-scan-picking/transaction-scan-picking.module';
import { InventoryTrackingModule } from '../inventory-tracking/inventory-tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PickingTransaction]),
    PaginationModule,
    forwardRef(() => TransactionScanPickingModule),
    InventoryTrackingModule,
  ],
  controllers: [TransactionPickingController],
  providers: [TransactionPickingService, TransactionPickingRepository],
  exports: [TransactionPickingService, TransactionPickingRepository],
})
export class TransactionPickingModule {}
