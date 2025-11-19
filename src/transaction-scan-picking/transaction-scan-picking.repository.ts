import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { ScanPickingStatus, ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';
import { CreateTransactionScanPickingDto } from './dto/create-transaction-scan-picking.dto';
import { UpdateTransactionScanPickingDto } from './dto/update-transaction-scan-picking.dto';

export interface TransactionScanPickingFilters {
  transactionPickingId?: string;
  status?: string;
  palletId?: string;
}

@Injectable()
export class TransactionScanPickingRepository {
  constructor(
    @InjectRepository(ScanPickingTransaction)
    private readonly repository: Repository<ScanPickingTransaction>,
  ) {}

  async create(data: CreateTransactionScanPickingDto): Promise<ScanPickingTransaction> {
    const entity = this.repository.create({
      ...data,
      status: ScanPickingStatus.PENDING,
    });
    return this.repository.save(entity);
  }

  async findAll(filters: TransactionScanPickingFilters = {}): Promise<ScanPickingTransaction[]> {
    const queryBuilder = this.createBaseQueryBuilder();

    if (filters.transactionPickingId) {
      queryBuilder.andWhere('scan.transaction_picking_id = :transactionPickingId', {
        transactionPickingId: filters.transactionPickingId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('LOWER(scan.status) = LOWER(:status)', { status: filters.status });
    }

    if (filters.palletId) {
      queryBuilder.andWhere(
        '(scan.pallet_source_id = :palletId OR scan.pallet_use_id = :palletId OR scan.pallet_switch_id = :palletId)',
        { palletId: filters.palletId },
      );
    }

    return queryBuilder.orderBy('scan.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<ScanPickingTransaction | null> {
    return this.createBaseQueryBuilder().andWhere('scan.id = :id', { id }).getOne();
  }

  async update(
    id: string,
    data: UpdateTransactionScanPickingDto,
  ): Promise<ScanPickingTransaction> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }

    await this.repository.update(id, {
      ...data,
      status: data.status as ScanPickingStatus,
      inspection_by: data.inspection_by,
    });

    const updated = await this.findOne(id);
    if (!updated) {
      throw new NotFoundException('Transaction scan picking tidak ditemukan');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  private createBaseQueryBuilder(): SelectQueryBuilder<ScanPickingTransaction> {
    return this.repository
      .createQueryBuilder('scan')
      .leftJoinAndSelect('scan.transactionPicking', 'transactionPicking')
      .leftJoinAndSelect('scan.palletSource', 'palletSource')
      .leftJoinAndSelect('scan.palletUse', 'palletUse')
      .leftJoinAndSelect('scan.palletSwitch', 'palletSwitch');
  }
}

