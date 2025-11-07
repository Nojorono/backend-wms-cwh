import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerMainDto } from './dto/create-customer-main.dto';
import { UpdateCustomerMainDto } from './dto/update-customer-main.dto';
import { CreateCustomerSubdistDto } from './dto/create-customer-subdist.dto';
import { UpdateCustomerSubdistDto } from './dto/update-customer-subdist.dto';
import { CustomerMain } from '../core/domain/entities/customer-main.entity';
import { CustomerSubdist } from '../core/domain/entities/customer-subdist.entity';

@ApiTags('Customer')
@Controller('customer')
@ApiBearerAuth('JWT-auth')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // CustomerMain endpoints
  @Post('main')
  @ApiOperation({ summary: 'Create a new Customer Main' })
  @ApiResponse({
    status: 201,
    description: 'The Customer Main has been successfully created.',
    type: CustomerMain,
  })
  @ApiResponse({
    status: 409,
    description: 'Customer with this organization code already exists.',
  })
  createCustomerMain(@Body() createDto: CreateCustomerMainDto) {
    return this.customerService.createCustomerMain(createDto);
  }

  @Get('main')
  @ApiOperation({ summary: 'Get all Customer Mains' })
  @ApiResponse({
    status: 200,
    description: 'Return all Customer Mains.',
    type: [CustomerMain],
  })
  findAllCustomerMain() {
    return this.customerService.findAllCustomerMain();
  }

  @Get('main/:id')
  @ApiOperation({ summary: 'Get a Customer Main by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Customer Main.',
    type: CustomerMain,
  })
  @ApiResponse({ status: 404, description: 'Customer Main not found.' })
  findOneCustomerMain(@Param('id') id: string) {
    return this.customerService.findOneCustomerMain(id);
  }

  @Patch('main/:id')
  @ApiOperation({ summary: 'Update a Customer Main' })
  @ApiResponse({
    status: 200,
    description: 'The Customer Main has been successfully updated.',
    type: CustomerMain,
  })
  @ApiResponse({ status: 404, description: 'Customer Main not found.' })
  @ApiResponse({
    status: 409,
    description: 'Customer with this organization code already exists.',
  })
  updateCustomerMain(@Param('id') id: string, @Body() updateDto: UpdateCustomerMainDto) {
    return this.customerService.updateCustomerMain(id, updateDto);
  }

  @Delete('main/:id')
  @ApiOperation({ summary: 'Delete a Customer Main' })
  @ApiResponse({
    status: 200,
    description: 'The Customer Main has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Customer Main not found.' })
  removeCustomerMain(@Param('id') id: string) {
    return this.customerService.removeCustomerMain(id);
  }

  @Post('main/sync-from-meta-oracle')
  @ApiOperation({ summary: 'Sync Customer Main from meta oracle' })
  @ApiResponse({ status: 200, description: 'Sync Customer Main from meta oracle' })
  syncCustomerMainFromMetaOracle() {
    return this.customerService.syncCustomerMainFromMetaOracle();
  }

  // CustomerSubdist endpoints
  @Post('subdist')
  @ApiOperation({ summary: 'Create a new Customer Subdist' })
  @ApiResponse({
    status: 201,
    description: 'The Customer Subdist has been successfully created.',
    type: CustomerSubdist,
  })
  @ApiResponse({
    status: 409,
    description: 'Customer with this number already exists.',
  })
  createCustomerSubdist(@Body() createDto: CreateCustomerSubdistDto) {
    return this.customerService.createCustomerSubdist(createDto);
  }

  @Get('subdist')
  @ApiOperation({ summary: 'Get all Customer Subdists' })
  @ApiResponse({
    status: 200,
    description: 'Return all Customer Subdists.',
    type: [CustomerSubdist],
  })
  findAllCustomerSubdist() {
    return this.customerService.findAllCustomerSubdist();
  }

  @Get('subdist/:id')
  @ApiOperation({ summary: 'Get a Customer Subdist by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the Customer Subdist.',
    type: CustomerSubdist,
  })
  @ApiResponse({ status: 404, description: 'Customer Subdist not found.' })
  findOneCustomerSubdist(@Param('id') id: string) {
    return this.customerService.findOneCustomerSubdist(id);
  }

  @Patch('subdist/:id')
  @ApiOperation({ summary: 'Update a Customer Subdist' })
  @ApiResponse({
    status: 200,
    description: 'The Customer Subdist has been successfully updated.',
    type: CustomerSubdist,
  })
  @ApiResponse({ status: 404, description: 'Customer Subdist not found.' })
  @ApiResponse({
    status: 409,
    description: 'Customer with this number already exists.',
  })
  updateCustomerSubdist(@Param('id') id: string, @Body() updateDto: UpdateCustomerSubdistDto) {
    return this.customerService.updateCustomerSubdist(id, updateDto);
  }

  @Delete('subdist/:id')
  @ApiOperation({ summary: 'Delete a Customer Subdist' })
  @ApiResponse({
    status: 200,
    description: 'The Customer Subdist has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Customer Subdist not found.' })
  removeCustomerSubdist(@Param('id') id: string) {
    return this.customerService.removeCustomerSubdist(id);
  }

  @Post('subdist/sync-from-meta-oracle')
  @ApiOperation({ summary: 'Sync Customer Subdist from meta oracle' })
  @ApiResponse({ status: 200, description: 'Sync Customer Subdist from meta oracle' })
  syncCustomerSubdistFromMetaOracle() {
    return this.customerService.syncCustomerSubdistFromMetaOracle();
  }
}

