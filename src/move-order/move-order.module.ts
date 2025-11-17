import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoveOrder } from '../core/domain/entities/move-order.entity';
import { MoveOrderItem } from '../core/domain/entities/move-order-item.entity';
import { MoveOrderController } from './move-order.controller';
import { MoveOrderService } from './move-order.service';
import { MoveOrderRepository } from './repositories/move-order.repository';
import { MoveOrderItemRepository } from './repositories/move-order-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MoveOrder, MoveOrderItem])],
  controllers: [MoveOrderController],
  providers: [MoveOrderService, MoveOrderRepository, MoveOrderItemRepository],
  exports: [MoveOrderService],
})
export class MoveOrderModule {}

