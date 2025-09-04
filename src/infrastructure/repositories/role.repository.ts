import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../core/domain/entities/role.entity';
import { IRoleRepository } from '../../core/domain/interfaces/role.repository.interface';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly repository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.repository.find({
      relations: ['permissions', 'permissions.menu'],
    });
  }

  async findById(id: number): Promise<Role | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['permissions', 'permissions.menu'],
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repository.findOne({
      where: { name },
      relations: ['permissions', 'permissions.menu'],
    });
  }

  async create(role: Partial<Role>): Promise<Role> {
    const newRole = this.repository.create(role);
    return this.repository.save(newRole);
  }

  async update(id: number, role: Partial<Role>): Promise<Role | null> {
    await this.repository.update(id, role);
    return this.findById(id);
  }

  async delete(id: number): Promise<any> {
    const result = await this.repository.delete(id);
    return result;
  }
}
