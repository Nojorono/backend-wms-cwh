import { Injectable, NotFoundException } from '@nestjs/common';
import { InboundIntegration } from 'src/core/domain/entities/inbound-integration.entity';
import { InboundIntegrationLines } from 'src/core/domain/entities/inbound-integration-lines.entity';
import { CreateInboundIntegrationDto } from './dto/create-inbound-integration.dto';
import { UpdateInboundIntegrationDto } from './dto/update-inbound-integration.dto';
import { CreateInboundIntegrationLineDto } from './dto/create-inbound-integration-line.dto';
import { UpdateInboundIntegrationLineDto } from './dto/update-inbound-integration-line.dto';
import { InboundIntegrationRepository } from './inbound-integration.repository';
import { CreateInboundIntegrationPayloadDto } from './dto/create-inbound-integration-payload.dto';
import {
  UpdateInboundIntegrationPayloadDto,
} from './dto/update-inbound-integration-payload.dto';

export type InboundIntegrationAggregateResult = {
  header: InboundIntegration;
  lines: InboundIntegrationLines[];
};
export type InboundIntegrationHeaderWithLines = InboundIntegration & {
  lines: InboundIntegrationLines[];
};

@Injectable()
export class InboundIntegrationService {
  constructor(private readonly repository: InboundIntegrationRepository) {}

  async createHeader(dto: CreateInboundIntegrationDto): Promise<InboundIntegration> {
    return await this.repository.createHeader(dto);
  }

  async create(
    payload: CreateInboundIntegrationPayloadDto,
  ): Promise<InboundIntegrationAggregateResult> {
    const { lines = [], ...headerDto } = payload;
    return await this.repository.createHeaderWithLines(headerDto, lines);
  }

  /**
   * Creates integration for a DO, or updates header + replaces lines when a row already exists
   * for that inbound_do_id (unique constraint safe for repeat integration-to-oracle calls).
   */
  async createOrReplaceByInboundDo(
    payload: CreateInboundIntegrationPayloadDto,
  ): Promise<InboundIntegrationAggregateResult> {
    const { lines = [], ...headerDto } = payload;
    if (!headerDto.inbound_do_id) {
      return await this.create(payload);
    }
    const existing = await this.repository.findHeaderByInboundDoId(headerDto.inbound_do_id);
    if (!existing) {
      return await this.create(payload);
    }
    return await this.update(existing.id, {
      ...headerDto,
      lines,
    } as UpdateInboundIntegrationPayloadDto);
  }

  async findAllHeaders(): Promise<InboundIntegrationHeaderWithLines[]> {
    const headers = await this.repository.findAllHeaders();
    if (!headers.length) {
      return [];
    }

    const lines = await this.repository.findAllLines();
    const linesByHeader = new Map<string, InboundIntegrationLines[]>();
    for (const line of lines) {
      if (!line.inbound_integration_id) {
        continue;
      }
      const list = linesByHeader.get(line.inbound_integration_id) ?? [];
      list.push(line);
      linesByHeader.set(line.inbound_integration_id, list);
    }

    return headers.map((header) => ({
      ...header,
      lines: linesByHeader.get(header.id) ?? [],
    }));
  }

  /** All integration headers for an inbound, each with its lines (not all lines in DB). */
  async findAllByInbound(inboundId: string): Promise<InboundIntegrationHeaderWithLines[]> {
    const headers = await this.repository.findAllHeadersByInboundId(inboundId);
    if (!headers.length) {
      return [];
    }
    const headerIds = headers.map((h) => h.id);
    const lines = await this.repository.findLinesByHeaderIds(headerIds);
    const linesByHeader = new Map<string, InboundIntegrationLines[]>();
    for (const line of lines) {
      if (!line.inbound_integration_id) {
        continue;
      }
      const list = linesByHeader.get(line.inbound_integration_id) ?? [];
      list.push(line);
      linesByHeader.set(line.inbound_integration_id, list);
    }
    return headers.map((header) => ({
      ...header,
      lines: linesByHeader.get(header.id) ?? [],
    }));
  }

  async findHeaderById(id: string): Promise<InboundIntegration> {
    const header = await this.repository.findHeaderById(id);
    if (!header) {
      throw new NotFoundException(`Inbound integration with ID ${id} not found`);
    }
    return header;
  }

  async updateHeader(id: string, dto: UpdateInboundIntegrationDto): Promise<InboundIntegration> {
    await this.findHeaderById(id);
    await this.repository.updateHeader(id, dto);
    return await this.findHeaderById(id);
  }

  async updateStatusByInboundId(inboundId: string, status: string): Promise<void> {
    await this.repository.updateStatusByInboundId(inboundId, status);
  }

  async update(
    id: string,
    payload: UpdateInboundIntegrationPayloadDto,
  ): Promise<InboundIntegrationAggregateResult> {
    await this.findHeaderById(id);

    const { lines, ...headerDto } = payload;
    if (Object.keys(headerDto).length > 0) {
      await this.repository.updateHeader(id, headerDto);
    }

    let resultLines = await this.repository.findLinesByHeaderId(id);
    if (lines) {
      resultLines = await this.repository.replaceLinesByHeaderId(
        id,
        lines as CreateInboundIntegrationLineDto[],
      );
    }

    const header = await this.findHeaderById(id);
    return { header, lines: resultLines };
  }

  async removeHeader(id: string): Promise<void> {
    await this.findHeaderById(id);
    await this.repository.removeHeader(id);
  }

  async createLine(dto: CreateInboundIntegrationLineDto): Promise<InboundIntegrationLines> {
    return await this.repository.createLine(dto);
  }

  async findAllLines(): Promise<InboundIntegrationLines[]> {
    return await this.repository.findAllLines();
  }

  async findLineById(id: string): Promise<InboundIntegrationLines> {
    const line = await this.repository.findLineById(id);
    if (!line) {
      throw new NotFoundException(`Inbound integration line with ID ${id} not found`);
    }
    return line;
  }

  async updateLine(
    id: string,
    dto: UpdateInboundIntegrationLineDto,
  ): Promise<InboundIntegrationLines> {
    await this.findLineById(id);
    await this.repository.updateLine(id, dto);
    return await this.findLineById(id);
  }

  async removeLine(id: string): Promise<void> {
    await this.findLineById(id);
    await this.repository.removeLine(id);
  }

}
