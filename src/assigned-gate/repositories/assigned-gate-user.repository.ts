import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedGateUser } from '../../core/domain/entities/assigned-gate-user.entity';

@Injectable()
export class AssignedGateUserRepository {
  constructor(
    @InjectRepository(AssignedGateUser)
    private readonly repository: Repository<AssignedGateUser>,
  ) {}

  async create(data: Partial<AssignedGateUser>): Promise<AssignedGateUser> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedGateUser[]> {
    return await this.repository.find({
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'user'],
    });
  }

  async findAllByAssignedGate(assignedGateId: string): Promise<AssignedGateUser[]> {
    return await this.repository.find({
      where: { assigned_gate_id: assignedGateId },
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'user'],
    });
  }

  async findAllByUserId(userId: string): Promise<AssignedGateUser[]> {
    return await this.repository.find({
      where: { user_id: userId },
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'user'],
    });
  }

  async findOneByUserId(userId: string): Promise<AssignedGateUser | null> {
    return await this.repository.findOne({
      where: { user_id: userId },
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'user'],
    });
  }

  async findOne(id: string): Promise<AssignedGateUser | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'user'],
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<AssignedGateUser>): Promise<AssignedGateUser | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGateUser not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGateUser not found');
    }
    await this.repository.softDelete(id);
  }

  async removeByAssignedGate(assignedGateId: string): Promise<void> {
    await this.repository.softDelete({ assigned_gate_id: assignedGateId });
  }
}

