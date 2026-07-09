import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../core/domain/entities/user.entity';
import { UserDetail } from '../core/domain/entities/user-detail.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    @InjectRepository(UserDetail)
    private readonly userDetailRepository: Repository<UserDetail>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check for existing user including soft-deleted ones
    const existingUser = await this.repository.findByUsername(createUserDto.username, true);
    if (existingUser) {
      throw new ConflictException(`User with username ${createUserDto.username} already exists`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.password = hashedPassword;

    const willCreateUserDetail =
      createUserDto.employeeId ||
      createUserDto.email ||
      createUserDto.phone ||
      createUserDto.organizationId ||
      createUserDto.firstName ||
      createUserDto.lastName ||
      createUserDto.departementId;

    const resolvedEmployeeId =
      createUserDto.employeeId?.trim() || `EMP_${createUserDto.username}`;

    if (willCreateUserDetail) {
      await this.ensureEmployeeIdIsUnique(resolvedEmployeeId);
    }

    try {
      const user = await this.repository.create(createUserDto);

      if (willCreateUserDetail) {
        const normalizedWarehouseSubId =
          createUserDto.warehouseSubId === null ? undefined : createUserDto.warehouseSubId;

        const userDetail = this.userDetailRepository.create({
          userId: user.id,
          employee_id: resolvedEmployeeId,
          email: createUserDto.email || `${user.username}@default.com`,
          phone: createUserDto.phone || '0000000000',
          organizationId: createUserDto.organizationId,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          warehouse_sub_id: normalizedWarehouseSubId,
          departementId: createUserDto.departementId,
        });

        await this.userDetailRepository.save(userDetail);
      }

      // Reload user with relationships
      return await this.findOne(user.id);
    } catch (error) {
      // Handle database constraint violations (e.g., duplicate username)
      if (error instanceof QueryFailedError) {
        const pgError = error as any;
        if (pgError.code === '23505') {
          // Unique constraint violation
          if (pgError.constraint === 'users_username_key' || pgError.detail?.includes('username')) {
            throw new ConflictException(`User with username ${createUserDto.username} already exists`);
          }
          if (pgError.detail?.includes('employee_id')) {
            throw new ConflictException(`User with employee_id ${resolvedEmployeeId} already exists`);
          }
        }
      }
      // Re-throw if it's not a constraint violation we can handle
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return await this.repository.findAll();
  }

  async findAllByOrganizationId(
    organizationId: string,
    departementId?: string,
  ): Promise<User[]> {
    return await this.repository.findAllByOrganizationId(organizationId, departementId);
  }

  async findAllWithDeleted(): Promise<User[]> {
    return await this.repository.findAllWithDeleted();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneWithDeleted(id: string): Promise<User> {
    const user = await this.repository.findOneWithDeleted(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.repository.findByUsername(updateUserDto.username);
      if (existingUser) {
        throw new ConflictException(`User with username ${updateUserDto.username} already exists`);
      }
    }

    // Extract only User entity fields (exclude UserDetail fields)
    const userUpdateData: Partial<UpdateUserDto> = {};
    if (updateUserDto.username !== undefined) userUpdateData.username = updateUserDto.username;
    if (updateUserDto.password !== undefined) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      userUpdateData.password = hashedPassword;
    }
    if (updateUserDto.isActive !== undefined) userUpdateData.isActive = updateUserDto.isActive;
    if (updateUserDto.roleId !== undefined) userUpdateData.roleId = updateUserDto.roleId;

    // Only update User entity if there are User fields to update
    if (Object.keys(userUpdateData).length > 0) {
      const updatedUser = await this.repository.update(id, userUpdateData);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    }

    // Handle UserDetail fields separately
    if (
      updateUserDto.employeeId !== undefined ||
      updateUserDto.email !== undefined ||
      updateUserDto.phone !== undefined ||
      updateUserDto.organizationId !== undefined ||
      updateUserDto.firstName !== undefined ||
      updateUserDto.lastName !== undefined ||
      updateUserDto.warehouseSubId !== undefined ||
      updateUserDto.departementId !== undefined
    ) {
      const userDetailUpdateData: Partial<UserDetail> = {};
      if (updateUserDto.employeeId !== undefined) {
        const employeeId = updateUserDto.employeeId?.trim();
        if (employeeId) {
          await this.ensureEmployeeIdIsUnique(employeeId, user.id);
        }
        userDetailUpdateData.employee_id = updateUserDto.employeeId;
      }
      if (updateUserDto.email !== undefined) userDetailUpdateData.email = updateUserDto.email;
      if (updateUserDto.phone !== undefined) userDetailUpdateData.phone = updateUserDto.phone;
      if (updateUserDto.organizationId !== undefined) userDetailUpdateData.organizationId = updateUserDto.organizationId;
      if (updateUserDto.firstName !== undefined) userDetailUpdateData.firstName = updateUserDto.firstName;
      if (updateUserDto.lastName !== undefined) userDetailUpdateData.lastName = updateUserDto.lastName;
      const normalizedWarehouseSubId =
        updateUserDto.warehouseSubId === '' || updateUserDto.warehouseSubId === null
          ? undefined
          : updateUserDto.warehouseSubId;
      if (updateUserDto.warehouseSubId !== undefined) {
        userDetailUpdateData.warehouse_sub_id = (normalizedWarehouseSubId ?? null) as any;
      }
      if (updateUserDto.departementId !== undefined) {
        userDetailUpdateData.departementId = (
          updateUserDto.departementId === '' || updateUserDto.departementId === null
            ? null
            : updateUserDto.departementId
        ) as UserDetail['departementId'];
      }

      let userDetail = await this.userDetailRepository.findOne({ where: { userId: user.id } });
      if (!userDetail) {
        userDetail = this.userDetailRepository.create({
          userId: user.id,
          employee_id: updateUserDto.employeeId,
          email: updateUserDto.email,
          phone: updateUserDto.phone,
          organizationId: updateUserDto.organizationId,
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
          warehouse_sub_id: normalizedWarehouseSubId,
          departementId: updateUserDto.departementId,
        });
        await this.userDetailRepository.save(userDetail);
      } else {
        await this.userDetailRepository.update(userDetail.id, userDetailUpdateData);
      }
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    if (user.userDetail) {
      await this.userDetailRepository.softDelete(user.userDetail.id);
    }

    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<User> {
    const user = await this.findOneWithDeleted(id);

    if (!user.deletedAt) {
      throw new ConflictException(`User with ID ${id} is not deleted`);
    }

    await this.repository.restore(id);

    if (user.userDetail) {
      await this.userDetailRepository.restore(user.userDetail.id);
    }

    return await this.findOne(id);
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.findOneWithDeleted(id);

    if (user.userDetail) {
      await this.userDetailRepository.delete(user.userDetail.id);
    }

    await this.repository.hardDelete(id);
  }

  private async ensureEmployeeIdIsUnique(
    employeeId: string,
    excludeUserId?: string,
  ): Promise<void> {
    const normalizedEmployeeId = employeeId?.trim();
    if (!normalizedEmployeeId) {
      return;
    }

    const queryBuilder = this.userDetailRepository
      .createQueryBuilder('userDetail')
      .where('UPPER(TRIM(userDetail.employee_id)) = UPPER(TRIM(:employeeId))', {
        employeeId: normalizedEmployeeId,
      });

    if (excludeUserId) {
      queryBuilder.andWhere('userDetail.userId <> :excludeUserId', { excludeUserId });
    }

    const existing = await queryBuilder.getOne();
    if (existing) {
      throw new ConflictException(
        `User with employee_id ${normalizedEmployeeId} already exists`,
      );
    }
  }
}
