import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { TransactionScanInboundController } from './transaction-scan-inbound.controller';
import { TransactionScanInboundService } from './transaction-scan-inbound.service';
import { TransactionScanInboundRepository } from './transaction-scan-inbound.repository';
import { MasterPallet } from 'src/core/domain/entities/master-pallet.entity';
import { MasterPalletModule } from 'src/master-pallet/master-pallet.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionScanInbound, MasterPallet]), MasterPalletModule],
  controllers: [TransactionScanInboundController],
  providers: [TransactionScanInboundService, TransactionScanInboundRepository ],
  exports: [TransactionScanInboundService],
})
export class TransactionScanInboundModule {}


