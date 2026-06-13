import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  OutboundIntegrationDeliveries,
  ShipConfirmInternalTransactionType,
} from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';

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
