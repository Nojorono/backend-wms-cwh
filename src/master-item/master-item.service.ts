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
import { ItemListIntegrationService, ItemListResponseDto } from './integration/item-list-integration.service';

@Injectable()
export class MasterItemService {
  constructor(
    private readonly repository: MasterItemRepository,
    private readonly itemListIntegrationService: ItemListIntegrationService,
  ) {}

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

  async createOrUpdateFromMetaOracle(item: any): Promise<MasterItem | null> {
    const existingItem = await this.repository.findByItemNumber(item.ITEM_NUMBER);
    if (existingItem) {
      return await this.repository.update(existingItem.id, {
        sku: item.ITEM_CODE,
        item_number: item.ITEM_NUMBER,
        description: item.ITEM_DESCRIPTION,
        inventory_item_id: item.INVENTORY_ITEM_ID,
      }) || null;
    } else {
      return await this.repository.create({
        sku: item.ITEM_CODE,
        item_number: item.ITEM_NUMBER,
        description: item.ITEM_DESCRIPTION,
        inventory_item_id: item.INVENTORY_ITEM_ID,
      });
    }
  }

  async syncFromMetaOracle(): Promise<ItemListResponseDto> {
    const itemLists = await this.itemListIntegrationService.getItemLists();

    if (itemLists.status) {
      for (const item of itemLists.data) {
        await this.createOrUpdateFromMetaOracle(item);
      }
    }

    return itemLists;
  }
}
