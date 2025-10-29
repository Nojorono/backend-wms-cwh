import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserManage } from '../core/domain/entities/user-manage.entity';
import { CreateUserManageDto } from './dto/create-user-manage.dto';
import { UpdateUserManageDto } from './dto/update-user-manage.dto';
import { IUserManageRepository } from '../core/domain/interfaces/user-manage.repository.interface';

@Injectable()
export class UserManageRepository implements IUserManageRepository {
  constructor(
    @InjectRepository(UserManage)
    private readonly repository: Repository<UserManage>,
  ) {}

  async create(createUserManageDto: CreateUserManageDto): Promise<UserManage> {
    const userManage = this.repository.create(createUserManageDto);
    return await this.repository.save(userManage);
  }

  async findAll(): Promise<UserManage[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithFilters(filters: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: UserManage[]; total: number; page: number; limit: number }> {
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const queryBuilder = this.repository.createQueryBuilder('userManage');

    if (search) {
      queryBuilder.where(
        '(userManage.name ILIKE :search OR userManage.phone ILIKE :search OR userManage.roleName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy(`userManage.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<UserManage | null> {
    const userManage = await this.repository.findOne({ where: { id } });
    if (!userManage) {
      return null;
    }
    return userManage;
  }

  async findByPhone(phone: string): Promise<UserManage | null> {
    const userManage = await this.repository.findOne({ where: { phone } });
    if (!userManage) {
      return null;
    }
    return userManage;
  }

  async update(id: string, updateUserManageDto: UpdateUserManageDto): Promise<UserManage | null> {
    const userManage = await this.findOne(id);
    if (!userManage) {
      throw new NotFoundException('User not found');
    }
    await this.repository.update(id, updateUserManageDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const userManage = await this.findOne(id);
    if (!userManage) {
      throw new NotFoundException('User not found');
    }
    await this.repository.softDelete(id);
  }
}
