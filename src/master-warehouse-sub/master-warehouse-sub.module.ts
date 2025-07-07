import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouseSub } from '../core/domain/entities/master-warehouse-sub.entity';
import { MasterWarehouseSubController } from './master-warehouse-sub.controller';
import { MasterWarehouseSubService } from './master-warehouse-sub.service';
import { MasterWarehouseSubRepository } from './master-warehouse-sub.repository';
import { BarcodeModule } from 'src/infrastructure/modules/barcode.module';

@Module({
  imports: [TypeOrmModule.forFeature([MasterWarehouseSub]), BarcodeModule],
  controllers: [MasterWarehouseSubController],
  providers: [
    MasterWarehouseSubService,
    MasterWarehouseSubRepository,
  ],
  exports: [MasterWarehouseSubService],
})
export class MasterWarehouseSubModule {} 