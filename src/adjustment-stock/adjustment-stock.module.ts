import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdjustmentStock } from '../core/domain/entities/adjustment_stock.entity';
import { AdjustmentStockController } from './adjustment-stock.controller';
import { AdjustmentStockService } from './adjustment-stock.service';
import { AdjustmentStockRepository } from './adjustment-stock.repository';
import { PaginationService } from '../core/services/pagination.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdjustmentStock])],
  controllers: [AdjustmentStockController],
  providers: [
    AdjustmentStockService,
    AdjustmentStockRepository,
    PaginationService,
  ],
  exports: [AdjustmentStockService, AdjustmentStockRepository],
})
export class AdjustmentStockModule {}
