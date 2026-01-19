import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { join } from 'path';

// Use require for winston-daily-rotate-file due to CommonJS compatibility
// winston-daily-rotate-file exports the constructor directly
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file') as any;

@Injectable()
export class AppLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = process.env.LOG_DIR || 'logs';
    const logLevel = process.env.LOG_LEVEL || 'info';

    // Create logs directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Define log format
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

    // Daily rotate file transport for all logs
    const dailyRotateFileTransport = new DailyRotateFile({
      filename: join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Keep logs for 30 days
      format: logFormat,
    });

    // Daily rotate file transport for errors only
    const dailyRotateErrorFileTransport = new DailyRotateFile({
      filename: join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '90d', // Keep error logs for 90 days
      level: 'error',
      format: logFormat,
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
        dailyRotateErrorFileTransport,
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
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: join(logDir, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '90d',
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
    request?: any;
  }) {
    this.logger.error(error.message, {
      context: error.context || 'Error',
      stack: error.stack,
      statusCode: error.statusCode,
      request: error.request,
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

