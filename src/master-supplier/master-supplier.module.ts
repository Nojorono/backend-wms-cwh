import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterSupplier } from '../core/domain/entities/master-supplier.entity';
import { MasterSupplierController } from './master-supplier.controller';
import { MasterSupplierService } from './master-supplier.service';
import { MasterSupplierRepository } from './master-supplier.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterSupplier])],
  controllers: [MasterSupplierController],
  providers: [MasterSupplierService, MasterSupplierRepository],
  exports: [MasterSupplierService],
})
export class MasterSupplierModule {}
