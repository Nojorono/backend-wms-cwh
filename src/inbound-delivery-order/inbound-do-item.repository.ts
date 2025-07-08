import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundDeliveryOrderItem } from '../core/domain/entities/inbound-delivery-order-item.entity';
import { CreateInboundDeliveryOrderItemDto } from './dto/create-inbound-do-item.dto';
import { UpdateInboundDeliveryOrderItemDto } from './dto/update-inbound-do-item.dto';

@Injectable()
export class InboundDeliveryOrderItemRepository {
  constructor(
    @InjectRepository(InboundDeliveryOrderItem)
    private readonly repository: Repository<InboundDeliveryOrderItem>,
  ) {}

  async create(createInboundDeliveryOrderItemDto: CreateInboundDeliveryOrderItemDto): Promise<InboundDeliveryOrderItem> {
    const inboundDeliveryOrderItem = this.repository.create(createInboundDeliveryOrderItemDto);
    return await this.repository.save(inboundDeliveryOrderItem);
  }

  async createMany(inbound_delivery_order_id: string, createInboundDeliveryOrderItemDto: CreateInboundDeliveryOrderItemDto[]): Promise<InboundDeliveryOrderItem[]> {
    const inboundDeliveryOrderItems: InboundDeliveryOrderItem[] = [];
    for (const item of createInboundDeliveryOrderItemDto) {
      inboundDeliveryOrderItems.push(this.repository.create({
        inboundDeliveryOrder: { id: inbound_delivery_order_id },
        item_id: item.item_id,
        qty_plan: item.qty_plan,
        uom: item.uom,
      }));
    }
    return await this.repository.save(inboundDeliveryOrderItems);
  }

  async findAll(): Promise<InboundDeliveryOrderItem[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<InboundDeliveryOrderItem | null> {
    const inboundDeliveryOrderItem = await this.repository.findOne({ where: { id } });
    if (!inboundDeliveryOrderItem) {
      return null;
    }
    return inboundDeliveryOrderItem;
  }

  async findByInboundDeliveryOrderId(inboundDeliveryOrderId: string): Promise<InboundDeliveryOrderItem[]> {
    const inboundDeliveryOrderItems = await this.repository.find({ where: { inboundDeliveryOrder: { id: inboundDeliveryOrderId } } });
    return inboundDeliveryOrderItems;
  }

  async update(id: string, updateInboundDeliveryOrderItemDto: UpdateInboundDeliveryOrderItemDto): Promise<InboundDeliveryOrderItem | null> {
    const inboundDeliveryOrderItem = await this.findOne(id);
    if (!inboundDeliveryOrderItem) {
      throw new NotFoundException('Inbound Delivery Order Item not found');
    }
    await this.repository.update(id, {
      ...updateInboundDeliveryOrderItemDto,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inboundDeliveryOrderItem = await this.findOne(id);
    if (!inboundDeliveryOrderItem) {
      throw new NotFoundException('Inbound Delivery Order Item not found');
    }
    await this.repository.delete(id);
  }
}
