import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedGatePallet } from '../../core/domain/entities/assigned-gate-pallet.entity';

@Injectable()
export class AssignedGatePalletRepository {
  constructor(
    @InjectRepository(AssignedGatePallet)
    private readonly repository: Repository<AssignedGatePallet>,
  ) {}

  async create(data: Partial<AssignedGatePallet>): Promise<AssignedGatePallet> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedGatePallet[]> {
    return await this.repository.find({
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'pallet'],
    });
  }

  async findAllByAssignedGate(assignedGateId: string): Promise<AssignedGatePallet[]> {
    return await this.repository.find({
      where: { assigned_gate_id: assignedGateId },
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'pallet'],
    });
  }

  async findOne(id: string): Promise<AssignedGatePallet | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['assigned_gate', 'assigned_gate.outbound_do', 'pallet'],
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<AssignedGatePallet>): Promise<AssignedGatePallet | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGatePallet not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGatePallet not found');
    }
    await this.repository.softDelete(id);
  }

  async removeByAssignedGate(assignedGateId: string): Promise<void> {
    await this.repository.softDelete({ assigned_gate_id: assignedGateId });
  }
}

