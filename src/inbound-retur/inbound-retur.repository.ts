import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InboundRetur } from '../core/domain/entities/inbound-retur.entity';
import { InboundReturHelper } from '../core/domain/entities/inbound-retur-helper.entity';
import { InboundReturItem } from '../core/domain/entities/inbound-retur-item.entity';
import { CreateInboundReturDto } from './dto/create-inbound-retur.dto';
import { UpdateInboundReturDto } from './dto/update-inbound-retur.dto';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { InboundReturStatus } from '../core/domain/entities/inbound-retur.entity';
import { CreateInboundReturHelperDto } from './dto/create-inbound-retur-helper.dto';
import { CreateInboundReturSortingDto } from './dto/create-inbound-retur-sorting.dto';
import { InboundReturSorting } from '../core/domain/entities/inbound-retur-sorting.entity';
import { UpdateInboundReturSortingDto } from './dto/update-inbound-retur-sorting.dto';

export type CreateInboundReturData = CreateInboundReturDto & {
  inbound_retur_number?: string;
  meta_number?: string;
  status?: InboundReturStatus;
};

export type UpdateInboundReturData = Partial<UpdateInboundReturDto> & {
  arrival_date?: string | Date;
};

@Injectable()
export class InboundReturRepository {
  constructor(
    @InjectRepository(InboundRetur)
    private readonly inboundReturRepo: Repository<InboundRetur>,
    @InjectRepository(InboundReturHelper)
    private readonly helperRepo: Repository<InboundReturHelper>,
    @InjectRepository(InboundReturItem)
    private readonly itemRepo: Repository<InboundReturItem>,
    @InjectRepository(InboundReturSorting)
    private readonly sortingRepo: Repository<InboundReturSorting>,
    private readonly dataSource: DataSource,
  ) { }

  private buildQueryBuilder() {
    return this.inboundReturRepo
      .createQueryBuilder('ir')
      .leftJoinAndSelect('ir.inbound_retur_helpers', 'helpers')
      .leftJoinAndSelect('ir.inbound_retur_items', 'items')
      .leftJoinAndMapOne('items.item', MasterItem, 'item', 'item.id::varchar = items.item_id')
      .leftJoinAndSelect('ir.inbound_retur_sortings', 'sortings');
  }

