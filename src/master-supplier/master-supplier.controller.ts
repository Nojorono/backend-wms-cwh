import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MasterSupplierService } from './master-supplier.service';
import { CreateMasterSupplierDto } from './dto/create-master-supplier.dto';
import { UpdateMasterSupplierDto } from './dto/update-master-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { MasterSupplier } from '../core/domain/entities/master-supplier.entity';
import { SupplierIntegrationService } from './integration/supplier-integration.service';

@ApiTags('Master Supplier')
@Controller('master-supplier')
@ApiBearerAuth('JWT-auth')
export class MasterSupplierController {
  constructor(
    private readonly masterSupplierService: MasterSupplierService,
    private readonly supplierIntegrationService: SupplierIntegrationService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new Supplier' })
  @ApiResponse({
    status: 201,
    description: 'The Supplier has been successfully created.',
    type: MasterSupplier,
  })
  @ApiResponse({
    status: 409,
    description: 'Supplier with this code already exists.',
  })
  create(@Body() createMasterSupplierDto: CreateMasterSupplierDto) {
    return this.masterSupplierService.create(createMasterSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all UOMs' })
  @ApiResponse({
    status: 200,
    description: 'Return all Suppliers.',
    type: [MasterSupplier],
  })
  findAll() {
    return this.masterSupplierService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a Supplier by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Supplier.',
    type: MasterSupplier,
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  findOne(@Param('id') id: string) {
    return this.masterSupplierService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Supplier' })
  @ApiResponse({
    status: 200,
    description: 'The Supplier has been successfully updated.',
    type: MasterSupplier,
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  @ApiResponse({
    status: 409,
    description: 'Supplier with this code already exists.',
  })
  update(@Param('id') id: string, @Body() updateMasterSupplierDto: UpdateMasterSupplierDto) {
    return this.masterSupplierService.update(id, updateMasterSupplierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Supplier' })
  @ApiResponse({
    status: 200,
    description: 'The Supplier has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  remove(@Param('id') id: string) {
    return this.masterSupplierService.remove(id);
  }

  @Get('attribute7')
  @ApiOperation({ summary: 'Get a Supplier by attribute7 value' })
  @ApiResponse({
    status: 200,
    description: 'Return all Suppliers with pagination and search.',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found.' })
  findAllByAttribute7(@Query() query: SupplierQueryDto) {
    return this.supplierIntegrationService.getSuppliers(query);
  }
}
