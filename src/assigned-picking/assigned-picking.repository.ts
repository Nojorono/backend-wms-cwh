import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedPicking } from '../core/domain/entities/assigned-picking.entity';
import { CreateAssignedPickingDto } from './dto/create-assigned-picking.dto';

@Injectable()
export class AssignedPickingRepository {
  constructor(
    @InjectRepository(AssignedPicking)
    private readonly repository: Repository<AssignedPicking>,
  ) {}

  async create(data: CreateAssignedPickingDto): Promise<AssignedPicking> {
    const assignedPicking = this.repository.create(data);
    return this.repository.save(assignedPicking);
  }

  async findAll(): Promise<AssignedPicking[]> {
    return this.repository.find({
      relations: ['memo'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<AssignedPicking | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['memo']
    });
  }

  async update(id: string, data: any): Promise<AssignedPicking> {
    await this.repository.update(id, data);
    const result = await this.findOne(id);
    if (!result) {
      throw new Error('Assigned picking not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findByMemoId(memoId: string): Promise<AssignedPicking[]> {
    return this.repository.find({
      where: { memo_id: memoId },
      relations: ['memo'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByPickingUserId(pickingUserId: string): Promise<AssignedPicking[]> {
    return this.repository.find({
      where: { picking_user_id: pickingUserId },
      relations: ['memo'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByPickingName(pickingName: string): Promise<AssignedPicking[]> {
    return this.repository.find({
      where: { picking_name: pickingName },
      relations: ['memo'],
      order: { createdAt: 'DESC' }
    });
  }

  async checkExistingAssignment(memoId: string, pickingUserId: string): Promise<AssignedPicking | null> {
    return this.repository.findOne({
      where: { 
        memo_id: memoId,
        picking_user_id: pickingUserId
      },
      relations: ['memo']
    });
  }
}
