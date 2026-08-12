import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoSuggestion, DoSuggestionStatus } from '../core/domain/entities/do-suggestion.entity'; import { BatchCreateOrUpdateDoSuggestionDto } from './dto/batch-create-or-update-do-suggestion.dto';
import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { CreateOrUpdateDoSuggestionDto } from './dto/create-or-update-do-suggestion.dto';
import { DoSuggestionDetailDto } from './dto/do-suggestion-detail.dto';
import { MoveOrderIntegrationService } from '../move-order-integration/move-order-integration.service';
import { CreateMoveOrderIntegrationPayloadDto } from '../move-order-integration/dto/create-move-order-integration-payload.dto';
import { IntegrationOnHandAtrService } from '../outbound-sales/integration/integration-on-hand-atr.service';
import {
  DoSuggestionDetailData,
  DoSuggestionHeaderData,
  DoSuggestionPersistData,
  DoSuggestionRepository,
} from './do-suggestion.repository';
import { CreateDoDmsDto, DoDmsDetailDto } from './dto/create-do-dms.dto';
import { VoidDoDmsDto } from './dto/void-do-dms.dto';
import { MasterIO } from '../core/domain/entities/master-io.entity';

@Injectable()
export class DoSuggestionService {
  private readonly logger = new Logger(DoSuggestionService.name);

  constructor(
    private readonly repository: DoSuggestionRepository,
    private readonly moveOrderIntegrationService: MoveOrderIntegrationService,
    private readonly integrationOnHandAtrService: IntegrationOnHandAtrService,
    @InjectRepository(OnHandAtr)
    private readonly onHandAtrRepository: Repository<OnHandAtr>,
    @InjectRepository(MasterIO)
    private readonly masterIORepository: Repository<MasterIO>,
  ) { }

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

  async integrateMoveOrder(id: string): Promise<{ success: boolean; message: string }> {
    const suggestion = await this.findOne(id);
    const payload = await this.mapDoSuggestionToMoveOrderIntegrationPayload(suggestion);
    const queued = await this.moveOrderIntegrationService.createAndIntegrate(payload);

    return {
      success: true,
      message:
        queued.message ||
        `Move order integration queued successfully (id=${queued.move_order_integration_id})`,
    };
  }

