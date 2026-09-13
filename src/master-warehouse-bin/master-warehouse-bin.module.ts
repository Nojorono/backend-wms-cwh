import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { MasterWarehouseBinController } from './master-warehouse-bin.controller';
import { MasterWarehouseBinService } from './master-warehouse-bin.service';
import { MasterWarehouseBinRepository } from './master-warehouse-bin.repository';
import { S3Service } from 'src/infrastructure/services/s3.service';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';
import { MasterPalletModule } from '../master-pallet/master-pallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MasterWarehouseBin, MasterWarehouseSub, InventoryTracking]),
    MasterPalletModule,
  ],
  controllers: [MasterWarehouseBinController],
  providers: [MasterWarehouseBinService, MasterWarehouseBinRepository, S3Service, BarcodeService],
  exports: [MasterWarehouseBinService],
})
export class MasterWarehouseBinModule {}
