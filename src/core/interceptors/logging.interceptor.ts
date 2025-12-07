import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../../infrastructure/services/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, headers, ip } = request;
    const user = request.user;

    const startTime = Date.now();

    // Log incoming request
    this.logger.logRequest({
      method,
      url,
      headers: this.getRelevantHeaders(headers),
      body,
      query,
      params,
      ip: ip || request.connection?.remoteAddress,
      user,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const responseTime = Date.now() - startTime;

          // Log outgoing response
          this.logger.logResponse({
            method,
            url,
            statusCode: response.statusCode,
            responseTime,
            user,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          // Log error
          this.logger.logError({
            message: error.message || 'Internal Server Error',
            stack: error.stack,
            statusCode,
            context: context.getClass().name,
            request: {
              method,
              url,
              body: this.sanitizeBody(body),
              query,
              params,
            },
          });

          // Log response with error status
          this.logger.logResponse({
            method,
            url,
            statusCode,
            responseTime,
            user,
          });
        },
      }),
    );
  }

  private getRelevantHeaders(headers: any): any {
    const relevantHeaders = ['user-agent', 'content-type', 'content-length', 'accept'];
    const filtered: any = {};

    for (const header of relevantHeaders) {
      if (headers[header]) {
        filtered[header] = headers[header];
      }
    }

    return filtered;
  }

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

