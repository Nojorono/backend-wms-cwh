import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignedGate } from '../../core/domain/entities/assigned-gate.entity';

@Injectable()
export class AssignedGateRepository {
  constructor(
    @InjectRepository(AssignedGate)
    private readonly repository: Repository<AssignedGate>,
  ) { }

  async create(data: Partial<AssignedGate>): Promise<AssignedGate> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<AssignedGate[]> {
    return await this.repository.find({
      relations: [
        'outbound_do',
        'outbound_do.outbound_memos',
        'outbound_do.outbound_memos.outbound_memo_items',
        'outbound_do.outbound_memos.transaction_pickings',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.item',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.palletUse',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.palletSource',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.palletSwitch',
        'gate',
        'assigned_gate_users',
        'assigned_gate_users.user',
        'assigned_gate_pallets',
        'assigned_gate_pallets.pallet',
        'assigned_gate_helpers',
        'assigned_gate_loads',
        'assigned_gate_loads.pallet',
      ],
    });
  }

  async findAllWithFilters(filters: {
    user_id?: string;
    gate_id?: string;
    outbound_do_id?: string;
    status?: string;
  }): Promise<AssignedGate[]> {
    const queryBuilder = this.repository.createQueryBuilder('assigned_gate');

    // Apply filters
    if (filters.gate_id) {
      queryBuilder.andWhere('assigned_gate.gate_id = :gate_id', { gate_id: filters.gate_id });
    }

    if (filters.outbound_do_id) {
      queryBuilder.andWhere('assigned_gate.outbound_do_id = :outbound_do_id', {
        outbound_do_id: filters.outbound_do_id,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('assigned_gate.status = :status', { status: filters.status });
    }

    // Add all relations first
    queryBuilder
      .leftJoinAndSelect('assigned_gate.outbound_do', 'outbound_do')
      .leftJoinAndSelect('outbound_do.outbound_memos', 'outbound_memos')
      .leftJoinAndSelect('outbound_memos.outbound_memo_items', 'outbound_memo_items')
      .leftJoinAndSelect('outbound_memos.transaction_pickings', 'transaction_pickings')
      .leftJoinAndSelect('transaction_pickings.transactionScanPicking', 'transactionScanPicking')
      .leftJoinAndSelect('transactionScanPicking.item', 'scanPickingItem')
      .leftJoinAndSelect('transactionScanPicking.palletUse', 'palletUse')
      .leftJoinAndSelect('transactionScanPicking.palletSource', 'palletSource')
      .leftJoinAndSelect('transactionScanPicking.palletSwitch', 'palletSwitch')
      .leftJoinAndSelect('assigned_gate.gate', 'gate')
      .leftJoinAndSelect('assigned_gate.assigned_gate_users', 'assigned_gate_users')
      .leftJoinAndSelect('assigned_gate_users.user', 'user')
      .leftJoinAndSelect('assigned_gate.assigned_gate_pallets', 'assigned_gate_pallets')
      .leftJoinAndSelect('assigned_gate_pallets.pallet', 'pallet')
      .leftJoinAndSelect('assigned_gate.assigned_gate_helpers', 'assigned_gate_helpers')
      .leftJoinAndSelect('assigned_gate.assigned_gate_loads', 'assigned_gate_loads')
      .leftJoinAndSelect('assigned_gate_loads.pallet', 'loadPallet')
      .leftJoinAndSelect('assigned_gate_loads.item', 'loadItem')


    // Filter by user_id - use the already joined assigned_gate_users
    if (filters.user_id) {
      queryBuilder.andWhere('assigned_gate_users.user_id = :user_id', { user_id: filters.user_id });
    }

    // Add distinct to avoid duplicates when filtering by user_id
    if (filters.user_id) {
      queryBuilder.distinct(true);
    }

    return await queryBuilder.getMany();
  }

  async findAllByUserId(userId: string): Promise<AssignedGate[]> {
    return await this.findAllWithFilters({ user_id: userId });
  }

  async findAllByGateId(gateId: string): Promise<AssignedGate[]> {
    return await this.findAllWithFilters({ gate_id: gateId });
  }

  async findAllByOutboundDoId(outboundDoId: string): Promise<AssignedGate[]> {
    return await this.findAllWithFilters({ outbound_do_id: outboundDoId });
  }

  async findOne(id: string): Promise<AssignedGate | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: [
        'outbound_do',
        'outbound_do.outbound_memos',
        'outbound_do.outbound_memos.outbound_memo_items',
        'outbound_do.outbound_memos.transaction_pickings',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.item',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.palletUse',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.palletSource',
        'outbound_do.outbound_memos.transaction_pickings.transactionScanPicking.palletSwitch',
        'gate',
        'assigned_gate_users',
        'assigned_gate_users.user',
        'assigned_gate_pallets',
        'assigned_gate_pallets.pallet',
      ],
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

