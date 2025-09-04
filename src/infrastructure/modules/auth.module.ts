import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { AuthService } from '../services/auth.service';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../core/domain/entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { Permission } from 'src/core/domain/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Permission]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IPermissionRepository',
      useClass: PermissionRepository,
    },
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