  async integrateMoveOrderGIT(id: string): Promise<{ success: boolean; message: string }> {
    const suggestion = await this.findOne(id);
    const payload = await this.mapDoSuggestionToMoveOrderIntegrationPayloadGIT(suggestion);
    const queued = await this.moveOrderIntegrationService.createAndIntegrate(payload);

    return {
      success: true,
      message:
        queued.message ||
        `Move order integration queued successfully (id=${queued.move_order_integration_id})`,
    };
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
    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line is required');
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

    delete header.updated_by;

    return {
      ...header,
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

  private async mapDoSuggestionToMoveOrderIntegrationPayloadGIT(
    suggestion: DoSuggestion,
  ): Promise<CreateMoveOrderIntegrationPayloadDto> {
    const organizationId = suggestion.organization?.organization_id;
    if (organizationId == null) {
      throw new BadRequestException(
        `DO suggestion ${suggestion.id} has no mapped organization_id in m_io`,
      );
    }

    const dateRequired = this.resolveDateForOracle(suggestion.callplan_date_start);
    // find locator to GIT
    const locatorIds = await this.resolveLocatorIdsGIT(suggestion);

    const lines = (suggestion.details ?? []).map((line) => {
      const quantity = this.parseItemQtyFinal(line.item_qty_final);
      return {
        line_number: line.line_number,
        organization_id: Number(organizationId),
        inventory_item_id: Number(line.inventory_item_id),
        from_subinventory_code: 'KECIL',
        from_locator_id: locatorIds.from_locator_id,
        to_subinventory_code: 'CANVAS',
        to_locator_id: locatorIds.to_locator_id,
        uom_code: line.item_uom?.trim() || 'BKS',
        quantity,
        date_required: new Date(Date.now()), // date_now
        transaction_type_id: 105,
        transaction_source_type_id: 4,
        line_status: 7,
        status_date: new Date(dateRequired), // call_plan_date_start
        source_system: 'WMS',
        source_header_id: suggestion.id,
        source_line_id: line.id,
        iface_status: 'READY',
        operation: 'CREATE',
        db_flag: 'T',
      };
    });

    const validLines = lines.filter(
      (line) => Number.isFinite(line.inventory_item_id) && Number.isFinite(line.quantity) && line.quantity > 0,
    );

    this.logger.log(
      `GIT move-order lines for suggestion ${suggestion.id}: mapped=${lines.length}, valid=${validLines.length}`,
    );
    this.logger.log(
      `GIT mapped lines: ${JSON.stringify(
        lines.map((line) => ({
          source_line_id: line.source_line_id,
          inventory_item_id: line.inventory_item_id,
          quantity: line.quantity,
        })),
      )}`,
    );
    this.logger.log(`GIT validLines: ${JSON.stringify(validLines)}`);

    if (!validLines.length) {
      throw new BadRequestException(
        `DO suggestion ${suggestion.id} has no valid detail lines to integrate`,
      );
    }

    return {
      master_io_id: suggestion.organization_id ?? undefined,
      request_number: suggestion.spb_number?.trim(),
      transaction_type_id: 105,
      move_order_type: 1,
      organization_id: Number(organizationId),
      date_required: new Date(Date.now()), // date_now
      from_subinventory_code: 'KECIL',
      to_subinventory_code: 'CANVAS',
      header_status: 7,
      description: suggestion.sales_name?.trim() || undefined,
      attribute_category: 'FPPR Awal',
      status_date: new Date(Date.now()),
      attribute7: this.toDateOnly(suggestion.callplan_date_start), // Call Plan Start Date
      attribute8: this.toDateOnly(suggestion.callplan_date_end), // Call Plan End Date
      attribute9: suggestion.sales_nik?.trim(), // Sales_Nik
      attribute10: suggestion.sales_spv_nik?.trim(), // Sales_Spv_Nik
      attribute11: suggestion.trip_type?.trim(), // trip_type
      attribute12: 'CVS', // CANVASING HARDCODE
      attribute13: suggestion.callplan_number?.trim() || undefined, // Call Plan Number
      attribute14: suggestion.spb_number?.trim() || undefined, // SPB Number
      operation: 'CREATE',
      db_flag: 'T',
      source_system: 'WMS',
      source_header_id: suggestion.id,
      iface_status: 'READY',
      iface_mode: 'CREATE_TRANSACT_MO',
      total_lines: validLines.length,
      lines: validLines,
    };
  }

  private async mapDoSuggestionToMoveOrderIntegrationPayload(
    suggestion: DoSuggestion,
  ): Promise<CreateMoveOrderIntegrationPayloadDto> {
    const organizationId = suggestion.organization?.organization_id;
    if (organizationId == null) {
      throw new BadRequestException(
        `DO suggestion ${suggestion.id} has no mapped organization_id in m_io`,
      );
    }

    const dateRequired = this.resolveDateForOracle(suggestion.callplan_date_start);
    const locatorIds = await this.resolveLocatorIds(suggestion);

    const lines = (suggestion.details ?? []).map((line) => {
      const quantity = this.parseItemQtyFinal(line.item_qty_final);
      return {
        line_number: line.line_number,
        organization_id: Number(organizationId),
        inventory_item_id: Number(line.inventory_item_id),
        from_subinventory_code: 'KECIL',
        from_locator_id: locatorIds.from_locator_id,
        to_subinventory_code: 'CANVAS',
        to_locator_id: locatorIds.to_locator_id,
        uom_code: line.item_uom?.trim() || 'BKS',
        quantity,
        date_required: new Date(Date.now()), // date_now
        // date_required: new Date('2026-06-26'),
        transaction_type_id: 105,
        transaction_source_type_id: 4,
        line_status: 7,
        status_date: new Date(dateRequired), // call_plan_date_start
        // status_date: new Date('2026-06-26'),
        source_system: 'WMS',
        source_header_id: suggestion.id,
        source_line_id: line.id,
        iface_status: 'READY',
        operation: 'CREATE',
        db_flag: 'T',
      };
    });

    const validLines = lines.filter(
      (line) => Number.isFinite(line.inventory_item_id) && Number.isFinite(line.quantity) && line.quantity >= 0,
    );
    if (!validLines.length) {
      throw new BadRequestException(
        `DO suggestion ${suggestion.id} has no valid detail lines to integrate`,
      );
    }

    return {
      master_io_id: suggestion.organization_id ?? undefined,
      request_number: suggestion.spb_number?.trim(),
      // request_number: 'SPB/JAT/2026/6/500022.1/5001',
      transaction_type_id: 105,
      move_order_type: 1,
      organization_id: Number(organizationId),
      date_required: new Date(Date.now()), // date_now
      // date_required: new Date('2026-06-26'),
      from_subinventory_code: 'KECIL',
      to_subinventory_code: 'CANVAS',
      header_status: 7,
      description: suggestion.sales_name?.trim() || undefined,
      attribute_category: 'FPPR Awal',
      status_date: new Date(Date.now()),
      attribute7: this.toDateOnly(suggestion.callplan_date_start), // Call Plan Start Date
      // attribute7: '2026-06-30',
      attribute8: this.toDateOnly(suggestion.callplan_date_end), // Call Plan End Date
      // attribute8: '2026-06-30',
      attribute9: suggestion.sales_nik?.trim(), // Sales_Nik
      // attribute9: '100507.01939B0', // Sales_Nik
      attribute10: suggestion.sales_spv_nik?.trim(), // Sales_Spv_Nik
      attribute11: suggestion.trip_type?.trim(), // trip_type
      // attribute11: 'SD', // trip_type
      attribute12: 'CVS', // CANVASING HARDCODE
      attribute13: suggestion.callplan_number?.trim() || undefined, // Call Plan Number
      // attribute13: 'JAT/2026/6/500022.1', // Call Plan Number
      attribute14: suggestion.spb_number?.trim() || undefined, // SPB Number
      // attribute14: 'SPB/JAT/2026/6/500022.1/5001', // SPB Number
      operation: 'CREATE',
      db_flag: 'T',
      source_system: 'WMS',
      source_header_id: suggestion.id,
      // source_header_id: 'TEST6_SPB/JAT/2026/6/500021.1/5001',
      iface_status: 'READY',
      iface_mode: 'CREATE_TRANSACT_MO',
      total_lines: validLines.length,
      lines: validLines,
    };
  }

  /** TypeORM bigint can be string `"0"`; never fall back to submitted qty. */
  private parseItemQtyFinal(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return Number.NaN;
    }
    return Number(value);
  }

  private toDateOnly(value?: Date | string | null): string | undefined {
    if (value == null) {
      return undefined;
    }

    let year: number;
    let month: number;
    let day: number;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      const datePart = trimmed.split('T')[0];
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
      if (match) {
        year = Number(match[1]);
        month = Number(match[2]);
        day = Number(match[3]);
      } else {
        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) {
          return undefined;
        }
        year = parsed.getUTCFullYear();
        month = parsed.getUTCMonth() + 1;
        day = parsed.getUTCDate();
      }
    } else {
      if (Number.isNaN(value.getTime())) {
        return undefined;
      }
      year = value.getUTCFullYear();
      month = value.getUTCMonth() + 1;
      day = value.getUTCDate();
    }

