import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { UsersActivityService } from '../../users-activity/users-activity.service';
import { UserActivityAction, UserActivityStatus } from '../domain/entities/users-activity.entity';
import { IS_PUBLIC_KEY, SKIP_AUDIT_LOG_KEY } from '../decorators/public.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly usersActivityService: UsersActivityService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if audit logging should be skipped
    const skipAuditLog = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_LOG_KEY, [
      handler,
      controller,
    ]);

    if (skipAuditLog) {
      return next.handle();
    }

    const startTime = Date.now();
    const method = request.method;
    const endpoint = request.url;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'] || '';
    const user = request.user; // Set by JWT guard

    // Determine action based on HTTP method
    const action = this.mapMethodToAction(method);

    // Extract entity type from route (e.g., /inbound -> inbound)
    const entityType = this.extractEntityType(endpoint);

    // Extract entity ID from params or body
    const entityId = request.params?.id || request.body?.id || request.params?.entityId;

    const startTimeMs = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTimeMs;
        const status = response.statusCode >= 200 && response.statusCode < 300
          ? UserActivityStatus.SUCCESS
          : UserActivityStatus.FAILED;

        // Log activity asynchronously (don't block response)
        this.logActivity({
          user_id: user?.id || user?.user_id,
          username: user?.username,
          action,
          entity_type: entityType,
          entity_id: entityId,
          description: this.generateDescription(method, endpoint, entityType),
          request_data: this.sanitizeRequestData(request.body, request.query, request.params),
          response_data: this.sanitizeResponseData(data),
          ip_address: ipAddress,
          user_agent: userAgent,
          status,
          endpoint,
          method,
          response_time_ms: responseTime,
          organization_id: user?.organization_id,
          warehouse_id: user?.warehouse_id,
        }).catch((error) => {
          // Log error but don't fail the request
          console.error('Failed to log audit activity:', error);
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTimeMs;
        const errorMessage = error?.message || 'Unknown error';

        // Log failed activity
        this.logActivity({
          user_id: user?.id || user?.user_id,
          username: user?.username,
          action,
          entity_type: entityType,
          entity_id: entityId,
          description: this.generateDescription(method, endpoint, entityType),
          request_data: this.sanitizeRequestData(request.body, request.query, request.params),
          response_data: { error: errorMessage },
          ip_address: ipAddress,
          user_agent: userAgent,
          status: UserActivityStatus.FAILED,
          error_message: errorMessage,
          endpoint,
          method,
          response_time_ms: responseTime,
          organization_id: user?.organization_id,
          warehouse_id: user?.warehouse_id,
        }).catch((logError) => {
          console.error('Failed to log audit activity:', logError);
        });

        throw error;
      }),
    );
  }

  private async logActivity(data: {
    user_id?: string;
    username?: string;
    action: UserActivityAction;
    entity_type?: string;
    entity_id?: string;
    description?: string;
    request_data?: Record<string, any>;
    response_data?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    status: UserActivityStatus;
    error_message?: string;
    endpoint?: string;
    method?: string;
    response_time_ms?: number;
    organization_id?: string;
    warehouse_id?: string;
  }): Promise<void> {
    try {
      await this.usersActivityService.logActivity(data.action, data);
    } catch (error) {
      // Silently fail to not break the request flow
      console.error('Audit log error:', error);
    }
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
    // Extract entity type from route pattern
    // e.g., /api/inbound -> inbound, /api/inbound/123 -> inbound
    const match = endpoint.match(/\/([^\/\?]+)/);
    if (match && match[1] && match[1] !== 'api') {
      return match[1].replace(/-/g, '_'); // Convert kebab-case to snake_case
    }
    return undefined;
  }

  private generateDescription(method: string, endpoint: string, entityType?: string): string {
    const action = this.mapMethodToAction(method);
    const entity = entityType ? `${entityType} ` : '';
    return `${action} ${entity}operation on ${endpoint}`;
  }

  private sanitizeRequestData(
    body?: any,
    query?: any,
    params?: any,
  ): Record<string, any> | undefined {
    const data: Record<string, any> = {};

    if (body && Object.keys(body).length > 0) {
      // Remove sensitive fields
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

  private sanitizeResponseData(data: any): Record<string, any> | undefined {
    if (!data) return undefined;

    // For large responses, only log metadata
    if (typeof data === 'object') {
      const stringified = JSON.stringify(data);
      if (stringified.length > 10000) {
        return {
          truncated: true,
          size: stringified.length,
          type: Array.isArray(data) ? 'array' : 'object',
        };
      }
    }

    return typeof data === 'object' ? data : { value: data };
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

