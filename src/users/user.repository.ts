import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../core/domain/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.repository.create(createUserDto);
    return await this.repository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.find();
  }

  async findAllWithDeleted(): Promise<User[]> {
    return await this.repository.find({ withDeleted: true });
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { username } });
    if (!user) {
      return null;
    }
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      return null;
    }
    return user;
  }

  async findOneWithDeleted(id: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { id }, withDeleted: true });
    if (!user) {
      return null;
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.repository.update(id, updateUserDto);
    return await this.findOne(id);
  }

  async updateUserDetailId(id: string, userDetailId: string): Promise<void> {
    await this.repository.update(id, { userDetailId });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.repository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.findOneWithDeleted(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.repository.delete(id);
  }
}
