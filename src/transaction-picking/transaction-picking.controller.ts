import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionPickingService } from './transaction-picking.service';
import { CreateTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';

@ApiTags('Transaction Picking')
@Controller('transaction-picking')
@ApiBearerAuth('JWT-auth')
export class TransactionPickingController {
  constructor(private readonly service: TransactionPickingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new transaction picking' })
  @ApiResponse({
    status: 201,
    description: 'Transaction picking berhasil dibuat',
    type: PickingTransaction,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - data tidak valid',
  })
  async create(@Body() createTransactionPickingDto: CreateTransactionPickingDto) {
    const result = await this.service.create(createTransactionPickingDto);
    return {
      success: true,
      message: 'Transaction picking berhasil dibuat',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all transaction picking' })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking',
    type: [PickingTransaction],
  })
  async findAll() {
    const result = await this.service.findAll();
    return {
      success: true,
      message: 'Data transaction picking berhasil diambil',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction picking by ID' })
  @ApiParam({ name: 'id', description: 'ID transaction picking' })
  @ApiResponse({
    status: 200,
    description: 'Detail transaction picking',
    type: PickingTransaction,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction picking tidak ditemukan',
  })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return {
      success: true,
      message: 'Detail transaction picking berhasil diambil',
      data: result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transaction picking' })
  @ApiParam({ name: 'id', description: 'ID transaction picking' })
  @ApiResponse({
    status: 200,
    description: 'Transaction picking berhasil diupdate',
    type: PickingTransaction,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - data tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction picking tidak ditemukan',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTransactionPickingDto: UpdateTransactionPickingDto,
  ) {
    const result = await this.service.update(id, updateTransactionPickingDto);
    return {
      success: true,
      message: 'Transaction picking berhasil diupdate',
      data: result,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transaction picking' })
  @ApiParam({ name: 'id', description: 'ID transaction picking' })
  @ApiResponse({
    status: 204,
    description: 'Transaction picking berhasil dihapus',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - tidak dapat menghapus',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction picking tidak ditemukan',
  })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return {
      success: true,
      message: 'Transaction picking berhasil dihapus',
    };
  }

  @Get('memo/:memoId')
  @ApiOperation({ summary: 'Get transaction picking by memo ID' })
  @ApiParam({ name: 'memoId', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking berdasarkan memo',
    type: [PickingTransaction],
  })
  async findByMemoId(@Param('memoId') memoId: string) {
    const result = await this.service.findByMemoId(memoId);
    return {
      success: true,
      message: 'Data transaction picking berdasarkan memo berhasil diambil',
      data: result,
    };
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get transaction picking by status' })
  @ApiParam({ name: 'status', description: 'Status transaction picking' })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking berdasarkan status',
    type: [PickingTransaction],
  })
  async findByStatus(@Param('status') status: string) {
    const result = await this.service.findByStatus(status);
    return {
      success: true,
      message: 'Data transaction picking berdasarkan status berhasil diambil',
      data: result,
    };
  }

  @Get('pallet/:palletId')
  @ApiOperation({ summary: 'Get transaction picking by pallet ID' })
  @ApiParam({ name: 'palletId', description: 'ID pallet' })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking berdasarkan pallet',
    type: [PickingTransaction],
  })
  async findByPalletId(@Param('palletId') palletId: string) {
    const result = await this.service.findByPalletId(palletId);
    return {
      success: true,
      message: 'Data transaction picking berdasarkan pallet berhasil diambil',
      data: result,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update transaction picking status' })
  @ApiParam({ name: 'id', description: 'ID transaction picking' })
  @ApiResponse({
    status: 200,
    description: 'Status transaction picking berhasil diupdate',
    type: PickingTransaction,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - status transition tidak valid',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction picking tidak ditemukan',
  })
  async updateStatus(@Param('id') id: string, @Body('status') status: Status) {
    const result = await this.service.updateStatus(id, status);
    return {
      success: true,
      message: 'Status transaction picking berhasil diupdate',
      data: result,
    };
  }
}
