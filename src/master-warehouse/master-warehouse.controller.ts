import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MasterWarehouseService } from './master-warehouse.service';
import { CreateMasterWarehouseDto } from './dto/create-master-warehouse.dto';
import { UpdateMasterWarehouseDto } from './dto/update-master-warehouse.dto';
import { MasterWarehouse } from '../core/domain/entities/master-warehouse.entity';
import { WarehouseLocatorIntegrationService } from './integration/warehouse-locator.integration';
import { OrganizationId } from '../core/decorators/organization-id.decorator';

@ApiTags('Master Warehouse')
@Controller('master-warehouse')
@ApiBearerAuth('JWT-auth')
export class MasterWarehouseController {
  constructor(
    private readonly masterWarehouseService: MasterWarehouseService,
    private readonly warehouseIntegration: WarehouseLocatorIntegrationService
  ) { }

  @Get('locator')
    @ApiOperation({
        summary: 'Get inventory locator list',
        description:
            'Retrieve unique locator list (SUBINVENTORY_CODE, LOCATOR_ID, LOCATOR) filtered by organization_code and optional subinventory_code. Defaults to JAT when organization_code is omitted.',
    })
    @ApiQuery({
        name: 'organization_code',
        required: false,
        type: String,
        description: 'Organization code to filter locator data (default: JAT)',
        example: 'JAT',
    })
    @ApiResponse({
        status: 200,
        description: 'Inventory locator data retrieved successfully',
    })
    @ApiQuery({
        name: 'subinventory_code',
        required: false,
        type: String,
        description: 'Subinventory code to filter locator data',
        example: 'GOOD-RK-1',
    })
    async getInvLocator(
        @Query('organization_code') organizationCode?: string,
        @Query('subinventory_code') subinventoryCode?: string,
    ): Promise<any> {
      const response = await this.warehouseIntegration.getInventoryLocator({
        organization_code: organizationCode,
        subinventory_code: subinventoryCode,
      });

      // Return only payload list; global response wrapper will place it into top-level data.
      return response.data ?? [];
    }

  @Post()
  @ApiOperation({ summary: 'Create a new Warehouse' })
  @ApiResponse({
    status: 201,
    description: 'The Warehouse has been successfully created.',
    type: MasterWarehouse,
  })
  @ApiResponse({
    status: 409,
    description: 'Warehouse with this organization ID already exists.',
  })
  create(@Body() createMasterWarehouseDto: CreateMasterWarehouseDto) {
    return this.masterWarehouseService.create(createMasterWarehouseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Warehouses' })
  @ApiResponse({
    status: 200,
    description: 'Return all Warehouses.',
    type: [MasterWarehouse],
  })
  findAll(@OrganizationId() organizationId: string ) {
    return this.masterWarehouseService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Warehouse by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse.',
    type: MasterWarehouse,
  })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  findOne(@Param('id') id: string) {
    return this.masterWarehouseService.findOne(id);
  }

  @Get('organization/:organization_id')
  @ApiOperation({ summary: 'Get a Warehouse by organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse.',
    type: [MasterWarehouse],
  })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  findByOrganizationId(@Param('organization_id') organization_id: string) {
    return this.masterWarehouseService.findByOrganizationId(organization_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Warehouse' })
  @ApiResponse({
    status: 200,
    description: 'The Warehouse has been successfully updated.',
    type: MasterWarehouse,
  })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  @ApiResponse({
    status: 409,
    description: 'Warehouse with this organization ID already exists.',
  })
  update(@Param('id') id: string, @Body() updateMasterWarehouseDto: UpdateMasterWarehouseDto) {
    return this.masterWarehouseService.update(id, updateMasterWarehouseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Warehouse' })
  @ApiResponse({
    status: 200,
    description: 'The Warehouse has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Warehouse not found.' })
  remove(@Param('id') id: string) {
    return this.masterWarehouseService.remove(id);
  }
}
