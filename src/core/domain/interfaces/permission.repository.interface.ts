import { Menu } from '../entities/menu.entity';
import { Permission } from '../entities/permission.entity';

export interface IPermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: number): Promise<Permission | null>;
  findByRoleId(roleId: number): Promise<Permission[]>;
  findByMenuId(menuId: number): Promise<Permission[]>;
  findMenuByRoleId(roleId: number): Promise<{ menus: any[] }>;
  create(permission: Partial<Permission>): Promise<Permission>;
  update(id: number, permission: Partial<Permission>): Promise<Permission | null>;
  delete(id: number): Promise<boolean>;
  deleteByRoleId(roleId: number): Promise<boolean>;
}
