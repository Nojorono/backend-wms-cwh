import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DoSuggestionStatus } from '../core/domain/entities/do-suggestion.entity';
import { OnHandAtr } from '../core/domain/entities/on-hand-atr.entity';
import { INDONESIA_TIMEZONE } from '../core/utils/date-transformer.util';
import { BtbRepository } from '../btb/btb.repository';
import { IntegrationOnHandAtrService } from './integration/integration-on-hand-atr.service';
import { CreateOnHandAtrDto } from './dto/create-on-hand-atr.dto';
import {
  InvOnHandQtyWithAtrItemDto,
  InvOnHandQtyWithAtrParamsDto,
} from './dto/inv-on-hand-qty-with-atr.dto';
import {
  LocatorSalesParamsDto,
  LocatorSalesResponseDto,
} from './dto/locator-sales.dto';
import { DistinctLocatorByOrganizationDto } from './dto/distinct-locator-by-organization.dto';
import {
  LHSReportItemDto,
  LHSReportResponseDto,
} from './dto/lhs-report.dto';
import { TotalSubmittedResponseDto } from './dto/total-submitted-response.dto';
import { OnHandAtrRepository } from './on-hand-atr.repository';
import { DoSuggestionRepository } from '../do-suggestion/do-suggestion.repository';
import { MasterIORepository } from '../master-io/master-io.repository';

const LHS_DO_STATUSES: DoSuggestionStatus[] = [
  DoSuggestionStatus.FINAL,
  DoSuggestionStatus.REVISED,
  DoSuggestionStatus.VOID,
  DoSuggestionStatus.VOID_NEED_ACTION,
];

@Injectable()
export class OutboundSalesService {
  constructor(
    private readonly integrationOnHandAtrService: IntegrationOnHandAtrService,
    private readonly dataSource: DataSource,
    private readonly onHandAtrRepository: OnHandAtrRepository,
    private readonly doSuggestionRepository: DoSuggestionRepository,
    private readonly btbRepository: BtbRepository,
    private readonly masterIO: MasterIORepository,
  ) { }

  async findOnHand(
    query: InvOnHandQtyWithAtrParamsDto,
    organizationId: string | number | null,
    status?: string,
  ): Promise<OnHandAtr[]> {
    const resolvedOrganizationId = this.resolveOrganizationId(organizationId);
    const savedDate = this.resolveSavedDate(query.date);
    const subinventoryCodes = this.resolveSubinventoryCodes(query.subinventory_code);

    const existData = await this.onHandAtrRepository.findByOrganizationIdAndDate(
      resolvedOrganizationId,
      savedDate,
      query.organization_code,
      subinventoryCodes,
      status,
    );
    if (existData.length > 0) {
      return existData;
    }

    // Only fetch from Oracle when requesting today's data (not yet saved).
    // Historical dates must already exist in DB from when they were saved.
    if (!this.isTodayInWib(savedDate)) {
      return [];
    }

    const response =
      await this.integrationOnHandAtrService.getInvOnHandQtyWithAtr(query);
    const rows = response.data ?? [];
    const createdBy = query.created_by ?? 'SYSTEM';
    if (rows.length > 0) {
      const dtos = await this.mapOracleRowsToCreateDtos(
        rows,
        resolvedOrganizationId,
        createdBy,
        status,
      );
      const createdData = await this.createManyOnHandAtr(dtos);
      return createdData;
    }

    return [];
  }
  async createManyOnHandAtr(dtos: CreateOnHandAtrDto[]): Promise<OnHandAtr[]> {
    if (!dtos.length) {
      return [];
    }

    return await this.dataSource.transaction(async () => {
      return await this.onHandAtrRepository.createMany(dtos);
    });
  }

  async createOnHandAtr(dto: CreateOnHandAtrDto): Promise<OnHandAtr> {
    return await this.dataSource.transaction(async () => {
      return await this.onHandAtrRepository.create(dto);
    });
  }

  private resolveOrganizationId(organizationId: string | number | null): string {
    if (organizationId == null || String(organizationId).trim() === '') {
      throw new BadRequestException('Organization ID is required');
    }

    return String(organizationId);
  }

