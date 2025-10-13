import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickingTransaction } from '../core/domain/entities/transaction-picking.entity';
import { CreateTransactionPickingDto } from './dto/create-transaction-picking.dto';

@Injectable()
export class TransactionPickingRepository {
  constructor(
    @InjectRepository(PickingTransaction)
    private readonly repository: Repository<PickingTransaction>,
  ) {}

  async create(data: CreateTransactionPickingDto): Promise<PickingTransaction> {
    const pickingTransaction = this.repository.create(data);
    return this.repository.save(pickingTransaction);
  }

  async findAll(): Promise<PickingTransaction[]> {
    return this.repository.find({
      relations: [
        'memo',
        'item',
        'inventoryTracking',
        'sourceWarehouseSub',
        'sourceBin',
        'pallet'
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<PickingTransaction | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'memo',
        'item',
        'inventoryTracking',
        'sourceWarehouseSub',
        'sourceBin',
        'pallet'
      ]
    });
  }

  async update(id: string, data: any): Promise<PickingTransaction> {
    await this.repository.update(id, data);
    const result = await this.findOne(id);
    if (!result) {
      throw new Error('Transaction picking not found');
    }
    return result;
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findByMemoId(memoId: string): Promise<PickingTransaction[]> {
    return this.repository.find({
      where: { memo_id: memoId },
      relations: [
        'memo',
        'item',
        'inventoryTracking',
        'sourceWarehouseSub',
        'sourceBin',
        'pallet'
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<PickingTransaction[]> {
    return this.repository.find({
      where: { status: status as any },
      relations: [
        'memo',
        'item',
        'inventoryTracking',
        'sourceWarehouseSub',
        'sourceBin',
        'pallet'
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async findByPalletId(palletId: string): Promise<PickingTransaction[]> {
    return this.repository.find({
      where: { pallet_id: palletId },
      relations: [
        'memo',
        'item',
        'inventoryTracking',
        'sourceWarehouseSub',
        'sourceBin',
        'pallet'
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async updateStatus(id: string, status: string): Promise<PickingTransaction> {
    await this.repository.update(id, { status: status as any });
    const result = await this.findOne(id);
    if (!result) {
      throw new Error('Transaction picking not found');
    }
    return result;
  }
}
