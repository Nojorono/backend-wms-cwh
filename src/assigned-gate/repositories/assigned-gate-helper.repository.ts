import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedGateHelper } from '../../core/domain/entities/assigned-gate-helper.entity';

@Injectable()
export class AssignedGateHelperRepository {
  constructor(
    @InjectRepository(AssignedGateHelper)
    private readonly repository: Repository<AssignedGateHelper>,
  ) {}

  async create(data: Partial<AssignedGateHelper>): Promise<AssignedGateHelper> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedGateHelper[]> {
    return await this.repository.find({
      relations: ['assigned_gate', 'assigned_gate.outbound_do'],
    });
  }

  async findAllByAssignedGate(assignedGateId: string): Promise<AssignedGateHelper[]> {
    return await this.repository.find({
      where: { assigned_gate_id: assignedGateId },
      relations: ['assigned_gate', 'assigned_gate.outbound_do'],
    });
  }

  async findOne(id: string): Promise<AssignedGateHelper | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['assigned_gate', 'assigned_gate.outbound_do'],
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<AssignedGateHelper>): Promise<AssignedGateHelper | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGateHelper not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGateHelper not found');
    }
    await this.repository.softDelete(id);
  }

  async removeByAssignedGate(assignedGateId: string): Promise<void> {
    await this.repository.softDelete({ assigned_gate_id: assignedGateId });
  }
}

