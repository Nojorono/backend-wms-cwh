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
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OutboundMemoService } from './outbound-memo.service';
import { CreateOutboundMemoDto } from './dto/create-outbound-memo.dto';
import { UpdateOutboundMemoDto } from './dto/update-outbound-memo.dto';
import { OutboundMemoResponseDto } from './dto/outbound-memo-response.dto';
import { OutboundMemoStatus } from '../core/domain/entities/outbound-memo.entity';

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
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OutboundMemoStatus,
    description: 'Filter berdasarkan status',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar outbound memo',
    type: [OutboundMemoResponseDto],
  })
  async findAll(@Query('status') status?: string) {
    if (status) {
      return this.outboundMemoService.findByStatus(status);
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
  async update(
    @Param('id') id: string,
    @Body() updateOutboundMemoDto: UpdateOutboundMemoDto,
  ) {
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
        message: { type: 'string', example: 'Tidak dapat mengubah status dari APPROVED ke PENDING' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OutboundMemoStatus,
  ) {
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
        message: { type: 'string', example: 'Tidak dapat menghapus outbound memo yang sudah APPROVED' },
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
}
