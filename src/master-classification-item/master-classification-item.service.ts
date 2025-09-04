import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { MasterClassificationItemRepository } from './master-classification-item.repository';
import { CreateMasterClassificationItemDto } from './dto/create-master-classification-item.dto';
import { UpdateMasterClassificationItemDto } from './dto/update-master-classification-item.dto';
import { MasterClassificationItem } from '../core/domain/entities/master-classification-item.entity';

@Injectable()
export class MasterClassificationItemService {
  constructor(
    private readonly repository: MasterClassificationItemRepository,
  ) {}

  async create(
    createMasterClassificationItemDto: CreateMasterClassificationItemDto,
  ): Promise<MasterClassificationItem> {
    const classification_code =
      createMasterClassificationItemDto.classification_code;
    if (!classification_code) {
      throw new BadRequestException('Classification Code is required');
    }
    const existingClassificationItem =
      await this.repository.findByCode(classification_code);
    if (existingClassificationItem) {
      throw new ConflictException(
        `Classification Item with Code ${classification_code} already exists`,
      );
    }
    return await this.repository.create(createMasterClassificationItemDto);
  }

  async findAll(): Promise<MasterClassificationItem[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<MasterClassificationItem> {
    const classificationItem = await this.repository.findOne(id);
    if (!classificationItem) {
      throw new NotFoundException(
        `Classification Item with ID ${id} not found`,
      );
    }
    return classificationItem;
  }

  async update(
    id: string,
    updateMasterClassificationItemDto: UpdateMasterClassificationItemDto,
  ): Promise<MasterClassificationItem> {
    const classificationItem = await this.findOne(id);
    if (
      updateMasterClassificationItemDto.classification_code &&
      updateMasterClassificationItemDto.classification_code !==
        classificationItem.classification_code
    ) {
      const existingClassificationItem = await this.repository.findByCode(
        updateMasterClassificationItemDto.classification_code,
      );
      if (existingClassificationItem) {
        throw new ConflictException(
          `Classification Item with Code ${updateMasterClassificationItemDto.classification_code} already exists`,
        );
      }
    }

    const updatedClassificationItem = await this.repository.update(
      id,
      updateMasterClassificationItemDto,
    );
    if (!updatedClassificationItem) {
      throw new NotFoundException(
        `Classification Item with ID ${id} not found`,
      );
    }
    return updatedClassificationItem;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
