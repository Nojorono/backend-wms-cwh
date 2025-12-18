import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedGateLoad } from '../../core/domain/entities/assigned-gate-load.entity';

@Injectable()
export class AssignedGateLoadRepository {
  constructor(
    @InjectRepository(AssignedGateLoad)
    private readonly repository: Repository<AssignedGateLoad>,
  ) {}

  async create(data: Partial<AssignedGateLoad>): Promise<AssignedGateLoad> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedGateLoad[]> {
    return await this.repository.find({
      relations: [
        'assigned_gate',
        'assigned_gate.outbound_do',
        'outbound_do',
        'outbound_memo',
        'pallet',
        'item',
      ],
    });
  }

  async findAllByAssignedGate(assignedGateId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.find({
      where: { assigned_gate_id: assignedGateId },
      relations: [
        'assigned_gate',
        'assigned_gate.outbound_do',
        'outbound_do',
        'outbound_memo',
        'pallet',
        'item',
      ],
    });
  }

  async findAllByOutboundMemo(outboundMemoId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.find({
      where: { outbound_memo_id: outboundMemoId },
      relations: [
        'assigned_gate',
        'assigned_gate.outbound_do',
        'outbound_do',
        'outbound_memo',
        'pallet',
        'item',
      ],
    });
  }

  async findAllByPalletId(palletId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.find({
      where: { pallet_id: palletId },
      relations: [
        'assigned_gate',
        'assigned_gate.outbound_do',
        'outbound_do',
        'outbound_memo',
        'pallet',
        'item',
      ],
    });
  }

  async findOne(id: string): Promise<AssignedGateLoad | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'assigned_gate',
        'assigned_gate.outbound_do',
        'outbound_do',
        'outbound_memo',
        'pallet',
        'item',
      ],
    });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<AssignedGateLoad>): Promise<AssignedGateLoad | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGateLoad not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('AssignedGateLoad not found');
    }
    await this.repository.softDelete(id);
  }

  async removeByAssignedGate(assignedGateId: string): Promise<void> {
    await this.repository.softDelete({ assigned_gate_id: assignedGateId });
  }
}

