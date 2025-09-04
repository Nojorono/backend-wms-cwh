import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterItem } from '../core/domain/entities/master-item.entity';
import { CreateMasterItemDto } from './dto/create-master-item.dto';
import { UpdateMasterItemDto } from './dto/update-master-item.dto';

@Injectable()
export class MasterItemRepository {
  constructor(
    @InjectRepository(MasterItem)
    private readonly repository: Repository<MasterItem>,
  ) {}

  async create(createMasterItemDto: CreateMasterItemDto): Promise<MasterItem> {
    const item = this.repository.create(createMasterItemDto);
    return await this.repository.save(item);
  }

  async findAll(): Promise<MasterItem[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterItem | null> {
    const item = await this.repository.findOne({ where: { id } });
    if (!item) {
      return null;
    }
    return item;
  }

  async findByOrganizationId(
    organization_id: number,
  ): Promise<MasterItem | null> {
    const item = await this.repository.findOne({ where: { organization_id } });
    if (!item) {
      return null;
    }
    return item;
  }

  async findBySku(sku: string): Promise<MasterItem | null> {
    const item = await this.repository.findOne({ where: { sku } });
    if (!item) {
      return null;
    }
    return item;
  }

  async update(
    id: string,
    updateMasterItemDto: UpdateMasterItemDto,
  ): Promise<MasterItem | null> {
    const item = await this.findOne(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    await this.repository.update(id, updateMasterItemDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    await this.repository.delete(id);
  }
}
