import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MasterWarehouseSubService } from './master-warehouse-sub.service';
import { CreateMasterWarehouseSubDto } from './dto/create-master-warehouse-sub.dto';
import { UpdateMasterWarehouseSubDto } from './dto/update-master-warehouse-sub.dto';
import {
  MasterWarehouseSub,
  WarehouseSubStagingType,
} from '../core/domain/entities/master-warehouse-sub.entity';

@ApiTags('Master Warehouse Sub')
@Controller('master-warehouse-sub')
@ApiBearerAuth('JWT-auth')
export class MasterWarehouseSubController {
  constructor(private readonly masterWarehouseSubService: MasterWarehouseSubService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Warehouse Sub' })
  @ApiResponse({
    status: 201,
    description: 'The Warehouse Sub has been successfully created.',
    type: MasterWarehouseSub,
  })
  @ApiResponse({
    status: 409,
    description: 'Warehouse Sub with this organization ID already exists.',
  })
  create(@Body() createMasterWarehouseSubDto: CreateMasterWarehouseSubDto) {
    return this.masterWarehouseSubService.create(createMasterWarehouseSubDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Warehouses Sub' })
  @ApiResponse({
    status: 200,
    description: 'Return all Warehouses Sub.',
    type: [MasterWarehouseSub],
  })
  @ApiQuery({ name: 'is_staging', required: false, enum: WarehouseSubStagingType })
  @ApiQuery({ name: 'is_gate', required: false, type: Boolean })
  findAll(@Query('is_staging') is_staging?: WarehouseSubStagingType, @Query('is_gate') is_gate?: string) {
    const isGateBoolean = is_gate !== undefined ? is_gate === 'true' : undefined;
    
    if (is_staging !== undefined || isGateBoolean !== undefined) {
      return this.masterWarehouseSubService.findByFilters(is_staging, isGateBoolean);
    } else {
      return this.masterWarehouseSubService.findAll();
    }
  }

  @Get('is-staging')
  @ApiOperation({ summary: 'Get a Warehouse Sub by is staging' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Sub.',
    type: [MasterWarehouseSub],
  })
  @ApiResponse({ status: 404, description: 'Warehouse Sub not found.' })
  findByIsStaging(@Query('is_staging') is_staging: string) {
    if (is_staging === 'null') {
      return this.masterWarehouseSubService.findByIsStagingNull();
    } else if (is_staging && is_staging !== 'null') {
      return this.masterWarehouseSubService.findByIsStaging(is_staging as WarehouseSubStagingType);
    } else {
      return this.masterWarehouseSubService.findAll();
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Warehouse Sub by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Sub.',
    type: MasterWarehouseSub,
  })
  @ApiResponse({ status: 404, description: 'Warehouse Sub not found.' })
  findOne(@Param('id') id: string) {
    return this.masterWarehouseSubService.findOne(id);
  }

  @Get('organization/:organization_id')
  @ApiOperation({ summary: 'Get a Warehouse Sub by organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Sub.',
    type: [MasterWarehouseSub],
  })
  @ApiResponse({ status: 404, description: 'Warehouse Sub not found.' })
  findByOrganizationId(@Param('organization_id', ParseIntPipe) organization_id: number) {
    return this.masterWarehouseSubService.findByOrganizationId(organization_id);
  }

  @Get('warehouse/:warehouse_id')
  @ApiOperation({ summary: 'Get a Warehouse Sub by warehouse ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Sub.',
    type: [MasterWarehouseSub],
  })
  @ApiResponse({ status: 404, description: 'Warehouse Sub not found.' })
  findByWarehouseId(@Param('warehouse_id') warehouse_id: string) {
    return this.masterWarehouseSubService.findByWarehouseId(warehouse_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Warehouse Sub' })
  @ApiResponse({
    status: 200,
    description: 'The Warehouse Sub has been successfully updated.',
    type: MasterWarehouseSub,
  })
  update(
    @Param('id') id: string,
    @Body() updateMasterWarehouseSubDto: UpdateMasterWarehouseSubDto,
  ) {
    return this.masterWarehouseSubService.update(id, updateMasterWarehouseSubDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Warehouse Sub' })
  @ApiResponse({
    status: 200,
    description: 'The Warehouse Sub has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Warehouse Sub not found.' })
  remove(@Param('id') id: string) {
    return this.masterWarehouseSubService.remove(id);
  }
}
