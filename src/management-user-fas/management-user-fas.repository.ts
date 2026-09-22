import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { ManagementUserFas } from '../core/domain/entities/management-user-fas.entity';
import { CreateManagementUserFasDto } from './dto/create-management-user-fas.dto';
import { UpdateManagementUserFasDto } from './dto/update-management-user-fas.dto';
import { ManagementUserFasPaginationQueryDto } from './dto/management-user-fas-pagination.dto';

const RELATIONS = ['organization'] as const;

@Injectable()
export class ManagementUserFasRepository {
  constructor(
    @InjectRepository(ManagementUserFas)
    private readonly repo: Repository<ManagementUserFas>,
  ) { }

  async create(dto: CreateManagementUserFasDto): Promise<ManagementUserFas> {
    const entity = this.repo.create({
      organizationId: dto.organization_id,
      name: dto.name,
      email: dto.email,
    });
    const saved = await this.repo.save(entity);
    return (await this.findById(saved.id)) as ManagementUserFas;
  }

  async findById(id: string): Promise<ManagementUserFas | null> {
    return await this.repo.findOne({
      where: { id },
      relations: [...RELATIONS],
    });
  }

  async findByEmail(
    email: string,
    organizationId?: string | null,
  ): Promise<ManagementUserFas | null> {
    const where: FindOptionsWhere<ManagementUserFas> = {
      email: email.trim(),
    };

    if (organizationId !== undefined) {
      where.organizationId = organizationId === null ? IsNull() : organizationId;
    }

    return await this.repo.findOne({
      where,
      relations: [...RELATIONS],
    });
  }

  async findByName(name: string): Promise<ManagementUserFas | null> {
    return await this.repo.findOne({
      where: { name: name.trim() },
      relations: [...RELATIONS],
    });
  }

  async findAll(
    query: ManagementUserFasPaginationQueryDto,
  ): Promise<ManagementUserFas[]> {
    const qb = this.repo
      .createQueryBuilder('fas')
      .leftJoinAndSelect('fas.organization', 'organization')
      .where('fas.deletedAt IS NULL');

    if (query.organization_id?.trim()) {
      qb.andWhere('fas.organizationId = :organizationId', {
        organizationId: query.organization_id.trim(),
      });
    }

    if (query.name?.trim()) {
      qb.andWhere('fas.name ILIKE :name', {
        name: `%${query.name.trim()}%`,
      });
    }

    if (query.email?.trim()) {
      qb.andWhere('fas.email ILIKE :email', {
        email: `%${query.email.trim()}%`,
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere('(fas.name ILIKE :search OR fas.email ILIKE :search)', { search });
    }

    return await qb
      .orderBy('organization.organization_name', 'ASC')
      .addOrderBy('fas.name', 'ASC')
      .getMany();
  }

  async findAllPaginated(
    query: ManagementUserFasPaginationQueryDto,
  ): Promise<{ data: ManagementUserFas[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const sortableFields = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'email',
      'organizationId',
    ]);
    const sortField = sortableFields.has(sortBy) ? sortBy : 'createdAt';

    const qb = this.repo
      .createQueryBuilder('fas')
      .leftJoinAndSelect('fas.organization', 'organization')
      .where('fas.deletedAt IS NULL');

    if (query.organization_id?.trim()) {
      qb.andWhere('fas.organizationId = :organizationId', {
        organizationId: query.organization_id.trim(),
      });
    }

    if (query.name?.trim()) {
      qb.andWhere('fas.name ILIKE :name', {
        name: `%${query.name.trim()}%`,
      });
    }

    if (query.email?.trim()) {
      qb.andWhere('fas.email ILIKE :email', {
        email: `%${query.email.trim()}%`,
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere('(fas.name ILIKE :search OR fas.email ILIKE :search)', { search });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy(`fas.${sortField}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async update(id: string, dto: UpdateManagementUserFasDto): Promise<ManagementUserFas> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Management user FAS with ID ${id} not found`);
    }

    const patch: Partial<ManagementUserFas> = {};
    if (dto.organization_id !== undefined) {
      patch.organizationId = dto.organization_id;
    }
    if (dto.name !== undefined) {
      patch.name = dto.name;
    }
    if (dto.email !== undefined) {
      patch.email = dto.email;
    }

    if (Object.keys(patch).length > 0) {
      await this.repo.update(id, patch);
    }

    return (await this.findById(id)) as ManagementUserFas;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Management user FAS with ID ${id} not found`);
    }
    await this.repo.softDelete(id);
  }
}
