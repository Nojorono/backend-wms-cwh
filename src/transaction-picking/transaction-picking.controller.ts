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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionPickingService } from './transaction-picking.service';
import { CreateTransactionPickingDto, CreateManyTransactionPickingDto } from './dto/create-transaction-picking.dto';
import { UpdateTransactionPickingDto } from './dto/update-transaction-picking.dto';
import { AttachMemoDto } from './dto/attach-memo.dto';
import { AttachDoDto } from './dto/attach-do.dto';
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
    return await this.service.findByMemoId(memoId);
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
  // detach memo from transaction picking
  @Patch('memo/:memoId/detach')
  @ApiOperation({ summary: 'Detach memo from transaction picking' })
  @ApiParam({ name: 'memoId', description: 'ID outbound memo' })
  @ApiResponse({
    status: 204,
    description: 'Memo berhasil dilepas dari transaction picking',
  })
  async detachMemo(@Param('memoId') memoId: string) {
    return await this.service.detachMemo(memoId);
  }
  // detach do from transaction picking
  @Patch('do/:doId/detach')
  @ApiOperation({ summary: 'Detach do from transaction picking' })
  @ApiParam({ name: 'doId', description: 'ID outbound do' })
  @ApiResponse({
    status: 204,
    description: 'Do berhasil dilepas dari transaction picking',
  })
  async detachDo(@Param('doId') doId: string) {
    return await this.service.detachDo(doId);
  }
  // attach memo to transaction picking
  @Patch('memo/:memoId/attach')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Attach memo to transaction picking' })
  @ApiParam({ name: 'memoId', description: 'ID outbound memo' })
  @ApiResponse({
    status: 204,
    description: 'Memo berhasil diattach ke transaction picking',
  })
  async attachMemo(@Param('memoId') memoId: string, @Body() attachMemoDto: AttachMemoDto) {
    return await this.service.attachMemo(attachMemoDto.transactionIds, memoId);
  }
  // attach do to transaction picking
  @Patch('do/:doId/attach')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Attach do to transaction picking' })
  @ApiParam({ name: 'doId', description: 'ID outbound do' })
  @ApiResponse({
    status: 204,
    description: 'Do berhasil diattach ke transaction picking',
  })
  async attachDo(@Param('doId') doId: string, @Body() attachDoDto: AttachDoDto) {
    return await this.service.attachDo(attachDoDto.transactionIds, doId);
  }
}
