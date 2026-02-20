import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdjustmentStockService } from './adjustment-stock.service';
import { CreateAdjustmentStockDto } from './dto/create-adjustment-stock.dto';
import { UpdateAdjustmentStockDto } from './dto/update-adjustment-stock.dto';
import { AdjustmentStockPaginationDto } from './dto/adjustment-stock-pagination.dto';
import { AdjustmentStock } from '../core/domain/entities/adjustment_stock.entity';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';

@ApiTags('Adjustment Stock')
@Controller('adjustment-stock')
@ApiBearerAuth('JWT-auth')
export class AdjustmentStockController {
  constructor(private readonly adjustmentStockService: AdjustmentStockService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new stock adjustment' })
  @ApiResponse({
    status: 201,
    description: 'The stock adjustment has been successfully created.',
    type: AdjustmentStock,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data.',
  })
  @ApiResponse({
    status: 409,
    description: 'Adjustment stock with this code already exists.',
  })
  create(@Body() createAdjustmentStockDto: CreateAdjustmentStockDto) {
    return this.adjustmentStockService.create(createAdjustmentStockDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stock adjustments or search with pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for code, document, or notes' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by adjustment type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by approval status' })
  @ApiQuery({ name: 'is_inventory', required: false, description: 'Filter by inventory type' })
  @ApiQuery({ name: 'pallet_id', required: false, description: 'Filter by pallet ID' })
  @ApiQuery({ name: 'item_id', required: false, description: 'Filter by item ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Return all stock adjustments or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/AdjustmentStock' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@Query() paginationDto: AdjustmentStockPaginationDto) {
    // Check if any pagination or filter parameters are provided
    const hasParams =
      paginationDto.search ||
      paginationDto.type ||
      paginationDto.status ||
      paginationDto.is_inventory ||
      paginationDto.pallet_id ||
      paginationDto.item_id ||
      paginationDto.page ||
      paginationDto.limit ||
      paginationDto.sortBy ||
      paginationDto.sortOrder;

    if (hasParams) {
      return this.adjustmentStockService.findAllWithPagination(paginationDto);
    }

    return this.adjustmentStockService.findAll();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all stock adjustments (alternative endpoint)' })
  @ApiResponse({
    status: 200,
    description: 'Return all stock adjustments.',
    type: [AdjustmentStock],
  })
  findAllAdjustments() {
    return this.adjustmentStockService.findAll();
  }

  @Get('pallet/:palletId')
  @ApiOperation({ summary: 'Get all stock adjustments by pallet ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all stock adjustments for the pallet.',
    type: [AdjustmentStock],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid pallet ID.',
  })
  findByPalletId(@Param('palletId') palletId: string) {
    return this.adjustmentStockService.findByPalletId(palletId);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get all stock adjustments by item ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all stock adjustments for the item.',
    type: [AdjustmentStock],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid item ID.',
  })
  findByItemId(@Param('itemId') itemId: string) {
    return this.adjustmentStockService.findByItemId(itemId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a stock adjustment by code' })
  @ApiResponse({
    status: 200,
    description: 'Return the stock adjustment.',
    type: AdjustmentStock,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid code.',
  })
  @ApiResponse({
    status: 404,
    description: 'Stock adjustment not found.',
  })
  findByCode(@Param('code') code: string) {
    return this.adjustmentStockService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stock adjustment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the stock adjustment.',
    type: AdjustmentStock,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid adjustment stock ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Stock adjustment not found.',
  })
  findOne(@Param('id') id: string) {
    return this.adjustmentStockService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a stock adjustment' })
  @ApiResponse({
    status: 200,
    description: 'The stock adjustment has been successfully updated.',
    type: AdjustmentStock,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data or adjustment stock ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Stock adjustment not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Adjustment stock with this code already exists.',
  })
  update(
    @Param('id') id: string,
    @Body() updateAdjustmentStockDto: UpdateAdjustmentStockDto,
  ) {
    return this.adjustmentStockService.update(id, updateAdjustmentStockDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a stock adjustment (soft delete)' })
  @ApiResponse({
    status: 204,
    description: 'The stock adjustment has been successfully deleted.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid adjustment stock ID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Stock adjustment not found.',
  })
  remove(@Param('id') id: string) {
    return this.adjustmentStockService.remove(id);
  }
}
