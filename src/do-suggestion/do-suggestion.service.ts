import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DoSuggestion, DoSuggestionStatus } from '../core/domain/entities/do-suggestion.entity';import { BatchCreateOrUpdateDoSuggestionDto } from './dto/batch-create-or-update-do-suggestion.dto';
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
    if (dto.id) {
      const payload = await this.mapDtoToUpdateData(dto);
      return await this.repository.update(dto.id, payload);
    }

    const payload = await this.mapDtoToCreateData(dto);
    return await this.repository.create(payload);
  }

  async createOrUpdateBatch(
    dto: BatchCreateOrUpdateDoSuggestionDto,
  ): Promise<{ success: boolean; message: string; data: DoSuggestion[] }> {
    if (!dto.data?.length) {
      throw new BadRequestException('At least one DO suggestion is required');
    }

    const results: DoSuggestion[] = [];
    for (const item of dto.data) {
      results.push(await this.createOrUpdate(item));
    }

    return {
      success: true,
      message: `${results.length} DO suggestion(s) processed successfully`,
      data: results,
    };
  }

  async findAll(status?: DoSuggestionStatus): Promise<DoSuggestion[]> {
    return await this.repository.findAll(status);
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
    salesSpvNik?: string,
    status?: DoSuggestionStatus,
  ): Promise<DoSuggestion[]> {
    if (!callplanDateStart?.trim()) {
      throw new BadRequestException('callplanDateStart is required');
    }
    if (!organizationId?.trim()) {
      throw new BadRequestException('organizationId is required');
    }

    const parsedDate = new Date(callplanDateStart.trim());
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`Invalid callplanDateStart: ${callplanDateStart}`);
    }

    return await this.repository.findByCallplanDateStartOrganizationAndSalesSpvNik(
      parsedDate,
      organizationId.trim(),
      salesSpvNik?.trim() || undefined,
      status,
    );
  }
  private async mapDtoToCreateData(
    dto: CreateOrUpdateDoSuggestionDto,
  ): Promise<DoSuggestionPersistData> {
    if (!dto.lines?.length) {      throw new BadRequestException('At least one line is required');
    }

    const callplanDateStart = dto.callplan_date_start
      ? new Date(dto.callplan_date_start)
      : undefined;

    let spbNumber = dto.spb_number?.trim() || undefined;

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

    const header: DoSuggestionHeaderData = {      organization_id: dto.organization_id,
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

    delete header.updated_by;

    return {      ...header,
      lines: dto.lines.map((line) => this.mapLineDtoForCreate(line)),
    };
  }

  private async mapDtoToUpdateData(
    dto: CreateOrUpdateDoSuggestionDto,
  ): Promise<DoSuggestionPersistData> {
    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line is required');
    }

    const header = this.pickDefined<DoSuggestionHeaderData>({
      organization_id: dto.organization_id,
      callplan_number: dto.callplan_number,
      callplan_date_start: dto.callplan_date_start
        ? new Date(dto.callplan_date_start)
        : undefined,
      callplan_date_end: dto.callplan_date_end ? new Date(dto.callplan_date_end) : undefined,
      route_number: dto.route_number,
      trip_type: dto.trip_type,
      sales_nik: dto.sales_nik,
      sales_name: dto.sales_name,
      sales_spv: dto.sales_spv,
      sales_spv_nik: dto.sales_spv_nik,
      status: dto.status,
      updated_by: dto.updated_by,
      spb_date: dto.spb_date ? new Date(dto.spb_date) : undefined,
      spb_number: dto.spb_number !== undefined ? dto.spb_number.trim() : undefined,
    });

    return {
      ...header,
      lines: dto.lines.map((line) => this.mapLineDtoForUpdate(line)),
    };
  }

  private mapLineDtoForCreate(line: DoSuggestionDetailDto): DoSuggestionDetailData {
    return {
      id: line.id,
      item_code: line.item_code,
      inventory_item_id: line.inventory_item_id,
      item_qty_suggestion: line.item_qty_suggestion,
      item_qty_revision: line.item_qty_revision,
      item_qty_submitted: line.item_qty_submitted,
      item_qty_final: line.item_qty_final,
      contribution_percentage: line.contribution_percentage,
      item_uom: line.item_uom,
      line_number: line.line_number,
    };
  }

  private mapLineDtoForUpdate(line: DoSuggestionDetailDto): DoSuggestionDetailData {
    return this.pickDefined<DoSuggestionDetailData>({
      id: line.id,
      item_code: line.item_code,
      inventory_item_id: line.inventory_item_id,
      item_qty_suggestion: line.item_qty_suggestion,
      item_qty_revision: line.item_qty_revision,
      item_qty_submitted: line.item_qty_submitted,
      item_qty_final: line.item_qty_final,
      contribution_percentage: line.contribution_percentage,
      item_uom: line.item_uom,
      line_number: line.line_number,
    });
  }

  private pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}