  private resolveSavedDate(date: string): string {
    const normalizedDate = date.trim().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    if (Number.isNaN(new Date(`${normalizedDate}T00:00:00+07:00`).getTime())) {
      throw new BadRequestException('date must be a valid date');
    }

    return normalizedDate;
  }

  private isTodayInWib(date: string): boolean {
    return date === this.getTodayInWib();
  }

  private getTodayInWib(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: INDONESIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private resolveSubinventoryCodes(subinventoryCode: string | string[]): string[] {
    if (Array.isArray(subinventoryCode)) {
      return subinventoryCode.map((entry) => entry.trim()).filter(Boolean);
    }

    return String(subinventoryCode)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private async mapOracleRowsToCreateDtos(
    rows: InvOnHandQtyWithAtrItemDto[],
    organizationId: string,
    createdBy: string,
    status?: string,
  ): Promise<CreateOnHandAtrDto[]> {
    return rows.map((row) =>
      this.mapOracleRowToCreateDto(row, organizationId, createdBy, status),
    );
  }

  private mapOracleRowToCreateDto(
    row: InvOnHandQtyWithAtrItemDto,
    organizationId: string,
    createdBy: string,
    status?: string,
  ): CreateOnHandAtrDto {
    return {
      organization_id: organizationId,
      item_code: row.ITEM_CODE,
      item_number: row.ITEM_NUMBER,
      item_description: row.ITEM_DESCRIPTION,
      inventory_item_id: row.INVENTORY_ITEM_ID,
      oracle_organization_id: row.ORGANIZATION_ID,
      organization_code: row.ORGANIZATION_CODE,
      organization_name: row.ORGANIZATION_NAME,
      subinventory_code: row.SUBINVENTORY_CODE,
      locator_id: row.LOCATOR_ID ?? undefined,
      locator: row.LOCATOR ?? undefined,
      locator_name: row.LOCATOR_NAME ?? undefined,
      quantity: row.QUANTITY,
      avail_to_reserve: row.AVAIL_TO_RESERVE,
      created_by: createdBy,
      updated_by: createdBy,
      status: status,
    };
  }

  async getTotalSubmitted(
    organizationId: string | number | null,
    date: string,
  ): Promise<TotalSubmittedResponseDto> {
    const resolvedOrganizationId = this.resolveOrganizationId(organizationId);
    const savedDate = this.resolveSavedDate(date);

    const doSuggestionRows =
      await this.doSuggestionRepository.findByOrganizationIdAndItemCodeAndDate(
        resolvedOrganizationId,
        undefined,
        savedDate,
        DoSuggestionStatus.SUBMITTED,
      );

    const items = doSuggestionRows.map((row) => ({
      item_code: row.item_code,
      total_submitted: row.total_qty_submitted,
    }));

    const grandTotal = items.reduce((acc, row) => acc + row.total_submitted, 0);

    return {
      organization_id: resolvedOrganizationId,
      date: savedDate,
      status: DoSuggestionStatus.SUBMITTED,
      items,
      grand_total: grandTotal,
    };
  }

  async findOnHandMeta(
    query: InvOnHandQtyWithAtrParamsDto,
  ): Promise<any> {
    return await this.integrationOnHandAtrService.getInvOnHandQtyWithAtr(query);
  }

  async getLocatorSales(params: LocatorSalesParamsDto): Promise<LocatorSalesResponseDto> {
    return await this.integrationOnHandAtrService.getLocatorSales(params);
  }

  async getDistinctLocatorsByOrganizationId(
    organizationId: string | number | null,
  ): Promise<DistinctLocatorByOrganizationDto[]> {
    const resolvedOrganizationId = this.resolveOrganizationId(organizationId);
    return await this.onHandAtrRepository.findDistinctLocatorsByOrganizationId(
      resolvedOrganizationId,
    );
  }

  async getLHSReport(
    organizationId: string | number | null,
    date: string,
  ): Promise<LHSReportResponseDto> {
    // create first on hand atr for report and flag status LHS

    const resolvedOrganizationId = this.resolveOrganizationId(organizationId);
    const findOrganizationData = await this.masterIO.findOne(resolvedOrganizationId);
    if (!findOrganizationData) {
      throw new BadRequestException('Organization not found');
    }

    const findOnHandAtrData = await this.findOnHand(
      {
        organization_code: findOrganizationData.organization_name,
        subinventory_code: 'KECIL',
        date: date,
        created_by: 'SYSTEM',
      },
      resolvedOrganizationId,
      'LHS',
    );


    const reportDate = this.resolveSavedDate(date);
    const previousDate = this.shiftDateByDays(reportDate, -1);

    const [onHandToday, onHandPrevious, doRows, btbRows] = await Promise.all([
      this.onHandAtrRepository.findByOrganizationIdAndDate(
        resolvedOrganizationId,
        reportDate,
      ),
      this.onHandAtrRepository.findByOrganizationIdAndDate(
        resolvedOrganizationId,
        previousDate,
      ),
      this.doSuggestionRepository.sumFinalAndSubmittedByOrganizationAndDate(
        resolvedOrganizationId,
        reportDate,
        LHS_DO_STATUSES,
      ),
      this.btbRepository.sumQtyByOrganizationAndDate(
        resolvedOrganizationId,
        reportDate,
      ),
    ]);

    const stockMetaByItem = this.aggregateOnHandByItemCode(onHandToday);
    const stockAwalByItem = this.aggregateOnHandByItemCode(onHandPrevious);
    const doByItem = new Map(
      doRows.map((row) => [
        row.item_code,
        {
          qty_final: row.total_qty_final,
          qty_submitted: row.total_qty_submitted,
        },
      ]),
    );
    const btbByItem = new Map(
      btbRows.map((row) => [
        row.item_code,
        {
          btb_qty: row.total_btb_qty,
          item_name: row.item_name,
        },
      ]),
    );

    const itemCodes = new Set<string>([
      ...stockMetaByItem.keys(),
      ...stockAwalByItem.keys(),
      ...doByItem.keys(),
      ...btbByItem.keys(),
    ]);

    const items: LHSReportItemDto[] = [...itemCodes]
      .sort((a, b) => a.localeCompare(b))
      .map((itemCode) => {
        const stockAwal = stockAwalByItem.get(itemCode);
        const stockMeta = stockMetaByItem.get(itemCode);
        const doQty = doByItem.get(itemCode);
        const btb = btbByItem.get(itemCode);

        const qtyFinal = doQty?.qty_final ?? 0;
        const qtySubmitted = doQty?.qty_submitted ?? 0;
        const btbQty = btb?.btb_qty ?? 0;
        const delta = qtyFinal - qtySubmitted;
        const outgoing = delta > 0 ? delta : 0;
        const incomingFromDo = delta < 0 ? Math.abs(delta) : 0;

        return {
          item_code: itemCode,
          item_description:
            stockMeta?.item_description ??
            stockAwal?.item_description ??
            btb?.item_name,
          stock_awal: stockAwal?.quantity ?? 0,
          incoming: incomingFromDo + btbQty,
          outgoing,
          stock_meta: stockMeta?.quantity ?? 0,
          qty_final: qtyFinal,
          qty_submitted: qtySubmitted,
          btb_qty: btbQty,
        };
      });

    return {
      organization_id: resolvedOrganizationId,
      date: reportDate,
      previous_date: previousDate,
      items,
    };
  }

  private shiftDateByDays(date: string, days: number): string {
    const base = new Date(`${date}T00:00:00+07:00`);
    base.setDate(base.getDate() + days);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: INDONESIA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(base);
  }

  private aggregateOnHandByItemCode(
    rows: OnHandAtr[],
  ): Map<string, { quantity: number; item_description?: string }> {
    const byItem = new Map<string, { quantity: number; item_description?: string }>();

    for (const row of rows) {
      const itemCode = row.item_code?.trim();
      if (!itemCode) {
        continue;
      }

      const existing = byItem.get(itemCode);
      const quantity = Number(row.quantity) || 0;
      if (existing) {
        existing.quantity += quantity;
        if (!existing.item_description && row.item_description) {
          existing.item_description = row.item_description;
        }
      } else {
        byItem.set(itemCode, {
          quantity,
          item_description: row.item_description ?? undefined,
        });
      }
    }

    return byItem;
  }
}