import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MasterWarehouseBinService } from './master-warehouse-bin.service';
import { CreateMasterWarehouseBinDto } from './dto/create-master-warehouse-bin.dto';
import { UpdateMasterWarehouseBinDto } from './dto/update-master-warehouse-bin.dto';
import { MasterWarehouseBin } from '../core/domain/entities/master-warehouse-bin.entity';

@ApiTags('Master Warehouse Bin')
@Controller('master-warehouse-bin')
@ApiBearerAuth('JWT-auth')
export class MasterWarehouseBinController {
  constructor(
    private readonly masterWarehouseBinService: MasterWarehouseBinService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Warehouse Bin' })
  @ApiResponse({
    status: 201,
    description: 'The Warehouse Bin has been successfully created.',
    type: MasterWarehouseBin,
  })
  @ApiResponse({
    status: 409,
    description: 'Warehouse Bin with this organization ID already exists.',
  })
  create(@Body() createMasterWarehouseBinDto: CreateMasterWarehouseBinDto) {
    return this.masterWarehouseBinService.create(createMasterWarehouseBinDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Warehouses Bin' })
  @ApiResponse({
    status: 200,
    description: 'Return all Warehouses Bin.',
    type: [MasterWarehouseBin],
  })
  findAll() {
    return this.masterWarehouseBinService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Warehouse Bin by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Bin.',
    type: MasterWarehouseBin,
  })
  @ApiResponse({ status: 404, description: 'Warehouse Bin not found.' })
  findOne(@Param('id') id: string) {
    return this.masterWarehouseBinService.findOne(id);
  }

  @Get('organization/:organization_id')
  @ApiOperation({ summary: 'Get a Warehouse Bin by organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Bin.',
    type: [MasterWarehouseBin],
  })
  @ApiResponse({ status: 404, description: 'Warehouse Bin not found.' })
  findByOrganizationId(
    @Param('organization_id', ParseIntPipe) organization_id: number,
  ) {
    return this.masterWarehouseBinService.findByOrganizationId(organization_id);
  }

  @Get('warehouse-sub/:warehouse_sub_id')
  @ApiOperation({ summary: 'Get a Warehouse Bin by warehouse sub ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the Warehouse Bin.',
    type: [MasterWarehouseBin],
  })
  @ApiResponse({ status: 404, description: 'Warehouse Bin not found.' })
  findByWarehouseSubId(@Param('warehouse_sub_id') warehouse_sub_id: string) {
    return this.masterWarehouseBinService.findByWarehouseSubId(
      warehouse_sub_id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Warehouse Bin' })
  @ApiResponse({
    status: 200,
    description: 'The Warehouse Bin has been successfully updated.',
    type: MasterWarehouseBin,
  })
  update(
    @Param('id') id: string,
    @Body() updateMasterWarehouseBinDto: UpdateMasterWarehouseBinDto,
  ) {
    return this.masterWarehouseBinService.update(
      id,
      updateMasterWarehouseBinDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Warehouse Bin' })
  @ApiResponse({
    status: 200,
    description: 'The Warehouse Bin has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Warehouse Bin not found.' })
  remove(@Param('id') id: string) {
    return this.masterWarehouseBinService.remove(id);
  }

  @Get('suggestion/in')
  @ApiOperation({ summary: 'Get inventory tracking list with status INSPECTION_APPROVED for put away with suggestion destination' })
  @ApiResponse({ status: 200, description: 'OK' })
  suggestionDestinationIn() {
    return this.masterWarehouseBinService.suggestionDestinationIn();
  }

  @Get('suggestion/staging-pallets')
  @ApiOperation({ summary: 'Get pallets in staging areas with smart suggested destination bin and zone based on same items/weeks' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns each staging pallet with intelligent suggestions based on item and week matching formula',
    schema: {
      type: 'object',
      properties: {
        palletSuggestions: {
          type: 'array',
          description: 'Array of intelligent pallet suggestions with item/week matching',
          items: {
            type: 'object',
            properties: {
              stagingPallet: {
                type: 'object',
                description: 'Pallet currently in staging area with INSPECTION_APPROVED status'
              },
              suggestedBin: {
                type: 'object', 
                description: 'Smart suggested destination bin (prioritizes bins with same items/weeks)'
              },
              suggestedZone: {
                type: 'object',
                description: 'Smart suggested destination zone (prioritizes zones with same items/weeks)'
              },
              palletItems: {
                type: 'array',
                description: 'Items and weeks contained in this pallet'
              },
              matchingBinsForSameItem: {
                type: 'array',
                description: 'All bins that already contain same items or weeks as this pallet'
              },
              matchingZonesForSameItem: {
                type: 'array',
                description: 'All zones that already contain same items or weeks as this pallet'
              }
            }
          }
        }
      }
    }
  })
  getStagingPalletsWithSuggestions() {
    return this.masterWarehouseBinService.getStagingPalletsWithSuggestions();
  }
}
