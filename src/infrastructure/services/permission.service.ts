import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IPermissionRepository } from '../../core/domain/interfaces/permission.repository.interface';
import { Permission } from '../../core/domain/entities/permission.entity';
import { PermissionDto } from '../../core/application/dtos/permission/create-permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }

  async findById(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async findByRoleId(roleId: number): Promise<Permission[]> {
    return this.permissionRepository.findByRoleId(roleId);
  }

  async findByMenuId(menuId: number): Promise<Permission[]> {
    return this.permissionRepository.findByMenuId(menuId);
  }

  async create(createPermissionDto: PermissionDto): Promise<Permission> {
    return this.permissionRepository.create(createPermissionDto);
  }

  async update(id: number, updatePermissionDto: Partial<PermissionDto>): Promise<Permission> {
    const permission = await this.permissionRepository.update(id, updatePermissionDto);
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.permissionRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
  }

  async deleteByRoleId(roleId: number): Promise<void> {
    const deleted = await this.permissionRepository.deleteByRoleId(roleId);
    if (!deleted) {
      throw new NotFoundException(`No permissions found for role ID ${roleId}`);
    }
  }
}
