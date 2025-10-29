import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PutAwayController } from './put-away.controller';
import { PutAwayService } from './put-away.service';
import { PutAwayRepository } from './put-away.repository';
import { PutAwayTransaction } from 'src/core/domain/entities/transaction-put-away.entity';
import { InventoryTrackingModule } from 'src/inventory-tracking/inventory-tracking.module';
import { MasterWarehouseBinModule } from 'src/master-warehouse-bin/master-warehouse-bin.module';
import { MasterPalletModule } from 'src/master-pallet/master-pallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PutAwayTransaction]),
    InventoryTrackingModule,
    MasterWarehouseBinModule,
    MasterPalletModule,
  ],
  controllers: [PutAwayController],
  providers: [PutAwayService, PutAwayRepository],
  exports: [PutAwayService],
})
export class PutAwayModule {}
