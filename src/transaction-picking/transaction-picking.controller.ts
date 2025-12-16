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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionPickingService } from './transaction-picking.service';
import { CreateTransactionPickingDto, CreateManyTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { PickingTransaction, Status } from '../core/domain/entities/transaction-picking.entity';
import { TransactionPickingPaginationDto } from './dto/transaction-picking-pagination.dto';
import { ApiPaginationQuery } from '../core/decorators/pagination.decorator';

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

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create multiple transaction picking' })
  @ApiResponse({
    status: 201,
    description: 'Transaction picking berhasil dibuat',
    type: [PickingTransaction],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - data tidak valid',
  })
  async createMany(@Body() dto: CreateManyTransactionPickingDto) {
    const result = await this.service.createMany(dto);
    return {
      success: true,
      message: 'Transaction picking berhasil dibuat',
      data: result,
    };
    
  }

  @Get()
  @ApiOperation({ summary: 'Get all transaction picking with pagination' })
  @ApiPaginationQuery()
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Data transaction picking berhasil diambil',
        },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PickingTransaction' },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
            hasNextPage: { type: 'boolean', example: true },
            hasPreviousPage: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async findAll(@Query() paginationQuery: TransactionPickingPaginationDto) {
    const result = await this.service.findAll(paginationQuery);
    return {
      success: true,
      message: 'Data transaction picking berhasil diambil',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get transaction picking by item ID' })
  @ApiParam({ name: 'itemId', description: 'ID item' })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking berdasarkan item',
    type: [PickingTransaction],
  })
  async findByItemId(@Param('itemId') itemId: string) {
    const result = await this.service.findByItemId(itemId);
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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: Status,
    description: 'Filter by status (PENDING, COMPLETED, CANCELLED)',
    example: Status.PENDING,
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar transaction picking berdasarkan memo',
    type: [PickingTransaction],
  })
  async findByMemoId(
    @Param('memoId') memoId: string,
    @Query('status') status?: Status,
  ) {
   return await this.service.findByMemoId(memoId, status);
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
    return await this.service.findByStatus(status);
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
    return await this.service.updateStatus(id, status);
  }

  @Patch(':transactionId/cancel')
  @ApiOperation({ summary: 'Cancel transaction picking' })
  @ApiParam({ name: 'transactionId', description: 'ID transaction picking' })
  @ApiResponse({
    status: 204,
    description: 'Transaction picking berhasil dibatalkan',
  })
  async cancelTransaction(@Param('transactionId') transactionId: string) {
    return await this.service.cancelTransaction(transactionId);
  }
}