  async create(data: CreateInboundReturData): Promise<InboundRetur> {
    const id = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(InboundRetur);
      const itemRepo = manager.getRepository(InboundReturItem);

      const { inbound_retur_items, ...main } = data;

      const entity = repo.create({
        ...main,
        arrival_date: main.arrival_date ? new Date(main.arrival_date) : undefined,
      });
      const saved = await repo.save(entity);

      if (inbound_retur_items?.length) {
        for (const it of inbound_retur_items) {
          const item = itemRepo.create({
            inbound_retur_id: saved.id,
            item_id: it.item_id,
            quantity: it.quantity,
            classification_id: it.classification_id,
            uom: it.uom,
          });
          await itemRepo.save(item);
        }
      }
      return saved.id;
    });

    const found = await this.findOne(id);
    if (!found) throw new NotFoundException('Inbound retur not found after create');
    return found;
  }

  async findAll(status?: string): Promise<InboundRetur[]> {
    const qb = this.buildQueryBuilder();
    if (status) {
      qb.andWhere('ir.status = :status', { status });
    }
    return await qb.orderBy('ir.created_at', 'DESC').getMany();
  }

  async findAllPaginated(
    filters: { status?: string },
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: InboundRetur[]; total: number }> {
    const qb = this.inboundReturRepo.createQueryBuilder('ir');
    if (filters.status) {
      qb.andWhere('ir.status = :status', { status: filters.status });
    }
    if (search) {
      qb.andWhere(
        '(ir.inbound_retur_number ILIKE :search OR ir.expedition ILIKE :search OR ir.origin ILIKE :search OR ir.license_plate ILIKE :search OR ir.driver_name ILIKE :search OR ir.meta_number ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const total = await qb.getCount();
    const sortColumn = sortBy === 'createdAt' ? 'ir.created_at' : `ir.${sortBy}`;
    const data = await qb
      .leftJoinAndSelect('ir.inbound_retur_helpers', 'helpers')
      .leftJoinAndSelect('ir.inbound_retur_items', 'items')
      .leftJoinAndMapOne('items.item', MasterItem, 'item', 'item.id::varchar = items.item_id')
      .leftJoinAndSelect('ir.inbound_retur_sortings', 'sortings')
      .orderBy(sortColumn, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    return { data, total };
  }

  async findOne(id: string): Promise<InboundRetur | null> {
    return await this.buildQueryBuilder().where('ir.id = :id', { id }).getOne();
  }

  async update(id: string, data: UpdateInboundReturData): Promise<InboundRetur> {
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(InboundRetur);
      const helperRepo = manager.getRepository(InboundReturHelper);
      const itemRepo = manager.getRepository(InboundReturItem);

      const existing = await this.findOne(id);
      if (!existing) throw new NotFoundException('Inbound retur not found');

      const { inbound_retur_helpers, inbound_retur_items, ...main } = data as UpdateInboundReturDto & Record<string, unknown>;

      await repo.update(id, {
        ...main,
        arrival_date: main.arrival_date
          ? new Date(main.arrival_date)
          : undefined,
      } as Partial<InboundRetur>);

      if (inbound_retur_helpers !== undefined) {
        await helperRepo.softDelete({ inbound_retur_id: id });
        if (Array.isArray(inbound_retur_helpers) && inbound_retur_helpers.length > 0) {
          for (const h of inbound_retur_helpers) {
            const helper = helperRepo.create({
              inbound_retur_id: id,
              helper_user_id: h.helper_user_id,
              helper_name: h.helper_name,
              helper_phone: h.helper_phone,
            });
            await helperRepo.save(helper);
          }
        }
      }

      if (inbound_retur_items !== undefined) {
        await itemRepo.softDelete({ inbound_retur_id: id });
        if (Array.isArray(inbound_retur_items) && inbound_retur_items.length > 0) {
          for (const it of inbound_retur_items) {
            const item = itemRepo.create({
              inbound_retur_id: id,
              item_id: it.item_id,
              quantity: it.quantity,
              classification_id: it.classification_id,
              uom: it.uom,
            });
            await itemRepo.save(item);
          }
        }
      }

      const updated = await this.findOne(id);
      if (!updated) throw new NotFoundException('Inbound retur not found after update');
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    if (!existing) throw new NotFoundException('Inbound retur not found');
    await this.inboundReturRepo.softDelete(id);
  }

  async getNextInboundReturNumber(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear().toString();
    const prefix = `INR-${y}-`;
    const row = await this.inboundReturRepo
      .createQueryBuilder('ir')
      .select('ir.inbound_retur_number', 'num')
      .where('ir.inbound_retur_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('ir.inbound_retur_number', 'DESC')
      .limit(1)
      .getRawOne<{ num?: string }>();
    let seq = 1;
    if (row?.num && row.num.startsWith(prefix)) {
      const tail = row.num.substring(prefix.length);
      const parsed = parseInt(tail, 10);
      if (!Number.isNaN(parsed)) seq = parsed + 1;
    }
    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }

  async createHelpers(payload: CreateInboundReturHelperDto): Promise<InboundReturHelper> {
    const helper = this.helperRepo.create({
      inbound_retur_id: payload.inbound_retur_id,
      helper_user_id: payload.helper_user_id,
      helper_name: payload.helper_name,
      helper_phone: payload.helper_phone,
    });
    return await this.helperRepo.save(helper);
  }

  async deleteHelper(id: string): Promise<void> {
    await this.helperRepo.softDelete(id);
  }

  async createSorting(payload: CreateInboundReturSortingDto[]): Promise<InboundReturSorting[]> {
    const sortings = this.sortingRepo.create(payload);
    return await this.sortingRepo.save(sortings);
  }
  
  async findOneSorting(id: string): Promise<InboundReturSorting | null> {
    return await this.sortingRepo.findOne({ where: { id } });
  }

  async updateSorting(id: string, payload: UpdateInboundReturSortingDto): Promise<InboundReturSorting> {
    try {
      const existing = await this.findOneSorting(id);
      if (!existing) throw new NotFoundException('Inbound retur sorting not found');
      return await this.sortingRepo.save({
        ...existing,
        ...payload,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update inbound retur sorting: ${message}`);
    }
  }

  async deleteSorting(id: string): Promise<void> {
    try {
      const existing = await this.findOneSorting(id);
      if (!existing) throw new NotFoundException('Inbound retur sorting not found');
      await this.sortingRepo.softDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete inbound retur sorting: ${message}`);
    }
  }
}
