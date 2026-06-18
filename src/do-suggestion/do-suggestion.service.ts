import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DoSuggestion } from '../core/domain/entities/do-suggestion.entity';
import { DoSuggestionStatus } from '../core/domain/entities/do-suggestion.entity';
import { CreateOrUpdateDoSuggestionDto } from './dto/create-or-update-do-suggestion.dto';
import { DoSuggestionDetailDto } from './dto/do-suggestion-detail.dto';
import {
  DoSuggestionDetailData,
  DoSuggestionHeaderData,
  DoSuggestionPersistData,
  DoSuggestionRepository,
} from './do-suggestion.repository';

@Injectable()
export class DoSuggestionService {
  constructor(private readonly repository: DoSuggestionRepository) { }

  async createOrUpdate(dto: CreateOrUpdateDoSuggestionDto): Promise<DoSuggestion> {
    const payload = await this.mapDtoToPersistData(dto);

    if (dto.id) {
      return await this.repository.update(dto.id, payload);
    }

    return await this.repository.create(payload);
  }

  async findAll(): Promise<DoSuggestion[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<DoSuggestion> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException(`DO suggestion with ID ${id} not found`);
    }
    return row;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.repository.remove(id);
    return { success: true, message: 'DO suggestion deleted' };
  }

  async findByCallplanNumber(callplanNumber: string): Promise<DoSuggestion[]> {
    if (!callplanNumber?.trim()) {
      throw new BadRequestException('callplanNumber is required');
    }
    return await this.repository.findByCallplanNumber(callplanNumber.trim());
  }

  async findByCallplanDateStart(
    callplanDateStart: string,
    organizationId: string,
    salesSpvNik: string,
  ): Promise<DoSuggestion[]> {
    if (!callplanDateStart?.trim()) {
      throw new BadRequestException('callplanDateStart is required');
    }
    if (!organizationId?.trim()) {
      throw new BadRequestException('organizationId is required');
    }
    if (!salesSpvNik?.trim()) {
      throw new BadRequestException('salesSpvNik is required');
    }

    const parsedDate = new Date(callplanDateStart.trim());
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid callplanDateStart: ${callplanDateStart}`);
    }

    return await this.repository.findByCallplanDateStartOrganizationAndSalesSpvNik(
      parsedDate,
      organizationId.trim(),
      salesSpvNik.trim(),
    );
  }

  private async mapDtoToPersistData(
    dto: CreateOrUpdateDoSuggestionDto,
  ): Promise<DoSuggestionPersistData> {
    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line is required');
    }

    const callplanDateStart = dto.callplan_date_start
      ? new Date(dto.callplan_date_start)
      : undefined;

    let spbNumber = dto.spb_number?.trim() || undefined;

    if (!dto.id) {
      if (!spbNumber) {
        if (!callplanDateStart) {
          throw new BadRequestException(
            'callplan_date_start is required to auto-generate spb_number',
          );
        }
        spbNumber = await this.repository.generateNextSpbNumber(
          dto.callplan_number,
          callplanDateStart,
        );
      }
    } else if (!spbNumber) {
      const existing = await this.repository.findById(dto.id);
      spbNumber = existing?.spb_number ?? undefined;
    }

    const header: DoSuggestionHeaderData = {
      organization_id: dto.organization_id,
      callplan_number: dto.callplan_number,
      callplan_date_start: callplanDateStart,
      callplan_date_end: dto.callplan_date_end ? new Date(dto.callplan_date_end) : undefined,
      route_number: dto.route_number,
      trip_type: dto.trip_type,
      sales_nik: dto.sales_nik,
      sales_name: dto.sales_name,
      sales_spv: dto.sales_spv,
      sales_spv_nik: dto.sales_spv_nik,
      status: dto.status ?? DoSuggestionStatus.DRAFT,
      created_by: dto.created_by,
      updated_by: dto.updated_by,
      spb_date: dto.spb_date ? new Date(dto.spb_date) : callplanDateStart,
      spb_number: spbNumber,
    };

    if (!dto.id) {
      delete header.updated_by;
    } else {
      delete header.created_by;
    }

    return {
      ...header,
      lines: dto.lines.map((line) => this.mapLineDto(line)),
    };
  }

  private mapLineDto(line: DoSuggestionDetailDto): DoSuggestionDetailData {
    return {
      id: line.id,
      item_code: line.item_code,
      item_qty_suggestion: line.item_qty_suggestion,
      item_qty_revision: line.item_qty_revision,
      item_qty_final: line.item_qty_final,
      contribution_percentage: line.contribution_percentage,
      item_uom: line.item_uom,
    };
  }
}
