import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Btb } from '../core/domain/entities/btb.entity';
import { PaginationService } from '../core/services/pagination.service';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { BtbRepository } from './btb.repository';
import { CreateBtbDto } from './dto/create-btb.dto';
import { UpdateBtbDto } from './dto/update-btb.dto';
import { BtbPaginationQueryDto } from './dto/btb-pagination.dto';

@Injectable()
export class BtbService {
  constructor(
    private readonly repository: BtbRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async create(dto: CreateBtbDto): Promise<Btb> {
    const existing = await this.repository.findByBtbNumber(dto.btb_number);
    if (existing) {
      throw new ConflictException(`BTB number ${dto.btb_number} already exists`);
    }
    return await this.repository.create(dto);
  }

  async findAllPaginated(
    query: BtbPaginationQueryDto,
  ): Promise<PaginatedResponseDto<Btb>> {
    const { data, total } = await this.repository.findAllPaginated(query);
    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<Btb> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`BTB with ID ${id} not found`);
    }
    return entity;
  }

  async findByBtbNumber(btbNumber: string): Promise<Btb> {
    const entity = await this.repository.findByBtbNumber(btbNumber);
    if (!entity) {
      throw new NotFoundException(`BTB with number ${btbNumber} not found`);
    }
    return entity;
  }

  async update(id: string, dto: UpdateBtbDto): Promise<Btb> {
    if (dto.btb_number) {
      const existing = await this.repository.findByBtbNumber(dto.btb_number);
      if (existing && existing.id !== id) {
        throw new ConflictException(`BTB number ${dto.btb_number} already exists`);
      }
    }
    return await this.repository.update(id, dto);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.repository.remove(id);
    return { success: true, message: 'BTB deleted' };
  }

  async removeDetail(
    btbId: string,
    detailId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.findOne(btbId);
    await this.repository.removeDetail(btbId, detailId);
    return { success: true, message: 'BTB detail deleted' };
  }
}
