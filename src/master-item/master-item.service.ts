import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterItemRepository } from './master-item.repository';
import { CreateMasterItemDto } from './dto/create-master-item.dto';
import { UpdateMasterItemDto } from './dto/update-master-item.dto';
import { MasterItem } from '../core/domain/entities/master-item.entity';

@Injectable()
export class MasterItemService {
  constructor(private readonly repository: MasterItemRepository) {}

  async create(createMasterItemDto: CreateMasterItemDto): Promise<MasterItem> {
    const sku = createMasterItemDto.sku;
    if (!sku) {
      throw new BadRequestException('SKU is required');
    }
    const existingItem = await this.repository.findBySku(sku);
    if (existingItem) {
      throw new ConflictException(
        `Item with SKU ${createMasterItemDto.sku} already exists`,
      );
    }
    return await this.repository.create(createMasterItemDto);
  }

  async findAll(): Promise<MasterItem[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterItem> {
    const item = await this.repository.findOne(id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateMasterItemDto: UpdateMasterItemDto,
  ): Promise<MasterItem> {
    const item = await this.findOne(id);
    if (updateMasterItemDto.sku && updateMasterItemDto.sku !== item.sku) {
      const existingItem = await this.repository.findBySku(
        updateMasterItemDto.sku,
      );
      if (existingItem) {
        throw new ConflictException(
          `Item with SKU ${updateMasterItemDto.sku} already exists`,
        );
      }
    }
    const updatedItem = await this.repository.update(id, updateMasterItemDto);
    if (!updatedItem) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return updatedItem;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
