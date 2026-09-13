import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';
import { CreateTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { PaginationQueryDto } from '../core/dto/pagination.dto';

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

  async createMany(data: CreateTransactionPickingDto[]): Promise<PickingTransaction[]> {
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }

  async findAll(): Promise<PickingTransaction[]> {
    return this.repository.find({
      relations: [
        'do',
        'memo',
        'item',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouseSub',
        'destinationBin',
        'transactionScanPicking',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    paginationQuery: PaginationQueryDto & { has_memo_id?: boolean; item_id?: string },
  ): Promise<{ data: PickingTransaction[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy,
      sortOrder = 'DESC',
      status,
      has_memo_id,
      item_id,
    } = paginationQuery;

    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.do', 'do')
      .leftJoinAndSelect('transaction.memo', 'memo')
      .leftJoinAndSelect('transaction.item', 'item')
      .leftJoinAndSelect('transaction.sourceWarehouseSub', 'sourceWarehouseSub')
      .leftJoinAndSelect('transaction.sourceBin', 'sourceBin')
      .leftJoinAndSelect('transaction.transactionScanPicking', 'transactionScanPicking')
      .where('transaction.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (has_memo_id !== undefined) {
      if (has_memo_id) {
        queryBuilder.andWhere('transaction.memo_id IS NOT NULL');
      } else {
        queryBuilder.andWhere('transaction.memo_id IS NULL');
      }
    }

    if (item_id) {
      queryBuilder.andWhere('transaction.item_id = :item_id', { item_id });
    }

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.orWhere('LOWER(do.outbound_do_number) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(memo.requestor) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(memo.destination) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(item.sku) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(item.item_number) LIKE :search', { search: searchTerm })
            .orWhere('LOWER(item.description) LIKE :search', { search: searchTerm });
        }),
      );
    }

    const sortableFields: Record<string, string> = {
      createdAt: 'transaction.createdAt',
      updatedAt: 'transaction.updatedAt',
      status: 'transaction.status',
      quantity: 'transaction.quantity',
    };

    const orderByField = sortBy && sortableFields[sortBy] ? sortableFields[sortBy] : 'transaction.createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(orderByField, orderDirection);
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<PickingTransaction | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'do',
        'memo',
        'item',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouseSub',
        'destinationBin',
        'transactionScanPicking',
      ],
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

  async findByMemoId(memoId: string, status?: Status): Promise<PickingTransaction[]> {
    const whereCondition: any = { memo_id: memoId };
    if (status) {
      whereCondition.status = status;
    }

    return this.repository.find({
      where: whereCondition,
      relations: [
        'do',
        'memo',
        'item',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouseSub',
        'destinationBin',
        'transactionScanPicking',
        'transactionScanPicking.palletSource',
        'transactionScanPicking.palletUse',
        'transactionScanPicking.palletSwitch',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDoId(doId: string): Promise<PickingTransaction[]> {
    return this.repository.find({
      where: { do_id: doId },
      relations: [
        'do',
        'memo',
        'item',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouseSub',
        'destinationBin',
        'transactionScanPicking',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<PickingTransaction[]> {
    return this.repository.find({
      where: { status: status as any },
      relations: [
        'do',
        'memo',
        'item',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouseSub',
        'destinationBin',
        'transactionScanPicking',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findByItemId(itemId: string): Promise<PickingTransaction[]> {
    return this.repository.find({
      where: { item_id: itemId },
      relations: [
        'do',
        'memo',
        'item',
        'sourceWarehouseSub',
        'sourceBin',
        'destinationWarehouseSub',
        'destinationBin',
        'transactionScanPicking',
      ],
      order: { createdAt: 'DESC' },
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

  async cancelTransaction(id: string): Promise<void> {
    await this.repository.update(id, { status: Status.CANCELLED });
  }

  async cancelTransactionByMemoId(memoId: string): Promise<void> {
    await this.repository.update({ memo_id: memoId }, { status: Status.CANCELLED } as any);
  }

  async detachMemo(memoId: string): Promise<void> {
    await this.repository.update({ memo_id: memoId }, { status: Status.CANCELLED});
  }

  async detachDo(doId: string): Promise<void> {
    await this.repository.update({ do_id: doId }, { status: Status.CANCELLED });
  }

  async attachMemo(transactionIds: string[], memoId: string): Promise<void> {
    await this.repository.update(transactionIds, { memo_id: memoId } );
  }

  async attachDo(transactionIds: string[], doId: string): Promise<void> {
    await this.repository.update(transactionIds, { do_id: doId });
  }

  /**
   * Find active transaction pickings (PENDING or COMPLETED) that use a specific pallet
   * by checking transaction_scan_picking records.
   * Excludes soft-deleted scan records and returns distinct transactions.
   */
  async findActiveByPalletId(palletId: string, excludeTransactionPickingId?: string): Promise<PickingTransaction[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('transaction')
      .distinct(true)
      .innerJoin(
        'transaction_scan_picking',
        'scan',
        `scan.transaction_picking_id = transaction.id AND scan.pallet_use_id = :palletId AND scan.deleted_at IS NULL`,
        { palletId },
      )
      .where('transaction.deletedAt IS NULL')
      .andWhere('transaction.status IN (:...statuses)', {
        statuses: [Status.PENDING, Status.COMPLETED],
      });

    if (excludeTransactionPickingId) {
      queryBuilder.andWhere('transaction.id != :excludeId', {
        excludeId: excludeTransactionPickingId,
      });
    }

    return queryBuilder.getMany();
  }
}
