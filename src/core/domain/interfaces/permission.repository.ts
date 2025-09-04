import { Permission } from '../entities/permission.entity';

export interface IPermissionRepository {
  findById(id: string): Promise<Permission | null>;
  create(permission: Partial<Permission>): Promise<Permission>;
  update(id: string, permission: Partial<Permission>): Promise<Permission>;
  delete(id: string): Promise<void>;
}
