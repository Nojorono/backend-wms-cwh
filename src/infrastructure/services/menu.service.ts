import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import {
  IMenuRepository,
  MENU_REPOSITORY,
} from 'src/core/domain/interfaces/menu.repository.interface';
import { Menu } from '../../core/domain/entities/menu.entity';
import { CreateMenuDto } from '../../core/application/dtos/menu/create-menu.dto';
import { UpdateMenuDto } from '../../core/application/dtos/menu/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @Inject(MENU_REPOSITORY)
    private readonly menuRepository: IMenuRepository,
  ) {}

  async findAll(): Promise<Menu[]> {
    return this.menuRepository.findAll();
  }

  async findAllParent(): Promise<Menu[]> {
    return this.menuRepository.findAllParent();
  }

  async findById(id: number): Promise<Menu> {
    try {
      return await this.menuRepository.findById(id);
    } catch (error) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
  }

  async create(createMenuDto: CreateMenuDto): Promise<Menu> {
    try {
      const existingMenu = await this.menuRepository.findByPath(createMenuDto.path);
      if (existingMenu) {
        throw new ConflictException(`Menu with path ${createMenuDto.path} already exists`);
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      // If error is not found, it means the path is available
    }

    if (createMenuDto.parentId) {
      try {
        await this.menuRepository.findById(createMenuDto.parentId);
      } catch (error) {
        throw new NotFoundException(`Parent menu with ID ${createMenuDto.parentId} not found`);
      }
    }

    return this.menuRepository.create(createMenuDto);
  }

  async update(id: number, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    try {
      await this.menuRepository.findById(id);
    } catch (error) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    if (updateMenuDto.path) {
      try {
        const existingMenu = await this.menuRepository.findByPath(updateMenuDto.path);
        if (existingMenu && existingMenu.id !== id) {
          throw new ConflictException(`Menu with path ${updateMenuDto.path} already exists`);
        }
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
        // If error is not found, it means the path is available
      }
    }

    if (updateMenuDto.parentId) {
      try {
        await this.menuRepository.findById(updateMenuDto.parentId);
      } catch (error) {
        throw new NotFoundException(`Parent menu with ID ${updateMenuDto.parentId} not found`);
      }
    }

    return this.menuRepository.update(id, updateMenuDto);
  }

  async delete(id: number): Promise<void> {
    try {
      await this.menuRepository.findById(id);
    } catch (error) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    const children = await this.menuRepository.findChildren(id);
    if (children.length > 0) {
      throw new ConflictException('Cannot delete menu with children. Delete children first.');
    }

    await this.menuRepository.delete(id);
  }

  async findChildren(parentId: number): Promise<Menu[]> {
    try {
      await this.menuRepository.findById(parentId);
    } catch (error) {
      throw new NotFoundException(`Parent menu with ID ${parentId} not found`);
    }
    return this.menuRepository.findChildren(parentId);
  }
}
