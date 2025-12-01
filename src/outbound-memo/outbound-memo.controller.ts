import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OutboundMemoService } from './outbound-memo.service';
import { CreateOutboundMemoDto } from './dto/create-outbound-memo.dto';
import { UpdateOutboundMemoDto } from './dto/update-outbound-memo.dto';
import { OutboundMemoResponseDto } from './dto/outbound-memo-response.dto';
import { OutboundMemoStatus } from '../core/domain/entities/outbound-memo.entity';
import { OutboundMemoPaginationDto } from './dto/outbound-memo-pagination.dto';
import { ApiFlexiblePaginationQuery } from '../core/decorators/flexible-pagination.decorator';

@ApiTags('Outbound Memo')
@Controller('outbound-memo')
@ApiBearerAuth('JWT-auth')
export class OutboundMemoController {
  constructor(private readonly outboundMemoService: OutboundMemoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat outbound memo baru' })
  @ApiResponse({
    status: 201,
    description: 'Outbound memo berhasil dibuat',
    type: OutboundMemoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Delivery date tidak boleh di masa lalu' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async create(@Body() createOutboundMemoDto: CreateOutboundMemoDto) {
    return this.outboundMemoService.create(createOutboundMemoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Dapatkan semua outbound memo' })
  @ApiFlexiblePaginationQuery([
    {
      name: 'status',
      description: 'Filter outbound memo berdasarkan status',
      enum: Object.values(OutboundMemoStatus),
      example: OutboundMemoStatus.PENDING,
    },
    {
      name: 'has_do',
      description: 'Filter outbound memo berdasarkan apakah sudah memiliki outbound DO',
      example: false,
      type: Boolean,
    },
    {
      name: 'has_transaction_picking',
      description: 'Filter outbound memo yang memiliki transaction picking (true/false)',
      type: Boolean,
      example: true,
    },
  ])
  @ApiResponse({
    status: 200,
    description: 'Daftar outbound memo',
    type: [OutboundMemoResponseDto],
  })
  async findAll(@Query() paginationQuery: OutboundMemoPaginationDto) {
    const hasPaginationParams =
      paginationQuery.page ||
      paginationQuery.limit ||
      paginationQuery.search ||
      paginationQuery.sortBy ||
      paginationQuery.sortOrder ||
      paginationQuery.status ||
      paginationQuery.has_do !== undefined ||
      paginationQuery.type !== undefined ||
      paginationQuery.has_transaction_picking !== undefined;

    if (hasPaginationParams) {
      return this.outboundMemoService.findAllPaginated(paginationQuery);
    }

    if (paginationQuery.status) {
      return this.outboundMemoService.findByStatus(paginationQuery.status);
    }

    return this.outboundMemoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan outbound memo berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Detail outbound memo',
    type: OutboundMemoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound memo tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound memo not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.outboundMemoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update outbound memo' })
  @ApiParam({ name: 'id', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Outbound memo berhasil diupdate',
    type: OutboundMemoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Quantity plan harus lebih dari 0' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound memo tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound memo not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateOutboundMemoDto: UpdateOutboundMemoDto) {
    return this.outboundMemoService.update(id, updateOutboundMemoDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status outbound memo' })
  @ApiParam({ name: 'id', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Status outbound memo berhasil diupdate',
    type: OutboundMemoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Status transition tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Tidak dapat mengubah status dari APPROVED ke PENDING',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async updateStatus(@Param('id') id: string, @Body('status') status: OutboundMemoStatus) {
    return this.outboundMemoService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus outbound memo' })
  @ApiParam({ name: 'id', description: 'ID outbound memo' })
  @ApiResponse({
    status: 204,
    description: 'Outbound memo berhasil dihapus',
  })
  @ApiResponse({
    status: 400,
    description: 'Tidak dapat menghapus outbound memo',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Tidak dapat menghapus outbound memo yang sudah APPROVED',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound memo tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound memo not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.outboundMemoService.remove(id);
  }
  // approved outbound memo
  @Post(':id/approved')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Approved outbound memo' })
  @ApiParam({ name: 'id', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Outbound memo berhasil diapproved',
  })
  async approved(@Param('id') id: string) {
    return this.outboundMemoService.updateStatus(id, OutboundMemoStatus.APPROVED);
  }

  @Post(':id/cancelled')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Batal outbound memo' })
  @ApiParam({ name: 'id', description: 'ID outbound memo' })
  @ApiResponse({
    status: 200,
    description: 'Outbound memo berhasil dibatalkan',
  })
  async rejected(@Param('id') id: string) {
    return this.outboundMemoService.updateStatus(id, OutboundMemoStatus.CANCELLED);
  }
}
