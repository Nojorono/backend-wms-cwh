import { Injectable } from '@nestjs/common';
import { MoveOrderLineIntegration } from '../../core/domain/entities/move-order-integration-lines.entity';
import { MoveOrderIntegrationRepository } from '../move-order-integration.repository';
import { MoveOrderFindWithLinesResponseDto } from './dto/move-order-find-with-lines-response.dto';
import {
  mapOracleHeaderToWmsUpdate,
  mapOracleLineToWmsUpdate,
} from './move-order-oracle-sync.mapper';

@Injectable()
export class MoveOrderIntegrationSyncService {
  constructor(private readonly repository: MoveOrderIntegrationRepository) {}

  async syncFromOracleFindResponse(
    moveOrderIntegrationId: string,
    response: MoveOrderFindWithLinesResponseDto,
  ): Promise<void> {
    const headerUpdate = mapOracleHeaderToWmsUpdate(response.data?.header);
    if (Object.keys(headerUpdate).length > 0) {
      await this.repository.updateHeader(moveOrderIntegrationId, headerUpdate);
    }

    const oracleLines = response.data?.lines ?? [];
    if (!oracleLines.length) {
      return;
    }

    const existingLines = await this.repository.findLinesByHeaderId(moveOrderIntegrationId);
    const linesByNumber = new Map<number, MoveOrderLineIntegration>();
    for (const line of existingLines) {
      if (line.line_number != null) {
        linesByNumber.set(Number(line.line_number), line);
      }
    }

    for (const oracleLine of oracleLines) {
      const lineUpdate = mapOracleLineToWmsUpdate(oracleLine);
      if (Object.keys(lineUpdate).length === 0) {
        continue;
      }

      const lineNumber = Number(oracleLine.LINE_NUMBER ?? oracleLine.line_number);
      const existing = Number.isFinite(lineNumber) ? linesByNumber.get(lineNumber) : undefined;
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
