import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import {
  InventoryTracking,
  ProgressionStatus,
} from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingService } from './inventory-tracking.service';
import { InventoryTrackingPaginationQueryDto } from './dto/inventory-tracking-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';
import {
  VisibilityDashboardResponseDto,
  VisibilityDashboardDataDto,
  VisibilityDashboardSummaryDto,
  VisibilityDashboardItemDto,
  PalletDetailDto,
  BookingDetailDto,
} from './dto/visibility-dashboard-response.dto';
import { UpdateProgressionStatusDto } from './dto/update-progression-status.dto';
import { CreateOrUpdateInventoryTrackingDto } from './dto/create-or-update-inventory-tracking.dto';
import {
  ValidatePalletResponseDto,
  ValidatePalletErrorResponseDto,
} from './dto/validate-pallet-response.dto';
import { ItemInventoryTrackingDto } from './dto/item-inventory-tracking-response.dto';
import { OrganizationId } from '../core/decorators/organization-id.decorator';

@ApiTags('Inventory Tracking')
@Controller('inventory-tracking')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(
  VisibilityDashboardResponseDto,
  VisibilityDashboardDataDto,
  VisibilityDashboardSummaryDto,
  VisibilityDashboardItemDto,
  PalletDetailDto,
  BookingDetailDto,
  UpdateProgressionStatusDto,
  CreateOrUpdateInventoryTrackingDto,
  ValidatePalletResponseDto,
  ValidatePalletErrorResponseDto,
  ItemInventoryTrackingDto,
)
export class InventoryTrackingController {
  constructor(
    private readonly service: InventoryTrackingService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create an inventory tracking record' })
  @ApiResponse({ status: 201, description: 'Created', type: InventoryTracking })
  create(@Body() dto: CreateInventoryTrackingDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all inventory tracking records or search with pagination' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'inventory_status',
      description: 'Filter by inventory status',
      example: 'IN_INVENTORY',
    },
    {
      name: 'warehouse_id',
      description: 'Filter by warehouse ID',
      example: 'uuid-warehouse-123',
    },
    {
      name: 'warehouse_sub_id',
      description: 'Filter by warehouse sub ID',
      example: 'uuid-warehouse-sub-123',
    },
    {
      name: 'warehouse_bin_id',
      description: 'Filter by warehouse bin ID',
      example: 'uuid-warehouse-bin-123',
    },
    {
      name: 'pallet_id',
      description: 'Filter by pallet ID',
      example: 'uuid-pallet-123',
    },
    {
      name: 'progression_status',
      description: 'Filter by progression status',
      example: 'IN_PROGRESS',
    },
    {
      name: 'item_id',
      description: 'Filter by item ID',
      example: 'uuid-item-123',
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Return all inventory tracking records or paginated results.',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: '#/components/schemas/InventoryTracking' },
        },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  findAll(@OrganizationId() organizationId: string, @Query() paginationQuery: InventoryTrackingPaginationQueryDto) {
    // Check if any pagination parameters are provided
    const hasPaginationParams =
      paginationQuery.search ||
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.inventory_status ||
      paginationQuery.warehouse_id ||
      paginationQuery.warehouse_sub_id ||
      paginationQuery.warehouse_bin_id ||
      paginationQuery.pallet_id ||
      paginationQuery.progression_status ||
      paginationQuery.item_id;

    if (hasPaginationParams) {
      return this.service.findAllPaginated(paginationQuery, organizationId);
    }

    return this.service.findAll(organizationId);
  }

  @Get('warehouse')
  @ApiOperation({ summary: 'Get inventory tracking by warehouse/sub/bin' })
  @ApiQuery({ name: 'warehouse_sub_id', required: false, type: String })
  @ApiQuery({ name: 'warehouse_bin_id', required: false, type: String })
  @ApiResponse({ status: 200, description: 'OK', type: [InventoryTracking] })
  findAllByWarehouse(
    @Query('warehouse_sub_id') warehouse_sub_id?: string,
    @Query('warehouse_bin_id') warehouse_bin_id?: string,
  ) {
    return this.service.findAllByWarehouse(warehouse_sub_id, warehouse_bin_id);
  }

  @Get('history/:pallet_id')
  @ApiOperation({ summary: 'Get inventory tracking history by pallet id' })
  @ApiResponse({ status: 200, description: 'OK', type: [InventoryTracking] })
  findOneHistoryByPalletId(@Param('pallet_id') pallet_id: string) {
    return this.service.findHistoryByPalletId(pallet_id);
  }

  @Get('history/inbound/:inbound_id')
  @ApiOperation({ summary: 'Get inventory tracking history by inbound_id' })
  @ApiParam({ name: 'inbound_id', description: 'Inbound transaction ID' })
  @ApiResponse({ status: 200, description: 'OK', type: 'array' })
  @ApiResponse({ status: 404, description: 'No history found for this inbound_id' })
  findHistoryByInboundId(@Param('inbound_id') inbound_id: string) {
    return this.service.findAllHistoryByInboundId(inbound_id);
  }

  @Get('check-inbound/:inbound_id')
  @ApiOperation({ summary: 'Check if history exists for inbound_id' })
  @ApiParam({ name: 'inbound_id', description: 'Inbound transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'OK',
    schema: {
      type: 'object',
      properties: { exists: { type: 'boolean' }, history: { type: 'object' } },
    },
  })
  checkInboundId(@Param('inbound_id') inbound_id: string) {
    return this.service.findHistoryByInboundId(inbound_id);
  }

  @Get('validate-pallet/:pallet_code')
  @ApiOperation({
    summary:
      'Validate if pallet can be used for inventory tracking (only pallets that are outbound done can be reused)',
  })
  @ApiParam({ name: 'pallet_code', description: 'Pallet Code to validate' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: ValidatePalletResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Pallet cannot be used',
    type: ValidatePalletErrorResponseDto,
  })
  async validatePallet(@Param('pallet_code') pallet_code: string) {
    return this.service.validatePallet(pallet_code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory tracking by id' })
  @ApiResponse({ status: 200, description: 'OK', type: InventoryTracking })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory tracking by id' })
  @ApiResponse({ status: 200, description: 'Updated', type: InventoryTracking })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(@Param('id') id: string, @Body() dto: UpdateInventoryTrackingDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/progression-status')
  @ApiOperation({ summary: 'Update progression status for inventory tracking' })
  @ApiBody({ type: UpdateProgressionStatusDto })
  @ApiResponse({ status: 200, description: 'Progression status updated', type: InventoryTracking })
  @ApiResponse({ status: 404, description: 'Inventory tracking not found' })
  updateProgressionStatus(@Param('id') id: string, @Body() body: UpdateProgressionStatusDto) {
    return this.service.updateProgressionStatus(id, body.progression_status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory tracking by id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('item/:item_id')
  @ApiOperation({ summary: 'Get inventory tracking by item ID' })
  @ApiParam({ name: 'item_id', description: 'Item ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory tracking records for specific item',
    type: [ItemInventoryTrackingDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No inventory tracking found for this item',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'No inventory tracking found for this item' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async findByItemId(@Param('item_id') item_id: string) {
    return this.service.findByItemId(item_id);
  }

  // visibility inventory tracking all item in warehouse
  @Get('visibility/warehouse')
  @ApiOperation({ summary: 'Get dashboard visibility for all items in warehouse with pending booking status' })
  @ApiQuery({ name: 'item_id', required: false, type: String, description: 'Filter by specific item ID' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard visibility data with item quantities and pending bookings',
    type: VisibilityDashboardResponseDto,
  })
  async getVisibilityInventoryTrackingAllItemInWarehouse(@OrganizationId() organizationId: string, @Query('item_id') item_id?: string) {
    return await this.service.getVisibilityInventoryTrackingAllItemInWarehouse(organizationId, item_id);
  }
}
