import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedGate } from '../../core/domain/entities/assigned-gate.entity';

@Injectable()
export class AssignedGateRepository {
  constructor(
    @InjectRepository(AssignedGate)
    private readonly repository: Repository<AssignedGate>,
  ) {}

  async create(data: Partial<AssignedGate>): Promise<AssignedGate> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedGate[]> {
    return await this.repository.find({
      relations: ['outbound_do', 'assigned_gate_users', 'assigned_gate_users.user', 'assigned_gate_pallets', 'assigned_gate_pallets.pallet'],
    });
  }

  async findAllByUserId(userId: string): Promise<AssignedGate[]> {
    return await this.repository.find({
      where: { assigned_gate_users: { user_id: userId } },
      relations: ['outbound_do', 'assigned_gate_users', 'assigned_gate_users.user', 'assigned_gate_pallets', 'assigned_gate_pallets.pallet'],
    });
  }

  async findAllByGateId(gateId: string): Promise<AssignedGate[]> {
    return await this.repository.find({
      where: { gate_id: gateId },
      relations: ['outbound_do', 'assigned_gate_users', 'assigned_gate_users.user', 'assigned_gate_pallets', 'assigned_gate_pallets.pallet', 'gate'],
    });
  }

  async findOne(id: string): Promise<AssignedGate | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['outbound_do', 'assigned_gate_users', 'assigned_gate_users.user', 'assigned_gate_pallets', 'assigned_gate_pallets.pallet'],
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<AssignedGate>): Promise<AssignedGate | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGate not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGate not found');
    }
    await this.repository.softDelete(id);
  }

  async removeByOutboundDo(outboundDoId: string): Promise<void> {
    await this.repository.softDelete({ outbound_do_id: outboundDoId });
  }
}

