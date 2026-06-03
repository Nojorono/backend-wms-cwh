import { BadRequestException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { OutboundIntegrationIrReq } from '../core/domain/entities/outbound-integration-ir-req.entity';
import { OutboundIntegrationIrReqLines } from '../core/domain/entities/outbound-integration-ir-req-lines.entity';
import { OutboundMemoStatus } from '../core/domain/entities/outbound-memo.entity';
import { CreateOutboundIntegrationIrReqDto } from './dto/create-outbound-integration-ir-req.dto';
import { UpdateOutboundIntegrationIrReqDto } from './dto/update-outbound-integration-ir-req.dto';
import { CreateOutboundIntegrationIrReqLineDto } from './dto/create-outbound-integration-ir-req-line.dto';
import { UpdateOutboundIntegrationIrReqLineDto } from './dto/update-outbound-integration-ir-req-line.dto';
import { OutboundIntegrationIrReqRepository } from './outbound-integration-ir-req.repository';
import { CreateOutboundIntegrationIrReqPayloadDto } from './dto/create-outbound-integration-ir-req-payload.dto';
import { UpdateOutboundIntegrationIrReqPayloadDto } from './dto/update-outbound-integration-ir-req-payload.dto';
import { PollIntegrationStatusResponseDto } from './dto/poll-integration-status-response.dto';
import { PoInternalReqStatusCheckerService } from '../outbound-do/integration/po-internal-req-status-checker.service';
import { OutboundDoRepository } from '../outbound-do/outbound-do.repository';
import {
  OutboundJobProcessStatus,
  OutboundMemoCheckResult,
} from '../outbound-do/integration/outbound-integration-queue.types';

export type OutboundIntegrationIrReqAggregateResult = {
  header: OutboundIntegrationIrReq;
  lines: OutboundIntegrationIrReqLines[];
};

export type OutboundIntegrationIrReqHeaderWithLines = OutboundIntegrationIrReq & {
  lines: OutboundIntegrationIrReqLines[];
};

@Injectable()
export class OutboundIntegrationIrReqService {
  constructor(
    private readonly repository: OutboundIntegrationIrReqRepository,
    @Inject(forwardRef(() => PoInternalReqStatusCheckerService))
    private readonly statusChecker: PoInternalReqStatusCheckerService,
    private readonly outboundDoRepository: OutboundDoRepository,
  ) { }

  async createHeader(dto: CreateOutboundIntegrationIrReqDto): Promise<OutboundIntegrationIrReq> {
    return await this.repository.createHeader(dto);
  }

  async create(
    payload: CreateOutboundIntegrationIrReqPayloadDto,
  ): Promise<OutboundIntegrationIrReqAggregateResult> {
    const { lines = [], ...headerDto } = payload;
    return await this.repository.createHeaderWithLines(headerDto, lines);
  }

  /**
   * Upserts integration IR req for a memo: creates a new row or replaces header + lines when one
   * already exists for the same outbound_memo_id (safe for repeated DO integration calls).
   */
  async createOrReplaceByOutboundMemoId(
    payload: CreateOutboundIntegrationIrReqPayloadDto,
  ): Promise<OutboundIntegrationIrReqAggregateResult> {
    const { lines = [], outbound_memo_id, ...headerFields } = payload;
    if (!outbound_memo_id) {
      throw new BadRequestException('outbound_memo_id is required for create-or-replace integration');
    }
    const existing = await this.repository.findHeaderByOutboundMemoId(outbound_memo_id);
    if (!existing) {
      return await this.create(payload);
    }
    return await this.update(existing.id, {
      ...headerFields,
      lines,
    } as UpdateOutboundIntegrationIrReqPayloadDto);
  }

  async findAllHeaders(): Promise<OutboundIntegrationIrReqHeaderWithLines[]> {
    const headers = await this.repository.findAllHeaders();
    if (!headers.length) {
      return [];
    }

    const headerIds = headers.map((h) => h.id);
    const lines = await this.repository.findLinesByHeaderIds(headerIds);
    const linesByHeader = new Map<string, OutboundIntegrationIrReqLines[]>();
    for (const line of lines) {
      if (!line.outbound_integration_ir_req_id) {
        continue;
      }
      const list = linesByHeader.get(line.outbound_integration_ir_req_id) ?? [];
      list.push(line);
      linesByHeader.set(line.outbound_integration_ir_req_id, list);
    }

    return headers.map((header) => ({
      ...header,
      lines: linesByHeader.get(header.id) ?? [],
    }));
  }

  async findAllByOutboundDoId(outboundDoId: string): Promise<OutboundIntegrationIrReqHeaderWithLines[] | undefined> {
    const data = await this.repository.findAllByOutboundDoId(outboundDoId);
    if (!data.length) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      lines: item.lines ?? [],
    }));
  }

  async findHeaderById(id: string): Promise<OutboundIntegrationIrReq> {
    const header = await this.repository.findHeaderById(id);
    if (!header) {
      throw new NotFoundException(`Outbound integration IR req with ID ${id} not found`);
    }
    return header;
  }

  async findHeaderWithLinesById(id: string): Promise<OutboundIntegrationIrReqHeaderWithLines> {
    const header = await this.findHeaderById(id);
    const lines = await this.repository.findLinesByHeaderId(id);
    return { ...header, lines };
  }

  async updateHeader(
    id: string,
    dto: UpdateOutboundIntegrationIrReqDto,
  ): Promise<OutboundIntegrationIrReq> {
    await this.findHeaderById(id);
    await this.repository.updateHeader(id, dto);
    return await this.findHeaderById(id);
  }

  async update(
    id: string,
    payload: UpdateOutboundIntegrationIrReqPayloadDto,
  ): Promise<OutboundIntegrationIrReqAggregateResult> {
    await this.findHeaderById(id);

    const { lines, ...headerDto } = payload;
    if (Object.keys(headerDto).length > 0) {
      await this.repository.updateHeader(id, headerDto);
    }

    let resultLines = await this.repository.findLinesByHeaderId(id);
    if (lines) {
      resultLines = await this.repository.replaceLinesByHeaderId(
        id,
        lines as CreateOutboundIntegrationIrReqLineDto[],
      );
    }

    const header = await this.findHeaderById(id);
    return { header, lines: resultLines };
  }

  async removeHeader(id: string): Promise<void> {
    await this.findHeaderById(id);
    await this.repository.removeHeader(id);
  }

  async createLine(dto: CreateOutboundIntegrationIrReqLineDto): Promise<OutboundIntegrationIrReqLines> {
    return await this.repository.createLine(dto);
  }

  async findAllLines(): Promise<OutboundIntegrationIrReqLines[]> {
    return await this.repository.findAllLines();
  }

  async findLineById(id: string): Promise<OutboundIntegrationIrReqLines> {
    const line = await this.repository.findLineById(id);
    if (!line) {
      throw new NotFoundException(`Outbound integration IR req line with ID ${id} not found`);
    }
    return line;
  }

  async updateLine(
    id: string,
    dto: UpdateOutboundIntegrationIrReqLineDto,
  ): Promise<OutboundIntegrationIrReqLines> {
    await this.findLineById(id);
    await this.repository.updateLine(id, dto);
    return await this.findLineById(id);
  }

  async removeLine(id: string): Promise<void> {
    await this.findLineById(id);
    await this.repository.removeLine(id);
  }

  /**
   * Poll Oracle PO internal req status, sync to outbound_integration_ir_req (+ lines),
   * and update outbound_memo status when terminal (INTEGRATED / FAILED).
   */
  async pollStatusByOutboundDoId(outboundDoId: string): Promise<PollIntegrationStatusResponseDto> {
    const headers = await this.findAllByOutboundDoId(outboundDoId);
    if (!headers?.length) {
      throw new NotFoundException(
        `No outbound integration IR req found for outbound DO ${outboundDoId}`,
      );
    }

    const result = await this.statusChecker.checkOutboundDoStatus({
      outboundDoId,
      retryCount: 0,
      maxRetry: 20,
    });

    await this.applyMemoStatusFromCheckResult(result.memos);

    const refreshed = (await this.findAllByOutboundDoId(outboundDoId)) ?? [];

    return {
      status: result.status,
      reason: result.reason,
      outbound_do_id: outboundDoId,
      memos: result.memos.map((memo) => ({
        outbound_memo_id: memo.outboundMemoId,
        status: memo.status,
        reason: memo.reason,
      })),
      outbound_integration_ir_req: refreshed,
    };
  }

  private async applyMemoStatusFromCheckResult(
    memoResults: OutboundMemoCheckResult[],
  ): Promise<void> {
    for (const memoResult of memoResults) {
      const memoStatus = this.mapProcessStatusToMemoStatus(memoResult.status);
      if (!memoStatus) {
        continue;
      }

      const memo = await this.outboundDoRepository.findMemoById(memoResult.outboundMemoId);
      if (!memo) {
        continue;
      }

      if (!this.shouldUpdateMemoStatus(memo.status, memoStatus)) {
        continue;
      }

      await this.outboundDoRepository.updateMemoStatus(memoResult.outboundMemoId, memoStatus);
    }
  }

  private mapProcessStatusToMemoStatus(
    status: OutboundJobProcessStatus,
  ): OutboundMemoStatus | null {
    if (status === 'SUCCESS') {
      return OutboundMemoStatus.INTEGRATED;
    }
    if (status === 'ERROR') {
      return OutboundMemoStatus.FAILED;
    }
    return null;
  }

  private shouldUpdateMemoStatus(
    currentStatus: OutboundMemoStatus | null | undefined,
    nextStatus: OutboundMemoStatus,
  ): boolean {
    if (!currentStatus) {
      return true;
    }
    if (currentStatus === nextStatus) {
      return false;
    }
    if (currentStatus === OutboundMemoStatus.INTEGRATED) {
      return false;
    }
    return true;
  }
}
