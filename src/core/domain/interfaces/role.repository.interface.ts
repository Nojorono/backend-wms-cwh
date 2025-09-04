import { Role } from '../entities/role.entity';

export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: number): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(role: Partial<Role>): Promise<Role>;
  update(id: number, role: Partial<Role>): Promise<Role | null>;
  delete(id: number): Promise<boolean>;
}
