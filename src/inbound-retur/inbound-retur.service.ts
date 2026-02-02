import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InboundReturRepository } from './inbound-retur.repository';
import { CreateInboundReturDto } from './dto/create-inbound-retur.dto';
import { UpdateInboundReturDto, UpdateInboundReturStatusDto } from './dto/update-inbound-retur.dto';
import { InboundReturPaginationQueryDto } from './dto/inbound-retur-pagination.dto';
import { InboundRetur, InboundReturStatus } from '../core/domain/entities/inbound-retur.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';
import { CreateInboundReturHelperDto } from './dto/create-inbound-retur-helper.dto';
import { InboundReturHelper } from 'src/core/domain/entities/inbound-retur-helper.entity';
import { CreateInboundReturSortingDto } from './dto/create-inbound-retur-sorting.dto';
import { InboundReturSorting } from 'src/core/domain/entities/inbound-retur-sorting.entity';
import { UpdateInboundReturSortingDto } from './dto/update-inbound-retur-sorting.dto';

@Injectable()
export class InboundReturService {
  constructor(
    private readonly repository: InboundReturRepository,
    private readonly paginationService: PaginationService,
  ) { }

  async create(payload: CreateInboundReturDto): Promise<InboundRetur> {
    try {
      const inbound_retur_number = await this.repository.getNextInboundReturNumber();
      return await this.repository.create({
        ...payload,
        inbound_retur_number,
        status: payload.status ?? InboundReturStatus.CREATED,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create inbound retur: ${message}`);
    }
  }

  async findAll(status?: string): Promise<InboundRetur[]> {
    return await this.repository.findAll(status);
  }

  async findAllPaginated(
    query: InboundReturPaginationQueryDto,
  ): Promise<PaginatedResponseDto<InboundRetur>> {
    const { data, total } = await this.repository.findAllPaginated(
      { status: query.status },
      query.page ?? 1,
      query.limit ?? 10,
      query.search,
      query.sortBy ?? 'createdAt',
      (query.sortOrder as 'ASC' | 'DESC') ?? 'DESC',
    );
    return this.paginationService.createPaginatedResponse(data, query, total);
  }

  async findOne(id: string): Promise<InboundRetur> {
    const found = await this.repository.findOne(id);
    if (!found) throw new NotFoundException('Inbound retur not found');
    return found;
  }

  async update(id: string, payload: UpdateInboundReturDto): Promise<InboundRetur> {
    try {
      await this.findOne(id);
      return await this.repository.update(id, payload);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update inbound retur: ${message}`);
    }
  }

  async updateStatus(id: string, payload: UpdateInboundReturStatusDto): Promise<InboundRetur> {
    await this.findOne(id);
    await this.repository.update(id, { status: payload.status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }

  async createHelpers(payload: CreateInboundReturHelperDto): Promise<InboundReturHelper> {
    return await this.repository.createHelpers(payload);
  }

  async deleteHelper(id: string): Promise<void> {
    return await this.repository.deleteHelper(id);
  }

  async createSorting(payload: CreateInboundReturSortingDto[]): Promise<InboundReturSorting[]> {
    return await this.repository.createSorting(payload);
  }

  async updateSorting(id: string, payload: UpdateInboundReturSortingDto): Promise<InboundReturSorting> {
    try {
      return await this.repository.updateSorting(id, payload);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update inbound retur sorting: ${message}`);
    }
  }

  async deleteSorting(id: string): Promise<void> {
    try {
      return await this.repository.deleteSorting(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete inbound retur sorting: ${message}`);
    }
  }
}
