import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignedHelper } from '../core/domain/entities/assigned-helper.entity';
import { AssignedHelperRepository } from './repositories/assigned-helper.repository';
import { CreateAssignedHelperDto } from './dto/create-assigned-helper.dto';
import { UpdateAssignedHelperDto } from './dto/update-assigned-helper.dto';

@Injectable()
export class AssignedHelperService {
  constructor(private readonly assignedHelperRepo: AssignedHelperRepository) {}

  async create(createAssignedHelperDto: CreateAssignedHelperDto): Promise<AssignedHelper> {
    return await this.assignedHelperRepo.create(createAssignedHelperDto);
  }

  async findAll(): Promise<AssignedHelper[]> {
    return await this.assignedHelperRepo.findAll();
  }

  async findAllByInbound(inboundId: string): Promise<AssignedHelper[]> {
    return await this.assignedHelperRepo.findAllByInbound(inboundId);
  }

  async findOne(id: string): Promise<AssignedHelper> {
    const found = await this.assignedHelperRepo.findOne(id);
    if (!found) {
      throw new NotFoundException('AssignedHelper not found');
    }
    return found;
  }

  async findByInboundId(inbound_id: string): Promise<AssignedHelper[]> {
    return await this.assignedHelperRepo.findByInboundId(inbound_id);
  }

  async update(
    id: string,
    updateAssignedHelperDto: UpdateAssignedHelperDto,
  ): Promise<AssignedHelper> {
    const updated = await this.assignedHelperRepo.update(id, updateAssignedHelperDto);
    if (!updated) {
      throw new NotFoundException('AssignedHelper not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.assignedHelperRepo.remove(id);
  }

  async removeByInbound(inboundId: string): Promise<void> {
    await this.assignedHelperRepo.removeByInbound(inboundId);
  }
}
