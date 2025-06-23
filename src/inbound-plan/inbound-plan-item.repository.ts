import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundPlanItem } from '../core/domain/entities/inbound-plan-item.entity';
import { CreateInboundPlanItemDto } from './dto/create-inbound-plan-item.dto';
import { UpdateInboundPlanItemDto } from './dto/update-inbound-plan-item.dto';

@Injectable()
export class InboundPlanItemRepository {
  constructor(
    @InjectRepository(InboundPlanItem)
    private readonly repository: Repository<InboundPlanItem>,
  ) {}

  async create(createInboundPlanItemDto: CreateInboundPlanItemDto): Promise<InboundPlanItem> {
    const inboundPlanItem = this.repository.create(createInboundPlanItemDto);
    return await this.repository.save(inboundPlanItem);
  }

  async createMany(inbound_plan_id: string, createInboundPlanItemDto: CreateInboundPlanItemDto[]): Promise<InboundPlanItem[]> {
    const inboundPlanItems = createInboundPlanItemDto.map((item) => ({
      ...item,
      inbound_plan: { id: inbound_plan_id },
    }));
    return await this.repository.save(inboundPlanItems);
  }

  async findAll(): Promise<InboundPlanItem[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<InboundPlanItem | null> {
    const inboundPlanItem = await this.repository.findOne({ where: { id } });
    if (!inboundPlanItem) {
      return null;
    }
    return inboundPlanItem;
  }

  async findByInboundPlanId(inboundPlanId: string): Promise<InboundPlanItem[]> {
    const inboundPlanItems = await this.repository.find({ where: { inbound_plan: { id: inboundPlanId } } });
    return inboundPlanItems;
  }

  async update(id: string, updateInboundPlanItemDto: UpdateInboundPlanItemDto): Promise<InboundPlanItem | null> {
    const inboundPlanItem = await this.findOne(id);
    if (!inboundPlanItem) {
      throw new NotFoundException('Inbound Plan Item not found');
    }
    await this.repository.update(id, {
      ...updateInboundPlanItemDto,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inboundPlanItem = await this.findOne(id);
    if (!inboundPlanItem) {
      throw new NotFoundException('Inbound Plan Item not found');
    }
    await this.repository.delete(id);
  }
}
