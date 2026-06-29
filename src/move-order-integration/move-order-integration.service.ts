import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MoveOrderIntegration } from '../core/domain/entities/move-order-integration.entity';
import { MoveOrderLineIntegration } from '../core/domain/entities/move-order-integration-lines.entity';
import { CreateMoveOrderIntegrationDto } from './dto/create-move-order-integration.dto';
import { UpdateMoveOrderIntegrationDto } from './dto/update-move-order-integration.dto';
import { CreateMoveOrderIntegrationLineDto } from './dto/create-move-order-integration-line.dto';
import { UpdateMoveOrderIntegrationLineDto } from './dto/update-move-order-integration-line.dto';
import { MoveOrderIntegrationRepository } from './move-order-integration.repository';
import { CreateMoveOrderIntegrationPayloadDto } from './dto/create-move-order-integration-payload.dto';
import { UpdateMoveOrderIntegrationPayloadDto } from './dto/update-move-order-integration-payload.dto';
import { IntegrationMoveOrderService } from './integration/integration-move-order.service';
import { CreateMoveOrderWithLinesDto } from './integration/dto/create-move-order-with-lines.dto';
import { MoveOrderWithLinesResponseDto } from './integration/dto/move-order-with-lines-response.dto';
import { MoveOrderIntegrationQueueProducer } from './integration/move-order-integration-queue.producer';
import { MoveOrderIntegrationPollService } from './integration/move-order-integration-poll.service';
import { MoveOrderIntegrationPollResponseDto } from './dto/move-order-integration-poll-response.dto';
import { MoveOrderIntegrationPaginationQueryDto } from './dto/move-order-integration-pagination.dto';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import {
  mapMoveOrderIntegrationEntityToOracle,
} from './integration/move-order-integration.mapper';

export type MoveOrderIntegrationAggregateResult = {
  header: MoveOrderIntegration;
  lines: MoveOrderLineIntegration[];
};

export type MoveOrderIntegrationHeaderWithLines = MoveOrderIntegration & {
  lines: MoveOrderLineIntegration[];
};

export type MoveOrderIntegrationOracleResult = {
  header: MoveOrderIntegration;
  lines: MoveOrderLineIntegration[];
  oracle: MoveOrderWithLinesResponseDto;
};

export type MoveOrderIntegrationQueuedResult = {
  status: 'PROCESSING';
  move_order_integration_id: string;
  request_number?: string;
  message: string;
};

export type MoveOrderIntegrationQueuedBatchResult = {
  total: number;
  results: MoveOrderIntegrationQueuedResult[];
};

@Injectable()
export class MoveOrderIntegrationService {
  constructor(
    private readonly repository: MoveOrderIntegrationRepository,
    private readonly integrationMoveOrderService: IntegrationMoveOrderService,
    private readonly queueProducer: MoveOrderIntegrationQueueProducer,
    private readonly pollService: MoveOrderIntegrationPollService,
    private readonly paginationService: PaginationService,
  ) { }

  async createHeader(dto: CreateMoveOrderIntegrationDto): Promise<MoveOrderIntegration> {
    return await this.repository.createHeader(dto);
  }

  async create(
    payload: CreateMoveOrderIntegrationPayloadDto,
  ): Promise<MoveOrderIntegrationAggregateResult> {
    const { lines = [], ...headerDto } = payload;
    return await this.repository.createHeaderWithLines(headerDto, lines);
  }

  async findAllHeaders(): Promise<MoveOrderIntegrationHeaderWithLines[]> {
    const headers = await this.repository.findAllHeaders();
    return this.attachLinesToHeaders(headers);
  }

  async findAllHeadersPaginated(
    query: MoveOrderIntegrationPaginationQueryDto,
  ): Promise<PaginatedResponseDto<MoveOrderIntegrationHeaderWithLines>> {
    const { data, total } = await this.repository.findAllHeadersPaginated(query);
    const headersWithLines = await this.attachLinesToHeaders(data);
    return this.paginationService.createPaginatedResponse(headersWithLines, query, total);
  }

  private async attachLinesToHeaders(
    headers: MoveOrderIntegration[],
  ): Promise<MoveOrderIntegrationHeaderWithLines[]> {
    if (!headers.length) {
      return [];
    }

    const headerIds = headers.map((h) => h.id);
    const lines = await this.repository.findLinesByHeaderIds(headerIds);
    const linesByHeader = new Map<string, MoveOrderLineIntegration[]>();

    for (const line of lines) {
      if (!line.move_order_integration_id) {
        continue;
      }
      const list = linesByHeader.get(line.move_order_integration_id) ?? [];
      list.push(line);
      linesByHeader.set(line.move_order_integration_id, list);
    }

    return headers.map((header) => ({
      ...header,
      lines: linesByHeader.get(header.id) ?? [],
    }));
  }

  async findHeaderById(id: string): Promise<MoveOrderIntegration> {
    const header = await this.repository.findHeaderById(id);
    if (!header) {
      throw new NotFoundException(`Move order integration with ID ${id} not found`);
    }
    return header;
  }

