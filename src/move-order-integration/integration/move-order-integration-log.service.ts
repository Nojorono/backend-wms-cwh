import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../infrastructure/services/logger.service';
import { summarizeOracleError, normalizeLogMessage } from '../../core/utils/log.util';

type MoveOrderLogMeta = Record<string, string | number | boolean | undefined>;

@Injectable()
export class MoveOrderIntegrationLogService {
  private readonly domain = 'move-order';

  constructor(private readonly appLogger: AppLoggerService) { }

  info(phase: string, event: string, meta?: MoveOrderLogMeta): void {
    this.appLogger.logIntegration(this.domain, phase, event, this.normalizeMeta(meta));
  }

  warn(phase: string, event: string, meta?: MoveOrderLogMeta): void {
    this.appLogger.logIntegrationWarn(this.domain, phase, event, this.normalizeMeta(meta));
  }

  error(phase: string, event: string, meta?: MoveOrderLogMeta & { error?: string }): void {
    const oracleError = summarizeOracleError(meta?.error);
    this.appLogger.logIntegrationError(this.domain, phase, event, {
      ...this.normalizeMeta(meta),
      ...(oracleError ? { oracle_error: oracleError } : {}),
    });
  }

  private normalizeMeta(meta?: MoveOrderLogMeta): Record<string, string | number | boolean | undefined> | undefined {
    if (!meta) {
      return undefined;
    }

    const normalized: Record<string, string | number | boolean | undefined> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (value == null) {
        continue;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        normalized[key] = value;
        continue;
      }
      normalized[key] = normalizeLogMessage(value);
    }
    return normalized;
  }
}
