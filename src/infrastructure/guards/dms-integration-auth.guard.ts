import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  DMS_INTEGRATION_APP_ID_HEADER,
  DMS_INTEGRATION_APP_SECRET_HEADER,
  DmsIntegrationAuthService,
} from '../services/dms-integration-auth.service';

@Injectable()
export class DmsIntegrationAuthGuard implements CanActivate {
  constructor(private readonly dmsIntegrationAuthService: DmsIntegrationAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const appId = this.getHeaderValue(request, DMS_INTEGRATION_APP_ID_HEADER);
    const appSecret = this.getHeaderValue(request, DMS_INTEGRATION_APP_SECRET_HEADER);

    let payload;
    if (appId && appSecret) {
      payload = this.dmsIntegrationAuthService.validateCredentials(appId, appSecret);
    } else {
      const token = this.extractBearerToken(request.headers.authorization);
      payload = this.dmsIntegrationAuthService.verifyToken(token);
    }

    (request as Request & { dmsIntegration?: { app_id: string } }).dmsIntegration = {
      app_id: payload.app_id,
    };

    return true;
  }

  private getHeaderValue(request: Request, headerName: string): string | undefined {
    const value = request.headers[headerName];
    if (Array.isArray(value)) {
      return value[0]?.trim() || undefined;
    }

    return value?.trim() || undefined;
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Provide x-dms-app-id and x-dms-app-secret headers, or a DMS integration bearer token',
      );
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('DMS integration bearer token is required');
    }

    return token;
  }
}
