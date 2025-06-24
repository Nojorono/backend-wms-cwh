import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CheckerAssignRepository } from './checker-assign.repository';
import { CreateCheckerAssignDto } from './dto/create-checker-assign.dto';
import { UpdateCheckerAssignDto } from './dto/update-checker-assign.dto';
import { CheckerAssign } from '../core/domain/entities/checker-assign.entity';

@Injectable()
export class CheckerAssignService {
  constructor(private readonly repository: CheckerAssignRepository) {}

  async create(createCheckerAssignDto: CreateCheckerAssignDto): Promise<CheckerAssign> {
    if (!createCheckerAssignDto.inbound_plan_id) {
      throw new BadRequestException('Inbound plan ID is required');
    }
    const existingCheckerAssign = await this.repository.findByInboundPlanId(createCheckerAssignDto.inbound_plan_id);
    if (existingCheckerAssign) {
      throw new ConflictException(`Checker Assign with inbound plan ID ${createCheckerAssignDto.inbound_plan_id} already exists`);
    }
    return await this.repository.create(createCheckerAssignDto);
  }

  async findAll(): Promise<CheckerAssign[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<CheckerAssign> {
    const checkerAssign = await this.repository.findOne(id);
    if (!checkerAssign) {
      throw new NotFoundException(`Checker Assign with ID ${id} not found`);
    }
    return checkerAssign;
  }

  async update(id: string, updateCheckerAssignDto: UpdateCheckerAssignDto): Promise<CheckerAssign> {
    const checkerAssign = await this.findOne(id);
    if (updateCheckerAssignDto.inbound_plan_id && updateCheckerAssignDto.inbound_plan_id !== checkerAssign.inbound_plan_id) {
      const existingCheckerAssign = await this.repository.findByInboundPlanId(updateCheckerAssignDto.inbound_plan_id);
      if (existingCheckerAssign) {
        throw new ConflictException(`Checker Assign with inbound plan ID ${updateCheckerAssignDto.inbound_plan_id} already exists`);
      }
    }
    const updatedCheckerAssign = await this.repository.update(id, updateCheckerAssignDto);
    if (!updatedCheckerAssign) {
      throw new NotFoundException(`Checker Assign with ID ${id} not found`);
    }
    return updatedCheckerAssign;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