    return `${String(year)}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')} 00:00:00`;
  }

  private resolveDateForOracle(source?: Date | string): string {
    const date = source ? new Date(source) : new Date();
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  private async resolveLocatorIds(
    suggestion: DoSuggestion,
  ): Promise<{ from_locator_id?: number; to_locator_id?: number }> {
    const organizationId = String(suggestion.organization_id);
    const rows = await this.onHandAtrRepository
      .createQueryBuilder('onHandAtr')
      .select('onHandAtr.subinventory_code', 'subinventory_code')
      .addSelect('onHandAtr.locator_id', 'locator_id')
      .where('onHandAtr.organization_id = :organizationId', { organizationId })
      .andWhere('onHandAtr.locator_id IS NOT NULL')
      .andWhere('onHandAtr.deleted_at IS NULL')
      .distinct(true)
      .getRawMany<{ subinventory_code: string | null; locator_id: number | string | null }>();

    const pickLocator = (subinventory: string): number | undefined => {
      const found = rows.find(
        (row) =>
          (row.subinventory_code ?? '').trim().toUpperCase() === subinventory &&
          row.locator_id != null,
      );
      return found?.locator_id != null ? Number(found.locator_id) : undefined;
    };

    const fromLocator = pickLocator('KECIL');
    if (fromLocator == null) {
      throw new BadRequestException(
        `From locator not found for organization_id=${organizationId} and subinventory KECIL`,
      );
    }

    const organizationCode =
      suggestion.organization?.organization_name?.trim() ||
      (await this.resolveOrganizationCodeFromOnHand(organizationId));
    const salesrepNumber = suggestion.sales_nik?.trim();
    // const salesrepNumber = '100507.01939B0';

    if (!organizationCode) {
      throw new BadRequestException(
        `DO suggestion ${suggestion.id} has no organization_code for locator sales lookup`,
      );
    }
    if (!salesrepNumber) {
      throw new BadRequestException(
        `DO suggestion ${suggestion.id} has no sales_nik for locator sales lookup`,
      );
    }

    const response = await this.integrationOnHandAtrService.getLocatorSales({
      organization_code: organizationCode,
      salesrep_number: salesrepNumber,
    });

    if (!response.status) {
      throw new BadRequestException(
        response.message ||
        `Failed to get locator sales for organization_code=${organizationCode}, salesrep_number=${salesrepNumber}`,
      );
    }

    const locatorFromSales = response.data?.find(
      (row) => row.LOCATOR_ID != null,
    )?.LOCATOR_ID;

    if (locatorFromSales == null) {
      throw new BadRequestException(
        `To locator not found for organization_code=${organizationCode}, salesrep_number=${salesrepNumber}`,
      );
    }

    const toLocator = Number(locatorFromSales);

    return {
      from_locator_id: fromLocator,
      to_locator_id: toLocator,
    };
  }


  private async resolveLocatorIdsGIT(
    suggestion: DoSuggestion,
  ): Promise<{ from_locator_id?: number; to_locator_id?: number }> {
    const organizationId = String(suggestion.organization_id);
    const rows = await this.onHandAtrRepository
      .createQueryBuilder('onHandAtr')
      .select('onHandAtr.subinventory_code', 'subinventory_code')
      .addSelect('onHandAtr.locator_id', 'locator_id')
      .where('onHandAtr.organization_id = :organizationId', { organizationId })
      .andWhere('onHandAtr.locator_id IS NOT NULL')
      .andWhere('onHandAtr.deleted_at IS NULL')
      .distinct(true)
      .getRawMany<{ subinventory_code: string | null; locator_id: number | string | null }>();

    const pickLocator = (subinventory: string): number | undefined => {
      const found = rows.find(
        (row) =>
          (row.subinventory_code ?? '').trim().toUpperCase() === subinventory &&
          row.locator_id != null,
      );
      return found?.locator_id != null ? Number(found.locator_id) : undefined;
    };

    const fromLocator = pickLocator('KECIL');
    if (fromLocator == null) {
      throw new BadRequestException(
        `From locator not found for organization_id=${organizationId} and subinventory KECIL`,
      );
    }


    const response = await this.integrationOnHandAtrService.getInventoryLocator({
      organization_code: suggestion.organization?.organization_name?.trim(),
      subinventory_code: 'CANVAS',
      locator: 'GIT',
    });

    if (!response.status) {
      throw new BadRequestException(
        response.message ||
        `Failed to get inventory locator for organization_code=${suggestion.organization?.organization_name?.trim()}, subinventory_code=CANVAS, locator=GIT`,
      );
    }

    const toLocator = this.pickInventoryLocatorId(response.data);

    if (toLocator == null) {
      throw new BadRequestException(
        `To locator not found for organization_code=${suggestion.organization?.organization_name?.trim()}, subinventory_code=CANVAS, locator=GIT`,
      );
    }

    return {
      from_locator_id: fromLocator,
      to_locator_id: toLocator,
    };
  }

  private pickInventoryLocatorId(
    rows: Array<{ locator_id?: number | null; LOCATOR_ID?: number | null }> | undefined,
  ): number | undefined {
    for (const row of rows ?? []) {
      const raw = row.locator_id ?? row.LOCATOR_ID;
      if (raw == null) {
        continue;
      }

      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return undefined;
  }

  private async resolveOrganizationCodeFromOnHand(
    organizationId: string,
  ): Promise<string | undefined> {
    const row = await this.onHandAtrRepository
      .createQueryBuilder('onHandAtr')
      .select('onHandAtr.organization_code', 'organization_code')
      .where('onHandAtr.organization_id = :organizationId', { organizationId })
      .andWhere('onHandAtr.organization_code IS NOT NULL')
      .andWhere("TRIM(onHandAtr.organization_code) <> ''")
      .andWhere('onHandAtr.deleted_at IS NULL')
      .orderBy('onHandAtr.created_at', 'DESC')
      .limit(1)
      .getRawOne<{ organization_code?: string }>();

    return row?.organization_code?.trim() || undefined;
  }

  private async mapDtoToCreateDataDoDms(
    dto: CreateDoDmsDto,
  ): Promise<DoSuggestionPersistData> {

    if (!dto.lines?.length) {
      throw new BadRequestException('At least one line is required');
    }

    // find organization_id from m_io by organization_code
    const organization = await this.masterIORepository.findOne({
      where: {
        organization_name: dto.organization_code,
      },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // find spb_number, this unique
    const spbNumber = await this.repository.findBySpbNumber(dto.spb_number);
    if (spbNumber) {
      throw new BadRequestException('SPB number already exists');
    }

    // find spb_number, this unique

    const header: DoSuggestionHeaderData = {
      organization_id: organization.id,
      callplan_number: dto.callplan_number,
      callplan_date_start: dto.callplan_date_start ? new Date(dto.callplan_date_start) : undefined,
      callplan_date_end: dto.callplan_date_end ? new Date(dto.callplan_date_end) : undefined,
      route_number: dto.route_number,
      trip_type: dto.trip_type,
      sales_nik: dto.sales_nik,
      sales_name: dto.sales_name,
      sales_spv: dto.sales_spv,
      sales_spv_nik: dto.sales_spv_nik,
      status: dto.status,
      created_by: dto.created_by,
      updated_by: dto.updated_by,
      spb_date: dto.spb_date ? new Date(dto.spb_date) : undefined,
      spb_number: dto.spb_number,
      spb_type: dto.spb_type,
      mo_type: dto.mo_type,
      preparation_date: dto.preparation_date ? new Date(dto.preparation_date) : undefined,
    };

    delete header.updated_by;

    return {
      ...header,
      lines: dto.lines.map((line) => this.mapLineDtoForCreateDoDms(line)),
    };
  }

  private mapLineDtoForCreateDoDms(line: DoDmsDetailDto): DoSuggestionDetailData {
    return {
      id: undefined,
      item_code: line.item_code,
      inventory_item_id: line.inventory_item_id,
      item_qty_suggestion: line.item_qty_suggestion,
      item_qty_revision: undefined,
      item_qty_submitted: undefined,
      item_qty_final: undefined,
      contribution_percentage: line.contribution_percentage,
      item_uom: line.item_uom,
      line_number: line.line_number,
    };
  }

  async createDoDms(dto: CreateDoDmsDto): Promise<DoSuggestion> {
    const payload = await this.mapDtoToCreateDataDoDms(dto);
    return await this.repository.create(payload);

  }

  async voidDoDms(dto: VoidDoDmsDto): Promise<DoSuggestion> {
    const existing = await this.repository.findBySpbNumber(dto.spb_number);
    if (!existing) {
      throw new NotFoundException(
        `DO suggestion with SPB number ${dto.spb_number} not found`,
      );
    }

    if (existing.status === DoSuggestionStatus.VOID) {
      return existing;
    }

    return await this.repository.updateStatus(
      existing.id,
      DoSuggestionStatus.VOID,
      dto.updated_by,
    );
  }
}