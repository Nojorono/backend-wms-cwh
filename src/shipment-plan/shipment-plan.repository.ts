import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentPlan } from '../core/domain/entities/shipment-plan.entity';

@Injectable()
export class ShipmentPlanRepository {
  constructor(
    @InjectRepository(ShipmentPlan)
    private readonly repository: Repository<ShipmentPlan>,
  ) {}

  async create(data: Partial<ShipmentPlan>): Promise<ShipmentPlan> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findLatestBatchNumberForPrefix(prefix: string): Promise<string | null> {
    const latest = await this.repository
      .createQueryBuilder('shipment_plan')
      .where('shipment_plan.batch_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('shipment_plan.batch_number', 'DESC')
      .getOne();

    return latest?.batchNumber ?? null;
  }
}

