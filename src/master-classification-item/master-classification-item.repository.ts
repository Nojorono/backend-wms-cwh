import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterClassificationItem } from '../core/domain/entities/master-classification-item.entity';
import { CreateMasterClassificationItemDto } from './dto/create-master-classification-item.dto';
import { UpdateMasterClassificationItemDto } from './dto/update-master-classification-item.dto';

@Injectable()
export class MasterClassificationItemRepository {
  constructor(
    @InjectRepository(MasterClassificationItem)
    private readonly repository: Repository<MasterClassificationItem>,
  ) {}

  async create(createMasterClassificationItemDto: CreateMasterClassificationItemDto): Promise<MasterClassificationItem> {
    const classificationItem = this.repository.create(createMasterClassificationItemDto);
    return await this.repository.save(classificationItem);
  }

  async findAll(): Promise<MasterClassificationItem[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<MasterClassificationItem | null> {
    const classificationItem = await this.repository.findOne({ where: { id } });
    if (!classificationItem) {
      return null;
    }
    return classificationItem;
  }

  async findByCode(classification_code: string): Promise<MasterClassificationItem | null> {
    const classificationItem = await this.repository.findOne({ where: { classification_code } });
    if (!classificationItem) {
      return null;
    }
    return classificationItem;
  }

  async update(id: string, updateMasterClassificationItemDto: UpdateMasterClassificationItemDto): Promise<MasterClassificationItem | null> {
    const classificationItem = await this.findOne(id);
    if (!classificationItem) {
      throw new NotFoundException('Classification Item not found');
    }
    await this.repository.update(id, updateMasterClassificationItemDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const classificationItem = await this.findOne(id);
    if (!classificationItem) {
      throw new NotFoundException('Classification Item not found');
    }
    await this.repository.delete(id);
  }
}
