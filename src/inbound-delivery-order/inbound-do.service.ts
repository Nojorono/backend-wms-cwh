import { Injectable, NotFoundException } from '@nestjs/common';
import { InboundDeliveryOrderRepository } from './inbound-do.repository';
import { CreateInboundDeliveryOrderDto } from './dto/create-inbound-do.dto';
import { UpdateInboundDeliveryOrderDto } from './dto/update-inbound-do.dto';
import { InboundDeliveryOrder } from '../core/domain/entities/inbound-delivery-order.entity';

@Injectable()
export class InboundDeliveryOrderService {
  constructor(
    private readonly repository: InboundDeliveryOrderRepository,
  ) {}

  async create(createInboundDeliveryOrderDto: CreateInboundDeliveryOrderDto): Promise<InboundDeliveryOrder> {
    const inboundDeliveryOrder = await this.repository.create(createInboundDeliveryOrderDto);
    return inboundDeliveryOrder;
  }

  async findAll(): Promise<InboundDeliveryOrder[]> {
    return await this.repository.findAll();
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<InboundDeliveryOrder[]> {
    const inboundDeliveryOrders = await this.repository.findByInboundPlanId(inbound_plan_id);
    if (!inboundDeliveryOrders) {
      throw new NotFoundException(`Inbound Delivery Order with ID ${inbound_plan_id} not found`);
    }
    return inboundDeliveryOrders;
  }

  async update(id: string, updateInboundDeliveryOrderDto: UpdateInboundDeliveryOrderDto): Promise<InboundDeliveryOrder> {
    const updatedInboundDeliveryOrder = await this.repository.update(id, updateInboundDeliveryOrderDto);
    if (!updatedInboundDeliveryOrder) {
      throw new NotFoundException(`Inbound Delivery Order with ID ${id} not found`);
    }
    return updatedInboundDeliveryOrder;
  }

  async remove(id: string): Promise<void> {
    await this.repository.findOne(id);
    await this.repository.remove(id);
  }
}
