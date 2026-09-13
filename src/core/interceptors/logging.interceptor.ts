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
  constructor(private readonly logger: AppLoggerService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const basePayload = {
      method: req.method,
      url: req.url,
      user: req.user?.username ?? req.user?.userId ?? 'anonymous',
    };

    this.logger.logRequest({
      ...basePayload,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip ?? req.connection?.remoteAddress,
      user: req.user,
    });

    return next.handle().pipe(
      tap({
        next: () => this.logResponse(context, startTime, req, basePayload),
        error: (err) => this.logError(context, startTime, req, basePayload, err),
      }),
    );
  }

  private logResponse(
    context: ExecutionContext,
    startTime: number,
    req: { method: string; url: string; user?: { username?: string; userId?: string } },
    basePayload: { method: string; url: string; user: string },
  ): void {
    const res = context.switchToHttp().getResponse();
    this.logger.logResponse({
      ...basePayload,
      statusCode: res.statusCode,
      responseTime: Date.now() - startTime,
      user: req.user,
    });
  }

  private logError(
    context: ExecutionContext,
    startTime: number,
    req: { method: string; url: string; body: unknown; query: unknown; params: unknown; user?: { username?: string; userId?: string } },
    basePayload: { method: string; url: string; user: string },
    err: { message?: string; stack?: string; status?: number; statusCode?: number },
  ): void {
    const statusCode = err.status ?? err.statusCode ?? 500;
    this.logger.logError({
      message: err.message ?? 'Internal Server Error',
      stack: err.stack,
      statusCode,
      context: context.getClass().name,
      request: { method: req.method, url: req.url, body: req.body, query: req.query, params: req.params },
    });
    this.logger.logResponse({
      ...basePayload,
      statusCode,
      responseTime: Date.now() - startTime,
      user: req.user,
    });
  }
}
