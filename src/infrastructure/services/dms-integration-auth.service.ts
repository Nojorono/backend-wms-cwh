import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface DmsIntegrationTokenPayload {
  sub: string;
  app_id: string;
  type: 'dms-integration';
}

export const DMS_INTEGRATION_APP_ID_HEADER = 'x-dms-app-id';
export const DMS_INTEGRATION_APP_SECRET_HEADER = 'x-dms-app-secret';

@Injectable()
export class DmsIntegrationAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  issueToken(appId: string, appSecret: string): {
    app_id: string;
    access_token: string;
    token_type: string;
    expires_in: number;
  } {
    const payload = this.validateCredentials(appId, appSecret);
    const expiresIn = this.getTokenExpiresIn();

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getJwtSecret(),
      expiresIn,
    });

    return {
      app_id: payload.app_id,
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.parseExpiresInToSeconds(expiresIn),
    };
  }

  validateCredentials(appId: string, appSecret: string): DmsIntegrationTokenPayload {
    const configuredAppId = this.getRequiredConfig('DMS_INTEGRATION_APP_ID');
    const configuredSecret = this.getRequiredConfig('DMS_INTEGRATION_APP_SECRET');

    if (appId !== configuredAppId || appSecret !== configuredSecret) {
      throw new UnauthorizedException('Invalid DMS integration credentials');
    }

    return {
      sub: configuredAppId,
      app_id: configuredAppId,
      type: 'dms-integration',
    };
  }

  verifyToken(token: string): DmsIntegrationTokenPayload {
    try {
      const payload = this.jwtService.verify<DmsIntegrationTokenPayload>(token, {
        secret: this.getJwtSecret(),
      });

      if (payload.type !== 'dms-integration') {
        throw new UnauthorizedException('Invalid DMS integration token type');
      }

      const configuredAppId = this.getRequiredConfig('DMS_INTEGRATION_APP_ID');
      if (payload.app_id !== configuredAppId) {
        throw new UnauthorizedException('Invalid DMS integration app_id');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired DMS integration token');
    }
  }

  private getJwtSecret(): string {
    return this.getRequiredConfig('DMS_INTEGRATION_JWT_SECRET');
  }

  private getTokenExpiresIn(): string {
    return this.configService.get<string>('DMS_INTEGRATION_TOKEN_EXPIRES_IN', '24h');
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new UnauthorizedException(`${key} is not configured`);
    }

    return value;
  }

  private parseExpiresInToSeconds(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) {
      return 86400;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount;
      case 'm':
        return amount * 60;
      case 'h':
        return amount * 3600;
      case 'd':
        return amount * 86400;
      default:
        return 86400;
    }
  }
}
