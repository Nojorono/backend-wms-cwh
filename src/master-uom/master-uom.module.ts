import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterUom } from '../core/domain/entities/master-uom.entity';
import { MasterUomController } from './master-uom.controller';
import { MasterUomService } from './master-uom.service';
import { MasterUomRepository } from './master-uom.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MasterUom])],
  controllers: [MasterUomController],
  providers: [MasterUomService, MasterUomRepository],
  exports: [MasterUomService],
})
export class MasterUomModule {}
