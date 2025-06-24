import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../core/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const organizationId = createUserDto.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    const existingUser = await this.repository.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException(`User with username ${createUserDto.username} already exists`);
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.password = hashedPassword;
    return await this.repository.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.findOne(id);
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
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
