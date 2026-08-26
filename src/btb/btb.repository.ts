import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Btb } from '../core/domain/entities/btb.entity';
import { BtbDetails } from '../core/domain/entities/btb-details.entity';
import { CreateBtbDto } from './dto/create-btb.dto';
import { CreateBtbDetailDto } from './dto/create-btb-detail.dto';
import { UpdateBtbDto } from './dto/update-btb.dto';
import { BtbPaginationQueryDto } from './dto/btb-pagination.dto';

const BTB_RELATIONS = ['details', 'organization'] as const;

@Injectable()
export class BtbRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Btb)
    private readonly btbRepo: Repository<Btb>,
    @InjectRepository(BtbDetails)
    private readonly detailRepo: Repository<BtbDetails>,
  ) { }

  async create(dto: CreateBtbDto): Promise<Btb> {
    const { details, btb_date, ...header } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const headerRepo = manager.getRepository(Btb);
      const detailRepo = manager.getRepository(BtbDetails);

      const savedHeader = await headerRepo.save(
        headerRepo.create({
          ...header,
          btb_date: btb_date ? new Date(btb_date) : undefined,
        }),
      );

      if (details?.length) {
        const detailEntities = details.map((line) =>
          detailRepo.create({
            ...line,
            btb_uuid: savedHeader.id,
            created_by: line.created_by ?? header.created_by,
            updated_by: line.updated_by ?? header.updated_by,
          }),
        );
        await detailRepo.save(detailEntities);
      }

      return (await this.findById(savedHeader.id, manager.getRepository(Btb))) as Btb;
    });
  }

  async getAllLastDateInsert(): Promise<Btb[]> {
    const latest = await this.btbRepo.findOne({
      where: {},
      order: { createdAt: 'DESC' },
      select: ['createdAt'],
    });

    if (!latest?.createdAt) {
      return [];
    }

    const lastCreatedAt = new Date(latest.createdAt);
    const startOfDay = new Date(lastCreatedAt);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(lastCreatedAt);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await this.btbRepo
      .createQueryBuilder('btb')
      .leftJoinAndSelect('btb.details', 'details')
      .leftJoinAndSelect('btb.organization', 'organization')
      .where('btb.deletedAt IS NULL')
      .andWhere('btb.createdAt >= :startOfDay', { startOfDay })
      .andWhere('btb.createdAt <= :endOfDay', { endOfDay })
      .orderBy('btb.createdAt', 'DESC')
      .getMany();
  }

  async findAllPaginated(
    query: BtbPaginationQueryDto,
  ): Promise<{ data: Btb[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const sortableFields = new Set([
      'createdAt',
      'updatedAt',
      'btb_number',
      'btb_date',
      'status',
      'sales_nik',
      'sales_spv_nik',
      'organization_code',
    ]);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const qb = this.btbRepo
      .createQueryBuilder('btb')
      .leftJoinAndSelect('btb.details', 'details')
      .leftJoinAndSelect('btb.organization', 'organization')
      .where('btb.deletedAt IS NULL');

    if (query.status?.trim()) {
      qb.andWhere('btb.status = :status', { status: query.status.trim() });
    }

    if (query.organization_id?.trim()) {
      qb.andWhere('btb.organization_id = :organizationId', {
        organizationId: query.organization_id.trim(),
      });
    }

    if (query.sales_nik?.trim()) {
      qb.andWhere('btb.sales_nik = :salesNik', { salesNik: query.sales_nik.trim() });
    }

    if (query.sales_spv_nik?.trim()) {
      qb.andWhere('btb.sales_spv_nik = :salesSpvNik', {
        salesSpvNik: query.sales_spv_nik.trim(),
      });
    }

    if (query.date_from) {
      qb.andWhere('btb.btb_date >= :dateFrom', { dateFrom: query.date_from });
    }

    if (query.date_to) {
      qb.andWhere('btb.btb_date <= :dateTo', { dateTo: query.date_to });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(btb.btb_number ILIKE :search OR btb.sales_name ILIKE :search OR btb.sales_spv_name ILIKE :search OR btb.organization_code ILIKE :search)',
        { search },
      );
    }

    const total = await qb.getCount();

    const data = await qb
      .orderBy(`btb.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findById(id: string, repo?: Repository<Btb>): Promise<Btb | null> {
    const headerRepo = repo ?? this.btbRepo;
    return await headerRepo.findOne({
      where: { id },
      relations: [...BTB_RELATIONS],
    });
  }

  async findByBtbNumber(btbNumber: string): Promise<Btb | null> {
    return await this.btbRepo.findOne({
      where: { btb_number: btbNumber },
      relations: [...BTB_RELATIONS],
    });
  }

  async update(id: string, dto: UpdateBtbDto): Promise<Btb> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`BTB with ID ${id} not found`);
    }

    const { details, btb_date, ...header } = dto;

    return await this.dataSource.transaction(async (manager) => {
      const headerRepo = manager.getRepository(Btb);
      const detailRepo = manager.getRepository(BtbDetails);

      const headerPatch = Object.fromEntries(
        Object.entries({
          ...header,
          ...(btb_date !== undefined
            ? { btb_date: btb_date ? new Date(btb_date) : null }
            : {}),
        }).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(headerPatch).length > 0) {
        await headerRepo.update(id, headerPatch);
      }

      if (details?.length) {
        for (const line of details) {
          await this.upsertDetailLine(detailRepo, id, line, header.updated_by);
        }
      }

      return (await this.findById(id, headerRepo)) as Btb;
    });
  }

  private async upsertDetailLine(
    detailRepo: Repository<BtbDetails>,
    btbUuid: string,
    line: CreateBtbDetailDto,
    fallbackUpdatedBy?: string,
  ): Promise<void> {
    if (line.id) {
      const existing = await detailRepo.findOne({
        where: { id: line.id, btb_uuid: btbUuid },
      });
      if (!existing) {
        throw new NotFoundException(
          `BTB detail id=${line.id} was not found under BTB ${btbUuid}`,
        );
      }

      const { id: _id, ...lineData } = line;
      const patch = Object.fromEntries(
        Object.entries({
          ...lineData,
          updated_by: line.updated_by ?? fallbackUpdatedBy,
        }).filter(([, value]) => value !== undefined),
      );

      if (Object.keys(patch).length > 0) {
        await detailRepo.update(line.id, patch);
      }
      return;
    }

    await detailRepo.save(
      detailRepo.create({
        ...line,
        btb_uuid: btbUuid,
        updated_by: line.updated_by ?? fallbackUpdatedBy,
      }),
    );
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`BTB with ID ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(BtbDetails).softDelete({ btb_uuid: id });
      await manager.getRepository(Btb).softDelete(id);
    });
  }

  async removeDetail(btbId: string, detailId: string): Promise<void> {
    const detail = await this.detailRepo.findOne({
      where: { id: detailId, btb_uuid: btbId },
    });
    if (!detail) {
      throw new NotFoundException(
        `BTB detail id=${detailId} was not found under BTB ${btbId}`,
      );
    }
    await this.detailRepo.softDelete(detailId);
  }
}
