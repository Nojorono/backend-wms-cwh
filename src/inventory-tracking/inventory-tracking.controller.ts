import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingService } from './inventory-tracking.service';
import { InventoryAutoSuggestionService } from './auto-suggestion.service';


@ApiTags('Inventory Tracking')
@Controller('inventory-tracking')
@ApiBearerAuth('JWT-auth')
export class InventoryTrackingController {
  constructor(
    private readonly service: InventoryTrackingService,
    private readonly autoSuggestionService: InventoryAutoSuggestionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an inventory tracking record' })
  @ApiResponse({ status: 201, description: 'Created', type: InventoryTracking })
  create(@Body() dto: CreateInventoryTrackingDto) {
    return this.service.create(dto);
  }

  @Post('with-inbound-check')
  @ApiOperation({ summary: 'Create inventory tracking with inbound_id duplication check' })
  @ApiResponse({ status: 201, description: 'Created', type: InventoryTracking })
  @ApiResponse({ status: 400, description: 'Bad Request - Duplicate inbound_id found' })
  createWithInboundCheck(@Body() dto: CreateInventoryTrackingDto) {
    return this.service.createWithInboundCheck(dto);
  }

  @Post('create-or-update-with-inbound-check')
  @ApiOperation({ summary: 'Create or update inventory tracking with inbound_id duplication check' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pallet_id: { type: 'string', example: 'pallet-uuid' },
        warehouse_sub_id: { type: 'string', example: 'warehouse-sub-uuid' },
        warehouse_id: { type: 'string', example: 'warehouse-uuid' },
        inventory_status: { type: 'string', example: 'CHECKED' },
        inbound_id: { type: 'string', example: 'inbound-uuid' }
      },
      required: ['pallet_id', 'warehouse_sub_id', 'warehouse_id', 'inventory_status']
    }
  })
  @ApiResponse({ status: 201, description: 'Created or Updated', type: InventoryTracking })
  @ApiResponse({ status: 400, description: 'Bad Request - Duplicate inbound_id found' })
  createOrUpdateWithInboundCheck(@Body() body: {
    pallet_id: string;
    warehouse_sub_id: string;
    warehouse_id: string;
    inventory_status: string;
    inbound_id?: string;
  }) {
    return this.service.createOrUpdateInventoryTrackingWithInboundCheck(
      body.pallet_id,
      body.warehouse_sub_id,
      body.warehouse_id,
      body.inventory_status,
      body.inbound_id
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory tracking records' })
  @ApiResponse({ status: 200, description: 'OK', type: [InventoryTracking] })
  findAll() {
    return this.service.findAll();
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
    return this.service.findOneHistoryByPalletId(pallet_id);
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
  @ApiResponse({ status: 200, description: 'OK', schema: { type: 'object', properties: { exists: { type: 'boolean' }, history: { type: 'object' } } } })
  checkInboundId(@Param('inbound_id') inbound_id: string) {
    return this.service.findHistoryByInboundId(inbound_id);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory tracking by id' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('auto-suggestion/in/:pallet_id')
  @ApiOperation({ summary: 'Get auto suggestions for IN operations' })
  @ApiResponse({ status: 200, description: 'Auto suggestions for IN operations' })
  getInSuggestions(@Param('pallet_id') pallet_id: string) {
    return this.autoSuggestionService.getInSuggestions(pallet_id);
  }

  @Get('auto-suggestion/out/:pallet_id')
  @ApiOperation({ summary: 'Get auto suggestions for OUT operations' })
  @ApiResponse({ status: 200, description: 'Auto suggestions for OUT operations' })
  getOutSuggestions(@Param('pallet_id') pallet_id: string) {
    return this.autoSuggestionService.getOutSuggestions(pallet_id);
  }

  @Get('item/:item_id')
  @ApiOperation({ summary: 'Get inventory tracking by item ID' })
  @ApiParam({ name: 'item_id', description: 'Item ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Inventory tracking records for specific item',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          inventory_tracking_id: { type: 'string' },
          pallet_id: { type: 'string' },
          pallet_code: { type: 'string' },
          warehouse_id: { type: 'string' },
          warehouse_sub_id: { type: 'string' },
          warehouse_bin_id: { type: 'string' },
          inventory_date: { type: 'string', format: 'date-time' },
          inventory_status: { type: 'string' },
          inventory_note: { type: 'string' },
          week_number: { type: 'number' },
          production_date: { type: 'string', format: 'date-time' },
          item_id: { type: 'string' },
          quantity: { type: 'number' },
          uom: { type: 'string' },
          warehouse_name: { type: 'string' },
          warehouse_sub_name: { type: 'string' },
          bin_name: { type: 'string' },
          bin_code: { type: 'string' },
          pallet_utilization: { type: 'number' }
        }
      }
    }
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
}


