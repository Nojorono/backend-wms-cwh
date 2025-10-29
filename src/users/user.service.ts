import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.repository.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException(`User with username ${createUserDto.username} already exists`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.password = hashedPassword;

    const user = await this.repository.create(createUserDto);

    if (
      createUserDto.employeeId ||
      createUserDto.email ||
      createUserDto.phone ||
      createUserDto.organizationId
    ) {
      const userDetail = this.userDetailRepository.create({
        userId: user.username,
        employee_id: createUserDto.employeeId || `EMP_${user.username}`,
        email: createUserDto.email || `${user.username}@default.com`,
        phone: createUserDto.phone || '0000000000',
        organizationId: createUserDto.organizationId,
      });

      const savedUserDetail = await this.userDetailRepository.save(userDetail);

      user.userDetailId = savedUserDetail.id;
      await this.repository.updateUserDetailId(user.id, savedUserDetail.id);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    return await this.repository.findAll();
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

    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto.password = hashedPassword;
    }

    const updatedUser = await this.repository.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (
      updateUserDto.employeeId ||
      updateUserDto.email ||
      updateUserDto.phone ||
      updateUserDto.organizationId
    ) {
      if (user.userDetailId) {
        await this.userDetailRepository.update(user.userDetailId, {
          employee_id: updateUserDto.employeeId,
          email: updateUserDto.email,
          phone: updateUserDto.phone,
          organizationId: updateUserDto.organizationId,
        });
      } else {
        const userDetail = this.userDetailRepository.create({
          userId: user.username,
          employee_id: updateUserDto.employeeId || `EMP_${user.username}`,
          email: updateUserDto.email || `${user.username}@default.com`,
          phone: updateUserDto.phone || '0000000000',
          organizationId: updateUserDto.organizationId,
        });

        const savedUserDetail = await this.userDetailRepository.save(userDetail);
        await this.repository.updateUserDetailId(id, savedUserDetail.id);
      }
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    if (user.userDetailId) {
      await this.userDetailRepository.softDelete(user.userDetailId);
    }

    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<User> {
    const user = await this.findOneWithDeleted(id);

    if (!user.deletedAt) {
      throw new ConflictException(`User with ID ${id} is not deleted`);
    }

    await this.repository.restore(id);

    if (user.userDetailId) {
      await this.userDetailRepository.restore(user.userDetailId);
    }

    return await this.findOne(id);
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.findOneWithDeleted(id);

    if (user.userDetailId) {
      await this.userDetailRepository.delete(user.userDetailId);
    }

    await this.repository.hardDelete(id);
  }
}
