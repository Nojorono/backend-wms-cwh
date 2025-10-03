import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateInventoryTrackingDto } from './dto/create-inventory-tracking.dto';
import { UpdateInventoryTrackingDto } from './dto/update-inventory-tracking.dto';
import { InventoryTracking } from '../core/domain/entities/inventory-tracking.entity';
import { InventoryTrackingService } from './inventory-tracking.service';


@ApiTags('Inventory Tracking')
@Controller('inventory-tracking')
@ApiBearerAuth('JWT-auth')
export class InventoryTrackingController {
  constructor(private readonly service: InventoryTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Create an inventory tracking record' })
  @ApiResponse({ status: 201, description: 'Created', type: InventoryTracking })
  create(@Body() dto: CreateInventoryTrackingDto) {
    return this.service.create(dto);
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
}


