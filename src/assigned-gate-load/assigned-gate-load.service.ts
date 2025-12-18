import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  AssignedGateLoad,
  AssignedGateLoadStatus,
} from '../core/domain/entities/assigned-gate-load.entity';
import { AssignedGateLoadRepository } from '../assigned-gate/repositories/assigned-gate-load.repository';
import { CreateAssignedGateLoadDto } from '../assigned-gate/dto/create-assigned-gate-load.dto';
import { UpdateAssignedGateLoadDto } from '../assigned-gate/dto/update-assigned-gate-load.dto';

@Injectable()
export class AssignedGateLoadService {
  constructor(private readonly repository: AssignedGateLoadRepository) {}

  async create(createDto: CreateAssignedGateLoadDto): Promise<AssignedGateLoad> {
    const loadData = {
      ...createDto,
      // Set default values if not provided
      quantity_picked: createDto.quantity_picked ?? 0,
      quantity_loaded: createDto.quantity_loaded ?? 0,
      quantity_unloaded: createDto.quantity_unloaded ?? 0,
      status: createDto.status ?? AssignedGateLoadStatus.PENDING,
    };

    return await this.repository.create(loadData);
  }

  async findAll(): Promise<AssignedGateLoad[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<AssignedGateLoad> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, updateDto: UpdateAssignedGateLoadDto): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    const updated = await this.repository.update(id, updateDto);
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.remove(id);
  }

  async findAllByAssignedGate(assignedGateId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.findAllByAssignedGate(assignedGateId);
  }

  async findAllByOutboundMemo(outboundMemoId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.findAllByOutboundMemo(outboundMemoId);
  }

  async findAllByPalletId(palletId: string): Promise<AssignedGateLoad[]> {
    return await this.repository.findAllByPalletId(palletId);
  }

  async updateQuantityLoaded(
    id: string,
    quantityLoaded: number,
  ): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    if (quantityLoaded < 0) {
      throw new BadRequestException('Quantity loaded cannot be negative');
    }

    if (existing.quantity_picked && quantityLoaded > existing.quantity_picked) {
      throw new BadRequestException(
        'Quantity loaded cannot exceed quantity picked',
      );
    }

    const updated = await this.repository.update(id, { quantity_loaded: quantityLoaded });
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }

  async updateQuantityUnloaded(
    id: string,
    quantityUnloaded: number,
  ): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    if (quantityUnloaded < 0) {
      throw new BadRequestException('Quantity unloaded cannot be negative');
    }

    if (existing.quantity_loaded && quantityUnloaded > existing.quantity_loaded) {
      throw new BadRequestException(
        'Quantity unloaded cannot exceed quantity loaded',
      );
    }

    const updated = await this.repository.update(id, { quantity_unloaded: quantityUnloaded });
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    id: string,
    status: AssignedGateLoadStatus,
  ): Promise<AssignedGateLoad> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }

    const updated = await this.repository.update(id, { status });
    if (!updated) {
      throw new NotFoundException(`AssignedGateLoad with ID ${id} not found`);
    }
    return updated;
  }
}

