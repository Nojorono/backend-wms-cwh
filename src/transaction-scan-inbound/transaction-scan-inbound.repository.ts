import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { CreateTransactionScanInboundDto, CreateTransactionScanInboundDtoPallet } from './dto/create-transaction-scan-inbound.dto';
import { UpdateTransactionScanInboundDto } from './dto/update-transaction-scan-inbound.dto';

@Injectable()
export class TransactionScanInboundRepository {
  constructor(
    @InjectRepository(TransactionScanInbound)
    private readonly repository: Repository<TransactionScanInbound>,
  ) {}

  async create(data: CreateTransactionScanInboundDtoPallet): Promise<TransactionScanInbound> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(inbound_id: string): Promise<TransactionScanInbound[]> {
    return await this.repository.find({ where: { inbound_id } });
  }

  async findOne(id: string): Promise<TransactionScanInbound | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: UpdateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Transaction scan inbound not found');
    await this.repository.update(id, data);
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException('Transaction scan inbound not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}


