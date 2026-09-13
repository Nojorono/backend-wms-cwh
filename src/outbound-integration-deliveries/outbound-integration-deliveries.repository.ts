import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  OutboundIntegrationDeliveries,
  ShipConfirmInternalTransactionType,
} from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';
import { OutboundIntegrationDeliveriesPaginationQueryDto } from './dto/outbound-integration-deliveries-pagination.dto';

const DELIVERY_RELATIONS = ['outbound_do', 'outbound_memo', 'outbound_memo_item'] as const;

@Injectable()
export class OutboundIntegrationDeliveriesRepository {
  constructor(
    @InjectRepository(OutboundIntegrationDeliveries)
    private readonly repo: Repository<OutboundIntegrationDeliveries>,
  ) { }

  async create(dto: CreateOutboundIntegrationDeliveriesDto): Promise<OutboundIntegrationDeliveries> {
    const entity = this.repo.create(dto);
    return await this.repo.save(entity);
  }

  async createMany(
    dtos: CreateOutboundIntegrationDeliveriesDto[],
  ): Promise<OutboundIntegrationDeliveries[]> {
    if (!dtos.length) {
      return [];
    }
    const entities = this.repo.create(dtos);
    return await this.repo.save(entities);
  }

  async softDeleteByOutboundDoIdAndTransactionType(
    outboundDoId: string,
    transactionType: ShipConfirmInternalTransactionType,
  ): Promise<void> {
    await this.repo.softDelete({
      outbound_do_id: outboundDoId,
      transaction_type: transactionType,
    });
  }

  async findAll(): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repo.find({
      relations: [...DELIVERY_RELATIONS],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    query: OutboundIntegrationDeliveriesPaginationQueryDto,
  ): Promise<{ data: OutboundIntegrationDeliveries[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const sortableFields = new Set([
      'createdAt',
      'updatedAt',
      'transaction_type',
      'create_delivery_status',
      'ship_confirm_status',
      'pick_release_status',
      'source_header_id',
      'delivery_name',
    ]);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const qb = this.repo
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.outbound_do', 'outbound_do')
      .leftJoinAndSelect('delivery.outbound_memo', 'outbound_memo')
      .leftJoinAndSelect('delivery.outbound_memo_item', 'outbound_memo_item')
      .where('delivery.deletedAt IS NULL');

    if (query.transaction_type?.trim()) {
      qb.andWhere('delivery.transaction_type = :transactionType', {
        transactionType: query.transaction_type.trim(),
      });
    }

    if (query.outbound_do_id?.trim()) {
      qb.andWhere('delivery.outbound_do_id = :outboundDoId', {
        outboundDoId: query.outbound_do_id.trim(),
      });
    }

    if (query.outbound_memo_id?.trim()) {
      qb.andWhere('delivery.outbound_memo_id = :outboundMemoId', {
        outboundMemoId: query.outbound_memo_id.trim(),
      });
    }

    if (query.source_system?.trim()) {
      qb.andWhere('delivery.source_system = :sourceSystem', {
        sourceSystem: query.source_system.trim(),
      });
    }

    if (query.status?.trim()) {
      qb.andWhere(
        '(delivery.create_delivery_status = :status OR delivery.ship_confirm_status = :status OR delivery.pick_release_status = :status OR delivery.update_delivery_status = :status)',
        { status: query.status.trim() },
      );
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(delivery.source_header_id ILIKE :search OR delivery.delivery_name ILIKE :search OR delivery.create_delivery_message ILIKE :search OR delivery.ship_confirm_message ILIKE :search OR delivery.pick_release_message ILIKE :search)',
        { search },
      );
    }

    const total = await qb.getCount();

    const data = await qb
      .orderBy(`delivery.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findByOutboundDoId(outboundDoId: string): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repo.find({
      where: { outbound_do_id: outboundDoId },
      relations: [...DELIVERY_RELATIONS],
      order: { createdAt: 'ASC' },
    });
  }

  async findByOutboundDoIdAndTransactionTypes(
    outboundDoId: string,
    transactionTypes: ShipConfirmInternalTransactionType[],
  ): Promise<OutboundIntegrationDeliveries[]> {
    if (!transactionTypes.length) {
      return await this.findByOutboundDoId(outboundDoId);
    }

    return await this.repo.find({
      where: {
        outbound_do_id: outboundDoId,
        transaction_type: In(transactionTypes),
      },
      relations: [...DELIVERY_RELATIONS],
      order: { createdAt: 'ASC' },
    });
  }

  async findByOutboundMemoId(outboundMemoId: string): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repo.find({
      where: { outbound_memo_id: outboundMemoId },
      relations: [...DELIVERY_RELATIONS],
      order: { createdAt: 'ASC' },
    });
  }

  async findByMemoIdAndTransactionTypes(
    memoId: string,
    transactionTypes: ShipConfirmInternalTransactionType[],
  ): Promise<OutboundIntegrationDeliveries[]> {
    if (!transactionTypes.length) {
      return await this.findByOutboundMemoId(memoId);
    }

    return await this.repo.find({
      where: [
        { outbound_memo_id: memoId, transaction_type: In(transactionTypes) },
        { source_header_id: memoId, transaction_type: In(transactionTypes) },
      ],
      relations: [...DELIVERY_RELATIONS],
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<OutboundIntegrationDeliveries | null> {
    return await this.repo.findOne({
      where: { id },
      relations: [...DELIVERY_RELATIONS],
    });
  }

  async update(id: string, dto: UpdateOutboundIntegrationDeliveriesDto): Promise<void> {
    await this.repo.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
