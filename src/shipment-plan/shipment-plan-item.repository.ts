import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentPlanItem } from '../core/domain/entities/shipment-plan-item.entity';

@Injectable()
export class ShipmentPlanItemRepository {
  constructor(
    @InjectRepository(ShipmentPlanItem)
    private readonly repository: Repository<ShipmentPlanItem>,
  ) {}

  async createMany(data: Partial<ShipmentPlanItem>[]): Promise<ShipmentPlanItem[]> {
    if (!data.length) {
      return [];
    }
    const entities = this.repository.create(data);
    return this.repository.save(entities);
  }
}

