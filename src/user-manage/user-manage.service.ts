import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UserManageRepository } from './user-manage.repository';
import { CreateUserManageDto } from './dto/create-user-manage.dto';
import { UpdateUserManageDto } from './dto/update-user-manage.dto';
import { UserManagePaginationDto } from './dto/user-manage-pagination.dto';
import { UserManage } from '../core/domain/entities/user-manage.entity';

@Injectable()
export class UserManageService {
  constructor(private readonly repository: UserManageRepository) {}

  async create(createUserManageDto: CreateUserManageDto): Promise<UserManage> {
    const { phone } = createUserManageDto;
    
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    // Check if user with this phone already exists
    const existingUser = await this.repository.findByPhone(phone);
    if (existingUser) {
      throw new ConflictException(`User with phone number ${phone} already exists`);
    }

    return await this.repository.create(createUserManageDto);
  }

  async findAll(): Promise<UserManage[]> {
    return await this.repository.findAll();
  }

  async findAllWithPagination(paginationDto: UserManagePaginationDto): Promise<{
    data: UserManage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.findAllWithFilters(paginationDto);
    
    return {
      ...result,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  async findOne(id: string): Promise<UserManage> {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.repository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserManageDto: UpdateUserManageDto): Promise<UserManage> {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    // Check if user exists
    await this.findOne(id);

    // If phone is being updated, check for conflicts
    if (updateUserManageDto.phone) {
      const existingUser = await this.repository.findByPhone(updateUserManageDto.phone);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`User with phone number ${updateUserManageDto.phone} already exists`);
      }
    }

    const updatedUser = await this.repository.update(id, updateUserManageDto);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('User ID is required');
    }

    await this.findOne(id);
    await this.repository.remove(id);
  }

  async findByPhone(phone: string): Promise<UserManage> {
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    const user = await this.repository.findByPhone(phone);
    if (!user) {
      throw new NotFoundException(`User with phone number ${phone} not found`);
    }
    return user;
  }
}
