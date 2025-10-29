import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseSubController } from './master-warehouse-sub.controller';
import { MasterWarehouseSubService } from './master-warehouse-sub.service';
import { MasterWarehouseSubRepository } from './master-warehouse-sub.repository';
import { S3Service } from 'src/infrastructure/services/s3.service';
import { BarcodeService } from 'src/infrastructure/services/barcode.service';

@Module({
  imports: [TypeOrmModule.forFeature([MasterWarehouseSub])],
  controllers: [MasterWarehouseSubController],
  providers: [MasterWarehouseSubService, MasterWarehouseSubRepository, S3Service, BarcodeService],
  exports: [MasterWarehouseSubService],
})
export class MasterWarehouseSubModule {}
