import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundDo } from '../../core/domain/entities/inbound-do.entity';

@Injectable()
export class InboundDoRepository {
  constructor(
    @InjectRepository(InboundDo)
    private readonly repository: Repository<InboundDo>,
  ) {}

  async create(data: Partial<InboundDo>): Promise<InboundDo> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAllByInbound(inbound_id: string): Promise<InboundDo[]> {
    return await this.repository.find({ where: { inbound_id } });
  }

  async findOne(id: string): Promise<InboundDo | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<InboundDo>): Promise<InboundDo | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound DO not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound DO not found');
    }
    await this.repository.softDelete(id);
  }

  async softRemoveByInbound(inbound_id: string): Promise<void> {
    await this.repository.softDelete({ inbound_id });
  }
}