  async findHeaderWithLinesById(id: string): Promise<MoveOrderIntegrationHeaderWithLines> {
    const header = await this.findHeaderById(id);
    const lines = await this.repository.findLinesByHeaderId(id);
    return { ...header, lines };
  }

  async updateHeader(
    id: string,
    dto: UpdateMoveOrderIntegrationDto,
  ): Promise<MoveOrderIntegration> {
    await this.findHeaderById(id);
    await this.repository.updateHeader(id, dto);
    return await this.findHeaderById(id);
  }

  async update(
    id: string,
    payload: UpdateMoveOrderIntegrationPayloadDto,
  ): Promise<MoveOrderIntegrationAggregateResult> {
    await this.findHeaderById(id);

    const { lines, ...headerDto } = payload;
    if (Object.keys(headerDto).length > 0) {
      await this.repository.updateHeader(id, headerDto);
    }

    let resultLines = await this.repository.findLinesByHeaderId(id);
    if (lines) {
      resultLines = await this.repository.replaceLinesByHeaderId(
        id,
        lines as CreateMoveOrderIntegrationLineDto[],
      );
    }

    const header = await this.findHeaderById(id);
    return { header, lines: resultLines };
  }

  async removeHeader(id: string): Promise<void> {
    await this.findHeaderById(id);
    await this.repository.removeHeader(id);
  }

  async createLine(dto: CreateMoveOrderIntegrationLineDto): Promise<MoveOrderLineIntegration> {
    return await this.repository.createLine(dto);
  }

  async findAllLines(): Promise<MoveOrderLineIntegration[]> {
    return await this.repository.findAllLines();
  }

  async findLineById(id: string): Promise<MoveOrderLineIntegration> {
    const line = await this.repository.findLineById(id);
    if (!line) {
      throw new NotFoundException(`Move order integration line with ID ${id} not found`);
    }
    return line;
  }

  async updateLine(
    id: string,
    dto: UpdateMoveOrderIntegrationLineDto,
  ): Promise<MoveOrderLineIntegration> {
    await this.findLineById(id);
    await this.repository.updateLine(id, dto);
    return await this.findLineById(id);
  }

  async removeLine(id: string): Promise<void> {
    await this.findLineById(id);
    await this.repository.removeLine(id);
  }

  async submitToOracle(
    createDto: CreateMoveOrderWithLinesDto | CreateMoveOrderWithLinesDto[],
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderWithLinesResponseDto> {
    const dtoList = Array.isArray(createDto) ? createDto : [createDto];
    if (!dtoList.every((item) => item.lines?.length)) {
      throw new BadRequestException('lines must contain at least one item');
    }
    return await this.integrationMoveOrderService.createMoveOrderWithLines(
      dtoList,
      userId,
      userName,
    );
  }

  async integrateById(
    id: string,
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderIntegrationQueuedResult> {
    const record = await this.findHeaderWithLinesById(id);
    if (!record.lines.length) {
      throw new BadRequestException('Move order integration has no lines to submit');
    }

    return await this.enqueueIntegrationJob(record, userId, userName);
  }

  async createAndIntegrate(
    payload: CreateMoveOrderIntegrationPayloadDto,
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderIntegrationQueuedResult> {
    const persisted = await this.create(payload);
    return await this.enqueueIntegrationJob(
      { ...persisted.header, lines: persisted.lines },
      userId,
      userName,
    );
  }

  async createAndIntegrateMany(
    payloads: CreateMoveOrderIntegrationPayloadDto[],
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderIntegrationQueuedBatchResult> {
    if (!payloads.length) {
      throw new BadRequestException('Payload array must contain at least one item');
    }

    const results: MoveOrderIntegrationQueuedResult[] = [];
    for (const payload of payloads) {
      const queued = await this.createAndIntegrate(payload, userId, userName);
      results.push(queued);
    }

    return {
      total: results.length,
      results,
    };
  }

  async polling(id: string): Promise<MoveOrderIntegrationPollResponseDto> {
    return await this.pollService.pollByIntegrationId(id);
  }

  private async enqueueIntegrationJob(
    record: MoveOrderIntegrationHeaderWithLines,
    userId?: number,
    userName?: string,
  ): Promise<MoveOrderIntegrationQueuedResult> {
    const requestNumber =
      record.request_number ??
      mapMoveOrderIntegrationEntityToOracle(record, record.lines).REQUEST_NUMBER;

    if (!requestNumber) {
      throw new BadRequestException('request_number is required for Oracle integration');
    }

    await this.repository.updateHeader(record.id, {
      iface_status: 'READY',
      iface_message: 'Queued for Oracle move order integration',
    });

    await this.queueProducer.publishInsert({
      moveOrderIntegrationId: record.id,
      request_number: requestNumber,
      source_system: record.source_system,
      userId,
      userName,
    });

    return {
      status: 'PROCESSING',
      move_order_integration_id: record.id,
      request_number: requestNumber,
      message: 'Move order integration queued for Oracle processing',
    };
  }
}
