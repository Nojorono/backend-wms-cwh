import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ShipmentPlan } from '../core/domain/entities/shipment-plan.entity';

@Injectable()
export class ShipmentPlanRepository {
  constructor(
    @InjectRepository(ShipmentPlan)
    private readonly repository: Repository<ShipmentPlan>,
  ) { }

  async create(data: Partial<ShipmentPlan>): Promise<ShipmentPlan> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findLatestBatchNumberForPrefix(prefix: string, organizationId: string | null): Promise<string | null> {
    const latest = await this.repository
      .createQueryBuilder('shipment_plan')
      .where('shipment_plan.organization_id = :organizationId', { organizationId: organizationId })
      .andWhere('shipment_plan.batch_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('shipment_plan.batch_number', 'DESC')
      .getOne();

    return latest?.batchNumber ?? null;
  }

  async findAll(): Promise<ShipmentPlan[]> {
    return await this.repository.find({
      where: { organizationId: IsNull() },
      relations: ['items'],
      order: { batchNumber: 'DESC' },
      take: 1,
    });
  }

  async findAllByOrganizationId(organizationId: string): Promise<ShipmentPlan[]> {
    return await this.repository.find({
      where: { organizationId: organizationId },
      relations: ['items'],
      order: { batchNumber: 'DESC' },
      take: 1,
    });
  }

  async sumQuantityFromLatestBatchByOrganizationId(
    organizationId: string,
    source: string,
    type: string,
    reg: string,
    code: string,
  ): Promise<number> {
    const latestShipmentPlan = await this.repository.findOne({
      where: { organizationId },
      order: { batchNumber: 'DESC', createdAt: 'DESC' },
    });

    if (!latestShipmentPlan) {
      return 0;
    }

    const sumResult = await this.repository
      .createQueryBuilder('shipment_plan')
      .leftJoin('shipment_plan.items', 'item')
      .select('COALESCE(SUM(item.quantity), 0)', 'totalQuantity')
      .where('shipment_plan.id = :shipmentPlanId', { shipmentPlanId: latestShipmentPlan.id })
      .andWhere('item.source = :source', { source })
      .andWhere('item.type = :type', { type })
      .andWhere('item.reg = :reg', { reg })
      .andWhere('item.code = :code', { code })
      .getRawOne<{ totalQuantity: string }>();

    return Number(sumResult?.totalQuantity ?? 0);
  }
}

