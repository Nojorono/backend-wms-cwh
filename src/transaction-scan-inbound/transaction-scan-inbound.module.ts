import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { TransactionScanInboundController } from './transaction-scan-inbound.controller';
import { TransactionScanInboundService } from './transaction-scan-inbound.service';
import { TransactionScanInboundRepository } from './transaction-scan-inbound.repository';
import { MasterPallet } from 'src/core/domain/entities/master-pallet.entity';
import { MasterItem } from 'src/core/domain/entities/master-item.entity';
import { MasterWarehouseSub } from 'src/core/domain/entities/master-warehouse-sub.entity';
import { MasterPalletModule } from 'src/master-pallet/master-pallet.module';
import { MasterItemModule } from 'src/master-item/master-item.module';
import { MasterWarehouseSubModule } from 'src/master-warehouse-sub/master-warehouse-sub.module';
import { InventoryTrackingModule } from 'src/inventory-tracking/inventory-tracking.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionScanInbound,
      MasterPallet,
      MasterItem,
      MasterWarehouseSub,
    ]),
    MasterPalletModule,
    MasterItemModule,
    MasterWarehouseSubModule,
    InventoryTrackingModule,
    NotificationModule,
  ],
  controllers: [TransactionScanInboundController],
  providers: [TransactionScanInboundService, TransactionScanInboundRepository],
  exports: [TransactionScanInboundService],
})
export class TransactionScanInboundModule {}
