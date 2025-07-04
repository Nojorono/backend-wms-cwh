import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';
import { MasterWarehouseBinController } from './master-warehouse-bin.controller';
import { MasterWarehouseBinService } from './master-warehouse-bin.service';
import { MasterWarehouseBinRepository } from './master-warehouse-bin.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterWarehouseBin])],
  controllers: [MasterWarehouseBinController],
  providers: [
    MasterWarehouseBinService,
    MasterWarehouseBinRepository,
  ],
  exports: [MasterWarehouseBinService],
})
export class MasterWarehouseBinModule {} 