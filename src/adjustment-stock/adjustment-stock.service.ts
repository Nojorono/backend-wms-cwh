import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AdjustmentStockRepository } from './adjustment-stock.repository';
import { CreateAdjustmentStockDto } from './dto/create-adjustment-stock.dto';
import { UpdateAdjustmentStockDto } from './dto/update-adjustment-stock.dto';
import { AdjustmentStockPaginationDto } from './dto/adjustment-stock-pagination.dto';
import { AdjustmentStock } from '../core/domain/entities/adjustment_stock.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { PaginationService } from '../core/services/pagination.service';

@Injectable()
export class AdjustmentStockService {
  constructor(
    private readonly repository: AdjustmentStockRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createAdjustmentStockDto: CreateAdjustmentStockDto): Promise<AdjustmentStock> {
    const { code, items } = createAdjustmentStockDto;

    if (!items?.length) {
      throw new BadRequestException('At least one item is required');
    }

    for (const item of items) {
      if (!item.item_id) {
        throw new BadRequestException('Item ID is required for each line item');
      }
      if (item.quantity === undefined || item.quantity === null) {
        throw new BadRequestException('Quantity is required for each line item');
      }
    }

    // Generate code if not provided
    let finalCode: string;
    if (!code) {
      finalCode = await this.repository.getNextCode();
    } else {
      const existing = await this.repository.findByCode(code);
      if (existing) {
        throw new ConflictException(`Adjustment stock with code ${code} already exists`);
      }
      finalCode = code;
    }

    return await this.repository.create({
      ...createAdjustmentStockDto,
      code: finalCode,
    });
  }

  async findAll(): Promise<AdjustmentStock[]> {
    return await this.repository.findAll();
  }

  async findAllWithPagination(
    paginationDto: AdjustmentStockPaginationDto,
  ): Promise<PaginatedResponseDto<AdjustmentStock>> {
    const result = await this.repository.findAllWithFilters(paginationDto);

    return this.paginationService.createPaginatedResponse(
      result.data,
      paginationDto,
      result.total,
    );
  }

  async findOne(id: string): Promise<AdjustmentStock> {
    if (!id) {
      throw new BadRequestException('Adjustment stock ID is required');
    }

    const adjustmentStock = await this.repository.findOne(id);
    if (!adjustmentStock) {
      throw new NotFoundException(`Adjustment stock with ID ${id} not found`);
    }
    return adjustmentStock;
  }

  async findByPalletId(palletId: string): Promise<AdjustmentStock[]> {
    if (!palletId) {
      throw new BadRequestException('Pallet ID is required');
    }

    return await this.repository.findByPalletId(palletId);
  }

  async findByItemId(itemId: string): Promise<AdjustmentStock[]> {
    if (!itemId) {
      throw new BadRequestException('Item ID is required');
    }

    return await this.repository.findByItemId(itemId);
  }

  async findByCode(code: string): Promise<AdjustmentStock> {
    if (!code) {
      throw new BadRequestException('Code is required');
    }

    const adjustmentStock = await this.repository.findByCode(code);
    if (!adjustmentStock) {
      throw new NotFoundException(`Adjustment stock with code ${code} not found`);
    }
    return adjustmentStock;
  }

  async update(
    id: string,
    updateAdjustmentStockDto: UpdateAdjustmentStockDto,
  ): Promise<AdjustmentStock> {
    if (!id) {
      throw new BadRequestException('Adjustment stock ID is required');
    }

    // Check if adjustment stock exists
    await this.findOne(id);

    // If code is being updated, check for conflicts
    if (updateAdjustmentStockDto.code) {
      const existing = await this.repository.findByCode(updateAdjustmentStockDto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Adjustment stock with code ${updateAdjustmentStockDto.code} already exists`,
        );
      }
    }

    const updatedAdjustmentStock = await this.repository.update(id, updateAdjustmentStockDto);
    if (!updatedAdjustmentStock) {
      throw new NotFoundException(`Adjustment stock with ID ${id} not found`);
    }
    return updatedAdjustmentStock;
  }

  async remove(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('Adjustment stock ID is required');
    }

    await this.findOne(id);
    await this.repository.remove(id);
  }

  /**
   * Generate unique adjustment stock code
   * Format: ADJ-YYYY-XXXX
   * Example: ADJ-2025-0001
   */
  async generateCode(year?: number): Promise<string> {
    return await this.repository.getNextCode(year);
  }
}
