import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ManagementUserFas } from '../core/domain/entities/management-user-fas.entity';
import { ManagementUserFasRepository } from './management-user-fas.repository';
import { CreateManagementUserFasDto } from './dto/create-management-user-fas.dto';
import { UpdateManagementUserFasDto } from './dto/update-management-user-fas.dto';
import { ManagementUserFasPaginationQueryDto } from './dto/management-user-fas-pagination.dto';
import { ManagementUserFasGroupedByOrgDto } from './dto/management-user-fas-grouped.dto';

@Injectable()
export class ManagementUserFasService {
  constructor(private readonly repository: ManagementUserFasRepository) {}

  async create(dto: CreateManagementUserFasDto): Promise<ManagementUserFas> {
    await this.assertUniqueNameAndEmail(dto.name, dto.email);
    return await this.repository.create(dto);
  }

  async findAllGroupedByOrganization(
    query: ManagementUserFasPaginationQueryDto,
  ): Promise<ManagementUserFasGroupedByOrgDto[]> {
    const rows = await this.repository.findAll(query);
    const groups = new Map<string, ManagementUserFasGroupedByOrgDto>();

    for (const row of rows) {
      const organizationId = row.organizationId ?? null;
      const key = organizationId ?? '__NULL__';

      let group = groups.get(key);
      if (!group) {
        group = {
          organization_id: organizationId,
          organization_code: row.organization?.organization_code ?? null,
          organization_name: row.organization?.organization_name ?? null,
          users: [],
        };
        groups.set(key, group);
      }

      group.users.push(row);
    }

    return [...groups.values()].sort((a, b) => {
      const nameA = a.organization_name ?? '';
      const nameB = b.organization_name ?? '';
      return nameA.localeCompare(nameB);
    });
  }

  async findOne(id: string): Promise<ManagementUserFas> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Management user FAS with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateManagementUserFasDto): Promise<ManagementUserFas> {
    await this.findOne(id);
    await this.assertUniqueNameAndEmail(dto.name, dto.email, id);
    return await this.repository.update(id, dto);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.repository.remove(id);
    return { success: true, message: 'Management user FAS deleted' };
  }

  private async assertUniqueNameAndEmail(
    name?: string,
    email?: string,
    excludeId?: string,
  ): Promise<void> {
    if (name?.trim()) {
      const byName = await this.repository.findByName(name);
      if (byName && byName.id !== excludeId) {
        throw new ConflictException(`Name "${name}" already exists`);
      }
    }

    if (email?.trim()) {
      const byEmail = await this.repository.findByEmail(email);
      if (byEmail && byEmail.id !== excludeId) {
        throw new ConflictException(`Email "${email}" already exists`);
      }
    }
  }
}
