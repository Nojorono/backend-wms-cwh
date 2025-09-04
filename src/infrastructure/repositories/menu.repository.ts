import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Menu } from '../../core/domain/entities/menu.entity';
import { IMenuRepository } from 'src/core/domain/interfaces/menu.repository.interface';

@Injectable()
export class MenuRepository implements IMenuRepository {
  constructor(
    @InjectRepository(Menu)
    private readonly repository: Repository<Menu>,
  ) {}

  async findAllParent(): Promise<Menu[]> {
    return this.repository.find({
      where: { parentId: IsNull() },
      order: { order: 'ASC' },
    });
  }

  async findAll(): Promise<Menu[]> {
    return this.repository.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { order: 'ASC' },
    });
  }

  async findById(id: number): Promise<Menu> {
    const menu = await this.repository.findOne({
      where: { id },
      relations: ['children'],
    });
    if (!menu) {
      throw new Error(`Menu with ID ${id} not found`);
    }
    return menu;
  }

  async findByPath(path: string): Promise<Menu> {
    const menu = await this.repository.findOne({
      where: { path },
      relations: ['children'],
    });
    if (!menu) {
      throw new Error(`Menu with path ${path} not found`);
    }
    return menu;
  }

  async create(menu: Partial<Menu>): Promise<Menu> {
    const newMenu = this.repository.create(menu);
    return this.repository.save(newMenu);
  }

  async update(id: number, menu: Partial<Menu>): Promise<Menu> {
    await this.repository.update(id, menu);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findChildren(parentId: number): Promise<Menu[]> {
    return this.repository.find({
      where: { parentId },
      relations: ['children'],
      order: { order: 'ASC' },
    });
  }
}
