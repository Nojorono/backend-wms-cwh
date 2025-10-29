import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IRoleRepository } from '../../core/domain/interfaces/role.repository.interface';
import { IPermissionRepository } from '../../core/domain/interfaces/permission.repository.interface';
import { Role } from '../../core/domain/entities/role.entity';
import { CreateRoleDto } from '../../core/application/dtos/role/create-role.dto';
import { UpdateRoleDto } from '../../core/application/dtos/role/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  private mapRoleWithMenuActions(role: Role): any {
    // Create a map of menus with their actions from permissions
    const menuMap = new Map<number, any>();

    // Process permissions to build menus with actions
    for (const permission of role.permissions || []) {
      if (permission.menu) {
        const menuId = permission.menu.id;

        if (!menuMap.has(menuId)) {
          // Initialize menu if not exists
          menuMap.set(menuId, {
            id: permission.menu.id,
            name: permission.menu.name,
            path: permission.menu.path,
            icon: permission.menu.icon,
            parentId: permission.menu.parentId,
            order: permission.menu.order,
            createdAt: permission.menu.createdAt,
            updatedAt: permission.menu.updatedAt,
            actions: [],
          });
        }

        // Add action to the menu
        menuMap.get(menuId).actions.push(permission.action);
      }
    }

    // Convert map to array
    const menus = Array.from(menuMap.values());

    // Return role with mapped menus
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      menus,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  async findAll(): Promise<any[]> {
    const roles = await this.roleRepository.findAll();
    return roles.map((role) => this.mapRoleWithMenuActions(role));
  }

  async findById(id: number): Promise<any> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return this.mapRoleWithMenuActions(role);
  }

  async findByName(name: string): Promise<any> {
    const role = await this.roleRepository.findByName(name);
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }
    return this.mapRoleWithMenuActions(role);
  }

  async create(createRoleDto: CreateRoleDto): Promise<any> {
    const existingRole = await this.roleRepository.findByName(createRoleDto.name);
    if (existingRole) {
      throw new ConflictException(`Role with name ${createRoleDto.name} already exists`);
    }

    // Create the role
    const role = await this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });

    // Create permissions for each menu
    if (createRoleDto.permissions?.length) {
      const menuIds = createRoleDto.permissions.map((p) => p.menu_id);

      // Create permissions
      for (const permission of createRoleDto.permissions) {
        await this.permissionRepository.create({
          action: permission.action,
          menuId: permission.menu_id,
          roleId: role.id,
        });
      }
    }

    return this.findById(role.id);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<any> {
    const role = await this.findById(id);

    // Update role basic info
    const updatedRole = await this.roleRepository.update(id, {
      name: updateRoleDto.name,
      description: updateRoleDto.description,
    });

    if (!updatedRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Update permissions if provided
    if (updateRoleDto.permissions?.length) {
      // Delete existing permissions
      await this.permissionRepository.deleteByRoleId(id);

      // Create new permissions
      for (const permission of updateRoleDto.permissions) {
        await this.permissionRepository.create({
          action: permission.action,
          menuId: permission.menu_id,
          roleId: id,
        });
      }
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.roleRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }
}
