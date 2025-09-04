import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbound } from '../../core/domain/entities/inbound.entity';

@Injectable()
export class InboundRepository {
  constructor(
    @InjectRepository(Inbound)
    private readonly repository: Repository<Inbound>,
  ) {}

  async create(data: Partial<Inbound>): Promise<Inbound> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(): Promise<Inbound[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<Inbound | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<Inbound>): Promise<Inbound | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound not found');
    }
    await this.repository.softDelete(id);
  }

  async getNextInboundNumberForDate(date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const prefix = `IN-${y}${m}${d}-`;
    const row = await this.repository
      .createQueryBuilder('inbound')
      .select('inbound.inbound_number', 'num')
      .where('inbound.inbound_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('inbound.inbound_number', 'DESC')
      .limit(1)
      .getRawOne<{ num?: string }>();
    let seq = 1;
    if (row?.num && row.num.startsWith(prefix)) {
      const tail = row.num.substring(prefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }
}


