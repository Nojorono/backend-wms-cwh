import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inbound } from '../../core/domain/entities/inbound.entity';
import { MasterItem } from 'src/core/domain/entities/master-item.entity';

@Injectable()
export class InboundRepository {
  constructor(
    @InjectRepository(Inbound)
    private readonly repository: Repository<Inbound>,
  ) { }

  async create(data: Partial<Inbound>): Promise<Inbound> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async findAll(status?: string): Promise<Inbound[]> {
    const qb = this.repository.createQueryBuilder('inbound');
    if (status) {
      qb.andWhere('inbound.status = :status', { status });
    }
    return await qb
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::varchar = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .getMany();
  }

  async findAllPaginated(
    filters: {
      status?: string;
      expedition?: string;
      origin?: string;
      inbound_type?: string;
      driver_name?: string;
      license_plate?: string;
      start_date?: string;
      end_date?: string;
    },
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: Inbound[]; total: number }> {
    const queryBuilder = this.repository.createQueryBuilder('inbound');

    if (filters.status) {
      queryBuilder.andWhere('inbound.status = :status', { status: filters.status });
    }

    if (filters.start_date) {
      queryBuilder.andWhere('inbound.createdAt >= :startDate', { startDate: filters.start_date });
    }

    if (filters.end_date) {
      queryBuilder.andWhere('inbound.createdAt <= :endDate', { endDate: filters.end_date });
    }

    if (search) {
      queryBuilder.andWhere(
        '(inbound.inbound_number ILIKE :search OR inbound.expedition ILIKE :search OR inbound.origin ILIKE :search OR inbound.license_plate ILIKE :search OR inbound.driver_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::varchar = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .leftJoinAndSelect('inbound.transaction_scan_inbounds', 'transaction_scan_inbounds')
      .leftJoinAndSelect('transaction_scan_inbounds.item', 'transaction_scan_inbounds_item')
      .leftJoinAndSelect('transaction_scan_inbounds.pallet', 'transaction_scan_inbounds_pallet')
      .orderBy(`inbound.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findOne(id: string): Promise<Inbound | null> {
    const qb = this.repository.createQueryBuilder('inbound');
    qb.where('inbound.id = :id', { id });
    const entity = await qb
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::varchar = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .leftJoinAndSelect('inbound.transaction_scan_inbounds', 'transaction_scan_inbounds')
      .getOne();
    if (!entity) {
      return null;
    }
    return entity;
  }

  async update(id: string, data: Partial<Inbound>): Promise<Inbound | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound not found');
    }
    await this.repository.update(id, data);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Inbound not found');
    }
    await this.repository.softDelete(id);
  }

  /**
   * Returns a map of inbound id -> inbound_number for the given ids (for populating inbound_reference_number).
   */
  async findInboundNumbersByIds(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) {
      return new Map();
    }
    const distinctIds = [...new Set(ids)];
    const rows = await this.repository
      .createQueryBuilder('inbound')
      .select('inbound.id', 'id')
      .addSelect('inbound.inbound_number', 'inbound_number')
      .where('inbound.id IN (:...ids)', { ids: distinctIds })
      .getRawMany<{ id: string; inbound_number: string | null }>();
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.inbound_number != null) {
        map.set(row.id, row.inbound_number);
      }
    }
    return map;
  }

  async getNextInboundNumberForDate(date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const prefix = `IN-${y}${m}${d}-`;
    const row = await this.repository
      .createQueryBuilder('inbound')
      .select('inbound.inbound_number', 'num')
      .where('inbound.inbound_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('inbound.inbound_number', 'DESC')
      .limit(1)
      .getRawOne<{ num?: string }>();
    let seq = 1;
    if (row?.num && row.num.startsWith(prefix)) {
      const tail = row.num.substring(prefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) {
        seq = parsed + 1;
      }
    }
    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  async findByAssignedHelperId(id: string): Promise<Inbound[]> {
    const qb = this.repository.createQueryBuilder('inbound');
    qb.andWhere('assigned_helpers.helper_user_id = :id', { id });
    return await qb
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::varchar = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .getMany();
  }

  async findAllTransactionScanInbound(status: string): Promise<Inbound[]> {
    return await this.repository
      .createQueryBuilder('inbound')
      .leftJoinAndSelect('inbound.inbound_dos', 'inbound_dos')
      .leftJoinAndSelect('inbound_dos.inbound_items', 'inbound_items')
      .leftJoinAndMapOne(
        'inbound_items.item',
        MasterItem,
        'item',
        'item.id::varchar = inbound_items.item_id',
      )
      .leftJoinAndSelect('inbound.assigned_helpers', 'assigned_helpers')
      .leftJoinAndSelect('inbound.transaction_scan_inbounds', 'transaction_scan_inbounds')
      .where('transaction_scan_inbounds.status = :status', { status: status })
      .getMany();
  }
}
