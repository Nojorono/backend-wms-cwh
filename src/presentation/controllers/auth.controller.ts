import { Controller, Post, Body, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../../infrastructure/services/auth.service';
import { LoginDto } from '../../core/application/dtos/auth/login.dto';
import { Public } from '../../core/decorators/public.decorator';
import { IPermissionRepository } from 'src/core/domain/interfaces/permission.repository.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const permissions = await this.permissionRepository.findMenuByRoleId(user.roleId);
    if (permissions.menus.length === 0) {
      throw new UnauthorizedException('User has no permissions');
    }
    const token = await this.authService.generateToken(user);
    return { token, user, menus: permissions.menus };
  }
}
