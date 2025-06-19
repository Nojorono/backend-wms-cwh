import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { MasterWarehouseController } from './master-warehouse.controller';
import { MasterWarehouseService } from './master-warehouse.service';
import { MasterWarehouseRepository } from './master-warehouse.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterWarehouse])],
  controllers: [MasterWarehouseController],
  providers: [
    MasterWarehouseService,
    MasterWarehouseRepository,
  ],
  exports: [MasterWarehouseService],
})
export class MasterWarehouseModule {} 