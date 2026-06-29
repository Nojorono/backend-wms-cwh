import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { join, resolve } from 'path';
import { formatLogMeta, normalizeLogMessage } from '../../core/utils/log.util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file') as any;

/** Structured JSON line for error / integration folders */
export interface ErrorLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  category?: string;
  domain?: string;
  phase?: string;
  event?: string;
  trace?: string;
  stack?: string;
  statusCode?: number;
  service: string;
  request?: {
    method?: string;
    url?: string;
    body?: unknown;
    query?: unknown;
    params?: unknown;
    ip?: string;
    user?: string;
  };
  [key: string]: unknown;
}

type LogDirs = {
  root: string;
  audit: string;
  application: string;
  http: string;
  error: string;
  integration: string;
  exceptions: string;
  rejections: string;
};

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;
  private readonly logDirs: LogDirs;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    this.logDirs = this.resolveLogDirs();
    this.ensureLogDirs();

    const humanFormat = this.createHumanFormat();
    const jsonLineFormat = this.createJsonLineFormat();

    const applicationTransport = new DailyRotateFile({
      filename: join(this.logDirs.application, 'application-%DATE%.log'),
      auditFile: join(this.logDirs.audit, 'application-audit.json'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format((info) => (info.context === 'HTTP' || info.category === 'integration' ? false : info))(),
        humanFormat,
      ),
    });

    const httpTransport = new DailyRotateFile({
      filename: join(this.logDirs.http, 'http-%DATE%.log'),
      auditFile: join(this.logDirs.audit, 'http-audit.json'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format((info) => (info.context === 'HTTP' ? info : false))(),
        humanFormat,
      ),
    });

    const integrationTransport = new DailyRotateFile({
      filename: join(this.logDirs.integration, 'integration-%DATE%.log'),
      auditFile: join(this.logDirs.audit, 'integration-audit.json'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '60d',
      format: winston.format.combine(
        winston.format((info) => (info.category === 'integration' ? info : false))(),
        jsonLineFormat,
      ),
    });

    const errorTransport = new DailyRotateFile({
      filename: join(this.logDirs.error, 'error-%DATE%.log'),
      auditFile: join(this.logDirs.audit, 'error-audit.json'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d',
      level: 'error',
      format: jsonLineFormat,
    });

    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context, category, domain, phase, event, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const categoryStr =
            category === 'integration' ? `[${String(domain)}/${String(phase)}]` : '';
          const metaKeys = ['service', 'category', 'domain', 'phase', 'event', 'trace', 'stack', 'statusCode'];
          const metaPayload = Object.fromEntries(
            Object.entries(meta).filter(([key]) => !metaKeys.includes(key)),
          );
          const metaStr = Object.keys(metaPayload).length
            ? ` ${formatLogMeta(metaPayload as Record<string, unknown>)}`
            : '';
          const eventStr = event ? ` ${String(event)} |` : '';
          return `${timestamp} [${String(level)}] ${contextStr}${categoryStr}${eventStr} ${normalizeLogMessage(message)}${metaStr}`;
        }),
      ),
    });

    this.logger = winston.createLogger({
      level: logLevel,
      format: humanFormat,
      defaultMeta: { service: 'wms-api' },
      transports: [
        applicationTransport,
        httpTransport,
        integrationTransport,
        errorTransport,
        ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : []),
      ],
      exceptionHandlers: [
        new DailyRotateFile({
          filename: join(this.logDirs.exceptions, 'exceptions-%DATE%.log'),
          auditFile: join(this.logDirs.audit, 'exceptions-audit.json'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
          format: jsonLineFormat,
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: join(this.logDirs.rejections, 'rejections-%DATE%.log'),
          auditFile: join(this.logDirs.audit, 'rejections-audit.json'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
          format: jsonLineFormat,
        }),
      ],
    });
  }

  private resolveLogDirs(): LogDirs {
    const root = resolve(process.cwd(), process.env.LOG_DIR || 'logs');
    return {
      root,
      audit: join(root, '.audit'),
      application: join(root, 'application'),
      http: join(root, 'http'),
      error: join(root, 'error'),
      integration: join(root, 'integration'),
      exceptions: join(root, 'exceptions'),
      rejections: join(root, 'rejections'),
    };
  }

  private ensureLogDirs(): void {
    const fs = require('fs') as typeof import('fs');
    Object.values(this.logDirs).forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private createHumanFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        const contextStr = context ? `[${context}]` : '';
        const traceStr = trace ? `\n${trace}` : '';
        const metaKeys = ['service', 'context', 'trace', 'stack', 'category', 'domain', 'phase', 'event'];
        const metaPayload = Object.fromEntries(
          Object.entries(meta).filter(([key]) => !metaKeys.includes(key)),
        );
        const metaStr = Object.keys(metaPayload).length
          ? ` ${formatLogMeta(metaPayload as Record<string, unknown>)}`
          : '';
        return `${timestamp} [${String(level).toUpperCase()}] ${contextStr} ${normalizeLogMessage(message)}${metaStr}${traceStr}`;
      }),
    );
  }

  private createJsonLineFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const entry: Record<string, unknown> = {
          timestamp: new Date().toISOString(),
          level: info.level ?? 'info',
          message: normalizeLogMessage(info.message),
          service: String(info.service ?? 'wms-api'),
        };

        const reserved = new Set([
          'timestamp',
          'level',
          'message',
          'service',
          'context',
          'trace',
          'stack',
          'statusCode',
          'request',
          'category',
          'domain',
          'phase',
          'event',
          'symbol',
        ]);

        for (const [key, value] of Object.entries(info)) {
          if (reserved.has(key) || typeof value === 'symbol') {
            continue;
          }
          entry[key] = value;
        }

        if (info.context) entry.context = String(info.context);
        if (info.category) entry.category = String(info.category);
        if (info.domain) entry.domain = String(info.domain);
        if (info.phase) entry.phase = String(info.phase);
        if (info.event) entry.event = String(info.event);
        if (info.trace) entry.trace = String(info.trace);
        if (info.stack) entry.stack = String(info.stack);
        if (info.statusCode != null) entry.statusCode = Number(info.statusCode);
        if (info.request) entry.request = info.request;

        return JSON.stringify(entry);
      }),
    );
  }

  private static readonly VERBOSE_STARTUP_CONTEXTS = new Set([
    'InstanceLoader',
    'RoutesResolver',
    'RouterExplorer',
  ]);

  log(message: unknown, context?: string) {
    if (context && AppLoggerService.VERBOSE_STARTUP_CONTEXTS.has(context)) {
      return;
    }
    if (context === 'NestApplication' && typeof message === 'string' && message.includes('successfully started')) {
      return;
    }
    if (context === 'NestFactory' && typeof message === 'string' && message.toLowerCase().includes('starting nest')) {
      return;
    }
    this.logger.info(normalizeLogMessage(message), { context });
  }

  error(message: unknown, trace?: string, context?: string) {
    this.logger.error(normalizeLogMessage(message), { trace, context });
  }

  warn(message: unknown, context?: string) {
    this.logger.warn(normalizeLogMessage(message), { context });
  }

  debug(message: unknown, context?: string) {
    this.logger.debug(normalizeLogMessage(message), { context });
  }

  verbose(message: unknown, context?: string) {
    this.logger.verbose(normalizeLogMessage(message), { context });
  }

  logIntegration(
    domain: string,
    phase: string,
    event: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.info(event, {
      context: 'Integration',
      category: 'integration',
      domain,
      phase,
      event,
      ...meta,
    });
  }

  logIntegrationWarn(
    domain: string,
    phase: string,
    event: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.warn(event, {
      context: 'Integration',
      category: 'integration',
      domain,
      phase,
      event,
      ...meta,
    });
  }

  logIntegrationError(
    domain: string,
    phase: string,
    event: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.error(event, {
      context: 'Integration',
      category: 'integration',
      domain,
      phase,
      event,
      ...meta,
    });
  }

  logRequest(request: {
    method: string;
    url: string;
    headers?: unknown;
    body?: unknown;
    query?: unknown;
    params?: unknown;
    ip?: string;
    user?: { username?: string; userId?: string | number };
  }) {
    this.logger.info('Incoming request', {
      context: 'HTTP',
      method: request.method,
      url: request.url,
      ip: request.ip,
      user: request.user?.username || request.user?.userId || 'anonymous',
      query: request.query,
      params: request.params,
      body: this.sanitizeBody(request.body),
    });
  }

  logResponse(request: {
    method: string;
    url: string;
    statusCode: number;
    responseTime?: number;
    user?: { username?: string; userId?: string | number };
  }) {
    this.logger.info('Outgoing response', {
      context: 'HTTP',
      method: request.method,
      url: request.url,
      statusCode: request.statusCode,
      responseTimeMs: request.responseTime,
      user: request.user?.username || request.user?.userId || 'anonymous',
    });
  }

  logError(error: {
    message: string;
    stack?: string;
    statusCode?: number;
    context?: string;
    request?: Record<string, unknown> & { body?: unknown };
  }) {
    const request = error.request
      ? { ...error.request, body: this.sanitizeBody(error.request.body) }
      : undefined;
    this.logger.error(error.message, {
      context: error.context || 'Error',
      stack: error.stack,
      statusCode: error.statusCode,
      request,
    });
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apikey', 'api_key'];
    const sanitized = { ...(body as Record<string, unknown>) };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
