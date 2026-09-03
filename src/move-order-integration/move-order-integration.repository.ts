import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MoveOrderIntegration } from '../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../core/domain/entities/move-order-integration-lines.entity';
import { CreateMoveOrderIntegrationDto } from './dto/create-move-order-integration.dto';
import { UpdateMoveOrderIntegrationDto } from './dto/update-move-order-integration.dto';
import { CreateMoveOrderIntegrationLineDto } from './dto/create-move-order-integration-line.dto';
import { UpdateMoveOrderIntegrationLineDto } from './dto/update-move-order-integration-line.dto';
import { MoveOrderIntegrationPaginationQueryDto } from './dto/move-order-integration-pagination.dto';

@Injectable()
export class MoveOrderIntegrationRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(MoveOrderIntegration)
    private readonly headerRepo: Repository<MoveOrderIntegration>,
    @InjectRepository(MoveOrderLineIntegration)
    private readonly lineRepo: Repository<MoveOrderLineIntegration>,
  ) { }

  async createHeader(dto: CreateMoveOrderIntegrationDto): Promise<MoveOrderIntegration> {
    const entity = this.headerRepo.create(dto);
    return await this.headerRepo.save(entity);
  }

  async createHeaderWithLines(
    headerDto: CreateMoveOrderIntegrationDto,
    lineDtos: CreateMoveOrderIntegrationLineDto[],
  ): Promise<{ header: MoveOrderIntegration; lines: MoveOrderLineIntegration[] }> {
    return await this.dataSource.transaction(async (manager) => {
      const hRepo = manager.getRepository(MoveOrderIntegration);
      const lRepo = manager.getRepository(MoveOrderLineIntegration);

      const header = await hRepo.save(hRepo.create(headerDto));
      const lines: MoveOrderLineIntegration[] = [];
      for (const lineDto of lineDtos) {
        const { move_order_integration_id: _omit, ...rest } = lineDto;
        const line = lRepo.create({
          ...rest,
          move_order_integration_id: header.id,
        });
        lines.push(await lRepo.save(line));
      }
      return { header, lines };
    });
  }

  async findAllHeaders(): Promise<MoveOrderIntegration[]> {
    return await this.headerRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllHeadersPaginated(
    organizationId: number,
    query: MoveOrderIntegrationPaginationQueryDto,
  ): Promise<{ data: MoveOrderIntegration[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const sortableFields = new Set(['createdAt', 'updatedAt', 'request_number', 'iface_status']);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const qb = this.headerRepo
      .createQueryBuilder('header')
      .where('header.deletedAt IS NULL');

    if (organizationId) {
      qb.andWhere('header.organization_id = :organizationId', {
        organizationId,
      });
    }
    if (query.iface_status?.trim()) {
      qb.andWhere('header.iface_status = :ifaceStatus', {
        ifaceStatus: query.iface_status.trim(),
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
        '(header.request_number ILIKE :search OR header.source_header_id ILIKE :search OR header.iface_message ILIKE :search)',
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

  async findHeaderById(id: string): Promise<MoveOrderIntegration | null> {
    return await this.headerRepo.findOne({ where: { id } });
  }

  async findHeaderBySourceHeaderId(sourceHeaderId: string): Promise<MoveOrderIntegration | null> {
    return await this.headerRepo.findOne({
      where: { source_header_id: sourceHeaderId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLinesByHeaderIds(headerIds: string[]): Promise<MoveOrderLineIntegration[]> {
    if (headerIds.length === 0) {
      return [];
    }
    return await this.lineRepo.find({
      where: { move_order_integration_id: In(headerIds) },
      order: { createdAt: 'ASC' },
    });
  }

  async updateHeader(id: string, dto: UpdateMoveOrderIntegrationDto): Promise<void> {
    await this.headerRepo.update(id, dto);
  }

  async deleteAndInsertLinesByHeaderId(
    headerId: string,
    lineDtos: CreateMoveOrderIntegrationLineDto[],
  ): Promise<MoveOrderLineIntegration[]> {
    return await this.dataSource.transaction(async (manager) => {
      const lRepo = manager.getRepository(MoveOrderLineIntegration);
      await lRepo.delete({ move_order_integration_id: headerId });

      const rows: MoveOrderLineIntegration[] = [];
      for (const lineDto of lineDtos) {
        const { move_order_integration_id: _omit, ...rest } = lineDto;
        const line = lRepo.create({
          ...rest,
          move_order_integration_id: headerId,
        });
        rows.push(await lRepo.save(line));
      }
      return rows;
    });
  }

  async removeHeader(id: string): Promise<void> {
    await this.lineRepo.softDelete({ move_order_integration_id: id });
    await this.headerRepo.softDelete(id);
  }

  async createLine(dto: CreateMoveOrderIntegrationLineDto): Promise<MoveOrderLineIntegration> {
    const entity = this.lineRepo.create(dto);
    return await this.lineRepo.save(entity);
  }

  async findAllLines(): Promise<MoveOrderLineIntegration[]> {
    return await this.lineRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findLineById(id: string): Promise<MoveOrderLineIntegration | null> {
    return await this.lineRepo.findOne({ where: { id } });
  }

  async findLinesByHeaderId(headerId: string): Promise<MoveOrderLineIntegration[]> {
    return await this.lineRepo.find({
      where: { move_order_integration_id: headerId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateLine(id: string, dto: UpdateMoveOrderIntegrationLineDto): Promise<void> {
    await this.lineRepo.update(id, dto);
  }

  async removeLine(id: string): Promise<void> {
    await this.lineRepo.softDelete(id);
  }
}
