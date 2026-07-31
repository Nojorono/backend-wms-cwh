import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Btb } from '../core/domain/entities/btb.entity';
import { BtbDetails } from '../core/domain/entities/btb-details.entity';
import { PaginationModule } from '../core/modules/pagination.module';
import { BtbController } from './btb.controller';
import { BtbService } from './btb.service';
import { BtbRepository } from './btb.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Btb, BtbDetails]), PaginationModule],
  controllers: [BtbController],
  providers: [BtbService, BtbRepository],
  exports: [BtbService, BtbRepository],
})
export class BtbModule {}
