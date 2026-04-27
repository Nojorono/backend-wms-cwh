import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundItem, InspectionStatus } from '../../core/domain/entities/inbound-item.entity';

@Injectable()
export class InboundItemRepository {
  constructor(
    @InjectRepository(InboundItem)
    private readonly repository: Repository<InboundItem>,
  ) { }

  async create(data: Partial<InboundItem>): Promise<InboundItem> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAllByInbound(inbound_id: string): Promise<InboundItem[]> {
    return await this.repository.find({ where: { inbound_id } });
  }

  async findAllByInboundDo(inbound_do_id: string): Promise<InboundItem[]> {
    return await this.repository.find({ where: { inbound_do_id } });
  }

  async findOne(id: string): Promise<InboundItem | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<InboundItem>): Promise<InboundItem | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound Item not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound Item not found');
    }
    await this.repository.softDelete(id);
  }

  async softRemoveByInbound(inbound_id: string): Promise<void> {
    await this.repository.softDelete({ inbound_id });
  }

  async softRemoveByInboundDo(inbound_do_id: string): Promise<void> {
    await this.repository.softDelete({ inbound_do_id });
  }

  async bulkUpdateSaldoInspection(
    updates: Array<{ id: string; quantity_inspection: number, quantity_difference: number, sub_inventory_difference: string }>,
  ): Promise<InboundItem[]> {
    const results: InboundItem[] = [];

    for (const update of updates) {
      const existing = await this.findOne(update.id);
      if (!existing) {
        throw new NotFoundException(`Inbound Item with id ${update.id} not found`);
      }
      await this.repository.update(update.id, {
        quantity_inspection: update.quantity_inspection,
        inspection_status: InspectionStatus.APPROVED,
        quantity_difference: update.quantity_difference,
        sub_inventory_difference: update.sub_inventory_difference,
      });
      const updated = await this.findOne(update.id);
      if (updated) {
        results.push(updated);
      }
    }

    return results;
  }
}
