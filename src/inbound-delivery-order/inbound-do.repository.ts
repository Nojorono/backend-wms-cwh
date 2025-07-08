import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InboundDeliveryOrder } from '../core/domain/entities/inbound-delivery-order.entity';
import { CreateInboundDeliveryOrderDto } from './dto/create-inbound-do.dto';
import { UpdateInboundDeliveryOrderDto } from './dto/update-inbound-do.dto';

@Injectable()
export class InboundDeliveryOrderRepository {
  constructor(
    @InjectRepository(InboundDeliveryOrder)
    private readonly repository: Repository<InboundDeliveryOrder>,
  ) {}

  async create(createInboundDeliveryOrderDto: CreateInboundDeliveryOrderDto): Promise<InboundDeliveryOrder> {
    const inboundDeliveryOrder = this.repository.create(createInboundDeliveryOrderDto);
    return await this.repository.save(inboundDeliveryOrder);
  }

  async findLastInboundDeliveryOrderNo(number_delivery_order: string): Promise<InboundDeliveryOrder | null> {
    const inboundDeliveryOrder = await this.repository.findOne({ where: { number_delivery_order }, order: { number_delivery_order: 'DESC' } });
    if (!inboundDeliveryOrder) {
      return null;
    }
    return inboundDeliveryOrder;
  }

  async findAll(): Promise<InboundDeliveryOrder[]> {
    return await this.repository
      .createQueryBuilder('inboundDeliveryOrder')
      .leftJoinAndSelect('inboundDeliveryOrder.items', 'items')
      .getMany();
  }

  async findWhere(where: FindOptionsWhere<InboundDeliveryOrder>): Promise<InboundDeliveryOrder[]> {
    const inboundDeliveryOrders = await this.repository
      .createQueryBuilder('inboundDeliveryOrder')
      .leftJoinAndSelect('inboundDeliveryOrder.items', 'items')
      .where(where)
      .getMany();
    
    return inboundDeliveryOrders;
  }

  async findOneWhere(where: FindOptionsWhere<InboundDeliveryOrder>): Promise<InboundDeliveryOrder | null> {
    const inboundDeliveryOrder = await this.repository
      .createQueryBuilder('inboundDeliveryOrder')
      .leftJoinAndSelect('inboundDeliveryOrder.items', 'items')
      .where(where)
      .getOne();
    
    return inboundDeliveryOrder;
  }

  async findOne(id: string): Promise<InboundDeliveryOrder | null> {
    return await this.findOneWhere({ id });
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<InboundDeliveryOrder[]> {
    const inboundDeliveryOrders = await this.findWhere({ inbound_plan_id });
    if (!inboundDeliveryOrders) {
      return [];  
    }
    return inboundDeliveryOrders;
  }

  async update(id: string, updateInboundDeliveryOrderDto: UpdateInboundDeliveryOrderDto): Promise<InboundDeliveryOrder | null> {
    const inboundDeliveryOrder = await this.findWhere({ id });
    if (!inboundDeliveryOrder) {
      throw new NotFoundException('Inbound Delivery Order not found');
    }
    await this.repository.update(id, {
      ...updateInboundDeliveryOrderDto,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inboundDeliveryOrder = await this.findOne(id);
    if (!inboundDeliveryOrder) {
      throw new NotFoundException('Inbound Delivery Order not found');
    }
    await this.repository.delete(id);
  }
}
