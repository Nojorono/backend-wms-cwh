import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterIORepository } from './master-io.repository';
import { CreateMasterIODto } from './dto/create-master-io.dto';
import { UpdateMasterIODto } from './dto/update-master-io.dto';
import { MasterIO } from '../core/domain/entities/master-io.entity';
import { IOIntegrationService } from './integration/io-integration.service';

@Injectable()
export class MasterIOService {
  constructor(private readonly repository: MasterIORepository, private readonly ioIntegrationService: IOIntegrationService) { }

  async create(createMasterIODto: CreateMasterIODto): Promise<MasterIO> {
    const organizationId = createMasterIODto.organization_id;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const existingIO = await this.repository.findByOrganizationId(organizationId);
    if (existingIO) {
      throw new ConflictException(
        `IO with code ${createMasterIODto.organization_id} already exists`,
      );
    }
    return await this.repository.create(createMasterIODto);
  }

  async findAll(): Promise<MasterIO[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterIO> {
    const io = await this.repository.findOne(id);
    if (!io) {
      throw new NotFoundException(`IO with ID ${id} not found`);
    }
    return io;
  }

  async update(id: string, updateMasterIODto: UpdateMasterIODto): Promise<MasterIO> {
    const io = await this.findOne(id);
    if (
      updateMasterIODto.organization_id &&
      updateMasterIODto.organization_id !== io.organization_id
    ) {
      const existingIO = await this.repository.findByOrganizationId(
        updateMasterIODto.organization_id,
      );
      if (existingIO) {
        throw new ConflictException(
          `IO with code ${updateMasterIODto.organization_id} already exists`,
        );
      }
    }
    const updatedIO = await this.repository.update(id, updateMasterIODto);
    if (!updatedIO) {
      throw new NotFoundException(`IO with ID ${id} not found`);
    }
    return updatedIO;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async findOracle(): Promise<Record<string, unknown>[]> {
    const ioIntegration = await this.ioIntegrationService.findAll();
    const rows = this.extractIntegrationRows(ioIntegration);
    if (!rows.length) {
      return [];
    }
    return rows;
  }

  async sync(): Promise<void> {
    const ioIntegration = await this.ioIntegrationService.findAll();
    const rows = this.extractIntegrationRows(ioIntegration);
    if (!rows.length) {
      return;
    }

    for (const row of rows) {
      const dto = this.mapIntegrationRowToDto(row);
      const existing = await this.findExistingForSync(dto);

      if (existing) {
        await this.repository.update(existing.id, dto);
      } else {
        await this.repository.create(dto);
      }
    }
  }

  private extractIntegrationRows(payload: unknown): Record<string, unknown>[] {
    if (Array.isArray(payload)) {
      return payload.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && row != null,
      );
    }
    if (typeof payload !== 'object' || payload == null) {
      return [];
    }
    const obj = payload as Record<string, unknown>;
    const candidate = obj.data;
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (row): row is Record<string, unknown> => typeof row === 'object' && row != null,
      );
    }
    return [];
  }

  private mapIntegrationRowToDto(row: Record<string, unknown>): CreateMasterIODto {
    return {
      organization_code: this.asString(row.ORGANIZATION_NAME),
      organization_name: this.asString(row.ORGANIZATION_CODE),
      organization_id: this.asNumber(row.ORGANIZATION_ID) ?? undefined,
      org_name: this.asString(row.ORG_NAME),
      org_id: this.asString(row.ORG_ID),
      organization_type: this.asString(row.ORGANIZATION_TYPE),
      region_code: this.asString(row.REGION_CODE),
      address: this.asString(row.ADDRESS),
      location_id: this.asNumber(row.LOCATION_ID) ?? undefined,
      start_date_active: this.asDate(row.START_DATE_ACTIVE),
      end_date_active: this.asDate(row.END_DATE_ACTIVE),
    };
  }

  private asString(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }
    const s = String(value).trim();
    return s === '' ? undefined : s;
  }

  private asNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }
    const n = typeof value === 'string' ? Number(value) : Number(value);
    return Number.isNaN(n) ? null : n;
  }

  private asDate(value: unknown): Date | undefined {
    if (value == null || value === '') {
      return undefined;
    }
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  private async findExistingForSync(dto: CreateMasterIODto): Promise<MasterIO | null> {

    if (dto.organization_id) {
      const byId = await this.repository.findByOrganizationId(dto.organization_id ?? 0);
      if (byId) {
        return byId;
      }
    }
    return null;
  }
}
