import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseInterface } from '../interfaces/response.interface';
import { UsersActivityService } from '../../users-activity/users-activity.service';
import { UserActivityAction, UserActivityStatus } from '../domain/entities/users-activity.entity';
import { AppLoggerService } from '../../infrastructure/services/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional()
    @Inject(UsersActivityService)
    private readonly usersActivityService?: UsersActivityService,
    @Optional()
    @Inject(AppLoggerService)
    private readonly logger?: AppLoggerService,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    const errorMessage =
      typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message || 'Internal server error';

    const responseBody: ResponseInterface<null> = {
      success: false,
      message: 'Operation failed',
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log failed activity if service is available
    if (this.usersActivityService) {
      const user = request.user;
      const method = request.method;
      const endpoint = request.url;
      const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.connection?.remoteAddress;
      const userAgent = request.headers['user-agent'] || '';
      const action = this.mapMethodToAction(method);
      const entityType = this.extractEntityType(endpoint);
      const entityId = request.params?.id || request.body?.id || request.params?.entityId;

      this.usersActivityService
        .logActivity(action, {
          user_id: user?.id || user?.user_id,
          username: user?.username,
          entity_type: entityType,
          entity_id: entityId,
          description: `${action} operation failed on ${endpoint}`,
          request_data: this.sanitizeRequestData(request.body, request.query, request.params),
          response_data: { error: errorMessage, status_code: status },
          ip_address: ipAddress,
          user_agent: userAgent,
          status: UserActivityStatus.FAILED,
          error_message: errorMessage,
          endpoint,
          method,
          organization_id: user?.organization_id,
          warehouse_id: user?.warehouse_id,
        })
        .catch((error) => {
          if (this.logger) {
            this.logger.error('Failed to log audit activity in exception filter', error.stack, 'HttpExceptionFilter');
          } else {
            console.error('Failed to log audit activity in exception filter:', error);
          }
        });
    }

    // Log the exception
    if (this.logger) {
      this.logger.logError({
        message: errorMessage,
        stack: exception.stack,
        statusCode: status,
        context: 'HttpExceptionFilter',
        request: {
          method: request.method,
          url: request.url,
          body: this.sanitizeRequestData(request.body, request.query, request.params),
        },
      });
    }

    response.status(status).json(responseBody);
  }

  private mapMethodToAction(method: string): UserActivityAction {
    const methodMap: Record<string, UserActivityAction> = {
      GET: UserActivityAction.VIEW,
      POST: UserActivityAction.CREATE,
      PUT: UserActivityAction.UPDATE,
      PATCH: UserActivityAction.UPDATE,
      DELETE: UserActivityAction.DELETE,
    };

    return methodMap[method.toUpperCase()] || UserActivityAction.CUSTOM;
  }

  private extractEntityType(endpoint: string): string | undefined {
    const match = endpoint.match(/\/([^\/\?]+)/);
    if (match && match[1] && match[1] !== 'api') {
      return match[1].replace(/-/g, '_');
    }
    return undefined;
  }

  private sanitizeRequestData(
    body?: any,
    query?: any,
    params?: any,
  ): Record<string, any> | undefined {
    const data: Record<string, any> = {};

    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.removeSensitiveFields(body);
      if (Object.keys(sanitizedBody).length > 0) {
        data.body = sanitizedBody;
      }
    }

    if (query && Object.keys(query).length > 0) {
      data.query = query;
    }

    if (params && Object.keys(params).length > 0) {
      data.params = params;
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }

  private removeSensitiveFields(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.removeSensitiveFields(sanitized[key]);
      }
    }

    return sanitized;
  }
}
