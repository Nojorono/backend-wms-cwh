import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionScanPickingService } from './transaction-scan-picking.service';
import { CreateTransactionScanPickingDto } from './dto/create-transaction-scan-picking.dto';
import { UpdateTransactionScanPickingDto } from './dto/update-transaction-scan-picking.dto';
import { ScanPickingStatus, ScanPickingTransaction } from '../core/domain/entities/transaction-scan-picking.entity';

@ApiTags('Transaction Scan Picking')
@Controller('transaction-scan-picking')
@ApiBearerAuth('JWT-auth')
export class TransactionScanPickingController {
  constructor(private readonly service: TransactionScanPickingService) {}

  @Post()
  @ApiOperation({ summary: 'Create transaction scan picking' })
  @ApiResponse({ status: 201, description: 'Transaction scan picking created', type: ScanPickingTransaction })
  async create(@Body() dto: CreateTransactionScanPickingDto) {
    const result = await this.service.create(dto);
    return {
      success: true,
      message: 'Transaction scan picking berhasil dibuat',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get transaction scan picking list' })
  @ApiQuery({
    name: 'transaction_picking_id',
    required: false,
    type: String,
    description: 'Filter berdasarkan ID transaction picking',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter berdasarkan status',
  })
  @ApiQuery({
    name: 'pallet_id',
    required: false,
    type: String,
    description: 'Filter berdasarkan pallet source/use/switch',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction scan picking',
    type: [ScanPickingTransaction],
  })
  async findAll(
    @Query('transaction_picking_id') transaction_picking_id?: string,
    @Query('status') status?: string,
    @Query('pallet_id') pallet_id?: string,
  ) {
    const result = await this.service.findAll(transaction_picking_id, status, pallet_id);
    return {
      success: true,
      message: 'Data transaction scan picking berhasil diambil',
      data: result,
    };
  }

  @Get('picking/:transactionPickingId')
  @ApiOperation({ summary: 'Get transaction scan picking by transaction picking ID' })
  @ApiParam({ name: 'transactionPickingId', description: 'ID transaction picking' })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction scan picking berdasarkan transaction picking',
    type: [ScanPickingTransaction],
  })
  async findByTransactionPicking(@Param('transactionPickingId') transactionPickingId: string) {
    const result = await this.service.findByTransactionPickingId(transactionPickingId);
    return {
      success: true,
      message: 'Data transaction scan picking berdasarkan transaction picking berhasil diambil',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction scan picking detail' })
  @ApiParam({ name: 'id', description: 'ID transaction scan picking' })
  @ApiResponse({
    status: 200,
    description: 'Detail transaction scan picking',
    type: ScanPickingTransaction,
  })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return {
      success: true,
      message: 'Detail transaction scan picking berhasil diambil',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction scan picking' })
  @ApiParam({ name: 'id', description: 'ID transaction scan picking' })
  @ApiResponse({
    status: 200,
    description: 'Transaction scan picking berhasil diupdate',
    type: ScanPickingTransaction,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionScanPickingDto,
  ) {
    const result = await this.service.update(id, dto);
    return {
      success: true,
      message: 'Transaction scan picking berhasil diupdate',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction scan picking' })
  @ApiParam({ name: 'id', description: 'ID transaction scan picking' })
  @ApiResponse({
    status: 204,
    description: 'Transaction scan picking berhasil dihapus',
  })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Transaction scan picking berhasil dihapus',
    };
  }
  // inspect transaction scan picking
  @Patch(':id/inspection-approved')
  @ApiOperation({ summary: 'Inspection approved transaction scan picking' })
  @ApiParam({ name: 'id', description: 'ID transaction scan picking' })
  @ApiResponse({
    status: 200,
    description: 'Transaction scan picking berhasil diinspeksi',
    type: ScanPickingTransaction,
  })
  @ApiQuery({ name: 'inspection_by', required: true, type: String })
  async inspectionApproved(@Param('id') id: string, @Query('inspection_by') inspection_by: string) {
    const result = await this.service.inspectionApproved(id, inspection_by);
    return {
      success: true,
      message: 'Transaction scan picking berhasil diinspeksi',
      data: result,
    };
  }

  @Post(':transactionPickingId/:status')
  @ApiOperation({ summary: 'Update many status to PENDING or INSPECTION_APPROVED' })
  @ApiParam({ name: 'transactionPickingId', description: 'ID transaction picking' })
  @ApiParam({ name: 'status', description: 'Status to update', enum: ScanPickingStatus })
  @ApiQuery({ name: 'inspection_by', required: false, type: String, description: 'User yang melakukan inspeksi' })
  @ApiResponse({  type: [ScanPickingTransaction], description: 'Transaction scan picking berhasil diupdate' })
  async updateManyStatusTo(
    @Param('transactionPickingId') transactionPickingId: string,
    @Param('status') status: ScanPickingStatus,
    @Query('inspection_by') inspection_by?: string,
  ) {
    const result = await this.service.updateManyStatusTo(transactionPickingId, status, inspection_by);
    return {
      success: true,
      message: 'Transaction scan picking berhasil diupdate',
      data: result,
    };
  }
}

