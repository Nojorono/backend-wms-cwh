import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundPlan, PlanStatus } from '../core/domain/entities/inbound-plan.entity';
import { CreateInboundPlanDto } from './dto/create-inbound-plan.dto';
import { UpdateInboundPlanDto } from './dto/update-inbound-plan.dto';

@Injectable()
export class InboundPlanRepository {
  constructor(
    @InjectRepository(InboundPlan)
    private readonly repository: Repository<InboundPlan>,
  ) {}

  async create(createInboundPlanDto: CreateInboundPlanDto): Promise<InboundPlan> {
    const inboundPlan = this.repository.create(createInboundPlanDto);
    return await this.repository.save(inboundPlan);
  }

  async findLastInboundPlanningNo(organizationId: number): Promise<InboundPlan | null> {
    const inboundPlan = await this.repository.findOne({ where: { organization_id: organizationId }, order: { inbound_planning_no: 'DESC' } });
    if (!inboundPlan) {
      return null;
    }
    return inboundPlan;
  }

  async findAll(): Promise<InboundPlan[]> {
    return await this.repository
      .createQueryBuilder('inboundPlan')
      .leftJoinAndSelect('inboundPlan.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('items.classification_item', 'classification_item')
      .getMany();
  }

  async findOne(id: string): Promise<InboundPlan | null> {
    const inboundPlan = await this.repository
      .createQueryBuilder('inboundPlan')
      .leftJoinAndSelect('inboundPlan.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .leftJoinAndSelect('items.classification_item', 'classification_item')
      .where('inboundPlan.id = :id', { id })
      .getOne();
    
    if (!inboundPlan) {
      return null;
    }
    return inboundPlan;
  }

  async findByOrganizationId(organization_id: number): Promise<InboundPlan | null> {
    const inboundPlan = await this.repository.findOne({ where: { organization_id } });
    if (!inboundPlan) {
      return null;
    }
    return inboundPlan;
  }

  async update(id: string, updateInboundPlanDto: UpdateInboundPlanDto): Promise<InboundPlan | null> {
    const inboundPlan = await this.findOne(id);
    if (!inboundPlan) {
      throw new NotFoundException('Inbound Plan not found');
    }
    await this.repository.update(id, {
      ...updateInboundPlanDto,
      plan_status: updateInboundPlanDto.plan_status as PlanStatus,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inboundPlan = await this.findOne(id);
    if (!inboundPlan) {
      throw new NotFoundException('Inbound Plan not found');
    }
    await this.repository.delete(id);
  }
}
