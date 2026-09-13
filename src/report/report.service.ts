import { Injectable } from '@nestjs/common';
import { Inbound } from '../core/domain/entities/inbound.entity';
import { OutboundDo } from '../core/domain/entities/outbound-do.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { OutboundDoPaginationDto } from '../outbound-do/dto/outbound-do-pagination.dto';
import { InboundReportQueryDto } from './dto/inbound-report-query.dto';
import { OutboundReportQueryDto } from './dto/outbound-report-query.dto';
import { ReportRepository } from './report.repository';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly paginationService: PaginationService,
  ) {}

  private async enrichInboundsWithReferenceNumber(
    inbounds: Inbound[],
  ): Promise<(Inbound & { inbound_reference_number?: string | null })[]> {
    const refIds = inbounds
      .map((i) => i.inbound_id_reference)
      .filter((id): id is string => Boolean(id));
    if (refIds.length === 0) {
      return inbounds.map((i) => ({ ...i, inbound_reference_number: undefined }));
    }
    const refMap = await this.reportRepository.findInboundNumbersByIds(refIds);
    return inbounds.map((i) => ({
      ...i,
      inbound_reference_number: i.inbound_id_reference
        ? refMap.get(i.inbound_id_reference) ?? null
        : undefined,
    }));
  }

  async findInboundReport(
    query: InboundReportQueryDto,
  ): Promise<
    | (Inbound & { inbound_reference_number?: string | null })[]
    | PaginatedResponseDto<Inbound & { inbound_reference_number?: string | null }>
  > {
    const hasPaginationParams =
      query.search ||
      query.page ||
      query.limit ||
      query.sortBy ||
      query.sortOrder ||
      query.status ||
      query.start_date ||
      query.end_date;

    if (hasPaginationParams) {
      const filters = {
        status: query.status,
        start_date: query.start_date,
        end_date: query.end_date,
      };
      const { data, total } = await this.reportRepository.findInboundsPaginated(
        filters,
        query.page,
        query.limit,
        query.search,
        query.sortBy,
        query.sortOrder,
      );
      const enrichedData = await this.enrichInboundsWithReferenceNumber(data);
      return this.paginationService.createPaginatedResponse(enrichedData, query, total);
    }

    const data = await this.reportRepository.findAllInbounds();
    return this.enrichInboundsWithReferenceNumber(data);
  }

  async findOutboundReport(
    query: OutboundReportQueryDto,
  ): Promise<OutboundDo[] | PaginatedResponseDto<OutboundDo>> {
    const hasPaginationParams =
      query.search ||
      query.page ||
      query.limit ||
      query.sortBy ||
      query.sortOrder ||
      query.start_date ||
      query.end_date;

    if (hasPaginationParams) {
      const paginationDto: OutboundDoPaginationDto = {
        page: query.page,
        limit: query.limit,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        start_date: query.start_date,
        end_date: query.end_date,
      };
      const { data, total } =
        await this.reportRepository.findOutboundDosPaginated(paginationDto);
      return this.paginationService.createPaginatedResponse(data, query, total);
    }

    return this.reportRepository.findAllOutboundDos();
  }
}
