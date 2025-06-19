import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterWarehouseService } from './master-warehouse.service';
import { CreateMasterWarehouseDto } from './dto/create-master-warehouse.dto';
import { UpdateMasterWarehouseDto } from './dto/update-master-warehouse.dto';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';

@ApiTags('Master Warehouse')
@Controller('master-warehouse')
@ApiBearerAuth('JWT-auth')
export class MasterWarehouseController {
  constructor(private readonly masterWarehouseService: MasterWarehouseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Warehouse' })
  @ApiResponse({ status: 201, description: 'The Warehouse has been successfully created.', type: MasterWarehouse })
  @ApiResponse({ status: 409, description: 'Warehouse with this organization ID already exists.' })
  create(@Body() createMasterWarehouseDto: CreateMasterWarehouseDto) {
    return this.masterWarehouseService.create(createMasterWarehouseDto);
  }

  @Get()
    @ApiOperation({ summary: 'Get all Warehouses' })
  @ApiResponse({ status: 200, description: 'Return all Warehouses.', type: [MasterWarehouse] })
  findAll() {
    return this.masterWarehouseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Warehouse by id' })
  @ApiResponse({ status: 200, description: 'Return the Warehouse.', type: MasterWarehouse })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  findOne(@Param('id') id: string) {
    return this.masterWarehouseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Warehouse' })
  @ApiResponse({ status: 200, description: 'The Warehouse has been successfully updated.', type: MasterWarehouse })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  @ApiResponse({ status: 409, description: 'Warehouse with this organization ID already exists.' })
  update(
    @Param('id') id: string,
    @Body() updateMasterWarehouseDto: UpdateMasterWarehouseDto,
  ) {
    return this.masterWarehouseService.update(id, updateMasterWarehouseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Warehouse' })
  @ApiResponse({ status: 200, description: 'The Warehouse has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  remove(@Param('id') id: string) {
    return this.masterWarehouseService.remove(id);
  }
} 