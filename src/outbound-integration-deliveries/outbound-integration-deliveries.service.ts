import { Injectable, NotFoundException } from '@nestjs/common';
import { OutboundIntegrationDeliveries } from '../core/domain/entities/outbound-integration-deliveries.entity';
import { CreateOutboundIntegrationDeliveriesDto } from './dto/create-outbound-integration-deliveries.dto';
import { UpdateOutboundIntegrationDeliveriesDto } from './dto/update-outbound-integration-deliveries.dto';
import { OutboundIntegrationDeliveriesRepository } from './outbound-integration-deliveries.repository';

@Injectable()
export class OutboundIntegrationDeliveriesService {
  constructor(private readonly repository: OutboundIntegrationDeliveriesRepository) {}

  async create(dto: CreateOutboundIntegrationDeliveriesDto): Promise<OutboundIntegrationDeliveries> {
    return await this.repository.create(dto);
  }

  async findAll(): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findAll();
  }

  async findByOutboundDoId(outboundDoId: string): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findByOutboundDoId(outboundDoId);
  }

  async findByOutboundMemoId(outboundMemoId: string): Promise<OutboundIntegrationDeliveries[]> {
    return await this.repository.findByOutboundMemoId(outboundMemoId);
  }

  async findOne(id: string): Promise<OutboundIntegrationDeliveries> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException(`Outbound integration delivery with ID ${id} not found`);
    }
    return row;
  }

  async update(
    id: string,
    dto: UpdateOutboundIntegrationDeliveriesDto,
  ): Promise<OutboundIntegrationDeliveries> {
    await this.findOne(id);
    await this.repository.update(id, dto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
