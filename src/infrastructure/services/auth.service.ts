import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAuthService } from '../../core/domain/interfaces/auth.service.interface';
import { IUserRepository } from '../../core/domain/interfaces/user.repository.interface';
import { User } from '../../core/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      return null;
    }
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      roleId: user.roleId,
      organizationId: user.userDetail?.organizationId ?? null,
      type: 'access',
    };
    console.log(payload);
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      username: user.username,
      roleId: user.roleId,
      organizationId: user.userDetail?.organizationId ?? null,
      type: 'refresh',
    };
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    return this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    });
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateToken(user),
      this.generateRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.generateTokens(user);
  }
}
