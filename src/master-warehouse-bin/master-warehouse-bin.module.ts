import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseBinController } from './master-warehouse-bin.controller';
import { MasterWarehouseBinService } from './master-warehouse-bin.service';
import { MasterWarehouseBinRepository } from './master-warehouse-bin.repository';
import { S3Service } from 'src/infrastructure/services/s3.service';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Module({
  imports: [TypeOrmModule.forFeature([MasterWarehouseBin])],
  controllers: [MasterWarehouseBinController],
  providers: [
    MasterWarehouseBinService,
    MasterWarehouseBinRepository,
    S3Service,
    BarcodeService,
  ],
  exports: [MasterWarehouseBinService],
})
export class MasterWarehouseBinModule {}
