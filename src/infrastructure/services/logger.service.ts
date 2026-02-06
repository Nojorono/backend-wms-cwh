import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { join, resolve } from 'path';

// Use require for winston-daily-rotate-file due to CommonJS compatibility
// winston-daily-rotate-file exports the constructor directly
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file') as any;

/** Detailed JSON schema for error-log folder (one JSON object per line) */
export interface ErrorLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
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

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    // Resolve to absolute path so logs are always under project root (or LOG_DIR)
    const logDir = resolve(process.cwd(), process.env.LOG_DIR || 'logs');
    const errorLogDir = join(logDir, 'error-log');
    const logLevel = process.env.LOG_LEVEL || 'info';

    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(errorLogDir)) {
      fs.mkdirSync(errorLogDir, { recursive: true });
    }

    // Define log format (application logs - human-readable)
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
        const contextStr = context ? `[${context}]` : '';
        const traceStr = trace ? `\n${trace}` : '';
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level.toUpperCase()}] ${contextStr} ${message}${metaStr}${traceStr}`;
      }),
    );

    // Detailed JSON format for error-log folder only (one JSON object per line)
    const errorLogJsonLineFormat = winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.printf((info: winston.Logform.TransformableInfo) => {
        const entry: Record<string, unknown> = {
          timestamp: new Date().toISOString(),
          level: info.level ?? 'error',
          message: String(info.message ?? ''),
          service: String(info.service ?? 'wms-api'),
        };
        if (info.context) entry.context = String(info.context);
        if (info.trace) entry.trace = String(info.trace);
        if (info.stack) entry.stack = String(info.stack);
        if (info.statusCode != null) entry.statusCode = Number(info.statusCode);
        if (info.request) entry.request = info.request;
        const skip = ['timestamp', 'level', 'message', 'service', 'context', 'trace', 'stack', 'statusCode', 'request', 'symbol'];
        Object.keys(info).forEach((key) => {
          if (skip.includes(key) || typeof (info as Record<string, unknown>)[key] === 'symbol') return;
          entry[key] = (info as Record<string, unknown>)[key];
        });
        return JSON.stringify(entry);
      }),
    );

    // Daily rotate file transport for all logs (application folder)
    const dailyRotateFileTransport = new DailyRotateFile({
      filename: join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Keep logs for 30 days
      format: logFormat,
    });

    // Error-log folder: only error level, detailed JSON schema
    const errorLogFileTransport = new DailyRotateFile({
      filename: join(errorLogDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d', // Keep error logs for 90 days
      level: 'error',
      format: errorLogJsonLineFormat,
    });

    // Console transport for development
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}] ${contextStr} ${message}${metaStr}`;
        }),
      ),
    });

    // Create logger instance
    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      defaultMeta: { service: 'wms-api' },
      transports: [
        dailyRotateFileTransport,
        errorLogFileTransport,
        ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : []),
      ],
      exceptionHandlers: [
        new DailyRotateFile({
          filename: join(logDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
        }),
        new DailyRotateFile({
          filename: join(errorLogDir, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
          format: errorLogJsonLineFormat,
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: join(logDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
        }),
        new DailyRotateFile({
          filename: join(errorLogDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
          format: errorLogJsonLineFormat,
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Additional methods for structured logging
  logRequest(request: {
    method: string;
    url: string;
    headers?: any;
    body?: any;
    query?: any;
    params?: any;
    ip?: string;
    user?: any;
  }) {
    this.logger.info('Incoming Request', {
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
    user?: any;
  }) {
    this.logger.info('Outgoing Response', {
      context: 'HTTP',
      method: request.method,
      url: request.url,
      statusCode: request.statusCode,
      responseTime: request.responseTime ? `${request.responseTime}ms` : undefined,
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

  // Sanitize sensitive data from request body
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apikey', 'api_key'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}

