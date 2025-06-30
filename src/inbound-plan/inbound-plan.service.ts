import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InboundPlanRepository } from './inbound-plan.repository';
import { MasterIORepository } from '../master-io/master-io.repository';
import { CreateInboundPlanDto } from './dto/create-inbound-plan.dto';
import { UpdateInboundPlanDto } from './dto/update-inbound-plan.dto';
import { InboundPlan, PlanStatus } from '../core/domain/entities/inbound-plan.entity';
import { InboundPlanItemRepository } from './inbound-plan-item.repository';
import { MasterItemRepository } from '../master-item/master-item.repository';

@Injectable()
export class InboundPlanService {
  constructor(
    private readonly repository: InboundPlanRepository,
    private readonly masterIORepository: MasterIORepository,
    private readonly inboundPlanItemRepository: InboundPlanItemRepository,
    private readonly masterItemRepository: MasterItemRepository,
  ) {}

  async generateInboundPlanningNo(organizationId: number): Promise<string> {    
    const findOrganization = await this.masterIORepository.findByOrganizationId(organizationId);
    if (!findOrganization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }
    const lastInboundPlan = await this.repository.findLastInboundPlanningNo(organizationId);
    const dateCreated = new Date().getDate().toString().padStart(2, '0');
    const lastInboundPlanningNo = lastInboundPlan ? parseInt(lastInboundPlan.inbound_planning_no.split('-')[3]) + 1 : 1;
    return `${findOrganization.organization_name}-${findOrganization.organization_id}-${dateCreated}-${lastInboundPlanningNo.toString().padStart(4, '0')}`;
  }

  async create(createInboundPlanDto: CreateInboundPlanDto): Promise<InboundPlan> {
    const organizationId = createInboundPlanDto.organization_id;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    createInboundPlanDto.plan_status = PlanStatus.DRAFT;
    createInboundPlanDto.inbound_planning_no = await this.generateInboundPlanningNo(organizationId);
    const inboundPlan = await this.repository.create(createInboundPlanDto);
    if (createInboundPlanDto.items) {
      for (const item of createInboundPlanDto.items) {
        if (item.sku) {
          const findItem = await this.masterItemRepository.findBySku(item.sku);
          console.log(findItem);
          if (!findItem) {
            throw new NotFoundException(`Item with SKU ${item.sku} not found`);
          }
          item.item_id = findItem.id;
        }
      }
      console.log(createInboundPlanDto.items);
      const inboundPlanItems = await this.inboundPlanItemRepository.createMany(inboundPlan.id, createInboundPlanDto.items);
    }
    return inboundPlan;
  }

  async findAll(): Promise<InboundPlan[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<InboundPlan> {
    const inboundPlan = await this.repository.findOne(id);
    if (!inboundPlan) {
      throw new NotFoundException(`Inbound Plan with ID ${id} not found`);
    }
    return inboundPlan;
  }

  async update(id: string, updateInboundPlanDto: UpdateInboundPlanDto): Promise<InboundPlan> {
    const inboundPlan = await this.findOne(id);
    if (updateInboundPlanDto.organization_id && updateInboundPlanDto.organization_id !== inboundPlan.organization_id) {
      const existingInboundPlan = await this.repository.findByOrganizationId(updateInboundPlanDto.organization_id);
      if (existingInboundPlan) {
        throw new ConflictException(`Inbound Plan with code ${updateInboundPlanDto.organization_id} already exists`);
      }
    }
    const updatedInboundPlan = await this.repository.update(id, updateInboundPlanDto);
    if (!updatedInboundPlan) {
      throw new NotFoundException(`Inbound Plan with ID ${id} not found`);
    }
    return updatedInboundPlan;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async updateInboundPlanStatusInProgress(id: string): Promise<InboundPlan> {
    const inboundPlan = await this.findOne(id);
    if (inboundPlan.plan_status !== PlanStatus.DRAFT) { 
      throw new BadRequestException('Inbound Plan is not in draft');
    }
    const updatedInboundPlan = await this.repository.update(id, { plan_status: PlanStatus.IN_PROGRESS });
    if (!updatedInboundPlan) {
      throw new NotFoundException(`Inbound Plan with ID ${id} not found`);
    }
    return updatedInboundPlan;
  }
}
