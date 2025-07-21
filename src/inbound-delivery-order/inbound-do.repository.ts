import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InboundDeliveryOrder } from '../core/domain/entities/inbound-delivery-order.entity';
import { CreateInboundDeliveryOrderDto } from './dto/create-inbound-do.dto';
import { UpdateInboundDeliveryOrderDto } from './dto/update-inbound-do.dto';
import { InboundDeliveryOrderItem } from '../core/domain/entities/inbound-delivery-order-item.entity';

@Injectable()
export class InboundDeliveryOrderRepository {
  constructor(
    @InjectRepository(InboundDeliveryOrder)
    private readonly repository: Repository<InboundDeliveryOrder>,
    @InjectRepository(InboundDeliveryOrderItem)
    private readonly itemRepository: Repository<InboundDeliveryOrderItem>,
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
    const { items, ...updateFields } = updateInboundDeliveryOrderDto;
  
    // Update main order (already fixed)
    await this.repository.update(id, updateFields);
  
    // Update items if provided
    if (items && Array.isArray(items)) {
      // 1. Get current items from DB
      const existingItems = await this.itemRepository.find({ where: { inboundDeliveryOrder: { id } } });
  
      // 2. Update or create items
      for (const itemDto of items) {
        if (itemDto.id) {
          // Update existing item
          await this.itemRepository.update(itemDto.id, itemDto);
        } else {
          // Create new item
          await this.itemRepository.create({ ...itemDto, inboundDeliveryOrder: { id } });
        }
      }
  
      // 3. Optionally, delete items not present in the new list
      const newItemIds = items.filter(i => i.id).map(i => i.id);
      for (const existingItem of existingItems) {
        if (!newItemIds.includes(existingItem.id)) {
          await this.itemRepository.delete(existingItem.id);
        }
      }
    }
  
    return await this.repository.findOne({ where: { id }, relations: ['items'] });
  }

  async remove(id: string): Promise<void> {
    const inboundDeliveryOrder = await this.findOne(id);
    if (!inboundDeliveryOrder) {
      throw new NotFoundException('Inbound Delivery Order not found');
    }
    await this.repository.delete(id);
  }
}
