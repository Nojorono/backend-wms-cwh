import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../core/domain/entities/role.entity';
import { Permission } from '../../core/domain/entities/permission.entity';
import { RoleController } from '../../presentation/controllers/role.controller';
import { RoleService } from '../services/role.service';
import { PermissionService } from '../services/permission.service';
import { RoleRepository } from '../repositories/role.repository';
import { PermissionRepository } from '../repositories/permission.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  controllers: [RoleController],
  providers: [
    RoleService,
    PermissionService,
    {
      provide: 'IRoleRepository',
      useClass: RoleRepository,
    },
    {
      provide: 'IPermissionRepository',
      useClass: PermissionRepository,
    },
  ],
  exports: [RoleService, PermissionService],
})
export class RolePermissionModule {} 