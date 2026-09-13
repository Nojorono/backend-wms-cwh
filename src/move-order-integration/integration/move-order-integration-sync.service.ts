import { Injectable } from '@nestjs/common';
import { UpdateMoveOrderIntegrationDto } from '../dto/update-move-order-integration.dto';
import { MoveOrderLineIntegration } from '../../core/domain/entities/move-order-integration-lines.entity';
import { MoveOrderIntegrationRepository } from '../move-order-integration.repository';
import { MoveOrderFindWithLinesResponseDto } from './dto/move-order-find-with-lines-response.dto';
import { MoveOrderCreateDataRowDto } from './dto/move-order-with-lines-response.dto';
import {
  mapOracleHeaderToWmsUpdate,
  mapOracleLineToWmsUpdate,
  normalizeMoveOrderFindData,
  normalizeOracleRecord,
} from './move-order-oracle-sync.mapper';

@Injectable()
export class MoveOrderIntegrationSyncService {
  constructor(private readonly repository: MoveOrderIntegrationRepository) {}

  async syncFromCreateResponse(
    moveOrderIntegrationId: string,
    data?: MoveOrderCreateDataRowDto | MoveOrderCreateDataRowDto[] | null,
  ): Promise<void> {
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return;
    }

    const update: UpdateMoveOrderIntegrationDto = {};
    if (row.HEADER_IFACE_ID != null) {
      update.header_iface_id = Number(row.HEADER_IFACE_ID);
    }
    if (row.REQUEST_NUMBER?.trim()) {
      update.request_number = row.REQUEST_NUMBER.trim();
    }
    if (row.TOTAL_LINES != null) {
      update.total_lines = Number(row.TOTAL_LINES);
    }

    if (Object.keys(update).length > 0) {
      await this.repository.updateHeader(moveOrderIntegrationId, update);
    }
  }

  async syncFromOracleFindResponse(
    moveOrderIntegrationId: string,
    response: MoveOrderFindWithLinesResponseDto,
  ): Promise<void> {
    const normalized = normalizeMoveOrderFindData(
      response.data as Record<string, unknown> | null | undefined,
    );
    if (!normalized?.header) {
      return;
    }

    const headerUpdate = mapOracleHeaderToWmsUpdate(normalized.header);
    if (Object.keys(headerUpdate).length > 0) {
      await this.repository.updateHeader(moveOrderIntegrationId, headerUpdate);
    }

    const oracleLines = normalized.lines ?? [];
    if (!oracleLines.length) {
      return;
    }

    const existingLines = await this.repository.findLinesByHeaderId(moveOrderIntegrationId);
    const linesByNumber = new Map<number, MoveOrderLineIntegration>();
    const linesBySourceLineId = new Map<string, MoveOrderLineIntegration>();

    for (const line of existingLines) {
      if (line.line_number != null) {
        linesByNumber.set(Number(line.line_number), line);
      }
      if (line.source_line_id?.trim()) {
        linesBySourceLineId.set(line.source_line_id.trim(), line);
      }
    }

    for (const oracleLine of oracleLines) {
      const normalized = normalizeOracleRecord(oracleLine);
      const lineUpdate = mapOracleLineToWmsUpdate(normalized);
      if (Object.keys(lineUpdate).length === 0) {
        continue;
      }

      const lineNumber = Number(normalized.LINE_NUMBER);
      const sourceLineId =
        typeof normalized.SOURCE_LINE_ID === 'string'
          ? normalized.SOURCE_LINE_ID.trim()
          : undefined;

      let existing: MoveOrderLineIntegration | undefined;
      if (Number.isFinite(lineNumber)) {
        existing = linesByNumber.get(lineNumber);
      }
      if (!existing && sourceLineId) {
        existing = linesBySourceLineId.get(sourceLineId);
      }

      if (existing) {
        await this.repository.updateLine(existing.id, lineUpdate);
        continue;
      }

      await this.repository.createLine({
        ...lineUpdate,
        move_order_integration_id: moveOrderIntegrationId,
      });
    }
  }
}
