import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionScanPickingController } from './transaction-scan-picking.controller';
import { TransactionScanPickingService } from './transaction-scan-picking.service';
import { TransactionScanPickingRepository } from './transaction-scan-picking.repository';
import { ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { TransactionPickingModule } from '../transaction-picking/transaction-picking.module';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScanPickingTransaction]),
    TransactionPickingModule,
    MasterPalletModule,
  ],
  controllers: [TransactionScanPickingController],
  providers: [TransactionScanPickingService, TransactionScanPickingRepository],
  exports: [TransactionScanPickingService],
})
export class TransactionScanPickingModule {}

