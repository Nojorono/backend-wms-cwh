import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';
import { CreateInboundIntegrationDto } from './dto/create-inbound-integration.dto';
import { UpdateInboundIntegrationDto } from './dto/update-inbound-integration.dto';
import { CreateInboundIntegrationLineDto } from './dto/create-inbound-integration-line.dto';
import { UpdateInboundIntegrationLineDto } from './dto/update-inbound-integration-line.dto';
import { InboundIntegrationPaginationQueryDto } from './dto/inbound-integration-pagination.dto';

@Injectable()
export class InboundIntegrationRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(InboundIntegration)
    private readonly inboundIntegrationRepo: Repository<InboundIntegration>,
    @InjectRepository(InboundIntegrationLines)
    private readonly inboundIntegrationLineRepo: Repository<InboundIntegrationLines>,
  ) { }

  async createHeader(dto: CreateInboundIntegrationDto): Promise<InboundIntegration> {
    const entity = this.inboundIntegrationRepo.create(dto);
    return await this.inboundIntegrationRepo.save(entity);
  }

  async createHeaderWithLines(
    headerDto: CreateInboundIntegrationDto,
    lineDtos: CreateInboundIntegrationLineDto[],
  ): Promise<{ header: InboundIntegration; lines: InboundIntegrationLines[] }> {
    return await this.dataSource.transaction(async (manager) => {
      const headerRepo = manager.getRepository(InboundIntegration);
      const lineRepo = manager.getRepository(InboundIntegrationLines);

      const header = await headerRepo.save(headerRepo.create(headerDto));
      const lines: InboundIntegrationLines[] = [];
      for (const lineDto of lineDtos) {
        const line = lineRepo.create({
          ...lineDto,
          inbound_integration_id: header.id,
        });
        lines.push(await lineRepo.save(line));
      }
      return { header, lines };
    });
  }

  async findAllHeaders(): Promise<InboundIntegration[]> {
    return await this.inboundIntegrationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllHeadersPaginated(
    query: InboundIntegrationPaginationQueryDto,
  ): Promise<{ data: InboundIntegration[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const sortableFields = new Set([
      'createdAt',
      'updatedAt',
      'status',
      'do_number',
      'source_header_id',
      'receipt_number',
      'source_system',
    ]);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const qb = this.inboundIntegrationRepo
      .createQueryBuilder('header')
      .where('header.deletedAt IS NULL');

    if (query.status?.trim()) {
      qb.andWhere('header.status = :status', { status: query.status.trim() });
    }

    if (query.inbound_id?.trim()) {
      qb.andWhere('header.inbound_id = :inboundId', {
        inboundId: query.inbound_id.trim(),
      });
    }

    if (query.inbound_do_id?.trim()) {
      qb.andWhere('header.inbound_do_id = :inboundDoId', {
        inboundDoId: query.inbound_do_id.trim(),
      });
    }

    if (query.source_system?.trim()) {
      qb.andWhere('header.source_system = :sourceSystem', {
        sourceSystem: query.source_system.trim(),
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(header.do_number ILIKE :search OR header.source_header_id ILIKE :search OR header.receipt_number ILIKE :search OR header.message ILIKE :search)',
        { search },
      );
    }

    const total = await qb.getCount();

    const data = await qb
      .orderBy(`header.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async findAllHeadersByInboundId(inboundId: string): Promise<InboundIntegration[]> {
    return await this.inboundIntegrationRepo.find({
      where: { inbound_id: inboundId, status: 'CREATED' },
      order: { createdAt: 'ASC' },
    });
  }

  async findAllHeadersByInboundIdAnyStatus(inboundId: string): Promise<InboundIntegration[]> {
    return await this.inboundIntegrationRepo.find({
      where: { inbound_id: inboundId },
      order: { createdAt: 'ASC' },
    });
  }

  /** Staging headers whose inbound_do still exists (not soft-deleted). */
  async findAllHeadersByInboundIdWithActiveDo(inboundId: string): Promise<InboundIntegration[]> {
    return await this.inboundIntegrationRepo
      .createQueryBuilder('h')
      .innerJoin('inbound_do', 'd', 'd.id = h.inbound_do_id AND d.deleted_at IS NULL')
      .where('h.inbound_id = :inboundId', { inboundId })
      .andWhere('h.deleted_at IS NULL')
      .orderBy('h.created_at', 'ASC')
      .getMany();
  }

  async softDeleteHeadersNotInDoIds(inboundId: string, activeDoIds: string[]): Promise<number> {
    if (!activeDoIds.length) {
      return 0;
    }
    const result = await this.inboundIntegrationRepo
      .createQueryBuilder()
      .softDelete()
      .where('inbound_id = :inboundId', { inboundId })
      .andWhere('(inbound_do_id IS NULL OR inbound_do_id NOT IN (:...activeDoIds))', {
        activeDoIds,
      })
      .execute();
    return result.affected ?? 0;
  }

  async updateHeadersByInboundId(
    inboundId: string,
    dto: UpdateInboundIntegrationDto,
    onlyHeaderIds?: string[],
  ): Promise<void> {
    const qb = this.inboundIntegrationRepo
      .createQueryBuilder()
      .update(InboundIntegration)
      .set(dto as Partial<InboundIntegration>)
      .where('inbound_id = :inboundId', { inboundId })
      .andWhere('deleted_at IS NULL');

    if (onlyHeaderIds?.length) {
      qb.andWhere('id IN (:...onlyHeaderIds)', { onlyHeaderIds });
    }
    await qb.execute();
  }

  async findLinesByHeaderIds(headerIds: string[]): Promise<InboundIntegrationLines[]> {
    if (headerIds.length === 0) {
      return [];
    }
    return await this.inboundIntegrationLineRepo.find({
      where: { inbound_integration_id: In(headerIds) },
      order: { createdAt: 'ASC' },
    });
  }

  async findHeaderById(id: string): Promise<InboundIntegration | null> {
    return await this.inboundIntegrationRepo.findOne({ where: { id } });
  }

  async findHeaderByInboundDoId(inboundDoId: string): Promise<InboundIntegration | null> {
    return await this.inboundIntegrationRepo.findOne({
      where: { inbound_do_id: inboundDoId },
    });
  }

  async updateHeader(id: string, dto: UpdateInboundIntegrationDto): Promise<void> {
    await this.inboundIntegrationRepo.update(id, dto);
  }

  async updateStatusByInboundId(inboundId: string, status: string): Promise<void> {
    await this.inboundIntegrationRepo.update({ inbound_id: inboundId }, { status });
  }

  async replaceLinesByHeaderId(
    inboundIntegrationId: string,
    lineDtos: CreateInboundIntegrationLineDto[],
  ): Promise<InboundIntegrationLines[]> {
    return await this.dataSource.transaction(async (manager) => {
      const lineRepo = manager.getRepository(InboundIntegrationLines);
      await lineRepo.softDelete({ inbound_integration_id: inboundIntegrationId });

      const rows: InboundIntegrationLines[] = [];
      for (const lineDto of lineDtos) {
        const line = lineRepo.create({
          ...lineDto,
          inbound_integration_id: inboundIntegrationId,
        });
        rows.push(await lineRepo.save(line));
      }
      return rows;
    });
  }

  async removeHeader(id: string): Promise<void> {
    await this.inboundIntegrationRepo.softDelete(id);
  }

  async createLine(dto: CreateInboundIntegrationLineDto): Promise<InboundIntegrationLines> {
    const entity = this.inboundIntegrationLineRepo.create(dto);
    return await this.inboundIntegrationLineRepo.save(entity);
  }

  async findAllLines(): Promise<InboundIntegrationLines[]> {
    return await this.inboundIntegrationLineRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findLineById(id: string): Promise<InboundIntegrationLines | null> {
    return await this.inboundIntegrationLineRepo.findOne({ where: { id } });
  }

  async findLinesByHeaderId(inboundIntegrationId: string): Promise<InboundIntegrationLines[]> {
    return await this.inboundIntegrationLineRepo.find({
      where: { inbound_integration_id: inboundIntegrationId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateLine(id: string, dto: UpdateInboundIntegrationLineDto): Promise<void> {
    await this.inboundIntegrationLineRepo.update(id, dto);
  }

  async removeLine(id: string): Promise<void> {
    await this.inboundIntegrationLineRepo.softDelete(id);
  }
}
