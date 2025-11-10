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
import { OutboundDoService } from './outbound-do.service';
import { CreateOutboundDoDto } from './dto/create-outbound-do.dto';
import { UpdateOutboundDoDto } from './dto/update-outbound-do.dto';
import { OutboundDoResponseDto } from './dto/outbound-do-response.dto';
import { OutboundDoStatus, OutboundDoType } from '../core/domain/entities/outbound-do.entity';

@ApiTags('Outbound DO')
@Controller('outbound-do')
@ApiBearerAuth('JWT-auth')
export class OutboundDoController {
  constructor(
    private readonly outboundDoService: OutboundDoService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat outbound DO baru' })
  @ApiResponse({
    status: 201,
    description: 'Outbound DO berhasil dibuat',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Sequence numbers must be unique' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Outbound DO number sudah digunakan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO number sudah digunakan' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  async create(@Body() createOutboundDoDto: CreateOutboundDoDto) {
    return this.outboundDoService.create(createOutboundDoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Dapatkan semua outbound DO' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: OutboundDoStatus,
    description: 'Filter berdasarkan status',
  })
  @ApiQuery({
    name: 'outbound_type',
    required: false,
    enum: OutboundDoType,
    description: 'Filter berdasarkan tipe outbound',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar outbound DO',
    type: [OutboundDoResponseDto],
  })
  async findAll(@Query('status') status?: string, @Query('outbound_type') outbound_type?: string) {
    if (status) {
      return this.outboundDoService.findByStatus(status);
    }
    if (outbound_type) {
      return this.outboundDoService.findByOutboundType(outbound_type);
    }
    return this.outboundDoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Dapatkan outbound DO berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Detail outbound DO',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    return this.outboundDoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Outbound DO berhasil diupdate',
    type: OutboundDoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Data tidak valid',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Format nomor telepon tidak valid' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async update(@Param('id') id: string, @Body() updateOutboundDoDto: UpdateOutboundDoDto) {
    return this.outboundDoService.update(id, updateOutboundDoDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 200,
    description: 'Status outbound DO berhasil diupdate',
    type: OutboundDoResponseDto,
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
          example: 'Tidak dapat mengubah status dari COMPLETED ke PENDING',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async updateStatus(@Param('id') id: string, @Body('status') status: OutboundDoStatus) {
    return this.outboundDoService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus outbound DO' })
  @ApiParam({ name: 'id', description: 'ID outbound DO' })
  @ApiResponse({
    status: 204,
    description: 'Outbound DO berhasil dihapus',
  })
  @ApiResponse({
    status: 400,
    description: 'Tidak dapat menghapus outbound DO',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Tidak dapat menghapus outbound DO yang sudah COMPLETED',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async remove(@Param('id') id: string) {
    return this.outboundDoService.remove(id);
  }

  @Get(':id/memo-sequence')
  @ApiOperation({ summary: 'Dapatkan urutan sequence memo dalam outbound DO (sorted by sequence)' })
  @ApiResponse({
    status: 200,
    description: 'Sequence memo berhasil didapatkan (automatically sorted by sequence number)',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          memoId: { type: 'string', example: 'uuid-memo-1' },
          sequence: { type: 'number', example: 1 },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Outbound DO tidak ditemukan',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Outbound DO not found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async getMemoSequence(@Param('id') id: string) {
    return this.outboundDoService.getMemoSequence(id);
  }
}
