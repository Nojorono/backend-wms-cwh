import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionScanInboundRepository } from './transaction-scan-inbound.repository';
import { CreateTransactionScanInboundDto } from './dto/create-transaction-scan-inbound.dto';
import { UpdateTransactionScanInboundDto } from './dto/update-transaction-scan-inbound.dto';
import { TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';
import { MasterPalletRepository } from 'src/master-pallet/master-pallet.repository';

@Injectable()
export class TransactionScanInboundService {
  constructor(private readonly repository: TransactionScanInboundRepository, private readonly palletRepository: MasterPalletRepository) {}

  async create(data: CreateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    const pallet = await this.palletRepository.findByPalletCode(data.pallet_code || '');
    if (!pallet) throw new NotFoundException('Pallet not found');
    return this.repository.create({
      ...data,
      pallet_id: pallet.id,
    });
  }

  async findAll(inbound_id: string): Promise<TransactionScanInbound[]> {
    return this.repository.findAll(inbound_id);
  }

  async findOne(id: string): Promise<TransactionScanInbound> {
    const entity = await this.repository.findOne(id);
    if (!entity) throw new NotFoundException('Transaction scan inbound not found');
    return entity;
  }

  async update(id: string, data: UpdateTransactionScanInboundDto): Promise<TransactionScanInbound> {
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}


