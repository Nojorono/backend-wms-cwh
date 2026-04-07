import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExtraModels, ApiBody } from '@nestjs/swagger';
import { MasterPalletService } from './master-pallet.service';
import { CreateMasterPalletDto } from './dto/create-master-pallet.dto';
import { GeneratePalletRangeDto } from './dto/generate-pallet-range.dto';
import { UpdateMasterPalletDto } from './dto/update-master-pallet.dto';
import {
  PalletQuantityHistoryResponseDto,
  PalletCapacityValidationDto,
  PalletItemQuantityDto,
  UpdatePalletQuantityDto,
  UpdatePalletItemStockDto,
  UpdateProductionDateDto,
  UpdateUOMDto,
} from './dto/pallet-quantity.dto';
import { MasterPallet } from '../core/domain/entities/master-pallet.entity';
import { PalletHistoryPaginationDto } from './dto/pallet-history-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import { PaginatedResponseDto } from '../core/dto/pagination.dto';
import { QuantityOperationType } from '../core/domain/entities/transaction-pallet-history.entity';

@ApiTags('Master Pallet')
@Controller('master-pallet')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(PalletQuantityHistoryResponseDto, PaginatedResponseDto, UpdatePalletItemStockDto)
export class MasterPalletController {
  constructor(private readonly masterPalletService: MasterPalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new UOM' })
  @ApiResponse({
    status: 201,
    description: 'The Pallet has been successfully created.',
    type: MasterPallet,
  })
  @ApiResponse({
    status: 409,
    description: 'Pallet with this code already exists.',
  })
  create(@Body() createMasterPalletDto: CreateMasterPalletDto) {
    return this.masterPalletService.create(createMasterPalletDto);
  }

  @Post('generate-range')
  @ApiOperation({ summary: 'Generate pallet data by numeric range (e.g. PAL-0001 to PAL-1000)' })
  @ApiResponse({
    status: 201,
    description: 'Pallets generated successfully.',
    type: [MasterPallet],
  })
  @ApiResponse({
    status: 409,
    description: 'One or more pallet codes in the range already exist.',
  })
  generateRange(@Body() dto: GeneratePalletRangeDto) {
    return this.masterPalletService.generateRange(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Pallets' })
  @ApiResponse({
    status: 200,
    description: 'Return all Pallets.',
    type: [MasterPallet],
  })
  findAll() {
    return this.masterPalletService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Pallet by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Pallet.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  findOne(@Param('id') id: string) {
    return this.masterPalletService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Pallet' })
  @ApiResponse({
    status: 200,
    description: 'The Pallet has been successfully updated.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  @ApiResponse({
    status: 409,
    description: 'Pallet with this code already exists.',
  })
  update(@Param('id') id: string, @Body() updateMasterPalletDto: UpdateMasterPalletDto) {
    return this.masterPalletService.update(id, updateMasterPalletDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Pallet' })
  @ApiResponse({
    status: 200,
    description: 'The Pallet has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  remove(@Param('id') id: string) {
    return this.masterPalletService.remove(id);
  }

  @Patch(':palletCode/quantity')
  @ApiOperation({ summary: 'Update pallet quantity' })
  @ApiResponse({
    status: 200,
    description: 'The Pallet quantity has been successfully updated.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  updateQuantity(
    @Param('palletCode') palletCode: string,
    @Body() updateQuantityDto: UpdatePalletQuantityDto,
  ) {
    return this.masterPalletService.updateQuantityByPalletCode(palletCode, updateQuantityDto);
  }

  @Patch(':id/production-date')
  @ApiOperation({ summary: 'Update production date for an item line on a pallet' })
  @ApiResponse({
    status: 200,
    description: 'Production date updated. A new history record is created with the same quantity.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 400, description: 'No quantity found for the item/UOM on this pallet.' })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  updateProductionDate(
    @Param('id') id: string,
    @Body() dto: UpdateProductionDateDto,
  ) {
    return this.masterPalletService.updateProductionDate(id, dto);
  }

  @Patch(':id/uom')
  @ApiOperation({ summary: 'Change UOM for an item line on a pallet' })
  @ApiResponse({
    status: 200,
    description: 'UOM updated. Quantity is removed from from_uom and added to to_uom.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 400, description: 'No quantity found for item/from_uom or from_uom equals to_uom.' })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  updateUOM(@Param('id') id: string, @Body() dto: UpdateUOMDto) {
    return this.masterPalletService.updateUOM(id, dto);
  }

  @Get('by-code/:palletCode/quantity-history')
  @ApiOperation({ summary: 'Get pallet quantity history by pallet code' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'operation_type',
      description: 'Filter berdasarkan tipe operasi kuantitas',
      enum: Object.values(QuantityOperationType),
      required: false,
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return pallet quantity history.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/PalletQuantityHistoryResponseDto' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDtoOfPalletQuantityHistoryResponseDto' },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  getQuantityHistoryByPalletCode(
    @Param('palletCode') palletCode: string,
    @Query() paginationQuery: PalletHistoryPaginationDto,
  ) {
    const hasPaginationParams =
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.search ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.operation_type;

    if (hasPaginationParams) {
      return this.masterPalletService.getQuantityHistoryByPalletCodePaginated(
        palletCode,
        paginationQuery,
      );
    }

    return this.masterPalletService.getQuantityHistoryByPalletCode(palletCode);
  }

  @Get('by-code/:palletCode/current')
  @ApiOperation({ summary: 'Get all items and their quantities on a pallet by pallet code' })
  @ApiResponse({
    status: 200,
    description: 'Return all items and their quantities on the pallet.',
    type: [PalletItemQuantityDto],
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  getPalletItemLatestQuantityByPalletCode(@Param('palletCode') palletCode: string) {
    return this.masterPalletService.getPalletItemLatestQuantityByPalletCode(palletCode);
  }

  @Patch('by-code/:palletCode/item/:itemId/quantity')
  @ApiOperation({ 
    summary: 'Update quantity for specific item on pallet by pallet code and item ID',
    description: 'Direct stock adjustment for pallet item. This endpoint adjusts the item quantity to the specified value. Only quantity is required. Operation type is automatically set to ADJUST.'
  })
  @ApiBody({ type: UpdatePalletItemStockDto })
  @ApiResponse({
    status: 200,
    description: 'The quantity for item on pallet has been successfully updated.',
    type: MasterPallet,
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  @ApiResponse({ status: 400, description: 'Invalid request body or validation error.' })
  updateItemQuantityByPalletCode(
    @Param('palletCode') palletCode: string,
    @Param('itemId') itemId: string,
    @Body() stockDto: UpdatePalletItemStockDto,
  ) {
    // Map to UpdatePalletQuantityDto for service call
    // Automatically use ADJUST operation type for stock adjustments
    const updateQuantityDto: UpdatePalletQuantityDto = {
      item_id: itemId,
      quantity: stockDto.quantity,
      operation_type: QuantityOperationType.ADJUST,
      uom: stockDto.uom,
      production_date: stockDto.production_date,
      week_number: stockDto.week_number,
      notes: stockDto.notes,
      user_id: stockDto.user_id,
      reference_type: 'STOCK_ADJUSTMENT',
      // Explicitly exclude inbound/outbound references
      inbound_id: undefined,
      outbound_do_id: undefined,
    };
    return this.masterPalletService.updateQuantityByPalletCode(palletCode, updateQuantityDto);
  }

  @Get('by-code/:palletCode/item/:itemId/history')
  @ApiOperation({ summary: 'Get item quantity history by pallet code and item ID' })
  @ApiResponse({
    status: 200,
    description: 'Return item quantity history.',
    type: [PalletQuantityHistoryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  getItemQuantityHistoryByPalletCode(
    @Param('palletCode') palletCode: string,
    @Param('itemId') itemId: string,
    @Query('uom') uom?: string,
  ) {
    return this.masterPalletService.getItemQuantityHistoryByPalletCode(palletCode, itemId, uom);
  }

  @Get('by-code/:palletCode/capacity-validation')
  @ApiOperation({ summary: 'Validate pallet capacity by pallet code' })
  @ApiResponse({
    status: 200,
    description: 'Return pallet capacity validation information.',
    type: PalletCapacityValidationDto,
  })
  @ApiResponse({ status: 400, description: 'Pallet capacity not set.' })
  @ApiResponse({ status: 404, description: 'Pallet not found.' })
  validateCapacityByPalletCode(@Param('palletCode') palletCode: string) {
    return this.masterPalletService.validateCapacityByPalletCode(palletCode);
  }
}
