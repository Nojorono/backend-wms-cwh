import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundDeliveryOrder } from '../core/domain/entities/inbound-delivery-order.entity';
import { InboundDeliveryOrderController } from './inbound-do.controller';
import { InboundDeliveryOrderService } from './inbound-do.service';
import { InboundDeliveryOrderRepository } from './inbound-do.repository';
import { InboundDeliveryOrderItem } from '../core/domain/entities/inbound-delivery-order-item.entity';
import { InboundDeliveryOrderItemRepository } from './inbound-do-item.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InboundDeliveryOrder, InboundDeliveryOrderItem])],
  controllers: [InboundDeliveryOrderController],
  providers: [
    InboundDeliveryOrderService,
    InboundDeliveryOrderRepository,
    InboundDeliveryOrderItemRepository,
  ],
  exports: [InboundDeliveryOrderService],
})
export class InboundDeliveryOrderModule {} 