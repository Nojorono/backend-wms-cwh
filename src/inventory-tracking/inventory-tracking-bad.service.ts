import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InventoryTrackingBadRepository } from './inventory-tracking-bad.repository';
import { CreateInventoryTrackingBadDto } from './dto/create-inventory-bad.dto';
import { InventoryTrackingBad } from '../core/domain/entities/inventory-tracking-bad.entity';

@Injectable()
export class InventoryTrackingBadService {
  constructor(
    private readonly repository: InventoryTrackingBadRepository,
  ) { }

  async createOrUpdate(
    dto: CreateInventoryTrackingBadDto,
  ): Promise<InventoryTrackingBad> {
    if (dto.inbound_retur_id === undefined || dto.inbound_retur_id === null) {
      throw new BadRequestException('inbound_retur_id is required');
    }
    if (dto.inventory_tracking_id === undefined || dto.inventory_tracking_id === null) {
      throw new BadRequestException('inventory_tracking_id is required');
    }
    if (dto.item_id === undefined || dto.item_id === null) {
      throw new BadRequestException('item_id is required');
    }
    if (dto.quantity === undefined || dto.quantity === null) {
      throw new BadRequestException('quantity is required');
    }
    if (dto.quantity < 0) {
      throw new BadRequestException('Quantity must be greater than or equal to 0');
    }
    return await this.repository.createOrUpdate(dto);
  }

  async findById(id: string): Promise<InventoryTrackingBad> {
    const found = await this.repository.findById(id);
    if (!found) {
      throw new NotFoundException(`Inventory tracking bad with id ${id} not found`);
    }
    return found;
  }

  async findAll(): Promise<InventoryTrackingBad[]> {
    return await this.repository.findAll();
  }

  async findByInboundReturId(
    inbound_retur_id: string,
  ): Promise<InventoryTrackingBad[]> {
    return await this.repository.findByInboundReturId(inbound_retur_id);
  }
}
