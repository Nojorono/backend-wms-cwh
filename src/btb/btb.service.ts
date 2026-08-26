import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Btb } from '../core/domain/entities/btb.entity';
import { PaginationService } from '../core/services/pagination.service';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { BtbRepository } from './btb.repository';
import { CreateBtbDto } from './dto/create-btb.dto';
import { UpdateBtbDto } from './dto/update-btb.dto';
import { BtbPaginationQueryDto } from './dto/btb-pagination.dto';
import { DoSuggestionRepository } from 'src/do-suggestion/do-suggestion.repository';

@Injectable()
export class BtbService {
  constructor(
    private readonly repository: BtbRepository,
    private readonly paginationService: PaginationService,
    private readonly doSuggestionRepository: DoSuggestionRepository,
  ) { }

  async create(dto: CreateBtbDto): Promise<Btb> {
    const existing = await this.repository.findByBtbNumber(dto.btb_number);
    if (existing) {
      throw new ConflictException(`BTB number ${dto.btb_number} already exists`);
    }
    return await this.repository.create(dto);
  }

  async findAllPaginated(
    query: BtbPaginationQueryDto,
  ): Promise<PaginatedResponseDto<Btb>> {
    const { data, total } = await this.repository.findAllPaginated(query);
    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<Btb> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`BTB with ID ${id} not found`);
    }
    return entity;
  }

  async findByBtbNumber(btbNumber: string): Promise<Btb> {
    const entity = await this.repository.findByBtbNumber(btbNumber);
    if (!entity) {
      throw new NotFoundException(`BTB with number ${btbNumber} not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateBtbDto): Promise<Btb> {
    if (dto.btb_number) {
      const existing = await this.repository.findByBtbNumber(dto.btb_number);
      if (existing && existing.id !== id) {
        throw new ConflictException(`BTB number ${dto.btb_number} already exists`);
      }
    }
    return await this.repository.update(id, dto);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.repository.remove(id);
    return { success: true, message: 'BTB deleted' };
  }

  async removeDetail(
    btbId: string,
    detailId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.findOne(btbId);
    await this.repository.removeDetail(btbId, detailId);
    return { success: true, message: 'BTB detail deleted' };
  }

  async getAllLastDateInsert(): Promise<Btb[]> {
    return await this.repository.getAllLastDateInsert();
  }

  async createDummyDataJat(): Promise<{ success: boolean; message: string }> {
    const doSuggestions = await this.doSuggestionRepository.findByOrganizationId(
      'db72a8e1-0ca6-4353-b157-9b798f703179',
    );
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() - 1);

    let created = 0;
    let skipped = 0;

    for (const doSuggestion of doSuggestions) {
      if (!doSuggestion.spb_number) {
        skipped += 1;
        continue;
      }

      const btbNumber = `BTB-${doSuggestion.spb_number}`;
      const existing = await this.repository.findByBtbNumber(btbNumber);
      if (existing) {
        skipped += 1;
        continue;
      }

      await this.repository.create({
        btb_number: btbNumber,
        btb_date: this.toDateOnlyString(doSuggestion.spb_date) ?? this.toDateOnlyString(fallbackDate),
        organization_id: doSuggestion.organization_id,
        sales_nik: doSuggestion.sales_nik,
        sales_name: doSuggestion.sales_name,
        sales_spv_nik: doSuggestion.sales_spv_nik,
        sales_spv_name: doSuggestion.sales_spv,
        status: 'APPLIED',
        created_by: 'SYSTEM',
        updated_by: 'SYSTEM',
        details: (doSuggestion.details ?? []).map((line) => ({
          item_code: line.item_code,
          btb_qty: Math.floor(Math.random() * 5) + 1,
          btb_uom: 'BKS',
          inventory_item_id: line.inventory_item_id,
          item_name: line.item_code,
          created_by: 'SYSTEM',
          updated_by: 'SYSTEM',
        })),
      });
      created += 1;
    }

    return {
      success: true,
      message: `Dummy data JAT created: ${created} created, ${skipped} skipped`,
    };
  }

  /** TypeORM `date` columns often return `YYYY-MM-DD` strings, not Date instances. */
  private toDateOnlyString(value: Date | string | null | undefined): string | undefined {
    if (value == null) {
      return undefined;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    const raw = String(value).trim();
    if (!raw) {
      return undefined;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.slice(0, 10);
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed.toISOString().slice(0, 10);
  }
}
