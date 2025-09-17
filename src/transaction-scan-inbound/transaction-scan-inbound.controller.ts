import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionScanInboundService } from './transaction-scan-inbound.service';
import { CreateTransactionScanInboundDto } from './dto/create-transaction-scan-inbound.dto';
import { UpdateTransactionScanInboundDto } from './dto/update-transaction-scan-inbound.dto';
import { ScanInboundStatus, TransactionScanInbound } from '../core/domain/entities/transaction-scan-inbound.entity';

@ApiTags('Transaction Scan Inbound')
@Controller('transaction-scan-inbound')
@ApiBearerAuth('JWT-auth')
export class TransactionScanInboundController {
  constructor(private readonly service: TransactionScanInboundService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction scan inbound' })
  @ApiResponse({ status: 201, description: 'Created', type: TransactionScanInbound })
  create(@Body() dto: CreateTransactionScanInboundDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transaction scan inbound records' })
  @ApiResponse({ status: 200, description: 'OK', type: [TransactionScanInbound] })
  @ApiQuery({ name: 'inbound_id', required: true, type: String })
  @ApiQuery({ name: 'status', required: true, type: String })
  findAll(@Query('inbound_id') inbound_id: string, @Query('status') status: string) {
    return this.service.findAll(inbound_id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction scan inbound by ID' })
  @ApiResponse({ status: 200, description: 'OK', type: TransactionScanInbound })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // find by inbound id
  @Get('inbound/:inbound_id')
  @ApiOperation({ summary: 'Get a transaction scan inbound by inbound ID' })
  @ApiResponse({ status: 200, description: 'OK', type: TransactionScanInbound })
  findByInboundId(@Param('inbound_id') inbound_id: string) {
    return this.service.findByInboundId(inbound_id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction scan inbound' })
  @ApiResponse({ status: 200, description: 'Updated', type: TransactionScanInbound })
  update(@Param('id') id: string, @Body() dto: UpdateTransactionScanInboundDto) {
    return this.service.update(id, dto);
  }

  @Patch('inspection-approved/:id')
  @ApiOperation({ summary: 'Update the inspection approved of a transaction scan inbound PENING OR COMPLETED' })
  @ApiResponse({ status: 200, description: 'Updated', type: TransactionScanInbound })
  @ApiQuery({ name: 'status', required: true, type: String })
  updateInspectionApproved(@Param('id') id: string, @Query('status') status: ScanInboundStatus) {
    return this.service.updateInspectionApproved(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction scan inbound' })
  @ApiResponse({ status: 200, description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


